"use server";

import { requireWedding } from "@/lib/db/current-wedding";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

/**
 * The couple's own words on their invitation, and their photograph.
 *
 * These four columns live on `settings` (migration 20260912140000) and feed
 * `InvitationData.copy` and `couple.portrait`, which the theme contract has
 * always described as things a couple could rewrite. Until the columns
 * existed, nothing could: `toInvitationData` derived the hero line from a
 * French string literal, so every wedding on a given theme opened with the
 * same sentence above their names.
 */
export type InvitationCopy = {
  heroKicker: string;
  announcement: string;
  closingWords: string;
  couplePhotoUrl: string;
};

/**
 * Not exported: a `"use server"` module may only export async functions, and
 * exporting this object makes every import of the file fail to compile.
 */
const EMPTY_INVITATION_COPY: InvitationCopy = {
  heroKicker: "",
  announcement: "",
  closingWords: "",
  couplePhotoUrl: "",
};

const LOCALES = ["fr", "en", "de", "es", "pt", "it", "ar", "zh", "ja"] as const;

/** Empty means "not written": the theme then falls back to its own default,
 *  and a stored `""` would print a blank line where that default belonged. */
function orNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Read action, called from the Server Component page. A throw surfaces as an
 * error boundary, which is right for a page that cannot render.
 *
 * `settings` is created at checkout, so the row exists for every real wedding;
 * `maybeSingle` covers the rest rather than throwing on them.
 */
export async function getInvitationCopy(): Promise<InvitationCopy> {
  const { supabase, weddingId } = await requireWedding();

  const { data, error } = await supabase
    .from("settings")
    .select("hero_kicker, announcement, closing_words, couple_photo_url")
    .eq("wedding_id", weddingId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return EMPTY_INVITATION_COPY;

  return {
    heroKicker: data.hero_kicker ?? "",
    announcement: data.announcement ?? "",
    closingWords: data.closing_words ?? "",
    couplePhotoUrl: data.couple_photo_url ?? "",
  };
}

/**
 * Writes all four fields at once — this is one form with one save button, so
 * there is no partial patch to reconcile.
 *
 * `update`, not `upsert`: the row is created at checkout alongside the
 * wedding, and an upsert here would silently create a settings row with every
 * other column at its default for a wedding that somehow lacked one, which
 * would be a worse bug than the failure it hides.
 */
export async function saveInvitationCopy(
  copy: InvitationCopy,
): Promise<ActionResult> {
  let ctx;
  try {
    ctx = await requireWedding();
  } catch {
    return { success: false, error: "Vous devez être connecté" };
  }
  const { supabase, weddingId } = ctx;

  const { error } = await supabase
    .from("settings")
    .update({
      hero_kicker: orNull(copy.heroKicker),
      announcement: orNull(copy.announcement),
      closing_words: orNull(copy.closingWords),
      couple_photo_url: orNull(copy.couplePhotoUrl),
    })
    .eq("wedding_id", weddingId);

  if (error) {
    console.error("Error saving invitation copy:", error);
    return { success: false, error: "Erreur lors de l'enregistrement." };
  }

  for (const locale of LOCALES) {
    revalidatePath(`/${locale}/invitation/nos-mots`);
  }
  return { success: true };
}
