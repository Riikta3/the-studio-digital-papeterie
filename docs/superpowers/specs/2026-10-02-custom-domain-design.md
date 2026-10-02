---
date: 2026-10-02
status: draft
category: feature
---

# Custom domain — pick a `.com` at checkout or later, bought and wired automatically

## What was asked

> « dans checkout tu vois j'ai une option "nom de domaine personnalisée" ce qui
> veut dire que si l'utilisateur prend cette option il faut un truc pour qu'ils
> choisissent un nom de domaine et une fois que c'est payé il faut créer un nom
> de domaine et créer l'invitation comme les autres »

> « dans le dashboard on pourra mettre en option comme ça il paye pas de
> supplément s'il est intelligent »

Decisions taken with the user on 2026-10-02:

| Question | Answer |
|---|---|
| Extensions | `.com` only — Vercel's registrar sells it; it does not sell `.fr` |
| How long the domain is bought for | until the wedding date + 3 months, in whole years |
| Price | 65 € for one year, + 20 € per additional year |
| In whose name | the studio's |
| When the name is chosen | at checkout, or « je choisirai plus tard » and in the dashboard |
| Bought after the sale | yes, from the dashboard, priced on the day of purchase |
| How the purchase runs | automatically, with a scheduled job as a safety net |
| Renewal | paid by the couple, with reminder emails — **a separate spec** |
| Hide the option until this ships | no — the shop is still in test mode |

## What is wrong today

- **The option is sold and nothing is delivered.** `custom-domain` is billed
  65 € (`shared/lib/pricing.ts:40`) and appears on the invoice
  (`landing/src/lib/invoice-lines.ts:38`), but the studio never asks for a
  name, `createWedding` ignores it, and nothing routes a domain to an
  invitation.
- **`sites.domain` exists and is read by nothing**
  (`00000000000000_full_db_reset.sql:55`).
- **The option card promises `sophie-et-pierre.fr`**
  (`landing/src/components/studio/options.ts:46`), an extension Vercel cannot
  sell.
- **The card's price is hard-coded** (`options.ts:47`, `price: 65`) beside the
  real one in `EXTRA_PRICES`; with a duration-based price they would disagree.

## Facts about Vercel's registrar (checked 2026-10-02)

- `POST /v1/registrar/domains/search` (no token) returns, for up to 200 exact
  names: `available`, and for an available name `years` (always 1), `price`,
  `renewalPrice`, `premium`. **For a TLD Vercel does not sell it answers
  `available: false`**, indistinguishable from "taken". The TLD must therefore
  be checked against `GET /v1/registrar/tlds/supported` first. `fr`, `eu`,
  `de`, `es`, `it`, `pt` and `be` are not supported; `com` is.
- **`GET /v1/registrar/domains/{domain}/availability` must not be used**: it
  answered `{"available": true}` for a `.fr` name. Search is the only reliable
  availability check.
- `GET /v1/registrar/domains/{domain}/price?years=N` (no token) answers
  `{years, purchasePrice, renewalPrice, transferPrice}`, where
  **`purchasePrice` is the total for N years** (22.5 for 2 years of `.com`).
  It is `null` for a taken name, and the endpoint answers 400
  `tld_not_supported` for an unsupported TLD. It has no `premium` field.
- Prices seen: `.com` 11.25 $/year (renewal 11.25 $).
- `POST /v1/registrar/domains/{domain}/buy` (token) requires `years`,
  `autoRenew`, `expectedPrice` — **the quoted `purchasePrice`, i.e. the
  total** — and `contactInformation` with `firstName`, `lastName`, `email`,
  `phone` (E.164), `address1`, `city`, `state`, `zip` and `country` (ISO
  alpha-2). `companyName` is optional. `.com` needs no additional field
  (`GET /v1/registrar/domains/{domain}/contact-info/schema` answers `{}`).
  It answers `{orderId}`; the purchase is asynchronous. Its 400 codes include
  `domain_not_available`, `expected_price_mismatch`, `order_too_expensive`
  and `tld_not_supported`.
- `GET /v1/registrar/orders/{orderId}`: `status` is `draft`, `purchasing`,
  `completed` or `failed`. Each `domains[]` entry has a status (`pending`,
  `completed`, `failed`, `refunded` or `refund-failed`) and an `error.code`
  (e.g. `unavailable-legal`, `invalid-contact`, `price-change`). The
  order-level `error.code` can be `payment-failed`, `tld-outage`,
  `price-mismatch` or `unexpected-error`.
- `GET /v5/domains/{domain}` (token): 200 with `domain.expiresAt` and
  `boughtAt` when the domain is in our account, 404 when it is not.
- `POST /v10/projects/{idOrName}/domains` `{name, redirect?,
  redirectStatusCode?}` (token). Adding a domain the project already has
  answers 400, with an undocumented code. Whether it is attached is read back
  with `GET /v9/projects/{idOrName}/domains/{domain}`.
