"use server";

import { revalidatePath } from "next/cache";

import { requireWedding } from "@/lib/db/current-wedding";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { ActionResult } from "@/types";
import type { MusicSettingsView, MusicUploadTicket } from "@/types/music";
import {
  DEFAULT_MUSIC_TRACK_ID,
  MUSIC_LIBRARY,
  findMusicTrack,
} from "@shared/data/music-library";
import {
  MUSIC_BUCKET,
  MUSIC_OPTION_ID,
  isOwnMusicPath,
  libraryTrackPath,
  musicDisplayName,
  musicObjectName,
  musicPublicUrl,
  validateMusicUpload,
} from "@shared/lib/music";

/**
 * The couple's invitation music
 * (docs/superpowers/specs/2026-10-02-invitation-music-design.md, D1, D7).
 *
 * Every write checks the `custom-music` option here, on the server, although
 * `resolve_public_slug` already refuses to play anything without it: a
 * screen that only hides its buttons is not a paywall.
 *
 * Storage writes use the service role — the `music` bucket has no policy for
 * couples — and only ever touch the folder named after the session's own
 * wedding.
 */

const LOCALES = ["fr", "en", "de", "es", "pt", "it", "ar", "zh", "ja"] as const;

const NOT_INCLUDED = "Option non incluse dans votre commande";
const SAVE_FAILED = "Erreur lors de l'enregistrement";
const UPLOAD_ERRORS = {
  type: "Format non supporté (MP3 ou M4A uniquement)",
  size: "Le fichier dépasse 15 Mo",
  empty: "Ce fichier est vide",
} as const;

function revalidateMusic() {
  for (const locale of LOCALES) revalidatePath(`/${locale}/musique`);
}

function publicUrl(path: string): string {
  return musicPublicUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", path);
}

/** The session's wedding, its client, and whether its site owns the option. */
async function loadMusicContext() {
  const { supabase, weddingId } = await requireWedding();
  const { data: site, error } = await supabase
    .from("sites")
    .select("extras")
    .eq("wedding_id", weddingId)
    .maybeSingle();
  if (error) throw new Error(error.message);

  return {
    supabase,
    weddingId,
    included: ((site?.extras as string[] | null) ?? []).includes(MUSIC_OPTION_ID),
  };
}

/**
 * For write actions called from the client: a missing session or a missing
 * option becomes the French `{ success: false }` the screen toasts, not a
 * throw (action-conventions.md).
 */
async function musicContextForWrite() {
  let context: Awaited<ReturnType<typeof loadMusicContext>>;
  try {
    context = await loadMusicContext();
  } catch {
    return { failure: { success: false, error: "Vous devez être connecté" } as const };
  }
  if (!context.included) return { failure: { success: false, error: NOT_INCLUDED } as const };
  return { ...context, failure: null };
}

/**
 * Removes every object in the couple's folder except `keep` — the file that
 * plays, if any. Runs after the row is written, so a failure here leaves an
 * unused file, never a row pointing at a deleted one; it is logged, not
 * reported to the couple.
 */
async function sweepMusicFolder(weddingId: string, keep: string | null) {
  const bucket = supabaseAdmin.storage.from(MUSIC_BUCKET);
  const { data: objects, error } = await bucket.list(weddingId, { limit: 100 });
  if (error) {
    console.error("[music] cannot list the couple's folder:", error.message);
    return;
  }
  const stale = (objects ?? [])
    .map((object) => `${weddingId}/${object.name}`)
    .filter((path) => path !== keep);
  if (stale.length === 0) return;

  const { error: removeError } = await bucket.remove(stale);
  if (removeError) console.error("[music] cannot remove old uploads:", removeError.message);
}

