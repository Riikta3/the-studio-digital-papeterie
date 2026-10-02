-- Custom domains: the couple's own `.com`, bought by the studio at Vercel and
-- wired to their invitation and Jour J pages without anyone touching it.
-- docs/superpowers/specs/2026-10-02-custom-domain-design.md (D2, D5, D8).
--
-- Why a table of its own rather than the old `sites.domain` text column: a
-- domain is not a setting, it is a purchase that moves through several steps
-- (paid, chosen, bought, attached, live), any of which can fail or be retried
-- by a scheduled job running alongside the request that started it. The row
-- carries that state machine, its lease and the emails already sent, so two
-- overlapping runs can never buy twice or write twice. `sites.domain` is
-- dropped at the end: one place says what a wedding's domain is.
--
-- Couples read their row and never write it (D8). Every write goes through
-- the service role, after the server has checked ownership. `anon` can only
-- execute `resolve_custom_domain`, which the proxy calls for unknown hosts.

-- 1. The single source of truth ------------------------------------------------
create table public.custom_domains (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null unique references public.sites(id) on delete cascade,
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  name text,
  years int not null check (years between 1 and 10),
  price_paid_cents int not null,
  stripe_payment_intent_id text unique,
  status text not null default 'awaiting_choice',
  status_changed_at timestamptz not null default now(),
  vercel_order_id text,
  purchase_started_at timestamptz,
  registered_at timestamptz,
  expires_at timestamptz,
  activated_at timestamptz,
  attempts int not null default 0,
  next_attempt_at timestamptz not null default now(),
  locked_until timestamptz,
  last_error text,
  notices_sent text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint custom_domains_status_check check (
    status in ('awaiting_choice', 'queued', 'purchasing', 'registered', 'active', 'failed')
  ),
  -- A last net under the label rules of shared/lib/custom-domain.ts: one DNS
  -- label of 3-63 lowercase letters, digits and inner hyphens, then `.com`.
  -- Stricter than "lowercase and ends in .com" on purpose: a stored
  -- `www.x.com` or `a.b.com` would never match a host the resolver strips.
  constraint custom_domains_name_format check (
    name is null or name ~ '^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]\.com$'
  )
);

-- One couple per name. Partial: many rows wait without a name (« plus tard »,
-- or a name lost to another of our couples), and they must not collide.
create unique index custom_domains_name_key
  on public.custom_domains (name)
  where name is not null;

-- The scheduled job's question: which rows are due, oldest first.
create index custom_domains_status_next_attempt_idx
  on public.custom_domains (status, next_attempt_at);

comment on table public.custom_domains is
  'A couple''s custom domain, from payment to live. One row per site. The '
  'purchase engine (landing/src/lib/custom-domains/advance.ts) moves it '
  'through awaiting_choice -> queued -> purchasing -> registered -> active, '
  'or to failed. Read by the couple through RLS; written only by the service '
  'role. There is no updated_at trigger in this repo: every writer, including '
  'the functions below, sets updated_at (and status_changed_at on a status '
  'change) itself.';

comment on column public.custom_domains.wedding_id is
  'Denormalised from the site, for the owner RLS policy and the emails. '
  'Always the site''s own wedding_id.';
comment on column public.custom_domains.name is
  'The full name, lowercase, `label.com`. Null until the couple chooses, and '
  'set back to null when another of our couples won it on the unique index. '
  'A name taken outside is kept, so the email can say which one was lost.';
comment on column public.custom_domains.years is
  'Registration years paid for, frozen from the PaymentIntent''s metadata. '
  'Never recomputed from today''s date. 10 is the registry''s own limit.';
comment on column public.custom_domains.price_paid_cents is
  'What the couple paid for the domain, in cents (EUR), like billing.amount.';
comment on column public.custom_domains.stripe_payment_intent_id is
  'The payment that bought this domain: the checkout''s intent, or the '
  'dashboard add-on''s. Unique, so a replayed webhook cannot insert twice.';
