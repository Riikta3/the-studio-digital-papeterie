"use server";

import { createClient } from "@/utils/supabase/server";
import type { MenuCategoryKey } from "@shared/types/jour-j";

/**
 * Everything the anonymous Jour J guest page reads, and its ONLY route into
 * the guest list.
 *
 * ── Why the anon client, never `supabaseAdmin` ───────────────────────────────
 * This page is reached by scanning a QR code printed on a table. There is no
 * session, no login, no way to know who is holding the phone. `createClient()`
 * uses the ANON key, so every read below goes through Row Level Security and
 * the database's own rules stay the last line of defence. `supabaseAdmin`
 * (SERVICE_ROLE) bypasses RLS entirely: with it, `slug` — a value that arrives
 * straight from the URL — would be enough to read any wedding's guest roster.
 * See the header comment in `src/utils/supabase/server.ts`.
 *
 * ── Why the guest search is an RPC and not a query ───────────────────────────
 * `searchMyTable` calls `search_guest_table`, a security-definer function that
 * enforces the 2-character minimum, the 5-row cap, the confirmed+seated filter
 * and a four-column result (first name, last name, table name, seat label — no
 * email, no phone, no status, no id). `guests` has no anon select policy
 * anywhere in this schema and must never get one: a select policy "for
 * convenience" would make the whole roster enumerable by anyone holding the
 * URL. See cahier §16 and the warning in
 * `supabase/migrations/README-step-2.md`.
 *
 * ── Why the wedding id is resolved server-side, every time ───────────────────
 * No action here takes a `weddingId` from the caller. Each one takes the
 * public `slug` and resolves it itself through `sites`, whose anon policy only
 * exposes weddings that actually enabled the day-of module. A client that
 * invented a wedding id could otherwise aim these reads at a wedding it has
 * never seen — which is exactly the defect that was fixed in
 * `invitation-submissions.ts`.
 */

/* ------------------------------------------------------------------ *
 * Shapes returned to the page
 * ------------------------------------------------------------------ */

/** The four columns `search_guest_table` returns, and nothing else. */
export type TableMatch = {
  firstName: string;
  lastName: string;
  tableName: string;
  seatsLabel: string | null;
};

export type GuestPageEvent = {
  key: string;
  name: string;
  date: string | null;
  time: string | null;
  address: string | null;
  description: string | null;
  dressCode: string | null;
};

export type GuestPageMenuCategory = {
  id: string;
  key: MenuCategoryKey;
  items: { id: string; name: string; description: string | null }[];
};

export type GuestPageSettings = {
  weddingId: string;
  galleryVisibleToGuests: boolean;
  /** ISO timestamp, or null when the couple never opened a window. */
  uploadsOpenUntil: string | null;
  afterWeddingMode: boolean;
  venuePlanUrl: string | null;
};

export type GuestPageData = {
  settings: GuestPageSettings;
  /** From `get_couple_display_names`; null when the profile has no name set. */
  coupleNames: { first: string | null; partner: string | null };
  events: GuestPageEvent[];
  menu: GuestPageMenuCategory[];
};

/* ------------------------------------------------------------------ *
 * Slug resolution
 * ------------------------------------------------------------------ */

/**
 * `slug` → `wedding_id`, plus the day-of settings the whole page depends on.
 *
 * Returns null in three cases the caller must treat identically (a 404):
 * the slug matches nothing, the wedding never enabled the day-of module, or
 * it disabled it again. The distinction is deliberately invisible from
 * outside — the anon policies on `sites` and `day_of_settings` are both gated
 * on `enabled = true`, so a wedding that has not switched the module on is
 * indistinguishable from one that does not exist. Telling the two apart would
 * turn this page into an oracle for "does this couple exist".
 */