- Tokens: a **team-scoped** token (scope = the team, All Projects). A
  project-scoped token is refused on domains, which are team-level.
- Vercel Cron: `crons` in the project root's `vercel.json` (Root Directory
  `landing` → `landing/vercel.json`).
  - It calls **production deployments only**, sending
    `Authorization: Bearer $CRON_SECRET`.
  - Delivery is best effort: runs may be missed, duplicated or overlap.
  - Pro allows `*/5 * * * *`.
- Next 16 `after()` (`next/server`) is stable in Server Actions, Route Handlers
  and Proxy, and runs through `waitUntil` on Vercel.
- Registrations are whole years only (1–10).
- Pro plan: unlimited project domains (soft limit 100 000); Hobby: 50 and
  non-commercial. Domain additions are rate-limited to 100/hour/team.

## Decisions

### D1 — One price rule, frozen at payment

In `shared/lib/pricing.ts`, beside the checkout's other rules:

```ts
export const DOMAIN_BASE_PRICE = 65;        // €, first year
export const DOMAIN_EXTRA_YEAR_PRICE = 20;  // €, each year after
export const DOMAIN_COVER_MONTHS = 3;       // months covered after the wedding
export const DOMAIN_MAX_YEARS = 10;         // the registry's own limit

domainYearsFor(weddingDate: string | null | undefined, today: Date): number
domainPrice(years: number): number          // 65 + (years − 1) × 20
```

- `coverUntil` = wedding date + 3 calendar months. `years` is the smallest
  n ≥ 1 with `today + n years ≥ coverUntil`, capped at 10 — the registry's
  limit, never a business one: a lower cap would let the domain of a wedding
  far ahead expire before the day. A missing, invalid or past date gives 1.
  Dates are handled as `YYYY-MM-DD` in UTC, so the server's timezone cannot
  move a boundary. A wedding exactly 9 months away is 1 year.
- `"custom-domain"` leaves `EXTRA_PRICES`. `OrderItems` gains
  `domainYears?: number`, and `computeOrderTotal` adds
  `domainPrice(domainYears ?? 1)` when `extras` contains `custom-domain`.
- The option card reads its price from `domainPrice`, not from `options.ts`.
  Its description becomes a `.com` example.
- **The years are computed by the server whenever the PaymentIntent is
  created or repriced, and frozen once it is paid.** They are written to its
  metadata. Every later reader — provisioning, the webhook a day later, the
  invoice — takes them from the intent and never recomputes from today's date.
- The invoice line reads « Nom de domaine sophie-et-pierre.com — 2 ans », or
  « Nom de domaine personnalisé — 1 an » when the name is not chosen yet.
  `buildInvoiceLines` must emit it itself, because it skips any extra
  without an `EXTRA_PRICES` entry. Without it, the invoice total would no
  longer reconcile with the charge and `issueInvoiceForPayment` would refuse
  to issue. The line builder lives in its own file:
  `invoice-lines.ts` imports `messages/fr.json`, which the test runner cannot
  load.
- `ParsedOrder` (`order-metadata.ts`) carries `domainName` and `domainYears`,
  so the invoice and the webhook read them from the intent.

### D2 — `custom_domains`, the single source of truth

New migration `supabase/migrations/20261002120000_custom_domains.sql`:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `site_id` | uuid, unique, fk `sites` on delete cascade | one domain per site |
| `wedding_id` | uuid, fk `weddings` on delete cascade | RLS and emails |
| `name` | text, null until chosen | lowercase, `label.com`; unique where not null |
| `years` | int, 1–10 | what was paid for |
| `price_paid_cents` | int | |
| `stripe_payment_intent_id` | text, unique | the payment that bought it |
| `status` | text, check | see below |
| `status_changed_at` | timestamptz | set on every status change; the reminder counts from it |
| `vercel_order_id` | text | |
| `purchase_started_at` | timestamptz | write-ahead marker of a buy call |
| `registered_at`, `expires_at` | timestamptz | `expires_at` from Vercel; the renewal spec reads it |
| `activated_at` | timestamptz | |
| `attempts` | int default 0 | failures of the current step |
| `next_attempt_at` | timestamptz default now() | when the engine may look again |
| `locked_until` | timestamptz | lease expiry, see D5 |
| `lease_token` | uuid | minted by each claim; every engine write is conditioned on it |
| `claims_since_progress` | int default 0 | incremented by each claim, reset by every engine write; 3 means a step keeps dying |
| `last_error` | text | machine code: `name_unavailable`, `price_above_ceiling`, … |
| `notices_sent` | text[] default '{}' | emails already sent for the current name |
| `created_at`, `updated_at` | timestamptz | |

`status`:

```
paid ─┬─ name chosen ───────────► queued ─► purchasing ─► registered ─► active
      └─ « plus tard » ─► awaiting_choice ──(choice)──┘
                    ▲
                    └── name taken at the last moment
failed  ← 5 failures in a row, a price above the ceiling, or no certificate after 48 h
```

A name lost at the last moment is handled two ways:

- **Taken outside**: someone registered it, or Vercel calls it premium. The
  row keeps the name, so the email and the dashboard can say which one was
  lost. Nobody else of ours can want it, since it is gone.
- **Lost to another of our couples** on the unique index: the row gets
  `name = null`, because the name is theirs.

Both set `last_error = 'name_unavailable'`.

- `sites.domain` is dropped in the same migration: one place says what a
  wedding's domain is.
- `(site_id, wedding_id)` references `sites(id, wedding_id)` (composite
  foreign key), so the `wedding_id` that RLS filters on can never disagree
  with the site the resolver serves. The SQL name check also refuses `--`,
  matching the TS rule.
- Hardening added in `20261002130000_custom_domains_hardening.sql`, because
  the first migration was already applied locally and applied migrations are
  never edited.
- **RLS**: the couple can `select` its own rows (through `weddings.user_id`);
  no `insert`/`update`/`delete` policy. Every write goes through the service
  role, after the server has checked ownership.
- `resolve_custom_domain(p_host text) returns table(live boolean, slug text, languages text[])`:
  `security definer`, `search_path = public`, executable by `anon`, matching
  `p_host` with any leading `www.` removed. Modelled on
  `resolve_wedding_code`. It returns:
  - no row for a host it does not know;
  - `live = false` with a null slug for a known domain that is not `active`,
    or whose site is not `published`;
  - `live = true` with the slug and languages otherwise.
- `claim_custom_domain(p_id uuid)` and `claim_due_custom_domains(p_limit int)`:
  `security definer`, `service_role` only. They set
  `locked_until = now() + 2 minutes` on rows in `queued | purchasing |
  registered` whose `next_attempt_at <= now()` and whose lease has expired, and
  return them. The time is the database's own.
- `shared/types/supabase.ts` is regenerated.

### D3 — Checkout

**Store** (`use-order-store.ts`): `domain: { label: string; later: boolean;
years: number }`, added to every hand-written reset (`completeOrder`,
`resetStore`).

- The store holds no wedding date, only a *translated* month label. `years`
  is therefore computed by the pages that have the localised months — Options
  and Checkout — with a `weddingDateFrom(info, localisedMonths)` helper.
  That helper is extracted from the checkout's `toWeddingIdentity` and
  `monthIndexFrom` so both pages share it.
- `selectTotalPrice` passes `domain.years` to `computeOrderTotal`.
- The server stays the authority. The amount the checkout shows for payment
  is the one `create-payment-intent` returns.

**Options step.** Each extra card is a `<button>` today, and a text field
cannot sit inside a button. The custom-domain card therefore becomes a header
button (the toggle) with a sibling panel. It spans both grid columns while
open. The panel opens with the height-auto pattern of
`theme-mediterranean-classy/FaqSection.tsx` (`AnimatePresence`,
`useReducedMotion`). The panel contains:

- a field for the label, with a fixed `.com` after it, pre-filled from the
  first word of each partner's name joined by the locale's word for "and"
  (`sophie-et-pierre`, `sophie-and-pierre`), held in the messages under
  `CustomDomain.connector`. Names that produce no Latin characters leave the
  field empty. The field and the `.com` are always `dir="ltr"`, including in
  `ar`;
- availability shown while typing (debounced 400 ms): « disponible », or
  « déjà pris » with up to 3 alternatives that are available
  (`{a}-et-{b}-{year}`, `mariage-{a}-{b}`, `{a}{b}`);
- « Je choisirai plus tard » sets `later` and collapses the field;
- the card's price: « 65 € », or « 85 € — 2 ans, votre mariage est dans
  14 mois »;
- below the field: « Vérifiez l'orthographe : un nom acheté ne peut plus être
  modifié. »

**Label rules** (`shared/lib/custom-domain.ts`, pure):
1. Strip what a couple pastes: a leading `http(s)://`, a leading `www.`, and
   a trailing `.tld`.
2. `NFKD`, so full-width letters and ligatures such as `ﬁ` decompose.
3. Transliterate what NFKD does not decompose: æ→ae, œ→oe, ß→ss, ø→o, ł→l,
   đ→d, þ→th, ı→i.
4. Strip diacritics and lowercase.
5. Turn spaces, apostrophes, underscores, dots and Unicode dashes
   (U+2010–2015) into `-`.
6. Drop anything outside `a-z0-9-`, collapse repeated hyphens, trim hyphens.

A label is valid when it has 3–63 characters and contains no `--` (which also
excludes punycode `xn--`). The couple never types the TLD.

