/**
 * FAQ entries a wedding's own settings decide.
 *
 * Most of the FAQ is free text the couple writes. One question is not: "are
 * children invited?" is answered entirely by `settings.adults_only`, which the
 * couple already sets in the studio's options step. Written by hand it goes
 * stale the moment that switch is flipped — a wedding that accepts children
 * would still publish a FAQ saying it does not, and the page would contradict
 * its own RSVP form.
 *
 * So it is derived here instead, from the same `rsvp.allowChildren` flag the
 * RSVP form reads. One boolean, one entry — deliberately not a general
 * conditional-content engine.
 *
 * ## Staying editable
 *
 * This supplies a DEFAULT, never an override. A couple who writes their own
 * answer to this question keeps it verbatim: `withChildrenPolicyFaq` matches
 * on the entry the invitation already carries and leaves it untouched. When a
 * back-office for FAQ copy arrives, it needs no change here — a row the couple
 * has edited simply arrives in `data.faq` and wins, exactly as a hand-written
 * one does today. Detection is by `id`, so a couple may also rewrite the
 * question itself without the default reappearing beside it.
 */

import type { FaqEntry, InvitationData } from "./types";

/** Marks the entry this module owns, so a couple's own version replaces it
 *  rather than sitting next to it. */
export const CHILDREN_FAQ_ID = "children-policy";

const ADULTS_ONLY: FaqEntry = {
  id: CHILDREN_FAQ_ID,
  question: "Les enfants sont-ils conviés ?",
  answer:
    "Afin que tous les parents puissent profiter pleinement de la soirée et faire la fête jusqu'au bout de la nuit, notre mariage se déroulera entre adultes. Profitez de cette parenthèse rien que pour vous.",
};

/**
 * Children are welcome. Kept short and factual on purpose: the couple never
 * wrote this sentence, so it states the policy and nothing more — no promise
 * of a kids' table, a babysitter or a children's menu that may not exist.
 */
const CHILDREN_WELCOME: FaqEntry = {
  id: CHILDREN_FAQ_ID,
  question: "Les enfants sont-ils conviés ?",
  answer:
    "Oui, vos enfants sont les bienvenus. Merci de les indiquer dans votre réponse afin que nous puissions tout prévoir pour eux.",
};

/**
 * Returns the FAQ with the children-policy entry guaranteed present and in
 * agreement with the RSVP form.
 *
 * Precedence: a couple's own entry (matched by `id`) > the derived default.
 * The derived entry is appended last, after the copy the couple did write.
 */
export function withChildrenPolicyFaq(data: InvitationData): FaqEntry[] {
  const faq = data.faq ?? [];

  // The couple answered this question themselves — their wording wins, and
  // nothing is appended.
  if (faq.some((entry) => entry.id === CHILDREN_FAQ_ID)) return faq;

  // Same default as the RSVP form: absent means the column's `false`, i.e.
  // children are allowed unless the couple ruled them out.
  const allowChildren = data.rsvp?.allowChildren !== false;

  return [...faq, allowChildren ? CHILDREN_WELCOME : ADULTS_ONLY];
}
