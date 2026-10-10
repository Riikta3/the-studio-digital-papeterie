"use client";

import { type ReactNode, useId, useState } from "react";
import { useTranslations } from "next-intl";

import { DIET_OTHER_MAX, dietField, dietOtherField } from "./guest-diet";

/**
 * One person's diets and allergies in a theme's RSVP form, as one field.
 *
 * Closed, it is a single line drawn like the theme's other fields, which sums
 * up the choice (« Aucun », « Sans gluten, Halal »). Tapped, it unfolds the
 * couple's options as checkboxes — several may be ticked — and « Autre »,
 * which opens a field for what the list does not name. The checkboxes stay in
 * the form while folded, so they are sent either way.
 *
 * The theme dresses it from these classes, under its scope class:
 *   .guest-diet            the whole field (a group)
 *   .guest-diet__label     whose diet this is, set like the theme's labels
 *   .guest-diet__toggle    the closed line, a <button>; `fieldClassName` adds
 *                          the theme's own field classes to its wrapper, and
 *                          `chevron` its own chevron
 *   .guest-diet__summary   the summed-up choice inside it
 *   .guest-diet__panel     the unfolded list
 *   .guest-diet__option    one choice: a <label> with the checkbox and a <span>
 *   .guest-diet__other     the free field, once « Autre » is ticked
 *
 * `options` comes from `dietChoices(data.rsvp.dietaryOptions)`; the theme does
 * not render this at all when it is empty (the couple did not ask).
 */
export function GuestDiet({
  person,
  options,
  label,
  className,
  fieldClassName,
  chevron,
}: {
  /** `DIET_SELF`, `DIET_PARTNER` or `dietChildKey(index)` — names the fields. */
  person: string;
  options: readonly string[];
  /** Whose diet: the theme's own words, or `useDietLegend()`. */
  label: string;
  className?: string;
  /** The theme's own field wrapper classes, so the closed line looks like its fields. */
  fieldClassName?: string;
  /** The theme's own chevron, drawn at the end of the closed line. */
  chevron?: ReactNode;
}) {
  const t = useTranslations("Invitation.diet");
  const [open, setOpen] = useState(false);
  const [ticked, setTicked] = useState<string[]>([]);
  const [other, setOther] = useState(false);
  const [otherText, setOtherText] = useState("");
  const labelId = useId();
  const panelId = useId();

  const toggle = (option: string, on: boolean) =>
    setTicked((current) =>
      on ? options.filter((o) => o === option || current.includes(o)) : current.filter((o) => o !== option),
    );

  const parts = [...ticked, ...(other && otherText.trim() ? [otherText.trim()] : other ? [t("other")] : [])];
  const summary = parts.length ? parts.join(", ") : t("none");

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className={className ? `guest-diet ${className}` : "guest-diet"}
      data-person={person}
      data-open={open || undefined}
    >
      <span id={labelId} className="guest-diet__label">
        {label}
      </span>
      <span className={fieldClassName}>
        <button
          type="button"
          className="guest-diet__toggle"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="guest-diet__summary" data-empty={parts.length ? undefined : true}>
            {summary}
          </span>
        </button>
        {chevron}
      </span>
      <div id={panelId} className="guest-diet__panel" hidden={!open}>
        {options.map((option) => (
          <label className="guest-diet__option" key={option}>
            <input
              type="checkbox"
              name={dietField(person)}
              value={option}
              checked={ticked.includes(option)}
              onChange={(event) => toggle(option, event.target.checked)}
            />
            <span>{option}</span>
          </label>
        ))}
        <label className="guest-diet__option">
          <input type="checkbox" checked={other} onChange={(event) => setOther(event.target.checked)} />
          <span>{t("other")}</span>
        </label>
        {other ? (
          <input
            className="guest-diet__other"
            name={dietOtherField(person)}
            value={otherText}
            onChange={(event) => setOtherText(event.target.value)}
            maxLength={DIET_OTHER_MAX}
            placeholder={t("otherPlaceholder")}
            aria-label={t("otherLabel")}
            autoComplete="off"
          />
        ) : null}
      </div>
    </div>
  );
}

/** The default « whose diet » labels, for a theme with no words of its own for them. */
export function useDietLegend() {
  const t = useTranslations("Invitation.diet");
  return {
    self: t("legendSelf"),
    partner: t("legendPartner"),
    child: (index: number) => t("legendChild", { index }),
  };
}