export async function resolveGuestPage(
  slug: string,
): Promise<GuestPageSettings | null> {
  if (!slug || slug.length > 120) return null;

  const supabase = await createClient();

  const { data: site } = await supabase
    .from("sites")
    .select("wedding_id")
    .eq("slug", slug)
    .maybeSingle();

  if (!site?.wedding_id) return null;

  const weddingId = site.wedding_id as string;

  // The anon policy on `day_of_settings` is `using (enabled = true)`, so a
  // disabled module yields no row at all rather than a row saying `false`.
  // Filtering on `enabled` as well is redundant against that policy and kept
  // on purpose: a policy changed by mistake must not be enough to render a
  // page the couple has switched off.
  const { data: settings } = await supabase
    .from("day_of_settings")
    .select(
      "enabled, gallery_visible_to_guests, uploads_open_until, after_wedding_mode, venue_plan_url",
    )
    .eq("wedding_id", weddingId)
    .eq("enabled", true)
    .maybeSingle();

  if (!settings) return null;

  return {
    weddingId,
    galleryVisibleToGuests: settings.gallery_visible_to_guests === true,
    uploadsOpenUntil: (settings.uploads_open_until as string | null) ?? null,
    afterWeddingMode: settings.after_wedding_mode === true,
    venuePlanUrl: (settings.venue_plan_url as string | null) ?? null,
  };
}

/* ------------------------------------------------------------------ *
 * The guest search — the one narrow hole into the guest list
 * ------------------------------------------------------------------ */

/**
 * The anonymous guest page's only route into the guest list.
 *
 * This calls `search_guest_table`, a security-definer RPC that enforces the
 * 2-character minimum, the 5-row cap, the confirmed+seated filter and a
 * four-column result. `guests` has no anon select policy and must never get
 * one — see cahier §16 and the warning in
 * `supabase/migrations/README-step-2.md`.
 *
 * The client-side 2-character check in `TableFinder` is feedback, not
 * enforcement: it exists so the input can say "encore une lettre…" rather
 * than sitting silent. The early return below is likewise only there to save
 * a round trip. Neither is what protects the roster — the RPC is, and it
 * would refuse a hand-crafted single-character call just the same.
 *
 * Returns an empty array on any failure. A guest looking for their table
 * cannot act on a database error message, and reflecting one back would tell
 * a prober which slugs and queries reach the database.
 */
export async function searchMyTable(
  slug: string,
  query: string,
): Promise<TableMatch[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  // Nobody types a name this long; refusing early keeps a pathological
  // payload out of the RPC's LIKE pattern.
  if (trimmed.length > 80) return [];

  const page = await resolveGuestPage(slug);
  if (!page) return [];

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("search_guest_table", {
    p_wedding_id: page.weddingId,
    p_query: trimmed,
  });

  if (error || !data) return [];

  return (data as Record<string, string | null>[]).map((row) => ({
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    tableName: row.table_name ?? "",
    seatsLabel: row.seats_label ?? null,
  }));
}

/* ------------------------------------------------------------------ *
 * The rest of the page
 * ------------------------------------------------------------------ */

/**
 * Everything the guest page renders besides the table search: the couple's
 * names, the enabled events, and the enabled menu.
 *
 * Nothing here is nominative. The names come from
 * `get_couple_display_names`, a security-definer RPC returning only
 * `profiles.first_name` and `profiles.partner_name` for a wedding whose
 * day-of module is enabled — `profiles` also carries `stripe_customer_id`
 * and stays closed to anon. Disabled events and disabled menu categories are
 * filtered out by their own anon policies; the explicit `.eq("enabled", true)`
 * below repeats that filter rather than trusting it alone.
 */
