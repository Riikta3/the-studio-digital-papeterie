-- Checks for 20261010120000_invitation_household_rsvp.sql. LOCAL database only:
--   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
--     -v ON_ERROR_STOP=1 -f supabase/tests/invitation_household_rsvp.sql
-- Everything runs in one transaction that is rolled back: nothing stays behind.
begin;

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-8000-00000000a101', 'household-rsvp@example.test', 'authenticated', 'authenticated');
insert into public.profiles (id) values ('00000000-0000-4000-8000-00000000a101')
on conflict (id) do nothing;
insert into public.weddings (id, user_id) values
  ('00000000-0000-4000-8000-00000000b101', '00000000-0000-4000-8000-00000000a101');

-- The Martin family (Paul, Claire Dubois, Léo), and two homonym households.
insert into public.households (id, wedding_id, name) values
  ('00000000-0000-4000-8000-00000000c101', '00000000-0000-4000-8000-00000000b101', 'Famille Martin'),
  ('00000000-0000-4000-8000-00000000c102', '00000000-0000-4000-8000-00000000b101', 'Durand (Lyon)'),
  ('00000000-0000-4000-8000-00000000c103', '00000000-0000-4000-8000-00000000b101', 'Durand (Nantes)');
insert into public.guests (id, wedding_id, household_id, first_name, last_name, is_child) values
  ('00000000-0000-4000-8000-00000000d101', '00000000-0000-4000-8000-00000000b101', '00000000-0000-4000-8000-00000000c101', 'Paul', 'Martin', false),
  ('00000000-0000-4000-8000-00000000d102', '00000000-0000-4000-8000-00000000b101', '00000000-0000-4000-8000-00000000c101', 'Claire', 'Dubois-Hélène', false),
  ('00000000-0000-4000-8000-00000000d103', '00000000-0000-4000-8000-00000000b101', '00000000-0000-4000-8000-00000000c101', 'Léo', 'Martin', true),
  ('00000000-0000-4000-8000-00000000d104', '00000000-0000-4000-8000-00000000b101', '00000000-0000-4000-8000-00000000c102', 'Anne', 'Durand', false),
  ('00000000-0000-4000-8000-00000000d105', '00000000-0000-4000-8000-00000000b101', '00000000-0000-4000-8000-00000000c103', 'Anne', 'Durand', false);

do $$
declare
  w constant uuid := '00000000-0000-4000-8000-00000000b101';
  martin constant uuid := '00000000-0000-4000-8000-00000000c101';
  r record;
  n int;
  ok boolean;
