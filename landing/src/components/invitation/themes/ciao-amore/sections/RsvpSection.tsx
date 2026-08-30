"use client";

import { type FormEvent, useState } from "react";

import { formatFrenchDate } from "../../format";
import type { InvitationData } from "../../types";

/**
 * RSVP form.
 *
 * DEMO BEHAVIOUR: submitting only flips to the thank-you state — nothing is
 * persisted. The real flow (`rsvp_responses` + guest identification) belongs to
 * the dynamic phase. Inputs carry `name` attributes regardless, so wiring a
 * server action later is a matter of reading the FormData.
 */
export function RsvpSection({ data }: { data: InvitationData }) {
  const [sent, setSent] = useState(false);
  const [partyMode, setPartyMode] = useState<"solo" | "partner">("solo");

  const rsvp = data.rsvp;
  const deadline = formatFrenchDate(data.event.rsvpDeadline);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSent(true);
  }

  return (
    <section className="rsvp-section">
      <span className="rsvp-sun" aria-hidden="true" />
      <div className="rsvp-card">
        {deadline ? <p className="eyebrow">Réponse souhaitée avant le {deadline}</p> : null}
        <h2>
          Serez-vous
          <br />
          des nôtres ?
        </h2>

        {sent ? (
          <div className="thanks">
            <span>♡</span>
            <h3>Merci !</h3>
            <p>Votre réponse a bien été prise en compte.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>
              Votre nom
              <input required name="fullName" placeholder="Prénom et nom" />
            </label>

            <fieldset>
              <legend>Présence</legend>
              <label>
                <input type="radio" name="attendance" value="yes" required /> Oui, avec grand
                plaisir
              </label>
              <label>
                <input type="radio" name="attendance" value="no" /> Non, mais je penserai fort à
                vous
              </label>
            </fieldset>

            {rsvp?.allowPartner ? (
              <>
                <label>
                  Qui sera présent ?
                  <select
                    name="partyMode"
                    value={partyMode}
                    onChange={(event) =>
                      setPartyMode(event.target.value === "partner" ? "partner" : "solo")
                    }
                  >
                    <option value="solo">Moi uniquement</option>
                    <option value="partner">Moi + mon/ma partenaire</option>
                  </select>
                </label>
                {partyMode === "partner" ? (
                  <label className="partner-field">
                    Nom de votre partenaire
                    <input required name="partnerName" placeholder="Prénom et nom" />
                  </label>
                ) : null}
              </>
            ) : null}

            {rsvp?.dietaryOptions?.length ? (
              <label>
                Restrictions alimentaires
                <select name="dietary">
                  {rsvp.dietaryOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
            ) : null}

            {rsvp?.collectMessage ? (
              <label>
                Un petit mot
                <textarea name="message" placeholder="Votre message…" />
              </label>
            ) : null}

            <button type="submit">Envoyer ma réponse</button>
          </form>
        )}
      </div>
    </section>
  );
}
