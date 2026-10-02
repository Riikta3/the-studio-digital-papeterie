"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import { withChildrenPolicyFaq } from "../../faq";
import { Lines, slot } from "../../text";
import type { InvitationData } from "../../types";

import { Section } from "./Section";
import { SectionTitle } from "./SectionTitle";

/**
 * The frequently asked questions, as an accordion.
 *
 * The designer used native `<details>`, which snaps open; this is a controlled
 * accordion with the same look, whose answer opens by transitioning
 * `grid-template-rows` from 0fr to 1fr — the one way to animate to a height the
 * content decides. One answer open at a time, the first at the start, a single
 * column at every width. Closed answers are `inert` (not `hidden`, which would
 * cut the closing transition) so their links stay out of the tab order.
 *
 * The children question is derived from the wedding's own settings, so the
 * answer can never contradict the RSVP above it.
 */
export function FaqSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.mareAlta.faq");
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const entries = withChildrenPolicyFaq(data, {
    question: t("childrenQuestion"),
    adultsOnlyAnswer: t("childrenAdultsOnly"),
    childrenWelcomeAnswer: t("childrenWelcome"),
  }).filter((entry) => entry.question.trim());

  if (entries.length === 0) return null;

  return (
    <Section id="ma-faq" className="faq night-section" editorSection="faq">
      <SectionTitle
        eyebrow={slot(data, "faq.eyebrow") ?? t("eyebrow")}
        title={<Lines text={slot(data, "faq.title") ?? t("title")} />}
      />
      <div className="faq-list">
        {entries.map((entry, index) => {
          const open = openIndex === index;
          const panelId = `${baseId}-panel-${index}`;
          const buttonId = `${baseId}-button-${index}`;

          return (
            <div className="ma-faq-item" data-open={open || undefined} key={`${index}-${entry.question}`}>
              <button
                type="button"
                id={buttonId}
                className="ma-faq-q"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIndex(open ? null : index)}
              >
                <span>{entry.question}</span>
                <ChevronDown aria-hidden="true" />
              </button>
              <div id={panelId} role="region" aria-labelledby={buttonId} className="ma-faq-a" inert={!open}>
                <div className="ma-faq-a-inner">
                  <p>
                    <Lines text={entry.answer} />
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
