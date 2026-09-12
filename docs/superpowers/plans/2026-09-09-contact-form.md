# Contact Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give visitors a secured way to reach a human — a `/contact` page, a footer link and a floating bubble — with the anti-spam defences living in Postgres rather than in the server action.

**Architecture:** A `contact_messages` table with **no public insert policy**; the only write path is a `security definer` RPC that validates, rate-limits and inserts. The server action calls that RPC with the anon client, then notifies by email. Insert happens *before* the email so a Resend outage cannot lose a message.

**Tech Stack:** Next.js 16 App Router, next-intl 4.x, Supabase (Postgres + RLS), Resend, Tailwind (preset `shared/tailwind-preset.js`), framer-motion (sheet only).

**Spec:** `docs/superpowers/specs/2026-09-09-contact-form-design.md`

## Global Constraints

- **Security rule that drives the whole design:** a limit in the Next.js action is bypassable by calling PostgREST directly with the public anon key. Every defence that counts lives in the database. Precedent: `supabase/migrations/20260903110000_guest_search_rate_limit.sql`.
- **No public `insert` policy** on `contact_messages`. Write only through `public.submit_contact_message(...)`.
- **Rate limits:** 60 messages / 10 minutes globally; 3 messages / hour per email.
- **Never store:** IP, user-agent, cookie, fingerprint. Attempts are keyed by an email hash, never the plain address.
- **Supabase client:** always `@/utils/supabase/server` (ANON key). Never `supabase-admin` on this path.
- **Email:** plain text only, never HTML. No user content interpolated into headers (`subject`, `from`, `reply-to`).
- **Subject enum (exact values):** `avant-achat`, `ma-commande`, `technique`, `sur-mesure`, `autre`.
- **Field bounds:** `name` 1..80, `email` 1..160, `message` 10..2000, `locale` 2..5.
- **i18n:** all 9 locales — `fr, en, de, es, pt, it, ar, zh, ja`. No hardcoded strings in components. Navigation via `@/navigation` helpers only.
- **RTL:** logical utilities only (`text-start`, `ms-`/`me-`, `end-*`). Never `text-left`, `left-*`, `right-*`.
- **z-index map (already in use):** floating header `z-30`, `ScrollToTop` `z-30`, MobileMenu scrim `z-40`, panel `z-50`. The contact sheet reuses 40/50; the bubble stays below the scrim.
- **Sender:** `contact@thestudiopapeteriedigitale.com` (domain Verified on Resend). Same address as `SUPPORT_EMAIL` in the checkout page.
- **Env:** `RESEND_API_KEY` (already in `landing/.env.local`), `CONTACT_NOTIFY_TO` (new, defaults to the sender address when unset).

---

## File Structure

| File | Responsibility |
|---|---|
| `supabase/migrations/20260909120000_contact_messages.sql` | Tables, constraints, RLS, rate-limit function, submit RPC. |
| `landing/src/lib/contact-subjects.ts` | The subject enum, shared by the action, the form and the email. Single source of truth. |
| `landing/src/actions/submit-contact.ts` | Server action: validate, call the RPC, then notify via Resend. |
| `landing/src/components/contact/ContactForm.tsx` | `"use client"` form. Used by both the page and the bubble. |
| `landing/src/components/contact/ContactBubble.tsx` | Floating bubble + sheet wrapper around `ContactForm`. |
| `landing/src/app/[locale]/contact/page.tsx` | Indexable page: heading, form, fallback email. |
| `landing/src/components/home/Footer.tsx` | Add the Contact link to `legalLinks`. |
| `landing/src/app/[locale]/layout.tsx` | Mount `ContactBubble` site-wide (next to `CookieConsent`). |
| `landing/messages/*.json` (×9) | `Contact` namespace + `Footer.contact`. |
| `landing/.env.example` | Document the two variables. |

---

## Task 1: Database — table, RLS, rate limit, submit RPC

**Files:**
- Create: `supabase/migrations/20260909120000_contact_messages.sql`

**Interfaces:**
- Consumes: nothing.
- Produces: `public.submit_contact_message(p_name text, p_email text, p_subject text, p_message text, p_locale text) returns boolean`, executable by `anon`. Returns `true` when stored, `false` when refused (invalid **or** rate-limited — deliberately indistinguishable).

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260909120000_contact_messages.sql`:

```sql
-- Public contact form: message storage plus the anti-spam limits.
--
-- Why everything below lives in the database rather than in the Next.js
-- server action: `NEXT_PUBLIC_SUPABASE_ANON_KEY` is public by definition, and
-- the existing public tables (`rsvp_responses`, `playlist_suggestions`) insert
-- with `check (true)`. A bot therefore never has to touch our page — it can
-- POST straight to PostgREST, where no honeypot, no submit delay and no
-- TypeScript validation is on its path. This is the same defect that was
-- measured and fixed for the guest search in 20260903110000.
--
-- So: no insert policy at all on `contact_messages`. The only write path is
-- `submit_contact_message`, which is security definer and counts EVERY caller,
-- including one we did not write.

create table if not exists public.contact_messages (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  locale text not null,
  status text not null default 'new',
  created_at timestamptz default timezone('utc'::text, now()) not null,

  -- Bounds as table constraints, not only inside the function: a last net if
  -- the function is ever rewritten without re-reading the design doc.
  constraint contact_messages_name_len check (char_length(name) between 1 and 80),
  constraint contact_messages_email_len check (char_length(email) between 1 and 160),
  constraint contact_messages_message_len check (char_length(message) between 10 and 2000),
  constraint contact_messages_locale_len check (char_length(locale) between 2 and 5),
  constraint contact_messages_subject_enum check (
    subject in ('avant-achat', 'ma-commande', 'technique', 'sur-mesure', 'autre')
  ),
  constraint contact_messages_status_enum check (status in ('new', 'handled'))
);

comment on table public.contact_messages is
  'Messages from the public contact form. Written only by '
  'submit_contact_message() — there is deliberately no insert policy. Holds no '
  'IP, no user-agent and no fingerprint: someone asking a pre-sales question '
  'is not a suspect.';

create index if not exists idx_contact_messages_created
  on public.contact_messages(created_at desc);

alter table public.contact_messages enable row level security;

-- No policy whatsoever. `anon` can neither read nor insert; the security
-- definer function bypasses RLS, and the service role reads for triage.

/**
 * Attempt log, used only to enforce the rate limits.
 *
 * Keyed by a hash of the email, never the address itself: this is a
 * throwaway counter, so keeping readable addresses in it would mean storing
 * personal data for no purpose. md5 is deliberate — there is nothing
 * cryptographic to protect here, we only need to group attempts, and it
 * avoids depending on pgcrypto's schema placement.
 */
