"use client";

import { type FormEvent, useState } from "react";

import { formatFrenchDate } from "../../format";
import type { InvitationData } from "../../types";

/**
 * RSVP form.
 *
 * DEMO BEHAVIOUR: submitting only flips to the thank-you state — nothing is
 * persisted. The real flow (`rsvp_responses` plus guest identification) belongs
 * to the dynamic phase. Every input carries a `name` regardless, so wiring a
 * server action later is a matter of reading the FormData; the source left them
 * off entirely, which would have made its own fields unreadable.
 */
export function RsvpSection({ data }: { data: InvitationData }) {
  const [sent, setSent] = useState(false);
  const [attendance, setAttendance] = useState<"solo" | "partner">("solo");

  const rsvp = data.rsvp;
  const deadline = formatFrenchDate(data.event.rsvpDeadline);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSent(true);
  }

  return (
    <section className="panel rsvp pearled">
      <p className="eyebrow">RSVP</p>
      <h2>Serez-vous des nôtres ?</h2>
      <p>
        {data.copy?.rsvpIntro ?? "Nous serions honorés de vous compter parmi nous."}
        {deadline ? (
          <>
            {" "}
            Merci de confirmer votre présence avant le <b>{deadline}</b>.
          </>
        ) : null}
      </p>

      {sent ? (
        <div className="thanks">
          <b>♡</b>
          <h3>Merci pour votre réponse !</h3>
          <p>
            {data.couple.partner1} &amp; {data.couple.partner2}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <label>
            Nom et prénom
            <input name="fullName" required placeholder="Prénom et nom" />
          </label>

          <fieldset>
            <legend>Présence</legend>
            <label>
              <input type="radio" name="attendance" value="yes" required /> Oui, je serai là avec
              grand plaisir
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
                  value={attendance}
                  onChange={(event) =>
                    setAttendance(event.target.value === "partner" ? "partner" : "solo")
                  }
                >
                  <option value="solo">Moi uniquement</option>
                  <option value="partner">Moi + mon/ma partenaire</option>
                </select>
              </label>
              {attendance === "partner" ? (
                <label>
                  Prénom et nom de votre partenaire
                  <input name="partnerName" required placeholder="Prénom et nom" />
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
              Précisions
              <textarea name="message" placeholder="Allergie ou régime particulier…" />
            </label>
          ) : null}

          <button className="submit" type="submit">
            Envoyer ma réponse
          </button>
        </form>
      )}
    </section>
  );
}
