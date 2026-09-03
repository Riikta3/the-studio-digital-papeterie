"use server";

import { requireWedding } from "@/lib/db/current-wedding";
import { rowToFaqEntry } from "@/lib/db/mappers";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";
import type { FaqEntry } from "@shared/types/invitation";

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

function faqPatchToRow(patch: Partial<FaqEntry>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if ("question" in patch) row.question = patch.question;
  if ("answer" in patch) row.answer = patch.answer;
  if ("position" in patch) row.position = patch.position;
  if ("published" in patch) row.published = patch.published;
  return row;
}

const LOCALES = ["fr", "en", "de", "es", "pt", "it", "ar", "zh", "ja"] as const;

function revalidateFaq() {
  for (const locale of LOCALES) {
    revalidatePath(`/${locale}/invitation/faq`);
  }
}

/**
 * Read action: called from the Server Component page. A throw here surfaces
 * as an error boundary, which is correct for a page that cannot render.
 */
export async function listFaq(): Promise<FaqEntry[]> {
  const { supabase, weddingId } = await requireWedding();

  const { data, error } = await supabase
    .from("faq_entries")
    .select("id, question, answer, position, published")
    .eq("wedding_id", weddingId)
    .order("position", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToFaqEntry);
}

/**
 * The one non-optimistic mutation here, mirroring `createEvent`: the client
 * mints no id for a new entry (the mock's `fq-` prefixed string is not a
 * valid Postgres uuid). The caller must await this and adopt `entry.id`.
 */
export async function createFaqEntry(
  input: Pick<FaqEntry, "question" | "answer" | "position" | "published">,
): Promise<
  { success: true; entry: FaqEntry } | { success: false; error: string }
> {
  const ctx = await requireWeddingForWrite();
  if (ctx.failure) return ctx.failure;
  const { supabase, weddingId } = ctx;

  const { data, error } = await supabase
    .from("faq_entries")
    .insert({
      wedding_id: weddingId,
      question: input.question,
      answer: input.answer,
      position: input.position,
      published: input.published,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating FAQ entry:", error);
    return { success: false, error: "Erreur lors de la création de la question." };
  }

  revalidateFaq();
  return { success: true, entry: rowToFaqEntry(data) };
}

export async function updateFaqEntry(
  id: string,
  patch: Partial<FaqEntry>,
): Promise<ActionResult> {
  const ctx = await requireWeddingForWrite();
  if (ctx.failure) return ctx.failure;
  const { supabase, weddingId } = ctx;

  const { error } = await supabase
    .from("faq_entries")
    .update(faqPatchToRow(patch))
    .eq("id", id)
    .eq("wedding_id", weddingId);

  if (error) {
    console.error("Error updating FAQ entry:", error);
    return { success: false, error: "Erreur lors de la modification." };
  }

  revalidateFaq();
  return { success: true };
}

export async function deleteFaqEntry(id: string): Promise<ActionResult> {
  const ctx = await requireWeddingForWrite();
  if (ctx.failure) return ctx.failure;
  const { supabase, weddingId } = ctx;

  const { error } = await supabase
    .from("faq_entries")
    .delete()
    .eq("id", id)
    .eq("wedding_id", weddingId);

  if (error) {
    console.error("Error deleting FAQ entry:", error);
    return { success: false, error: "Erreur lors de la suppression." };
  }

  revalidateFaq();
  return { success: true };
}

/**
 * Writes every position in one upsert: a single move can renumber the whole
 * list, and one request per row would be both slower and non-atomic.
 */
export async function reorderFaqEntries(ids: string[]): Promise<ActionResult> {
  const ctx = await requireWeddingForWrite();
  if (ctx.failure) return ctx.failure;
  const { supabase, weddingId } = ctx;

  const { error } = await supabase.from("faq_entries").upsert(
    ids.map((id, position) => ({ id, wedding_id: weddingId, position })),
    { onConflict: "id" },
  );

  if (error) {
    console.error("Error reordering FAQ entries:", error);
    return { success: false, error: "Erreur lors du réordonnancement." };
  }

  revalidateFaq();
  return { success: true };
}

export async function setFaqPublished(
  id: string,
  published: boolean,
): Promise<ActionResult> {
  const ctx = await requireWeddingForWrite();
  if (ctx.failure) return ctx.failure;
  const { supabase, weddingId } = ctx;

  const { error } = await supabase
    .from("faq_entries")
    .update({ published })
    .eq("id", id)
    .eq("wedding_id", weddingId);

  if (error) {
    console.error("Error updating FAQ publish state:", error);
    return { success: false, error: "Erreur lors de la modification." };
  }

  revalidateFaq();
  return { success: true };
}