export async function getGuestPageData(
  slug: string,
): Promise<GuestPageData | null> {
  const settings = await resolveGuestPage(slug);
  if (!settings) return null;

  const supabase = await createClient();
  const { weddingId } = settings;

  const [namesRes, eventsRes, menuRes] = await Promise.all([
    supabase.rpc("get_couple_display_names", { p_wedding_id: weddingId }),
    supabase
      .from("events")
      .select("key, name, date, time, address, description, dress_code")
      .eq("wedding_id", weddingId)
      .eq("enabled", true)
      .order("position", { ascending: true }),
    supabase
      .from("menu_categories")
      .select(
        "id, key, position, menu_items(id, name, description, position)",
      )
      .eq("wedding_id", weddingId)
      .eq("enabled", true)
      .order("position", { ascending: true }),
  ]);

  const nameRow = (namesRes.data as
    | { first_name: string | null; partner_name: string | null }[]
    | null)?.[0];

  const events: GuestPageEvent[] = (eventsRes.data ?? []).map((e) => ({
    key: e.key as string,
    name: e.name as string,
    date: (e.date as string | null) ?? null,
    time: (e.time as string | null) ?? null,
    address: (e.address as string | null) ?? null,
    description: (e.description as string | null) ?? null,
    dressCode: (e.dress_code as string | null) ?? null,
  }));

  type MenuItemRow = {
    id: string;
    name: string;
    description: string | null;
    position: number | null;
  };

  const menu: GuestPageMenuCategory[] = (menuRes.data ?? []).map((c) => ({
    id: c.id as string,
    key: c.key as MenuCategoryKey,
    // PostgREST does not order an embedded resource by the parent's
    // `.order()`, so the items are sorted here.
    items: (((c.menu_items ?? []) as unknown) as MenuItemRow[])
      .slice()
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((i) => ({
        id: i.id,
        name: i.name,
        description: i.description ?? null,
      })),
  }));

  return {
    settings,
    coupleNames: {
      first: nameRow?.first_name ?? null,
      partner: nameRow?.partner_name ?? null,
    },
    events,
    menu,
  };
}

/* ------------------------------------------------------------------ *
 * The shared gallery
 * ------------------------------------------------------------------ */

const GUEST_MEDIA_BUCKET = "guest-media";


export type GuestPageMedia = {
  id: string;
  kind: "photo" | "video";
  url: string;
  thumbUrl: string;
  uploadedAt: string;
};

/** How many tiles the guest grid shows. A phone does not scroll a roll of 400. */
const GALLERY_LIMIT = 60;

/**
 * The photos and videos guests may browse — visible ones only.
 *
 * `visibleMedia()` lives in the dashboard's projections, where it documents
 * the rule; the same rule is applied here as a `hidden = false` filter in the
 * query itself rather than after the fetch. Filtering in the database means a
 * hidden row never travels to this process at all, let alone to the browser.
 * The dashboard deliberately fetches hidden rows (a screen that cannot see
 * what it hid cannot unhide it); the guest page must not, and this is the
 * guest side.
 *
 * The anon select policy on `guest_media` already requires
 * `hidden = false` AND `gallery_visible_to_guests = true`. Both are repeated
 * here for the same reason as everywhere else in this file: a policy changed
 * by mistake must not be enough to show a guest something the couple hid.
 */
export async function listGuestGallery(slug: string): Promise<GuestPageMedia[]> {
  const page = await resolveGuestPage(slug);
  if (!page || !page.galleryVisibleToGuests) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("guest_media")
    .select("id, kind, storage_path, thumb_path, created_at")
    .eq("wedding_id", page.weddingId)
    .eq("hidden", false)
    .order("created_at", { ascending: false })
    .limit(GALLERY_LIMIT);

  if (error || !data) return [];

  // `guest-media` is a public bucket (see 20260902140000_guest_media_storage.sql),
  // so a public URL is the right call here: signing would gain nothing an
  // anonymous guest cannot already reach, and would expire mid-party.
  return data.map((row) => {
    const storagePath = row.storage_path as string;
    const thumbPath = (row.thumb_path as string | null) ?? storagePath;
    return {
      id: row.id as string,
      kind: row.kind as "photo" | "video",
      url: supabase.storage.from(GUEST_MEDIA_BUCKET).getPublicUrl(storagePath)
        .data.publicUrl,
      thumbUrl: supabase.storage
        .from(GUEST_MEDIA_BUCKET)
        .getPublicUrl(thumbPath).data.publicUrl,
      uploadedAt: row.created_at as string,
    };
  });
}

/* ------------------------------------------------------------------ *
 * Guest uploads
 * ------------------------------------------------------------------ */

/** Mirrors the bucket's own `allowed_mime_types`, so a refusal is legible. */
const ALLOWED_MIME = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

