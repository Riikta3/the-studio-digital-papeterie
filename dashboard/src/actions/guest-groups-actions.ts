"use server";

import { requireWedding } from "@/lib/db/current-wedding";
import { rowToGuest, rowToHousehold } from "@/lib/db/mappers";
import {
  toGroupsGuest,
  toGroupsHousehold,
  type GroupsGuest,
  type GroupsHousehold,
} from "@/lib/db/projections";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";
import type { GuestGroup, Household } from "@shared/types/invitation";

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

function revalidateGroups() {
  for (const locale of LOCALES) {
    revalidatePath(`/${locale}/guests/groupes`);
  }
}

function householdPatchToRow(patch: Partial<Household>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if ("name" in patch) row.name = patch.name;
  if ("group" in patch) row.guest_group = patch.group;
  if ("email" in patch) row.email = patch.email ?? null;
  if ("phone" in patch) row.phone = patch.phone ?? null;
  if ("address" in patch) row.address = patch.address ?? null;
  return row;
}

/**
 * Read action: called from the Server Component page. Projects guests and
 * households through `toGroupsGuest`/`toGroupsHousehold` here, inside the
 * action, so a future caller of `listGroupsData()` cannot forget to drop
 * email, phone, notes and allergies before they reach a client component.
 */
export async function listGroupsData(): Promise<{
  guests: GroupsGuest[];
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
    guests: (guestsRes.data ?? []).map(rowToGuest).map(toGroupsGuest),
    households: (householdsRes.data ?? []).map(rowToHousehold).map(toGroupsHousehold),
  };
}

export async function updateGuestGroup(
  id: string,
  group: GuestGroup,
): Promise<ActionResult> {
  const ctx = await requireWeddingForWrite();
  if (ctx.failure) return ctx.failure;
  const { supabase, weddingId } = ctx;

  const { error } = await supabase
    .from("guests")
    .update({ guest_group: group })
    .eq("id", id)
    .eq("wedding_id", weddingId);

  if (error) {
    console.error("Error updating guest group:", error);
    return { success: false, error: "Erreur lors de la modification." };
  }

  revalidateGroups();
  return { success: true };
}

export async function assignHousehold(
  guestId: string,
  householdId: string,
): Promise<ActionResult> {
  const ctx = await requireWeddingForWrite();
  if (ctx.failure) return ctx.failure;
  const { supabase, weddingId } = ctx;

  const { error } = await supabase
    .from("guests")
    .update({ household_id: householdId })
    .eq("id", guestId)
    .eq("wedding_id", weddingId);

  if (error) {
    console.error("Error assigning household:", error);
    return { success: false, error: "Erreur lors de la modification." };
  }

  revalidateGroups();
  return { success: true };
}

/*
 * No household CRUD here on purpose.
 *
 * `guest-actions.ts` already exports `createHousehold`, `updateHousehold`
 * and `deleteHousehold`, and those are the ones the household dialog and the
 * guest table actually call. An earlier version of this file exported the
 * same three names with DIFFERENT delete semantics — it detached guests,
 * where the live one deletes them — so anyone who switched the import while
 * following this file's conventions would have silently changed a
 * destructive operation. Two same-named pairs is worse than none.
 *
 * If household CRUD needs reworking, change `guest-actions.ts` in one place.
 */