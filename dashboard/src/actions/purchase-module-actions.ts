"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/utils/supabase/server";
import { APP_MODULES } from "@shared/data/modules";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_fallback", {
  apiVersion: "2024-06-20" as any,
});

/**
 * Called after Stripe payment confirmation.
 * Security: verifies the PaymentIntent directly with Stripe (never trusts the client).
 * Adds the module to the site's enabled modules list and creates a billing record.
 */
export async function activatePurchasedModule({
  moduleId,
  paymentIntentId,
}: {
  moduleId: string;
  paymentIntentId: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // 1. Validate moduleId is a known module
  const validModule = APP_MODULES.find((m) => m.id === moduleId);
  if (!validModule) throw new Error("Invalid module");

  // 2. Verify PaymentIntent directly with Stripe — never trust the client
  let paymentIntent: Stripe.PaymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch {
    throw new Error("Invalid payment intent");
  }

  // 3. Verify payment is actually succeeded
  if (paymentIntent.status !== "succeeded") {
    throw new Error(`Payment not completed (status: ${paymentIntent.status})`);
  }

  // 4. Verify the PaymentIntent belongs to this user and this module
  if (paymentIntent.metadata?.user_id !== user.id) {
    throw new Error("Payment intent does not belong to this user");
  }
  if (paymentIntent.metadata?.module_id !== moduleId) {
    throw new Error("Payment intent module mismatch");
  }
  if (paymentIntent.metadata?.type !== "extra_module") {
    throw new Error("Invalid payment intent type");
  }

  // 5. Verify amount matches expected price (10€ = 1000 cents)
  if (paymentIntent.amount !== 1000 || paymentIntent.currency !== "eur") {
    throw new Error("Payment amount mismatch");
  }

  const { data: wedding } = await supabase
    .from("weddings")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!wedding) throw new Error("Wedding not found");

  const { data: site } = await supabase
    .from("sites")
    .select("id, modules")
    .eq("wedding_id", wedding.id)
    .single();
  if (!site) throw new Error("Site not found");

  const currentModules: string[] = (site.modules as string[]) ?? [];

  // 6. Idempotency: if already enabled, skip (handles double-click / retries)
  if (currentModules.includes(moduleId)) {
    return { success: true };
  }

  // 7. Check this PaymentIntent hasn't already been used to activate a module
  const { data: existingBilling } = await supabaseAdmin
    .from("billing")
    .select("id")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();

  if (existingBilling) {
    // Already processed — idempotent, just return success without re-activating
    return { success: true };
  }

  // 8. Add module to the enabled list
  const updatedModules = [...currentModules, moduleId];

  const { error: updateError } = await supabaseAdmin
    .from("sites")
    .update({ modules: updatedModules })
    .eq("id", site.id);

  if (updateError) throw new Error(updateError.message);

  // 9. Record the billing entry with the PaymentIntent ID for idempotency checks
  await supabaseAdmin.from("billing").insert({
    user_id: user.id,
    amount: 10,
    currency: "eur",
    status: "succeeded",
    plan_name: `Module: ${moduleId}`,
    payment_method: paymentIntent.payment_method_types?.[0] ?? "card",
    stripe_payment_intent_id: paymentIntentId,
  });

  revalidatePath("/[locale]/modules", "page");
  revalidatePath("/", "layout");

  return { success: true };
}
