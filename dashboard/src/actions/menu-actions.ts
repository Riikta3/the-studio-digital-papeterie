"use server";

import { requireWedding } from "@/lib/db/current-wedding";
import { rowToMenuCategory, rowToMenuItem } from "@/lib/db/mappers";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";
import type { MenuCategory, MenuItem } from "@shared/types/jour-j";

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

function revalidateMenu() {
  for (const locale of LOCALES) {
    revalidatePath(`/${locale}/jour-j/menu`);
  }
}

/**
 * `menu_items` has no `wedding_id`: it reaches the wedding only through
 * `category_id` -> `menu_categories.wedding_id`. RLS enforces this via a
 * subquery, but the plan's global constraint asks for the explicit
 * application-level check too, so every item write below confirms the
 * category belongs to the current wedding before touching it.
 */
async function categoryBelongsToWedding(
  supabase: Awaited<ReturnType<typeof requireWedding>>["supabase"],
  categoryId: string,
  weddingId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("menu_categories")
    .select("id")
    .eq("id", categoryId)
    .eq("wedding_id", weddingId)
    .maybeSingle();

  if (error) {
    console.error("Error verifying menu category ownership:", error);
    return false;
  }
  return data !== null;
}

/**
 * Read action: called from the Server Component page. A throw here surfaces
 * as an error boundary, which is correct for a page that cannot render.
 *
 * One query on `menu_categories`, one on `menu_items` (there is no
 * `wedding_id` on items, so they cannot be filtered by wedding directly —
 * scoped instead to the category ids just read), joined in memory.
 */
export async function listMenu(): Promise<MenuCategory[]> {
  const { supabase, weddingId } = await requireWedding();

  const { data: categoryRows, error: categoriesError } = await supabase
    .from("menu_categories")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("position", { ascending: true });

  if (categoriesError) throw new Error(categoriesError.message);

  const categoryIds = (categoryRows ?? []).map((row) => row.id as string);
  if (categoryIds.length === 0) return [];

  const { data: itemRows, error: itemsError } = await supabase
    .from("menu_items")
    .select("*")
    .in("category_id", categoryIds)
    .order("position", { ascending: true });

  if (itemsError) throw new Error(itemsError.message);

  const itemsByCategory = new Map<string, MenuItem[]>();
  for (const row of itemRows ?? []) {
    const categoryId = row.category_id as string;
    const item = rowToMenuItem(row);
    const bucket = itemsByCategory.get(categoryId);
    if (bucket) bucket.push(item);
    else itemsByCategory.set(categoryId, [item]);
  }

  return (categoryRows ?? []).map((row) =>
    rowToMenuCategory(row, itemsByCategory.get(row.id as string) ?? []),
  );
}

export async function toggleCategory(
  id: string,
  enabled: boolean,
): Promise<ActionResult> {
  const ctx = await requireWeddingForWrite();
  if (ctx.failure) return ctx.failure;
  const { supabase, weddingId } = ctx;

  const { error } = await supabase
    .from("menu_categories")
    .update({ enabled })
    .eq("id", id)
    .eq("wedding_id", weddingId);

  if (error) {
    console.error("Error toggling menu category:", error);
    return { success: false, error: "Erreur lors de la modification." };
  }

  revalidateMenu();
  return { success: true };
}

/**
 * The one non-optimistic mutation here, mirroring `createEvent`: the client
 * mints no id for a new item (`MenuCategoryCard` currently mints an `mi-`
 * prefixed id, which is not a valid Postgres uuid). The caller must await
 * this and adopt `item.id`.
 */
export async function createMenuItem(
  categoryId: string,
  input: Pick<MenuItem, "name"> & Partial<Pick<MenuItem, "description" | "variant">>,
  position: number,
): Promise<{ success: true; item: MenuItem } | { success: false; error: string }> {
  const ctx = await requireWeddingForWrite();
  if (ctx.failure) return ctx.failure;
  const { supabase, weddingId } = ctx;

  if (!(await categoryBelongsToWedding(supabase, categoryId, weddingId))) {
    return { success: false, error: "Cette catégorie n'existe plus." };
  }

  const { data, error } = await supabase
    .from("menu_items")
    .insert({
      category_id: categoryId,
      name: input.name,
      description: input.description ?? null,
      variant: input.variant ?? null,
      position,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating menu item:", error);
    return { success: false, error: "Erreur lors de l'ajout du plat." };
  }

  revalidateMenu();
  return { success: true, item: rowToMenuItem(data) };
}

function menuItemPatchToRow(patch: Partial<MenuItem>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if ("name" in patch) row.name = patch.name;
  if ("description" in patch) row.description = patch.description ?? null;
  if ("variant" in patch) row.variant = patch.variant ?? null;
  return row;
}

export async function updateMenuItem(
  categoryId: string,
  itemId: string,
  patch: Partial<MenuItem>,
): Promise<ActionResult> {
  const ctx = await requireWeddingForWrite();
  if (ctx.failure) return ctx.failure;
  const { supabase, weddingId } = ctx;

  if (!(await categoryBelongsToWedding(supabase, categoryId, weddingId))) {
    return { success: false, error: "Cette catégorie n'existe plus." };
  }

  const { error } = await supabase
    .from("menu_items")
    .update(menuItemPatchToRow(patch))
    .eq("id", itemId)
    .eq("category_id", categoryId);

  if (error) {
    console.error("Error updating menu item:", error);
    return { success: false, error: "Erreur lors de la modification." };
  }

  revalidateMenu();
  return { success: true };
}

export async function deleteMenuItem(
  categoryId: string,
  itemId: string,
): Promise<ActionResult> {
  const ctx = await requireWeddingForWrite();
  if (ctx.failure) return ctx.failure;
  const { supabase, weddingId } = ctx;

  if (!(await categoryBelongsToWedding(supabase, categoryId, weddingId))) {
    return { success: false, error: "Cette catégorie n'existe plus." };
  }

  const { error } = await supabase
    .from("menu_items")
    .delete()
    .eq("id", itemId)
    .eq("category_id", categoryId);

  if (error) {
    console.error("Error deleting menu item:", error);
    return { success: false, error: "Erreur lors de la suppression." };
  }

  revalidateMenu();
  return { success: true };
}

/**
 * Writes every position in one upsert: reordering within a category can
 * touch every sibling item, and one request per row would be both slower
 * and non-atomic. Mirrors `reorderEvents`/`reorderFaqEntries`, but scoped by
 * `category_id` since items have no `wedding_id` to filter by.
 */
export async function reorderMenuItems(
  categoryId: string,
  itemIds: string[],
): Promise<ActionResult> {
  const ctx = await requireWeddingForWrite();
  if (ctx.failure) return ctx.failure;
  const { supabase, weddingId } = ctx;

  if (!(await categoryBelongsToWedding(supabase, categoryId, weddingId))) {
    return { success: false, error: "Cette catégorie n'existe plus." };
  }

  const { error } = await supabase.from("menu_items").upsert(
    itemIds.map((id, position) => ({ id, category_id: categoryId, position })),
    { onConflict: "id" },
  );

  if (error) {
    console.error("Error reordering menu items:", error);
    return { success: false, error: "Erreur lors du réordonnancement." };
  }

  revalidateMenu();
  return { success: true };
}
