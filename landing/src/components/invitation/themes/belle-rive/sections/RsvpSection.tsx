"use client";

import { type FormEvent, useState } from "react";

import { type RsvpCompanion, submitRsvp } from "@/actions/invitation-submissions";
import { formatFrenchDate } from "../../format";
import type { InvitationData } from "../../types";

/**
 * RSVP form.
 *
 * Two modes, decided by `data.weddingId` (see `themes/types.ts`): a real
 * invitation persists the answer against its wedding, while the showcase —
 * which never carries an id — shows the same confirmation and writes nothing.
 *
 * This used to be demo-only in both modes, so a real wedding rendered in this
 * theme silently dropped every reply its guests sent.
 */
export function RsvpSection({ data }: { data: InvitationData }) {
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<"solo" | "partner">("solo");

  const rsvp = data.rsvp;
  const deadline = formatFrenchDate(data.event.rsvpDeadline);
  const weddingId = data.weddingId;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const form = new FormData(event.currentTarget);

    // Demo: no wedding to attach the answer to. Confirm locally, persist
    // nothing — the guard the showcase relies on.
    if (!weddingId) {
      setSent(true);
      return;
    }

    // "Prénom Nom" arrives as one field; the table stores the split halves the
    // dashboard edits.
    const fullName = String(form.get("fullName") ?? "").trim();
    const [firstName, ...rest] = fullName.split(" ");
    const lastName = rest.join(" ");

    const isAttending = form.get("attendance") === "yes";

    // `guest_count` is derived server-side from this list, so a companion left
    // out here is a head the caterer never counts.
    const companions: RsvpCompanion[] = [];
    const partnerName = String(form.get("partnerName") ?? "").trim();
    if (isAttending && attendance === "partner" && partnerName) {
      const [partnerFirst, ...partnerRest] = partnerName.split(" ");
      companions.push({
        firstName: partnerFirst ?? "",
        lastName: partnerRest.join(" "),
      });
    }

    setPending(true);
    setError(null);

    const result = await submitRsvp({
      weddingId,
      firstName: firstName ?? "",
      lastName,
      attendance: isAttending,
      dietary: String(form.get("dietary") ?? ""),
      message: String(form.get("message") ?? ""),
      companions,
    });

    setPending(false);

    if (result.ok) setSent(true);
    else setError(result.error);
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

          {/* A failed submission must say so: without this the form sits
              silent and the guest assumes their answer was recorded. */}
          {error ? (
            <p className="rsvp-error" role="alert">
              {error}
            </p>
          ) : null}

          <button className="submit" type="submit" disabled={pending}>
            {pending ? "Envoi…" : "Envoyer ma réponse"}
          </button>
        </form>
      )}
    </section>
  );
}
