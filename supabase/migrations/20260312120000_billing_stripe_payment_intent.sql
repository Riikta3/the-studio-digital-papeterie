-- Add stripe_payment_intent_id to billing for idempotency checks
alter table public.billing
  add column if not exists stripe_payment_intent_id text unique;
