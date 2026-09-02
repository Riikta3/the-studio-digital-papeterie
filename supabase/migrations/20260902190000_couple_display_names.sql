-- Couple display names for the anonymous Jour J guest page (cahier §16).
--
-- The guest page greeted "Émilie & Jordy", hardcoded. The real names live on
-- `profiles` (`first_name`, `partner_name`), joined through
-- `weddings.user_id` — exactly the join `dashboard-summary-actions.ts` and
-- `rsvp-actions.ts` already do for the authenticated couple.
--
-- Anon cannot read `profiles`, and must not: that table also carries
-- `stripe_customer_id`. It cannot read `weddings` either. So this is the same
-- class of problem `search_guest_table` solves — an anonymous page needs one
-- narrow fact from a table it must never be able to select — and it gets the
-- same shape of answer: a security-definer function that returns only the two
-- display strings, for a wedding whose day-of module is switched on.
--
-- Why a function rather than a `sites.couple_display_name` column (the other
-- option considered): a column would duplicate names that `profiles` already
-- owns and that `ProfileSettings.tsx` already edits, creating a second source
-- of truth that silently goes stale the first time a couple corrects a
-- spelling. This function always reflects the profile.
--
-- What it deliberately does NOT expose: the profile id, the user id,
-- `last_name`, `stripe_customer_id`, the wedding date, or anything about a
-- wedding whose day-of module is disabled (that returns zero rows, so an
-- unenabled wedding stays invisible rather than merely empty — the same
-- guarantee the anon policies on `sites`/`day_of_settings` give).

create or replace function public.get_couple_display_names(p_wedding_id uuid)
returns table (
  first_name text,
  partner_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_wedding_id is null then
    return;
  end if;

  return query
  select
    p.first_name,
    p.partner_name
  from public.weddings w
  join public.profiles p on p.id = w.user_id
  -- The module gate: no day-of settings row, or a disabled one, and this
  -- returns nothing. Mirrors the `using (enabled = true)` on the anon
  -- day_of_settings policy so the two cannot disagree.
  join public.day_of_settings ds on ds.wedding_id = w.id and ds.enabled = true
  where w.id = p_wedding_id
  limit 1;
end;
$$;

comment on function public.get_couple_display_names(uuid) is
  'Security-definer RPC returning only the two couple display names '
  '(profiles.first_name, profiles.partner_name) for a wedding whose day-of '
  'module is enabled. It exists so the anonymous Jour J guest page can greet '
  'the couple by name without `profiles` — which also holds '
  'stripe_customer_id — or `weddings` ever gaining an anon select policy. '
  'Do not widen the returned columns; see cahier des charges §16.';

-- No default PUBLIC execute; explicit grant to the two roles the guest page
-- runs as (`anon` for a scanned QR code, `authenticated` for a couple
-- previewing their own page). Same grant pattern as search_guest_table.
revoke all on function public.get_couple_display_names(uuid) from public;
grant execute on function public.get_couple_display_names(uuid) to anon, authenticated;
