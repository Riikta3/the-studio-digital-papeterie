"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateSettings(formData: FormData) {
  const supabase = await createClient();

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Non connecté" };
  }

  const weddingCode = formData.get("wedding_code") as string;
  // TODO: Add other settings here (RSVP mode, modules, etc.)

  // Check uniqueness of wedding code if changed?
  // The DB has a unique constraint, so update will fail if duplicate.

  const { error } = await supabase
    .from("settings")
    .update({
      wedding_code: weddingCode.toUpperCase(),
      // rsvp_mode: ...
    })
    .eq("wedding_id", user.id);

  if (error) {
    console.error("Error updating settings:", error);
    if (error.code === "23505") {
      // Unique violation
      return { success: false, error: "Ce code est déjà utilisé." };
    }
    return { success: false, error: "Erreur lors de la mise à jour." };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function getSettings() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("settings")
    .select("*")
    .eq("wedding_id", user.id)
    .single();

  return data;
}
