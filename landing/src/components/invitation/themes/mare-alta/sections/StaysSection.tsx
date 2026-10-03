"use client";

import { ExternalLink, Hotel, Luggage, Plane, Shell } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useId, useState } from "react";

import { weddingSpan } from "../../date-range";
import { slot } from "../../text";
import type { InvitationData, Stay } from "../../types";
import { mapsUrl } from "../calendar-url";

import { shortSpan } from "./event-day";

import { Section } from "./Section";
import { RhythmTitle, SectionTitle } from "./SectionTitle";

/**
 * One place to sleep. The designer's card is a grid of icon, distance, name,
 * detail line, deal and a "see the address" button; this one adds what the
 * couple can write on a hotel in the editor: a photograph, a phone number, a
 * booking code.
 *
 * The action opens the hotel's own page when the couple gave one, else a map
 * search for its address, else there is no action at all.
 */
function StayCard({ stay }: { stay: Stay }) {
  const t = useTranslations("Invitation.mareAlta.stays");

  const where = [stay.city, stay.address].filter(Boolean).join(" · ");
  const deal = [stay.offer, stay.bookingCode ? t("code", { code: stay.bookingCode }) : null]
    .filter(Boolean)
    .join(" · ");
  const dial = stay.phone?.replace(/[^\d+]/g, "");
  const href =
    stay.url ?? (stay.address ? mapsUrl({ name: stay.name, address: stay.address, city: stay.city }) : undefined);

  return (
    <div className="ma-stay">
      {stay.image ? (
        // The couple's own photograph, cropped to the card's head by the theme's CSS.
        // eslint-disable-next-line @next/next/no-img-element
        <img className="ma-stay-photo" src={stay.image} alt={stay.name} loading="lazy" />
      ) : null}
      <article className="stay-card">
        <Hotel />
        {stay.distance ? <span>{stay.distance}</span> : null}
        <h3>{stay.name}</h3>
        {where ? <p>{where}</p> : null}
        {deal ? <small>{deal}</small> : null}
        {dial ? (
          <a className="ma-stay-call" href={`tel:${dial}`}>
            {t("call")} · {stay.phone}
          </a>
        ) : null}
        {href ? (
          <a href={href} target="_blank" rel="noreferrer">
            {t("address")} <ExternalLink size={14} />
          </a>
        ) : null}
      </article>
    </div>
  );
}

/**
 * Where to sleep: the embroidered luggage, a line of stamps (the country, the
 * city, the days of the celebration), and the hotels. The ones the couple marked
 * `secondary` wait behind a "more options" button.
 */
export function StaysSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.mareAlta.stays");
  const locale = useLocale();
  const moreId = useId();
  const [showMore, setShowMore] = useState(false);

  // A hotel row the couple has not named yet has nothing to print.
  const stays = (data.stays ?? []).filter((stay) => stay.name.trim());
  if (stays.length === 0) return null;

  const primary = stays.filter((stay) => !stay.secondary);
  const secondary = stays.filter((stay) => stay.secondary);

  const span = weddingSpan(data);
  // Short ("2–4 avr."): the three stamps share one row, as the designer's three single words did.
  const days = span ? shortSpan(span.start, span.end, locale) : null;
  const stamps = [
    { Icon: Plane, text: data.venue.country },
    { Icon: Shell, text: data.venue.city },
    { Icon: Luggage, text: days },
  ].filter((stamp) => stamp.text);

  return (
    <Section id="ma-stays" className="stay night-section" editorSection="accommodation">
      <SectionTitle
        rhythm
        eyebrow={slot(data, "accommodation.eyebrow") ?? t("eyebrow")}
        title={
          <RhythmTitle
            text={slot(data, "accommodation.title") ?? `${t("titleLine1")}\n${t("titleLine2")}`}
            firstClass="title-sans"
            secondClass="title-serif"
          />
        }
        intro={data.copy?.staysIntro}
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative art, sized by CSS. */}
      <img
        className="stay-art"
        src="/themes/mare-alta/embroidered-luggage-sunglasses-v9.webp"
        alt={t("artAlt")}
        loading="lazy"
      />
      {stamps.length > 0 ? (
        <div className="travel-stamps">
          {stamps.map(({ Icon, text }, index) => (
            <span key={`${index}-${text}`}>
              <Icon />
              {/* Its own box, so a long name wraps inside its stamp instead of pushing the row onto two. */}
              <bdi className="ma-stamp-text">{text}</bdi>
            </span>
          ))}
        </div>
      ) : null}
      <div className="stay-grid" id={moreId}>
        {primary.map((stay, index) => (
          <StayCard stay={stay} key={`${index}-${stay.name}`} />
        ))}
        {showMore
          ? secondary.map((stay, index) => <StayCard stay={stay} key={`more-${index}-${stay.name}`} />)
          : null}
      </div>
      {secondary.length > 0 ? (
        <div className="ma-more-row">
          <button
            type="button"
            className="button ghost"
            aria-expanded={showMore}
            aria-controls={moreId}
            onClick={() => setShowMore((open) => !open)}
          >
            {showMore ? t("less") : t("more")}
          </button>
        </div>
      ) : null}
    </Section>
  );
}
