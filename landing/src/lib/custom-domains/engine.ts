import { searchDomains } from "@shared/lib/domain-search";

import { advanceCustomDomain } from "./advance";
import type { AdvanceDeps, AdvanceOutcome } from "./advance";
import { adminCustomDomainsDb } from "./db";
import { resendMailer } from "./emails";
import { probeHttps } from "./probe";
import { registrantFromEnv, registrantProblems } from "./registrant";
import { registrarFromEnv } from "./vercel-registrar";

/**
 * The purchase engine wired to the real world: the service-role database,
 * Vercel from the landing's environment, Resend, the public search, the
 * HTTPS probe and the clock. `advance.ts` stays free of all of it, so that
 * every branch of it is tested against fakes.
 *
 * Server only. The dashboard never imports this, and never holds
 * VERCEL_API_TOKEN (plan, Phase 7 guards).
 */

let registrantReported = false;

/**
 * The real dependencies, from `env`. `overrides` replaces some of them — the
 * tests swap the database and the mailer to see what the environment alone
 * decides.
 */
export function engineDepsFromEnv(
  env: Record<string, string | undefined> = process.env,
  overrides: Partial<AdvanceDeps> = {},
): AdvanceDeps {
  const contact = registrantFromEnv(env);
  if (!contact && !registrantReported) {
    // Names only, never values. The studio alert follows on the first row
    // that needs a purchase.
    registrantReported = true;
    console.error("[DOMAIN_REGISTRANT_MISSING] missing or invalid:", registrantProblems(env).join(", "));
  }
  return {
    db: adminCustomDomainsDb,
    registrar: registrarFromEnv(env),
    contact,
    // The step's remaining budget narrows each one's own timeout.
    search: (names, opts) => searchDomains(names, { maxAgeMs: opts.maxAgeMs, timeoutMs: opts.timeoutMs }),
    probe: (url, opts) => probeHttps(url, undefined, opts?.timeoutMs),
    mailer: resendMailer,
    now: () => new Date(),
    ...overrides,
  };
}

/**
 * One step of `customDomainId`'s row, with the real dependencies. Never
 * throws, so it can run where nobody would see an error: provisioning calls
 * it through `after()` once the couple is on their way to the dashboard,
 *
 *   after(() => advanceCustomDomainSafely(row.id));
 *
 * and a row that is not due, or that another run holds, is simply left to
 * the cron.
 */
export async function advanceCustomDomainSafely(customDomainId: string): Promise<AdvanceOutcome | "error"> {
  try {
    const outcome = await advanceCustomDomain(customDomainId, engineDepsFromEnv());
    console.log("[DOMAIN_ADVANCE]", { id: customDomainId, outcome });
    return outcome;
  } catch (error) {
    // Only the claim itself can throw here (the database unreachable): the
    // row stays as it was, and the next cron run claims it.
    console.error("[DOMAIN_ADVANCE_FAILED]", { id: customDomainId }, error);
    return "error";
  }
}
