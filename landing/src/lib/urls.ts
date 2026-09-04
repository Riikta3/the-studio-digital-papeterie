/**
 * Cross-app origins.
 *
 * Every one of these ended up hardcoded in several places with a different
 * value each time — `the-studio.digital`, a `.vercel.app` preview URL, and
 * `http://localhost:3003`. A localhost fallback is the dangerous one: when the
 * variable is missing in production nothing breaks visibly, the magic link
 * simply sends a paying customer to their own machine.
 *
 * So in production a missing variable throws instead of guessing. Locally the
 * dev defaults apply, which is the only place they are ever correct.
 */

/*
 * Only a real production deploy is strict.
 *
 * `next build` prerenders pages with NODE_ENV=production, so keying off that
 * alone made every local or CI build fail here — the same trap already
 * documented in `lib/stripe.ts`. VERCEL_ENV is set on Vercel deploys only, and
 * `next build` locally leaves it undefined, so a missing variable is tolerated
 * during the build and rejected when a real request needs it.
 */
const isProduction = process.env.VERCEL_ENV === "production";

function requireOrigin(
  name: string,
  value: string | undefined,
  devFallback: string,
): string {
  if (value) return value.replace(/\/$/, "");

  if (isProduction) {
    throw new Error(
      `${name} is required in production. Without it this URL would fall back ` +
        `to ${devFallback}, which silently sends real users to a dev machine.`,
    );
  }

  return devFallback;
}

/** Public landing origin. Also drives canonical/hreflang/sitemap metadata. */
export function getLandingUrl(): string {
  return requireOrigin(
    "NEXT_PUBLIC_SITE_URL",
    process.env.NEXT_PUBLIC_SITE_URL,
    "http://localhost:3010",
  );
}

/** Couples' dashboard origin, target of the post-purchase magic link. */
export function getDashboardUrl(): string {
  return requireOrigin(
    "NEXT_PUBLIC_DASHBOARD_URL",
    process.env.NEXT_PUBLIC_DASHBOARD_URL,
    "http://localhost:3003",
  );
}
