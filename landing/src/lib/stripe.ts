import Stripe from "stripe";

let cached: Stripe | undefined;

/*
 * Only a real production deploy is strict — the same rule as `lib/urls.ts`.
 *
 * NODE_ENV is "production" for `next build` AND `next start`, so including it
 * here rejected legitimate test keys locally: running the production server on
 * a dev machine failed with "Refusing to start: a Stripe TEST key is
 * configured in production", which made the checkout impossible to try end to
 * end. Deferring the check to the first request did not help, because
 * `next start` does serve real requests. VERCEL_ENV is set on Vercel deploys
 * only, so it is the one signal that actually means "this is production".
 */
const isProduction = process.env.VERCEL_ENV === "production";

// Checked lazily (on first real request) instead of at module load, so a build
// never fails on a key it will not use.
function getStripe(): Stripe {
  if (cached) return cached;

  const secretKey = process.env.STRIPE_SECRET_KEY;

  // Fail loudly in production rather than silently accepting fake payments:
  // a test key in production would make every order free.
  if (isProduction) {
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is required in production.");
    }
    if (secretKey.startsWith("sk_test_")) {
      throw new Error(
        "Refusing to start: a Stripe TEST key is configured in production. " +
          "Test cards such as 4242 4242 4242 4242 would be accepted as real payments.",
      );
    }
  }

  cached = new Stripe(secretKey || "sk_test_fallback", {
    apiVersion: "2024-06-20" as any,
  });
  return cached;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    return Reflect.get(getStripe(), prop, receiver);
  },
});

/** Amounts are handled in cents by Stripe; orders are priced in whole euros. */
export function toCents(euros: number): number {
  return Math.round(euros * 100);
}
