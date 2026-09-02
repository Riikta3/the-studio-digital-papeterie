"use client";

import { useId, useState } from "react";

import { withChildrenPolicyFaq } from "../../faq";
import type { InvitationData } from "../../types";

/**
 * FAQ accordion.
 *
 * The source used native `<details>`, which cannot animate: the browser snaps
 * the panel open. This is a controlled accordion instead, with the answer in a
 * `grid-template-rows: 0fr → 1fr` wrapper — the one way to transition to a
 * height the content decides, without measuring it in JS.
 *
 * One panel at a time: the list is short, and letting several stand open on a
 * wide screen scatters the questions too far apart to scan.
 */
export function FaqSection({ data }: { data: InvitationData }) {
  // The children question is derived from `settings.adults_only` rather than
  // written by hand, so the answer can never contradict the RSVP form above.
  const faq = withChildrenPolicyFaq(data);
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (faq.length === 0) return null;

  return (
    <section className="paper faq-section">
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative, positioned by CSS. */}
      <img
        className="decor decor-faq-lemon"
        src="/themes/ciao-amore/decor/faq-lemon.webp"
        alt=""
        aria-hidden="true"
        loading="lazy"
      />
      <p className="eyebrow">Bon à savoir</p>
      <h2>
        Quelques réponses
        <br />
        avant le grand jour
      </h2>
      <div>
        {faq.map((entry, index) => {
          const open = openIndex === index;
          const panelId = `${baseId}-panel-${index}`;
          const buttonId = `${baseId}-button-${index}`;

          return (
            <div className="ca-faq-item" data-open={open || undefined} key={entry.question}>
              <button
                type="button"
                id={buttonId}
                className="ca-faq-trigger"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIndex(open ? null : index)}
              >
                <span>{entry.question}</span>
                <span className="ca-faq-sign" aria-hidden="true" />
              </button>

              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className="ca-faq-panel"
                // `hidden` would kill the closing transition, so the panel stays
                // in the tree; `inert` keeps its links out of the tab order.
                inert={!open}
              >
                <div className="ca-faq-panel-inner">
                  <p>{entry.answer}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
