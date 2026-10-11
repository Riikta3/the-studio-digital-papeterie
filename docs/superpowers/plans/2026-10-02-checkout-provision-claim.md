# Checkout provisioning claim — stop refunding a legitimate order

**Problem (seen live on 2026-10-02):** `createWedding` refunds a second
purchase when the account already owns a wedding (the `DUPLICATE_PURCHASE`
guard). It never asks whether that wedding was created **by this same
payment**, so it misfires in two cases.

1. **The race.** Two provisioning passes run for one PaymentIntent: the
   browser, plus the webhook that rescues a dead browser. The second pass
   lands between the first pass creating the wedding and stamping the intent
   with `wedding_id`. It sees "account already has a wedding" and refunds the
   order it is provisioning. A local test reproduced it: 284 € refunded on a
   provisioned order.
2. **A failed stamp.** `markPaymentProvisioned` fails, and the error is
   tolerated. On the next reload of the success page, `alreadyProvisionedAs`
   is empty, provisioning runs again, and the guard refunds the couple's own
   payment.

**Fix: claim the PaymentIntent before creating anything.**
- A new service-role-only table `checkout_provisions`:
  - `payment_intent_id text primary key`;
  - `wedding_id uuid null references weddings(id) on delete set null`;
  - `claimed_at timestamptz not null default now()`;
  - `updated_at timestamptz not null default now()`.
- RLS is enabled with no policy. `revoke all … from anon, authenticated`.

**In `createWedding`**, after `verifyPaymentForOrder` succeeds and before
any user or wedding work:
1. `insert … on conflict do nothing returning`. If it inserted, this pass
   owns the intent: go on as today, and right after the wedding insert, set
   `wedding_id` on the claim. The `DUPLICATE_PURCHASE` guard stays, and now
   only fires for a genuinely different payment.
2. If it did not insert, read the claim:
   - `wedding_id` set → adopt that wedding: the same answer as the
     `alreadyProvisionedAs` branch (login link, domain-row heal). Never
     refund.
   - `wedding_id` null and `claimed_at` older than 5 minutes → the other pass
     died. Take over with a conditional update
     (`where claimed_at = <the value read>`) and proceed as owner.
   - `wedding_id` null and fresh → another pass is working. Poll the claim
     server-side, every 1 s for up to 8 s, then adopt if `wedding_id`
     appears. Otherwise return a retryable `{ success: false, inProgress: true }`.
     The webhook throws on it, so Stripe retries; the browser shows its
     existing "please wait / retry" path. Check what the checkout does with a
     `success:false` result and make it retry once after 3 s when
     `inProgress`.

**Files:**
- `supabase/migrations/20261002170000_checkout_provisions.sql` (timestamp
  after `20261002150000`; apply with `--include-all`);
- `supabase/tests/checkout_provisions.sql`;
- `shared/types/supabase.ts`;
- `landing/src/actions/create-wedding.ts`;
- a pure helper `landing/src/lib/provision-claim.ts` + test, to decide
  owner / adopt / take over / wait;
- `landing/src/app/api/webhooks/stripe/route.ts` (throw on `inProgress`);
- the checkout page's handling of `inProgress`.

**Verification:**
- unit tests for the helper;
- SQL tests: privileges, uniqueness, conditional take-over;
- the live race reproduced in Node, like the wiring check: two concurrent
  passes for one test-mode intent → one wedding, **no refund**;
- a genuine second purchase (another intent, same account) → still refunded.

**Constraints:** no `db push` and no commit without the user's go-ahead.
Stripe test mode only.

## Review round (2026-10-02)

A review found gaps the claim alone left open. Fixed:

1. **The wedding names its payment.** `weddings.payment_intent_id text unique`
   (`weddings_payment_intent_id_key`), written by the wedding insert itself.
   The `DUPLICATE_PURCHASE` guard adopts a wedding that carries this payment
   (records it on the claim, stamps the intent, heals the domain row) and
   refunds only when the account's wedding belongs to another payment or has
   none (older weddings). The insert's 23505 is classified by constraint name
   (`weddingInsertConflict` in `provision-claim.ts`): `payment` → this
   payment's wedding, adopted; `account` → the winner's `payment_intent_id`
   decides, adopt or refund. Trigger `weddings_payment_intent_id_server_only`
   refuses any write that sets or changes the column when `current_user` is
   `anon` or `authenticated`. Checked on the local stack: a PostgREST request
   with the service key runs as `current_user = service_role`
   (`session_user = authenticator`), the anon key as `anon`.