create table if not exists public.contact_attempts (
  id bigint generated by default as identity primary key,
  email_hash text not null,
  attempted_at timestamptz default timezone('utc'::text, now()) not null
);

comment on table public.contact_attempts is
  'One row per accepted contact submission, for rate limiting only. No IP, no '
  'message content, and the email only as an md5 hash.';

create index if not exists idx_contact_attempts_window
  on public.contact_attempts(attempted_at desc);
create index if not exists idx_contact_attempts_email
  on public.contact_attempts(email_hash, attempted_at desc);

alter table public.contact_attempts enable row level security;
-- No policy: only the security definer function touches this table. An
-- anonymous caller must not be able to read the log or clear it by deleting.

/**
 * The rate limits, split out so they can be reasoned about alone.
 *
 * Two windows, because they stop different things:
 *   - 60 per 10 minutes globally caps a flood even when it is spread over
 *     thousands of IPs, which a per-IP limit cannot do;
 *   - 3 per hour per email stops a bot hammering under one identity without
 *     penalising everybody else.
 *
 * The global window is a shared ceiling, so under attack a real visitor can be
 * refused for a few minutes. That is the price of storing no IP; the contact
 * page always shows the email address in clear as a way through.
 *
 * Returns true when the call is allowed. Does NOT record — the caller records
 * only once the insert succeeded.
 */
