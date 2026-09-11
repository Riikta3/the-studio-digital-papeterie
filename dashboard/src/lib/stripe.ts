import Stripe from "stripe";

/*
 * The dashboard's Stripe client, with the guard the landing already had.
 *
 * Both money paths here used to build their own client inline:
 *
 *   new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_fallback", …)
 *
 * — in `api/create-module-payment-intent/route.ts:5` and
 * `actions/purchase-module-actions.ts:9`. A missing key therefore produced a
 * working object backed by a made-up test key, and every add-on purchase
 * failed at the Stripe call with an authentication error instead of at boot
 * with a clear one. The landing refuses to start in that situation
 * (`landing/src/lib/stripe.ts`); the dashboard silently did not, so the same
 * deploy could have one app strict and the other not.
 *
 * Mirrored rather than imported: the two apps are separate Next projects, and
 * the landing's copy is not reachable from here. Keep the two in step.
 */

let cached: Stripe | undefined;

/*
 * Only a real production deploy is strict, exactly as in the landing's copy
 * and for the same reason: NODE_ENV is "production" for `next build` and
 * `next start`, so keying on it breaks running the production server locally
 * with legitimate test keys. VERCEL_ENV is set on Vercel deploys only.
 */
const isProduction = process.env.VERCEL_ENV === "production";

// Checked lazily (on first real request) instead of at module load, so a build
// never fails on a key it will not use.
function getStripe(): Stripe {
  if (cached) return cached;

  const secretKey = process.env.STRIPE_SECRET_KEY;

  // Fail loudly in production rather than silently accepting fake payments:
  // a test key in production would make every module purchase free.
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