2. **Half-built weddings are deleted, not adopted.** A settings or site
   failure deletes the wedding (all 23 foreign keys to `weddings` cascade; the
   claim's is `on delete set null`), then releases the claim. A failed delete
   logs `[PROVISION_HALF_BUILT]` with the wedding id. The next pass reuses the
   account; an existing account without a wedding now gets its profile written
   if missing (`ignoreDuplicates`), because a first pass whose profile upsert
   failed used to leave an account every later pass failed on (FK violation).
3. **The webhook asks about the payment.** `weddingOfPayment`: the wedding
   carrying the intent, else the claim's wedding, else a fresh copy's stamp
   naming an existing wedding, else (only) an account wedding with a null
   `payment_intent_id`. Provisioned also requires that wedding's site.
   `provisionFromPaymentIntent` passes `duplicatePurchase` through; the
   webhook then writes no billing row, no invoice, runs no domain pass, logs
   `[DUPLICATE_PURCHASE]` and answers 200. Before billing, a fresh read of the
   intent skips a payment carrying `refunded_reason` (the event's copy dates
   from the payment). `issueInvoiceForPayment` has one caller here and is only
   reached after that check.
4. **Migration renamed** `20261002220000_checkout_provisions.sql` (after
   `20261002200000_contact_new_collections.sql`), now also holding the column
   and the trigger. Local database: table dropped,
   `migration repair --status reverted 20261002170000 --local`,
   `migration up --local`; `schema_migrations` lists `20261002220000`, not
   `170000`. Types: only the `weddings` block changed by hand (the generated
   `checkout_provisions` block was identical).

Nits: `CLAIM_STALE_MS` is 10 minutes (Vercel's default limit is 300 s); an
adopted wedding must have its site (`ClaimStore.siteOf`), otherwise the pass
keeps polling within the same 8 s and answers `inProgress`, with no heal and
no stamp; the pre-insert block gives the claim back on any exit; the SQL
"lands even if released" case now deletes the row first, plus uniqueness and
trigger tests; the misplaced JSDoc sits on `adminClaimStore`.

**Deviations**
- `try/finally` with a "reached the insert" flag rather than `try/catch`: it
  covers the returns as well as the throws, so all four scattered `release()`
  calls of that block went (each sat immediately before a return of it).
- An `account` conflict whose winner belongs to another payment now refunds,
  like the guard. It used to adopt that wedding and keep both charges.
- The guard finding this payment's wedding without a site deletes and
  rebuilds it (`[PROVISION_REBUILD]`): this pass holds the claim, so its
  builder is gone. A lost insert race instead answers `inProgress` and keeps
  its claim, since that builder is alive.
- The webhook's provisioned check requires the site, and checks the refund
  marker before billing; neither was asked for.
- `createWedding` has an explicit `CreateWeddingResult` type: answers built by
  helpers defeated TypeScript's union normalisation, and the checkout page
  stopped compiling.

**Known limits (not fixed)**
- A pass killed between recording its wedding on the claim and inserting the
  site, or a failed delete (`[PROVISION_HALF_BUILT]`), leaves a claimed
  wedding without a site. Every later pass answers `inProgress`, the webhook
  keeps throwing: a human deletes the wedding. Repairing it from an adopter
  once the claim is stale would close it.
- A second purchase on an account whose wedding predates the column counts as
  provisioned through the legacy fallback. If the webhook books it before the
  browser's refund lands it is billed and invoiced, and if the browser died it
  is never refunded (as before this change). Backfilling
  `weddings.payment_intent_id` would close it.

**Verification**: unit tests 19/19; `npm test` 569/569; `tsc` landing and
dashboard clean; eslint only the three older `no-explicit-any`; both SQL test
files pass, and two mutants (trigger dropped, unique dropped) fail them.
Behaviour checks in Node against the local database, 70/70: Stripe reads were
real (the three existing test intents A, B, E), every Stripe write was stubbed
(intent updates, refunds), failures injected in a wrapped admin client.
Covered: concurrent passes (one wedding, `payment_intent_id` set, no refund);
a stale wedding-less claim and a missing claim over this payment's wedding
(adopted, no refund); a genuine second payment (one refund call; the webhook
books nothing, also with a pre-change account wedding); settings, site and
profile failures (deleted, released, rebuilt complete), a failed delete
(`[PROVISION_HALF_BUILT]`), a stale claim over a half-built wedding (rebuilt);
an adopt while the owner had no site (no heal, no early stamp; `inProgress`
when it never comes). Local database back to its starting counts afterwards.
