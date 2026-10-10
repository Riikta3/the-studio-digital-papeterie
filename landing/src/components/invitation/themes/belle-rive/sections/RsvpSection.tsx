"use client";

import { type FormEvent, useState } from "react";

import { submitRsvp } from "@/actions/invitation-submissions";
import { useLocale, useTranslations } from "next-intl";

import { GuestDiet, useDietLegend } from "../../GuestDiet";
import { DIET_PARTNER, DIET_SELF, dietChoices } from "../../guest-diet";
import { buildRsvpSubmission } from "../../guest-rsvp-payload";
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
  const t = useTranslations("Invitation.belleRive.rsvp");
  const locale = useLocale();
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<"solo" | "partner">("solo");
  /** Whether the guest answered yes: diets are asked of people who come. */
  const [attending, setAttending] = useState<boolean | null>(null);

  const rsvp = data.rsvp;
  const deadline = formatFrenchDate(data.event.rsvpDeadline, { locale });
  const weddingId = data.weddingId;

  // The couple's diet list (editor, RSVP tab); empty when they did not ask.
  const diets = dietChoices(rsvp?.dietaryOptions);
  const askDiets = attending === true && diets.length > 0;
  const dietLegend = useDietLegend();
  // The closed diet line is drawn as this form's selects are.
  const dietField = {
    fieldClassName: "br-diet-field",
    chevron: <span className="br-diet-chevron" aria-hidden="true" />,
  };

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

    setPending(true);
    setError(null);

    // Names, partner and each person's diets: the shared builder
    // (`guest-rsvp-payload.ts`). This theme asks no children.
    const result = await submitRsvp(
      buildRsvpSubmission({
        weddingId,
        form,
        attending: form.get("attendance") === "yes",
        partyMode: attendance,
        childCount: 0,
        allowChildren: false,
      }),
    );

    setPending(false);

    if (result.ok) setSent(true);
    else setError(result.error);
  }

  return (
    <section className="panel rsvp pearled" data-editor-section="rsvp">
      <p className="eyebrow">{t("eyebrow")}</p>
      <h2>{t("title")}</h2>
      <p>
        {data.copy?.rsvpIntro ?? t("introFallback")}
        {deadline ? (
          <>
            {" "}
            {t.rich("deadline", {
              deadline,
              // The date is the sentence's one emphasis, and which words fall
              // around it differs by language — so the bold is a tag inside
              // the message rather than markup wrapped around a slot.
              b: (chunks) => <b>{chunks}</b>,
            })}
          </>
        ) : null}
      </p>

      {sent ? (
        <div className="thanks">
          <b>♡</b>
          <h3>{t("thanksTitle")}</h3>
          <p>
            {data.couple.partner1} &amp; {data.couple.partner2}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <label>
            {t("nameLabel")}
            <input name="fullName" required placeholder={t("namePlaceholder")} />
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

          {rsvp?.allowPartner ? (
            <>
              <label>
                {t("partyLabel")}
                <select
                  name="partyMode"
                  value={attendance}
                  onChange={(event) =>
                    setAttendance(event.target.value === "partner" ? "partner" : "solo")
                  }
                >
                  <option value="solo">{t("partyOptionSolo")}</option>
                  <option value="partner">{t("partyOptionPartner")}</option>
                </select>
              </label>
              {attendance === "partner" ? (
                <label>
                  {t("partnerNameLabel")}
                  <input name="partnerName" required placeholder={t("partnerNamePlaceholder")} />
                </label>
              ) : null}
              {attendance === "partner" && askDiets ? (
                <GuestDiet person={DIET_PARTNER} options={diets} label={dietLegend.partner} {...dietField} />
              ) : null}
            </>
          ) : null}

          {rsvp?.collectMessage ? (
            <label>
              {t("messageLabel")}
              <textarea name="message" placeholder={t("messagePlaceholder")} />
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
            {pending ? t("submitPending") : t("submit")}
          </button>
        </form>
      )}
    </section>
  );
}
