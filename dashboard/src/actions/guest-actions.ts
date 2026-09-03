"use server";

import { ActionResult } from "@/types";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

const LOCALES = ["fr", "en", "de", "es", "pt", "it", "ar", "zh", "ja"] as const;

/**
 * Every dashboard route lives under `[locale]`, so a bare
 * `revalidatePath("/guests")` matches nothing and the couple kept seeing stale
 * data after an edit. Same loop the newer action files use.
 */
function revalidateGuests() {
  for (const locale of LOCALES) {
    revalidatePath(`/${locale}/guests`);
  }
}

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

  // Resolve the real wedding. `user.id` is NOT the wedding id — `weddings.id`
  // is an independent uuid — so the previous `const weddingId = user.id` meant
  // every write here targeted a wedding that does not exist. Verified: of 11
  // weddings, zero have id == user_id, so this matched nothing, ever, while
  // still reporting success.
  const { data: wedding } = await supabase
    .from("weddings")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!wedding) {
    return { success: false, error: "Mariage introuvable" };
  }

  const weddingId = wedding.id as string;

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

  revalidateGuests();
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

  revalidateGuests();
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

    // Same bug as createHousehold above, and worse here: this function deletes
    // the household's guests before re-inserting them, so an invalid
    // `wedding_id` meant the re-insert failed silently and the guests were
    // simply gone. `user.id` is not the wedding id.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Utilisateur non connecté" };
    }

    const { data: wedding } = await supabase
      .from("weddings")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!wedding) {
      return { success: false, error: "Mariage introuvable" };
    }

    const weddingId = wedding.id as string;

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
          status: status === "declined" ? "declined" : "pending",
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

  revalidateGuests();
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

  // --- Start: Sync Guest Status to Household ---
  try {
    // 1. Get household_id for this guest
    const { data: guestData, error: guestFetchError } = await supabase
      .from("guests")
      .select("household_id")
      .eq("id", guestId)
      .single();

    if (guestData && !guestFetchError) {
      const householdId = guestData.household_id;

      // 2. Fetch all guests for this household
      const { data: householdGuests, error: guestsFetchError } = await supabase
        .from("guests")
        .select("status")
        .eq("household_id", householdId);

      if (householdGuests && !guestsFetchError) {
        const totalGuests = householdGuests.length;
        if (totalGuests > 0) {
          const confirmedCount = householdGuests.filter(
            (g) => g.status === "confirmed",
          ).length;
          const declinedCount = householdGuests.filter(
            (g) => g.status === "declined",
          ).length;

          // Only update if ALL guests have a status (confirmed or declined)
          if (confirmedCount + declinedCount === totalGuests) {
            let newHouseholdStatus = "pending";

            if (confirmedCount === totalGuests) {
              newHouseholdStatus = "confirmed";
            } else if (declinedCount === totalGuests) {
              newHouseholdStatus = "declined";
            } else {
              newHouseholdStatus = "partial";
            }

            const { error: householdUpdateError } = await supabase
              .from("households")
              .update({ status: newHouseholdStatus })
              .eq("id", householdId);

            if (householdUpdateError) {
              console.error(
                "Error updating household status:",
                householdUpdateError,
              );
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("Error syncing household status:", err);
    // Don't fail the request if sync fails
  }
  // --- End: Sync Guest Status to Household ---

  revalidateGuests();
  return { success: true };
}

/*
 * `assignGuestToTable` deliberately does NOT live here.
 *
 * This file used to export one, duplicating the name `seating-actions.ts`
 * exports — and the copy here was broken twice over: it filtered
 * `.eq("wedding_id", user.id)`, which matches no wedding (weddings.id is an
 * independent uuid), and it skipped the server-side capacity re-check, so a
 * caller reaching it could seat 13 people at a table of 12. It reported
 * success either way.
 *
 * `SeatingScreen` imports the correct one from `seating-actions.ts`. Removing
 * this duplicate means a future import cannot silently pick the unsafe half.
 */
