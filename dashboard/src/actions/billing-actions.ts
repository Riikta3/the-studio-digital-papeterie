"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/utils/supabase/server";

export type BillingRecord = {
  id: string;
  amount: number;
  currency: string;
  status: "succeeded" | "pending" | "failed" | "refunded";
  plan_name: string;
  payment_method: string;
  /**
   * Storage path of the invoice PDF, not a link: the bucket is private, so the
   * browser exchanges it for a short-lived signed URL through
   * `getInvoiceDownloadUrl()`. Null until the invoice has been issued.
   */
  invoice_url: string | null;
  /** Identifies the purchase when requesting that signed URL. */
  stripe_payment_intent_id: string | null;
  created_at: string;
};

export async function getBillingHistory() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log("[getBillingHistory] auth user:", user?.id ?? "null", "authError:", authError?.message ?? null);

    if (!user) return { error: "Non authentifié" };

    // Use admin client to bypass RLS — filter manually by user_id
    const { data, error } = await supabaseAdmin
      .from("billing")
      // Matches BillingRecord above.
      .select(
        "id, amount, currency, status, plan_name, payment_method, invoice_url, stripe_payment_intent_id, created_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    console.log("[getBillingHistory] rows:", data?.length ?? 0, "error:", error?.message ?? null);
    if (data?.length) console.log("[getBillingHistory] first row:", JSON.stringify(data[0]));

    if (error) {
      console.error("[getBillingHistory] query error:", error);
      return { error: "Impossible de charger l'historique" };
    }

    return { data: data as BillingRecord[] };
  } catch (err: any) {
    console.error("[getBillingHistory] unexpected error:", err?.message);
    return { error: "Erreur serveur" };
  }
}
