-- Let a customer's account be deleted without destroying their invoices.
--
-- `20260313100000_cascade_delete_user.sql` gave `profiles`, `weddings` and
-- `billing` an `on delete cascade` so that removing an `auth.users` row takes
-- its data with it. `invoices` was created later (20260910120000) with a plain
-- `references auth.users not null` and never got the same treatment, so today
-- deleting any customer who has actually paid fails on a foreign key
-- violation. The couple asks to be erased and the deletion simply errors.
--
-- ── Why not cascade ───────────────────────────────────────────────────────
--
-- Because an invoice is not the customer's data to erase. It is an accounting
-- record the seller is required to keep (in France, ten years under art.
-- L123-22 of the code de commerce), and the GDPR's own erasure right yields to
-- a legal retention obligation. Cascading would trade one compliance problem
-- for a worse one.
--
-- `set null` keeps the document and drops the link to the account. The rows
-- stay readable on their own: `customer_email`, `customer_name`, the amounts
-- and `invoice_number` all live on the invoice itself rather than being joined
-- from `profiles`, so a detached invoice is still a complete record. What is
-- lost is only the ability to list it under a user id — which is what erasing
-- the account is supposed to mean.
--
-- Note this does NOT by itself erase the personal data on the invoice rows.
-- Doing that is a separate decision — the retention obligation runs out
-- eventually, and the honest implementation is a dated purge, not a cascade.
-- The audit note records it as open.

-- `set null` requires the column to accept null; it is `not null` today.
alter table public.invoices
  alter column user_id drop not null;

alter table public.invoices
  drop constraint if exists invoices_user_id_fkey,
  add constraint invoices_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete set null;

comment on column public.invoices.user_id is
  'The account the invoice was issued to, or null once that account has been '
  'deleted. Nullable on purpose: the invoice is a retained accounting record '
  'and outlives the account, so deletion detaches it rather than removing it. '
  'customer_email and customer_name keep the row meaningful on its own.';

-- The select policy is `auth.uid() = user_id`, which no longer matches once
-- user_id is null — so a detached invoice becomes invisible to every signed-in
-- user while remaining readable through the service role, which is how the
-- billing screen and the invoice PDFs are served anyway. That is the intended
-- outcome: nobody's dashboard should list an erased customer's invoice.
