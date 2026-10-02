-- Custom domains, hardened after code review.
-- docs/superpowers/specs/2026-10-02-custom-domain-design.md (D2, D3, D5).
--
-- 20261002120000_custom_domains.sql was already applied when the review came
-- back, and an applied migration is never edited, so its fixes land here:
--
-- - The lease was anonymous. A run whose 2-minute lease expired mid-step (a
--   slow Vercel call, a frozen process) could still write its result over the
--   row another run had claimed since, and a step that killed its process
--   every time was claimed again forever. Each claim now mints a lease_token
--   that every engine write is conditioned on, and counts how many claims
--   went by without a write.
-- - The name check accepted `--`, which the TS label rules refuse and which
--   lets the `xn--` punycode form in.
-- - Nothing tied wedding_id to the site's own wedding. RLS filters on one and
--   the resolver serves the other, so a row with the wrong pair would show
--   one couple's domain to another.
-- - The resolver answered live = null when the site's status was null, and
--   languages = null for a live site sold before languages were recorded.
-- - Vercel's search knows nothing of names our other couples have reserved,
--   so availability checks need custom_domain_name_taken.

-- 1. An owned lease ------------------------------------------------------------
alter table public.custom_domains
  add column lease_token uuid,
  add column claims_since_progress int not null default 0;

comment on column public.custom_domains.lease_token is
  'Minted by each claim (claim_custom_domain / claim_due_custom_domains). '
  'Every write the engine makes carries `where id = $1 and lease_token = $2`: '
  'a write that matches no row means the lease was lost to another run, and '
  'the step stops without acting. Null until the row is first claimed.';
comment on column public.custom_domains.claims_since_progress is
  'Incremented by each claim, reset to 0 by every engine write. A claim that '
  'returns 3 or more means the claims before it died without writing '
  'anything: a step that keeps killing its process. The engine then marks '
  'the row failed and alerts the studio instead of running the step again.';

-- 2. No `--` in a name -----------------------------------------------------------
-- Same pattern as before, plus the rule isValidLabel already applies
-- (shared/lib/custom-domain.ts). It also keeps out `xn--…`, the form
-- registries reserve for internationalised names.
alter table public.custom_domains drop constraint custom_domains_name_format;
alter table public.custom_domains add constraint custom_domains_name_format check (
  name is null or (
    name ~ '^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]\.com$'
    and position('--' in name) = 0
  )
);

-- 3. wedding_id is the site's own -------------------------------------------------
-- RLS lets a couple read a row through its wedding_id, while the resolver
-- serves the invitation of its site_id. If the two disagreed, one couple
-- would see (and be emailed about) a domain that serves another's invitation.
-- The comment on wedding_id said "always the site's own"; this makes it true.
-- sites.id is already unique, so the pair is too: the constraint exists only
-- because a foreign key needs one on exactly its columns.
alter table public.sites
  add constraint sites_id_wedding_id_key unique (id, wedding_id);

alter table public.custom_domains
  add constraint custom_domains_site_wedding_fkey
  foreign key (site_id, wedding_id)
  references public.sites (id, wedding_id)
  on delete cascade;

-- 4. The resolver never answers null for live ---------------------------------------
create or replace function public.resolve_custom_domain(p_host text)
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
    -- Weddings sold before languages were recorded: the proxy then serves
    -- the default locale (spec D6), and must not have to tell "no languages"
    -- from "not live" by a null.
    case when l.live then coalesce(s.languages, '{}') end
  from host h
  join public.custom_domains cd on cd.name = h.name
  join public.sites s on s.id = cd.site_id
  cross join lateral (
    -- sites.status is nullable: without coalesce, an active domain on a site
    -- with no status answered live = null rather than false.
    select coalesce(cd.status = 'active' and s.status = 'published', false) as live
  ) l
  limit 1;
$$;

comment on function public.resolve_custom_domain(text) is
  'Resolves a request host to the invitation it serves, for the landing proxy. '
  'No row: not one of our couples'' domains (the proxy falls through to the '
  'shop). live = false: a known domain that is not active, or whose site is '
  'not published (the proxy answers 404); slug and languages are then null. '
  'live = true: the slug and the languages bought, ''{}'' when none were '
  'recorded. live is never null. Reveals nothing that visiting the domain '
  'would not, and cannot be enumerated.';

revoke all on function public.resolve_custom_domain(text) from public;
grant execute on function public.resolve_custom_domain(text) to anon, authenticated;

-- 5. Claims mint the lease ------------------------------------------------------------
-- Same eligibility as before: a step the engine performs, due, not leased.
-- Each claim mints a fresh lease_token and counts itself in
-- claims_since_progress. The engine resets that counter on every write it
-- makes, and treats a claim returning 3 or more as a stuck step (see the
-- column's comment). The time is still the database's own.
create or replace function public.claim_custom_domain(p_id uuid)
returns setof public.custom_domains
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.custom_domains cd
     set lease_token = gen_random_uuid(),
         locked_until = now() + interval '2 minutes',
         claims_since_progress = cd.claims_since_progress + 1,
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
  'not leased already. The lease is owned: a fresh lease_token, which every '
  'engine write must carry, and claims_since_progress counts this claim. '
  'Returns nothing otherwise: the caller leaves the row alone. Used by '
  'after() right after a payment. Service role only.';

revoke all on function public.claim_custom_domain(uuid) from public, anon, authenticated;
grant execute on function public.claim_custom_domain(uuid) to service_role;

create or replace function public.claim_due_custom_domains(p_limit int)
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
     set lease_token = gen_random_uuid(),
         locked_until = now() + interval '2 minutes',
         claims_since_progress = cd.claims_since_progress + 1,
         updated_at = now()
    from due
   where cd.id = due.id
  returning cd.*;
end;
$$;

comment on function public.claim_due_custom_domains(int) is
  'Leases up to p_limit due custom domain rows for 2 minutes, oldest '
  'next_attempt_at first, and returns them, each with a fresh lease_token '
  'and claims_since_progress counting this claim. Same conditions as '
  'claim_custom_domain. Used by the 5-minute cron; overlapping runs get '
  'disjoint rows. Service role only.';

revoke all on function public.claim_due_custom_domains(int) from public, anon, authenticated;
grant execute on function public.claim_due_custom_domains(int) to service_role;

-- 6. Our own rows count as taken ----------------------------------------------------
-- Vercel's search answers "available" for a name another of our couples has
-- reserved but that is not bought yet (queued, purchasing, or failed). The
-- studio endpoint, the payment route and chooseCustomDomain ask this as
-- well, and treat a match as taken. p_except_site lets a couple re-check the
-- name already on its own row without finding itself.
create function public.custom_domain_name_taken(p_name text, p_except_site uuid default null)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
      from public.custom_domains
     where name = lower(p_name)
       and site_id is distinct from p_except_site
  );
$$;

comment on function public.custom_domain_name_taken(text, uuid) is
  'True when a custom_domains row other than p_except_site''s holds this name '
  '(compared lowercase), whatever its status. Server-side availability '
  'checks call it next to Vercel''s search, which cannot see names reserved '
  'by our own couples. Service role only: it would otherwise let anyone '
  'probe which names the studio''s couples have chosen.';

revoke all on function public.custom_domain_name_taken(text, uuid) from public, anon, authenticated;
grant execute on function public.custom_domain_name_taken(text, uuid) to service_role;
