"use client";

import { useId, useState } from "react";

import type { InvitationData } from "../../types";

/**
 * FAQ accordion.
 *
 * Kept as buttons rather than `<details>` because the source's design opens one
 * panel at a time, and because a native disclosure cannot be transitioned — the
 * browser snaps it open. `aria-expanded` and `aria-controls` carry the state the
 * native element would have provided.
 *
 * The answer lives in a `grid-template-rows: 0fr → 1fr` wrapper (styled in
 * `responsive.css`), which is the one way to animate to a height the content
 * decides without measuring it in JS. The panel therefore stays mounted while
 * closed — `hidden` would kill the closing transition — and `inert` keeps its
 * text out of the tab order and the accessibility tree meanwhile.
 *
 * The "+" that becomes a "×" is drawn from two pseudo-elements rather than typed
 * as a character, so it can rotate rather than swap glyphs mid-animation.
 *
 * Answers contain literal newlines (the travel questions are bullet lists), so
 * they are rendered with `white-space: pre-line`.
 */
export function FaqSection({ data }: { data: InvitationData }) {
  const faq = data.faq ?? [];
  // `useId` rather than a bare index: two invitations can be mounted at once in
  // the studio's live preview, and duplicate ids would cross-wire their panels.
  const baseId = useId();
  // The source opened the first entry by default; matching that keeps the panel
  // from looking like an inert list of headings.
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (faq.length === 0) return null;

  return (
    <section className="panel faq pearled">
      <p className="eyebrow">FAQ</p>
      <h2>Quelques réponses utiles</h2>

      <div className="faq-list">
        {faq.map((entry, index) => {
          const open = openIndex === index;
          const panelId = `${baseId}-panel-${index}`;
          const buttonId = `${baseId}-button-${index}`;

          return (
            <div className="q" data-open={open || undefined} key={entry.question}>
              <button
                type="button"
                id={buttonId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIndex(open ? null : index)}
              >
                <span>{entry.question}</span>
                <span className="q-sign" aria-hidden="true" />
              </button>

              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className="q-panel"
                inert={!open}
              >
                <div className="q-panel-inner">
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
