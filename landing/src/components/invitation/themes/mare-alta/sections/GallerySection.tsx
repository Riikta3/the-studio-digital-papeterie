"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

import { Reveal } from "../../reveal";
import { slot } from "../../text";
import type { InvitationData } from "../../types";

import { Section } from "./Section";
import { RhythmTitle, SectionTitle } from "./SectionTitle";

/** A horizontal drag longer than this, in CSS pixels, turns the page of the viewer. */
const SWIPE = 48;

/**
 * The couple's photographs, sewn onto the linen: each print sits on an ivory
 * silk mat, held at its four corners by a gold cross-stitch. Every third print
 * runs the width of the column, so a long album reads as a rhythm (one wide,
 * two side by side) rather than a wall of thumbnails. The designer drew no
 * gallery; the mat, the hairline and the gold thread are those of their framed
 * pieces.
 *
 * Each print is laid down as it comes into view, then its stitches are pulled
 * tight onto the corners (`modules.css`). A print opens in a viewer — the whole
 * photograph, uncropped, on a sage ground — that a guest leafs through with the
 * arrows, the keyboard or a swipe.
 */
export function GallerySection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.mareAlta.gallery");
  const [open, setOpen] = useState<number | null>(null);

  const images = (data.gallery?.images ?? []).filter((src) => src.trim());
  if (images.length === 0) return null;

  return (
    <Section id="ma-gallery" className="ma-gallery coral-section" editorSection="gallery">
      <SectionTitle
        rhythm
        eyebrow={slot(data, "gallery.eyebrow") ?? t("eyebrow")}
        title={
          <RhythmTitle
            text={slot(data, "gallery.title") ?? `${t("titleLine1")}\n${t("titleLine2")}`}
            firstClass="title-sans"
            secondClass="title-serif"
          />
        }
      />
      <ul className="ma-prints">
        {images.map((src, index) => (
          // Keyed by position: a photo the couple swaps in the editor takes the place of the old one
          // without laying the print down again.
          <Reveal as="li" className="ma-print-item" revealedClass="ma-laid" threshold={0.2} key={index}>
            <button
              type="button"
              className="ma-print"
              aria-label={t("open", { index: index + 1 })}
              onClick={() => setOpen(index)}
            >
              <span className="ma-print-photo">
                {/* eslint-disable-next-line @next/next/no-img-element -- the couple's photo, cropped to its mat by CSS. */}
                <img src={src} alt="" loading="lazy" />
              </span>
              <i className="ma-print-stitches" aria-hidden="true" />
            </button>
          </Reveal>
        ))}
      </ul>
      <GalleryViewer images={images} index={open} onChange={setOpen} />
    </Section>
  );
}

/**
 * The open photograph, in a modal `<dialog>`: the browser keeps the focus
 * inside it, closes it on Escape and gives the focus back to the print. A click
 * on the ground around the photograph closes it too.
 */
function GalleryViewer({
  images,
  index,
  onChange,
}: {
  images: readonly string[];
  index: number | null;
  onChange: (index: number | null) => void;
}) {
  const t = useTranslations("Invitation.mareAlta.gallery");
  const dialog = useRef<HTMLDialogElement>(null);
  const swipeFrom = useRef<number | null>(null);
  const count = images.length;

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (index !== null && !node.open) node.showModal();
    if (index === null && node.open) node.close();
  }, [index]);

  // The couple removed photos in the editor while one was open: show the last one left.
  const current = index === null ? null : Math.min(index, count - 1);

  function step(by: number) {
    if (current === null) return;
    onChange((current + by + count) % count);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    // "Next" is to the left in a right-to-left page.
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const forward = event.key === (rtl ? "ArrowLeft" : "ArrowRight");
    event.preventDefault();
    step(forward ? 1 : -1);
  }

  function onPointerUp(event: PointerEvent<HTMLElement>) {
    if (swipeFrom.current === null) return;
    const distance = event.clientX - swipeFrom.current;
    swipeFrom.current = null;
    if (Math.abs(distance) < SWIPE || count < 2) return;
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    step((distance < 0) !== rtl ? 1 : -1);
  }

  return (
    <dialog
      ref={dialog}
      className="ma-viewer"
      aria-label={t("viewerLabel")}
      onClose={() => onChange(null)}
      onKeyDown={onKeyDown}
      // Only a click on the ground itself (the dialog), not on the photograph or a button.
      onClick={(event) => {
        if (event.target === event.currentTarget) onChange(null);
      }}
    >
      <button type="button" className="ma-viewer-close" aria-label={t("close")} onClick={() => onChange(null)}>
        <X aria-hidden="true" />
      </button>
      {current !== null ? (
        <figure
          className="ma-viewer-print"
          // A new key per photo: the print settles in again when the guest turns the page.
          key={current}
          onPointerDown={(event) => {
            swipeFrom.current = event.clientX;
            // The release is heard even when the finger slides off the photograph.
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            swipeFrom.current = null;
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- the couple's photo, whole, sized by CSS. */}
          <img src={images[current]} alt={t("imageAlt", { index: current + 1 })} draggable={false} />
          <i className="ma-print-stitches" aria-hidden="true" />
        </figure>
      ) : null}
      {count > 1 && current !== null ? (
        <div className="ma-viewer-bar">
          <button type="button" className="ma-viewer-step" aria-label={t("previous")} onClick={() => step(-1)}>
            <ChevronLeft aria-hidden="true" />
          </button>
          <p className="ma-viewer-count" aria-live="polite">
            <span aria-hidden="true">
              {String(current + 1).padStart(2, "0")}
              <i />
              {String(count).padStart(2, "0")}
            </span>
            <span className="ma-sr-only">{t("counter", { index: current + 1, count })}</span>
          </p>
          <button type="button" className="ma-viewer-step" aria-label={t("next")} onClick={() => step(1)}>
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </dialog>
  );
}
