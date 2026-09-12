"use client";

import { type FormEvent, useState } from "react";

import { type RsvpCompanion, submitRsvp } from "@/actions/invitation-submissions";
import { useLocale, useTranslations } from "next-intl";

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

  const rsvp = data.rsvp;
  const deadline = formatFrenchDate(data.event.rsvpDeadline, { locale });
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
              <input type="radio" name="attendance" value="yes" required /> {t("attendanceYes")}
            </label>
            <label>
              <input type="radio" name="attendance" value="no" /> {t("attendanceNo")}
            </label>
          </fieldset>

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
            </>
          ) : null}

          {rsvp?.dietaryOptions?.length ? (
            <label>
              {t("dietaryLabel")}
              <select name="dietary">
                {rsvp.dietaryOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
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
