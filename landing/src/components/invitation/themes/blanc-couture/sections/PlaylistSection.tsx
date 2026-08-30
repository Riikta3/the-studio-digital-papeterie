"use client";

import { type FormEvent, useState } from "react";

import type { InvitationData } from "../../types";

import { Page } from "./Page";

/**
 * Participative playlist.
 *
 * DEMO BEHAVIOUR: submitting only flips to the confirmation state — nothing is
 * persisted. The source already collected title and artist as separate fields,
 * which is the shape `PlaylistSuggestion` expects, so the names map straight
 * across when this is wired up.
 */
export function PlaylistSection({
  data,
  side,
}: {
  data: InvitationData;
  side: "left" | "right";
}) {
  const [sent, setSent] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSent(true);
  }

  return (
    <Page className="playlist-paper module-page" side={side}>
      <p className="script">Notre bande-son</p>
      <h2>
        Playlist
        <br />
        participative
      </h2>
      {data.copy?.playlistIntro ? <p className="intro">{data.copy.playlistIntro}</p> : null}

      {sent ? (
        <div className="success">
          <p>Votre morceau rejoint la sélection.</p>
        </div>
      ) : (
        <form className="module-form playlist-form" onSubmit={handleSubmit}>
          <input required name="title" placeholder="Titre du morceau" />
          <input required name="artist" placeholder="Artiste" />
          <button className="playlist-submit" type="submit">
            Proposer ce morceau
          </button>
        </form>
      )}
    </Page>
  );
}
