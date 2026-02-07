"use server";

import { createClient } from "@/utils/supabase/server";

export type BillingRecord = {
  id: string;
  amount: number;
  currency: string;
  status: "succeeded" | "pending" | "failed" | "refunded";
  plan_name: string;
  payment_method: string;
  invoice_url: string | null;
  created_at: string;
};

export async function getBillingHistory() {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("billing")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching billing history:", error);
      return { error: "Impossible de charger l'historique" };
    }

    return { data: data as BillingRecord[] };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { error: "Erreur serveur" };
  }
}
