"use client";

import { useLocale, useTranslations } from "next-intl";
import { Fragment, useState } from "react";

import { formatFrenchDate } from "../../format";
import { GuestDiet, useDietLegend } from "../../GuestDiet";
import { DIET_PARTNER, DIET_SELF, dietChildKey, dietChoices } from "../../guest-diet";
import { slot } from "../../text";
import type { InvitationData } from "../../types";
import { useGuestRsvp } from "../../use-guest-rsvp";

import { TitleLines } from "./TitleLines";

/**
 * The reply: the designer's bordered card with a ruled form.
 *
 * One question about presence, where the designer's page asked separately for the
 * Saturday and the Sunday: the product stores one answer per guest, with the
 * people who come with them. The partner and the children are asked only once
 * the guest says yes, and an adults-only wedding shows no child field at all.
 *
 * Diets and allergies are asked per person, under each one's line: the guest's
 * after the answer, the partner's under their name, each child's under theirs.
 * Closed, each is a ruled line like the form's selects (`GuestDiet`).
 *
 * With a wedding id the answer is saved; without one (the showcase, the editor's
 * preview) the form confirms locally and writes nothing — see `useGuestRsvp`.
 */
export function RsvpSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.chateauRoyal.rsvp");
  const tBook = useTranslations("Invitation.chateauRoyal.guestbook");
  const locale = useLocale();
  const rsvp = useGuestRsvp(data);
  // The designer's thank-you greets the guest by the name they typed ("Merci Jeanne Martin !").
  const [guestName, setGuestName] = useState("");

  const options = data.rsvp;
  const deadline = formatFrenchDate(data.event.rsvpDeadline, { locale });
  // A deadline saved before it was a date is a note, printed as it was written.
  const deadlineLine = deadline ? t("deadline", { date: deadline }) : data.copy?.rsvpNote;
  const intro = data.copy?.rsvpIntro?.trim();
  // The couple's diet list (editor, RSVP tab); empty when they did not ask.
  const diets = dietChoices(options?.dietaryOptions);
  const askDiets = rsvp.showParty && diets.length > 0;
  const dietLegend = useDietLegend();
  // The closed diet line is a ruled field, like the selects, with a hairline chevron.
  const dietField = {
    fieldClassName: "cr-diet-field",
    chevron: <span className="cr-diet-chevron" aria-hidden="true" />,
  };

  return (
    <section className="rsvp" id="cr-rsvp" data-editor-section="rsvp">
      <div className="rsvp-frame">
        <span className="section-eyebrow">{slot(data, "rsvp.eyebrow") ?? t("eyebrow")}</span>
        <h2>
          <TitleLines text={slot(data, "rsvp.title") ?? `${t("titleLine1")}\n${t("titleLine2")}`} />
        </h2>
        {deadlineLine ? <p>{deadlineLine}</p> : null}
        {/* The couple's sentence above the form (the RSVP tab). */}
        {intro ? <p className="cr-rsvp-intro">{intro}</p> : null}

        {rsvp.sent ? (
          <div className="success" role="status">
            {guestName ? t("thanksName", { name: guestName }) : t("thanks")}
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              setGuestName(String(new FormData(event.currentTarget).get("fullName") ?? "").trim());
              void rsvp.handleSubmit(event);
            }}
          >
            <label>
              {t("nameLabel")}
              <input name="fullName" autoComplete="name" required />
            </label>

            <label>
              {t("attendanceLabel")}
              <select
                name="attendance"
                required
                defaultValue=""
                onChange={(event) =>
                  rsvp.setAttending(
                    event.target.value === "yes" ? true : event.target.value === "no" ? false : null,
                  )
                }
              >
                <option value="" disabled>
                  {t("attendanceChoose")}
                </option>
                <option value="yes">{t("attendanceYes")}</option>
                <option value="no">{t("attendanceNo")}</option>
              </select>
            </label>

            {askDiets ? <GuestDiet person={DIET_SELF} options={diets} label={dietLegend.self} {...dietField} /> : null}

            {rsvp.showParty && rsvp.allowPartner ? (
              <>
                <label>
                  {t("partyLabel")}
                  <select
                    name="partyMode"
                    value={rsvp.partyMode}
                    onChange={(event) =>
                      rsvp.setPartyMode(event.target.value === "partner" ? "partner" : "solo")
                    }
                  >
                    <option value="solo">{t("partyOptionSolo")}</option>
                    <option value="partner">{t("partyOptionPartner")}</option>
                  </select>
                </label>
                {rsvp.partyMode === "partner" ? (
                  <>
                    <label>
                      {t("partnerNameLabel")}
                      <input
                        name="partnerName"
                        placeholder={t("partnerNamePlaceholder")}
                        autoComplete="off"
                        required
                      />
                    </label>
                    {askDiets ? (
                      <GuestDiet person={DIET_PARTNER} options={diets} label={dietLegend.partner} {...dietField} />
                    ) : null}
                  </>
                ) : null}
              </>
            ) : null}

            {/* Children: only when the couple accepts them AND the guest is coming. An
                adults-only wedding gets no field here, not a disabled one. */}
            {rsvp.showParty && rsvp.allowChildren ? (
              <>
                <label>
                  {t("childrenLabel")}
                  <select
                    name="childCount"
                    value={rsvp.childCount}
                    onChange={(event) => rsvp.setChildCount(Number(event.target.value))}
                  >
                    <option value={0}>{t("childrenOptionNone")}</option>
                    {Array.from({ length: rsvp.maxChildren }, (_, index) => index + 1).map((count) => (
                      <option key={count} value={count}>
                        {t("childrenOptionCount", { count })}
                      </option>
                    ))}
                  </select>
                </label>
                {Array.from({ length: rsvp.childCount }, (_, index) => (
                  <Fragment key={index}>
                    <label>
                      {t("childFieldLabel", { index: index + 1 })}
                      <input
                        name={`childName-${index}`}
                        placeholder={t("childNamePlaceholder")}
                        autoComplete="off"
                        required
                      />
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

            {/* The designer's one free field asked for "allergies, details or a short note". When
                the couple asks diets, each person has their own line above, and this is the
                guest's note alone. */}
            {options?.collectMessage ? (
              <label>
                {diets.length ? tBook("messageLabel") : t("messageLabel")}
                <input name="message" placeholder={t("messagePlaceholder")} />
              </label>
            ) : null}

            {rsvp.error ? (
              <p className="cr-rsvp-error" role="alert">
                {rsvp.error}
              </p>
            ) : null}

            <button type="submit" disabled={rsvp.pending}>
              {rsvp.pending ? t("pending") : t("submit")} <span aria-hidden="true">✦</span>
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