create or replace function public.check_contact_rate(p_email_hash text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_global int;
  v_email int;
begin
  select count(*) into v_global
  from public.contact_attempts
  where attempted_at > now() - interval '10 minutes';

  if v_global >= 60 then
    return false;
  end if;

  select count(*) into v_email
  from public.contact_attempts
  where email_hash = p_email_hash
    and attempted_at > now() - interval '1 hour';

  if v_email >= 3 then
    return false;
  end if;

  return true;
end;
$$;

revoke all on function public.check_contact_rate(text) from public;
-- Not granted to anon: only submit_contact_message calls it, and that one is
-- security definer so it runs with the owner's rights.

/**
 * The only way to write a contact message.
 *
 * Validation is duplicated from the TypeScript action on purpose: the
 * TypeScript is not on the path of a caller who talks to PostgREST directly.
 *
 * Returns a bare boolean, so a refusal never says WHICH bound was hit or
 * whether the limit or the validation rejected it. An attacker learns nothing.
 */
create or replace function public.submit_contact_message(
  p_name text,
  p_email text,
  p_subject text,
  p_message text,
  p_locale text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := trim(coalesce(p_name, ''));
  v_email text := lower(trim(coalesce(p_email, '')));
  v_message text := trim(coalesce(p_message, ''));
  v_locale text := trim(coalesce(p_locale, ''));
  v_hash text;
begin
  if char_length(v_name) < 1 or char_length(v_name) > 80 then
    return false;
  end if;

  if char_length(v_email) < 3 or char_length(v_email) > 160
     or v_email !~ '^[^@[:space:]]+@[^@[:space:].]+\.[a-z]{2,}$' then
    return false;
  end if;

  if p_subject is null or p_subject not in
     ('avant-achat', 'ma-commande', 'technique', 'sur-mesure', 'autre') then
    return false;
  end if;

  if char_length(v_message) < 10 or char_length(v_message) > 2000 then
    return false;
  end if;

  if char_length(v_locale) < 2 or char_length(v_locale) > 5 then
    return false;
  end if;

  v_hash := md5(v_email);

  if not public.check_contact_rate(v_hash) then
    return false;
  end if;

  insert into public.contact_messages (name, email, subject, message, locale)
  values (v_name, v_email, p_subject, v_message, v_locale);

  insert into public.contact_attempts (email_hash) values (v_hash);

  -- Opportunistic cleanup on roughly one call in twenty, so the log cannot
  -- grow without bound and no cron job is needed. Cheap thanks to the index.
  if random() < 0.05 then
    delete from public.contact_attempts
    where attempted_at < now() - interval '2 hours';
  end if;

  return true;
end;
$$;

revoke all on function public.submit_contact_message(text, text, text, text, text) from public;
grant execute on function public.submit_contact_message(text, text, text, text, text) to anon;

comment on function public.submit_contact_message(text, text, text, text, text) is
  'Security-definer RPC backing the public contact form: the only path by '
  'which an anonymous visitor can write a contact message. Validates and '
  'bounds every field, enforces 60 submissions per 10 minutes globally and 3 '
  'per hour per email, and returns a bare boolean so a refusal reveals '
  'nothing. Do not add an insert policy to contact_messages — see the header '
  'of this migration for why.';
```

- [ ] **Step 2: Apply the migration and verify it loads**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie
npx supabase db reset
```

Expected: completes without error, and the new migration is listed.

If `db reset` is undesirable on this machine, apply just this file:
```bash
npx supabase db push
```

- [ ] **Step 3: Verify a direct insert with the anon key is REFUSED**

This is the test that validates the entire design. Get the anon key from
`landing/.env.local` (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) and the URL
(`NEXT_PUBLIC_SUPABASE_URL`), then:

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie/landing
set -a; . ./.env.local; set +a
curl -s -o /dev/null -w "direct insert -> HTTP %{http_code}\n" \
  -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/contact_messages" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"bot","email":"bot@example.com","subject":"autre","message":"spam spam spam","locale":"fr"}'
```

Expected: **401 or 403** (never 201). A 201 means an insert policy leaked in —
stop and fix before continuing.

Also verify reading is refused:
```bash
curl -s -w "\ndirect select -> HTTP %{http_code}\n" \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/contact_messages?select=email" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY"
```
Expected: an empty array `[]` or a 401/403 — never message rows.

- [ ] **Step 4: Verify the RPC accepts a valid message**

```bash
curl -s -w "\nrpc valid -> HTTP %{http_code}\n" \
  -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/submit_contact_message" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"p_name":"Alba","p_email":"alba@example.com","p_subject":"avant-achat","p_message":"Bonjour, une question sur les langues.","p_locale":"fr"}'
```

Expected: `true`.

- [ ] **Step 5: Verify validation and the per-email limit refuse**

Bad subject (must be `false`):
```bash
curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/submit_contact_message" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"p_name":"x","p_email":"a@b.co","p_subject":"nope","p_message":"long enough message","p_locale":"fr"}'
echo
```
Expected: `false`.

Per-email limit — the 4th call with the same address must be `false`:
```bash
for i in 1 2 3 4; do
  curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/submit_contact_message" \
    -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{"p_name":"Flood","p_email":"flood@example.com","p_subject":"autre","p_message":"repeated message body","p_locale":"fr"}'
  echo " <- attempt $i"
done
```
Expected: `true true true false`.

- [ ] **Step 6: Commit**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie
git add supabase/migrations/20260909120000_contact_messages.sql
git commit -m "feat(db): contact messages with in-database rate limiting

No insert policy on the table: the anon key is public and the action's
validation is bypassable via PostgREST, so the only write path is a security
definer RPC that validates, bounds and rate-limits every caller."
```

---

## Task 2: Subject enum shared module

**Files:**
- Create: `landing/src/lib/contact-subjects.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `CONTACT_SUBJECTS: readonly ["avant-achat","ma-commande","technique","sur-mesure","autre"]`, type `ContactSubject`, and `isContactSubject(value: unknown): value is ContactSubject`.

- [ ] **Step 1: Write the module**

Create `landing/src/lib/contact-subjects.ts`:

```ts
/**
 * The contact form's subject list, in one place.
 *
 * Three consumers have to agree on these exact strings: the `<select>`, the
 * server action's validation, and the `subject` check constraint in
 * 20260909120000_contact_messages.sql. A free-text subject was rejected on
 * purpose — a constrained list is what makes the inbox triageable at a glance.
 *
 * Adding a value means editing this array, the SQL constraint AND the nine
 * locale files. The label lives in `Contact.subjects.<value>`, never here.
 */
export const CONTACT_SUBJECTS = [
  "avant-achat",
  "ma-commande",
  "technique",
  "sur-mesure",
  "autre",
] as const;

export type ContactSubject = (typeof CONTACT_SUBJECTS)[number];

export function isContactSubject(value: unknown): value is ContactSubject {
  return (
    typeof value === "string" &&
    (CONTACT_SUBJECTS as readonly string[]).includes(value)
  );
}
```

- [ ] **Step 2: Verify it typechecks**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie/landing
npx tsc --noEmit -p tsconfig.json
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add landing/src/lib/contact-subjects.ts
git commit -m "feat(landing): shared contact subject enum"
```

---

## Task 3: Install Resend and document the env vars

**Files:**
- Modify: `landing/package.json`
- Modify: `landing/.env.example`

**Interfaces:**
- Consumes: nothing.
- Produces: the `resend` package importable from the landing workspace; `CONTACT_NOTIFY_TO` documented.

- [ ] **Step 1: Install the dependency**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie
npm install resend -w landing
```

- [ ] **Step 2: Document the variables**

Append to `landing/.env.example`:

```
# Contact form notifications. The domain thestudiopapeteriedigitale.com is
# already Verified on Resend; this is only the API key.
RESEND_API_KEY=
# Where contact messages are announced. Defaults to the sender address when
# left empty.
CONTACT_NOTIFY_TO=
```

- [ ] **Step 3: Verify the key is present locally**

```bash
cd landing
grep -q "^RESEND_API_KEY=re_" .env.local && echo "key present" || echo "MISSING KEY"
```
Expected: `key present`.

- [ ] **Step 4: Commit**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie
git add landing/package.json landing/.env.example package-lock.json
git commit -m "chore(landing): add resend, document contact env vars"
```

---

## Task 4: Server action

**Files:**
- Create: `landing/src/actions/submit-contact.ts`

**Interfaces:**
- Consumes: `submit_contact_message` RPC (Task 1); `CONTACT_SUBJECTS`, `isContactSubject` (Task 2); `resend` (Task 3); `createClient` from `@/utils/supabase/server`.
- Produces: `submitContact(input: ContactInput): Promise<ContactResult>` where
  `ContactInput = { name: string; email: string; subject: string; message: string; locale: string; honeypot?: string; elapsedMs?: number }`
  and `ContactResult = { ok: true } | { ok: false; reason: "invalid" | "rate_limited" | "error" }`.

- [ ] **Step 1: Write the action**

Create `landing/src/actions/submit-contact.ts`:

```ts
"use server";

import { Resend } from "resend";

import { isContactSubject } from "@/lib/contact-subjects";
import { createClient } from "@/utils/supabase/server";

/**
 * Public contact form submission.
 *
 * ── Where the security actually is ──────────────────────────────────────────
 * Not here. `NEXT_PUBLIC_SUPABASE_ANON_KEY` is public, so a bot can call
 * PostgREST directly and never execute a line of this file — the same defect
 * that made the guest list enumerable before 20260903110000. The real
 * defences (field bounds, subject enum, 60/10min global and 3/hour per email)
 * live inside `submit_contact_message`, which counts every caller.
 *
 * What this file adds is a better experience for the honest visitor, plus two
 * cheap filters for naive bots. Neither is load-bearing.
 *
 * ── Why the anon client ─────────────────────────────────────────────────────
 * Same reasoning as `invitation-submissions.ts`: the SERVICE_ROLE client would
 * switch RLS off and make the database's own rules irrelevant. The RPC is
 * granted to `anon` precisely so this path needs no elevation.
 *
 * ── Why the insert comes before the email ───────────────────────────────────
 * If Resend is down, out of quota or misconfigured, the message is already
 * stored and the visitor is told it went through — which is true. Losing a
 * customer's message because a third party had a bad day is the one failure
 * mode worth engineering against here.
 */

export type ContactInput = {
  name: string;
  email: string;
  subject: string;
  message: string;
  locale: string;
  /** Hidden field. A human never fills it; a naive bot fills everything. */
  honeypot?: string;
  /** Time between the form rendering and submission. Bots post instantly. */
  elapsedMs?: number;
};

export type ContactResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "rate_limited" | "error" };

const NOTIFY_FROM = "contact@thestudiopapeteriedigitale.com";
const MIN_ELAPSED_MS = 2000;

const SUBJECT_PREFIX: Record<string, string> = {
  "avant-achat": "Avant-achat",
  "ma-commande": "Ma commande",
  technique: "Technique",
  "sur-mesure": "Sur-mesure",
  autre: "Autre",
};

export async function submitContact(
  input: ContactInput,
): Promise<ContactResult> {
  // Naive-bot filters. Answering "invalid" rather than admitting they were
  // detected keeps the two indistinguishable from a real validation failure.
  if (input.honeypot && input.honeypot.trim() !== "") {
    return { ok: false, reason: "invalid" };
  }
  if (typeof input.elapsedMs === "number" && input.elapsedMs < MIN_ELAPSED_MS) {
    return { ok: false, reason: "invalid" };
  }

  const name = (input.name ?? "").trim();
  const email = (input.email ?? "").trim().toLowerCase();
  const message = (input.message ?? "").trim();
  const locale = (input.locale ?? "").trim();

  // Mirrors the SQL bounds so the visitor gets a useful message instead of a
  // bare refusal. The SQL copy is the one that actually protects the table.
  if (
    name.length < 1 ||
    name.length > 80 ||
    email.length < 3 ||
    email.length > 160 ||
    !/^[^@\s]+@[^@\s.]+\.[a-z]{2,}$/i.test(email) ||
    !isContactSubject(input.subject) ||
    message.length < 10 ||
    message.length > 2000 ||
    locale.length < 2 ||
    locale.length > 5
  ) {
    return { ok: false, reason: "invalid" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_contact_message", {
    p_name: name,
    p_email: email,
    p_subject: input.subject,
    p_message: message,
    p_locale: locale,
  });

  if (error) {
    console.error("[contact] rpc failed", error.message);
    return { ok: false, reason: "error" };
  }

  // The RPC returns a bare boolean and deliberately does not distinguish a
  // rate limit from a validation refusal. Since the fields were already
  // checked above, a false here is in practice the rate limit — which is the
  // more useful thing to tell the visitor.
  if (data !== true) {
    return { ok: false, reason: "rate_limited" };
  }

  await notify({ name, email, subject: input.subject, message, locale });

  return { ok: true };
}

/**
 * Announce the message by email. Never throws: the message is already stored,
 * so a notification failure must not turn a success into an error.
 *
 * Plain text, never HTML — the body is written by a stranger, and an HTML mail
 * would turn `<script>` or a forged layout into an injection surface in the
 * recipient's client. Nothing from the visitor reaches a header either: the
 * subject is built from the enum, and `replyTo` is the address that was
 * already validated against a strict pattern above.
 */
async function notify(payload: {
  name: string;
  email: string;
  subject: string;
  message: string;
  locale: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[contact] RESEND_API_KEY unset — message stored, not sent");
    return;
  }

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: `The Studio <${NOTIFY_FROM}>`,
      to: process.env.CONTACT_NOTIFY_TO || NOTIFY_FROM,
      replyTo: payload.email,
      subject: `[Contact – ${SUBJECT_PREFIX[payload.subject]}] ${payload.name}`,
      text: [
        `Nom     : ${payload.name}`,
        `Email   : ${payload.email}`,
        `Sujet   : ${payload.subject}`,
        `Langue  : ${payload.locale}`,
        "",
        "Message :",
        payload.message,
      ].join("\n"),
    });
  } catch (err) {
    console.error("[contact] notification failed", err);
  }
}
```

- [ ] **Step 2: Verify it typechecks**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie/landing
npx tsc --noEmit -p tsconfig.json
```
Expected: no output. If Supabase generated types complain about the unknown
RPC name, that is expected — `shared/types/supabase.ts` predates this
migration. Regenerate with the command in `CLAUDE.md` if a local Supabase is
running, otherwise leave it; the call is correct at runtime.

- [ ] **Step 3: Commit**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie
git add landing/src/actions/submit-contact.ts
git commit -m "feat(landing): contact server action

Stores through the security definer RPC, then notifies. Insert first so a
Resend outage cannot lose a customer's message; plain-text mail only, with no
visitor content in any header."
```

---

## Task 5: Translations for all nine locales

**Files:**
- Modify: `landing/messages/fr.json`, `en.json`, `de.json`, `es.json`, `pt.json`, `it.json`, `ar.json`, `zh.json`, `ja.json`

**Interfaces:**
- Consumes: nothing.
- Produces: namespace `Contact` with keys `metaTitle, metaDescription, title, subtitle, nameLabel, emailLabel, subjectLabel, messageLabel, submit, sending, successTitle, successBody, errorInvalid, errorRateLimited, errorGeneric, fallbackIntro, bubbleAriaLabel, closeAriaLabel, subjects.{avant-achat,ma-commande,technique,sur-mesure,autre}`; plus `Footer.contact`.

- [ ] **Step 1: Add the French namespace**

In `landing/messages/fr.json`, add a top-level `"Contact"` key (place it
alphabetically near the other sections) and add `"contact"` inside the
existing `"Footer"` object:

```json
  "Contact": {
    "metaTitle": "Contact",
    "metaDescription": "Une question sur nos faire-part de mariage digitaux ? Écrivez-nous, nous répondons sous 24 à 48 heures.",
    "title": "Une question ?",
    "subtitle": "Écrivez-nous, nous vous répondons sous 24 à 48 heures.",
    "nameLabel": "Votre nom",
    "emailLabel": "Votre email",
    "subjectLabel": "Sujet",
    "messageLabel": "Votre message",
    "submit": "Envoyer",
    "sending": "Envoi…",
    "successTitle": "Message envoyé",
    "successBody": "Merci, nous vous répondons sous 24 à 48 heures.",
    "errorInvalid": "Merci de vérifier les champs du formulaire.",
    "errorRateLimited": "Trop de messages envoyés récemment. Réessayez dans quelques minutes ou écrivez-nous directement.",
    "errorGeneric": "L'envoi a échoué. Écrivez-nous directement à l'adresse ci-dessous.",
    "fallbackIntro": "Vous pouvez aussi nous écrire à",
    "bubbleAriaLabel": "Nous contacter",
    "closeAriaLabel": "Fermer",
    "subjects": {
      "avant-achat": "Question avant achat",
      "ma-commande": "Ma commande",
      "technique": "Problème technique",
      "sur-mesure": "Demande sur-mesure",
      "autre": "Autre"
    }
  },
```

And inside `"Footer"`: `"contact": "Contact",`

- [ ] **Step 2: Add the same namespace to the eight other locales**

Translate every value. Reference translations to use verbatim:

**en.json**
```json
  "Contact": {
    "metaTitle": "Contact",
    "metaDescription": "A question about our digital wedding invitations? Write to us — we reply within 24 to 48 hours.",
    "title": "A question?",
    "subtitle": "Write to us and we'll reply within 24 to 48 hours.",
    "nameLabel": "Your name",
    "emailLabel": "Your email",
    "subjectLabel": "Subject",
    "messageLabel": "Your message",
    "submit": "Send",
    "sending": "Sending…",
    "successTitle": "Message sent",
    "successBody": "Thank you — we'll reply within 24 to 48 hours.",
    "errorInvalid": "Please check the form fields.",
    "errorRateLimited": "Too many messages sent recently. Try again in a few minutes or write to us directly.",
    "errorGeneric": "Sending failed. Please write to us directly at the address below.",
    "fallbackIntro": "You can also write to us at",
    "bubbleAriaLabel": "Contact us",
    "closeAriaLabel": "Close",
    "subjects": {
      "avant-achat": "Pre-purchase question",
      "ma-commande": "My order",
      "technique": "Technical problem",
      "sur-mesure": "Bespoke request",
      "autre": "Other"
    }
  },
```
`Footer.contact`: `"Contact"`

**de.json**
```json
  "Contact": {
    "metaTitle": "Kontakt",
    "metaDescription": "Eine Frage zu unseren digitalen Hochzeitseinladungen? Schreiben Sie uns — wir antworten innerhalb von 24 bis 48 Stunden.",
    "title": "Eine Frage?",
    "subtitle": "Schreiben Sie uns, wir antworten innerhalb von 24 bis 48 Stunden.",
    "nameLabel": "Ihr Name",
    "emailLabel": "Ihre E-Mail",
    "subjectLabel": "Betreff",
    "messageLabel": "Ihre Nachricht",
    "submit": "Senden",
    "sending": "Wird gesendet…",
    "successTitle": "Nachricht gesendet",
    "successBody": "Vielen Dank — wir antworten innerhalb von 24 bis 48 Stunden.",
    "errorInvalid": "Bitte überprüfen Sie die Formularfelder.",
    "errorRateLimited": "Zu viele Nachrichten in kurzer Zeit. Versuchen Sie es in einigen Minuten erneut oder schreiben Sie uns direkt.",
    "errorGeneric": "Das Senden ist fehlgeschlagen. Schreiben Sie uns direkt an die untenstehende Adresse.",
    "fallbackIntro": "Sie können uns auch schreiben an",
    "bubbleAriaLabel": "Kontaktieren Sie uns",
    "closeAriaLabel": "Schließen",
    "subjects": {
      "avant-achat": "Frage vor dem Kauf",
      "ma-commande": "Meine Bestellung",
      "technique": "Technisches Problem",
      "sur-mesure": "Individuelle Anfrage",
      "autre": "Sonstiges"
    }
  },
```
`Footer.contact`: `"Kontakt"`

**es.json**
```json
  "Contact": {
    "metaTitle": "Contacto",
    "metaDescription": "¿Tiene alguna pregunta sobre nuestras invitaciones de boda digitales? Escríbanos, respondemos en 24 a 48 horas.",
    "title": "¿Alguna pregunta?",
    "subtitle": "Escríbanos y le responderemos en 24 a 48 horas.",
    "nameLabel": "Su nombre",
    "emailLabel": "Su correo electrónico",
    "subjectLabel": "Asunto",
    "messageLabel": "Su mensaje",
    "submit": "Enviar",
    "sending": "Enviando…",
    "successTitle": "Mensaje enviado",
    "successBody": "Gracias, le responderemos en 24 a 48 horas.",
    "errorInvalid": "Compruebe los campos del formulario.",
    "errorRateLimited": "Demasiados mensajes enviados recientemente. Inténtelo de nuevo en unos minutos o escríbanos directamente.",
    "errorGeneric": "El envío ha fallado. Escríbanos directamente a la dirección indicada abajo.",
    "fallbackIntro": "También puede escribirnos a",
    "bubbleAriaLabel": "Contáctenos",
    "closeAriaLabel": "Cerrar",
    "subjects": {
      "avant-achat": "Pregunta antes de comprar",
      "ma-commande": "Mi pedido",
      "technique": "Problema técnico",
      "sur-mesure": "Solicitud personalizada",
      "autre": "Otro"
    }
  },
```
`Footer.contact`: `"Contacto"`

**pt.json**
```json
  "Contact": {
    "metaTitle": "Contacto",
    "metaDescription": "Tem alguma questão sobre os nossos convites de casamento digitais? Escreva-nos, respondemos em 24 a 48 horas.",
    "title": "Alguma questão?",
    "subtitle": "Escreva-nos e responderemos em 24 a 48 horas.",
    "nameLabel": "O seu nome",
    "emailLabel": "O seu email",
    "subjectLabel": "Assunto",
    "messageLabel": "A sua mensagem",
    "submit": "Enviar",
    "sending": "A enviar…",
    "successTitle": "Mensagem enviada",
    "successBody": "Obrigado, responderemos em 24 a 48 horas.",
    "errorInvalid": "Verifique os campos do formulário.",
    "errorRateLimited": "Demasiadas mensagens enviadas recentemente. Tente novamente dentro de alguns minutos ou escreva-nos diretamente.",
    "errorGeneric": "O envio falhou. Escreva-nos diretamente para o endereço abaixo.",
    "fallbackIntro": "Também nos pode escrever para",
    "bubbleAriaLabel": "Contacte-nos",
    "closeAriaLabel": "Fechar",
    "subjects": {
      "avant-achat": "Questão antes da compra",
      "ma-commande": "A minha encomenda",
      "technique": "Problema técnico",
      "sur-mesure": "Pedido personalizado",
      "autre": "Outro"
    }
  },
```
`Footer.contact`: `"Contacto"`

**it.json**
```json
  "Contact": {
    "metaTitle": "Contatti",
    "metaDescription": "Una domanda sui nostri inviti di nozze digitali? Scriveteci, rispondiamo entro 24-48 ore.",
    "title": "Una domanda?",
    "subtitle": "Scriveteci e vi risponderemo entro 24-48 ore.",
    "nameLabel": "Il vostro nome",
    "emailLabel": "La vostra email",
    "subjectLabel": "Oggetto",
    "messageLabel": "Il vostro messaggio",
    "submit": "Invia",
    "sending": "Invio…",
    "successTitle": "Messaggio inviato",
    "successBody": "Grazie, vi risponderemo entro 24-48 ore.",
    "errorInvalid": "Controllate i campi del modulo.",
    "errorRateLimited": "Troppi messaggi inviati di recente. Riprovate tra qualche minuto o scriveteci direttamente.",
    "errorGeneric": "Invio non riuscito. Scriveteci direttamente all'indirizzo indicato sotto.",
    "fallbackIntro": "Potete anche scriverci a",
    "bubbleAriaLabel": "Contattaci",
    "closeAriaLabel": "Chiudi",
    "subjects": {
      "avant-achat": "Domanda prima dell'acquisto",
      "ma-commande": "Il mio ordine",
      "technique": "Problema tecnico",
      "sur-mesure": "Richiesta su misura",
      "autre": "Altro"
    }
  },
```
`Footer.contact`: `"Contatti"`

**ar.json**
```json
  "Contact": {
    "metaTitle": "اتصل بنا",
    "metaDescription": "هل لديك سؤال عن دعوات الزفاف الرقمية؟ اكتب إلينا، نرد خلال 24 إلى 48 ساعة.",
    "title": "هل لديك سؤال؟",
    "subtitle": "اكتب إلينا وسنرد خلال 24 إلى 48 ساعة.",
    "nameLabel": "الاسم",
    "emailLabel": "البريد الإلكتروني",
    "subjectLabel": "الموضوع",
    "messageLabel": "رسالتك",
    "submit": "إرسال",
    "sending": "جارٍ الإرسال…",
    "successTitle": "تم إرسال الرسالة",
    "successBody": "شكرًا لك، سنرد خلال 24 إلى 48 ساعة.",
    "errorInvalid": "يرجى التحقق من حقول النموذج.",
    "errorRateLimited": "تم إرسال عدد كبير من الرسائل مؤخرًا. حاول مرة أخرى بعد بضع دقائق أو اكتب إلينا مباشرة.",
    "errorGeneric": "فشل الإرسال. اكتب إلينا مباشرة على العنوان أدناه.",
    "fallbackIntro": "يمكنك أيضًا الكتابة إلينا على",
    "bubbleAriaLabel": "اتصل بنا",
    "closeAriaLabel": "إغلاق",
    "subjects": {
      "avant-achat": "سؤال قبل الشراء",
      "ma-commande": "طلبي",
      "technique": "مشكلة تقنية",
      "sur-mesure": "طلب مخصص",
      "autre": "أخرى"
    }
  },
```
`Footer.contact`: `"اتصل بنا"`

**zh.json**
```json
  "Contact": {
    "metaTitle": "联系我们",
    "metaDescription": "对我们的电子婚礼请柬有疑问？请写信给我们，我们会在 24 至 48 小时内回复。",
    "title": "有疑问吗？",
    "subtitle": "请写信给我们，我们会在 24 至 48 小时内回复。",
    "nameLabel": "您的姓名",
    "emailLabel": "您的邮箱",
    "subjectLabel": "主题",
    "messageLabel": "您的留言",
    "submit": "发送",
    "sending": "发送中…",
    "successTitle": "留言已发送",
    "successBody": "谢谢，我们会在 24 至 48 小时内回复。",
    "errorInvalid": "请检查表单内容。",
    "errorRateLimited": "近期发送的留言过多。请几分钟后再试，或直接写信给我们。",
    "errorGeneric": "发送失败。请直接写信至下方邮箱。",
    "fallbackIntro": "您也可以写信至",
    "bubbleAriaLabel": "联系我们",
    "closeAriaLabel": "关闭",
    "subjects": {
      "avant-achat": "购买前咨询",
      "ma-commande": "我的订单",
      "technique": "技术问题",
      "sur-mesure": "定制需求",
      "autre": "其他"
    }
  },
```
`Footer.contact`: `"联系我们"`

**ja.json**
```json
  "Contact": {
    "metaTitle": "お問い合わせ",
    "metaDescription": "デジタル結婚式招待状についてご質問がありますか？24〜48時間以内にご返信いたします。",
    "title": "ご質問はありますか？",
    "subtitle": "ご連絡いただければ、24〜48時間以内にご返信いたします。",
    "nameLabel": "お名前",
    "emailLabel": "メールアドレス",
    "subjectLabel": "件名",
    "messageLabel": "メッセージ",
    "submit": "送信",
    "sending": "送信中…",
    "successTitle": "送信しました",
    "successBody": "ありがとうございます。24〜48時間以内にご返信いたします。",
    "errorInvalid": "入力内容をご確認ください。",
    "errorRateLimited": "短時間に送信が集中しています。数分後に再度お試しいただくか、直接メールをお送りください。",
    "errorGeneric": "送信に失敗しました。下記のアドレスに直接ご連絡ください。",
    "fallbackIntro": "こちらへ直接ご連絡いただくこともできます",
    "bubbleAriaLabel": "お問い合わせ",
    "closeAriaLabel": "閉じる",
    "subjects": {
      "avant-achat": "購入前のご質問",
      "ma-commande": "ご注文について",
      "technique": "技術的な問題",
      "sur-mesure": "オーダーメイドのご相談",
      "autre": "その他"
    }
  },
```
`Footer.contact`: `"お問い合わせ"`

- [ ] **Step 3: Verify every locale parses and is complete**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie/landing
node -e '
const fs=require("fs");
const keys=["metaTitle","metaDescription","title","subtitle","nameLabel","emailLabel","subjectLabel","messageLabel","submit","sending","successTitle","successBody","errorInvalid","errorRateLimited","errorGeneric","fallbackIntro","bubbleAriaLabel","closeAriaLabel"];
const subs=["avant-achat","ma-commande","technique","sur-mesure","autre"];
let bad=0;
for(const l of ["fr","en","de","es","pt","it","ar","zh","ja"]){
  const j=JSON.parse(fs.readFileSync("messages/"+l+".json","utf8"));
  const c=j.Contact||{};
  const miss=keys.filter(k=>!c[k]).concat(subs.filter(s=>!(c.subjects||{})[s]).map(s=>"subjects."+s));
  if(!j.Footer||!j.Footer.contact) miss.push("Footer.contact");
  console.log(l, miss.length?("MISSING: "+miss.join(", ")):"ok");
  if(miss.length) bad++;
}
process.exit(bad?1:0);
'
```
Expected: `ok` for all nine, exit 0.

- [ ] **Step 4: Commit**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie
git add landing/messages/
git commit -m "feat(landing): contact form copy in all nine locales"
```

---

## Task 6: ContactForm component

**Files:**
- Create: `landing/src/components/contact/ContactForm.tsx`

**Interfaces:**
- Consumes: `submitContact`, `ContactResult` (Task 4); `CONTACT_SUBJECTS` (Task 2); `Contact` namespace (Task 5).
- Produces: `<ContactForm onSuccess?: () => void />` — a client component rendering the whole form and its own success/error state.

- [ ] **Step 1: Write the component**

Create `landing/src/components/contact/ContactForm.tsx`:

```tsx
"use client";

import { useTranslations, useLocale } from "next-intl";
import { useRef, useState } from "react";

import { Button } from "@shared/components/ui/button";

import { submitContact } from "@/actions/submit-contact";
import { CONTACT_SUBJECTS } from "@/lib/contact-subjects";

const SUPPORT_EMAIL = "contact@thestudiopapeteriedigitale.com";

/**
 * The contact form, shared by `/contact` and the floating bubble.
 *
 * Only logical direction utilities (`text-start`, `ms-`/`me-`) are used: this
 * renders in Arabic too, and a hardcoded `text-left` would strand the labels
 * on the wrong side.
 *
 * The honeypot and the elapsed-time check are not the security of this
 * feature — they filter naive bots and nothing more. What actually protects
 * the table is `submit_contact_message`, which every caller goes through
 * including one that never loads this page.
 */
export function ContactForm({ onSuccess }: { onSuccess?: () => void }) {
  const t = useTranslations("Contact");
  const locale = useLocale();

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Set on first render, so a bot posting the instant the DOM exists is
  // measurably faster than any human filling four fields.
  const mountedAt = useRef(Date.now());

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;

    const form = new FormData(event.currentTarget);
    setSending(true);
    setError(null);

    const result = await submitContact({
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      subject: String(form.get("subject") ?? ""),
      message: String(form.get("message") ?? ""),
      locale,
      honeypot: String(form.get("company") ?? ""),
      elapsedMs: Date.now() - mountedAt.current,
    });

    setSending(false);

    if (result.ok) {
      setSent(true);
      onSuccess?.();
      return;
    }

    setError(
      result.reason === "rate_limited"
        ? t("errorRateLimited")
        : result.reason === "invalid"
          ? t("errorInvalid")
          : t("errorGeneric"),
    );
  }

  if (sent) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-studio-lavande/40 bg-white p-6 text-center"
      >
        <p className="font-heading text-xl text-studio-violet">
          {t("successTitle")}
        </p>
        <p className="mt-2 font-body text-sm text-studio-violet/70">
          {t("successBody")}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-start">
      <label className="flex flex-col gap-1.5">
        <span className="font-body text-h5 uppercase tracking-luxe text-studio-violet/60">
          {t("nameLabel")}
        </span>
        <input
          name="name"
          type="text"
          required
          maxLength={80}
          autoComplete="name"
          className="rounded-xl border border-studio-lavande/50 bg-white px-4 py-3 font-body text-sm text-studio-violet outline-none focus:border-studio-violet"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-body text-h5 uppercase tracking-luxe text-studio-violet/60">
          {t("emailLabel")}
        </span>
        <input
          name="email"
          type="email"
          required
          maxLength={160}
          autoComplete="email"
          className="rounded-xl border border-studio-lavande/50 bg-white px-4 py-3 font-body text-sm text-studio-violet outline-none focus:border-studio-violet"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-body text-h5 uppercase tracking-luxe text-studio-violet/60">
          {t("subjectLabel")}
        </span>
        <select
          name="subject"
          required
          defaultValue={CONTACT_SUBJECTS[0]}
          className="rounded-xl border border-studio-lavande/50 bg-white px-4 py-3 font-body text-sm text-studio-violet outline-none focus:border-studio-violet"
        >
          {CONTACT_SUBJECTS.map((value) => (
            <option key={value} value={value}>
              {t(`subjects.${value}`)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-body text-h5 uppercase tracking-luxe text-studio-violet/60">
          {t("messageLabel")}
        </span>
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={2000}
          rows={5}
          className="resize-y rounded-xl border border-studio-lavande/50 bg-white px-4 py-3 font-body text-sm text-studio-violet outline-none focus:border-studio-violet"
        />
      </label>

      {/* Honeypot. Hidden from sight and from assistive tech, and never
          autofilled thanks to autocomplete="off" — a human cannot fill it by
          accident, so a non-empty value means a bot that fills every input. */}
      <div className="hidden" aria-hidden="true">
        <label>
          Company
          <input name="company" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {error && (
        <p role="alert" className="font-body text-sm text-red-600">
          {error}
        </p>
      )}

      <Button
        type="submit"
        variant="studio-violet"
        size="pill"
        disabled={sending}
        className="w-full sm:w-auto sm:self-start"
      >
        {sending ? t("sending") : t("submit")}
      </Button>

      <p className="font-body text-sm text-studio-violet/60">
        {t("fallbackIntro")}{" "}
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="underline hover:text-studio-violet"
        >
          {SUPPORT_EMAIL}
        </a>
      </p>
    </form>
  );
}
```

- [ ] **Step 2: Verify it typechecks**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie/landing
npx tsc --noEmit -p tsconfig.json
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie
git add landing/src/components/contact/ContactForm.tsx
git commit -m "feat(landing): contact form component"
```

---

## Task 7: Contact page

**Files:**
- Create: `landing/src/app/[locale]/contact/page.tsx`

**Interfaces:**
- Consumes: `ContactForm` (Task 6); `Contact` namespace (Task 5); `buildAlternates` from `@/lib/seo-metadata`.
- Produces: the route `/[locale]/contact`.

- [ ] **Step 1: Write the page**

Create `landing/src/app/[locale]/contact/page.tsx`:

```tsx
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ContactForm } from "@/components/contact/ContactForm";
import { buildAlternates } from "@/lib/seo-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Contact" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: buildAlternates(locale, "/contact"),
  };
}

