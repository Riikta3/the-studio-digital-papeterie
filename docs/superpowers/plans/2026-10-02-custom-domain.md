# Custom domain — Implementation Plan

> **For agentic workers:** execute with the `do` skill, one phase per fresh
> context. Each phase lists what to read first; read it, do not assume.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** a couple who takes « Domaine personnalisé » picks a `.com` at
checkout, or later in the dashboard. The studio buys it at Vercel and wires it
to the couple's invitation and Jour J pages, without anyone touching it. A
couple who did not take it can buy it from the dashboard at the day's price.

**Spec:** `docs/superpowers/specs/2026-10-02-custom-domain-design.md`. Read it
first; decisions are referred to as D1–D8. Renewal is out of scope.

## Global constraints

- **No `git commit` / `git push`** until the user says so. Every phase ends on
  a checkpoint, not a commit.
- **No `npx supabase db push`** without the user's go-ahead. Migrations are
  applied to the **local** database only (`npx supabase migration up`, from
  the repo root; `dashboard/supabase/` is stale).
- **`dashboard/.env.local` points at the production Supabase project.** No
  end-to-end run uses it: override the Supabase variables with the local
  ones, as the 09-28 plan's Task 13 does.
- **No real domain is bought** before Phase 8's explicit go-ahead. Vercel has
  no registrar sandbox: every successful buy call costs real money.
- **Prices never come from the browser.** The server recomputes them from
  `shared/lib/pricing.ts`; the domain's name and years are read from the
  PaymentIntent's metadata after payment.
- **i18n:** every new key goes into all 9 locale files of its app (fr, en, de,
  es, pt, it, ar, zh, ja). `ar` is RTL; domain names stay `dir="ltr"`.
- **Code and comments in English, UI copy in French**, then translated. Match
  the surrounding comment density.
- **Tests** run with `npm test` from the root (`package.json:17`):
  `node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs
  --test shared/lib/*.test.mjs landing/src/lib/*.test.mjs
  dashboard/src/components/editor/*.test.mjs dashboard/src/lib/db/*.test.mjs`.
  - Test files import `.ts` sources with the explicit extension.
  - A module importing a `.json` file cannot be loaded by the runner
    (`ERR_IMPORT_ATTRIBUTE_MISSING`), so keep tested code out of such files.
  - Phase 5 adds `landing/src/lib/custom-domains/*.test.mjs` to the script.
- **The dashboard module-purchase work is uncommitted** (untracked files:
  `shared/lib/module-addon.ts`, `shared/lib/pricing.ts`,
  `landing/src/lib/fulfil-module-addon.ts`,
  `dashboard/src/actions/module-purchase-actions.ts`, …). Line numbers cited
  from those files are from the working tree on 2026-10-02 and may move.
  Phase 7 builds on that work, so it waits until the user has stabilised it.

---

## Phase 0 — Documentation discovery (done 2026-10-02)

Consolidated from five discovery reports. Every row was read in a file or a
document, or observed in a public API response.

### Allowed APIs — Vercel (base `https://api.vercel.com`)

| Purpose | Call | Notes |
|---|---|---|
| Is the TLD sold | `GET /v1/registrar/tlds/supported` (public) | `com` yes, `fr` no |
| Availability + premium | `POST /v1/registrar/domains/search` `{domains: string[]}` (public, ≤ 200) | available → `{domain, available:true, years:1, price, renewalPrice, premium}`; otherwise `{domain, available:false}` |
| Price for N years | `GET /v1/registrar/domains/{d}/price?years=N` (public) | `{years, purchasePrice, renewalPrice, transferPrice}`; **`purchasePrice` = total for N years**; `null` when taken; 400 `tld_not_supported` |
| Buy | `POST /v1/registrar/domains/{d}/buy?teamId=` (token) | body `{autoRenew, years, expectedPrice: purchasePrice, contactInformation: {firstName, lastName, email, phone(E.164), address1, city, state, zip, country(ISO2), companyName?}}` → `{orderId, _links}`; 400 codes include `domain_not_available`, `expected_price_mismatch`, `order_too_expensive` |
| Order status | `GET /v1/registrar/orders/{id}?teamId=` (token) | `status` `draft\|purchasing\|completed\|failed`; `domains[].status` `pending\|completed\|failed\|refunded\|refund-failed`; `domains[].error.code` e.g. `unavailable-legal` |
| Do we own it | `GET /v5/domains/{d}?teamId=` (token) | 200 `{domain:{expiresAt, boughtAt, …}}`; 404 = not ours |
| Attach to project | `POST /v10/projects/{id}/domains?teamId=` `{name, redirect?, redirectStatusCode?}` (token) | "already on project" = 400 with an undocumented code → read back |
| Read attachment | `GET /v9/projects/{id}/domains/{d}?teamId=` (token) | 200 = attached |
| Cert readiness (secondary) | `GET /v6/domains/{d}/config?teamId=` (token) | `misconfigured: false` |