comment on column public.custom_domains.status is
  'awaiting_choice: paid, no name yet (or the name was lost). queued: a name '
  'is chosen, waiting to be bought. purchasing: the buy call was made (or is '
  'about to be). registered: ours at the registrar, being attached. active: '
  'served, certificate answered. failed: needs the studio.';
comment on column public.custom_domains.status_changed_at is
  'Set by every writer on each status change. The 7-day reminder of an '
  'awaiting_choice row counts from it.';
comment on column public.custom_domains.purchase_started_at is
  'Write-ahead marker, written with status = purchasing BEFORE the buy call. '
  'A row found purchasing without vercel_order_id means the process died '
  'mid-call: the engine waits 30 minutes, then checks the account before '
  'any new purchase.';
comment on column public.custom_domains.expires_at is
  'Registration expiry as Vercel reports it. The renewal spec reads it.';
comment on column public.custom_domains.attempts is
  'Consecutive failures of the current step. The fifth one moves the row to '
  'failed. Waiting for an order or a certificate is not a failure.';
comment on column public.custom_domains.next_attempt_at is
  'When the engine may look at this row again (backoff, or a poll interval).';
comment on column public.custom_domains.locked_until is
  'Lease taken by claim_custom_domain / claim_due_custom_domains, in the '
  'database''s own time. Overlapping cron runs and after() callbacks skip a '
  'leased row, so each step runs once.';
comment on column public.custom_domains.last_error is
  'Machine code of the last problem (name_unavailable, price_above_ceiling, '
  '...), read by the dashboard and the studio alert. Not a message.';
comment on column public.custom_domains.notices_sent is
  'Codes of the emails already sent for the current name (active, '
  'name_unavailable, reminder). Claimed by claim_custom_domain_notice before '
  'sending; cleared when the couple chooses a new name.';

-- 2. The couple reads, never writes ---------------------------------------------
alter table public.custom_domains enable row level security;

create policy "Owner can read own custom domain"
  on public.custom_domains for select
  using (
    exists (select 1 from public.weddings where id = wedding_id and user_id = auth.uid())
  );

-- No insert, update or delete policy whatsoever. Every write goes through the
-- service role (server actions, the webhook, the purchase engine), after the
-- server has checked that the site is the caller's. The privileges are also
-- revoked, so a missing policy is not the only thing standing in the way:
-- Supabase's default privileges grant every new table in full to anon and
-- authenticated. TRUNCATE is included because RLS does not apply to it.
revoke insert, update, delete, truncate on public.custom_domains from anon, authenticated;

-- 3. Which wedding a host serves -------------------------------------------------
create function public.resolve_custom_domain(p_host text)
returns table (
  live boolean,
  slug text,
  languages text[]
)
language sql
security definer
stable
set search_path = public
as $$
  -- The Host header as a browser may send it: any case, a port, the
  -- fully-qualified trailing dot, the `www.` we redirect from.
  with host as (
    select regexp_replace(
             regexp_replace(
               regexp_replace(lower(trim(p_host)), ':[0-9]+$', ''),
               '\.$', ''),
             '^www\.', '') as name
  )
  select
    l.live,
    case when l.live then s.slug end,
    case when l.live then s.languages end
  from host h
  join public.custom_domains cd on cd.name = h.name
  join public.sites s on s.id = cd.site_id
  cross join lateral (
    select (cd.status = 'active' and s.status = 'published') as live
  ) l
  limit 1;
$$;

comment on function public.resolve_custom_domain(text) is
  'Resolves a request host to the invitation it serves, for the landing proxy. '
  'No row: not one of our couples'' domains (the proxy falls through to the '
  'shop). live = false: a known domain that is not active, or whose site is '
  'not published (the proxy answers 404); slug and languages are then null. '
  'live = true: the slug and the languages bought. Reveals nothing that '
  'visiting the domain would not, and cannot be enumerated.';

revoke all on function public.resolve_custom_domain(text) from public;
grant execute on function public.resolve_custom_domain(text) to anon, authenticated;