export default async function ContactPage() {
  const t = await getTranslations("Contact");

  return (
    <main className="bg-studio-creme px-6 py-20 md:px-12">
      <div className="mx-auto max-w-xl">
        <h1 className="font-heading text-h1 text-studio-violet">
          {t("title")}
        </h1>
        <p className="mt-3 font-body text-sm text-studio-violet/70 md:text-base">
          {t("subtitle")}
        </p>

        <div className="mt-10">
          <ContactForm />
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify the route builds**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie
npm run build:landing 2>&1 | grep -E "contact|Compiled|error|Error" | head
```
Expected: `✓ Compiled successfully`, and `/[locale]/contact` appears in the
route list.

- [ ] **Step 3: Commit**

```bash
git add landing/src/app/\[locale\]/contact/page.tsx
git commit -m "feat(landing): /contact page"
```

---

## Task 8: Footer link

**Files:**
- Modify: `landing/src/components/home/Footer.tsx` (the `legalLinks` array, around line 25)

**Interfaces:**
- Consumes: `Footer.contact` (Task 5), the `/contact` route (Task 7).
- Produces: nothing consumed downstream.

- [ ] **Step 1: Add the link**

In `landing/src/components/home/Footer.tsx`, change `legalLinks` from:

```tsx
  const legalLinks = [
    { label: t("cgv"), href: "/legal/cgv" },
    { label: t("privacy"), href: "/legal/privacy" },
  ];
```

to:

```tsx
  const legalLinks = [
    // Contact leads this column: it is the only one a visitor actively looks
    // for, and it exists in all nine locales unlike the resource links.
    { label: t("contact"), href: "/contact" },
    { label: t("cgv"), href: "/legal/cgv" },
    { label: t("privacy"), href: "/legal/privacy" },
  ];
```

- [ ] **Step 2: Verify it builds**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie
npm run build:landing 2>&1 | grep -E "Compiled|error|Error" | head -3
```
Expected: `✓ Compiled successfully`.

- [ ] **Step 3: Commit**

```bash
git add landing/src/components/home/Footer.tsx
git commit -m "feat(landing): link Contact from the footer"
```

---

## Task 9: Floating bubble

**Files:**
- Create: `landing/src/components/contact/ContactBubble.tsx`
- Modify: `landing/src/app/[locale]/layout.tsx` (mount next to `CookieConsent`, around line 104)

**Interfaces:**
- Consumes: `ContactForm` (Task 6); `Contact` namespace (Task 5).
- Produces: nothing consumed downstream.

- [ ] **Step 1: Write the bubble**

Create `landing/src/components/contact/ContactBubble.tsx`:

```tsx
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ContactForm } from "./ContactForm";

/**
 * Floating contact bubble, mounted site-wide.
 *
 * Positioning is constrained by two neighbours already on screen:
 *   - `ScrollToTop` sits at `bottom-6 right-6 z-30` on the homepage, so this
 *     bubble is stacked ABOVE it vertically (bottom-24) rather than beside it;
 *     side by side they collided on a narrow phone.
 *   - MobileMenu uses scrim `z-40` / panel `z-50`. The sheet reuses those, and
 *     the bubble itself stays at `z-30` so an open drawer covers it instead of
 *     the bubble floating on top of the menu.
 *
 * `end-6`, not `right-6`: in Arabic the bubble belongs on the left.
 */
export function ContactBubble() {
  const t = useTranslations("Contact");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("bubbleAriaLabel")}
        className="fixed bottom-24 end-6 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-studio-violet text-studio-jaune shadow-lg transition-transform hover:scale-105 active:scale-95 md:bottom-28 md:end-8"
      >
        <MessageCircle className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/40"
              aria-hidden="true"
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label={t("title")}
              className="scrollbar-thin fixed inset-x-0 bottom-0 z-50 flex max-h-[92vh] flex-col overflow-y-auto rounded-t-[32px] bg-studio-beurre"
            >
              <div className="flex items-start justify-between gap-4 px-6 pt-6 md:px-10">
                <div className="text-start">
                  <h2 className="font-heading text-h2 text-studio-violet">
                    {t("title")}
                  </h2>
                  <p className="mt-1 font-body text-sm text-studio-violet/70">
                    {t("subtitle")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={t("closeAriaLabel")}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-studio-violet text-studio-jaune shadow-md"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-6 pb-8 pt-6 md:px-10">
                <ContactForm />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
```

- [ ] **Step 2: Mount it in the layout**

In `landing/src/app/[locale]/layout.tsx`, add the import next to the
`CookieConsent` one:

```tsx
import { ContactBubble } from "@/components/contact/ContactBubble";
```

and render it right after `<CookieConsent />` (around line 104):

```tsx
      <CookieConsent />
      <ContactBubble />
```

- [ ] **Step 3: Verify it builds**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie
npm run build:landing 2>&1 | grep -E "Compiled|error|Error" | head -3
```
Expected: `✓ Compiled successfully`.

- [ ] **Step 4: Commit**

```bash
git add landing/src/components/contact/ContactBubble.tsx landing/src/app/\[locale\]/layout.tsx
git commit -m "feat(landing): floating contact bubble

Stacked above ScrollToTop rather than beside it, and left under MobileMenu's
scrim so an open drawer covers it."
```

---

## Task 10: End-to-end verification

**Files:** none created or modified — verification only.

**Interfaces:**
- Consumes: everything above.
- Produces: a verified feature.

- [ ] **Step 1: Static checks**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie/landing
npx tsc --noEmit -p tsconfig.json
npm run lint 2>&1 | grep -iE "contact|Footer" ; echo "lint(contact files) done"
cd .. && npm run build:landing 2>&1 | grep -E "Compiled|error|Error" | head -3
```
Expected: tsc silent; no lint findings in the contact files; build compiles.

- [ ] **Step 2: Run production build and submit a real message**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie/landing
(npx next start -p 3011 > /tmp/contact-prod.log 2>&1 &)
for i in $(seq 1 30); do curl -sf -o /dev/null http://localhost:3011/fr/contact && { echo UP; break; }; sleep 2; done
```

Then in a browser at `http://localhost:3011/fr/contact`: fill the form with a
real address, wait more than 2 seconds before submitting, and submit.

Expected: the success panel appears.

- [ ] **Step 3: Confirm the row was stored and the email arrived**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie/landing
set -a; . ./.env.local; set +a
# Service role required: anon cannot read this table, by design.
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/contact_messages?select=name,email,subject,locale,created_at&order=created_at.desc&limit=3" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
echo
```
Expected: the submitted message is the newest row.

Then check the inbox of `CONTACT_NOTIFY_TO` (or
`contact@thestudiopapeteriedigitale.com` if unset): a plain-text mail whose
`Reply-To` is the visitor's address. If the mail is missing, check
`/tmp/contact-prod.log` for `[contact] notification failed` — note the message
is stored regardless, which is the intended behaviour.

- [ ] **Step 4: Verify the honeypot and the submit delay**

Honeypot — must be refused (fill the hidden field via devtools, or):
```bash
# Submitting faster than 2s must be refused by the elapsed-time check.
# Verify in the browser: reload /fr/contact and submit within 2 seconds.
# Expected: the "check the form fields" error, and NO new row in the table.
echo "manual check"
```

- [ ] **Step 5: Verify the bubble and RTL**

In the browser:
- `http://localhost:3011/fr` — the bubble is at the bottom, **not overlapping
  `ScrollToTop`**; clicking it opens the sheet; the form submits from there.
- Open the burger menu, then check the bubble is **behind** the drawer scrim.
- `http://localhost:3011/ar/contact` — labels and the submit button are on the
  correct side; the bubble sits on the **left**.
- Narrow the window to ~380px: the sheet scrolls, nothing overflows sideways.

- [ ] **Step 6: Stop the server**

```bash
pkill -f "next start -p 3011"
```

- [ ] **Step 7: Final commit if anything was adjusted**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie
git status --short
# Commit any fixes found during verification, then:
git log --oneline -10
```

---

## Notes for the executor

**Do not add an insert policy to `contact_messages`.** If a write fails, the
fix is in `submit_contact_message`, never a policy. The whole design rests on
the table being unreachable from the anon key — Task 1 Step 3 is the test that
proves it, and it must keep passing.

**Out of scope, deliberately:** Turnstile/CAPTCHA (additive later if spam
appears), an AI chatbot, a dashboard inbox UI, and double opt-in on the email.

**Known unrelated issue:** `npm run lint` reports 7 pre-existing errors in
`src/i18n.ts`, `src/lib/stripe.ts` and `tailwind.config.js`. They are not
caused by this work — do not fix them here.

**Also outstanding, and not this plan's job:** the legal texts still contain
`[SIRET à compléter]`, `[adresse à compléter]`, `[Raison sociale à compléter]`
and `[email de contact à compléter]` in `Legal.Cgv` / `Legal.Privacy` across
the nine locales. These are legally required and need the real company
details — flag them to the project owner rather than inventing values.
