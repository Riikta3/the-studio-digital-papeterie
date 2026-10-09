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
  // The id stays "studio-default": it is what `settings.music_track` holds
  // for every couple who never chose. Its file is now one of the studio's own.
  { id: "studio-default", title: "Invitation", artist: "The Studio", file: "invitation.mp3" },
  { id: "ceremonie", title: "Cérémonie", artist: "The Studio", file: "ceremonie.mp3" },
  { id: "le-grand-jour", title: "Le grand jour", artist: "The Studio", file: "le-grand-jour.mp3" },
  { id: "musique-de-mariage", title: "Musique de mariage", artist: "The Studio", file: "musique-de-mariage.mp3" },
  { id: "anniversaire", title: "Anniversaire", artist: "The Studio", file: "anniversaire.mp3" },
  { id: "ambiance", title: "Ambiance", artist: "The Studio", file: "ambiance.mp3" },
  { id: "bande-annonce", title: "Bande-annonce", artist: "The Studio", file: "bande-annonce.mp3" },
  { id: "premiere-danse", title: "Première danse", artist: "The Studio", file: "premiere-danse.mp3" },
  { id: "echange-des-voeux", title: "Échange des vœux", artist: "The Studio", file: "echange-des-voeux.mp3" },
];

export const DEFAULT_MUSIC_TRACK_ID = "studio-default";

/**
 * The track each theme's demo plays, always the same one, so a prospect
 * hears a theme with its own music. A theme missing here plays the default;
 * `theme-catalogue.test.mjs` fails until every theme has its track.
 */
export const THEME_DEMO_TRACKS: Readonly<Record<string, string>> = {
  "ciao-amore": "anniversaire",
  "blanc-couture": "ceremonie",
  "belle-rive": "ambiance",
  "mare-alta": "premiere-danse",
  "chateau-royal": "echange-des-voeux",
  "cabo-verde": "musique-de-mariage",
};

/** The library id a theme's demo plays. */
export function demoTrackFor(themeId: string): string {
  return THEME_DEMO_TRACKS[themeId] ?? DEFAULT_MUSIC_TRACK_ID;
}

export function findMusicTrack(id: string | null | undefined): MusicTrack | undefined {
  return id ? MUSIC_LIBRARY.find((track) => track.id === id) : undefined;
}
