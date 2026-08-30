"use client";

import { type FormEvent, useState } from "react";

import type { InvitationData } from "../../types";

/**
 * Participative playlist.
 *
 * DEMO BEHAVIOUR: submitting only flips to the thank-you state — nothing is
 * persisted, exactly as in the source project. Wiring this to Supabase
 * (`playlist_suggestions`) is part of the dynamic phase, not the demo.
 *
 * The source collected "Titre — Artiste" in one field while every integration
 * contract expects `{ title, artist }` separately; the split is done here so
 * the server side has the shape it needs when it arrives.
 */
export function PlaylistSection({ data }: { data: InvitationData }) {
  const [sent, setSent] = useState(false);
  const [value, setValue] = useState("");

  const suggestions = data.playlist ?? [];

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSent(true);
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
            <button type="submit">Ajouter à la playlist</button>
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
