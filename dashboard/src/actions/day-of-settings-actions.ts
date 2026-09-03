"use server";

import { requireWedding } from "@/lib/db/current-wedding";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";
import type { DayOfSettings } from "@shared/types/jour-j";

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

function revalidateDayOf() {
  for (const locale of LOCALES) {
    revalidatePath(`/${locale}/jour-j/parametres`);
    revalidatePath(`/${locale}/jour-j/qr-code`);
  }
}

/**
 * A couple who never opened the settings screen has no `day_of_settings`
 * row at all — the row is only created on first write (see
 * `updateDayOfSettings`). Every field here must still be present, because
 * `DayOfSettingsForm.tsx` calls `.slice(0, 10)` on `uploadsOpenUntil`
 * unconditionally: a missing field throws on first render for every new
 * couple. The values below are the "module off, nothing shared, no upload
 * window" state, which is the only safe default: a couple must switch the
 * guest page on deliberately, never find it already live.
 */
const DEFAULT_SETTINGS: Omit<DayOfSettings, "qrSlug"> = {
  enabled: false,
  galleryVisibleToGuests: false,
  uploadsOpenUntil: "",
  afterWeddingMode: false,
};

/**
 * Read action: called from Server Component pages (parametres + qr-code). A
 * throw here surfaces as an error boundary, which is correct for a page
 * that cannot render.
 *
 * `qrSlug` is never a `day_of_settings` column — it comes from `sites.slug`,
 * the one source of truth for the printed QR's URL (spec §2.1). Always
 * returns a complete object, defaulted where no row/slug exists yet, never
 * `null` and never a missing field.
 */
export async function getDayOfSettings(): Promise<DayOfSettings> {
  const { supabase, weddingId } = await requireWedding();

  const [settingsRes, siteRes] = await Promise.all([
    supabase
      .from("day_of_settings")
      .select(
        "enabled, gallery_visible_to_guests, uploads_open_until, after_wedding_mode, venue_plan_url",
      )
      .eq("wedding_id", weddingId)
      .maybeSingle(),
    supabase.from("sites").select("slug").eq("wedding_id", weddingId).maybeSingle(),
  ]);

  if (settingsRes.error) throw new Error(settingsRes.error.message);
  if (siteRes.error) throw new Error(siteRes.error.message);

  const qrSlug = siteRes.data?.slug ?? "";
  const row = settingsRes.data;

  if (!row) {
    return { ...DEFAULT_SETTINGS, qrSlug };
  }

  return {
    enabled: row.enabled as boolean,
    qrSlug,
    galleryVisibleToGuests: row.gallery_visible_to_guests as boolean,
    uploadsOpenUntil: (row.uploads_open_until as string | null) ?? "",
    afterWeddingMode: row.after_wedding_mode as boolean,
    venuePlanUrl: (row.venue_plan_url as string | null) ?? undefined,
  };
}

/**
 * `day_of_settings` declares `unique(wedding_id)`, so an upsert on that
 * column can never insert a duplicate row — this creates the row on first
 * write and updates it afterwards, exactly like `upsertVenue`.
 *
 * `qrSlug` is deliberately not accepted here: it is derived from
 * `sites.slug` on read, never stored on this table (see `getDayOfSettings`).
 */
export async function updateDayOfSettings(
  patch: Partial<Omit<DayOfSettings, "qrSlug">>,
): Promise<ActionResult> {
  const ctx = await requireWeddingForWrite();
  if (ctx.failure) return ctx.failure;
  const { supabase, weddingId } = ctx;

  const row: Record<string, unknown> = { wedding_id: weddingId };
  if ("enabled" in patch) row.enabled = patch.enabled;
  if ("galleryVisibleToGuests" in patch) {
    row.gallery_visible_to_guests = patch.galleryVisibleToGuests;
  }
  if ("uploadsOpenUntil" in patch) {
    row.uploads_open_until = patch.uploadsOpenUntil || null;
  }
  if ("afterWeddingMode" in patch) row.after_wedding_mode = patch.afterWeddingMode;
  if ("venuePlanUrl" in patch) row.venue_plan_url = patch.venuePlanUrl ?? null;

  const { error } = await supabase
    .from("day_of_settings")
    .upsert(row, { onConflict: "wedding_id" });

  if (error) {
    console.error("Error saving day-of settings:", error);
    return { success: false, error: "Erreur lors de l'enregistrement." };
  }

  revalidateDayOf();
  return { success: true };
}
