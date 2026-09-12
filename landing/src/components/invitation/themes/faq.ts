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

/**
 * The wording for the derived entry, supplied by the caller.
 *
 * The question and both answers used to be French string literals in this
 * file, so the one FAQ entry the product writes itself stayed French on an
 * invitation served in any of the other eight locales. They come from the
 * theme's message catalogue now — this module still decides WHICH of the two
 * answers applies, which is the part that must never disagree with the RSVP
 * form.
 */
export type ChildrenPolicyCopy = {
  question: string;
  adultsOnlyAnswer: string;
  childrenWelcomeAnswer: string;
};

/**
 * Returns the FAQ with the children-policy entry guaranteed present and in
 * agreement with the RSVP form.
 *
 * Precedence: a couple's own entry (matched by `id`) > the derived default.
 * The derived entry is appended last, after the copy the couple did write.
 */
export function withChildrenPolicyFaq(
  data: InvitationData,
  copy: ChildrenPolicyCopy,
): FaqEntry[] {
  const faq = data.faq ?? [];

  // The couple answered this question themselves — their wording wins, and
  // nothing is appended.
  if (faq.some((entry) => entry.id === CHILDREN_FAQ_ID)) return faq;

  // Same default as the RSVP form: absent means the column's `false`, i.e.
  // children are allowed unless the couple ruled them out.
  const allowChildren = data.rsvp?.allowChildren !== false;

  return [
    ...faq,
    {
      id: CHILDREN_FAQ_ID,
      question: copy.question,
      answer: allowChildren ? copy.childrenWelcomeAnswer : copy.adultsOnlyAnswer,
    },
  ];
}
