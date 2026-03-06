import { NextResponse } from "next/server";
import Stripe from "stripe";

// Initialize Stripe lazily or with a fallback so `next build` doesn't crash
// if STRIPE_SECRET_KEY is not available in the build environment.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_fallback", {
  apiVersion: "2024-06-20" as any,
});

export async function POST(req: Request) {
  try {
    const { items } = await req.json();

    if (!items || !items.plan) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // --- SECURE BACKEND CALCULATION ---
    const FREE_MODULES_LIMIT = 4;
    const EXTRA_MODULE_PRICE = 10;
    const FREE_LANGUAGES_LIMIT = 2;
    const EXTRA_LANGUAGE_PRICE = 20;

    const OFFERS = {
      discovery: { price: 0 },
      essential: { price: 120 },
      premium: { price: 190 },
    };

    const EXTRAS_PRICES: Record<string, number> = {
      domain: 65,
      illustration: 20,
      video: 55,
      music: 10,
      vip: 25,
    };

    let calculatedAmount = 0;

    const selectedPlan = OFFERS[items.plan as keyof typeof OFFERS];
    if (!selectedPlan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }
    calculatedAmount += selectedPlan.price;

    const modules: string[] = items.modules || [];
    const extraModulesCount = Math.max(0, modules.length - FREE_MODULES_LIMIT);
    calculatedAmount += extraModulesCount * EXTRA_MODULE_PRICE;

    const languages: string[] = items.languages || ["fr"];
    const isPremium = items.plan === "premium";
    const extraLanguagesCount = isPremium
      ? 0
      : Math.max(0, languages.length - FREE_LANGUAGES_LIMIT);
    calculatedAmount += extraLanguagesCount * EXTRA_LANGUAGE_PRICE;

    const extras: string[] = items.extras || [];
    const extrasPrice = extras.reduce((acc, id) => {
      return acc + (EXTRAS_PRICES[id] || 0);
    }, 0);
    calculatedAmount += extrasPrice;

    const finalStripeAmount = calculatedAmount > 0 ? calculatedAmount : 0;

    if (finalStripeAmount === 0) {
      return NextResponse.json({
        clientSecret: null,
        amount: 0,
      });
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalStripeAmount * 100), // Convert to cents
      currency: "eur",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        plan: items.plan || "unknown",
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err: any) {
    console.error("[STRIPE_ERROR]", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
