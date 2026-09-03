"use server";

import { requireWedding } from "@/lib/db/current-wedding";
import { rowToEvent } from "@/lib/db/mappers";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";
import type { WeddingEvent } from "@shared/types/invitation";

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

/**
 * Same field mapping as `eventToRow`, but for a partial patch: only the keys
 * present on `patch` are translated, so an untouched field is never coerced
 * to `null` and overwritten. `eventToRow` itself assumes a full row (every
 * optional field defaults to `null` when absent), which is wrong for a PATCH.
 */
function eventPatchToRow(patch: Partial<WeddingEvent>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if ("key" in patch) row.key = patch.key;
  if ("name" in patch) row.name = patch.name;
  if ("date" in patch) row.date = patch.date ?? null;
  if ("time" in patch) row.time = patch.time ?? null;
  if ("address" in patch) row.address = patch.address ?? null;
  if ("description" in patch) row.description = patch.description ?? null;
  if ("dressCode" in patch) row.dress_code = patch.dressCode ?? null;
  if ("position" in patch) row.position = patch.position;
  if ("enabled" in patch) row.enabled = patch.enabled;
  return row;
}

const LOCALES = ["fr", "en", "de", "es", "pt", "it", "ar", "zh", "ja"] as const;

function revalidateEvents() {
  for (const locale of LOCALES) {
    revalidatePath(`/${locale}/invitation/evenements`);
    // A deleted or renamed event also changes what the programme screen can
    // render (group headers, the "event disabled" badge).
    revalidatePath(`/${locale}/invitation/programme`);
  }
}

/**
 * Read action: called from the Server Component page. A throw here surfaces
 * as an error boundary, which is correct for a page that cannot render.
 */
export async function listEvents(): Promise<WeddingEvent[]> {
  const { supabase, weddingId } = await requireWedding();

  const { data, error } = await supabase
    .from("events")
    .select("id, key, name, date, time, address, description, dress_code, position, enabled")
    // Explicit even though RLS already filters by owner — see the plan's
    // global constraints.
    .eq("wedding_id", weddingId)
    .order("position", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToEvent);
}

/**
 * The one non-optimistic mutation in this file: the client mints no id for a
 * new event (a client-side uuid would not survive an insert with an explicit
 * `id`, and inserting without one would leave local state pointing at a row
 * that does not exist). The caller must await this and adopt `event.id`.
 */
export async function createEvent(
  input: Pick<WeddingEvent, "key" | "name" | "position" | "enabled">,
): Promise<
  { success: true; event: WeddingEvent } | { success: false; error: string }
> {
  const ctx = await requireWeddingForWrite();
  if (ctx.failure) return ctx.failure;
  const { supabase, weddingId } = ctx;

  const { data, error } = await supabase
    .from("events")
    .insert({
      wedding_id: weddingId,
      key: input.key,
      name: input.name,
      position: input.position,
      enabled: input.enabled,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating event:", error);
    return { success: false, error: "Erreur lors de la création de l'événement." };
  }

  revalidateEvents();
  return { success: true, event: rowToEvent(data) };
}

export async function updateEvent(
  id: string,
  patch: Partial<WeddingEvent>,
): Promise<ActionResult> {
  const ctx = await requireWeddingForWrite();
  if (ctx.failure) return ctx.failure;
  const { supabase, weddingId } = ctx;

  const { error } = await supabase
    .from("events")
    .update(eventPatchToRow(patch))
    .eq("id", id)
    .eq("wedding_id", weddingId);

  if (error) {
    console.error("Error updating event:", error);
    return { success: false, error: "Erreur lors de la modification." };
  }

  revalidateEvents();
  return { success: true };
}

/**
 * `schedule_entries.event_id` is `on delete cascade`: this also deletes every
 * programme entry attached to the event. The caller must confirm with the
 * couple before calling this — see EventCard's delete dialog.
 */
export async function deleteEvent(id: string): Promise<ActionResult> {
  const ctx = await requireWeddingForWrite();
  if (ctx.failure) return ctx.failure;
  const { supabase, weddingId } = ctx;

  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", id)
    .eq("wedding_id", weddingId);

  if (error) {
    console.error("Error deleting event:", error);
    return { success: false, error: "Erreur lors de la suppression." };
  }

  revalidateEvents();
  return { success: true };
}

/**
 * Writes every position in one upsert: a single drag can renumber the whole
 * list, and one request per row would be both slower and non-atomic.
 */
export async function reorderEvents(ids: string[]): Promise<ActionResult> {
  const ctx = await requireWeddingForWrite();
  if (ctx.failure) return ctx.failure;
  const { supabase, weddingId } = ctx;

  const { error } = await supabase.from("events").upsert(
    ids.map((id, position) => ({ id, wedding_id: weddingId, position })),
    { onConflict: "id" },
  );

  if (error) {
    console.error("Error reordering events:", error);
    return { success: false, error: "Erreur lors du réordonnancement." };
  }

  revalidateEvents();
  return { success: true };
}
