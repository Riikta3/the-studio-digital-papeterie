import type { PlaylistSubmission } from "@/actions/invitation-submissions";

/**
 * A guest's playlist suggestion: which tracks they have picked, and what is
 * sent. Extracted from `ciao-amore/sections/PlaylistSection.tsx`, which keeps
 * its own copy; pure so the rules can be tested without a browser.
 */

/** Matches the payload `/api/spotify/search` returns. */
export type SpotifyResult = {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  uri: string;
  spotifyUrl: string | null;
};

/** A guest may propose up to three titles in one submission. */
export const MAX_TRACKS = 3;
/** Spotify's own minimum; below it the route answers an empty list anyway. */
export const MIN_QUERY = 2;
/** Long enough to feel instant, long enough not to fire on every keystroke. */
export const DEBOUNCE_MS = 350;

/**
 * Adds a pick. Returns the same array when nothing changes — a duplicate, or a
 * full selection — so a caller can skip a state update.
 *
 * Spotify can return the same track twice across queries; the dashboard keys
 * statuses by track id, so a duplicate would collide there.
 */
export function addTrack(
  selected: readonly SpotifyResult[],
  track: SpotifyResult,
): readonly SpotifyResult[] {
  if (selected.length >= MAX_TRACKS) return selected;
  if (selected.some((existing) => existing.id === track.id)) return selected;
  return [...selected, track];
}

export function removeTrack(
  selected: readonly SpotifyResult[],
  id: string,
): readonly SpotifyResult[] {
  return selected.filter((track) => track.id !== id);
}

export function toPlaylistSubmission(
  weddingId: string,
  selected: readonly SpotifyResult[],
): PlaylistSubmission {
  return {
    weddingId,
    // The action already accepts an array and bounds it at 20 server-side.
    tracks: selected.map((track) => ({
      id: track.id,
      title: track.title,
      artist: track.artist,
      coverUrl: track.coverUrl,
      ...(track.spotifyUrl ? { spotifyUrl: track.spotifyUrl } : {}),
    })),
  };
}

/** No searching once the selection is full or the form was sent: there is
 *  nothing left to pick, so the request would be wasted. */
export function isSearchable(
  query: string,
  state: { sent: boolean; full: boolean },
): boolean {
  return query.trim().length >= MIN_QUERY && !state.sent && !state.full;
}
