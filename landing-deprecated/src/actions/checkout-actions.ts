"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/utils/supabase/server";

export async function processCheckout(orderData: {
  plan: string;
  amount: number;
  period: string;
}) {
  const supabase = await createClient();

  // 1. Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated" };
  }

  try {
    // 2. Insert billing record using Admin Client (bypassing RLS if needed, though RLS allows insert for service role)
    // We use admin client to ensure we can write to the table regardless of user policies
    const { error: billingError } = await supabaseAdmin.from("billing").insert({
      user_id: user.id,
      amount: orderData.amount * 100, // Store in cents
      currency: "EUR",
      status: "succeeded", // Simulating success
      plan_name: orderData.plan,
      payment_method: "card",
      invoice_url: null, // No real invoice yet
    });

    if (billingError) {
      console.error("Billing Insert Error:", billingError);
      return { error: "Failed to create billing record" };
    }

    // 3. Revalidate dashboard billing page (if we knew the path, but it's in another app)
    // We can't revalidate the dashboard from the landing app easily.

    return { success: true };
  } catch (error) {
    console.error("Checkout Error:", error);
    return { error: "Internal Server Error" };
  }
}
