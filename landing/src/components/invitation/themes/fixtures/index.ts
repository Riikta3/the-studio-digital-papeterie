import type { InvitationData } from "../types";

import { HEAVY_WEDDING, MINIMAL_WEDDING } from "./other-wedding";

/**
 * The data a demo page renders: the theme's own demo, or — outside production —
 * one of the control datasets, picked with `?fixture=minimal|heavy`.
 *
 * In production the query string is ignored, so the public showcase can only
 * ever show a theme's real demo.
 */
export function demoDataFor(base: InvitationData, fixture: string | undefined): InvitationData {
  if (process.env.NODE_ENV === "production") return base;
  if (fixture === "minimal") return MINIMAL_WEDDING;
  if (fixture === "heavy") return HEAVY_WEDDING;
  return base;
}