- **Auth:** `Authorization: Bearer <token>`. The token must be **team-scoped**
  (Scope = the team, All Projects); a project-scoped token is refused on
  domains.
- **Cron:** `landing/vercel.json`
  `{"crons":[{"path":"/api/cron/custom-domains","schedule":"*/5 * * * *"}]}`.
  - It runs on **production deployments only**.
  - Each run sends `Authorization: Bearer $CRON_SECRET`.
  - Delivery is best effort, and runs can overlap.

### Allowed APIs — Next.js 16.1.6 / next-intl 4.8.2 / Supabase

- `after(cb)` from `next/server`: Server Actions, Route Handlers, Proxy. It is
  not used in the repo yet.
- Proxy rewrite:
  `NextResponse.rewrite(url, { request: { headers } })`.
  - `headers` **replaces all** request headers, so build it with
    `new Headers(request.headers)`.
  - On Vercel, `host` is the domain the visitor typed.
- next-intl locale: `requestLocale` = `setRequestLocale()` cache, else the
  `X-NEXT-INTL-LOCALE` request header. It never reads the `[locale]` param.
- The root layout reads `x-pathname` for `<html lang/dir>` (`landing/src/app/layout.tsx:17-26`).
- `landing/src/navigation.ts:4-7`: `localePrefix` defaults to `'always'`, so
  next-intl's `Link` always prefixes the locale.
- Supabase default privileges grant EXECUTE on new `public` functions to
  `anon` and `authenticated`. A service-role-only function needs
  `revoke all … from public, anon, authenticated; grant execute … to service_role;`
  (`supabase/migrations/20260928120000_module_addons.sql:109-110`).

### Repo patterns to copy

| Need | Copy from |
|---|---|
| Service-role plpgsql function, row lock, comment, grants | `supabase/migrations/20260928120000_module_addons.sql:27-110` |
| Anon table-returning definer function | `supabase/migrations/20260927120000_invitation_editor.sql:101-154` (`resolve_public_slug`) and the grant pair at `20260914100000_invitation_guest_gate.sql:151-152` |
| Owner select-only RLS | `supabase/migrations/20260311120000_add_rsvp_responses.sql:17-23` |
| "No write policy" comment | `supabase/migrations/20260909120000_contact_messages.sql:46-49` |
| Named status check | `supabase/migrations/20260909120000_contact_messages.sql:22,34` |
| SQL test harness (rolled back, `assert`, role switch) | `supabase/tests/module_addons.sql:1-97`; run with `psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v ON_ERROR_STOP=1 -f …` |
| Add-on metadata build/parse/check/reuse | `shared/lib/module-addon.ts:15-177`, test `shared/lib/module-addon.test.mjs:1-34` |
| Webhook fulfilment (verify, write, refund with idempotency key, billing, invoice) | `landing/src/lib/fulfil-module-addon.ts:25-88` |
| Webhook routing before the checkout path | `landing/src/app/api/webhooks/stripe/route.ts:137-143` |
| Dashboard payment actions (customer by email, reuse intent, complete) | `dashboard/src/actions/module-purchase-actions.ts:31-40, 63-76, 119-159, 171-195` |
| Payment Element dialog, return hook | `dashboard/src/components/editor/ModulePaymentDialog.tsx:30-35, 199-206, 245-311, 317-348`, `payment-flow.ts:11-35` |
| Invoice with caller-provided lines | `landing/src/lib/invoice.ts:24-36` (`content`, `netCents`), `addon-invoice-lines.ts:12-34` |
| Admin client shape | `landing/src/lib/supabase-admin.ts:1-13` |
| Resend email, studio alert | `landing/src/lib/welcome-email.ts:28,77-123`; `landing/src/actions/submit-contact.ts:354-426` (`CONTACT_NOTIFY_TO`) |
| Email building blocks | `shared/emails/components.ts`, `shared/emails/layout.ts` |
| 409 from the payment route | `landing/src/app/api/create-payment-intent/route.ts:74-84` |
| Height-auto animated panel | `landing/src/components/invitation/theme-mediterranean-classy/FaqSection.tsx:58-77` |
| Text field style | `landing/src/app/[locale]/studio/start/page.tsx:69-70` (`FIELD_CLASS`) |
| Slug normalisation to adapt | `landing/src/actions/create-wedding.ts:666-678` |
| Reading request headers in RSC | `landing/src/app/layout.tsx:17-26` |
| Dashboard card style | `dashboard/src/app/[locale]/settings/page.tsx:69-77` |

### Anti-patterns (never do)

- Calling `GET /v1/registrar/domains/{d}/availability`: it answered `true` for
  an unsupported `.fr`.
