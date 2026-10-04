import { DAY_OF_MODULE } from "../data/modules";
import { hasMeteredAddOns } from "./pricing";

/**
 * When « Trouve ta place » (the Jour J guest page) became a module. Sites sold
 * before it had the Jour J with every plan and keep it.
 */
export const DAY_OF_MODULE_SINCE = "2026-10-05T00:00:00Z";

export interface DayOfSite {
  plan_id: string | null;
  modules: string[] | null;
  created_at: string | null;
}

/**
 * Whether this couple may switch the Jour J guest page on: the unlimited plans
 * include every module, Signature only when it was bought. A page already on
 * stays allowed, so nobody loses one that guests may be using.
 */
export function dayOfIncluded(site: DayOfSite | null, alreadyEnabled: boolean): boolean {
  if (alreadyEnabled) return true;
  if (!site) return false;
  if (!hasMeteredAddOns(site.plan_id)) return true;
  if ((site.modules ?? []).includes(DAY_OF_MODULE)) return true;
  const sold = Date.parse(site.created_at ?? "");
  return Number.isFinite(sold) && sold < Date.parse(DAY_OF_MODULE_SINCE);
}
