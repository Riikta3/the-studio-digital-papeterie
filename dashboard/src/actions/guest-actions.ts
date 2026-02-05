"use server";

import { ActionResult } from "@/types";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createHousehold(
  formData: FormData,
): Promise<ActionResult> {
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
  const guestNamesRaw = formData.getAll("guest_names") as string[];
  const guestRelationsRaw = formData.getAll("guest_relations") as string[];

  if (guestNamesRaw && guestNamesRaw.length > 0) {
    const guestsToInsert = guestNamesRaw
      .map((fullName, index) => {
        if (!fullName || !fullName.trim()) return null;

        // Simple first/last name split
        const parts = fullName.trim().split(" ");
        const firstName = parts[0];
        const lastName = parts.slice(1).join(" ") || ".";
        const relationType = guestRelationsRaw[index] || null;

        return {
          wedding_id: weddingId,
          household_id: householdData.id,
          first_name: firstName,
          last_name: lastName,
          relation_type:
            relationType && relationType !== "" ? relationType : null,
          status: "pending", // Default status for guest
        };
      })
      .filter((g) => g !== null);

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

export async function deleteHousehold(householdId: string) {
  const supabase = await createClient();

  // 1. Delete associated guests first (Manual Cascade)
  const { error: guestsError } = await supabase
    .from("guests")
    .delete()
    .eq("household_id", householdId);

  if (guestsError) {
    console.error("Error deleting guests for household:", guestsError);
    return {
      success: false,
      error: "Erreur lors de la suppression des invités.",
    };
  }

  // 2. Delete the household
  const { error } = await supabase
    .from("households")
    .delete()
    .eq("id", householdId);

  if (error) {
    console.error("Error deleting household:", error);
    return { success: false, error: "Erreur lors de la suppression du foyer." };
  }

  revalidatePath("/guests");
  return { success: true };
}

export async function updateHousehold(
  householdId: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const status = formData.get("status") as string;

  // 1. Update household info
  const { error: householdError } = await supabase
    .from("households")
    .update({
      name,
      email: email || null,
      phone: phone || null,
      ...(status && { status }), // Only update status if provided
    })
    .eq("id", householdId);

  if (householdError) {
    console.error("Error updating household:", householdError);
    return { success: false, error: "Erreur lors de la modification." };
  }

  // 2. Update guests (delete all and recreate)
  // This is simpler than trying to match/update individual guests
  const guestNamesRaw = formData.getAll("guest_names") as string[];
  const guestRelationsRaw = formData.getAll("guest_relations") as string[];

  if (guestNamesRaw && guestNamesRaw.length > 0) {
    // First, delete existing guests
    const { error: deleteError } = await supabase
      .from("guests")
      .delete()
      .eq("household_id", householdId);

    if (deleteError) {
      console.error("Error deleting old guests:", deleteError);
      return {
        success: false,
        error: "Erreur lors de la mise à jour des invités.",
      };
    }

    // Get wedding_id from user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const weddingId = user?.id;

    if (!weddingId) {
      return { success: false, error: "Utilisateur non connecté" };
    }

    // Then, create new guests with updated info
    const guestsToInsert = guestNamesRaw
      .map((fullName, index) => {
        if (!fullName || !fullName.trim()) return null;

        const parts = fullName.trim().split(" ");
        const firstName = parts[0];
        const lastName = parts.slice(1).join(" ") || ".";
        const relationType = guestRelationsRaw[index] || null;

        return {
          wedding_id: weddingId,
          household_id: householdId,
          first_name: firstName,
          last_name: lastName,
          relation_type:
            relationType && relationType !== "" ? relationType : null,
          status: "pending",
        };
      })
      .filter((g) => g !== null);

    if (guestsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("guests")
        .insert(guestsToInsert);

      if (insertError) {
        console.error("Error creating updated guests:", insertError);
        return {
          success: false,
          error: "Erreur lors de la mise à jour des invités.",
        };
      }
    }
  }

  revalidatePath("/guests");
  return { success: true };
}

export async function updateGuest(
  guestId: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();

  const firstName = formData.get("first_name") as string;
  const lastName = formData.get("last_name") as string;
  const email = formData.get("email") as string;
  const relationType = formData.get("relation_type") as string;
  const status = formData.get("status") as string;
  const isChild =
    formData.get("is_child") === "on" || formData.get("is_child") === "true";
  const isPlusOne =
    formData.get("is_plus_one") === "on" ||
    formData.get("is_plus_one") === "true";
  const dietaryRequirements = formData.get("dietary_requirements") as string;
  const dietaryDetails = formData.get("dietary_details") as string;

  const { error } = await supabase
    .from("guests")
    .update({
      first_name: firstName,
      last_name: lastName,
      email: email || null,
      relation_type: relationType && relationType !== "" ? relationType : null,
      status,
      is_child: isChild,
      is_plus_one: isPlusOne,
      dietary_requirements:
        dietaryRequirements && dietaryRequirements !== ""
          ? dietaryRequirements
          : null,
      dietary_details: dietaryDetails || null,
    })
    .eq("id", guestId);

  if (error) {
    console.error("Error updating guest:", error);
    return { success: false, error: "Erreur lors de la modification." };
  }

  revalidatePath("/guests");
  return { success: true };
}