- Passing a per-year price as `expectedPrice`.
- Buying with `autoRenew: true`.
- Trusting `domain_name` / `domain_years` from the browser after payment.
- Calling `intlMiddleware` for a couple's domain, or rewriting without
  `X-NEXT-INTL-LOCALE` and `x-pathname`.
- `NextResponse.rewrite(url, { request: { headers: { … } } })` with a fresh
  object, which drops every other header.
- Using next-intl's `Link` for clean links on a couple's domain.
- `revoke … from public` alone on a function meant to be service-role only.
- Letting an unknown host 404 the shop. Unknown hosts fall through to today's
  behaviour (D6).
- Hand-editing `registry.ts` or a theme's `<id>.css`. No theme folder is
  touched by this plan.

---

## Phase 1 — Pure shared logic (TDD)

**Read first:** spec D1, D3 (label rules), D4 (metadata); `shared/lib/pricing.ts`;
`shared/lib/pricing.test.mjs`; `shared/lib/module-addon.ts` and its test;
`landing/src/app/[locale]/studio/(steps)/checkout/page.tsx:50-124`.

- [ ] **Pricing** (`shared/lib/pricing.ts`):
  - add the D1 constants, `domainYearsFor(weddingDate, today)` and
    `domainPrice(years)`;
  - remove `"custom-domain"` from `EXTRA_PRICES`;
  - `OrderItems.domainYears?`;
  - `computeOrderTotal` adds `domainPrice(domainYears ?? 1)` when `extras`
    contains `custom-domain`.

  Tests first, in `shared/lib/pricing.test.mjs`, covering every
  `domainYearsFor` case listed in the spec's Testing section, and totals at
  1, 2 and 4 years. Existing pricing tests must still pass.
- [ ] **`shared/lib/custom-domain.ts`** (new):
  - `normalizeLabel`, `isValidLabel` (3–63 characters), `toDomainName(label)`
    → `label.com`;
  - `suggestLabels({ partner1, partner2, connector, year })`: the first word
    of each name, diacritics stripped, D3's alternatives, deduplicated, only
    valid ones.

  Test file `shared/lib/custom-domain.test.mjs`.
- [ ] **`shared/lib/domain-search.ts`** (new):
  - `searchDomains(names, { fetch, now })` calls **search only**. It keeps
    names that end in `.com`, are `available`, are not `premium`, and have
    `price <= DOMAIN_MAX_USD_PER_YEAR` (= 15, exported from pricing).
  - 60 s in-memory cache per name.
  - `fetch` is injected for tests.

  Test with a fake fetch replaying the real responses from Phase 0.
- [ ] **`shared/lib/domain-addon.ts`** (new): copy `module-addon.ts:15-177`
  and adapt it.
  - `DOMAIN_ADDON_KIND = "domain_addon"`, with the D4 keys and no `plan` key.
  - `buildDomainAddOnMetadata`, `parseDomainAddOnMetadata`,
    `checkDomainAddOnIntent(intent, { siteId? })`, `isDomainAddOn`,
    `isReusableDomainIntent`.
  - The check requires
    `amount_received === amount_cents === domainPrice(domain_years) × 100`.

  Tests copy the shape of `module-addon.test.mjs`, including a tampered
  amount and a module add-on intent (`isDomainAddOn` → false).
- [ ] **`landing/src/lib/wedding-date.ts`** (new):
  - move `monthIndexFrom` and the date half of `toWeddingIdentity` out of the
    checkout page as `weddingDateFrom(info, localisedMonths)` →
    `"YYYY-MM-DD" | undefined`;
  - the checkout imports it, with unchanged behaviour.

  Test `landing/src/lib/wedding-date.test.mjs`: a French label, an English
  label, and an unknown label → undefined.

**Verification**
- [ ] `npm test` passes.
- [ ] `grep -rn '"custom-domain": 65' shared landing/src` → only
  `options.ts`, which Phase 4 removes.
- [ ] `grep -rn "registrar/domains/.*/availability" shared landing dashboard` → nothing.

**Guards:** UTC date arithmetic on `YYYY-MM-DD`, with no `new Date(local)`
parsing of a date-only string. No import of `next/*` or `.json` in these
files.

---

## Phase 2 — Database

**Read first:** spec D2 and D8; the migration and test patterns from the
Phase 0 table.

