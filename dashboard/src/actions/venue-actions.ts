"use server";

import { requireWedding } from "@/lib/db/current-wedding";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { rowToAccommodation, rowToVenue } from "@/lib/db/mappers";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";
import type { Accommodation, Venue } from "@shared/types/invitation";

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

/** Same per-field-present logic as events' patch mapper: an absent key must
 * never be coerced to `null` and overwrite an untouched column. */
function venuePatchToRow(patch: Partial<Venue>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if ("name" in patch) row.name = patch.name;
  if ("address" in patch) row.address = patch.address ?? null;
  if ("city" in patch) row.city = patch.city ?? null;
  if ("mapsUrl" in patch) row.maps_url = patch.mapsUrl ?? null;
  if ("wazeUrl" in patch) row.waze_url = patch.wazeUrl ?? null;
  if ("parkingInfo" in patch) row.parking_info = patch.parkingInfo ?? null;
  if ("accessInfo" in patch) row.access_info = patch.accessInfo ?? null;
  if ("transportInfo" in patch) row.transport_info = patch.transportInfo ?? null;
  if ("photoUrl" in patch) row.photo_url = patch.photoUrl ?? null;
  return row;
}

function accommodationPatchToRow(
  patch: Partial<Accommodation>,
): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if ("name" in patch) row.name = patch.name;
  if ("city" in patch) row.city = patch.city ?? null;
  if ("distance" in patch) row.distance = patch.distance ?? null;
  if ("phone" in patch) row.phone = patch.phone ?? null;
  if ("bookingUrl" in patch) row.booking_url = patch.bookingUrl ?? null;
  if ("offer" in patch) row.offer = patch.offer ?? null;
  if ("photoUrl" in patch) row.photo_url = patch.photoUrl ?? null;
  if ("position" in patch) row.position = patch.position;
  return row;
}

const LOCALES = ["fr", "en", "de", "es", "pt", "it", "ar", "zh", "ja"] as const;

function revalidateLieu() {
  for (const locale of LOCALES) {
    revalidatePath(`/${locale}/invitation/lieu`);
  }
}

/**
 * Read action: called from the Server Component page. A throw here surfaces
 * as an error boundary, which is correct for a page that cannot render.
 *
 * `venues` has zero-or-one row per wedding (unique(wedding_id)) — a couple
 * who never opened this screen has no row at all, so this returns `null`
 * rather than throwing, and the page must render the empty form.
 */
