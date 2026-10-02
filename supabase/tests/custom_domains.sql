-- Checks for 20261002120000_custom_domains.sql and
-- 20261002130000_custom_domains_hardening.sql. LOCAL database only:
--   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
--     -v ON_ERROR_STOP=1 -f supabase/tests/custom_domains.sql
-- Everything runs in one transaction that is rolled back: nothing stays behind.
--
-- now() is the transaction's start time, so it does not move between the
-- statements below: a lease taken here is still running at the next call.
begin;

-- Couple A: published site, its domain live. Couple B: draft site, queued.
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-8000-00000000d001', 'domain-check-a@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-00000000d002', 'domain-check-b@example.test', 'authenticated', 'authenticated');
insert into public.profiles (id) values
  ('00000000-0000-4000-8000-00000000d001'),
  ('00000000-0000-4000-8000-00000000d002')
on conflict (id) do nothing;
insert into public.weddings (id, user_id) values
  ('00000000-0000-4000-8000-00000000e001', '00000000-0000-4000-8000-00000000d001'),
  ('00000000-0000-4000-8000-00000000e002', '00000000-0000-4000-8000-00000000d002');
insert into public.sites (id, wedding_id, plan_id, theme_id, modules, languages, slug, status) values
  ('00000000-0000-4000-8000-00000000f001', '00000000-0000-4000-8000-00000000e001',
   'signature', 'ciao-amore', array['countdown'], array['fr', 'en'], 'domain-check-a', 'published'),
  ('00000000-0000-4000-8000-00000000f002', '00000000-0000-4000-8000-00000000e002',
   'signature', 'ciao-amore', array['countdown'], array['fr'], 'domain-check-b', 'draft');
insert into public.custom_domains
  (id, site_id, wedding_id, name, years, price_paid_cents, stripe_payment_intent_id, status) values
  ('00000000-0000-4000-8000-0000000cd001', '00000000-0000-4000-8000-00000000f001',
   '00000000-0000-4000-8000-00000000e001', 'domain-check-a.com', 2, 8500, 'pi_domain_check_a', 'active'),
  ('00000000-0000-4000-8000-0000000cd002', '00000000-0000-4000-8000-00000000f002',
   '00000000-0000-4000-8000-00000000e002', 'domain-check-b.com', 1, 6500, 'pi_domain_check_b', 'queued');

-- 1. The table's own rules ---------------------------------------------------------
do $$
declare
  a constant uuid := '00000000-0000-4000-8000-0000000cd001';
  b constant uuid := '00000000-0000-4000-8000-0000000cd002';
  bad text;
