-- Checks for 20261002220000_checkout_provisions.sql. LOCAL database only:
--   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
--     -v ON_ERROR_STOP=1 -f supabase/tests/checkout_provisions.sql
-- Everything runs in one transaction that is rolled back: nothing stays behind.
--
-- now() is the transaction's start time, so it does not move between the
-- statements below: claims that must differ are given explicit times.
begin;

-- c1001 owns wedding c2001; c1002 and c1003 have no wedding yet.
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-8000-0000000c1001', 'claim-check@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000c1002', 'claim-check-2@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000c1003', 'claim-check-3@example.test', 'authenticated', 'authenticated');
insert into public.profiles (id) values
  ('00000000-0000-4000-8000-0000000c1001'),
  ('00000000-0000-4000-8000-0000000c1002'),
  ('00000000-0000-4000-8000-0000000c1003')
on conflict (id) do nothing;
insert into public.weddings (id, user_id) values
  ('00000000-0000-4000-8000-0000000c2001', '00000000-0000-4000-8000-0000000c1001');

-- 1. Nobody but the service role --------------------------------------------------
do $$
declare
  who text;
  what text;
begin
  assert (select relrowsecurity from pg_class where oid = 'public.checkout_provisions'::regclass),
    'RLS is not enabled on checkout_provisions';
  assert not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'checkout_provisions'),
    'checkout_provisions has a policy';

  foreach who in array array['anon', 'authenticated'] loop
    foreach what in array array['select', 'insert', 'update', 'delete', 'truncate', 'references', 'trigger'] loop
      assert not has_table_privilege(who, 'public.checkout_provisions', what),
        format('%s holds %s on checkout_provisions', who, what);
    end loop;
  end loop;
  foreach what in array array['select', 'insert', 'update', 'delete'] loop
    assert has_table_privilege('service_role', 'public.checkout_provisions', what),
      format('service_role lacks %s on checkout_provisions', what);
  end loop;
end $$;

insert into public.checkout_provisions (payment_intent_id, claimed_at)
values ('pi_claim_check_seen', now() - interval '1 minute');

-- What a visitor's or a couple's session actually gets: refused, not filtered.
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$
begin
  begin
    perform 1 from public.checkout_provisions;
    raise exception 'anon could select checkout_provisions';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.checkout_provisions (payment_intent_id) values ('pi_claim_check_anon');
    raise exception 'anon could insert a claim';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.checkout_provisions set wedding_id = null where payment_intent_id = 'pi_claim_check_seen';
    raise exception 'anon could update a claim';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.checkout_provisions where payment_intent_id = 'pi_claim_check_seen';
    raise exception 'anon could delete a claim';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-0000000c1001","role":"authenticated"}', true);
do $$
begin
  begin
    perform 1 from public.checkout_provisions;
    raise exception 'authenticated could select checkout_provisions';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.checkout_provisions (payment_intent_id) values ('pi_claim_check_auth');
    raise exception 'authenticated could insert a claim';
  exception when insufficient_privilege then null;
  end;
  begin
    -- A couple stamping their own wedding on someone's payment would make
    -- that payment adopt it.
    update public.checkout_provisions
       set wedding_id = '00000000-0000-4000-8000-0000000c2001'
     where payment_intent_id = 'pi_claim_check_seen';
    raise exception 'authenticated could update a claim';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.checkout_provisions where payment_intent_id = 'pi_claim_check_seen';
    raise exception 'authenticated could delete a claim';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- 2. The service role: one owner per payment, one taker per dead claim -----------
set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
do $$
declare
  r public.checkout_provisions;
  stale constant timestamptz := now() - interval '11 minutes';
  recent constant timestamptz := now() - interval '30 seconds';
  n int;
