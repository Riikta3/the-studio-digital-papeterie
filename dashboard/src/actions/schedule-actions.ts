"use server";

import { requireWedding } from "@/lib/db/current-wedding";
import { rowToScheduleEntry } from "@/lib/db/mappers";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";
import type { ScheduleEntry } from "@shared/types/invitation";

const LOCALES = ["fr", "en", "de", "es", "pt", "it", "ar", "zh", "ja"] as const;

function revalidateSchedule() {
  for (const locale of LOCALES) {
    revalidatePath(`/${locale}/invitation/programme`);
  }
}

/**
 * `requireWedding()` throws for a Server Component (correct: it becomes an
 * error boundary). A write action called from a client component converts
 * that throw into the French `{ success: false }` shape instead — see
 * action-conventions.md.
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

/**
 * Same shape as `scheduleEntryToRow`, but for a partial patch: only the keys
 * present on `patch` are translated, so an untouched field is never coerced
 * to `null` and overwritten.
 */
function scheduleEntryPatchToRow(
  patch: Partial<ScheduleEntry>,
): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if ("eventId" in patch) row.event_id = patch.eventId;
  if ("time" in patch) row.time = patch.time;
  if ("title" in patch) row.title = patch.title;
  if ("description" in patch) row.description = patch.description ?? null;
  if ("position" in patch) row.position = patch.position;
  return row;
}

/**
 * Read action: called from the Server Component page. A throw here surfaces
 * as an error boundary, which is correct for a page that cannot render.
 */
export async function listSchedule(): Promise<ScheduleEntry[]> {
  const { supabase, weddingId } = await requireWedding();

  const { data, error } = await supabase
    .from("schedule_entries")
    .select("id, event_id, time, title, description, position")
    // Explicit even though RLS already filters by owner — see the plan's
    // global constraints.
    .eq("wedding_id", weddingId)
    .order("position", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToScheduleEntry);
}

/**
 * Non-optimistic, same reasoning as `createEvent`: the client never mints an
 * id for a new entry. The caller must await this and adopt `entry.id`.
 */
export async function createScheduleEntry(
  input: Pick<ScheduleEntry, "eventId" | "time" | "title" | "position"> &
    Partial<Pick<ScheduleEntry, "description">>,
): Promise<
  { success: true; entry: ScheduleEntry } | { success: false; error: string }
> {
  const ctx = await requireWeddingForWrite();
  if (ctx.failure) return ctx.failure;
  const { supabase, weddingId } = ctx;

  const { data, error } = await supabase
    .from("schedule_entries")
    .insert({
      wedding_id: weddingId,
      event_id: input.eventId,
      time: input.time,
      title: input.title,
      description: input.description ?? null,
      position: input.position,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating schedule entry:", error);
    return { success: false, error: "Erreur lors de la création de l'étape." };
  }

  revalidateSchedule();
  return { success: true, entry: rowToScheduleEntry(data) };
}

export async function updateScheduleEntry(
  id: string,
  patch: Partial<ScheduleEntry>,
): Promise<ActionResult> {
  const ctx = await requireWeddingForWrite();
  if (ctx.failure) return ctx.failure;
  const { supabase, weddingId } = ctx;

  const { error } = await supabase
    .from("schedule_entries")
    .update(scheduleEntryPatchToRow(patch))
    .eq("id", id)
    .eq("wedding_id", weddingId);

  if (error) {
    console.error("Error updating schedule entry:", error);
    return { success: false, error: "Erreur lors de la modification." };
  }

  revalidateSchedule();
  return { success: true };
}

export async function deleteScheduleEntry(id: string): Promise<ActionResult> {
  const ctx = await requireWeddingForWrite();
  if (ctx.failure) return ctx.failure;
  const { supabase, weddingId } = ctx;

  const { error } = await supabase
    .from("schedule_entries")
    .delete()
    .eq("id", id)
    .eq("wedding_id", weddingId);

  if (error) {
    console.error("Error deleting schedule entry:", error);
    return { success: false, error: "Erreur lors de la suppression." };
  }

  revalidateSchedule();
  return { success: true };
}

/**
 * Writes every position in one upsert: reordering within an event's group
 * can touch every sibling entry, and one request per row would be both
 * slower and non-atomic.
 */
export async function reorderScheduleEntries(
  ids: string[],
): Promise<ActionResult> {
  const ctx = await requireWeddingForWrite();
  if (ctx.failure) return ctx.failure;
  const { supabase, weddingId } = ctx;

  const { error } = await supabase.from("schedule_entries").upsert(
    ids.map((id, position) => ({ id, wedding_id: weddingId, position })),
    { onConflict: "id" },
  );

  if (error) {
    console.error("Error reordering schedule entries:", error);
    return { success: false, error: "Erreur lors du réordonnancement." };
  }

  revalidateSchedule();
  return { success: true };
}
