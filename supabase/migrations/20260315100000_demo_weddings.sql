-- Demo weddings — one per animation type
-- These are read-only demo entries used by ProductDemoViewer

-- Add is_demo flag to sites table
alter table public.sites
  add column if not exists is_demo boolean default false;

DO $$
DECLARE
  uid_envelope  uuid := '00000000-0000-0000-0000-000000000001';
  uid_doors     uuid := '00000000-0000-0000-0000-000000000002';
  uid_curtains  uuid := '00000000-0000-0000-0000-000000000003';
  wid_envelope  uuid := '00000000-0000-0001-0000-000000000001';
  wid_doors     uuid := '00000000-0000-0001-0000-000000000002';
  wid_curtains  uuid := '00000000-0000-0001-0000-000000000003';
  sid_envelope  uuid := '00000000-0000-0002-0000-000000000001';
  sid_doors     uuid := '00000000-0000-0002-0000-000000000002';
  sid_curtains  uuid := '00000000-0000-0002-0000-000000000003';
BEGIN

  -- ── Auth Users (required before profiles due to FK) ───────────────────────
  INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at, role)
  VALUES
    (uid_envelope, 'demo-envelope@thestudio.wedding', now(), now(), now(), 'authenticated'),
    (uid_doors,    'demo-doors@thestudio.wedding',    now(), now(), now(), 'authenticated'),
    (uid_curtains, 'demo-curtains@thestudio.wedding', now(), now(), now(), 'authenticated')
  ON CONFLICT (id) DO NOTHING;

  -- ── Profiles ──────────────────────────────────────────────────────────────
  INSERT INTO profiles (id, first_name, last_name)
  VALUES
    (uid_envelope, 'Sophie',  'Martin'),
    (uid_doors,    'Camille', 'Dupont'),
    (uid_curtains, 'Léa',     'Bernard')
  ON CONFLICT (id) DO NOTHING;

  -- ── Weddings ──────────────────────────────────────────────────────────────
  INSERT INTO weddings (id, user_id, partner_name, wedding_date)
  VALUES
    (wid_envelope,  uid_envelope, 'Thomas',  '2026-09-15'),
    (wid_doors,     uid_doors,    'Antoine', '2026-07-20'),
    (wid_curtains,  uid_curtains, 'Hugo',    '2026-08-10')
  ON CONFLICT (id) DO NOTHING;

  -- ── Sites ─────────────────────────────────────────────────────────────────
  INSERT INTO sites (id, wedding_id, slug, theme_id, plan_id, modules, extras, languages, is_demo)
  VALUES
    (
      sid_envelope, wid_envelope,
      'demo-envelope',
      'floral',
      'premium',
      '{"countdown","timeline","menu","gallery","rsvp"}',
      '{}',
      '{"fr"}',
      true
    ),
    (
      sid_doors, wid_doors,
      'demo-doors',
      'floral',
      'premium',
      '{"countdown","timeline","menu","gallery","rsvp"}',
      '{}',
      '{"fr"}',
      true
    ),
    (
      sid_curtains, wid_curtains,
      'demo-curtains',
      'floral',
      'premium',
      '{"countdown","timeline","menu","gallery","rsvp"}',
      '{}',
      '{"fr"}',
      true
    )
  ON CONFLICT (id) DO NOTHING;

  -- ── Settings (no guest_code → public access) ──────────────────────────────
  INSERT INTO settings (wedding_id, guest_code)
  VALUES
    (wid_envelope,  NULL),
    (wid_doors,     NULL),
    (wid_curtains,  NULL)
  ON CONFLICT (wedding_id) DO NOTHING;

END $$;
