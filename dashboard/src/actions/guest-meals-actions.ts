"use server";

import { requireWedding } from "@/lib/db/current-wedding";
import { rowToGuest, rowToHousehold } from "@/lib/db/mappers";
import {
  toMealsGuest,
  toGroupsHousehold,
  type MealsGuest,
  type GroupsHousehold,
} from "@/lib/db/projections";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";
import type { DietaryFlag, MealChoice } from "@shared/types/invitation";

/**
 * `requireWedding()` throws for a Server Component (correct: it becomes an
 * error boundary). A write action called from a client component cannot
 * throw across the server-action boundary the same way the UI expects, so
 * every mutation here converts the throw into the French `{ success: false }`
 * shape instead — see action-conventions.md.
 */
async function requireWeddingForWrite() {
  try {
    return { ...(await requireWedding()), failure: null };
  } catch {
    return {
      failure: { success: false, error: "Vous devez être connecté" } as const,
    };
  }
}

const LOCALES = ["fr", "en", "de", "es", "pt", "it", "ar", "zh", "ja"] as const;

function revalidateMeals() {
  for (const locale of LOCALES) {
    revalidatePath(`/${locale}/guests/repas`);
  }
}

/**
 * Read action: called from the Server Component page. Projects through
 * `toMealsGuest`/`toGroupsHousehold` here, inside the action, so a future
 * caller of `listMealsData()` cannot forget to drop email, phone and notes
 * before they reach a client component.
 */
export async function listMealsData(): Promise<{
  guests: MealsGuest[];
  households: GroupsHousehold[];
}> {
  const { supabase, weddingId } = await requireWedding();

  const [guestsRes, householdsRes] = await Promise.all([
    // Columns match what rowToGuest reads; dietary_requirements is a
    // deprecated column and deliberately excluded.
    supabase
      .from("guests")
      .select(
        "id, first_name, last_name, email, phone, household_id, guest_group, is_child, is_plus_one, status, meal, dietary_flags, allergies, notes, table_id",
      )
      .eq("wedding_id", weddingId),
    supabase
      .from("households")
      .select("id, name, guest_group, email, phone, address")
      .eq("wedding_id", weddingId),
  ]);

  if (guestsRes.error) throw new Error(guestsRes.error.message);
  if (householdsRes.error) throw new Error(householdsRes.error.message);

  return {
    guests: (guestsRes.data ?? []).map(rowToGuest).map(toMealsGuest),
    households: (householdsRes.data ?? []).map(rowToHousehold).map(toGroupsHousehold),
  };
}

export async function updateGuestMeal(
  id: string,
  meal: MealChoice,
): Promise<ActionResult> {
  const ctx = await requireWeddingForWrite();
  if (ctx.failure) return ctx.failure;
  const { supabase, weddingId } = ctx;

  const { error } = await supabase
    .from("guests")
    .update({ meal })
    .eq("id", id)
    .eq("wedding_id", weddingId);

  if (error) {
    console.error("Error updating guest meal:", error);
    return { success: false, error: "Erreur lors de la modification." };
  }

  revalidateMeals();
  return { success: true };
}

/**
 * Read-modify-write, server-side, on purpose: two tabs open on the same
 * guest must not overwrite each other from a stale `dietaryFlags` array.
 * Doing the add/remove on the client and writing the whole array back would
 * let the second tab's write silently clobber the first tab's toggle.
 */
export async function toggleDietaryFlag(
  id: string,
  flag: DietaryFlag,
): Promise<ActionResult> {
  const ctx = await requireWeddingForWrite();
  if (ctx.failure) return ctx.failure;
  const { supabase, weddingId } = ctx;

  const { data: current, error: fetchError } = await supabase
    .from("guests")
    .select("dietary_flags")
    .eq("id", id)
    .eq("wedding_id", weddingId)
    .single();

  if (fetchError || !current) {
    console.error("Error reading guest dietary flags:", fetchError);
    return { success: false, error: "Erreur lors de la modification." };
  }

  const flags = (current.dietary_flags as DietaryFlag[] | null) ?? [];
  const nextFlags = flags.includes(flag)
    ? flags.filter((f) => f !== flag)
    : [...flags, flag];

  const { error: updateError } = await supabase
    .from("guests")
    .update({ dietary_flags: nextFlags })
    .eq("id", id)
    .eq("wedding_id", weddingId);

  if (updateError) {
    console.error("Error updating guest dietary flags:", updateError);
    return { success: false, error: "Erreur lors de la modification." };
  }

  revalidateMeals();
  return { success: true };
}

export async function updateAllergies(
  id: string,
  text: string,
): Promise<ActionResult> {
  const ctx = await requireWeddingForWrite();
  if (ctx.failure) return ctx.failure;
  const { supabase, weddingId } = ctx;

  const { error } = await supabase
    .from("guests")
    .update({ allergies: text || null })
    .eq("id", id)
    .eq("wedding_id", weddingId);

  if (error) {
    console.error("Error updating guest allergies:", error);
    return { success: false, error: "Erreur lors de la modification." };
  }

  revalidateMeals();
  return { success: true };
}
