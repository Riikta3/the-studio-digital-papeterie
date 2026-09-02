-- Mark the pre-existing `tables.x_position` / `y_position` as deprecated.
--
-- Documentation only: no column is added, changed or dropped here.
--
-- Why this exists as its own migration: `20260902150000_wiring_schema_gaps.sql`
-- added `tables.x` / `tables.y` for the seating canvas. It should not have —
-- or rather, it should have said why it was not reusing what was already
-- there. `x_position` / `y_position` have been on `tables` since
-- `00000000000000_full_db_reset.sql:144-145`, and adding a second pair without
-- a word about the first leaves the next reader with two plausible choices and
-- no way to tell which is live.
--
-- Established before writing this, rather than assumed:
--   * `x_position` and `y_position` are 0 on every row of every wedding —
--     they carry no data (checked: zero rows where x_position <> 0).
--   * Nothing reads them. The only reference left in the codebase is the
--     `Table` interface in `dashboard/src/types/index.ts`, and no module
--     imports `Table` from `@/types`. The seating canvas that used them was
--     deleted in commit 6f79f571.
--
-- They are annotated rather than dropped: removing a column is the owner's
-- decision, not a wiring migration's — the same rule applied to
-- `guests.dietary_requirements`. Backfill-then-drop is a safe follow-up
-- whenever they want it, and these comments are what will tell them it is
-- safe.
comment on column public.tables.x_position is
  'DEPRECATED - superseded by tables.x, which the current seating board reads. '
  'Unused and 0 on every row. Safe to drop; kept because dropping a column is '
  'the owner''s call.';

comment on column public.tables.y_position is
  'DEPRECATED - superseded by tables.y. See tables.x_position.';

comment on column public.tables.x is
  'Seating-canvas X in px. The live coordinate the desktop board reads and '
  'writes; x_position is its deprecated predecessor.';

comment on column public.tables.y is
  'Seating-canvas Y in px. See tables.x.';