begin
  -- One row per site.
  begin
    insert into public.custom_domains (site_id, wedding_id, years, price_paid_cents)
    values ('00000000-0000-4000-8000-00000000f001', '00000000-0000-4000-8000-00000000e001', 1, 6500);
    raise exception 'a second row for one site was accepted';
  exception when unique_violation then null;
  end;

  -- One name per couple. Provisioning inserts `on conflict (site_id) do
  -- nothing`: losing on the name must still raise, so it can fall back to
  -- awaiting_choice (spec D3).
  begin
    delete from public.custom_domains where id = b;
    insert into public.custom_domains (site_id, wedding_id, name, years, price_paid_cents, status)
    values ('00000000-0000-4000-8000-00000000f002', '00000000-0000-4000-8000-00000000e002',
            'domain-check-a.com', 1, 6500, 'queued')
    on conflict (site_id) do nothing;
    raise exception 'one name on two sites was accepted';
  exception when unique_violation then null;
  end;
  assert (select name from public.custom_domains where id = b) = 'domain-check-b.com',
    'the failed name insert left a trace';

  -- Many rows may wait without a name.
  update public.custom_domains set name = null where id in (a, b);
  assert (select count(*) from public.custom_domains where id in (a, b) and name is null) = 2,
    'two unnamed rows collided';
  update public.custom_domains set name = 'domain-check-a.com' where id = a;
  update public.custom_domains set name = 'domain-check-b.com' where id = b;

  -- wedding_id is the site's own: RLS reads one, the resolver serves the
  -- other, so a row pairing a site with another couple's wedding is refused.
  begin
    delete from public.custom_domains where id = b;
    insert into public.custom_domains (site_id, wedding_id, years, price_paid_cents)
    values ('00000000-0000-4000-8000-00000000f002', '00000000-0000-4000-8000-00000000e001', 1, 6500);
    raise exception 'a row with another couple''s wedding_id was accepted';
  exception when foreign_key_violation then null;
  end;
  begin
    update public.custom_domains set wedding_id = '00000000-0000-4000-8000-00000000e002' where id = a;
    raise exception 'a row was moved to another couple''s wedding';
  exception when foreign_key_violation then null;
  end;
  assert (select wedding_id from public.custom_domains where id = b) = '00000000-0000-4000-8000-00000000e002',
    'the refused insert left a trace';

  -- Names: one lowercase label, then .com. No `--`, so no `xn--` either.
  foreach bad in array array[
    'domain-check-a.fr', 'Domain-Check-A.com', 'www.domain-check-a.com',
    'domain-check-a', '-domain-check-a.com', 'ab.com', 'domain_check_a.com',
    'a--b.com', 'xn--abc.com'
  ] loop
    begin
      update public.custom_domains set name = bad where id = a;
      raise exception 'name % was accepted', bad;
    exception when check_violation then null;
    end;
  end loop;

  begin
    update public.custom_domains set status = 'pending' where id = a;
    raise exception 'status pending was accepted';
  exception when check_violation then null;
  end;
  begin
    update public.custom_domains set years = 11 where id = a;
    raise exception 'years = 11 was accepted';
  exception when check_violation then null;
  end;
  begin
    update public.custom_domains set years = 0 where id = a;
    raise exception 'years = 0 was accepted';
  exception when check_violation then null;
  end;

  -- No column of sites says what the domain is any more.
  assert not exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'sites' and column_name = 'domain'
  ), 'sites.domain still exists';

  -- Exactly who may call what.
  assert has_function_privilege('anon', 'public.resolve_custom_domain(text)', 'execute'),
    'anon cannot execute resolve_custom_domain';
  assert has_function_privilege('authenticated', 'public.resolve_custom_domain(text)', 'execute'),
    'authenticated cannot execute resolve_custom_domain';
  for bad in select unnest(array[
    'public.claim_custom_domain(uuid)',
    'public.claim_due_custom_domains(int)',
    'public.claim_custom_domain_notice(uuid, text)',
    'public.release_custom_domain_notice(uuid, text)',
    'public.custom_domain_name_taken(text, uuid)'
  ]) loop
    assert not has_function_privilege('anon', bad, 'execute'), format('anon can execute %s', bad);
    assert not has_function_privilege('authenticated', bad, 'execute'),
      format('authenticated can execute %s', bad);
    assert has_function_privilege('service_role', bad, 'execute'),
      format('service_role cannot execute %s', bad);
  end loop;
end $$;

-- 2. The couple's own session: reads its row, writes nothing --------------------
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-00000000d001","role":"authenticated"}', true);
do $$
declare
  a constant uuid := '00000000-0000-4000-8000-0000000cd001';
  n int;
begin
  assert (select count(*) from public.custom_domains where id = a) = 1, 'couple cannot read its row';
  assert (select count(*) from public.custom_domains
           where id = '00000000-0000-4000-8000-0000000cd002') = 0, 'couple can read another couple''s row';
  assert (select count(*) from public.custom_domains) = 1, 'couple sees more than its row';

  begin
    update public.custom_domains set years = 9, status = 'queued' where id = a;
    get diagnostics n = row_count;
    assert n = 0, 'couple updated its row';
  exception when insufficient_privilege then null;
  end;
  assert (select years from public.custom_domains where id = a) = 2, 'couple changed years';
  assert (select status from public.custom_domains where id = a) = 'active', 'couple changed status';

  begin
    insert into public.custom_domains (site_id, wedding_id, name, years, price_paid_cents, status)
    values ('00000000-0000-4000-8000-00000000f001', '00000000-0000-4000-8000-00000000e001',
            'free-domain-check.com', 1, 0, 'queued');
    raise exception 'couple could insert a row';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.custom_domains where id = a;
    raise exception 'couple could delete its row';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.claim_custom_domain(a);
    raise exception 'couple could execute claim_custom_domain';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.claim_custom_domain_notice(a, 'active');
    raise exception 'couple could execute claim_custom_domain_notice';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- 3. A visitor's host, as the proxy resolves it -----------------------------------
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$
declare
  r record;
  host text;
