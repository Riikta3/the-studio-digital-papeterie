"use client";

import { useFormatter, useTranslations } from "next-intl";

import { type HouseholdRsvp, memberFieldName } from "./use-household-rsvp";

import "./household-members.css";

/**
 * One answer per member of the guest's household, shared by every theme.
 *
 * Plain fieldsets, legends and radio labels, so it takes on the look the theme
 * already gives its own questions; `choiceClassName` is the class the theme
 * puts on a radio's label, when it has one. A theme whose field styles were
 * only drawn for text boxes passes `plain` for a neutral radio layout.
 *
 * Every radio group is `required`: the browser refuses to send the form while
 * a member has no answer, which is the "nobody forgotten" rule. The database
 * enforces it again (`submit_invitation_household_rsvp`).
 *
 * A household that already answered comes back with its answers selected, so
 * a second member sees what the first said and can change it.
 */
export function HouseholdMembers({
  household,
  choiceClassName,
  noteClassName,
  plain = false,
}: {
  household: HouseholdRsvp;
  choiceClassName?: string;
  noteClassName?: string;
  plain?: boolean;
}) {
  const t = useTranslations("Invitation.household");
  const format = useFormatter();
  const current = household.current;
  if (!current) return null;

  const choice = [choiceClassName, plain ? "rsvp-household-choice" : null].filter(Boolean).join(" ") || undefined;
  const answered = current.answeredAt ? new Date(current.answeredAt) : null;

  return (
    <fieldset className={plain ? "rsvp-household rsvp-household-plain" : "rsvp-household"}>
      <legend>{t("legend")}</legend>
      {answered ? (
        <p className={noteClassName}>
          {t("alreadyAnswered", { date: format.dateTime(answered, { day: "numeric", month: "long" }) })}
        </p>
      ) : null}

      {current.members.map((member) => {
        const name = memberFieldName(member.id);
        // Selected only when the household answered before: a first answer
        // starts blank, so nobody is marked present by default.
        const previous = answered ? member.status : null;

        return (
          <fieldset key={member.id}>
            <legend>
              {[member.firstName, member.lastName].filter(Boolean).join(" ")}
            </legend>
            <label className={choice}>
              <input
                type="radio"
                name={name}
                value="confirmed"
                required
                defaultChecked={previous === "confirmed"}
              />{" "}
              {t("present")}
            </label>
            <label className={choice}>
              <input type="radio" name={name} value="declined" defaultChecked={previous === "declined"} />{" "}
              {t("absent")}
            </label>
            <label className={choice}>
              <input type="radio" name={name} value="pending" defaultChecked={previous === "pending"} />{" "}
              {t("unsure")}
            </label>
          </fieldset>
        );
      })}

      {household.missing ? (
        <p className={noteClassName} role="alert">
          {t("missing")}
        </p>
      ) : null}
    </fieldset>
  );
}
