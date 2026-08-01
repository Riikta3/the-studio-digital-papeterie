import Stripe from "stripe";

let cached: Stripe | undefined;

// Checked lazily (on first real request) instead of at module load: `next build`
// always runs with NODE_ENV=production even for local/CI builds, so a module-level
// check would fail every build that has a test key in .env.local.
function getStripe(): Stripe {
  if (cached) return cached;

  const secretKey = process.env.STRIPE_SECRET_KEY;

  // Fail loudly in production rather than silently accepting fake payments:
  // a test key in production would make every order free.
  if (process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production") {
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
