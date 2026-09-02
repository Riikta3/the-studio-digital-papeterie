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

  // Only guests who accepted reach the board. A declined or unanswered guest
  // has no business in a seating plan, and shipping the other 16 of 140 to the
  // browser exposes names for no purpose.
  //
  // The exception is someone already seated who has since declined: they stay
  // visible so the couple can actually take them off the table. Dropping them
  // here would leave a ghost occupying a seat with no way to remove them.
  const seatedIds = new Set(tables.flatMap((t) => t.guestIds));
  const relevant = guestRows.filter(
    (g) => g.status === "confirmed" || seatedIds.has(g.id),
  );

  return {
    tables,
    guests: relevant.map(toSeatingGuest),
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

/* ------------------------------------------------------------------ *
 * Table management
 * ------------------------------------------------------------------ */

/**
 * Adds a table. Non-optimistic, like every other create in this codebase: the
 * client mints no id, because a client-side string is not a valid Postgres
 * uuid and every later write on that table would target a row that does not
 * exist. The caller awaits this and adopts `table.id`.
 *
 * The new table is placed after the existing ones on the canvas, following the
 * same 4-per-row grid the seed uses, so it lands somewhere visible instead of
 * on top of table one.
 */
export async function createTable(input: {
  name: string;
  capacity: number;
  seatsLabel?: string;
}): Promise<
  { success: true; table: DayOfTable } | { success: false; error: string }
> {
  const ctx = await requireWeddingForWrite();
  if (ctx.failure) return ctx.failure;
  const { supabase, weddingId } = ctx;

  const { count } = await supabase
    .from("tables")
    .select("*", { count: "exact", head: true })
    .eq("wedding_id", weddingId);

  const index = count ?? 0;

  const { data, error } = await supabase
    .from("tables")
    .insert({
      wedding_id: weddingId,
      name: input.name,
      capacity: input.capacity,
      seats_label: input.seatsLabel ?? null,
      shape: "round",
      position: index,
      // A full 12-seat card runs ~380px tall, so rows are spaced clear of it.
      x: 120 + (index % 4) * 260,
      y: 120 + Math.floor(index / 4) * 430,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating table:", error);
    return { success: false, error: "Erreur lors de la création de la table." };
  }

  revalidateSeating();
  return { success: true, table: rowToTable(data, []) };
}

/**
 * Renames a table or changes its capacity.
 *
 * Capacity cannot be cut below the number of people already seated: the couple
 * would end up with an over-full table and no indication of who to move. They
 * are told to remove someone first, which is the decision only they can make.
 */
export async function updateTable(
  tableId: string,
  patch: { name?: string; capacity?: number; seatsLabel?: string | null },
): Promise<ActionResult> {
  const ctx = await requireWeddingForWrite();
  if (ctx.failure) return ctx.failure;
  const { supabase, weddingId } = ctx;

  if (patch.capacity !== undefined) {
    if (!Number.isInteger(patch.capacity) || patch.capacity < 1) {
      return { success: false, error: "La capacité doit être au moins de 1." };
    }

    const { count: seated } = await supabase
      .from("guests")
      .select("*", { count: "exact", head: true })
      .eq("wedding_id", weddingId)
      .eq("table_id", tableId);

    if ((seated ?? 0) > patch.capacity) {
      return {
        success: false,
        error: `Cette table compte déjà ${seated} personnes. Retirez-en avant de réduire la capacité.`,
      };
    }
  }

  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.capacity !== undefined) row.capacity = patch.capacity;
  if (patch.seatsLabel !== undefined) row.seats_label = patch.seatsLabel;

  const { error } = await supabase
    .from("tables")
    .update(row)
    .eq("id", tableId)
    .eq("wedding_id", weddingId);

  if (error) {
    console.error("Error updating table:", error);
    return { success: false, error: "Erreur lors de la modification." };
  }

  revalidateSeating();
  return { success: true };
}

/**
 * Removes a table, sending its guests back to the "to place" list.
 *
 * `guests.table_id` is `on delete set null`
 * (`00000000000000_full_db_reset.sql:164`), so the database would detach them
 * on its own. The explicit update below runs first anyway, because it is what
 * makes the operation legible: a reader of this function should not have to
 * know a foreign-key clause to answer "does deleting a table delete its
 * guests?". It also means the failure is reported here, with a French message,
 * rather than surfacing as a constraint error if that clause ever changes.
 */
export async function deleteTable(tableId: string): Promise<ActionResult> {
  const ctx = await requireWeddingForWrite();
  if (ctx.failure) return ctx.failure;
  const { supabase, weddingId } = ctx;

  const { error: unseatError } = await supabase
    .from("guests")
    .update({ table_id: null })
    .eq("wedding_id", weddingId)
    .eq("table_id", tableId);

  if (unseatError) {
    console.error("Error unseating guests before delete:", unseatError);
    return { success: false, error: "Erreur lors de la suppression." };
  }

  const { error } = await supabase
    .from("tables")
    .delete()
    .eq("id", tableId)
    .eq("wedding_id", weddingId);

  if (error) {
    console.error("Error deleting table:", error);
    return { success: false, error: "Erreur lors de la suppression." };
  }

  revalidateSeating();
  return { success: true };
}