-- 4. The engine's lease ----------------------------------------------------------
-- One update ... returning: under read committed, a second caller racing for
-- the same row waits for the first to commit, re-reads the row and finds the
-- lease taken. The time is the database's own, never a server's clock.
create function public.claim_custom_domain(p_id uuid)
returns setof public.custom_domains
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.custom_domains cd
     set locked_until = now() + interval '2 minutes',
         updated_at = now()
   where cd.id = p_id
     and cd.status in ('queued', 'purchasing', 'registered')
     and cd.next_attempt_at <= now()
     and (cd.locked_until is null or cd.locked_until < now())
  returning cd.*;
end;
$$;

comment on function public.claim_custom_domain(uuid) is
  'Leases one custom domain row for 2 minutes and returns it, if it is in a '
  'step the engine performs (queued, purchasing, registered), is due, and is '
  'not leased already. Returns nothing otherwise: the caller leaves the row '
  'alone. Used by after() right after a payment. Service role only.';

revoke all on function public.claim_custom_domain(uuid) from public, anon, authenticated;
grant execute on function public.claim_custom_domain(uuid) to service_role;

create function public.claim_due_custom_domains(p_limit int)
returns setof public.custom_domains
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with due as (
    -- skip locked: an overlapping run takes the next rows instead of waiting
    -- on these ones.
    select d.id
      from public.custom_domains d
     where d.status in ('queued', 'purchasing', 'registered')
       and d.next_attempt_at <= now()
       and (d.locked_until is null or d.locked_until < now())
     order by d.next_attempt_at
     limit p_limit
     for update skip locked
  )
  update public.custom_domains cd
     set locked_until = now() + interval '2 minutes',
         updated_at = now()
    from due
   where cd.id = due.id
  returning cd.*;
end;
$$;

comment on function public.claim_due_custom_domains(int) is
  'Leases up to p_limit due custom domain rows for 2 minutes, oldest '
  'next_attempt_at first, and returns them. Same conditions as '
  'claim_custom_domain. Used by the 5-minute cron; overlapping runs get '
  'disjoint rows. Service role only.';

revoke all on function public.claim_due_custom_domains(int) from public, anon, authenticated;
grant execute on function public.claim_due_custom_domains(int) to service_role;

-- 5. Each email once -------------------------------------------------------------
-- Claimed before it is sent: only the caller whose update changed the row
-- sends. A failed send releases the code so the next run retries.
create function public.claim_custom_domain_notice(p_id uuid, p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.custom_domains
     set notices_sent = array_append(notices_sent, p_code),
         updated_at = now()
   where id = p_id
     and not (p_code = any(notices_sent));
  return found;
end;
$$;

comment on function public.claim_custom_domain_notice(uuid, text) is
  'Records that the email p_code (active, name_unavailable, reminder) is being '
  'sent for this row. True only for the one caller that added it; false if it '
  'was already claimed, or the row does not exist. Service role only.';

revoke all on function public.claim_custom_domain_notice(uuid, text) from public, anon, authenticated;
grant execute on function public.claim_custom_domain_notice(uuid, text) to service_role;

create function public.release_custom_domain_notice(p_id uuid, p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.custom_domains
     set notices_sent = array_remove(notices_sent, p_code),
         updated_at = now()
   where id = p_id
     and p_code = any(notices_sent);
end;
$$;

comment on function public.release_custom_domain_notice(uuid, text) is
  'Undoes claim_custom_domain_notice after a failed send, so the next run '
  'claims and sends it again. Service role only.';

revoke all on function public.release_custom_domain_notice(uuid, text) from public, anon, authenticated;
grant execute on function public.release_custom_domain_notice(uuid, text) to service_role;

-- 6. One place says what a wedding's domain is ------------------------------------
-- Never written by the shop since the full reset, and read by no view, policy
-- or function (checked against every migration and the local database).
alter table public.sites drop column domain;
