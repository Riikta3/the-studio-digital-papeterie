import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_fallback", {
  apiVersion: "2024-06-20" as any,
});

const MODULE_PRICE = 10; // €10 per module

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { moduleId } = await req.json();
    if (!moduleId) {
      return NextResponse.json({ error: "Missing moduleId" }, { status: 400 });
    }

    // Get customer email from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .single();

    let customerId: string | undefined;

    if (profile?.email) {
      const existing = await stripe.customers.list({
        email: profile.email,
        limit: 1,
      });
      if (existing.data.length > 0) {
        customerId = existing.data[0].id;
      } else {
        const newCustomer = await stripe.customers.create({
          email: profile.email,
        });
        customerId = newCustomer.id;
      }
    }

    const paymentIntentPayload: Stripe.PaymentIntentCreateParams = {
      amount: MODULE_PRICE * 100, // cents
      currency: "eur",
      payment_method_types: ["card", "paypal", "klarna"],
      metadata: {
        type: "extra_module",
        module_id: moduleId,
        user_id: user.id,
      },
    };

    if (customerId) paymentIntentPayload.customer = customerId;

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentPayload);

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err: any) {
    console.error("[CREATE_MODULE_PAYMENT_INTENT]", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