**Availability endpoint**: landing `POST /api/custom-domains/check`
`{ label }` → `{ name, available, alternatives }`. It normalises the label,
builds the name and the alternatives, and makes **one** call to Vercel's public
search. It keeps only `.com` names that are available, not `premium`, and at or
under the price ceiling (D5). Answers are cached in memory for 60 s per name.
The dashboard calls the same shared function server-side.

**Our own rows count as taken.** Vercel's search knows nothing about names
another of our couples has reserved (`queued`, `purchasing`, or `failed`).
Every availability check therefore also asks
`custom_domain_name_taken(name)` — a service-role-only SQL function — and
treats a match as taken. This applies to the studio endpoint, the payment
route and `chooseCustomDomain`. The payment route bypasses the 60 s cache
(`maxAgeMs: 0`), so the check made right before money is taken is a fresh
one.

**Payment intent** (`create-payment-intent/route.ts`), when `extras` contains
`custom-domain`:

1. `years = domainYearsFor(weddingInfo.weddingDate, now)`; the amount includes
   `domainPrice(years)`.
2. If a label was given (not `later`): validate it, then check availability.
   **Taken → 409 `{ domainUnavailable: true }`**: the checkout shows « Ce nom
   vient d'être pris » with a link back to the options step, before any money
   is taken. If Vercel's search cannot be reached, the order goes through
   (logged): D5 falls back to `awaiting_choice` if the name turns out to be
   taken.
3. Metadata gains `domain_years` and, when chosen, `domain_name`.

**Clearing keys on reprice.** Stripe merges metadata on update, and
`buildOrderMetadata` omits empty keys. A couple who switches from a name to
« plus tard » would otherwise keep the old `domain_name` on the intent, and
provisioning would buy a name they dropped. So the repricing update sends
`""` for every key the existing intent has and the new metadata lacks.
Stripe deletes a key set to an empty string. This also fixes the same latent
issue for the other optional keys.

**The checkout's 409.** Today every error from the route is shown as plain
text through `setFetchError`. `domainUnavailable` gets its own branch, which
shows the message with a link back to `/studio/options`.

The recap line: « Nom de domaine — sophie-et-pierre.com, 2 ans », or « à
choisir plus tard ».

**Provisioning** (`createWedding`):

- `verifyPaymentForOrder` retrieves the intent **before** computing the
  expected total, and computes it with `domainYears` from the intent's
  metadata. It returns `{ domainName, domainYears, hasDomain }`, read from that
  metadata — never from the browser's payload.
- After the site is created, if `hasDomain`: insert into `custom_domains`
  (`queued` with the name, or `awaiting_choice` without it),
  `on conflict (site_id) do nothing`. If the insert loses on the unique `name`
  (another couple took it between check and payment), insert again with
  `name = null`, `awaiting_choice`, `last_error = 'name_unavailable'`.
- Then `after(() => advanceCustomDomain(id))` — the couple's redirect to the
  dashboard never waits on Vercel.
- The webhook path runs the same code (it calls `createWedding`), so it needs
  nothing more.

### D4 — Dashboard: choose later, or buy after the sale

A « Nom de domaine » block. Where it sits is decided on the mock-up, not here.

| Row state | The block shows |
|---|---|
| no row | the picker, the price of the day (D1 with `weddings.wedding_date`), « Acheter — 85 € » |
| `awaiting_choice` | the picker, « Choisir ce domaine »; if `last_error = name_unavailable`, « sophie-et-pierre.com a été pris entre-temps, choisissez-en un autre » (without the name when it is null) |
| `queued`, `purchasing`, `registered` | « Activation en cours — quelques minutes » |
| `active` | the link, « Actif jusqu'au 14/03/2028 » |
| `failed` | « Un souci technique est survenu, nous nous en occupons » (the studio has been alerted) |

**Choosing** (`chooseCustomDomain(label)`, server action): `requireWedding()`;
the row must be `awaiting_choice`; validate and check availability; then, with
the service role, set `name`, `status = 'queued'`, `attempts = 0`,
`next_attempt_at = now()`, `last_error = null`, `notices_sent = '{}'`. A unique
violation answers « Ce nom vient d'être réservé ». The scheduled job picks the
row up within 5 minutes. The dashboard never calls Vercel's authenticated API.

**Buying** follows the module add-on pattern
(`2026-09-28-dashboard-module-purchase-design.md`, D4–D7):

- `shared/lib/domain-addon.ts`: builds, parses and checks the metadata —
  `kind=domain_addon`, `wedding_id`, `site_id`, `user_id`, `domain_name`,
  `domain_years`, `amount_cents`, `email`, `first_name`, `last_name`,
  `partner_name`, `locale` — and exports `isDomainAddOn`. No `plan` key, so
  the webhook never mistakes it for a checkout.
- `startDomainPayment(label)`: there must be no row for the site; computes the
  years from `weddings.wedding_date` and today; checks availability; finds or
  creates the Stripe customer by the account's email; reuses an open intent
  for the same site, name and amount; else creates one.
