import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

// Fail loudly in production rather than silently accepting fake payments:
// a test key in production would make every order free.
if (process.env.NODE_ENV === "production") {
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

export const stripe = new Stripe(secretKey || "sk_test_fallback", {
  apiVersion: "2024-06-20" as any,
});

/** Amounts are handled in cents by Stripe; orders are priced in whole euros. */
export function toCents(euros: number): number {
  return Math.round(euros * 100);
}