begin
  -- The owner's claim, as createWedding makes it.
  insert into public.checkout_provisions (payment_intent_id) values ('pi_claim_check_1')
  on conflict (payment_intent_id) do nothing
  returning * into r;
  assert r.payment_intent_id = 'pi_claim_check_1', 'the first claim returned no row';
  assert r.wedding_id is null, 'a fresh claim carries a wedding';
  assert r.claimed_at = now() and r.updated_at = now(), 'claimed_at / updated_at default is not now()';

  -- A second pass over the same payment: no row back, nothing changed.
  r := null;
  insert into public.checkout_provisions (payment_intent_id) values ('pi_claim_check_1')
  on conflict (payment_intent_id) do nothing
  returning * into r;
  assert r.payment_intent_id is null, 'a second claim on one payment returned a row';
  assert (select count(*) from public.checkout_provisions where payment_intent_id = 'pi_claim_check_1') = 1,
    'one payment holds two claims';

  -- And a plain insert is refused outright.
  begin
    insert into public.checkout_provisions (payment_intent_id) values ('pi_claim_check_1');
    raise exception 'a duplicate claim was accepted';
  exception when unique_violation then null;
  end;

  -- The wedding must exist, and its deletion leaves the claim without one.
  begin
    update public.checkout_provisions
       set wedding_id = '00000000-0000-4000-8000-0000000c2fff'
     where payment_intent_id = 'pi_claim_check_1';
    raise exception 'a claim was pointed at a wedding that does not exist';
  exception when foreign_key_violation then null;
  end;

  -- Take-over of a dead claim: conditional on the claimed_at read, and on no
  -- wedding yet. Exactly one of two takers matches.
  insert into public.checkout_provisions (payment_intent_id, claimed_at, updated_at)
  values ('pi_claim_check_2', stale, stale);

  update public.checkout_provisions
     set claimed_at = now(), updated_at = now()
   where payment_intent_id = 'pi_claim_check_2' and claimed_at = stale and wedding_id is null;
  get diagnostics n = row_count;
  assert n = 1, format('the first take-over matched %s rows', n);

  update public.checkout_provisions
     set claimed_at = now(), updated_at = now()
   where payment_intent_id = 'pi_claim_check_2' and claimed_at = stale and wedding_id is null;
  get diagnostics n = row_count;
  assert n = 0, 'a second taker with the same stale claimed_at matched';
  assert (select claimed_at from public.checkout_provisions where payment_intent_id = 'pi_claim_check_2') = now(),
    'the take-over did not move claimed_at';

  -- A claim whose wedding exists is adopted, never taken over, however old.
  insert into public.checkout_provisions (payment_intent_id, wedding_id, claimed_at, updated_at)
  values ('pi_claim_check_3', '00000000-0000-4000-8000-0000000c2001', stale, stale);
  update public.checkout_provisions
     set claimed_at = now(), updated_at = now()
   where payment_intent_id = 'pi_claim_check_3' and claimed_at = stale and wedding_id is null;
  get diagnostics n = row_count;
  assert n = 0, 'a claim with a wedding was taken over';

  -- Recording the wedding is an upsert, as createWedding writes it. On the
  -- owner's claim it sets the wedding and leaves claimed_at alone.
  insert into public.checkout_provisions (payment_intent_id, claimed_at, updated_at)
  values ('pi_claim_check_4', recent, recent);
  insert into public.checkout_provisions (payment_intent_id, wedding_id, updated_at)
  values ('pi_claim_check_4', '00000000-0000-4000-8000-0000000c2001', now())
  on conflict (payment_intent_id) do update
    set wedding_id = excluded.wedding_id, updated_at = excluded.updated_at;
  select * into r from public.checkout_provisions where payment_intent_id = 'pi_claim_check_4';
  assert r.wedding_id = '00000000-0000-4000-8000-0000000c2001', 'recording the wedding did not land';
  assert r.claimed_at = recent, 'recording the wedding moved claimed_at';

  -- And it lands even when the row is gone (released by a pass that took the
  -- claim over, then lost the wedding insert).
  delete from public.checkout_provisions where payment_intent_id = 'pi_claim_check_5';
  insert into public.checkout_provisions (payment_intent_id, wedding_id, updated_at)
  values ('pi_claim_check_5', '00000000-0000-4000-8000-0000000c2001', now())
  on conflict (payment_intent_id) do update
    set wedding_id = excluded.wedding_id, updated_at = excluded.updated_at;
  select * into r from public.checkout_provisions where payment_intent_id = 'pi_claim_check_5';
  assert r.wedding_id = '00000000-0000-4000-8000-0000000c2001', 'recording the wedding on a released claim did not land';

  -- A release only removes the releasing pass's own claim, still without a wedding.
  delete from public.checkout_provisions
   where payment_intent_id = 'pi_claim_check_4' and claimed_at = recent and wedding_id is null;
  get diagnostics n = row_count;
  assert n = 0, 'a claim with a wedding was released';
  delete from public.checkout_provisions
   where payment_intent_id = 'pi_claim_check_1' and claimed_at = stale and wedding_id is null;
  get diagnostics n = row_count;
  assert n = 0, 'a pass released a claim it no longer owns';
  delete from public.checkout_provisions
   where payment_intent_id = 'pi_claim_check_1' and claimed_at = now() and wedding_id is null;
  get diagnostics n = row_count;
  assert n = 1, 'the owner could not release its own claim';
end $$;
reset role;

-- 3. A deleted wedding leaves its claims without one ------------------------------
-- What createWedding does to a half-built wedding: the claim drops back to no
-- wedding, so its owner can release it and the next pass rebuilds.
delete from public.weddings where id = '00000000-0000-4000-8000-0000000c2001';
do $$
begin
  assert (select count(*) from public.checkout_provisions
           where payment_intent_id in ('pi_claim_check_3', 'pi_claim_check_4', 'pi_claim_check_5')
             and wedding_id is null) = 3,
    'deleting the wedding did not set its claims'' wedding_id to null';
end $$;

-- 4. One wedding per payment ------------------------------------------------------
do $$
declare
  constraint_hit text;
