import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20" as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  if (!webhookSecret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET in environment");
    return NextResponse.json(
      { error: "Configuration Exception" },
      { status: 500 },
    );
  }

  const payload = await req.text();
  const signature = req.headers.get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed.`, err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`💰 PaymentIntent status: ${paymentIntent.status}`);

        // Ideally here we wait for the client-side `createWedding` to finish provisioning
        // so that the `user_id` matches the email. We can search for the user by email in Supabase Auth.
        const email =
          paymentIntent.metadata.email ||
          (paymentIntent.receipt_email as string);

        if (email) {
          // Find the Auth User by email to link the billing record
          const { data: searchData } =
            await supabaseAdmin.auth.admin.listUsers();
          const existingUser = searchData?.users.find((u) => u.email === email);

          if (existingUser) {
            // Insert into billing table
            await supabaseAdmin.from("billing").insert({
              user_id: existingUser.id,
              amount: paymentIntent.amount, // in cents
              currency: paymentIntent.currency,
              status: "succeeded",
              plan_name: paymentIntent.metadata.plan || "unknown",
              payment_method:
                paymentIntent.payment_method_types?.[0] || "unknown",
            });
            console.log(`🧾 Billing record inserted for ${email}`);
          } else {
            console.log(`⚠️ Billing record delayed for ${email}: User not yet provisioned.
                This is expected if the webhook arrives before the frontend createWedding finishes.`);
          }
        }
        break;
      }

      case "charge.dispute.created": {
        // Phase 4 Edge Case handling: if there's a chargeback, suspend their site to avoid fraud
        const dispute = event.data.object as Stripe.Dispute;
        const email =
          dispute.charge && typeof dispute.charge === "object"
            ? dispute.charge.billing_details?.email
            : null;

        if (email) {
          const { data: searchData } =
            await supabaseAdmin.auth.admin.listUsers();
          const existingUser = searchData?.users.find((u) => u.email === email);
          if (existingUser) {
            // Find their wedding
            const { data: weddings } = await supabaseAdmin
              .from("weddings")
              .select("id")
              .eq("user_id", existingUser.id)
              .limit(1);
            if (weddings && weddings.length > 0) {
              await supabaseAdmin
                .from("sites")
                .update({ status: "suspended" })
                .eq("wedding_id", weddings[0].id);
              console.log(`🛑 Site suspended due to chargeback for ${email}`);
            }
          }
        }
        break;
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing error" },
      { status: 500 },
    );
  }
}
