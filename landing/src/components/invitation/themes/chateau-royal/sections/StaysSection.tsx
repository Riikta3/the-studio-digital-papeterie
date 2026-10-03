"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import { Reveal } from "../../reveal";
import { Lines, slot } from "../../text";
import type { InvitationData, Stay } from "../../types";

/** The small ornament that opens a card without a photograph — the night first. */
const ORNAMENTS = ["☽", "✦", "❦", "✧", "❧", "⌖"];

/**
 * One place to sleep, as a card of the "small details" grid: the ornament (or
 * the hotel's photograph in an arch like the venue's), the distance, the name,
 * where it is, the couple's deal and code, and the ways to book.
 */
function StayCard({ stay, ornament, col }: { stay: Stay; ornament: number; col: number }) {
  const t = useTranslations("Invitation.chateauRoyal.stays");

  const where = [stay.city, stay.address].filter(Boolean).join(" · ");
  const dial = stay.phone?.replace(/[^\d+]/g, "");

  return (
    <Reveal
      as="div"
      className="practical-item reveal cr-stay"
      revealedClass="visible"
      threshold={0.12}
      // Cards side by side on one row arrive one after the other.
      data-col={String(col % 3)}
    >
      {stay.image ? (
        <div className="cr-stay-arch">
          {/* eslint-disable-next-line @next/next/no-img-element -- the couple's own photograph, cropped by the arch. */}
          <img src={stay.image} alt={stay.name} loading="lazy" />
        </div>
      ) : (
        <span className="practical-ornament" aria-hidden="true">
          {ORNAMENTS[ornament % ORNAMENTS.length]}
        </span>
      )}
      {stay.distance ? <span className="cr-stay-distance">{stay.distance}</span> : null}
      <h3>{stay.name}</h3>
      {where ? <p>{where}</p> : null}
      {stay.offer ? <p className="cr-stay-offer">{stay.offer}</p> : null}
      {stay.bookingCode ? (
        <p className="cr-stay-code">{t("code", { code: stay.bookingCode })}</p>
      ) : null}
      {dial || stay.url ? (
        <div className="cr-stay-links">
          {dial ? (
            <a href={`tel:${dial}`}>
              {t("call")} · <span className="cr-nowrap">{stay.phone}</span>
            </a>
          ) : null}
          {stay.url ? (
            <a href={stay.url} target="_blank" rel="noreferrer">
              {t("book")} <span aria-hidden="true">↗</span>
            </a>
          ) : null}
        </div>
      ) : null}
    </Reveal>
  );
}

/**
 * Where to sleep: the hotels as cards in the language of "Les petits détails",
 * which this section follows. The ones the couple set aside (`secondary`) wait
 * behind a "more options" button and arrive one after the other when it opens.
 *
 * Renders nothing without a named hotel.
 */
export function StaysSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.chateauRoyal.stays");
  const moreId = useId();
  const [open, setOpen] = useState(false);

  // A hotel row the couple has not named yet has nothing to print.
  const stays = (data.stays ?? []).filter((stay) => stay.name.trim());
  if (stays.length === 0) return null;

  const primary = stays.filter((stay) => !stay.secondary);
  const secondary = stays.filter((stay) => stay.secondary);
  const intro = data.copy?.staysIntro?.trim();

  return (
    <section className="practical cr-stays" id="cr-stays" data-editor-section="accommodation">
      <Reveal as="div" className="section-heading reveal" revealedClass="visible" threshold={0.12}>
        <span className="section-eyebrow">{slot(data, "accommodation.eyebrow") ?? t("eyebrow")}</span>
        <h2>
          <Lines text={slot(data, "accommodation.title") ?? t("title")} />
        </h2>
        {intro ? <p>{intro}</p> : null}
      </Reveal>

      {primary.length > 0 ? (
        <div className="practical-grid">
          {primary.map((stay, index) => (
            <StayCard stay={stay} ornament={index} col={index} key={`${index}-${stay.name}`} />
          ))}
        </div>
      ) : null}

      {secondary.length > 0 ? (
        <>
          <div className="cr-stays-toggle">
            <button
              type="button"
              aria-expanded={open}
              aria-controls={moreId}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? t("less") : t("more")} <span aria-hidden="true">✦</span>
            </button>
          </div>
          <div className="practical-grid cr-stays-more" id={moreId}>
            {open
              ? secondary.map((stay, index) => (
                  <StayCard
                    stay={stay}
                    ornament={primary.length + index}
                    col={index}
                    key={`more-${index}-${stay.name}`}
                  />
                ))
              : null}
          </div>
        </>
      ) : null}
    </section>
  );
}