begin
  -- Live: active domain, published site.
  foreach host in array array[
    'domain-check-a.com', 'www.domain-check-a.com', '  WWW.Domain-Check-A.COM.:443 ', 'domain-check-a.com:3010'
  ] loop
    select * into r from public.resolve_custom_domain(host);
    assert found, format('%s resolved to no row', host);
    assert r.live, format('%s is not live', host);
    assert r.slug = 'domain-check-a', format('%s resolved to slug %s', host, r.slug);
    assert r.languages = array['fr', 'en'], format('%s resolved to languages %s', host, r.languages);
  end loop;

  -- Known but queued: exists, nothing more.
  select * into r from public.resolve_custom_domain('domain-check-b.com');
  assert found, 'a queued domain resolved to no row';
  assert not r.live, 'a queued domain is live';
  assert r.slug is null and r.languages is null, 'a queued domain leaked its slug';

  -- Unknown, empty or missing host: no row, so the shop is served.
  assert (select count(*) from public.resolve_custom_domain('nobody-here.com')) = 0, 'unknown host resolved';
  assert (select count(*) from public.resolve_custom_domain('www.')) = 0, 'bare www. resolved';
  assert (select count(*) from public.resolve_custom_domain('')) = 0, 'empty host resolved';
  assert (select count(*) from public.resolve_custom_domain(null)) = 0, 'null host resolved';

  -- The table itself stays closed.
  begin
    assert (select count(*) from public.custom_domains) = 0, 'anon can read custom_domains';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.claim_due_custom_domains(10);
    raise exception 'anon could execute claim_due_custom_domains';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.claim_custom_domain('00000000-0000-4000-8000-0000000cd001');
    raise exception 'anon could execute claim_custom_domain';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.release_custom_domain_notice('00000000-0000-4000-8000-0000000cd001', 'active');
    raise exception 'anon could execute release_custom_domain_notice';
  exception when insufficient_privilege then null;
  end;
  -- Probing which names our couples chose is not for visitors.
  begin
    perform public.custom_domain_name_taken('domain-check-a.com');
    raise exception 'anon could execute custom_domain_name_taken';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- A live site sold before languages were recorded answers '{}', not null;
-- a site with no status is not live, and says so with false, not null.
update public.sites set languages = null where id = '00000000-0000-4000-8000-00000000f001';
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$
declare
  r record;
begin
  select * into r from public.resolve_custom_domain('domain-check-a.com');
  assert found and r.live, 'a live site without languages is not live';
  assert r.slug = 'domain-check-a', format('a live site without languages resolved to slug %s', r.slug);
  assert r.languages is not null and r.languages = '{}'::text[],
    format('a live site without languages resolved to languages %s', r.languages);
end $$;
reset role;
update public.sites set languages = array['fr', 'en'], status = null
 where id = '00000000-0000-4000-8000-00000000f001';
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$
declare
  r record;
begin
  select * into r from public.resolve_custom_domain('domain-check-a.com');
  assert found, 'an active domain on a site without status resolved to no row';
  assert r.live is not null, 'live is null for a site without status';
  assert not r.live, 'an active domain on a site without status is live';
  assert r.slug is null and r.languages is null, 'a site without status leaked its slug';
end $$;
reset role;
update public.sites set status = 'published' where id = '00000000-0000-4000-8000-00000000f001';

-- An active domain whose site went back to draft is not live.
update public.custom_domains set status = 'active' where id = '00000000-0000-4000-8000-0000000cd002';
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$
declare
  r record;
begin
  select * into r from public.resolve_custom_domain('domain-check-b.com');
  assert found, 'an active domain on a draft site resolved to no row';
  assert not r.live, 'an active domain on a draft site is live';
  assert r.slug is null and r.languages is null, 'a draft site leaked its slug';
end $$;
reset role;

-- 4. The engine, as the service role ----------------------------------------------
set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
do $$
declare
  a constant uuid := '00000000-0000-4000-8000-0000000cd001';
  b constant uuid := '00000000-0000-4000-8000-0000000cd002';
  r public.custom_domains;
  again public.custom_domains;
  ids uuid[];
  st text;
  claims_before int;
  token_before uuid;
