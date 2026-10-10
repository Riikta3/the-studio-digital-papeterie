"use client";

import { CircleCheck, Heart, Send } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Fragment } from "react";

import { formatFrenchDate } from "../../format";
import { GuestDiet, useDietLegend } from "../../GuestDiet";
import { DIET_PARTNER, DIET_SELF, dietChildKey, dietChoices } from "../../guest-diet";
import { monogramOf } from "../../monogram";
import { Lines, slot } from "../../text";
import type { InvitationData } from "../../types";
import { useGuestRsvp } from "../../use-guest-rsvp";

import { dayMonth } from "./event-day";
import { useEventKindNames } from "./event-names";
import { Section } from "./Section";

/**
 * The reply: the couple's monogram, title and dates on the left (above, on a
 * phone), the form on a card beside them.
 *
 * What the form asks is what the product stores. The designer's also asked for
 * an e-mail, a phone number, an arrival, lodging, which dinners to attend and
 * the children's ages; none of it has a column, so none of it is drawn, and a
 * reply cannot be edited afterwards, so neither is the line promising it.
 *
 * The questions follow the answer: nothing but the first step before the guest
 * says whether they are coming; the party and each person's diets only for a
 * yes (one line per person, under that person's name); the word to the couple
 * for either; no child field at all at an adults-only wedding. Submission, pending and error state, and the demo guard (no
 * `weddingId`, nothing written) are the shared hook's.
 */