- `completeDomainPayment(intentId)` (fast path) and the landing webhook's
  `fulfilDomainAddOn` (safety net, routed before the checkout path as
  `isModuleAddOn` is) both check: `succeeded`, `kind`, `site_id` is the
  couple's, `currency = eur`, and
  `amount_received === amount_cents === domainPrice(domain_years) × 100`.
  Then they insert the `queued` row, with the same lost-name fallback as D3.
  Only the webhook writes `billing` and issues the invoice.
- A second payment for a site that already has a row (two tabs) is refunded by
  the webhook before any invoice, logged `[DOMAIN_DOUBLE_PAYMENT]`.

### D5 — The purchase engine

`landing/src/lib/custom-domains/`:

- `vercel-registrar.ts`: a thin client. Search, availability, price, buy,
  order, domain info, add a project domain, check a project domain. It reads
  `VERCEL_API_TOKEN`, `VERCEL_TEAM_ID` and `VERCEL_LANDING_PROJECT_ID`, and
  takes `fetch` as a parameter so tests can replace it.
- `advance.ts`: `advanceCustomDomain(id)` claims the row
  (`claim_custom_domain`), performs **one** step, writes the result and
  releases the lease. A row that cannot be claimed — someone else is on it, or
  it is not due — is left alone.

**Triggers**
- `after()` right after provisioning, as in D3.
- `GET /api/cron/custom-domains` every 5 minutes. A Vercel cron in the landing
  project's `vercel.json`, refused without `Authorization: Bearer $CRON_SECRET`.
  It advances up to 10 due rows (`claim_due_custom_domains`) and sends the
  time-based emails.

**Steps**

