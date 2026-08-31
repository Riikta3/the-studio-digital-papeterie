"use client";

import { type FormEvent, useState } from "react";

import { submitRsvp } from "@/actions/invitation-submissions";
import { formatFrenchDate } from "../../format";
import type { InvitationData } from "../../types";

/**
 * RSVP form.
 *
 * Two modes, decided by `data.weddingId` (see `themes/types.ts`):
 *   - with an id  → the answer is persisted into `rsvp_responses` through the
 *                   server action, then the thank-you state is shown;
 *   - without one → demo. The submit handler returns before touching the
 *                   action, so the public showcase writes nothing.
 *
 * The demo guard is a plain early return rather than a conditional import: the
 * action is a server action, so the client only ever holds a reference to it,
 * and that reference is never called when `weddingId` is undefined. The action
 * itself also rejects a missing or malformed id, so the demo path is closed on
 * both sides.
 */
export function RsvpSection({ data }: { data: InvitationData }) {
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partyMode, setPartyMode] = useState<"solo" | "partner">("solo");

  const rsvp = data.rsvp;
  const deadline = formatFrenchDate(data.event.rsvpDeadline);
  const weddingId = data.weddingId;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const form = new FormData(event.currentTarget);

    // Demo: no wedding to attach the answer to. Confirm locally, persist
    // nothing. This is the guard the showcase relies on.
    if (!weddingId) {
      setSent(true);
      return;
    }

    // "Prénom Nom" comes in as one field here; the table stores both the joined
    // name and the split halves the dashboard edits.
    const fullName = String(form.get("fullName") ?? "").trim();
    const [firstName, ...rest] = fullName.split(" ");
    const lastName = rest.join(" ");

    const partnerName = String(form.get("partnerName") ?? "").trim();
    const [partnerFirst, ...partnerRest] = partnerName.split(" ");

    setPending(true);
    setError(null);

    const result = await submitRsvp({
      weddingId,
      firstName: firstName ?? "",
      lastName,
      attendance: form.get("attendance") === "yes",
      dietary: String(form.get("dietary") ?? ""),
      message: String(form.get("message") ?? ""),
      companions:
        partyMode === "partner" && partnerName
          ? [{ firstName: partnerFirst ?? "", lastName: partnerRest.join(" ") }]
          : [],
    });

    setPending(false);

    if (result.ok) setSent(true);
    else setError(result.error);
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

            {error ? <p role="alert">{error}</p> : null}

            <button type="submit" disabled={pending}>
              {pending ? "Envoi…" : "Envoyer ma réponse"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
