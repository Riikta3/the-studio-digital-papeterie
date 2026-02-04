"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createHousehold(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Vous devez être connecté" };
  }

  // Get the profile/wedding ID associated with the user
  // Assuming profile.id is the user.id
  const weddingId = user.id;

  // 1. Create Household
  const { data: householdData, error: householdError } = await supabase
    .from("households")
    .insert({
      wedding_id: weddingId,
      name,
      email: email || null,
      phone: phone || null,
      status: "pending",
      source: "admin",
    })
    .select()
    .single();

  if (householdError) {
    console.error("Error creating household:", householdError);
    return {
      success: false,
      error: "Erreur lors de la création du foyer: " + householdError.message,
    };
  }

  // 2. Create Guests if names are provided
  const guestNamesRaw = formData.get("guest_names") as string;
  if (guestNamesRaw && guestNamesRaw.trim()) {
    const guestsToInsert = guestNamesRaw
      .split("\n") // Split by new line
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((fullName) => {
        // Simple first/last name split (can be improved)
        const parts = fullName.split(" ");
        const firstName = parts[0];
        const lastName = parts.slice(1).join(" ") || ".";

        return {
          wedding_id: weddingId,
          household_id: householdData.id,
          first_name: firstName,
          last_name: lastName,
          status: "pending", // Default status for guest
        };
      });

    if (guestsToInsert.length > 0) {
      const { error: guestError } = await supabase
        .from("guests")
        .insert(guestsToInsert);

      if (guestError) {
        console.error("Error creating guests:", guestError);
        // We log but don't fail the whole action, or we should warn?
        // Let's return success but with a warning? Or just ignore for now as household is created.
        // Ideally we should transaction this or delete household.
        return {
          success: true,
          warning:
            "Foyer créé mais erreur sur les invités: " + guestError.message,
        };
      }
    }
  }

  revalidatePath("/guests");
  return { success: true };
}
