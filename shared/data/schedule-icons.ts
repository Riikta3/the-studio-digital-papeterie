/**
 * What a moment in the day *is*, so any theme can draw it.
 *
 * The one list three places agree on: the themes' contract
 * (`landing/.../themes/types.ts`, which re-exports it as `SCHEDULE_ICONS`), the
 * editor's icon picker, and the `schedule_entries_icon_known` check in the
 * database (migration 20260927120000). Adding a value means adding it to all
 * three — and a drawing of it to every theme.
 */
export const SCHEDULE_ICON_KEYS = [
  "ceremony",
  "cocktail",
  "dinner",
  "party",
  "brunch",
] as const;

export type ScheduleIconKey = (typeof SCHEDULE_ICON_KEYS)[number];
