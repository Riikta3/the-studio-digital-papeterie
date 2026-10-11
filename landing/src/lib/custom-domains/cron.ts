import { createHash, timingSafeEqual } from "node:crypto";

import type { AdvanceDueSummary } from "./advance";

/**
 * The door of `GET /api/cron/custom-domains`
 * (docs/superpowers/specs/2026-10-02-custom-domain-design.md, D5, "Triggers"),
 * apart from the route so its rules are tested with a fake engine.
 *
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. Without a secret
 * configured the route refuses everyone, rather than letting anyone drive the
 * purchases; `run` is only called once the request is let in.
 */
export interface CronDeps {
  /** `process.env.CRON_SECRET`. */
  secret: string | undefined;
  /** One run of the engine: `advanceDue(engineDepsFromEnv())`. */
  run: () => Promise<AdvanceDueSummary>;
}

/** Compares digests, so the comparison takes the same time whatever the header holds. */
function sameSecret(given: string, expected: string): boolean {
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(given), digest(expected));
}

export async function handleCustomDomainsCron(request: Request, deps: CronDeps): Promise<Response> {
  const secret = deps.secret?.trim();
  const header = request.headers.get("authorization") ?? "";
  if (!secret || !sameSecret(header, `Bearer ${secret}`)) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const summary = await deps.run();
    console.log("[DOMAIN_CRON]", JSON.stringify(summary));
    return Response.json(summary);
  } catch (error) {
    // Only the claim itself can throw: nothing was leased, the next run retries.
    console.error("[DOMAIN_CRON_FAILED]", error);
    return Response.json({ error: "custom domain run failed" }, { status: 500 });
  }
}
