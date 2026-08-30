"use client";

import { type FormEvent, useState } from "react";

import { formatFrenchDate } from "../../format";
import type { InvitationData } from "../../types";

import { Page, splitMonogram } from "./Page";

/**
 * RSVP form.
 *
 * DEMO BEHAVIOUR: submitting only flips to the thank-you state — nothing is
 * persisted. The real flow (`rsvp_responses` + guest identification) belongs to
 * the dynamic phase; every field carries a `name` so wiring a server action
 * later is a matter of reading the FormData.
 *
 * The welcome-dinner and brunch questions are gated on the `rsvp` flags rather
 * than always rendered: they are specific to weddings that run a three-day
 * programme, and asking a guest about a brunch that does not exist is worse
 * than not asking.
 */
export function RsvpSection({ data, side }: { data: InvitationData; side: "left" | "right" }) {
  const [sent, setSent] = useState(false);
  const [guestCount, setGuestCount] = useState("1");

  const rsvp = data.rsvp;
  const [first, second] = splitMonogram(data.couple.monogram);

  // The source printed the deadline as prose. Formatting it from the ISO date
  // keeps "30 janvier" and "1er février" both correct.
  const deadline = formatFrenchDate(data.event.rsvpDeadline);
  const note = deadline ? `Merci de répondre avant le ${deadline}` : data.copy?.rsvpNote;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSent(true);
  }

  return (
    <Page className="soft-floral-paper rsvp-page" side={side}>
      <p className="script">RSVP</p>
      <h2>
        Serez-vous
        <br />
        des nôtres ?
      </h2>

      {sent ? (
        <div className="success">
          <span>
            {first} · {second}
          </span>
          <p>Merci. Votre réponse a bien été enregistrée.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <input required name="fullName" placeholder="Prénom et nom" />

          <select required name="attendance" defaultValue="">
            <option value="" disabled>
              Serez-vous présent ?
            </option>
            <option value="yes">Accepte avec joie</option>
            <option value="no">Décline avec regret</option>
          </select>

          {rsvp?.allowPartner ? (
            <>
              <select
                name="guestCount"
                value={guestCount}
                onChange={(event) => setGuestCount(event.target.value)}
                aria-label="Nombre de participants"
              >
                <option value="1">Je viens seul(e)</option>
                <option value="2">Je viens avec un +1</option>
              </select>
              {guestCount === "2" ? (
                <input required name="partnerName" placeholder="Prénom et nom de votre +1" />
              ) : null}
            </>
          ) : null}

          {rsvp?.collectWelcomeDinner ? (
            <select required name="welcomeDinner" defaultValue="">
              <option value="" disabled>
                Présent au welcome dinner de la veille ?
              </option>
              <option value="yes">Oui, avec plaisir</option>
              <option value="no">Non</option>
            </select>
          ) : null}

          {rsvp?.collectBrunch ? (
            <select required name="brunch" defaultValue="">
              <option value="" disabled>
                Présent au brunch du lendemain ?
              </option>
              <option value="yes">Oui, avec plaisir</option>
              <option value="no">Non</option>
            </select>
          ) : null}

          {rsvp?.dietaryOptions?.length ? (
            <select name="dietary" defaultValue="">
              <option value="" disabled>
                Régime alimentaire
              </option>
              {rsvp.dietaryOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          ) : (
            <input name="dietary" placeholder="Régime alimentaire" />
          )}

          {rsvp?.collectMessage ? (
            <textarea name="message" placeholder="Un petit mot…" />
          ) : null}

          <button className="button" type="submit">
            Envoyer ma réponse
          </button>
        </form>
      )}

      {note ? <p className="note">{note}</p> : null}
    </Page>
  );
}
