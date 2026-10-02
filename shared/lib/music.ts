import { DEFAULT_MUSIC_TRACK_ID, findMusicTrack } from "../data/music-library";

/**
 * Everything both apps need to agree on about the invitation music
 * (docs/superpowers/specs/2026-10-02-invitation-music-design.md, D1–D4):
 * which file plays, where files live, and what an upload may be.
 */

/** The checkout extra that unlocks the music (`EXTRA_PRICES` in ./pricing). */
export const MUSIC_OPTION_ID = "custom-music";

export const MUSIC_BUCKET = "music";

/** The bucket's `file_size_limit` (migration 20261002150000). */
export const MAX_MUSIC_BYTES = 15 * 1024 * 1024;

/**
 * Accepted extensions and the Content-Type each one is stored with.
 *
 * The extension decides, not the browser's `file.type`: for the same `.m4a`
 * Chrome says `audio/x-m4a`, Safari `audio/mp4`, and some browsers say
 * nothing at all. MP3 and M4A/AAC are what every phone plays, Safari iOS
 * included.
 */
const CONTENT_TYPES: Record<string, string> = {
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  aac: "audio/aac",
};

/** The three music columns as `resolve_public_slug` returns them. */
export type MusicRow = {
  music_enabled: boolean | null;
  music_track: string | null;
  music_upload_path: string | null;
};

/** Object name of a library track in the bucket. */
export function libraryTrackPath(file: string): string {
  return `library/${file}`;
}

/** Public URL of an object in the `music` bucket — a public bucket, so no signing. */
export function musicPublicUrl(supabaseUrl: string, path: string): string {
  const base = supabaseUrl.replace(/\/+$/, "");
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/${MUSIC_BUCKET}/${encoded}`;
}

/**
 * What an invitation plays.
 *
 * The database already blanked the row (`music_enabled` false, both paths
 * null) when the site does not own the option or the couple switched it off,
 * so this only picks between the couple's upload, their library choice and the
 * default. An id the library no longer has plays the default rather than
 * nothing.
 */
export function resolveMusicSource(
  row: MusicRow | null | undefined,
  publicUrl: (path: string) => string,
): { src: string } | null {
  if (!row?.music_enabled) return null;
  if (row.music_upload_path) return { src: publicUrl(row.music_upload_path) };

  const track = findMusicTrack(row.music_track) ?? findMusicTrack(DEFAULT_MUSIC_TRACK_ID);
  return track ? { src: publicUrl(libraryTrackPath(track.file)) } : null;
}

export type MusicUploadCheck =
  | { ok: true; ext: string; contentType: string }
  | { ok: false; reason: "type" | "size" | "empty" };

/** Whether a file may become a couple's music, checked before any transfer. */
export function validateMusicUpload(file: { name: string; size: number }): MusicUploadCheck {
  const ext = extensionOf(file.name);
  const contentType = ext ? CONTENT_TYPES[ext] : undefined;
  if (!ext || !contentType) return { ok: false, reason: "type" };
  if (file.size <= 0) return { ok: false, reason: "empty" };
  if (file.size > MAX_MUSIC_BYTES) return { ok: false, reason: "size" };
  return { ok: true, ext, contentType };
}

function extensionOf(name: string): string | undefined {
  return /\.([a-z0-9]+)$/i.exec(name.trim())?.[1].toLowerCase();
}

/** "Notre chanson ❤️ (live).MP3" → "notre-chanson-live"; nothing Latin left → "musique". */
function safeBaseName(name: string): string {
  const slug = name
    .trim()
    .replace(/\.[a-z0-9]+$/i, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return slug || "musique";
}

/**
 * Where a couple's upload is stored: their own folder, a timestamp that makes
 * every upload a new object (no CDN serving yesterday's song under today's
 * name), and the original name, so the dashboard can show it back without a
 * column of its own. `fileName` must have passed `validateMusicUpload`.
 */
export function musicObjectName(weddingId: string, fileName: string, now: number): string {
  const ext = extensionOf(fileName) ?? "mp3";
  return `${weddingId}/${now}-${safeBaseName(fileName)}.${ext}`;
}

/** Exactly what `musicObjectName` writes after the folder. */
const OWN_OBJECT = /^\d+-[a-z0-9]+(?:-[a-z0-9]+)*\.(?:mp3|m4a|aac)$/;

/**
 * True when `path` is an upload this wedding's folder could hold — the only
 * kind of path the dashboard may record as a couple's music. Rejects other
 * folders, sub-folders, `..` and library objects.
 */
export function isOwnMusicPath(weddingId: string, path: string): boolean {
  const prefix = `${weddingId}/`;
  return path.startsWith(prefix) && OWN_OBJECT.test(path.slice(prefix.length));
}

/** "<wedding>/1727866000000-notre-chanson.mp3" → "notre-chanson.mp3". */
export function musicDisplayName(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1).replace(/^\d+-/, "");
}
