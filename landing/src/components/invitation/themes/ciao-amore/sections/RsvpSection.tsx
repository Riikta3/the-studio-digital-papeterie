"use client";

import { type FormEvent, Fragment, useState } from "react";

import { submitRsvp } from "@/actions/invitation-submissions";
import { useLocale, useTranslations } from "next-intl";

import { GuestDiet, useDietLegend } from "../../GuestDiet";
import { DIET_PARTNER, DIET_SELF, dietChildKey, dietChoices } from "../../guest-diet";
import { MAX_CHILDREN, buildRsvpSubmission } from "../../guest-rsvp-payload";
import { formatFrenchDate } from "../../format";
import { Lines, slot } from "../../text";
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
  const t = useTranslations("Invitation.ciaoAmore.rsvp");
  const locale = useLocale();
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partyMode, setPartyMode] = useState<"solo" | "partner">("solo");
  const [childCount, setChildCount] = useState(0);
  /** Drives the conditional blocks below: nobody declares a party when they
   *  have just answered that they are not coming. */
  const [attending, setAttending] = useState<boolean | null>(null);

  const rsvp = data.rsvp;
  const deadline = formatFrenchDate(data.event.rsvpDeadline, { locale });
  const weddingId = data.weddingId;

  // `settings.adults_only` reaches the theme inverted as `allowChildren`
  // (see `themes/types.ts`). Absent means "not answered" and the column
  // defaults to false, so children are allowed unless explicitly ruled out.
  const allowChildren = rsvp?.allowChildren !== false;
  // The party questions only make sense for a guest who is coming. Before any
  // answer is given (`null`) they stay hidden, so the form opens short.
  const showParty = attending === true;
  // The couple's diet list (editor, RSVP tab); empty when they did not ask.
  const diets = dietChoices(rsvp?.dietaryOptions);
  const askDiets = showParty && diets.length > 0;
  const dietLegend = useDietLegend();
  // The closed diet line is drawn as this form's selects are.
  const dietField = {
    fieldClassName: "rsvp-field rsvp-field-select",
    chevron: <span className="rsvp-chevron" aria-hidden="true" />,
  };

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

    setPending(true);
    setError(null);

    // Names, partner, children and each person's diets: the shared builder
    // (`guest-rsvp-payload.ts`), which this form follows field for field.
    const result = await submitRsvp(
      buildRsvpSubmission({
        weddingId,
        form,
        attending: form.get("attendance") === "yes",
        partyMode,
        childCount,
        allowChildren,
      }),
    );

    setPending(false);

    if (result.ok) setSent(true);
    else setError(result.error);
  }

  return (
    <section className="rsvp-section" data-editor-section="rsvp">
      <span className="rsvp-sun" aria-hidden="true" />
      <div className="rsvp-card">
        {deadline ? <p className="eyebrow">{t("deadlineEyebrow", { deadline })}</p> : null}
        <h2>
          <Lines text={slot(data, "rsvp.title") ?? `${t("titleLine1")}\n${t("titleLine2")}`} />
        </h2>
        {/* The couple's sentence above the form (the RSVP tab), and — for a
            deadline saved before it was a date — the note that stands in for
            the eyebrow above. */}
        {data.copy?.rsvpIntro ? (
          <p className="ca-rsvp-intro">
            <Lines text={data.copy.rsvpIntro} />
          </p>
        ) : null}
        {!deadline && data.copy?.rsvpNote ? <p className="ca-rsvp-note">{data.copy.rsvpNote}</p> : null}

        {sent ? (
          <div className="thanks">
            <span>♡</span>
            <h3>{t("thanksTitle")}</h3>
            <p>{t("thanksBody")}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>
              {t("nameLabel")}
              <span className="rsvp-field">
                <input required name="fullName" placeholder={t("namePlaceholder")} />
              </span>
            </label>

            <fieldset>
              <legend>{t("attendanceLegend")}</legend>
              <label>
                <input
                  type="radio"
                  name="attendance"
                  value="yes"
                  required
                  onChange={() => setAttending(true)}
                />{" "}
                {t("attendanceYes")}
              </label>
              <label>
                <input
                  type="radio"
                  name="attendance"
                  value="no"
                  onChange={() => setAttending(false)}
                />{" "}
                {t("attendanceNo")}
              </label>
            </fieldset>

            {askDiets ? <GuestDiet person={DIET_SELF} options={diets} label={dietLegend.self} {...dietField} /> : null}

            {showParty && rsvp?.allowPartner ? (
              <>
                <label>
                  {t("partyLabel")}
                  <span className="rsvp-field rsvp-field-select">
                    <select
                      name="partyMode"
                      value={partyMode}
                      onChange={(event) =>
                        setPartyMode(event.target.value === "partner" ? "partner" : "solo")
                      }
                    >
                      <option value="solo">{t("partyOptionSolo")}</option>
                      <option value="partner">{t("partyOptionPartner")}</option>
                    </select>
                    <span className="rsvp-chevron" aria-hidden="true" />
                  </span>
                </label>
                {partyMode === "partner" ? (
                  <label className="partner-field">
                    {t("partnerNameLabel")}
                    <span className="rsvp-field">
                      <input required name="partnerName" placeholder={t("partnerNamePlaceholder")} />
                    </span>
                  </label>
                ) : null}
                {partyMode === "partner" && askDiets ? (
                  <GuestDiet person={DIET_PARTNER} options={diets} label={dietLegend.partner} {...dietField} />
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
                  {t("childrenLabel")}
                  <span className="rsvp-field rsvp-field-select">
                    <select
                      name="childCount"
                      value={childCount}
                      onChange={(event) => setChildCount(Number(event.target.value))}
                    >
                      <option value={0}>{t("childrenOptionNone")}</option>
                      {Array.from({ length: MAX_CHILDREN }, (_, index) => index + 1).map(
                        (count) => (
                          <option key={count} value={count}>
                            {t("childrenOptionCount", { count })}
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
                  <Fragment key={index}>
                    <label className="child-field">
                      {t("childFieldLabel", { index: index + 1 })}
                      <span className="rsvp-field">
                        <input
                          required
                          name={`childName-${index}`}
                          placeholder={t("childNamePlaceholder")}
                          autoComplete="off"
                        />
                      </span>
                    </label>
                    {askDiets ? (
                      <GuestDiet
                        person={dietChildKey(index)}
                        options={diets}
                        label={dietLegend.child(index + 1)}
                        {...dietField}
                      />
                    ) : null}
                  </Fragment>
                ))}
              </>
            ) : null}

            {rsvp?.collectMessage ? (
              <label>
                {t("messageLabel")}
                <span className="rsvp-field rsvp-field-area">
                  <textarea name="message" placeholder={t("messagePlaceholder")} />
                </span>
              </label>
            ) : null}

            {error ? (
              <p className="rsvp-error" role="alert">
                {error}
              </p>
            ) : null}

            <button className="rsvp-submit" type="submit" disabled={pending}>
              {pending ? t("submitPending") : t("submit")}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
