-- Checkout provisioning: which pass builds the wedding a payment bought, and
-- which payment a wedding belongs to.
-- docs/superpowers/plans/2026-10-02-checkout-provision-claim.md
--
-- Two passes provision a paid checkout: the buyer's browser, and the
-- `payment_intent.succeeded` webhook rescuing a browser that died. Both used to
-- recognise "already done" only by `wedding_id` on the PaymentIntent, stamped
-- at the very end. A pass landing between the wedding insert and that stamp,
-- or a reload after the stamp failed, found an account that already owned a
-- wedding and refunded it as a second purchase: the couple's own order, with
-- the wedding still built. Seen live on 2026-10-02.
--
-- Two records close it, each for one side of the wedding insert:
-- 1. `checkout_provisions`: `createWedding` claims the PaymentIntent here
--    before creating anything. The pass whose insert lands owns the order;
--    every other pass waits for it, adopts its wedding, or takes over a claim
--    whose owner died before creating one. It covers the passes in flight.
-- 2. `weddings.payment_intent_id`: the wedding names its payment in the very
--    insert that creates it. A claim that never learnt of its wedding (the
--    record failed, or the owner died right after the insert) can then no
--    longer make the order look like a second purchase: the refund only fires
--    for an account whose wedding belongs to another payment, or to none.
--
-- Timestamped after 20261002200000_contact_new_collections.sql, which was
-- applied before this one. It replaces 20261002170000_checkout_provisions.sql,
-- applied to a local database only and never pushed.

-- 1. The claim ------------------------------------------------------------------

create table public.checkout_provisions (
  payment_intent_id text primary key,
  wedding_id uuid references public.weddings(id) on delete set null,
  claimed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The foreign key's own lookup, when a wedding is deleted.
create index checkout_provisions_wedding_id_idx
  on public.checkout_provisions (wedding_id);

comment on table public.checkout_provisions is
  'One row per PaymentIntent a checkout pass has started provisioning. The '
  'pass whose insert (on conflict do nothing) returned the row owns the '
  'order; the others adopt wedding_id once its site exists, wait for it, or '
  'take over a claim with no wedding older than 10 minutes. Written only by '
  'the service role (landing/src/actions/create-wedding.ts). There is no '
  'updated_at trigger in this repo: every writer sets updated_at itself.';
comment on column public.checkout_provisions.payment_intent_id is
  'The Stripe PaymentIntent (pi_...) being provisioned. The primary key is '
  'the claim: one owner per payment.';
comment on column public.checkout_provisions.wedding_id is
  'The wedding this payment produced, recorded right after the wedding '
  'insert, before the rest of provisioning and before Stripe is stamped. '
  'Null while the owner has not created it yet; set back to null if the '
  'wedding is deleted (a half-built wedding is, so the next pass rebuilds).';
comment on column public.checkout_provisions.claimed_at is
  'When the current owner claimed the payment. A take-over sets it again, '
  'with a conditional update on the value read, so exactly one pass takes '
  'over a dead claim.';

-- No policy whatsoever, and no privileges either: Supabase's default
-- privileges grant every new table in full to anon and authenticated, so a
-- missing policy must not be the only thing in the way. TRUNCATE goes with
-- `all`, and RLS does not apply to it.
alter table public.checkout_provisions enable row level security;

revoke all on public.checkout_provisions from public, anon, authenticated;
grant select, insert, update, delete on public.checkout_provisions to service_role;

-- 2. The wedding names its payment -------------------------------------------------

alter table public.weddings
  add column payment_intent_id text,
  add constraint weddings_payment_intent_id_key unique (payment_intent_id);

comment on column public.weddings.payment_intent_id is
  'The Stripe PaymentIntent (pi_...) whose checkout created this wedding, '
  'written by the insert itself (create-wedding.ts). Unique: one payment, one '
  'wedding. Null on weddings created before 20261002220000; for those the '
  'account check stands in, and a second purchase is refunded as it always '
  'was. Set by the server only (trigger weddings_payment_intent_id_server_only).';

/*
 * Couples insert, update and delete their own wedding rows through RLS
 * (00000000000000_full_db_reset.sql). Left at that, a couple could write a
 * payment onto their wedding, or move it: `createWedding` would then adopt
 * their wedding for that payment, or refund the payment's real order as a
 * second purchase. Only the server writes it.
 *
 * `current_user` is the role the statement runs as: `anon` or `authenticated`
 * for a request carrying a visitor's or a couple's JWT, `service_role` for the
 * service key (PostgREST switches to the JWT's role; checked on the local
 * stack), `postgres` for migrations and security definer functions. Not
 * `security definer` itself, or `current_user` would always be its owner.
 */
create function public.weddings_payment_intent_id_server_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if tg_op = 'INSERT' and new.payment_intent_id is not null then
    raise exception 'weddings.payment_intent_id is set by the server only'
      using errcode = 'insufficient_privilege';
  end if;

  if tg_op = 'UPDATE' and new.payment_intent_id is distinct from old.payment_intent_id then
    raise exception 'weddings.payment_intent_id is set by the server only'
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$$;

create trigger weddings_payment_intent_id_server_only
  before insert or update of payment_intent_id on public.weddings
  for each row execute function public.weddings_payment_intent_id_server_only();

comment on function public.weddings_payment_intent_id_server_only() is
  'Refuses anon and authenticated any write that sets or changes '
  'weddings.payment_intent_id. See 20261002220000_checkout_provisions.sql.';
