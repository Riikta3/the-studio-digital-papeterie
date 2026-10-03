"use client";

import { useTranslations } from "next-intl";
import { type CSSProperties, useId, useState } from "react";

import { withChildrenPolicyFaq } from "../../faq";
import { Lines, slot } from "../../text";
import type { InvitationData } from "../../types";

import { Art } from "./Art";
import { Section } from "./Section";
import { Title } from "./Title";

/**
 * FAQ — the travel notebook's last page: numbered rows like the stays', each
 * question a button that opens its answer, a handful of shells in the sand
 * under the list.
 *
 * An accordion rather than `<details>`, which snaps open: the answer sits in a
 * `grid-template-rows: 0fr → 1fr` wrapper, the one way to transition to a
 * height the content decides. One answer open at a time, the first at the
 * start; closed answers are `inert` (not `hidden`, which would cut the closing
 * transition), so their links stay out of the tab order. One column at every
 * width.
 *
 * The children question is derived from the wedding's own settings, so the
 * answer can never contradict the RSVP form below it.
 */
export function FaqSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.caboVerde.faq");
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const entries = withChildrenPolicyFaq(data, {
    question: t("childrenQuestion"),
    adultsOnlyAnswer: t("childrenAdultsOnly"),
    childrenWelcomeAnswer: t("childrenWelcome"),
  }).filter((entry) => entry.question.trim());

  if (entries.length === 0) return null;

  return (
    <Section className="cv-faq" editorSection="faq">
      <p className="eyebrow">{slot(data, "faq.eyebrow") ?? t("eyebrow")}</p>
      <Title text={slot(data, "faq.title") ?? `${t("titleLine1")}\n${t("titleLine2")}`} />

      <div className="cv-faq-list">
        {entries.map((entry, index) => {
          const open = openIndex === index;
          const panelId = `${baseId}-panel-${index}`;
          const buttonId = `${baseId}-button-${index}`;

          return (
            <div
              className="cv-faq-item"
              data-open={open || undefined}
              key={`${index}-${entry.question}`}
              style={{ "--i": index } as CSSProperties}
            >
              <h3>
                <button
                  type="button"
                  id={buttonId}
                  className="cv-faq-question"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(open ? null : index)}
                >
                  <span className="cv-faq-number" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="cv-faq-text">{entry.question}</span>
                  <span className="cv-faq-sign" aria-hidden="true">
                    <i />
                  </span>
                </button>
              </h3>
              <div id={panelId} role="region" aria-labelledby={buttonId} className="cv-faq-answer" inert={!open}>
                <div className="cv-faq-answer-inner">
                  <p>
                    <Lines text={entry.answer} />
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Art className="cv-faq-shells" file="faq-shells-v8" />
    </Section>
  );
}
