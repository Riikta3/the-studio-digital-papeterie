"use client";

import { type FormEvent, useState } from "react";

import type { InvitationData } from "../../types";

/**
 * Participative playlist, inside the green engraved plate.
 *
 * DEMO BEHAVIOUR: a suggestion is appended to local state and nothing is
 * persisted, exactly as in the source. Wiring this to Supabase belongs to the
 * dynamic phase; the input carries a `name` so a server action can read it from
 * FormData when it arrives.
 *
 * The source collected "Titre — Artiste" as one string and the shared
 * `PlaylistSuggestion` type wants `{ title, artist }`, so the seed list is
 * joined for display rather than the pair being flattened into the data.
 */
export function PlaylistSection({ data }: { data: InvitationData }) {
  const seed = (data.playlist ?? []).map((track) => `${track.title} — ${track.artist}`);

  const [songs, setSongs] = useState<string[]>(seed);
  const [value, setValue] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const suggestion = value.trim();
    if (!suggestion) return;
    setSongs((current) => [...current, suggestion]);
    setValue("");
  }

  return (
    <section className="panel playlist playlist-framed">
      <div className="playlist-content">
        <p className="eyebrow">La musique</p>
        <h2>Playlist participative</h2>
        {data.copy?.playlistIntro ? <p>{data.copy.playlistIntro}</p> : null}

        <form className="input" onSubmit={handleSubmit}>
          <input
            name="suggestion"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Titre — Artiste"
            aria-label="Votre suggestion"
          />
          <button type="submit">Ajouter</button>
        </form>

        {songs.length > 0 ? (
          <>
            <h3>Déjà proposés</h3>
            <ul>
              {songs.map((song, index) => (
                <li key={`${song}-${index}`}>{song}</li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </section>
  );
}
