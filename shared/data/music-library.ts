/**
 * The studio's music library: the tracks a couple who bought the
 * `custom-music` option can put on their invitation, and the one that plays
 * until they choose (docs/superpowers/specs/2026-10-02-invitation-music-design.md, D3).
 *
 * Code rather than a table: the list changes rarely, and a change is a commit
 * plus an upload of the file to `library/<file>` in the `music` bucket.
 * Removing a track is safe — a couple who had chosen it falls back to the
 * default (`resolveMusicSource`), never to silence.
 */
export type MusicTrack = {
  /** Stored in `settings.music_track`. Never reuse an id for another song. */
  id: string;
  title: string;
  artist: string;
  /** Object name under `library/` in the `music` bucket. */
  file: string;
};

export const MUSIC_LIBRARY: readonly MusicTrack[] = [
  {
    id: "studio-default",
    title: "Ambiance The Studio",
    artist: "The Studio",
    file: "studio-default.mp3",
  },
];

export const DEFAULT_MUSIC_TRACK_ID = "studio-default";

export function findMusicTrack(id: string | null | undefined): MusicTrack | undefined {
  return id ? MUSIC_LIBRARY.find((track) => track.id === id) : undefined;
}
