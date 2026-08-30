"use client";

import { useId, useState } from "react";

import type { InvitationData } from "../../types";

import { Page } from "./Page";

/**
 * FAQ accordion.
 *
 * The source used native `<details>` with a `summary::marker` of "＋"/"−".
 * A native disclosure cannot be transitioned — the browser snaps the panel
 * open — so this is a controlled accordion instead, with the answer wrapped in
 * a `grid-template-rows: 0fr → 1fr` container. That is the one way to animate
 * to a height the content decides without measuring it in JS.
 *
 * The look is unchanged: hairline rules, the Italiana question, and a "+" that
 * rotates into a "×". The sign is drawn from two pseudo-elements in CSS rather
 * than typed, because a text glyph cannot be rotated cleanly between states.
 *
 * One panel at a time: the list is short, and letting several stand open
 * scatters the questions too far apart to scan.
 */
export function FaqSection({ data, side }: { data: InvitationData; side: "left" | "right" }) {
  const faq = data.faq ?? [];
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (faq.length === 0) return null;

  return (
    <Page className="soft-floral-paper faq-page" side={side}>
      <p className="script">Bon à savoir</p>
      <h2>
        Questions
        <br />
        fréquentes
      </h2>
      <div className="faq">
        {faq.map((entry, index) => {
          const open = openIndex === index;
          const panelId = `${baseId}-panel-${index}`;
          const buttonId = `${baseId}-button-${index}`;

          return (
            <div className="bc-faq-item" data-open={open || undefined} key={entry.question}>
              <button
                type="button"
                id={buttonId}
                className="bc-faq-trigger"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIndex(open ? null : index)}
              >
                <span className="bc-faq-sign" aria-hidden="true" />
                <span>{entry.question}</span>
              </button>

              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className="bc-faq-panel"
                // `hidden` would kill the closing transition, so the panel stays
                // in the tree; `inert` keeps its content out of the tab order.
                inert={!open}
              >
                <div className="bc-faq-panel-inner">
                  <p>{entry.answer}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Page>
  );
}
