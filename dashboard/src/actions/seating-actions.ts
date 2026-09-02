"use server";

import { requireWedding } from "@/lib/db/current-wedding";
import { rowToGuest, rowToTable } from "@/lib/db/mappers";
import { toSeatingGuest, type SeatingGuest } from "@/lib/db/projections";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";
import type { DayOfTable } from "@shared/types/jour-j";

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

const LOCALES = ["fr", "en", "de", "es", "pt", "it", "ar", "zh", "ja"] as const;

function revalidateSeating() {
  for (const locale of LOCALES) {
    revalidatePath(`/${locale}/jour-j/plan-de-table`);
  }
}

/**
 * Read action: called from the Server Component page. A throw here surfaces
 * as an error boundary, which is correct for a page that cannot render.
 *
 * `DayOfTable.guestIds` is not a column: it is rebuilt here from
 * `guests.table_id`, in ONE query over the wedding's guests, grouped in
 * memory — not one query per table (the plan's explicit call-out).
 *
 * Guests are projected through `toSeatingGuest` before they leave this
 * action: the seating board must never receive contact details or dietary
 * data, only what it renders.
 */
export async function listSeating(): Promise<{
  tables: DayOfTable[];
  guests: SeatingGuest[];
}> {
  const { supabase, weddingId } = await requireWedding();

  const [tablesRes, guestsRes] = await Promise.all([
    supabase
      .from("tables")
      .select("*")
      .eq("wedding_id", weddingId)
      .order("position", { ascending: true }),
    supabase.from("guests").select("*").eq("wedding_id", weddingId),
  ]);

  if (tablesRes.error) throw new Error(tablesRes.error.message);
  if (guestsRes.error) throw new Error(guestsRes.error.message);

  const guestRows = (guestsRes.data ?? []).map(rowToGuest);

  // Group seated guests by table_id in memory, once, rather than issuing a
  // query per table.
  const guestIdsByTable = new Map<string, string[]>();
  for (const guest of guestRows) {
    if (!guest.tableId) continue;
    const bucket = guestIdsByTable.get(guest.tableId);
    if (bucket) bucket.push(guest.id);
    else guestIdsByTable.set(guest.tableId, [guest.id]);
  }

  const tables = (tablesRes.data ?? []).map((row) =>
    rowToTable(row, guestIdsByTable.get(row.id as string) ?? []),
  );

  return {
    tables,
    guests: guestRows.map(toSeatingGuest),
  };
}

/**
 * Seats a guest at a table, re-checking capacity server-side. The client
 * already refuses a full table via `assignGuest`'s no-op return (see
 * `SeatingScreen`), but that check secures nothing by itself — anyone can
 * call this action directly, so the capacity is verified again here before
 * writing.
 */
export async function assignGuestToTable(
  guestId: string,
  tableId: string,
): Promise<ActionResult> {
  const ctx = await requireWeddingForWrite();
  if (ctx.failure) return ctx.failure;
  const { supabase, weddingId } = ctx;

  const [tableRes, countRes] = await Promise.all([
    supabase
      .from("tables")
      .select("capacity")
      .eq("id", tableId)
      .eq("wedding_id", weddingId)
      .maybeSingle(),
    supabase
      .from("guests")
      .select("id", { count: "exact", head: true })
      .eq("wedding_id", weddingId)
      .eq("table_id", tableId),
  ]);

  if (tableRes.error) {
    console.error("Error reading table capacity:", tableRes.error);
    return { success: false, error: "Erreur lors de l'affectation." };
  }
  if (!tableRes.data) {
    return { success: false, error: "Cette table n'existe plus." };
  }
  if (countRes.error) {
    console.error("Error counting seated guests:", countRes.error);
    return { success: false, error: "Erreur lors de l'affectation." };
  }

  const seated = countRes.count ?? 0;
  if (seated >= (tableRes.data.capacity as number)) {
    return { success: false, error: "Cette table est complète." };
  }

  const { error } = await supabase
    .from("guests")
    .update({ table_id: tableId })
    .eq("id", guestId)
    .eq("wedding_id", weddingId);

  if (error) {
    console.error("Error assigning guest to table:", error);
    return { success: false, error: "Erreur lors de l'affectation." };
  }

  revalidateSeating();
  return { success: true };
}

export async function unassignGuest(guestId: string): Promise<ActionResult> {
  const ctx = await requireWeddingForWrite();
  if (ctx.failure) return ctx.failure;
  const { supabase, weddingId } = ctx;

  const { error } = await supabase
    .from("guests")
    .update({ table_id: null })
    .eq("id", guestId)
    .eq("wedding_id", weddingId);

  if (error) {
    console.error("Error unassigning guest:", error);
    return { success: false, error: "Erreur lors du retrait." };
  }

  revalidateSeating();
  return { success: true };
}

/**
 * Writes only `x`/`y` — the desktop canvas position. Called from a debounced
 * client handler (400ms), so this fires once per drag, not once per pointer
 * move.
 */
export async function moveTable(
  tableId: string,
  x: number,
  y: number,
): Promise<ActionResult> {
  const ctx = await requireWeddingForWrite();
  if (ctx.failure) return ctx.failure;
  const { supabase, weddingId } = ctx;

  const { error } = await supabase
    .from("tables")
    .update({ x, y })
    .eq("id", tableId)
    .eq("wedding_id", weddingId);

  if (error) {
    console.error("Error moving table:", error);
    return { success: false, error: "Erreur lors du déplacement." };
  }

  // No revalidatePath here: a drag can fire many writes even after the
  // 400ms debounce (several tables moved in sequence), and this state is
  // display-only until the couple reloads — revalidating would fight the
  // optimistic local state for no benefit.
  return { success: true };
}
