/**
 * Types owned by "Belle Rive" alone.
 *
 * Carpooling is not one of the shared `ModuleId`s and there is no
 * `public.modules` row for it, so it has no place on `InvitationData` — putting
 * it there would let a wedding claim a module the checkout cannot sell. It
 * lives here instead and reaches the root through the manifest.
 */

/**
 * One offered ride.
 *
 * The source project's equivalent carried a `phone` field, which its API
 * returned to anonymous visitors and the page turned into a `wa.me/` link. That
 * field is absent by design: the theme has no way to render a phone number, so
 * it cannot leak one.
 */
export type CarpoolTrip = {
  id: number;
  /** First name only — enough to recognise a driver, not to identify a stranger. */
  name: string;
  departure: string;
  /** ISO date, `YYYY-MM-DD`. */
  travelDate: string;
  /** `HH:MM`, kept as text: it is a wall-clock time, not an instant. */
  travelTime: string;
  seats: number;
  returnTrip: boolean;
};
