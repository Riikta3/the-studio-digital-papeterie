"use client";

import { useFormatter, useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";

import type { HouseholdMember, HouseholdMemberStatus } from "@/actions/invitation-household";

import { GuestDiet } from "./GuestDiet";
import { type HouseholdRsvp, memberDietKey, memberFieldName } from "./use-household-rsvp";

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
 *
 * When the couple asks for diets, each member marked present gets their own
 * `<GuestDiet>` line; `diet` carries the theme's options and the same field
 * dressing it gives its other diet lines.
 */

export type HouseholdDiet = {
  /** `dietChoices(data.rsvp.dietaryOptions)`; empty means diets are not asked. */
  options: readonly string[];
  className?: string;
  fieldClassName?: string;
  chevron?: ReactNode;
};
export function HouseholdMembers({
  household,
  choiceClassName,
  noteClassName,
  plain = false,
  diet,
}: {
  household: HouseholdRsvp;
  choiceClassName?: string;
  noteClassName?: string;
  plain?: boolean;
  diet?: HouseholdDiet;
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

      {current.members.map((member) => (
        <MemberAnswer
          key={member.id}
          member={member}
          // Selected only when the household answered before: a first answer
          // starts blank, so nobody is marked present by default.
          previous={answered ? member.status : null}
          choice={choice}
          diet={diet}
        />
      ))}

      {household.missing ? (
        <p className={noteClassName} role="alert">
          {t("missing")}
        </p>
      ) : null}
    </fieldset>
  );
}

function MemberAnswer({
  member,
  previous,
  choice,
  diet,
}: {
  member: HouseholdMember;
  previous: HouseholdMemberStatus | null;
  choice: string | undefined;
  diet: HouseholdDiet | undefined;
}) {
  const t = useTranslations("Invitation.household");
  const [status, setStatus] = useState<HouseholdMemberStatus | null>(previous);
  const name = memberFieldName(member.id);
  const fullName = [member.firstName, member.lastName].filter(Boolean).join(" ");

  const radio = (value: HouseholdMemberStatus, label: string) => (
    <label className={choice}>
      <input
        type="radio"
        name={name}
        value={value}
        required={value === "confirmed"}
        defaultChecked={previous === value}
        onChange={() => setStatus(value)}
      />{" "}
      {label}
    </label>
  );

  return (
    <fieldset>
      <legend>{fullName}</legend>
      {radio("confirmed", t("present"))}
      {radio("declined", t("absent"))}
      {radio("pending", t("unsure"))}
      {status === "confirmed" && diet && diet.options.length > 0 ? (
        <GuestDiet
          person={memberDietKey(member.id)}
          options={diet.options}
          label={t("dietOf", { name: member.firstName || fullName })}
          className={diet.className}
          fieldClassName={diet.fieldClassName}
          chevron={diet.chevron}
        />
      ) : null}
    </fieldset>
  );
}
