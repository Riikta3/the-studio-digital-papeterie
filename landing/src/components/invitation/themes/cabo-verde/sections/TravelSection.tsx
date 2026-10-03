import { useLocale, useTranslations } from "next-intl";
import type { CSSProperties } from "react";

import { monogramOf } from "../../monogram";
import { slot } from "../../text";
import type { InvitationData } from "../../types";

import { shortDate } from "../dates";
import { Art } from "./Art";
import { Section } from "./Section";

type Fit = { size: number; min: number; room: number; em: number };

/**
 * A word's size in container units (`cqw`): the designer's `size` for his own
 * word, stepped down for a longer one so that it still fits its `room` on one
 * line (`em` is the average width of a letter, tracking included), never under
 * `min`. Past `min` the stylesheet's ellipsis takes over.
 */
function fitSize(text: string, { size, min, room, em }: Fit): number {
  const letters = Math.max(1, [...text].length);
  return Math.max(min, Math.min(size, room / (letters * em)));
}

/**
 * A value's size and place on the art, in container units: sized by `fitSize`
 * and anchored by its baseline, which stays where the designer's was whatever
 * the size (Times, line-height 1.3).
 */
function fitted(text: string, fit: Fit & { baseline: number }): CSSProperties {
  const fontSize = fitSize(text, fit);
  return { fontSize: `${fontSize.toFixed(2)}cqw`, top: `${(fit.baseline - 0.9875 * fontSize).toFixed(2)}cqw` };
}

/** The wedding's place in capitals: the country, else the town. */
function placeOf(data: InvitationData, locale: string): string {
  return (data.venue.country?.trim() || data.venue.city?.trim() || "").toLocaleUpperCase(locale);
}

/**
 * The passport. The designer's cover named his wedding's country three times —
 * a title, a national emblem lettered round its ring, and the word for passport
 * in its language — so every couple's notebook would have carried it. The
 * picture (`travel-passport-v12.webp`) was cleaned of all three on purpose (do
 * not put the original back); what the cover says is HTML laid over it, in the
 * art's own gold: the couple's country (else their town), a seal holding their
 * monogram where the emblem was, and the theme's word for passport (a slot).
 * Placed and sized in container units, like the boarding pass.
 */