begin
  -- Weddings from before the column carry none, and any number of them can.
  insert into public.weddings (id, user_id) values
    ('00000000-0000-4000-8000-0000000c2002', '00000000-0000-4000-8000-0000000c1002');
  assert (select count(*) from public.weddings
           where id = '00000000-0000-4000-8000-0000000c2002' and payment_intent_id is null) = 1,
    'a wedding inserted without a payment carries one';
  delete from public.weddings where id = '00000000-0000-4000-8000-0000000c2002';

  insert into public.weddings (id, user_id, payment_intent_id) values
    ('00000000-0000-4000-8000-0000000c2002', '00000000-0000-4000-8000-0000000c1002', 'pi_claim_check_paid');

  -- A second wedding for the same payment, on another account.
  begin
    insert into public.weddings (user_id, payment_intent_id) values
      ('00000000-0000-4000-8000-0000000c1003', 'pi_claim_check_paid');
    raise exception 'one payment produced two weddings';
  exception when unique_violation then
    get stacked diagnostics constraint_hit = constraint_name;
    assert constraint_hit = 'weddings_payment_intent_id_key',
      format('the payment''s second wedding broke %s', constraint_hit);
  end;

  -- The same account and the same payment: Postgres names the account's rule
  -- (its index is older), which createWedding answers the same way.
  begin
    insert into public.weddings (user_id, payment_intent_id) values
      ('00000000-0000-4000-8000-0000000c1002', 'pi_claim_check_paid');
    raise exception 'one account and one payment produced two weddings';
  exception when unique_violation then
    get stacked diagnostics constraint_hit = constraint_name;
    assert constraint_hit = 'weddings_one_per_user',
      format('a wedding breaking both rules was reported on %s', constraint_hit);
  end;
end $$;

-- 5. Only the server writes a wedding's payment --------------------------------------
-- Couples insert, update and delete their own weddings through RLS: refused
-- here by the trigger itself (its message), not filtered away.
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-0000000c1002","role":"authenticated"}', true);
do $$
declare
  msg text;
  n int;
begin
  -- Their own wedding, carrying its payment: moved, cleared.
  begin
    update public.weddings set payment_intent_id = 'pi_claim_check_other'
     where id = '00000000-0000-4000-8000-0000000c2002';
    raise exception 'a couple moved their wedding to another payment';
  exception when insufficient_privilege then
    get stacked diagnostics msg = message_text;
    assert msg = 'weddings.payment_intent_id is set by the server only', format('refused by something else: %s', msg);
  end;
  begin
    update public.weddings set payment_intent_id = null
     where id = '00000000-0000-4000-8000-0000000c2002';
    raise exception 'a couple cleared their wedding''s payment';
  exception when insufficient_privilege then
    get stacked diagnostics msg = message_text;
    assert msg = 'weddings.payment_intent_id is set by the server only', format('refused by something else: %s', msg);
  end;

  -- What the dashboard does write still goes through, the payment included
  -- unchanged in the SET list.
  update public.weddings set wedding_date = '2027-06-12', payment_intent_id = payment_intent_id
   where id = '00000000-0000-4000-8000-0000000c2002';
  get diagnostics n = row_count;
  assert n = 1, 'a couple could not update their own wedding';
end $$;
reset role;

-- A couple with no wedding yet, creating one that claims a payment.
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-0000000c1003","role":"authenticated"}', true);
do $$
declare
  msg text;
begin
  begin
    insert into public.weddings (user_id, payment_intent_id) values
      ('00000000-0000-4000-8000-0000000c1003', 'pi_claim_check_someone_elses');
    raise exception 'a couple created a wedding carrying a payment';
  exception when insufficient_privilege then
    get stacked diagnostics msg = message_text;
    assert msg = 'weddings.payment_intent_id is set by the server only', format('refused by something else: %s', msg);
  end;
end $$;
reset role;

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$
declare
  msg text;
begin
  begin
    insert into public.weddings (user_id, payment_intent_id) values
      ('00000000-0000-4000-8000-0000000c1003', 'pi_claim_check_someone_elses');
    raise exception 'a visitor created a wedding carrying a payment';
  exception when insufficient_privilege then
    get stacked diagnostics msg = message_text;
    assert msg = 'weddings.payment_intent_id is set by the server only', format('refused by something else: %s', msg);
  end;
end $$;
reset role;

-- The service role, which createWedding runs as: sets it, and could move it.
set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
do $$
begin
  insert into public.weddings (id, user_id, payment_intent_id) values
    ('00000000-0000-4000-8000-0000000c2003', '00000000-0000-4000-8000-0000000c1003', 'pi_claim_check_server');
  update public.weddings set payment_intent_id = 'pi_claim_check_server_2'
   where id = '00000000-0000-4000-8000-0000000c2003';
  assert (select payment_intent_id from public.weddings where id = '00000000-0000-4000-8000-0000000c2003')
    = 'pi_claim_check_server_2', 'the service role could not write a wedding''s payment';
end $$;
reset role;

do $$
begin
  assert (select payment_intent_id from public.weddings where id = '00000000-0000-4000-8000-0000000c2002')
    = 'pi_claim_check_paid', 'a refused write changed the wedding''s payment';
  assert not exists (select 1 from public.weddings where payment_intent_id = 'pi_claim_check_someone_elses'),
    'a refused insert left a wedding behind';
end $$;

rollback;
\echo 'checkout_provisions checks passed'
