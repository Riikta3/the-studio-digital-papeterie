"use client";

import { cn } from "@shared/lib/utils";
import { ChevronDown, Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";

import { FadeIn } from "./FadeIn";

type FaqItem = {
  question: string;
  answer: string;
};

/**
 * How many questions are on screen before the visitor asks for the rest.
 *
 * Six fills the column without turning the section into a wall of twelve
 * identical cards. The other six stay in the served HTML — see the render
 * below — so this is a layout decision, not a content one.
 */
const VISIBLE_COUNT = 6;

export function Faq() {
  const t = useTranslations("Faq");
  const faqs = t.raw("items") as FaqItem[];
  // All panels start closed: at twelve items an open first answer pushed the
  // rest of the list below the fold before the visitor had asked anything.
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const hiddenCount = Math.max(0, faqs.length - VISIBLE_COUNT);

  return (
    <section id="faq" className="relative overflow-hidden bg-studio-creme px-6 py-20 md:px-12">
      <Image
        src="/images/leaf-bottom-lavande.svg"
        alt=""
        width={106}
        height={188}
        className="pointer-events-none absolute -bottom-6 left-0 h-auto w-24 rotate-90 md:w-32"
      />

      <FadeIn className="mx-auto mb-14 max-w-3xl text-center">
        <div className="flex items-center justify-center gap-3 font-body text-h5 tracking-luxe text-studio-pourpre">
          <Image
            src="/images/eyebrow-separator-left.svg"
            alt=""
            width={42}
            height={1}
          />
          <span>{t("eyebrow")}</span>
          <Image
            src="/images/eyebrow-separator-right.svg"
            alt=""
            width={42}
            height={1}
          />
        </div>
        <h2 className="mt-4 font-heading text-h1 text-studio-violet">
          {t("titleLine1")}
          <br />
          <span className="text-studio-lavande">{t("titleAccent")}</span>
        </h2>
      </FadeIn>

      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          const panelId = `faq-panel-${index}`;
          const buttonId = `faq-button-${index}`;
          // Beyond the sixth, a card is rendered but hidden until the visitor
          // asks for it.
          //
          // EVERY question and answer is in the served HTML either way — this
          // is `hidden`, not a slice of the array. That is deliberate and load
          // bearing: the answers are the section's whole SEO value (~3,900
          // characters of long-tail copy in French alone), and Google indexes
          // what the HTML contains, not what the viewport shows. Rendering
          // only the first six — `faqs.slice(0, VISIBLE_COUNT)`, a conditional
          // return, or fetching the rest on click — would delete two thirds of
          // that from the page. Collapsing it costs nothing.
          //
          // `hidden` rather than `opacity-0`: it removes the card from the
          // accessibility tree AND from the tab order, so a keyboard user does
          // not tab through six invisible accordion buttons.
          const isHidden = !showAll && index >= VISIBLE_COUNT;
          return (
            // `key` is the index, not the question: the open/closed state is
            // itself index-based, so a content-derived key would let an editor
            // reordering the locale JSON move the open panel to a different
            // question. The list is static, so there is nothing to reconcile.
            //
            // The stagger is capped at 5 steps (0.25s). Each card is its own
            // IntersectionObserver target, so the delay is counted from when
            // that card scrolls into view — uncapped, `index * 0.05` made the
            // twelfth card sit visibly blank for 0.55s after it was already
            // on screen, which reads as lag rather than choreography.
            <FadeIn
              key={index}
              delay={Math.min(index, 5) * 0.05}
              hidden={isHidden}
            >
              <div className="overflow-hidden rounded-2xl border border-studio-lavande/40 bg-white">
                <h3>
                  <button
                    type="button"
                    id={buttonId}
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="flex w-full items-center justify-between gap-4 p-6 text-start"
                  >
                    <span className="font-heading text-lg text-studio-violet md:text-xl">
                      {faq.question}
                    </span>
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-studio-lavande text-studio-violet transition-colors",
                        isOpen && "bg-studio-lavande text-studio-violet",
                      )}
                    >
                      {isOpen ? (
                        <Minus className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </span>
                  </button>
                </h3>

                {/* Animated with max-height + opacity rather than
                    framer-motion's `height: auto`. `grid-template-rows:
                    1fr/0fr` was tried first and does not work here: the row
                    stayed collapsed at 0px because this container has no
                    height of its own to distribute. A generous max-height cap
                    is the reliable option — the transition is CSS-only, so
                    framer-motion is no longer needed for the accordion.

                    The cap is 56rem (896px), up from 40rem. Measured by
                    wrapping every locale's longest answer against the real
                    Urbanist advance widths at the narrowest layout that
                    actually occurs — a 320px viewport, where the section and
                    the <p> each contribute px-6 and leave a 224px text
                    column, not the 272px the card is wide — the tallest panel
                    is Portuguese at ~365px (15 lines), ahead of French and
                    Spanish at ~343px. So nothing in this set clips at either
                    cap; 40rem already had ~275px spare. The increase buys
                    room for future copy and translation drift (a single
                    answer would have to reach roughly 38 mobile lines,
                    ~1,200 characters, to clip 56rem).

                    The trade-off is real but small: `max-height` interpolates
                    over the declared range rather than the content height, so
                    the visible motion finishes early and the rest of the
                    300ms is dead time — about 180ms of it for a 365px panel
                    at this cap. That is perceptible as a slightly soft finish
                    if you look for it, and it is the price of a fixed cap.
                    If it ever needs to be exact, animate a measured
                    scrollHeight and set `maxHeight: none` on transitionend
                    (still CSS-only, still no framer-motion); that was judged
                    not worth the ref-per-panel complexity at this scale.

                    `visibility` is transitioned alongside: max-height 0 plus
                    opacity 0 hides a panel visually but leaves its text in the
                    accessibility tree and its links in the tab order. That
                    matters now the answers are long, and will matter more once
                    internal links go into them. `visibility: hidden` prunes
                    both; it is delayed by the transition duration on close so
                    the collapse remains visible, and applied immediately on
                    open. */}
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  style={{
                    maxHeight: isOpen ? "56rem" : 0,
                    opacity: isOpen ? 1 : 0,
                    visibility: isOpen ? "visible" : "hidden",
                    transitionProperty: "max-height, opacity, visibility",
                  }}
                >
                  <p className="px-6 pb-6 pt-0 font-body text-sm leading-relaxed text-studio-violet/70 md:text-base">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </FadeIn>
          );
        })}

        {/* Rendered only when there is something to reveal, so a shorter
            translated `items` array cannot leave a button that does nothing. */}
        {hiddenCount > 0 && (
          <FadeIn delay={0.3} className="mt-2 text-center">
            <button
              type="button"
              onClick={() => {
                // Collapsing while one of the hidden answers is the open one
                // would leave that panel expanded behind `[hidden]`, so
                // reopening the list would show an answer the visitor did not
                // just ask for. Close it on the way in.
                if (showAll && openIndex !== null && openIndex >= VISIBLE_COUNT) {
                  setOpenIndex(null);
                }
                setShowAll((v) => !v);
              }}
              aria-expanded={showAll}
              className="inline-flex items-center gap-2 rounded-full border border-studio-lavande px-6 py-3 font-body text-sm tracking-luxe text-studio-violet transition-colors hover:bg-studio-lavande/20"
            >
              <span>
                {showAll ? t("showLess") : t("showMore", { count: hiddenCount })}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-300",
                  showAll && "rotate-180",
                )}
              />
            </button>
          </FadeIn>
        )}
      </div>
    </section>
  );
}
