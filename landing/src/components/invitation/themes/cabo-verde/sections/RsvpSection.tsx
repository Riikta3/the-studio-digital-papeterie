"use client";

import { useLocale, useTranslations } from "next-intl";
import { Fragment, useEffect, useRef } from "react";

import { formatFrenchDate } from "../../format";
import { GuestDiet, useDietLegend } from "../../GuestDiet";
import { DIET_PARTNER, DIET_SELF, dietChildKey, dietChoices } from "../../guest-diet";
import { slot } from "../../text";
import type { InvitationData } from "../../types";
import { useGuestRsvp } from "../../use-guest-rsvp";

import { Section } from "./Section";
import { Title } from "./Title";

/**
 * RSVP — the designer's form in the couple's words, on the shared submission.
 *
 * Two modes, decided by `data.weddingId` and handled by `useGuestRsvp`: with an
 * id the answer is persisted; without one — the showcase, the editor's preview —
 * the form confirms and writes nothing.
 *
 * The designer's page asked first and last name apart, a partner as a yes/no,
 * a count of children and a free-text diet, and confirmed without sending
 * anything. What the product stores is one name, a partner (and their name), the
 * children (each with a first name), each person's diets from the couple's list
 * and a message: the form asks exactly that, and no more — the partner, children
 * and diet questions only once the guest says yes (a diet line under each
 * person's name), the child field not at all for an adults-only wedding.
 */
export function RsvpSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.caboVerde.rsvp");
  const locale = useLocale();
  const rsvp = useGuestRsvp(data);
  const thanks = useRef<HTMLDivElement>(null);

  const deadline = formatFrenchDate(data.event.rsvpDeadline, { locale });
  const note = deadline ? null : data.copy?.rsvpNote;

  // The couple's diet list (editor, RSVP tab); empty when they did not ask.
  const diets = dietChoices(data.rsvp?.dietaryOptions);
  const askDiets = rsvp.showParty && diets.length > 0;
  const dietLegend = useDietLegend();
  // The closed diet line is drawn as this form's selects are: underlined, with
  // a thin chevron at its end.
  const dietField = {
    fieldClassName: "cv-diet-field",
    chevron: <span className="cv-diet-chevron" aria-hidden="true" />,
  };

  // The designer's script brought the section to the middle of the screen once
  // answered (`#rsvp`, `block: "center"`): the form the thank-you replaces was
  // taller, and the page would otherwise slide under it.
  useEffect(() => {
    if (!rsvp.sent) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    thanks.current?.closest("section")?.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "center" });
  }, [rsvp.sent]);

  return (
    <Section id="cv-rsvp" className="rsvp decorated" editorSection="rsvp">
      <div className="rsvp-editorial" aria-hidden="true">
        {/* A Latin ornament in every language: its full stop must stay at its end
            on a right-to-left page (`auto` follows the stamp's own script). */}
        <span dir="auto">{t("stamp")}</span>
        <i />
      </div>
      {deadline || note ? (
        <p className="eyebrow light">{deadline ? t("deadline", { date: deadline }) : note}</p>
      ) : null}
      <Title text={slot(data, "rsvp.title") ?? t("title")} />
      {data.copy?.rsvpIntro ? <p className="cv-rsvp-intro">{data.copy.rsvpIntro}</p> : null}

      {rsvp.sent ? (
        <div ref={thanks} className="rsvp-success show" role="status">
          <span aria-hidden="true">✓</span>
          <h3>{t("thanksTitle")}</h3>
          <p>{t("thanksBody")}</p>
        </div>
      ) : (
        <form onSubmit={rsvp.handleSubmit}>
          <label>
            {t("nameLabel")}
            <input required name="fullName" autoComplete="name" />
          </label>

          <fieldset>
            <legend>{t("attendanceLegend")}</legend>
            <label className="choice">
              <input
                type="radio"
                name="attendance"
                value="yes"
                required
                onChange={() => rsvp.setAttending(true)}
              />{" "}
              {t("attendanceYes")}
            </label>
            <label className="choice">
              <input
                type="radio"
                name="attendance"
                value="no"
                onChange={() => {
                  // Nobody declares a partner or children after saying no.
                  rsvp.setAttending(false);
                  rsvp.setPartyMode("solo");
                  rsvp.setChildCount(0);
                }}
              />{" "}
              {t("attendanceNo")}
            </label>
          </fieldset>

          {askDiets ? <GuestDiet person={DIET_SELF} options={diets} label={dietLegend.self} {...dietField} /> : null}

          {rsvp.showParty && rsvp.allowPartner ? (
            <fieldset>
              <legend>{t("partnerLegend")}</legend>
              <label className="choice">
                <input
                  type="radio"
                  name="partner"
                  value="yes"
                  required
                  onChange={() => rsvp.setPartyMode("partner")}
                />{" "}
                {t("partnerYes")}
              </label>
              <label className="choice">
                <input type="radio" name="partner" value="no" onChange={() => rsvp.setPartyMode("solo")} />{" "}
                {t("partnerNo")}
              </label>
            </fieldset>
          ) : null}

          {rsvp.showParty && rsvp.allowPartner && rsvp.partyMode === "partner" ? (
            <label>
              {t("partnerNameLabel")}
              <input required name="partnerName" autoComplete="off" />
            </label>
          ) : null}

          {rsvp.showParty && rsvp.allowPartner && rsvp.partyMode === "partner" && askDiets ? (
            <GuestDiet person={DIET_PARTNER} options={diets} label={dietLegend.partner} {...dietField} />
          ) : null}

          {/* An adults-only wedding gets no child field at all, not a disabled one. */}
          {rsvp.showParty && rsvp.allowChildren ? (
            <>
              <label>
                {t("childrenLabel")}
                <select
                  name="childCount"
                  value={rsvp.childCount}
                  onChange={(event) => rsvp.setChildCount(Number(event.target.value))}
                >
                  <option value={0}>{t("childrenNone")}</option>
                  {Array.from({ length: rsvp.maxChildren }, (_, index) => index + 1).map((count) => (
                    <option key={count} value={count}>
                      {t("childrenCount", { count })}
                    </option>
                  ))}
                </select>
              </label>
              {Array.from({ length: rsvp.childCount }, (_, index) => (
                <Fragment key={index}>
                  <label>
                    {t("childLabel", { index: index + 1 })}
                    <input required name={`childName-${index}`} autoComplete="off" />
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

          {data.rsvp?.collectMessage ? (
            <label>
              {t("messageLabel")}
              <textarea name="message" rows={3} placeholder={t("messagePlaceholder")} />
            </label>
          ) : null}

          {rsvp.error ? (
            <p className="cv-rsvp-error" role="alert">
              {rsvp.error}
            </p>
          ) : null}

          <button type="submit" disabled={rsvp.pending}>
            {rsvp.pending ? t("pending") : t("submit")}
          </button>
        </form>
      )}
    </Section>
  );
}
