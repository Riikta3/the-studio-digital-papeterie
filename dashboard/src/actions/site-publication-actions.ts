"use server";

import { requireWedding } from "@/lib/db/current-wedding";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

/**
 * Publishing and unpublishing the couple's invitation.
 *
 * `sites.status` is the single switch that decides whether the invitation is
 * readable at its public slug (migration 20260912110000). It is deliberately
 * NOT `day_of_settings.enabled`, which governs only the Jour J guest page —
 * the two used to share one column, so turning the Jour J module off after the
 * wedding silently took the invitation down with it.
 *
 * A wedding is published the moment it is paid for: the couple bought a page
 * to send to their guests. This is how they take it back down — to fix a wrong
 * date before sharing the link, or to retire the page after the wedding.
 */

const LOCALES = ["fr", "en", "de", "es", "pt", "it", "ar", "zh", "ja"] as const;

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

export type SitePublication = {
  published: boolean;
  /** The public slug, so the screen can show and link the real URL. */
  slug: string | null;
};

/**
 * Read action, for Server Component pages.
 *
 * Returns `published: false` rather than throwing when there is no site row:
 * a dashboard that cannot render its publication card is worse than one
 * showing the invitation as offline, which is also the truthful answer.
 */
export async function getSitePublication(): Promise<SitePublication> {
  const { supabase, weddingId } = await requireWedding();

  const { data, error } = await supabase
    .from("sites")
    .select("status, slug")
    .eq("wedding_id", weddingId)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("Error reading site publication:", error);
    return { published: false, slug: null };
  }

  return {
    published: data.status === "published",
    slug: (data.slug as string | null) ?? null,
  };
}

/**
 * Publishes or unpublishes the invitation.
 *
 * Writes the literal 'published' / 'draft' the column's check constraint
 * allows — a typo here would read as "not published" and 404 the couple's page
 * silently, which is exactly what the constraint added in 20260912110000
 * exists to prevent.
 */
export async function setSitePublished(published: boolean): Promise<ActionResult> {
  const ctx = await requireWeddingForWrite();
  if (ctx.failure) return ctx.failure;
  const { supabase, weddingId } = ctx;

  const { error } = await supabase
    .from("sites")
    .update({ status: published ? "published" : "draft" })
    .eq("wedding_id", weddingId);

  if (error) {
    console.error("Error updating site publication:", error);
    return { success: false, error: "Erreur lors de l'enregistrement." };
  }

  // Both surfaces that show the state: the home card and the settings screen.
  for (const locale of LOCALES) {
    revalidatePath(`/${locale}`);
    revalidatePath(`/${locale}/settings`);
  }

  return { success: true };
}
