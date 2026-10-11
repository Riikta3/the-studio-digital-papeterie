import { advanceDue } from "@/lib/custom-domains/advance";
import { handleCustomDomainsCron } from "@/lib/custom-domains/cron";
import { engineDepsFromEnv } from "@/lib/custom-domains/engine";

/**
 * The purchase engine's safety net
 * (docs/superpowers/specs/2026-10-02-custom-domain-design.md, D5, "Triggers").
 *
 * Called once a day by Vercel Cron (landing/vercel.json) — the Hobby plan's
 * limit; back to every 5 minutes on Pro — on production
 * deployments only: a preview is advanced by `after()` alone, or by calling
 * this route by hand with the secret. Each run advances up to 10 due rows by
 * one step and sends the time-based emails. Runs may be missed, duplicated or
 * overlap; the leases and the claimed emails make that harmless. The door
 * (`Authorization: Bearer $CRON_SECRET`) is `handleCustomDomainsCron`.
 */

/**
 * Each row's step has a 90 s budget, the rows run side by side, and each
 * row's emails follow its step (10 s each at most); the time-based emails
 * then stop starting at 240 s (advance.ts, RUN_BUDGET_MS). Asked explicitly
 * so a platform default shorter than that cannot cut a step off halfway,
 * which the engine would end up counting as a step that keeps dying.
 */
export const maxDuration = 300;

export async function GET(request: Request) {
  return handleCustomDomainsCron(request, {
    secret: process.env.CRON_SECRET,
    run: () => advanceDue(engineDepsFromEnv()),
  });
}