begin
  -- Normalisation: case, accents, hyphens and order do not matter.
  assert public.rsvp_name_key('  Jean-Éric  D''Almeida ') = 'jean eric d almeida',
    format('rsvp_name_key = %s', public.rsvp_name_key('  Jean-Éric  D''Almeida '));
  assert public.rsvp_name_key('ÀÉÎÕÜÇ') = 'aeiouc', public.rsvp_name_key('ÀÉÎÕÜÇ');

  -- Any member's whole name finds the whole household.
  select * into r from public.find_invitation_household(w, 'paul martin', 'b1');
  assert r.household_id = martin, 'Paul finds the Martin household';
  assert jsonb_array_length(r.members) = 3, 'all three members come back';
  assert r.answered_at is null, 'not answered yet';
  assert not (r.members->0 ? 'email'), 'no column beyond the whitelist';

  select * into r from public.find_invitation_household(w, 'Dubois Helene Claire', 'b1');
  assert r.household_id = martin, 'Claire, other surname, reversed order, no accent';

  -- Fragments and single words find nothing: the list cannot be browsed.
  select count(*) into n from public.find_invitation_household(w, 'Martin', 'b1');
  assert n = 0, 'one word finds nothing';
  select count(*) into n from public.find_invitation_household(w, 'Paul Mar', 'b1');
  assert n = 0, 'a fragment finds nothing';
  select count(*) into n from public.find_invitation_household(w, '% %', 'b1');
  assert n = 0, 'wildcards find nothing';

  -- Homonyms in two households: nobody is guessed.
  select count(*) into n from public.find_invitation_household(w, 'Anne Durand', 'b1');
  assert n = 0, 'two households with the name: no match';

  -- An answer that forgets a member is refused, and writes nothing.
  ok := public.submit_invitation_household_rsvp(w, martin, 'Paul Martin',
    '[{"id":"00000000-0000-4000-8000-00000000d101","status":"confirmed"},
      {"id":"00000000-0000-4000-8000-00000000d102","status":"confirmed"}]'::jsonb,
    null, null, 'b1');
  assert not ok, 'missing member refused';
  select count(*) into n from public.guests where household_id = martin and status <> 'pending';
  assert n = 0, 'refused answer wrote nothing';

  -- A name outside the household cannot answer for it.
  ok := public.submit_invitation_household_rsvp(w, martin, 'Anne Durand',
    '[{"id":"00000000-0000-4000-8000-00000000d101","status":"declined"},
      {"id":"00000000-0000-4000-8000-00000000d102","status":"declined"},
      {"id":"00000000-0000-4000-8000-00000000d103","status":"declined"}]'::jsonb,
    null, null, 'b1');
  assert not ok, 'stranger refused';

  -- Paul answers: he and Léo come, Claire does not.
  ok := public.submit_invitation_household_rsvp(w, martin, 'Paul Martin',
    '[{"id":"00000000-0000-4000-8000-00000000d101","status":"confirmed"},
      {"id":"00000000-0000-4000-8000-00000000d102","status":"declined"},
      {"id":"00000000-0000-4000-8000-00000000d103","status":"confirmed"}]'::jsonb,
    'Végétarien', 'Merci !', 'b1');
  assert ok, 'Paul''s answer accepted';
  select status into r from public.households where id = martin;
  assert r.status = 'partial', format('household status = %s', r.status);
  select * into r from public.rsvp_responses where household_id = martin;
  assert r.attendance, 'answer counted as coming';
  assert r.respondent_first_name = 'Paul', 'lead is Paul';
  assert r.guest_count = 1 and r.participants->0->>'first_name' = 'Léo'
    and r.participants->0->>'relation_type' = 'child', format('participants = %s', r.participants);
  assert r.message = 'Merci !' and r.dietary = 'Végétarien', 'message and diet kept';
  select dietary_requirements into r from public.guests where id = '00000000-0000-4000-8000-00000000d101';
  assert r.dietary_requirements = 'Végétarien', 'diet on the respondent';

  -- Claire answers after him: nobody comes in the end. Same row, updated.
  ok := public.submit_invitation_household_rsvp(w, martin, 'Claire Dubois-Hélène',
    '[{"id":"00000000-0000-4000-8000-00000000d101","status":"declined"},
      {"id":"00000000-0000-4000-8000-00000000d102","status":"declined"},
      {"id":"00000000-0000-4000-8000-00000000d103","status":"declined"}]'::jsonb,
    null, null, 'b2');
  assert ok, 'Claire''s answer accepted';
  select count(*) into n from public.rsvp_responses where household_id = martin;
  assert n = 1, 'one row per household';
  select * into r from public.rsvp_responses where household_id = martin;
  assert r.attendance = false and r.guest_count = 0, 'updated to declined';
  assert r.message = 'Merci !', 'earlier message not erased by an empty one';
  select status into r from public.households where id = martin;
  assert r.status = 'declined', format('household status = %s', r.status);

  select * into r from public.find_invitation_household(w, 'Leo Martin', 'b3');
  assert r.answered_at is not null, 'answered_at shown on the next lookup';
  assert r.members->0->>'status' = 'declined', 'current statuses come back';

  -- "Pas encore sûr" for one, nobody confirmed: pending, attendance unknown.
  ok := public.submit_invitation_household_rsvp(w, martin, 'Paul Martin',
    '[{"id":"00000000-0000-4000-8000-00000000d101","status":"pending"},
      {"id":"00000000-0000-4000-8000-00000000d102","status":"declined"},
      {"id":"00000000-0000-4000-8000-00000000d103","status":"declined"}]'::jsonb,
    null, null, 'b1');
  select status into r from public.households where id = martin;
  assert r.status = 'pending', format('household status = %s', r.status);
  select attendance into r from public.rsvp_responses where household_id = martin;
  assert r.attendance is null, 'attendance unknown';

  -- The dashboard's /rsvp page no longer marks a household that declines as coming.
  ok := public.submit_rsvp_household(w, martin, null, null, null, null,
    '[{"id":"00000000-0000-4000-8000-00000000d101","status":"declined"}]'::jsonb, 'b4');
  select status into r from public.households where id = martin;
  assert r.status = 'declined', format('submit_rsvp_household status = %s', r.status);

  raise notice 'invitation_household_rsvp: all checks passed';
end;
$$;

rollback;
