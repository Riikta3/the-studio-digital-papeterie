"use client";

import { type FormEvent, useState } from "react";

import { type RsvpCompanion, submitRsvp } from "@/actions/invitation-submissions";
import { formatFrenchDate } from "../../format";
import type { InvitationData } from "../../types";

import { Page, splitMonogram } from "./Page";

/**
 * RSVP form.
 *
 * Two modes, decided by `data.weddingId` (see `themes/types.ts`): a real
 * invitation persists the answer against its wedding, while the showcase —
 * which never carries an id — shows the same confirmation and writes nothing.
 *
 * This used to be demo-only in both modes, so a real wedding rendered in this
 * theme silently dropped every reply its guests sent.
 *
 * The welcome-dinner and brunch questions are gated on the `rsvp` flags rather
 * than always rendered: they are specific to weddings that run a three-day
 * programme, and asking a guest about a brunch that does not exist is worse
 * than not asking.
 */
export function RsvpSection({ data, side }: { data: InvitationData; side: "left" | "right" }) {
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guestCount, setGuestCount] = useState("1");

  const rsvp = data.rsvp;
  const [first, second] = splitMonogram(data.couple.monogram);

  // The source printed the deadline as prose. Formatting it from the ISO date
  // keeps "30 janvier" and "1er février" both correct.
  const deadline = formatFrenchDate(data.event.rsvpDeadline);
  const note = deadline ? `Merci de répondre avant le ${deadline}` : data.copy?.rsvpNote;
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

    const fullName = String(form.get("fullName") ?? "").trim();
    const [firstName, ...rest] = fullName.split(" ");
    const lastName = rest.join(" ");

    const isAttending = form.get("attendance") === "yes";

    const companions: RsvpCompanion[] = [];
    const partnerName = String(form.get("partnerName") ?? "").trim();
    if (isAttending && guestCount === "2" && partnerName) {
      const [partnerFirst, ...partnerRest] = partnerName.split(" ");
      companions.push({
        firstName: partnerFirst ?? "",
        lastName: partnerRest.join(" "),
      });
    }

    // This theme asks two questions no other does, and `RsvpSubmission` has no
    // column for either. Rather than widen the shared contract for one theme,
    // they are appended to the message the couple already reads — the answers
    // are short, and a note saying "Dîner de bienvenue : oui" is exactly what
    // a couple would want to see next to the reply anyway.
    const extras: string[] = [];
    if (isAttending && rsvp?.collectWelcomeDinner) {
      const answer = String(form.get("welcomeDinner") ?? "").trim();
      if (answer) extras.push(`Dîner de bienvenue : ${answer === "yes" ? "oui" : "non"}`);
    }
    if (isAttending && rsvp?.collectBrunch) {
      const answer = String(form.get("brunch") ?? "").trim();
      if (answer) extras.push(`Brunch : ${answer === "yes" ? "oui" : "non"}`);
    }

    const message = [String(form.get("message") ?? "").trim(), ...extras]
      .filter(Boolean)
      .join("\n");

    setPending(true);
    setError(null);

    const result = await submitRsvp({
      weddingId,
      firstName: firstName ?? "",
      lastName,
      attendance: isAttending,
      dietary: String(form.get("dietary") ?? ""),
      message,
      companions,
    });

    setPending(false);

    if (result.ok) setSent(true);
    else setError(result.error);
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

          {/* A failed submission must say so: without this the form sits
              silent and the guest assumes their answer was recorded. */}
          {error ? (
            <p className="rsvp-error" role="alert">
              {error}
            </p>
          ) : null}

          <button className="button" type="submit" disabled={pending}>
            {pending ? "Envoi…" : "Envoyer ma réponse"}
          </button>
        </form>
      )}

      {note ? <p className="note">{note}</p> : null}
    </Page>
  );
}
