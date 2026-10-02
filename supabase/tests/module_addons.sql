-- Checks for 20260928120000_module_addons.sql. LOCAL database only:
--   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
--     -v ON_ERROR_STOP=1 -f supabase/tests/module_addons.sql
-- Everything runs in one transaction that is rolled back: nothing stays behind.
begin;

insert into auth.users (id, email, aud, role)
values ('00000000-0000-4000-8000-00000000a001', 'addon-check@example.test', 'authenticated', 'authenticated');
insert into public.profiles (id)
values ('00000000-0000-4000-8000-00000000a001')
on conflict (id) do nothing;
insert into public.weddings (id, user_id)
values ('00000000-0000-4000-8000-00000000b001', '00000000-0000-4000-8000-00000000a001');
insert into public.sites (id, wedding_id, plan_id, theme_id, modules, status)
values ('00000000-0000-4000-8000-00000000c001', '00000000-0000-4000-8000-00000000b001',
        'signature', 'ciao-amore', array['countdown', 'timeline', 'rsvp'], 'published');
insert into public.site_modules (site_id, module_id, position, config)
values ('00000000-0000-4000-8000-00000000c001', 'gallery', 10, '{"images":["https://example.com/a.jpg"]}');
update public.sites set pending_modules = array['gallery', 'faq']
 where id = '00000000-0000-4000-8000-00000000c001';

do $$
declare
  site constant uuid := '00000000-0000-4000-8000-00000000c001';
  r text[];
begin
  -- One grant per payment, replay-safe.
  r := public.grant_modules(site, array['gallery', 'faq'], 'pi_check_1', 500);
  assert r = array['gallery', 'faq'], format('first grant returned %s', r);
  r := public.grant_modules(site, array['gallery', 'faq'], 'pi_check_1', 500);
  assert r = array['gallery', 'faq'], format('replay returned %s', r);
  assert (select count(*) from public.purchases where stripe_payment_intent_id = 'pi_check_1') = 2,
    'replay added purchases';
  assert (select modules from public.sites where id = site) = array['countdown', 'timeline', 'rsvp', 'gallery', 'faq'],
    'modules not appended exactly once';
  assert (select pending_modules from public.sites where id = site) = '{}', 'pending not cleared';
  assert (select price_paid from public.purchases
           where stripe_payment_intent_id = 'pi_check_1' and item_id = 'faq') = 500, 'price not in cents';
  assert (select count(*) from public.site_modules where site_id = site and module_id = 'faq') = 1,
    'faq row missing';

  -- A second payment for modules already owned grants nothing (the webhook refunds it).
  r := public.grant_modules(site, array['faq'], 'pi_check_2', 500);
  assert r = '{}', format('double payment granted %s', r);

  -- Removed from pending while its payment was in flight: paid, so granted.
  r := public.grant_modules(site, array['menu'], 'pi_check_3', 500);
  assert r = array['menu'], format('in-flight grant returned %s', r);

  -- Unknown ids are ignored; a free grant needs no payment.
  r := public.grant_modules(site, array['nope', 'playlist'], null, 0);
  assert r = array['playlist'], format('free grant returned %s', r);
end $$;

-- Guests read live modules only.
update public.sites set pending_modules = array['dress-code']
 where id = '00000000-0000-4000-8000-00000000c001';
insert into public.site_modules (site_id, module_id, position, config)
values ('00000000-0000-4000-8000-00000000c001', 'dress-code', 4, '{"title":"Unpaid"}');
do $$
begin
  assert not exists (select 1 from public.public_module_configs('00000000-0000-4000-8000-00000000b001')
                      where module_id = 'dress-code'), 'unpaid module exposed to guests';
  assert exists (select 1 from public.public_module_configs('00000000-0000-4000-8000-00000000b001')
                  where module_id = 'gallery'), 'live module hidden from guests';
end $$;

-- The couple's own session.
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-00000000a001","role":"authenticated"}', true);
do $$
declare
  site constant uuid := '00000000-0000-4000-8000-00000000c001';
begin
  begin
    update public.sites set modules = array['guestbook'] where id = site;
    raise exception 'couple could write sites.modules';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.sites set plan_id = 'prestige' where id = site;
    raise exception 'couple could write sites.plan_id';
  exception when insufficient_privilege then null;
  end;
  update public.sites set status = 'draft', pending_modules = array['faq'] where id = site;
  assert found, 'couple could not update status and pending_modules';
  begin
    perform public.grant_modules(site, array['guestbook'], null, 0);
    raise exception 'couple could execute grant_modules';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

rollback;
\echo 'module_addons checks passed'
