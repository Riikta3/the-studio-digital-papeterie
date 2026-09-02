"use server";

import { requireWedding } from "@/lib/db/current-wedding";
import { rowToGuestMedia } from "@/lib/db/mappers";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";
import type { GuestMedia } from "@shared/types/jour-j";

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

function revalidatePhotos() {
  for (const locale of LOCALES) {
    revalidatePath(`/${locale}/jour-j/photos`);
  }
}

const BUCKET = "guest-media";
// Long enough to cover a slow render + a couple's active viewing session;
// short enough that a leaked link goes stale rather than staying valid
// forever, the whole point of signing instead of using a public URL.
const SIGNED_URL_TTL_SECONDS = 60 * 60;

/**
 * Read action: called from the Server Component page. A throw here surfaces
 * as an error boundary, which is correct for a page that cannot render.
 *
 * The dashboard is the couple's own authenticated screen and it is where
 * hiding happens — a screen that cannot see what it hid cannot unhide it —
 * so every row comes back regardless of `hidden`. `visibleMedia()` is what
 * strips hidden rows, and it is applied on the guest-facing page instead,
 * not here.
 *
 * `storage_path`/`thumb_path` never leave this function as-is: each row's
 * path is exchanged for a short-lived signed URL server-side before
 * `rowToGuestMedia` builds the client-facing object, so the raw bucket path
 * never reaches the browser.
 */
export async function listGuestMedia(): Promise<GuestMedia[]> {
  const { supabase, weddingId } = await requireWedding();

  const { data, error } = await supabase
    .from("guest_media")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return [];

  return Promise.all(
    data.map(async (row) => {
      const thumbPath = (row.thumb_path as string | null) ?? (row.storage_path as string);

      const [signedUrl, signedThumbUrl] = await Promise.all([
        supabase.storage
          .from(BUCKET)
          .createSignedUrl(row.storage_path as string, SIGNED_URL_TTL_SECONDS),
        supabase.storage
          .from(BUCKET)
          .createSignedUrl(thumbPath, SIGNED_URL_TTL_SECONDS),
      ]);

      // A signing failure (e.g. the object went missing from the bucket)
      // must not crash the whole grid — fall back to an empty string so the
      // tile renders as a broken image rather than the entire page erroring.
      return rowToGuestMedia(
        row,
        signedUrl.data?.signedUrl ?? "",
        signedThumbUrl.data?.signedUrl ?? "",
      );
    }),
  );
}

export async function setMediaHidden(id: string, hidden: boolean): Promise<ActionResult> {
  const ctx = await requireWeddingForWrite();
  if (ctx.failure) return ctx.failure;
  const { supabase, weddingId } = ctx;

  const { error } = await supabase
    .from("guest_media")
    .update({ hidden })
    .eq("id", id)
    .eq("wedding_id", weddingId);

  if (error) {
    console.error("Error updating guest media visibility:", error);
    return { success: false, error: "Erreur lors de la modification." };
  }

  revalidatePhotos();
  return { success: true };
}

/**
 * Deletes the storage object BEFORE the database row. The reverse order
 * would leave an orphaned file that is still billable and still reachable
 * by signed URL if the row delete were the only thing to succeed. If the
 * object delete fails, the row is left untouched and the failure is
 * reported — never delete the row on a storage failure.
 */
export async function deleteMedia(id: string): Promise<ActionResult> {
  const ctx = await requireWeddingForWrite();
  if (ctx.failure) return ctx.failure;
  const { supabase, weddingId } = ctx;

  const { data: row, error: fetchError } = await supabase
    .from("guest_media")
    .select("storage_path, thumb_path")
    .eq("id", id)
    .eq("wedding_id", weddingId)
    .maybeSingle();

  if (fetchError) {
    console.error("Error fetching guest media before delete:", fetchError);
    return { success: false, error: "Erreur lors de la suppression." };
  }
  if (!row) {
    return { success: false, error: "Contenu introuvable." };
  }

  const paths = [row.storage_path as string];
  if (row.thumb_path && row.thumb_path !== row.storage_path) {
    paths.push(row.thumb_path as string);
  }

  const { error: storageError } = await supabase.storage.from(BUCKET).remove(paths);
  if (storageError) {
    console.error("Error deleting guest media object:", storageError);
    return { success: false, error: "Erreur lors de la suppression du fichier." };
  }

  const { error: rowError } = await supabase
    .from("guest_media")
    .delete()
    .eq("id", id)
    .eq("wedding_id", weddingId);

  if (rowError) {
    // The object is already gone but the row survives: report it rather than
    // silently leaving a row pointing at nothing, so the couple can retry.
    console.error("Error deleting guest media row after object removal:", rowError);
    return { success: false, error: "Erreur lors de la suppression." };
  }

  revalidatePhotos();
  return { success: true };
}
