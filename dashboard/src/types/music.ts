/** What the « Musique » screen shows (docs/superpowers/specs/2026-10-02-invitation-music-design.md, D7). */
export type MusicLibraryItem = {
  id: string;
  title: string;
  artist: string;
  url: string;
  isDefault: boolean;
};

export type MusicSettingsView =
  | { included: false }
  | {
      included: true;
      enabled: boolean;
      /** The library choice; the default when none was made or it was removed. */
      trackId: string;
      /** The couple's own file, which plays instead of `trackId` when set. */
      upload: { name: string; url: string } | null;
      library: MusicLibraryItem[];
    };

export type MusicUploadTicket =
  | { success: true; path: string; token: string; contentType: string }
  | { success: false; error: string };
