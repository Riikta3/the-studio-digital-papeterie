"use client";

import { type FormEvent, useState } from "react";

import { submitPlaylistSuggestions } from "@/actions/invitation-submissions";
import type { InvitationData } from "../../types";

/**
 * Participative playlist.
 *
 * Two modes, decided by `data.weddingId` (see `themes/types.ts`):
 *   - with an id  → the suggestion is persisted into `playlist_suggestions`;
 *   - without one → demo. The handler returns before calling the action, so
 *                   the public showcase writes nothing.
 *
 * The field collects "Titre — Artiste" in one input while the table (and the
 * dashboard that reads it) expects `{ id, title, artist, coverUrl }`; the split
 * happens here and the server action mints the id, so the status map the
 * dashboard keys by track id always has something to key on.
 */

/** Splits "Titre — Artiste" on the first em/en dash or hyphen separator. */
function splitSuggestion(raw: string): { title: string; artist: string } {
  const match = raw.match(/^(.*?)\s+[—–-]\s+(.*)$/);
  if (match) return { title: match[1].trim(), artist: match[2].trim() };
  return { title: raw.trim(), artist: "" };
}

export function PlaylistSection({ data }: { data: InvitationData }) {
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [value, setValue] = useState("");

  const suggestions = data.playlist ?? [];
  const weddingId = data.weddingId;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;

    // Demo: no wedding to attach the suggestion to. Confirm locally, persist
    // nothing.
    if (!weddingId) {
      setSent(true);
      return;
    }

    const { title, artist } = splitSuggestion(value);
    if (!title) {
      setError("Merci d'indiquer un titre.");
      return;
    }

    setPending(true);
    setError(null);

    const result = await submitPlaylistSuggestions({
      weddingId,
      tracks: [{ title, artist }],
    });

    setPending(false);

    if (result.ok) setSent(true);
    else setError(result.error);
  }

  return (
    <section className="playlist-section">
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative, positioned by CSS. */}
      <img
        className="decor decor-spritz-playlist"
        src="/themes/ciao-amore/decor/spritz.webp"
        alt=""
        aria-hidden="true"
        loading="lazy"
      />
      <span className="vinyl" aria-hidden="true" />
      <div>
        <p className="eyebrow">La musique de notre week-end</p>
        <h2>
          Playlist
          <br />
          participative
        </h2>
        {data.copy?.playlistIntro ? <p>{data.copy.playlistIntro}</p> : null}

        {sent ? (
          <p className="success">Grazie ! Votre titre a bien été proposé.</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>
              Votre suggestion
              <input
                required
                name="suggestion"
                placeholder="Titre — Artiste"
                value={value}
                onChange={(event) => setValue(event.target.value)}
              />
            </label>
            {error ? <p role="alert">{error}</p> : null}
            <button type="submit" disabled={pending}>
              {pending ? "Envoi…" : "Ajouter à la playlist"}
            </button>
          </form>
        )}

        {suggestions.length > 0 ? (
          <div className="songs">
            {suggestions.map((track) => (
              <span key={`${track.title}-${track.artist}`}>{track.title}</span>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