export async function getVenue(): Promise<Venue | null> {
  const { supabase, weddingId } = await requireWedding();

  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .eq("wedding_id", weddingId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? rowToVenue(data) : null;
}

/**
 * Creates on first save, updates afterwards — `venues` declares
 * `unique(wedding_id)`, so an upsert on that column can never insert a
 * duplicate row for the same wedding.
 */
export async function upsertVenue(patch: Partial<Venue>): Promise<ActionResult> {
  const ctx = await requireWeddingForWrite();
  if (ctx.failure) return ctx.failure;
  const { supabase, weddingId } = ctx;

  const { error } = await supabase
    .from("venues")
    .upsert(
      { wedding_id: weddingId, ...venuePatchToRow(patch) },
      { onConflict: "wedding_id" },
    );

  if (error) {
    console.error("Error saving venue:", error);
    return { success: false, error: "Erreur lors de l'enregistrement." };
  }

  revalidateLieu();
  return { success: true };
}

export async function listAccommodations(): Promise<Accommodation[]> {
  const { supabase, weddingId } = await requireWedding();

  const { data, error } = await supabase
    .from("accommodations")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("position", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToAccommodation);
}

/**
 * The one non-optimistic mutation here, mirroring `createEvent`: the client
 * mints no id for a new accommodation (a client-side uuid would not survive
 * an insert with an explicit `id`, and the mock's `ac-` prefixed string is
 * not a valid Postgres uuid at all). The caller must await this and adopt
 * `accommodation.id`.
 */
export async function createAccommodation(
  input: Pick<Accommodation, "name" | "position">,
): Promise<
  | { success: true; accommodation: Accommodation }
  | { success: false; error: string }
> {
  const ctx = await requireWeddingForWrite();
  if (ctx.failure) return ctx.failure;
  const { supabase, weddingId } = ctx;

  const { data, error } = await supabase
    .from("accommodations")
    .insert({
      wedding_id: weddingId,
      name: input.name,
      position: input.position,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating accommodation:", error);
    return { success: false, error: "Erreur lors de la création de l'hébergement." };
  }

  revalidateLieu();
  return { success: true, accommodation: rowToAccommodation(data) };
}

export async function updateAccommodation(
  id: string,
  patch: Partial<Accommodation>,
): Promise<ActionResult> {
  const ctx = await requireWeddingForWrite();
  if (ctx.failure) return ctx.failure;
  const { supabase, weddingId } = ctx;

  const { error } = await supabase
    .from("accommodations")
    .update(accommodationPatchToRow(patch))
    .eq("id", id)
    .eq("wedding_id", weddingId);

  if (error) {
    console.error("Error updating accommodation:", error);
    return { success: false, error: "Erreur lors de la modification." };
  }

  revalidateLieu();
  return { success: true };
}

export async function deleteAccommodation(id: string): Promise<ActionResult> {
  const ctx = await requireWeddingForWrite();
  if (ctx.failure) return ctx.failure;
  const { supabase, weddingId } = ctx;

  const { error } = await supabase
    .from("accommodations")
    .delete()
    .eq("id", id)
    .eq("wedding_id", weddingId);

  if (error) {
    console.error("Error deleting accommodation:", error);
    return { success: false, error: "Erreur lors de la suppression." };
  }

  revalidateLieu();
  return { success: true };
}

/**
 * Writes every position in one upsert: a single move can renumber the whole
 * list, and one request per row would be both slower and non-atomic.
 */
export async function reorderAccommodations(ids: string[]): Promise<ActionResult> {
  const ctx = await requireWeddingForWrite();
  if (ctx.failure) return ctx.failure;
  const { supabase, weddingId } = ctx;

  const { error } = await supabase.from("accommodations").upsert(
    ids.map((id, position) => ({ id, wedding_id: weddingId, position })),
    { onConflict: "id" },
  );

  if (error) {
    console.error("Error reordering accommodations:", error);
    return { success: false, error: "Erreur lors du réordonnancement." };
  }

  revalidateLieu();
  return { success: true };
}

const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8MB — matches PhotoPicker's client-side cap.
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Shared upload for both the venue's own photo and each accommodation's
 * photo — same bucket, same limits, only the folder prefix differs so the
 * two stay separable under `<wedding_id>/…`.
 *
 * `PhotoPicker` already enforces the 8MB cap and the JPEG/PNG/WebP allowlist
 * in the browser, but a limit checked only client-side is not a limit: both
 * are re-applied here before anything reaches storage.
 */
async function uploadPhoto(
  formData: FormData,
  folder: "venue" | "accommodations",
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  const ctx = await requireWeddingForWrite();
  if (ctx.failure) return ctx.failure;
  const { weddingId } = ctx;

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, error: "Aucun fichier fourni." };
  }
  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
    return {
      success: false,
      error: "Format non pris en charge. Utilisez un JPEG, un PNG ou un WebP.",
    };
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return { success: false, error: "Photo trop lourde. Le maximum est de 8 Mo." };
  }

  const ext = EXT_BY_TYPE[file.type];
  const path = `${weddingId}/${folder}/${crypto.randomUUID()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error } = await supabaseAdmin.storage
    .from("venue")
    .upload(path, Buffer.from(arrayBuffer), {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error("Error uploading photo:", error);
    return { success: false, error: "Erreur lors du téléversement de la photo." };
  }

  const { data } = supabaseAdmin.storage.from("venue").getPublicUrl(path);
  return { success: true, url: data.publicUrl };
}

export async function uploadVenuePhoto(
  formData: FormData,
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  return uploadPhoto(formData, "venue");
}

export async function uploadAccommodationPhoto(
  formData: FormData,
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  return uploadPhoto(formData, "accommodations");
}
