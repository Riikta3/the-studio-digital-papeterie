/**
 * The contact form's subject list, in one place.
 *
 * Three consumers have to agree on these exact strings: the `<select>`, the
 * server action's validation, and the `subject` check constraint in
 * 20260909120000_contact_messages.sql. A free-text subject was rejected on
 * purpose — a constrained list is what makes the inbox triageable at a glance.
 *
 * Adding a value means editing this array, the SQL constraint AND the nine
 * locale files. The label lives in `Contact.subjects.<value>`, never here.
 */
export const CONTACT_SUBJECTS = [
  "avant-achat",
  "ma-commande",
  "technique",
  "sur-mesure",
  "autre",
] as const;

export type ContactSubject = (typeof CONTACT_SUBJECTS)[number];

export function isContactSubject(value: unknown): value is ContactSubject {
  return (
    typeof value === "string" &&
    (CONTACT_SUBJECTS as readonly string[]).includes(value)
  );
}