- [ ] `supabase/migrations/20261002120000_custom_domains.sql`, with a header
  comment citing the spec and numbered sections:
  1. `create table public.custom_domains`, with every D2 column.
     - `status` uses a named check `custom_domains_status_check` over
       `awaiting_choice, queued, purchasing, registered, active, failed`.
     - `years between 1 and 10`.
     - Partial unique index on `name` where `name is not null`, plus
       `unique(site_id)` and `unique(stripe_payment_intent_id)`.
     - Index on `(status, next_attempt_at)`.
     - There is no `updated_at` trigger in this repo: every function sets
       `updated_at = now()` itself.
  2. RLS enabled, with an owner `select` policy (copy
     `add_rsvp_responses.sql:17-23`) and no write policy, with the
     contact_messages-style comment. Also
     `revoke insert, update, delete on public.custom_domains from anon, authenticated;`.
  3. `resolve_custom_domain(p_host text) returns table(live boolean, slug text, languages text[])`.
     - Copy `resolve_public_slug`. Lowercase the host, strip one leading
       `www.`, `limit 1`.
     - Grants: `revoke all … from public; grant execute … to anon, authenticated;`.
  4. `claim_custom_domain(p_id uuid)` and
     `claim_due_custom_domains(p_limit int)`.
     - One `update … set locked_until = now() + interval '2 minutes', updated_at = now()
       where … status in ('queued','purchasing','registered') and next_attempt_at <= now()
       and (locked_until is null or locked_until < now()) returning *`.
     - `claim_due_custom_domains` picks ids with `for update skip locked` in
       a CTE.
     - `revoke all … from public, anon, authenticated; grant execute … to service_role;`.
  5. `claim_custom_domain_notice(p_id uuid, p_code text) returns boolean`
     appends to `notices_sent` only if absent, and
     `release_custom_domain_notice(p_id, p_code)` removes it. Both are
     service-role only.
  6. `alter table public.sites drop column domain;`.
  7. `comment on` every new table, column and function.