function Passport({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.caboVerde.travel");
  const locale = useLocale();

  const place = placeOf(data, locale);
  const word = (slot(data, "transport.passport") ?? t("passport")).toLocaleUpperCase(locale);
  const monogram = monogramOf(data.couple, "&");

  return (
    <div className="travel-passport cv-passport">
      <div className="cv-passport-art">
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative, positioned and animated by CSS. */}
        <img className="cv-passport-img" src="/themes/cabo-verde/travel-passport-v12.webp" alt="" loading="lazy" />
        <div className="cv-passport-text">
          {place ? (
            <span
              className="cv-passport-place"
              style={fitted(place, { size: 6.4, min: 3.2, room: 46, em: 0.78, baseline: 47.1 })}
            >
              {place}
            </span>
          ) : null}
          <span className="cv-passport-seal">
            <span style={{ fontSize: `${fitSize(monogram, { size: 7.2, min: 3.4, room: 19, em: 0.62 }).toFixed(2)}cqw` }}>
              {monogram}
            </span>
          </span>
          <span
            className="cv-passport-word"
            style={fitted(word, { size: 5.2, min: 2.6, room: 44, em: 0.78, baseline: 112 })}
          >
            {word}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * The boarding pass. Its words — destination, date, country, the place up the
 * blue band, the airline on the stub and the passenger's initials under it —
 * are HTML laid over `travel-boarding-pass-v12.webp`, not part of the picture:
 * the designer's file had his own wedding's town, day and country drawn into
 * it (and an English tagline in two places), and the leak test cannot read
 * inside an image. The WebP was cleaned of that text on purpose; do not put
 * the original back. The overlay is placed in percentages of the picture and
 * sized in container units (`cqw`), so it scales with it at every width.
 *
 * A row with nothing to say (a venue with no country) is not drawn, its label
 * with it. The whole pass is decoration: the section stays `aria-hidden`.
 */
function BoardingPass({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.caboVerde.travel");
  const locale = useLocale();

  const destination = (data.venue.city?.trim() || data.venue.name?.trim() || "").toLocaleUpperCase(locale);
  const country = (data.venue.country?.trim() ?? "").toLocaleUpperCase(locale);
  const place = placeOf(data, locale);
  const airline = (slot(data, "transport.airline") ?? t("airline")).toLocaleUpperCase(locale);
  const monogram = monogramOf(data.couple, " & ");
  // The calendar day written in `startsAt`, not the instant: an instant prints a
  // different day on a server in UTC and in a browser far west of it.
  const date = shortDate(data.event.startsAt.slice(0, 10), locale);

  return (
    <div className="travel-ticket cv-ticket">
      <div className="cv-ticket-art">
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative, positioned and animated by CSS. */}
        <img className="cv-ticket-img" src="/themes/cabo-verde/travel-boarding-pass-v12.webp" alt="" loading="lazy" />
        <div className="cv-ticket-text">
          {place ? (
            <span
              className="cv-ticket-band"
              style={{ fontSize: `${fitSize(place, { size: 1.2, min: 0.75, room: 15.5, em: 1.25 }).toFixed(2)}cqw` }}
            >
              {place}
            </span>
          ) : null}
          <span className="cv-ticket-airline">{airline}</span>
          {monogram ? <span className="cv-ticket-passenger">{monogram}</span> : null}
          {destination ? (
            <>
              <span className="cv-ticket-label cv-ticket-label-destination">{t("ticketDestination")}</span>
              <span
                className="cv-ticket-value cv-ticket-destination"
                style={fitted(destination, { size: 4.95, min: 2.5, room: 36, em: 0.655, baseline: 19.95 })}
              >
                {destination}
              </span>
              <i className="cv-ticket-rule" />
            </>
          ) : null}
          {date ? (
            <>
              <span className="cv-ticket-label cv-ticket-label-date">{t("ticketDate")}</span>
              <span
                className="cv-ticket-value cv-ticket-date"
                style={fitted(date, { size: 2.4, min: 1.7, room: 31, em: 0.714, baseline: 29.29 })}
              >
                {date}
              </span>
            </>
          ) : null}
          {country ? (
            <>
              <span className="cv-ticket-label cv-ticket-label-country">{t("ticketCountry")}</span>
              <span
                className="cv-ticket-value cv-ticket-country"
                style={fitted(country, { size: 2.4, min: 1.7, room: 22, em: 0.74, baseline: 36.28 })}
              >
                {country}
              </span>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Travel notebook — a passport, a boarding pass and a plane, then one numbered
 * card per way of getting there (`venue.access`: the transport tab's modes and
 * the venue tab's practical information alike).
 *
 * A section with nothing to say renders nothing, not an empty notebook.
 */
export function TravelSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.caboVerde.travel");
  const access = data.venue.access ?? [];
  if (access.length === 0) return null;

  return (
    <Section className="practical decorated" editorSection="transport">
      <div className="travel-scene" aria-hidden="true">
        <Passport data={data} />
        <BoardingPass data={data} />
        <Art className="travel-plane" file="travel-plane-v12" />
      </div>
      <p className="eyebrow cobalt">{slot(data, "transport.eyebrow") ?? t("eyebrow")}</p>
      <h2 className="motion-title">{slot(data, "transport.title") ?? t("title")}</h2>

      <div className="practical-grid">
        {access.map((entry, index) => (
          <article key={`${index}-${entry.mode}`}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h3>{entry.mode}</h3>
            {entry.details.map((detail, detailIndex) => (
              <p key={`${detailIndex}-${detail}`}>
                {/* A couple may paste a link into their directions: it is a link, not raw text. */}
                {/^https?:\/\//.test(detail) ? (
                  <a href={detail} target="_blank" rel="noreferrer">
                    {detail.replace(/^https?:\/\//, "")}
                  </a>
                ) : (
                  detail
                )}
              </p>
            ))}
            {entry.link ? (
              <p>
                <a href={entry.link.url} target="_blank" rel="noreferrer">
                  {entry.link.label || t("open")}
                </a>
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </Section>
  );
}
