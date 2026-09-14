-- Migration: the guest code finally becomes a door.
--
-- `settings.guest_code` was added in March, described as the "access gate code
-- shown to guests". The dashboard has been letting couples set it ever since,
-- under the words "Les invités devront saisir ce code pour accéder à votre
-- faire-part" — and nothing has ever read it. A wedding with a code set was
-- served in full to anyone who knew the URL, so the promise on that screen was
-- simply untrue.
--
-- These two functions are what a guest's browser is allowed to ask. Both are
-- security-definer because `settings` is unreadable to anon by RLS, and that
-- stays exactly as it is: the code itself never leaves the database.
--
--   * `invitation_is_gated`  — "does this wedding require a code?" (boolean)
--   * `verify_guest_code`    — "is this the code?" (boolean)
--
-- Deliberately NOT one function returning the code for the server to compare:
-- the value would then travel to the Next server, into its logs on any error,
-- and into whatever an accidental `console.log` catches. Comparing inside
-- Postgres keeps the secret in exactly one place.
--
-- ── Opt-in, not blanket ───────────────────────────────────────────────────
-- A wedding with no code stays open, as every wedding is today. Making the
-- gate mandatory would shut off every invitation already in circulation —
-- including the three demo weddings the marketing site renders — the moment
-- this deployed.

-- ── 1. Is this invitation gated? ──────────────────────────────────────────
--
-- Safe to call anonymously: it answers about the EXISTENCE of a code, never
-- its value, and only for a wedding whose slug the caller already holds.
create or replace function public.invitation_is_gated(p_wedding_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.settings s
    where s.wedding_id = p_wedding_id
      and s.guest_code is not null
      and length(trim(s.guest_code)) > 0
  );
$$;

comment on function public.invitation_is_gated(uuid) is
  'Whether this wedding requires a guest code before its invitation renders. '
  'Returns only true/false — never the code — so it is safe to call from an '
  'anonymous page render.';

revoke all on function public.invitation_is_gated(uuid) from public;
grant execute on function public.invitation_is_gated(uuid) to anon, authenticated;

-- ── 1b. A fingerprint of the code in force ────────────────────────────────
--
-- Passes are signed with this, so changing the code invalidates every pass
-- already issued. A couple who rotates their code because it was forwarded
-- to the wrong group would otherwise change nothing: the people already
-- through the door stay through it for the life of their cookie.
--
-- A hash, not the code: this is read by the Next server on every render of a
-- gated invitation, and the point of `verify_guest_code` is that the code
-- itself never travels there. Truncated to 16 hex characters, which is far
-- beyond what distinguishing one code from the next requires.
create or replace function public.guest_code_fingerprint(p_wedding_id uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  -- Schema-qualified: pgcrypto lives in `extensions` on Supabase, and this
  -- function's search_path is deliberately pinned to `public` — widening it
  -- on a security-definer function to reach `digest` would be the wrong
  -- trade.
  select left(encode(extensions.digest(upper(trim(s.guest_code)), 'sha256'), 'hex'), 16)
  from public.settings s
  where s.wedding_id = p_wedding_id
    and s.guest_code is not null
    and length(trim(s.guest_code)) > 0;
$$;

comment on function public.guest_code_fingerprint(uuid) is
  'An opaque fingerprint of the guest code currently in force. Passes are '
  'signed with it, so rotating the code expires every pass already issued. '
  'Never returns the code itself — that is the whole point of keeping the '
  'comparison inside verify_guest_code.';

revoke all on function public.guest_code_fingerprint(uuid) from public;
grant execute on function public.guest_code_fingerprint(uuid) to anon, authenticated;

-- ── 2. Is this the right code? ────────────────────────────────────────────
--
-- Case- and whitespace-insensitive, matching how `resolve_wedding_code`
-- treats the RSVP code: a guest reading a code off a printed card should not
-- be failed by capitals.
--
-- Rate limited through the same counter the RSVP entry screen uses. A guest
-- code is short by design — it is meant to be typed off paper — so without a
-- limit it is guessable in minutes. 10 tries per 10 minutes per caller bucket:
-- tight enough to stop a sweep, loose enough that a guest mistyping a couple
-- of times is not locked out of a wedding they were invited to.
create or replace function public.verify_guest_code(
  p_wedding_id uuid,
  p_code text,
  p_bucket text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ok boolean;
begin
  if p_wedding_id is null or p_code is null then
    return false;
  end if;

  -- Counted before the comparison, so a wrong guess costs an attempt whether
  -- or not it was close. Returning false on exhaustion rather than raising
  -- keeps the screen's behaviour identical to a wrong code — a caller cannot
  -- tell "throttled" from "wrong", which is one less thing to probe for.
  if not public.check_rsvp_rate(
    p_wedding_id, p_bucket, 'search', 10, interval '10 minutes'
  ) then
    return false;
  end if;

  select exists (
    select 1
    from public.settings s
    where s.wedding_id = p_wedding_id
      and s.guest_code is not null
      and upper(trim(s.guest_code)) = upper(trim(p_code))
  ) into v_ok;

  return coalesce(v_ok, false);
end;
$$;

comment on function public.verify_guest_code(uuid, text, text) is
  'Checks a guest code against a wedding, inside the database, so the code '
  'itself never leaves it. Case- and whitespace-insensitive like '
  'resolve_wedding_code. Rate limited at 10 attempts per 10 minutes per '
  'caller bucket: a guest code is short by design and would otherwise be '
  'guessable. A throttled caller is told "wrong", not "throttled".';

revoke all on function public.verify_guest_code(uuid, text, text) from public;
grant execute on function public.verify_guest_code(uuid, text, text) to anon, authenticated;