- [ ] `supabase/tests/custom_domains.sql`, on the `module_addons.sql`
  harness. Every check from the spec's Database bullet, with `set local role
  anon` for the resolver (a first in this repo: also `set_config` the claims
  with `"role":"anon"`).
- [ ] Apply locally with `npx supabase migration up`, then run the test with
  `psql`. The last line must read `custom_domains checks passed`.
- [ ] Regenerate the types:
  `npx supabase gen types typescript --local > /tmp/sb.ts`. Diff it against
  `shared/types/supabase.ts`; take the new table and functions and the
  removed `domain`, and patch by hand if the formatting churns (as the 09-28
  plan did).

**Verification**
- [ ] The psql test passes.
- [ ] `grep -n "domain" shared/types/supabase.ts` shows no `sites.domain`.
- [ ] `npm test` still passes.
- [ ] As `anon`, `select * from claim_due_custom_domains(10)` raises
  `permission denied`.

**Guards:** never edit an applied migration. No `db push`.

---

## Phase 3 — Checkout, server side

**Read first:** spec D1, D3 (Payment intent, Clearing keys, Provisioning);
`landing/src/lib/order-metadata.ts`, `verify-payment.ts`,
`create-payment-intent/route.ts`, `actions/create-wedding.ts`,
`lib/invoice-lines.ts:137-147`, `lib/invoice.ts:24-107`.

- [ ] **`order-metadata.ts`:**
  - `OrderMetadataInput` and `ParsedOrder` gain `domainName?` and
    `domainYears?`, written as `domain_name` and `domain_years`.
  - Add a pure helper, `metadataForUpdate(existing, next)`, that returns
    `next` plus `""` for every key `existing` has that `next` lacks, sparing
    keys our server writes after payment (`wedding_id`, `refunded_reason`).

  Tests in `landing/src/lib/order-metadata.test.mjs`: round trip, the
  later-after-a-name case, and the spared keys.
- [ ] **`create-payment-intent/route.ts`**, when `extras` includes
  `custom-domain`:
  - `years = domainYearsFor(weddingInfo.weddingDate, new Date())` goes into
    `items.domainYears` before `computeOrderTotal`.
  - With a label: `normalizeLabel`, `isValidLabel`, then `searchDomains`.
    - Not available → 409 `{ error: "Ce nom vient d'être pris.", domainUnavailable: true }`,
      copying `route.ts:74-84`.
    - Search throwing → log `[DOMAIN_SEARCH_UNREACHABLE]` and continue.
  - The repricing update uses `metadataForUpdate(existing.metadata, orderMetadata)`.
- [ ] **`verify-payment.ts`:**
  - Retrieve the intent **first**, then compute the expected total with
    `domainYears` from the intent's metadata.
  - Return `domain: { has: boolean; name?: string; years: number }`, parsed
    from the intent's own `extras`, `domain_name` and `domain_years`.
- [ ] **`create-wedding.ts`**, after the site insert (around L386-424, where
  `siteId` exists):
  - When `payment.domain.has`, insert into `custom_domains` through
    `supabaseAdmin` with `status`, `name`, `years`,
    `price_paid_cents = toCents(domainPrice(years))`,
    `stripe_payment_intent_id` and `status_changed_at = now()`.
  - Handle `on conflict (site_id)` by ignoring 23505 on that constraint.
  - On a 23505 against the `name` index, re-insert with `name: null`,
    `status: 'awaiting_choice'`, `last_error: 'name_unavailable'`.
  - A failure is logged `[DOMAIN_ROW_FAILED]` and does not fail provisioning,
    following the `seedInvitationContent` philosophy. The webhook path goes
    through the same code.
  - *(The `after(() => advanceCustomDomain(id))` call is added in Phase 5.)*
- [ ] **`landing/src/lib/domain-invoice-line.ts`** (new, no `.json` import):
  `domainInvoiceLine(name | undefined, years)` → `InvoiceLine` labelled as
  in D1, priced with `domainPrice`.
  - `buildInvoiceLines` (`invoice-lines.ts`) emits it when `extras` contains
    `custom-domain`, reading `items.domainName` and `items.domainYears`.
  - Drop `"custom-domain"` from `EXTRA_LABELS`.
  - The invoice path's `parseOrderMetadata` now carries the fields.

  Test `landing/src/lib/domain-invoice-line.test.mjs`.

**Verification**
- [ ] `npm test` passes.
- [ ] Stripe test mode (local landing, local Supabase,
  `stripe listen --forward-to localhost:3010/api/webhooks/stripe`), with
  Phase 4 not built yet. POST the route directly with `curl` and a domain
  label:
  - the intent's metadata carries `domain_name` and `domain_years`;
  - a second call without the label clears `domain_name`;
  - after paying with a test card through the existing checkout, the
    `custom_domains` row exists as `queued`, and the invoice shows the domain
    line and reconciles (no `[INVOICE_TOTAL_MISMATCH]`).

**Guards:** `createWedding`'s browser payload is never the source of the
domain fields. Never refund the whole order because of a domain problem.

---

## Phase 4 — Studio UI (mock-up first)

**Read first:** spec D3; memory « maquette avant design UI » (the user wants a
clickable mock-up and checks mobile); `options/page.tsx:169-214`;
`use-order-store.ts`; `checkout/page.tsx:416-492, 459-466, 682-722`;
`StepTransition.tsx`; `FaqSection.tsx:58-77`.

- [ ] **Gate — clickable mock-up.** Publish an HTML mock-up as a private
  artifact.
  - Studio: the custom-domain card closed, open with a free name, open with a
    taken name and alternatives, « plus tard », and the 2-year price text.
  - Checkout: the recap row and the 409 message.
  - Dashboard: the five states of D4's block. This decides where the block
    sits: Réglages → Général, or the home page.
  - Desktop and 375 px.

  **Stop until the user approves.** Fold their corrections into the spec.
- [ ] `landing/src/app/api/custom-domains/check/route.ts`: `POST {label}` →
  `{ name, available, alternatives }` via `searchDomains`. Validate the
  input; on a search failure answer 503
  `{ error: "Vérification indisponible" }`.
- [ ] **Store:**
  - `domain: { label, later, years }` with defaults, in `completeOrder` and
    `resetStore`;
  - persist `version: 4`, with a `migrate` that adds the default;
  - `setDomain`;
  - `selectTotalPrice` passes `domain.years`.
- [ ] **Options page:** split the custom-domain card into a header button and
  a sibling panel (`col-span-2` while open). The panel:
  - debounces the check endpoint by 400 ms and pre-fills via
    `suggestLabels`;
  - offers « Je choisirai plus tard »;
  - shows the price text computed with `weddingDateFrom(weddingInfo,
    t.raw("months") from StudioStart)` and sets `domain.years`;
  - is `dir="ltr"` on the field and the suffix.

  The card's price comes from `domainPrice`, and the `options.ts`
  description becomes a `.com` example.
- [ ] **Checkout:**
  - send `domain: { label, later }` inside `items`, and add `domain` to the
    effect's dependencies;
  - recompute `domain.years` on mount;
  - add the recap row « Nom de domaine — {name}, {n} an(s) » or « à choisir
    plus tard »;
  - add a `domainUnavailable` branch in the 409 handling, with a link to
    `/studio/options`;
  - the amount shown for payment is the route's returned `amount`. Check what
    the PaymentForm displays today and switch it if needed.
- [ ] **Messages:** a `CustomDomain` namespace in all 9
  `landing/messages/*.json`, including `connector` (et / and / und / y / e /
  e / و / 和 / と). Check that `ar`, `zh` and `ja` connectors are only used
  when the names produce Latin labels.

**Verification**
- [ ] On the running dev server, take screenshots of options and checkout at
  desktop and 375 px, in fr, de and ar.
- [ ] Stripe test mode: checkout with a free name, with « plus tard », and
  with a name made taken (409 shown, nothing charged).
- [ ] `npm run lint -w landing`, judged on the touched files.
- [ ] `npm test`.

**Guards:** no `<input>` inside a `<button>`. No framer-motion import added to
the options page beyond the panel; follow the FaqSection pattern, with
`useReducedMotion`.

---

## Phase 5 — Purchase engine

**Read first:** spec D5; Phase 0's Vercel table and anti-patterns;
`welcome-email.ts`, `submit-contact.ts:354-426`, `shared/emails/*`.

**Vercel setup (user's screenshots, 2026-10-02):** two projects, both with
production tracking `main`; `dev` and every other branch deploy as previews.
- `the-studio-digital-papeterie-landing`: `www.thestudiopapeteriedigitale.com`
  and 3 more domains. It receives the token, the cron and the registrant
  variables.
- `the-studio-digital-papeterie-dashboard`:
  `app-the-studio-digital-papeterie.vercel.app` and 2 more. It needs no Vercel
  credentials for this feature.
- `landing/.vercel` links an older project called `landing`; ignore it.
- Crons therefore run only on `main`'s deployments, never on `dev` previews.

**Root Directory = `landing`** (user's screenshot, 2026-10-02; "Include
files outside the root directory" enabled), so the cron file is
**`landing/vercel.json`**. The landing's 3 extra domains are not listed; an
unlisted own host still falls through safely (D6).

**Dashboard address (decided 2026-10-02):** the dashboard moves to a
subdomain (`espace.thestudiopapeteriedigitale.com`), not `/dashboard` on the
landing. This is done separately and is not a prerequisite of this plan.

- [ ] `package.json` test script: add `landing/src/lib/custom-domains/*.test.mjs`.
- [ ] `landing/src/lib/custom-domains/vercel-registrar.ts`: one function per
  row of the Phase 0 table, with `{ fetch, token, teamId, projectId }`
  injected.
  - Errors are normalised to `{ status, code }`, handling both
    `{status,code,message}` and `{error:{code,message}}`.
  - It reads `VERCEL_API_TOKEN`, `VERCEL_TEAM_ID` and
    `VERCEL_LANDING_PROJECT_ID` only in a `fromEnv()` factory.
- [ ] `landing/src/lib/custom-domains/registrant.ts`: builds
  `contactInformation` from the D5 variables, returning `null` when any is
  missing.
- [ ] `landing/src/lib/custom-domains/advance.ts`:
  `advanceCustomDomain(id, deps)` and `advanceDue(deps)`, implementing D5's
  step table row by row.
  - The lease comes from `claim_custom_domain`.
  - The write-ahead `purchasing` marker is written before the buy call.
  - Backoff is +2, +10, +30, +120, +360 minutes, then `failed`.
  - Waiting for an order or a certificate is not a failure. Certificate
    deadline: 48 h after `registered_at`.
  - The TLS probe is `fetch("https://name/", { method: "HEAD", redirect: "manual", signal: AbortSignal.timeout(10_000) })`;
    any HTTP response means TLS works.
  - Every status change sets `status_changed_at`.
  - `deps` holds the registrar, the db client, the clock, the mailer and the
    probe, so everything is testable.
- [ ] `landing/src/lib/custom-domains/emails.ts`:
  - couple emails `active`, `name_unavailable` and `reminder`, and the studio
    alert, built with `renderEmail` and the components;
  - sent through Resend from the same `FROM` as the welcome email;
  - each is claimed with `claim_custom_domain_notice` before sending and
    released on failure.
- [ ] `landing/src/app/api/cron/custom-domains/route.ts`: `GET`, with the
  `CRON_SECRET` guard from Phase 0.
  - It calls `advanceDue` (up to 10 rows) and sends the 7-day reminders
    (`awaiting_choice`, `status_changed_at < now() - 7 days`).
  - It answers a JSON summary.
- [ ] `landing/vercel.json`, with the cron from Phase 0, in the confirmed root.
- [ ] `create-wedding.ts`: after the row insert, call
  `after(() => advanceCustomDomain(id, fromEnv()))`.
- [ ] `landing/.env.example`: add `VERCEL_API_TOKEN`, `VERCEL_TEAM_ID`,
  `VERCEL_LANDING_PROJECT_ID`, `CRON_SECRET`, `COMPANY_DOMAINS_EMAIL`,
  `COMPANY_REGION`, `DOMAIN_REGISTRANT_FIRST_NAME` and
  `DOMAIN_REGISTRANT_LAST_NAME`, each with a one-line comment. Note that
  `COMPANY_PHONE` must be E.164.
- [ ] Tests, in `landing/src/lib/custom-domains/advance.test.mjs`: one test
  per bullet of the spec's `advanceCustomDomain` list, with a fake registrar,
  db and clock. Plus `vercel-registrar.test.mjs`, covering error
  normalisation and the `expectedPrice` total.

**Verification**
- [ ] `npm test`.
- [ ] `grep -rn "autoRenew: true\|/availability" landing/src` → nothing.
- [ ] Run the cron route locally (`curl -H "Authorization: Bearer $CRON_SECRET"
  localhost:3010/api/cron/custom-domains`) with **no** Vercel token set. A
  `queued` row ends `failed` with a missing-configuration reason, and the
  studio alert is logged. This proves no buy is attempted without
  configuration.

**Guards:** no real token in any local `.env`. The engine never runs a buy
from a test.

---

## Phase 6 — Routing a couple's domain

**Read first:** spec D6; `landing/src/proxy.ts`; `landing/src/navigation.ts`;
`landing/src/i18n.ts`; `landing/src/app/layout.tsx`;
`landing/src/app/[locale]/layout.tsx` (where `ContactBubble` and
`CookieConsent` are mounted); `components/jourj/GuestNav.tsx`;
`app/[locale]/jourj/[slug]/{layout,page}.tsx`;
`app/[locale]/invitation/[slug]/page.tsx:83-86`.

- [ ] `landing/src/lib/supabase-anon.ts`: copy `supabase-admin.ts:1-13` with
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] `landing/src/lib/custom-domain-routing.ts` (pure, no `next/*` imports):
  - `isOwnHost(host, siteUrl)`;
  - `mapCustomDomainPath(pathname, { slug, languages, locales, defaultLocale })`
    → `{ rewrite, locale, base } | { redirect } | { notFound }`;
  - `guestHref(subpath, { slug, base, custom })`.

  Test `landing/src/lib/custom-domain-routing.test.mjs`: every row of D6's
  table, a locale not bought, another couple's slug, the own-host list, and
  `guestHref` on both kinds of host.
- [ ] **`proxy.ts`** becomes `async`. Before today's logic:
  - Own host → delete `x-custom-domain` and `x-custom-domain-base` from the
    request headers, then today's flow, unchanged.
  - Otherwise, `resolve_custom_domain` with a module-level cache (60 s live,
    10 s otherwise):
    - no row → today's flow;
    - not live → minimal 404;
    - live → `mapCustomDomainPath`. Answer the redirect, or a minimal 404,
      or a rewrite with `new Headers(request.headers)` plus
      `X-NEXT-INTL-LOCALE`, `x-pathname` (the rewritten path),
      `x-custom-domain` and `x-custom-domain-base`.
  - The minimal 404 is `new NextResponse(<small html>, { status: 404, headers: { "content-type": "text/html; charset=utf-8" } })`.
  - Maintenance mode is skipped for couples' domains.
- [ ] `[locale]/layout.tsx` (or wherever they mount): skip `ContactBubble`
  and `CookieConsent` when `x-custom-domain` is present.
- [ ] **Clean links:**
  - The Jour J layout reads `x-custom-domain-base` and `x-custom-domain`, and
    passes them to `GuestNav`.
  - `GuestNav`, the Jour J page links and the invitation page's language
    redirect use `guestHref`.
  - On a custom domain they render with `next/link` (or `redirect()` with the
    clean path); otherwise next-intl's `Link`, as today.

**Verification** (local dev server, with a fake `active` row and a published
site in local Supabase):
- [ ] `curl -sI -H "Host: sophie-et-pierre.test" localhost:3010/` → 200.
- [ ] `curl -s -H "Host: sophie-et-pierre.test" localhost:3010/en | grep '<html'`
  → `lang="en"` and English copy in the body, with the couple having `en`.
- [ ] `/ar` → `dir="rtl"`, with the couple having `ar`.
- [ ] `/ja` not bought → 307 to `/`.
- [ ] `/jourj/menu` → 200. `/studio`, `/invitation/<another-slug>` and
  `/journal` → 404, minimal page, no shop menu.
- [ ] A host with no row → the shop's homepage, unchanged.
- [ ] `localhost:3010/fr` → unchanged.
- [ ] `curl -H "x-custom-domain: evil" localhost:3010/fr/invitation/<slug>` →
  normal generic page, not the custom-domain variant.
- [ ] No `ContactBubble` or cookie banner in the custom-domain HTML.
- [ ] `npm test`; lint the touched files.

**Guards:** no change to the matcher's exclusions. `intlMiddleware` is not
called on a couple's domain.

---

## Phase 7 — Dashboard

**Gate:** ask the user whether the module-purchase work is stable (ideally
committed). This phase copies its files.

**Read first:** spec D4 and D7; the approved mock-up;
`module-purchase-actions.ts`, `ModulePaymentDialog.tsx`, `payment-flow.ts`,
`fulfil-module-addon.ts`, `webhooks/stripe/route.ts:132-145`,
`components/home/InvitationPreviewCard.tsx`,
`actions/dashboard-summary-actions.ts`,
`app/[locale]/jour-j/qr-code/page.tsx:31-57`,
`app/[locale]/settings/page.tsx`.

- [ ] `dashboard/src/actions/custom-domain-actions.ts` (`"use server"`):
  - `getCustomDomain()` reads under the couple's session;
  - `chooseCustomDomain(label)` follows D4;
  - `startDomainPayment(label, locale)` and
    `completeDomainPayment(paymentIntentId)` copy
    `module-purchase-actions.ts:63-76, 119-159, 171-195`, with
    `domain-addon.ts` in place of `module-addon.ts`;
  - years come from `weddings.wedding_date`; availability from
    `searchDomains`;
  - writes through the dashboard's service-role client, only after
    `requireWedding()`.
- [ ] `landing/src/lib/fulfil-domain-addon.ts`: copy
  `fulfil-module-addon.ts:25-88`.
  - It verifies with `checkDomainAddOnIntent` and inserts the `queued` row
    (with the lost-name fallback).
  - Any other row for the site → refund the whole intent with
    `idempotencyKey: domain-refund:${intent.id}`, logged
    `[DOMAIN_DOUBLE_PAYMENT]`.
  - Then the billing upsert (`plan_name: "Nom de domaine : {name}"`) and the
    invoice with `domainInvoiceLine`.
  - Finally `after(() => advanceCustomDomain(id, fromEnv()))`.
- [ ] Webhook: `if (isDomainAddOn(paymentIntent)) { await fulfilDomainAddOn(paymentIntent); break; }`
  next to the module branch, before the checkout path.
- [ ] **UI:**
  - the « Nom de domaine » block where the mock-up placed it, with the five
    states;
  - a domain payment dialog copying `ModulePaymentDialog`'s `Elements`,
    `CardStep` and return hook;
  - `InvitationPreviewCard` and `getDashboardSummary` read `custom_domains`
    (status, name, `expires_at`);
  - the QR code page uses `https://{name}/jourj` once active.
- [ ] Messages in all 9 `dashboard/messages/*.json`.

**Verification**
- [ ] Use the dashboard with the **local** Supabase overrides.
- [ ] Stripe test mode with `stripe listen`. Test:
  - choosing after « plus tard »;
  - buying with a card, and with 3DS;
  - closing the tab after paying (the webhook alone creates the row);
  - two tabs (the second payment is refunded before any invoice).
- [ ] Screenshots of the block at desktop and 375 px, in fr, de and ar.
- [ ] `npm test`; lint the touched dashboard and landing files.

**Guards:** the dashboard never imports `vercel-registrar.ts` and never holds
`VERCEL_API_TOKEN`. No billing or invoice written by the dashboard's fast
path.

---

## Phase 8 — Verification, documentation, go-live steps

- [ ] `npm test` passes; lint is clean on every touched file;
  `npm run themes:check -w landing` passes (nothing should have changed).
- [ ] Anti-pattern greps:
  - `grep -rn "/availability" shared landing/src dashboard/src` → nothing;
  - `grep -rn "autoRenew: true" landing/src` → nothing;
  - `grep -n "revoke all on function public.claim_" supabase/migrations/20261002120000_custom_domains.sql`
    → every line includes `anon, authenticated`;
  - `grep -rn "from \"@/navigation\"" landing/src/components/jourj/GuestNav.tsx`
    → only used on the generic path.
- [ ] **Vault** (`obsidian vault="The Studio Digital Papeterie" …`):
  - `Architecture/Base de Données.md`: `custom_domains`, the four functions,
    `sites.domain` dropped.
  - `Conventions.md`, three gotchas:
    - Supabase's default EXECUTE grant to anon;
    - next-intl's locale header on proxy rewrites;
    - Vercel's `/availability` endpoint lying for unsupported TLDs.
  - `Features/Nom de domaine personnalisé.md`: status `implémenté (non commité)`,
    and the plan link.
- [ ] Update memory `project_custom_domain_option.md`.
- [ ] **Go-live steps, each needing the user's explicit go-ahead:**
  1. `npx supabase db push --dry-run`, then `db push`.
  2. Vercel env vars on the production landing project: token, team, project
     id, `CRON_SECRET`, the registrant variables. Pro plan, and a payment
     method on the team.
  3. **One real purchase** on a preview deployment (~10 €), driving the cron
     route by hand with the secret, since crons do not run on previews. Check
     the domain serves the invitation over HTTPS, `/en`, `/jourj` and `www.`.
  4. CGV updated by the user before the option is sold for real.
  5. If the dashboard moves to its own address (under discussion on
     2026-10-02: a subdomain, or `/dashboard` on the landing), update
     `NEXT_PUBLIC_DASHBOARD_URL` in both projects first, since the domain
     emails link to the dashboard block.