/** Read action for the page: throws on a real database error. */
export async function getMusicSettings(): Promise<MusicSettingsView> {
  const { supabase, weddingId, included } = await loadMusicContext();
  if (!included) return { included: false };

  const { data, error } = await supabase
    .from("settings")
    .select("music_enabled, music_track, music_upload_path")
    .eq("wedding_id", weddingId)
    .maybeSingle();
  if (error) throw new Error(error.message);

  const uploadPath = (data?.music_upload_path as string | null) ?? null;
  return {
    included: true,
    enabled: (data?.music_enabled as boolean | null) ?? true,
    trackId: findMusicTrack(data?.music_track as string | null)?.id ?? DEFAULT_MUSIC_TRACK_ID,
    upload: uploadPath
      ? { name: musicDisplayName(uploadPath), url: publicUrl(uploadPath) }
      : null,
    library: MUSIC_LIBRARY.map((track) => ({
      id: track.id,
      title: track.title,
      artist: track.artist,
      url: publicUrl(libraryTrackPath(track.file)),
      isDefault: track.id === DEFAULT_MUSIC_TRACK_ID,
    })),
  };
}

export async function setMusicEnabled(enabled: boolean): Promise<ActionResult> {
  const context = await musicContextForWrite();
  if (context.failure) return context.failure;

  const { error } = await context.supabase
    .from("settings")
    .update({ music_enabled: enabled })
    .eq("wedding_id", context.weddingId);
  if (error) return { success: false, error: SAVE_FAILED };

  revalidateMusic();
  return { success: true };
}

/** Picks a library track; the couple's own file, if any, is deleted. */
export async function chooseLibraryTrack(trackId: string): Promise<ActionResult> {
  const context = await musicContextForWrite();
  if (context.failure) return context.failure;

  const track = findMusicTrack(trackId);
  if (!track) return { success: false, error: "Morceau introuvable" };

  const { error } = await context.supabase
    .from("settings")
    .update({ music_track: track.id, music_upload_path: null })
    .eq("wedding_id", context.weddingId);
  if (error) return { success: false, error: SAVE_FAILED };

  await sweepMusicFolder(context.weddingId, null);
  revalidateMusic();
  return { success: true };
}

/**
 * First half of an upload: a signed URL the browser sends the file to.
 *
 * The file never passes through this server: Vercel refuses a function
 * request body over 4.5 MB whatever `bodySizeLimit` says, and a song is
 * typically 5-10 MB.
 */
export async function createMusicUploadUrl(file: {
  name: string;
  size: number;
}): Promise<MusicUploadTicket> {
  const context = await musicContextForWrite();
  if (context.failure) return context.failure;

  const check = validateMusicUpload(file);
  if (!check.ok) return { success: false, error: UPLOAD_ERRORS[check.reason] };

  const path = musicObjectName(context.weddingId, file.name, Date.now());
  const { data, error } = await supabaseAdmin.storage
    .from(MUSIC_BUCKET)
    .createSignedUploadUrl(path);
  if (error || !data) return { success: false, error: "Erreur lors de l'envoi" };

  return { success: true, path: data.path, token: data.token, contentType: check.contentType };
}

/** Second half: records the uploaded file as the couple's music. */
export async function confirmMusicUpload(path: string): Promise<ActionResult> {
  const context = await musicContextForWrite();
  if (context.failure) return context.failure;

  if (!isOwnMusicPath(context.weddingId, path)) {
    return { success: false, error: "Fichier introuvable" };
  }
  const name = path.slice(context.weddingId.length + 1);
  const { data: objects, error: listError } = await supabaseAdmin.storage
    .from(MUSIC_BUCKET)
    .list(context.weddingId, { search: name });
  if (listError || !(objects ?? []).some((object) => object.name === name)) {
    return { success: false, error: "Fichier introuvable" };
  }

  const { error } = await context.supabase
    .from("settings")
    .update({ music_upload_path: path })
    .eq("wedding_id", context.weddingId);
  if (error) return { success: false, error: SAVE_FAILED };

  await sweepMusicFolder(context.weddingId, path);
  revalidateMusic();
  return { success: true };
}