/** Mirrors the bucket's 100MB `file_size_limit`. */
const MAX_UPLOAD_BYTES = 104857600;

/** One phone, one gesture. Beyond this it is not a guest sharing photos. */
const MAX_FILES_PER_CALL = 10;

export type UploadResult =
  | { success: true; uploaded: number }
  | { success: false; error: string };

/**
 * Stores a guest's photos and videos.
 *
 * The upload window is enforced by the database, twice over: the anon insert
 * policy on `guest_media` and the matching policy on `storage.objects` both
 * require `uploads_open_until > now()`. So a closed window fails at the
 * database even if this action's own pre-flight check were removed. That
 * check exists to turn the resulting raw RLS violation into a sentence a
 * guest can read ("les envois sont clos") instead of a policy error.
 *
 * The object path is `<wedding_id>/<random>.<ext>`, matching the
 * `storage.foldername(name)[1]` convention every bucket policy in this
 * schema relies on. The wedding id comes from resolving the slug here, never
 * from the caller — a guest cannot aim an upload at another wedding's folder.
 *
 * The original filename is discarded rather than sanitised. Phone filenames
 * carry no value to the couple and can carry a name or a location; a random
 * id cannot.
 */
export async function uploadGuestMedia(
  slug: string,
  formData: FormData,
): Promise<UploadResult> {
  const page = await resolveGuestPage(slug);
  if (!page) return { success: false, error: "Page introuvable." };

  const openUntil = page.uploadsOpenUntil
    ? new Date(page.uploadsOpenUntil).getTime()
    : null;
  if (!openUntil || Number.isNaN(openUntil) || openUntil <= Date.now()) {
    return {
      success: false,
      error: "Les envois sont clos. Merci d'avoir partagé cette journée !",
    };
  }

  const files = formData
    .getAll("files")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) {
    return { success: false, error: "Aucun fichier sélectionné." };
  }
  if (files.length > MAX_FILES_PER_CALL) {
    return {
      success: false,
      error: `Merci d'envoyer au maximum ${MAX_FILES_PER_CALL} fichiers à la fois.`,
    };
  }

  const rawName = formData.get("uploaderName");
  const uploaderName =
    typeof rawName === "string" && rawName.trim().length > 0
      ? rawName.trim().slice(0, 60)
      : null;

  const supabase = await createClient();
  let uploaded = 0;

  for (const file of files) {
    if (!(ALLOWED_MIME as readonly string[]).includes(file.type)) {
      return {
        success: false,
        error: "Format non pris en charge. Envoyez des photos ou des vidéos.",
      };
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return {
        success: false,
        error: "Fichier trop volumineux (100 Mo maximum).",
      };
    }

    const kind = file.type.startsWith("video/") ? "video" : "photo";
    const extension = file.type.split("/")[1]?.replace("quicktime", "mov") ?? "bin";
    const path = `${page.weddingId}/${crypto.randomUUID()}.${extension}`;

    const { error: storageError } = await supabase.storage
      .from(GUEST_MEDIA_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (storageError) {
      console.error("Guest media upload failed:", storageError.message);
      return {
        success: false,
        error:
          uploaded > 0
            ? `${uploaded} fichier(s) envoyé(s), puis l'envoi a échoué. Réessayez.`
            : "L'envoi a échoué. Vérifiez votre connexion et réessayez.",
      };
    }

    const { error: rowError } = await supabase.from("guest_media").insert({
      wedding_id: page.weddingId,
      kind,
      storage_path: path,
      uploader_name: uploaderName,
    });

    if (rowError) {
      // The object landed but the row did not, so the couple would never see
      // it. Remove the orphan rather than leaving a billable, unreferenced
      // file in the bucket.
      await supabase.storage.from(GUEST_MEDIA_BUCKET).remove([path]);
      console.error("Guest media row insert failed:", rowError.message);
      return {
        success: false,
        error: "L'envoi a échoué. Réessayez dans un instant.",
      };
    }

    uploaded += 1;
  }

  return { success: true, uploaded };
}