| Status | Step |
|---|---|
| `queued` | 1. `GET /v5/domains/{name}`: 200 → already ours → `registered` (no purchase). 2. Search the name: unavailable or `premium` → `awaiting_choice`, `last_error = 'name_unavailable'`, name kept (D2). 3. `GET …/price?years={years}`: `purchasePrice / years` above the ceiling → `failed`, `price_above_ceiling`. 4. Write `status = 'purchasing'`, `purchase_started_at = now()`, **then** call buy (`autoRenew: false`, `years`, `expectedPrice = purchasePrice`, the studio's contact) and store `vercel_order_id`. A buy answering 400 `domain_not_available` → `awaiting_choice` as in step 2. `expected_price_mismatch` → back to `queued`, to re-quote. |
| `purchasing` | No `vercel_order_id` (the process died between the write and the answer): wait until `purchase_started_at + 30 min`. Then `GET /v5/domains/{name}`: 200 → `registered`, else back to `queued`. With an order id, read the order and our domain's entry: `completed` → `registered`, with `registered_at` and `expires_at` from `GET /v5/domains/{name}`. `failed` with `unavailable-legal` → `awaiting_choice` as above. `failed` otherwise, `refunded` or `refund-failed` → `failed` with the code, studio alert. `draft`, `purchasing` or `pending` → look again in 2 minutes. |
| `registered` | `POST /v10/projects/{id}/domains` for `name`, then for `www.name` with `redirect: name, redirectStatusCode: 308`. On any 400 or 409, read back `GET /v9/projects/{id}/domains/{name}`; a 200 counts as attached. `active` only when `https://name/` completes a TLS handshake and answers within 10 s, whatever the HTTP status (it is a 404 until the row is `active`, D6). Until then, look again in 5 minutes. After 48 h without a certificate → `failed`. |

- **The cron**: `landing/vercel.json`, `*/5 * * * *`. It runs on production
  deployments only, so a preview deployment is advanced by `after()` alone.
  An end-to-end test on a preview must call the cron route by hand, with the
  secret. Overlapping or duplicated runs are harmless because of the lease.
- **Price ceiling**: `DOMAIN_MAX_USD_PER_YEAR = 15`, applied by both the
  availability check (search's 1-year `price`) and the engine
  (`purchasePrice / years`). A Vercel price increase stops purchases
  and alerts the studio instead of eroding the margin unnoticed.
- **The lease is owned.** A claim mints a fresh `lease_token`, sets
  `locked_until`, increments `claims_since_progress` and returns the row.
  - Every write the engine makes carries `where id = $1 and lease_token = $2`.
  - The write-ahead marker before a buy also requires `status = 'queued'`.
  - A write that matches no row means the lease was lost to another run: the
    step stops without acting.
  - Every Vercel call has a 20 s timeout, far under the 2-minute lease.
  - A claim that finds `claims_since_progress >= 3` (a step that keeps
    killing its process) marks the row `failed` and alerts the studio, so it
    cannot loop forever.
- **Failures**: a thrown error increments `attempts` and sets
  `next_attempt_at` to +2, +10, +30, +120 then +360 minutes. The fifth failure
  → `failed`. Waiting for a certificate or for an order is not a failure.
- **Every `failed` emails the studio** (`CONTACT_NOTIFY_TO`) with the row id,
  name, status and `last_error`.
- **Emails to the couple**, each sent once per name, in French like the
  welcome email, through Resend:
  - `active` — « Votre domaine sophie-et-pierre.com est en ligne »;
  - `name_unavailable` — « sophie-et-pierre.com a été pris, choisissez-en un
    autre » with a link to the dashboard block;
  - `reminder` — sent by the cron once, 7 days after `status_changed_at` on an
    `awaiting_choice` row.

  **Each email is claimed before it is sent**: one SQL update appends its
  code to `notices_sent` only if it is absent. Only the caller whose update
  changed the row sends, and a failed send removes the code again so the next
  run retries. Two overlapping runs therefore cannot send it twice.
- **Registrant**: the studio.
  - From existing variables: `COMPANY_LEGAL_NAME` (as `companyName`),
    `COMPANY_ADDRESS`, `COMPANY_POSTAL_CODE`, `COMPANY_CITY`,
    `COMPANY_COUNTRY` and `COMPANY_PHONE` (E.164).
  - New variables: `COMPANY_DOMAINS_EMAIL`, `COMPANY_REGION` (Vercel's
    required `state`, e.g. « Île-de-France ») and
    `DOMAIN_REGISTRANT_FIRST_NAME` / `DOMAIN_REGISTRANT_LAST_NAME`. Vercel
    requires a person's name even with a company.
  - If any is missing, the engine refuses to buy and alerts the studio rather
    than sending an incomplete contact.

### D6 — Routing a couple's domain (`landing/src/proxy.ts`)

- **Our own hosts** — the host of `NEXT_PUBLIC_SITE_URL` and its `www.`,
  `localhost`, `127.0.0.1`, `*.vercel.app` — keep today's behaviour exactly,
  with no database call added.
- **Any other host** is resolved with `resolve_custom_domain` (anon key, no
  cookies):
  - **unknown** → today's behaviour. This fails open on purpose: an alias of
    the shop we forgot to list must not 404 the whole site. It opens nothing,
    because Vercel only routes hosts attached to the project;
  - **known, not live** → 404;
  - **live** → the table below.

  Answers are cached in memory: 60 s for a live domain, 10 s otherwise. A
  domain that has just gone live is therefore reachable in seconds, for the
  couple clicking the « en ligne » email straight away.
- `mapCustomDomainPath(pathname, { slug, languages, locales })` — pure,
  exported for tests — returns a rewrite target, a redirect, or not-found:

  | Path on the couple's domain | Result |
  |---|---|
  | `/` | rewrite → `/{languages[0]}/invitation/{slug}` |
  | `/{L}` with `L` bought | rewrite → `/{L}/invitation/{slug}` |
  | `/{L}` with `L` a locale not bought | redirect → `/` |
  | `[/{L}]/jourj`, `/jourj/ma-table`, `/jourj/menu`, `/jourj/photos` | rewrite → `/{L}/jourj/{slug}/…` |
  | anything else — the shop, the studio, the journal, `/invitation/<other>` | 404 |

  A locale prefix the couple did not buy redirects to the same path without
  it, on every row (`/ja/jourj/menu` → `/jourj/menu`). An empty `languages`
  (weddings sold before languages were recorded) uses the default locale.
- **The rewrite's request headers.** Overriding request headers replaces
  *all* of them, so the rewrite starts from `new Headers(request.headers)` and
  sets:
  - `X-NEXT-INTL-LOCALE: {L}`: next-intl 4.8 reads the locale from this
    header (or `setRequestLocale`), never from the `[locale]` segment. Without
    it, the page silently renders in French;
  - `x-pathname`: the **rewritten** path (`/en/invitation/{slug}`). The root
    layout derives `<html lang>` and `dir` from it, so without it `ar` loses
    RTL;
  - `x-custom-domain: <host>` and `x-custom-domain-base`, the prefix of the
    current locale on that domain: `""` for the default language, `/en`
    otherwise.

  On our own hosts the proxy deletes any client-sent `x-custom-domain` and
  `x-custom-domain-base` before going on.
- **404 on a couple's domain** — a known domain that is not live, or a path
  outside the table — is answered by the proxy itself, with a minimal page.
  It never falls through to `[locale]/not-found.tsx`, whose `NotFoundView`
  carries the shop's menu, language switcher and studio links.
- **Shop chrome hidden.** `ContactBubble` and `CookieConsent` hide themselves
  by URL prefix (`/invitation/`, `/jourj/`), which a couple's domain does not
  have (`/`, `/jourj`). Where they are mounted, they are not rendered when
  `x-custom-domain` is present.
- Maintenance mode never applies on a couple's domain.
- **Clean links**: the invitation page's language redirect, the Jour J page's
  links and `GuestNav` build their paths through one helper.
  - On a couple's domain it returns `{x-custom-domain-base}/jourj/ma-table`,
    rendered with `next/link`. next-intl's `Link` always re-adds the locale
    (`localePrefix` is `'always'`), so it is not used there.
  - On the generic link the helper keeps today's paths and next-intl's `Link`.
  - `GuestNav` is a client component, so its layout reads the headers and
    passes the base down.
- **Unchanged and working**: server actions (the Origin and Host are the same
  domain); the guest-code cookie, which is per host — a guest types the code
  once more on the new domain; `noindex` on invitations; `/_next`, `/api` and
  files in `public/`, which the matcher already excludes.
- **The generic link stays valid and does not redirect** to the domain.
  Invitations already sent keep working, and an expired domain breaks nothing
  there.
- **To check first in implementation**: the rewrite returns directly instead
  of going through `intlMiddleware`, so that next-intl does not redirect or
  re-prefix it. The first routing task proves that `/en` on a couple's domain
  renders in English, and `/ar` with `<html dir="rtl">`.
- The proxy becomes `async` to await the lookup. It uses a new cookie-less
  anon client, `landing/src/lib/supabase-anon.ts`, built like
  `supabase-admin.ts` but with the anon key. `utils/supabase/server.ts` reads
  `cookies()` and cannot run there.

### D7 — Where the domain shows in the dashboard

- `InvitationPreviewCard` shows `https://name` once `active`; otherwise the
  generic link and « Domaine en cours d'activation » when a row exists.
- The Jour J QR code (`jour-j/qr-code/page.tsx`) points to
  `https://name/jourj` once `active`. It is safe to print: the domain is
  covered until the wedding + 3 months.
- The « Nom de domaine » block of D4.

### D8 — Security

- Couples read their row and never write it. Every write goes through a server
  action or the engine, using the service role after an ownership check.
- `anon` can only execute `resolve_custom_domain`. It reveals the slug of an
  `active`, `published` domain — exactly what visiting that domain reveals —
  and, for any other known domain, only that it exists.
- Only Vercel sends a host to the deployment, and only for domains attached to
  the project, so a spoofed `Host` header shows nothing that host would not.
  That is also why unknown hosts can safely fall through to the normal site.
- `VERCEL_API_TOKEN` is team-scoped and lives in the landing's server
  environment only. The cron is protected by `CRON_SECRET`.
- Spending is bounded by the price ceiling, by `expectedPrice`, by a single
  row per site, and by the couple having paid `domainPrice(years)` for exactly
  the years bought.

## Components

| Unit | Does | Depends on |
|---|---|---|
| `shared/lib/pricing.ts` | `domainYearsFor`, `domainPrice`, the total | — |
| `shared/lib/custom-domain.ts` | label rules, suggestions, name building | — |
| `shared/lib/domain-search.ts` | public availability search with filters and cache | Vercel public API |
| `shared/lib/domain-addon.ts` | add-on metadata build/parse/check, `isDomainAddOn` | Stripe types |
| migration `…_custom_domains.sql` | table, RLS, `resolve_custom_domain`, claim functions, drop `sites.domain` | — |
| landing `lib/custom-domains/vercel-registrar.ts` | authenticated Vercel calls | Vercel API |
| landing `lib/custom-domains/advance.ts` | the step engine and its emails | the two above, Resend |
| landing `api/cron/custom-domains` | due rows and reminders | `advance.ts` |
| landing `api/custom-domains/check` | availability for the studio | `domain-search.ts` |
| landing studio options + checkout | panel, store, recap, 409 handling | the shared libs |
| landing `create-payment-intent`, `verify-payment`, `create-wedding`, `order-metadata`, `invoice-lines` | years, metadata, row creation, invoice line | pricing |
| landing `lib/wedding-date.ts` | `weddingDateFrom(info, localisedMonths)`, extracted from the checkout | — |
| landing `lib/domain-invoice-line.ts` | the domain's invoice line (testable, no `fr.json` import) | pricing |
| landing `lib/supabase-anon.ts` | cookie-less anon client for the proxy | `@supabase/supabase-js` |
| landing `proxy.ts` + `lib/custom-domain-routing.ts` | host resolution, `mapCustomDomainPath`, rewrite headers, minimal 404 | `resolve_custom_domain` |
| landing layout mounting `ContactBubble` / `CookieConsent` | not rendered on a couple's domain | `x-custom-domain` |
| landing guest link helper, `GuestNav`, Jour J page, invitation page | clean links | `x-custom-domain` |
| landing webhook | `fulfilDomainAddOn`, double-payment refund | `domain-addon.ts` |
| dashboard `custom-domain-actions.ts` | `chooseCustomDomain`, `startDomainPayment`, `completeDomainPayment` | shared libs |
| dashboard « Nom de domaine » block, preview card, QR code | display and picker | the actions |
| messages ×9 (landing and dashboard) | every new string | — |

## Error handling

| Situation | Behaviour |
|---|---|
| Name taken before payment | 409 at intent creation, nothing charged, the couple picks another |
| Name taken between payment and purchase | `awaiting_choice`, email, the couple picks another for free |
| Two couples pay for the same name | the second row loses on the unique index, `awaiting_choice`, same email |
| Vercel search unreachable at checkout | the order goes through; the engine falls back if needed |
| Vercel API down during purchase | retries at +2, +10, +30, +120, +360 min, then `failed` + studio alert |
| Process dies after the buy call | `purchasing` without an order id; the account is checked after 30 min before any new purchase |
| `.com` price above 15 $/year | `failed`, `price_above_ceiling`, studio alert; nothing bought |
| Certificate not issued after 48 h | `failed`, studio alert |
| Registrant variables missing | no purchase, studio alert |
| Couple never chooses | one reminder at 7 days; the row waits |
| The shop served on a host we did not list | treated as unknown: the normal site, not a 404 |
| Two cron runs overlap | rows are leased and emails claimed, so each step and each email happens once |
| Two tabs pay the dashboard add-on | the second payment is refunded before its invoice |

## Testing

- **Unit (`npm test`)**:
  - `domainYearsFor`: no date, a past date, exactly 9 months, 9 months + 1 day,
    21 months, 40 months (4 years), 12 years (capped at 10), the 29 February;
  - `domainPrice` and `computeOrderTotal` with the domain at 1, 2 and 4 years;
  - label normalisation (accents, apostrophes, spaces, length) and suggestions;
  - checkout and add-on metadata round-trip; `isDomainAddOn` against a checkout
    intent and a module add-on;
  - `advanceCustomDomain` against a fake registrar, one test per row of D5:
    already owned, premium, above the ceiling, the buy call answering, the
    process dying before the order id, completed, failed for availability,
    failed otherwise, five failures, certificate pending then answering, 48 h
    without a certificate, a row that cannot be claimed, an email already
    claimed, a failed send released for retry;
  - `mapCustomDomainPath`: every row of D6's table, including another couple's
    slug and a locale not bought;
  - the host decision: own host, unknown host (falls through), known but not
    live (404), live;
  - the invoice line with and without a name.
- **Database (script against local Supabase)**: one row per site; a name used
  once; the couple can `select` its row and cannot `update` it; `anon` gets
  `live = false` and no slug for a `queued` row or an unpublished site, and no
  row for an unknown host; a second claim while the lease runs returns
  nothing; a second claim of the same email changes nothing; `anon` and
  `authenticated` cannot execute the claim functions. Concurrency is tested
  sequentially: the claim is one `update … returning`, and the repo has no
  harness for two sessions.
- **By hand**:
  - routing: `curl -H "Host: sophie-et-pierre.test" localhost:3010/…` against a
    fake `active` row;
  - UI: **a clickable mock-up of the studio panel and the dashboard block,
    approved before building**, then screenshots at desktop and 375 px in fr,
    de and ar;
  - Stripe test mode end to end, with `stripe listen` forwarding to the
    landing webhook: checkout with a name, with « plus tard », a taken name
    (409), a tab closed after paying, a dashboard purchase, two tabs.
- **One real purchase before opening the option**, on a preview deployment:
  Vercel has no registrar sandbox, so this costs one real `.com` (~10 €).

The dashboard's `.env.local` points at the production database: none of this
is tested from there.

## Out of scope

Renewal and the reminder emails before expiry (next spec — this one records
`expires_at` and buys with `autoRenew: false`, so nothing renews without the
couple paying); extensions other than `.com`; bringing a domain the couple
already owns; email addresses on the domain; transferring a domain to the
couple (by hand, on request); changing a name once bought; redirecting the
generic link to the domain; translated domain emails; a `robots.txt` specific
to couples' domains.

## Before implementation

- Stabilise and commit the dashboard module purchase work: D4 builds on it.
- Vercel: Pro plan, a payment method on the team, a team-scoped token, and the
  production landing project's id and root directory. `vercel-env/` names
  `the-studio-digital-papeterie-landing`, while `landing/.vercel` is linked to
  a project called `landing` — confirm which one serves production, because
  `vercel.json` must sit in its root directory.
- The registrant values: `COMPANY_PHONE` (it exists in `.env.example`, but
  needs a real E.164 value), `COMPANY_DOMAINS_EMAIL`, `COMPANY_REGION`, and
  the person's name for `DOMAIN_REGISTRANT_FIRST_NAME` /
  `DOMAIN_REGISTRANT_LAST_NAME`.
- The CGV: the domain is registered in the studio's name, for a duration tied
  to the wedding date; renewal is paid; a transfer is possible on request.
