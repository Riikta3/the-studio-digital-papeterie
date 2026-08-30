"use client";

import { type FormEvent, useState } from "react";

import type { InvitationData } from "../../types";

import { Page } from "./Page";

/**
 * Carpooling between guests.
 *
 * DEMO BEHAVIOUR: submitting only flips to the confirmation state — nothing is
 * persisted, exactly as in the source. Every input carries a `name` regardless,
 * so wiring a server action later is a matter of reading the FormData.
 */
export function CarpoolSection({
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
    <Page className="soft-floral-paper module-page" side={side}>
      <p className="script">On fait la route ensemble ?</p>
      <h2>Covoiturage</h2>
      <p className="intro">Proposez une place ou trouvez un trajet parmi les invités.</p>

      {sent ? (
        <div className="success">
          <p>Votre trajet a bien été ajouté.</p>
        </div>
      ) : (
        <form className="module-form" onSubmit={handleSubmit}>
          <div className="choice-row">
            <label>
              <input type="radio" name="rideMode" value="offer" defaultChecked /> Je propose
            </label>
            <label>
              <input type="radio" name="rideMode" value="search" /> Je recherche
            </label>
          </div>
          <input required name="departureCity" placeholder="Ville de départ" />
          <div className="field-row">
            <input type="date" name="rideDate" aria-label="Date du trajet" />
            <input name="seats" placeholder="Places disponibles" inputMode="numeric" />
          </div>
          {/* Carried so the future server binding knows which wedding this
              ride belongs to without a second lookup. */}
          <input type="hidden" name="weddingStartsAt" value={data.event.startsAt} />
          <button className="button" type="submit">
            Publier mon trajet
          </button>
        </form>
      )}
    </Page>
  );
}
