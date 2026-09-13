-- Migration: one account, one wedding — enforced by Postgres, not by a read.
--
-- A paid checkout was provisioned twice, 4.4 seconds apart, and the account
-- ended up owning two identical weddings. The dashboard reads the couple's
-- wedding with `.single()` (dashboard/src/lib/db/current-wedding.ts), which
-- throws on a second row, so the whole dashboard 500'd with "Wedding not
-- found" — on an account that had two.
--
-- The race: `payment_intent.succeeded` reached our webhook at 19:40:11, one
-- second BEFORE the browser finished writing the wedding it had already
-- started. The webhook's safety net looks the buyer up by email, found no
-- user yet, concluded the browser had died, and recovered an order that was
-- in fact mid-flight. Browser wrote wedding #1 at 19:40:12; webhook wrote
-- wedding #2 at 19:40:17.
--
-- Three guards were meant to stop exactly this, and all three are reads that
-- happen before the matching write:
--   * `intent.metadata.wedding_id` — stamped by `markPaymentProvisioned`,
--     which runs at the very END of provisioning, ~5s in.
--   * `findUserByEmail` — the webhook's own check, above.
--   * "this account already owns a wedding" — a select in `create-wedding`.
-- Two concurrent runs both read "nothing there" and both proceed. No amount
-- of re-ordering those selects closes the window; only the database can.
--
-- This index is that close. The second insert is refused with 23505 rather
-- than succeeding, and `create-wedding` catches it and returns the wedding
-- the other path created — so a double-fire becomes a no-op instead of a
-- duplicate. It also turns the v1 rule the code asserts in a dozen places
-- ("one account, one wedding") into something the schema actually holds.
--
-- ── When v2 allows several weddings per account ───────────────────────────
-- Drop this index, and at the same time give `requireWedding()` a way to
-- pick WHICH wedding is current — a selector, the choice carried in the
-- session or the URL. Around 25 call sites resolve the wedding with
-- `.single()`; they start throwing the moment a legitimate second row
-- exists. See the vault note "Provisioning et Facturation".

create unique index if not exists weddings_one_per_user
  on public.weddings (user_id);

comment on index public.weddings_one_per_user is
  'One account, one wedding (v1). The last line of defence against a '
  'double-provisioned checkout: the guards in create-wedding.ts are reads '
  'that can both miss under a race, this cannot. Lifting it for v2 means '
  'teaching requireWedding() to choose a current wedding first.';
