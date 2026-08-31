"use client";

import { type FormEvent, useState } from "react";

import { type RsvpCompanion, submitRsvp } from "@/actions/invitation-submissions";
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

/** A guest cannot bring more than this many children. Well under the server's
 *  20-participant cap, which still bounds the payload whatever is sent. */
const MAX_CHILDREN = 4;

export function RsvpSection({ data }: { data: InvitationData }) {
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partyMode, setPartyMode] = useState<"solo" | "partner">("solo");
  const [childCount, setChildCount] = useState(0);
  /** Drives the conditional blocks below: nobody declares a party when they
   *  have just answered that they are not coming. */
  const [attending, setAttending] = useState<boolean | null>(null);

  const rsvp = data.rsvp;
  const deadline = formatFrenchDate(data.event.rsvpDeadline);
  const weddingId = data.weddingId;

  // `settings.adults_only` reaches the theme inverted as `allowChildren`
  // (see `themes/types.ts`). Absent means "not answered" and the column
  // defaults to false, so children are allowed unless explicitly ruled out.
  const allowChildren = rsvp?.allowChildren !== false;
  // The party questions only make sense for a guest who is coming. Before any
  // answer is given (`null`) they stay hidden, so the form opens short.
  const showParty = attending === true;

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

    const isAttending = form.get("attendance") === "yes";

    // Every companion — partner and children alike — goes into the same list.
    // `guest_count` is derived server-side from its length (see
    // `invitation-submissions.ts`), so a child left out here is a head the
    // caterer never counts.
    const companions: RsvpCompanion[] = [];

    if (isAttending && partyMode === "partner" && partnerName) {
      companions.push({ firstName: partnerFirst ?? "", lastName: partnerRest.join(" ") });
    }

    // Children are only collected when the couple allows them and the guest is
    // coming; both conditions also gate the fields, so nothing is read here
    // that was not rendered.
    //
    // A child is a nominal participant exactly like the partner — a first name
    // and nothing more. No age, no date of birth, no age bracket: the less
    // personal data collected about a minor, the better, and the dashboard's
    // `Participant` has nowhere durable to keep it anyway.
    if (isAttending && allowChildren) {
      for (let index = 0; index < childCount; index += 1) {
        const childName = String(form.get(`childName-${index}`) ?? "").trim();
        if (!childName) continue;
        const [childFirst, ...childRest] = childName.split(" ");
        companions.push({
          firstName: childFirst ?? "",
          // No surname typed: children usually share the guest's, so fall back
          // to it rather than storing a half-empty row in the dashboard.
          lastName: childRest.length ? childRest.join(" ") : lastName,
          // `"child"` is the exact value the dashboard's relation picker uses
          // (AddHouseholdDialog → "Enfant"), so a child declared here lands as
          // a first-class participant with no mapping step.
          relationType: "child",
        });
      }
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
              <span className="rsvp-field">
                <input required name="fullName" placeholder="Prénom et nom" />
              </span>
            </label>

            <fieldset>
              <legend>Présence</legend>
              <label>
                <input
                  type="radio"
                  name="attendance"
                  value="yes"
                  required
                  onChange={() => setAttending(true)}
                />{" "}
                Oui, avec grand plaisir
              </label>
              <label>
                <input
                  type="radio"
                  name="attendance"
                  value="no"
                  onChange={() => setAttending(false)}
                />{" "}
                Non, mais je penserai fort à vous
              </label>
            </fieldset>

            {showParty && rsvp?.allowPartner ? (
              <>
                <label>
                  Qui sera présent ?
                  <span className="rsvp-field rsvp-field-select">
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
                    <span className="rsvp-chevron" aria-hidden="true" />
                  </span>
                </label>
                {partyMode === "partner" ? (
                  <label className="partner-field">
                    Nom de votre partenaire
                    <span className="rsvp-field">
                      <input required name="partnerName" placeholder="Prénom et nom" />
                    </span>
                  </label>
                ) : null}
              </>
            ) : null}

            {/*
             * Children. Rendered only when the couple accepts them AND the
             * guest is coming — an adults-only wedding gets no field here at
             * all, not a disabled one, so the form never hints at something
             * the couple has ruled out.
             *
             * The count is a `<select>` rather than an "add a child" button on
             * purpose: `.rsvp-card button { width:100%; padding:16px }` in the
             * generated sheet makes every button in this card a full-width
             * cobalt slab, so a second button would read as a second submit.
             * The select reuses `.rsvp-field-select`, already drawn here.
             */}
            {showParty && allowChildren ? (
              <>
                <label>
                  Enfants qui vous accompagnent
                  <span className="rsvp-field rsvp-field-select">
                    <select
                      name="childCount"
                      value={childCount}
                      onChange={(event) => setChildCount(Number(event.target.value))}
                    >
                      <option value={0}>Aucun</option>
                      {Array.from({ length: MAX_CHILDREN }, (_, index) => index + 1).map(
                        (count) => (
                          <option key={count} value={count}>
                            {count} enfant{count > 1 ? "s" : ""}
                          </option>
                        ),
                      )}
                    </select>
                    <span className="rsvp-chevron" aria-hidden="true" />
                  </span>
                </label>

                {/* One nominal field per child, the same shape as the partner
                    row above: a `<label>` that is a DIRECT child of the form,
                    so it picks up the generated `> form > label` grid and the
                    `.rsvp-field` wrapper's focus behaviour with no new CSS. */}
                {Array.from({ length: childCount }, (_, index) => (
                  <label className="child-field" key={index}>
                    Enfant {index + 1}
                    <span className="rsvp-field">
                      <input
                        required
                        name={`childName-${index}`}
                        placeholder="Prénom et nom"
                        autoComplete="off"
                      />
                    </span>
                  </label>
                ))}
              </>
            ) : null}

            {rsvp?.dietaryOptions?.length ? (
              <label>
                Restrictions alimentaires
                <span className="rsvp-field rsvp-field-select">
                  <select name="dietary">
                    {rsvp.dietaryOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                  <span className="rsvp-chevron" aria-hidden="true" />
                </span>
              </label>
            ) : null}

            {rsvp?.collectMessage ? (
              <label>
                Un petit mot
                <span className="rsvp-field rsvp-field-area">
                  <textarea name="message" placeholder="Votre message…" />
                </span>
              </label>
            ) : null}

            {error ? (
              <p className="rsvp-error" role="alert">
                {error}
              </p>
            ) : null}

            <button className="rsvp-submit" type="submit" disabled={pending}>
              {pending ? "Envoi…" : "Envoyer ma réponse"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