begin
  -- The service role writes the table directly (server actions, webhook).
  update public.custom_domains
     set status = 'queued', next_attempt_at = now(), locked_until = null,
         updated_at = now() - interval '1 day'
   where id = a;
  assert found, 'service role cannot update custom_domains';

  -- A due row is leased once; the second call finds the lease running.
  select * into r from public.claim_custom_domain(a);
  assert found and r.id = a, 'a due queued row was not claimed';
  assert r.locked_until = now() + interval '2 minutes', format('lease is %s', r.locked_until);
  assert r.updated_at = now(), 'claim did not set updated_at';
  assert r.lease_token is not null, 'a claim minted no lease_token';
  assert r.claims_since_progress = 1, format('first claim counted %s', r.claims_since_progress);
  assert (select count(*) from public.claim_custom_domain(a)) = 0, 'a leased row was claimed twice';
  assert (select claims_since_progress from public.custom_domains where id = a) = 1,
    'a refused claim was counted';

  -- An expired lease can be taken again, by a new owner: a write still
  -- carrying the first token would match nothing.
  update public.custom_domains set locked_until = now() - interval '1 second' where id = a;
  select * into again from public.claim_custom_domain(a);
  assert found, 'an expired lease was not taken';
  assert again.lease_token is not null and again.lease_token <> r.lease_token,
    'a second claim kept the first lease_token';
  assert again.claims_since_progress = 2, format('second claim counted %s', again.claims_since_progress);
  update public.custom_domains set attempts = attempts where id = a and lease_token = r.lease_token;
  assert not found, 'a write with a lost lease_token matched the row';

  -- Not due yet: left alone.
  update public.custom_domains
     set status = 'queued', next_attempt_at = now() + interval '1 hour', locked_until = null
   where id = b;
  assert (select count(*) from public.claim_custom_domain(b)) = 0, 'a row not yet due was claimed';

  -- Only queued, purchasing and registered are the engine's steps.
  foreach st in array array['awaiting_choice', 'active', 'failed'] loop
    update public.custom_domains
       set status = st, next_attempt_at = now() - interval '1 hour', locked_until = null
     where id = b;
    assert (select count(*) from public.claim_custom_domain(b)) = 0, format('a %s row was claimed', st);
    assert (select count(*) from public.claim_due_custom_domains(10) where id = b) = 0,
      format('the cron claimed a %s row', st);
  end loop;
  foreach st in array array['purchasing', 'registered'] loop
    update public.custom_domains
       set status = st, next_attempt_at = now() - interval '1 hour', locked_until = null
     where id = b;
    assert (select count(*) from public.claim_custom_domain(b)) = 1, format('a due %s row was not claimed', st);
  end loop;

  -- The cron: oldest first, up to the limit, never a leased row.
  update public.custom_domains set status = 'queued', locked_until = null,
                                   next_attempt_at = now() - interval '1 minute' where id = a;
  update public.custom_domains set status = 'purchasing', locked_until = null,
                                   next_attempt_at = now() - interval '5 minutes' where id = b;
  select claims_since_progress, lease_token into claims_before, token_before
    from public.custom_domains where id = b;
  select array_agg(id) into ids from public.claim_due_custom_domains(1);
  assert ids = array[b], format('limit 1 claimed %s', ids);
  -- The cron's claim owns its lease the same way.
  select * into r from public.custom_domains where id = b;
  assert r.claims_since_progress = claims_before + 1,
    format('the cron''s claim counted %s after %s', r.claims_since_progress, claims_before);
  assert r.lease_token is not null and r.lease_token is distinct from token_before,
    'the cron''s claim did not mint a lease_token';
  select array_agg(id) into ids from public.claim_due_custom_domains(10);
  assert ids = array[a], format('second run claimed %s', ids);
  assert (select count(*) from public.claim_due_custom_domains(10)) = 0, 'a third run claimed leased rows';

  -- Each email once; a failed send gives it back.
  assert public.claim_custom_domain_notice(a, 'active'), 'first claim of an email refused';
  assert not public.claim_custom_domain_notice(a, 'active'), 'an email was claimed twice';
  assert public.claim_custom_domain_notice(a, 'reminder'), 'another email was refused';
  assert (select notices_sent from public.custom_domains where id = a) = array['active', 'reminder'],
    'notices_sent is wrong after two claims';
  perform public.release_custom_domain_notice(a, 'active');
  assert (select notices_sent from public.custom_domains where id = a) = array['reminder'],
    'release did not remove the code';
  assert public.claim_custom_domain_notice(a, 'active'), 'a released email could not be claimed again';
  assert not public.claim_custom_domain_notice('00000000-0000-4000-8000-0000000cdfff', 'active'),
    'an unknown row claimed an email';

  -- Our own rows count as taken, whatever Vercel's search says.
  assert public.custom_domain_name_taken('domain-check-b.com'), 'another couple''s name is free';
  assert public.custom_domain_name_taken('Domain-Check-B.COM'), 'the name check is case-sensitive';
  assert public.custom_domain_name_taken('domain-check-b.com', '00000000-0000-4000-8000-00000000f001'),
    'another couple''s name is free when the caller is a third site';
  assert not public.custom_domain_name_taken('domain-check-b.com', '00000000-0000-4000-8000-00000000f002'),
    'a couple finds its own name taken';
  assert not public.custom_domain_name_taken('nobody-chose-this.com'), 'an unknown name is taken';
end $$;
reset role;

rollback;
\echo 'custom_domains checks passed'