export function RsvpSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.mareAlta.rsvp");
  const locale = useLocale();
  const kindName = useEventKindNames();
  const rsvp = useGuestRsvp(data);

  const config = data.rsvp;
  const deadline = formatFrenchDate(data.event.rsvpDeadline, { locale });
  const monogram = monogramOf(data.couple, " · ");

  // The weekend, as the aside lists it: only the events that have a day.
  const weekend = (data.events ?? [])
    .flatMap((event) => {
      const day = dayMonth(event.date, locale);
      return day && event.date ? [{ kind: event.kind, date: event.date, day, name: event.name || kindName[event.kind] }] : [];
    })
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const answered = rsvp.attending !== null;
  const coming = rsvp.attending === true;

  // The couple's diet list (editor, RSVP tab); empty when they did not ask.
  const diets = dietChoices(config?.dietaryOptions);
  const askDiets = coming && diets.length > 0;
  const dietLegend = useDietLegend();
  // The closed diet line is drawn as this card's fields are: the ivory box and
  // its hairline, with a thin chevron where a select has its arrow.
  const dietField = {
    fieldClassName: "ma-diet-field",
    chevron: <span className="ma-diet-chevron" aria-hidden="true" />,
  };

  const askParty = coming && (rsvp.allowPartner || rsvp.allowChildren);
  const askMessage = answered && Boolean(config?.collectMessage);
  const lastStepNumber = askParty ? "03" : "02";

  const partySelect = rsvp.allowPartner ? (
    <label>
      {t("partyLabel")}
      <select
        name="partyMode"
        value={rsvp.partyMode}
        onChange={(event) => rsvp.setPartyMode(event.target.value === "partner" ? "partner" : "solo")}
      >
        <option value="solo">{t("partyOptionSolo")}</option>
        <option value="partner">{t("partyOptionPartner")}</option>
      </select>
    </label>
  ) : null;

  const childrenSelect = rsvp.allowChildren ? (
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
  ) : null;

  return (
    <Section id="ma-rsvp" className="rsvp paper-section" editorSection="rsvp">
      <div className="rsvp-shell">
        <aside className="rsvp-intro">
          {monogram ? (
            <div className="rsvp-monogram" aria-hidden="true">
              {monogram}
            </div>
          ) : null}
          <p className="eyebrow">{slot(data, "rsvp.eyebrow") ?? t("eyebrow")}</p>
          <h2>
            <Lines text={slot(data, "rsvp.title") ?? `${t("titleLine1")}\n${t("titleLine2")}`} />
          </h2>
          {data.copy?.rsvpIntro ? (
            <p className="rsvp-lead">
              <Lines text={data.copy.rsvpIntro} />
            </p>
          ) : null}
          {deadline ? (
            <div className="rsvp-deadline">
              <span>{t("deadlineLabel")}</span>
              <strong>{deadline}</strong>
            </div>
          ) : data.copy?.rsvpNote ? (
            // A deadline saved as words rather than a date: printed as the couple wrote it.
            <div className="rsvp-deadline">
              <span>{data.copy.rsvpNote}</span>
            </div>
          ) : null}
          {weekend.length >= 2 ? (
            <div
              className="rsvp-weekend"
              role="group"
              aria-label={t("weekendLabel")}
              style={{ gridTemplateColumns: `repeat(${Math.min(weekend.length, 3)}, 1fr)` }}
            >
              {weekend.map((event) => (
                <span key={event.kind}>
                  {event.day}
                  <small>{event.name}</small>
                </span>
              ))}
            </div>
          ) : null}
        </aside>

        <div className="rsvp-card">
          {rsvp.sent ? (
            <div className="success" role="status">
              <CircleCheck />
              <p className="eyebrow">{t("thanksEyebrow")}</p>
              <h3>{t("thanksTitle")}</h3>
              <p>{t("thanksBody")}</p>
            </div>
          ) : (
            <form onSubmit={rsvp.handleSubmit}>
              <div className="rsvp-form-section">
                <div className="rsvp-step">
                  <span>01</span>
                  <h3>{t("step1")}</h3>
                </div>
                <div className="choice-grid attendance-choice" role="group" aria-label={t("attendanceLegend")}>
                  <button
                    type="button"
                    className={rsvp.attending === true ? "selected" : ""}
                    aria-pressed={rsvp.attending === true}
                    onClick={() => rsvp.setAttending(true)}
                  >
                    <Heart /> {t("attendYes")}
                  </button>
                  <button
                    type="button"
                    className={rsvp.attending === false ? "selected" : ""}
                    aria-pressed={rsvp.attending === false}
                    onClick={() => rsvp.setAttending(false)}
                  >
                    {t("attendNo")}
                  </button>
                </div>
                {/* The answer, for the form's data: the buttons above are not fields. */}
                <input type="hidden" name="attendance" value={rsvp.attending === true ? "yes" : "no"} />
                <label>
                  {t("nameLabel")}
                  <input required name="fullName" autoComplete="name" placeholder={t("namePlaceholder")} />
                </label>
                {askDiets ? <GuestDiet person={DIET_SELF} options={diets} label={dietLegend.self} {...dietField} /> : null}
              </div>

              {askParty ? (
                <div className="rsvp-form-section">
                  <div className="rsvp-step">
                    <span>02</span>
                    <h3>{t("step2")}</h3>
                  </div>
                  {partySelect && childrenSelect ? (
                    <div className="contact-grid">
                      {partySelect}
                      {childrenSelect}
                    </div>
                  ) : (
                    <>
                      {partySelect}
                      {childrenSelect}
                    </>
                  )}
                  {rsvp.allowPartner && rsvp.partyMode === "partner" ? (
                    <label>
                      {t("partnerNameLabel")}
                      <input required name="partnerName" autoComplete="off" placeholder={t("partnerNamePlaceholder")} />
                    </label>
                  ) : null}
                  {rsvp.allowPartner && rsvp.partyMode === "partner" && askDiets ? (
                    <GuestDiet person={DIET_PARTNER} options={diets} label={dietLegend.partner} {...dietField} />
                  ) : null}
                  {rsvp.allowChildren
                    ? Array.from({ length: rsvp.childCount }, (_, index) => (
                        <Fragment key={index}>
                          <label>
                            {t("childFieldLabel", { index: index + 1 })}
                            <input
                              required
                              name={`childName-${index}`}
                              autoComplete="off"
                              placeholder={t("childNamePlaceholder")}
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
                      ))
                    : null}
                </div>
              ) : null}

              {askMessage ? (
                <div className="rsvp-form-section">
                  <div className="rsvp-step">
                    <span>{lastStepNumber}</span>
                    <h3>{t("step3")}</h3>
                  </div>
                  <label>
                    {/* The designer's label, with its small "optional" beside it. */}
                    {t("messageLabel")} <span className="optional">{t("optional")}</span>
                    <textarea name="message" placeholder={t("messagePlaceholder")} />
                  </label>
                </div>
              ) : null}

              {rsvp.error ? (
                <p className="rsvp-error" role="alert">
                  {rsvp.error}
                </p>
              ) : null}

              <button className="submit" type="submit" disabled={rsvp.attending === null || rsvp.pending}>
                <Send size={17} /> {rsvp.pending ? t("submitPending") : t("submit")}
              </button>
            </form>
          )}
        </div>
      </div>
    </Section>
  );
}
