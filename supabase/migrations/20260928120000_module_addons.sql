-- Modules added after the sale: stored unpaid, made live only by a verified
-- payment or the plan's allowance.
-- docs/superpowers/specs/2026-09-28-dashboard-module-purchase-design.md (D3, D5, D10).

-- 1. Unpaid modules ------------------------------------------------------------
alter table public.sites
  add column if not exists pending_modules text[] not null default '{}';

comment on column public.sites.pending_modules is
  'Modules the couple added in the editor and saved but has not paid for, in the '
  'order they were added. Invisible to guests; `grant_modules` moves them into '
  '`modules`. The couple''s own session may write it — nothing in it is shown or '
  'granted without a payment.';

-- 2. Purchases keyed by payment --------------------------------------------------
alter table public.purchases
  add column if not exists stripe_payment_intent_id text;

create unique index if not exists purchases_payment_item_key
  on public.purchases (stripe_payment_intent_id, item_id)
  where stripe_payment_intent_id is not null;

comment on column public.purchases.price_paid is
  'In cents, like billing.amount. 0 for a module a plan includes.';

-- 3. The only way a module goes live after the sale ------------------------------
create or replace function public.grant_modules(
  p_site_id uuid,
  p_modules text[],
  p_payment_intent_id text default null,
  p_unit_price_cents integer default 0
)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wedding_id uuid;
  v_owned text[];
  v_new text[];
  v_done text[];
begin
  -- Serialises the browser's fast path and the webhook for the same site.
  select wedding_id, coalesce(modules, '{}')
    into v_wedding_id, v_owned
    from public.sites
   where id = p_site_id
   for update;
  if not found then
    raise exception 'grant_modules: site % not found', p_site_id;
  end if;

  -- A replay of the same payment reports what it granted and changes nothing.
  if p_payment_intent_id is not null then
    -- In the caller's order: rows of one grant share created_at (one transaction).
    select array_agg(item_id order by array_position(p_modules, item_id) nulls last, item_id)
      into v_done
      from public.purchases
     where stripe_payment_intent_id = p_payment_intent_id;
    if v_done is not null then
      return v_done;
    end if;
  end if;

  -- Real modules, not already owned, once each, in the caller's order.
  select coalesce(array_agg(requested.id order by requested.ord), '{}')
    into v_new
    from (
      select distinct on (m.id) m.id, t.ord
        from unnest(p_modules) with ordinality as t(id, ord)
        join public.modules m on m.id = t.id
       where not (t.id = any(v_owned))
       order by m.id, t.ord
    ) as requested;

  if cardinality(v_new) = 0 then
    return v_new;
  end if;

  update public.sites
     set modules = v_owned || v_new,
         pending_modules = array(
           select p from unnest(pending_modules) as p where not (p = any(v_new))
         )
   where id = p_site_id;

  insert into public.site_modules (site_id, module_id, position, config)
  select p_site_id, m.id, m.default_order, '{}'::jsonb
    from public.modules m
   where m.id = any(v_new)
  on conflict (site_id, module_id) do nothing;

  insert into public.purchases
    (wedding_id, item_type, item_id, price_paid, currency, status, stripe_payment_intent_id)
  select v_wedding_id, 'module', id, p_unit_price_cents, 'EUR', 'active', p_payment_intent_id
    from unnest(v_new) as id;

  return v_new;
end;
$$;

comment on function public.grant_modules(uuid, text[], text, integer) is
  'Makes modules live on a site: appends them to sites.modules, drops them from '
  'pending_modules, creates their site_modules rows and one purchases row each. '
  'Idempotent per payment intent. Service role only: callers verify the payment '
  'with Stripe first.';

revoke all on function public.grant_modules(uuid, text[], text, integer) from public, anon, authenticated;
grant execute on function public.grant_modules(uuid, text[], text, integer) to service_role;

-- 4. Couples no longer write their own plan or modules --------------------------
-- The update policy had no column restriction: any couple could PATCH
-- /rest/v1/sites with every module, or another plan_id.
drop policy if exists "Users can insert own site config" on public.sites;
revoke insert, update, delete on table public.sites from anon, authenticated;
grant update (status, pending_modules) on table public.sites to authenticated;

-- 5. Guests read live modules only ---------------------------------------------
create or replace function public.public_module_configs(p_wedding_id uuid)
returns table (
  module_id text,
  "position" int,
  config jsonb
)
language sql
security definer
stable
set search_path = public
as $$
  select sm.module_id, sm."position", sm.config
  from public.site_modules sm
  join public.sites s on s.id = sm.site_id
  where s.wedding_id = p_wedding_id
    and s.status = 'published'
    and sm.module_id = any(coalesce(s.modules, '{}'))
  order by sm."position";
$$;
