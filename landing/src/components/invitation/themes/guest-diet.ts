/**
 * Diets and allergies in the RSVP, one set per person of the answer.
 *
 * The couple sets the list in the editor's RSVP tab (« Demander les régimes
 * alimentaires » → `rsvp.dietaryOptions`); an empty list means they did not
 * ask, and no theme draws the question. Each person — the guest, the partner,
 * every child — gets the list as checkboxes, several may be ticked, plus an
 * « Autre » box that opens a free field.
 *
 * ## Form field names are a contract
 *
 * For the person `key` (`self`, `partner`, `child-<index>`): every ticked
 * option is a `diet-<key>` value, the free field is `dietOther-<key>`.
 * `readDiet` turns them into the one line stored for that person.
 */

/** The people of an answer, as keys of the field names. */
export const DIET_SELF = "self";
export const DIET_PARTNER = "partner";
export const dietChildKey = (index: number) => `child-${index}`;

export const dietField = (key: string) => `diet-${key}`;
export const dietOtherField = (key: string) => `dietOther-${key}`;

/** What the server keeps per person; the stored line is cut there anyway. */
export const DIET_OTHER_MAX = 120;

/**
 * The couple's options as checkboxes.
 *
 * Their list may carry its own « Autre » (the editor's default list does) or a
 * « Aucun » left over from the single-choice select: the form has its own
 * « Autre » with a field, and ticking nothing already says « nothing », so both
 * are dropped. Duplicates and blanks too.
 */
export function dietChoices(options: readonly string[] | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of options ?? []) {
    const option = raw.trim();
    const key = option.toLocaleLowerCase("fr");
    if (!option || seen.has(key)) continue;
    if (/^(autre|autres|other|aucun|aucune|none|rien)\b/.test(key)) continue;
    seen.add(key);
    out.push(option);
  }
  return out;
}

/**
 * The line stored for one person: the ticked options in the couple's order,
 * then what they typed under « Autre » — « Sans gluten, Halal, arachides ».
 * Empty when nothing was ticked or typed.
 */
export function readDiet(form: Pick<FormData, "getAll" | "get">, key: string): string {
  const ticked = form
    .getAll(dietField(key))
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
  const otherValue = form.get(dietOtherField(key));
  const other = typeof otherValue === "string" ? otherValue.replace(/\s+/g, " ").trim().slice(0, DIET_OTHER_MAX) : "";
  return [...new Set(ticked), ...(other ? [other] : [])].join(", ");
}
