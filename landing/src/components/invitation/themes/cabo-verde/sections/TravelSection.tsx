import { useLocale, useTranslations } from "next-intl";
import type { CSSProperties } from "react";

import { slot } from "../../text";
import type { InvitationData } from "../../types";

import { shortDate } from "../dates";
import { Art } from "./Art";
import { Section } from "./Section";

/**
 * A value's size and place on the pass, in container units (`cqw`).
 *
 * The designer set his eleven-letter destination at `size`; a longer text steps down so that it
 * still fits its `room` on one line (`em` is the average width of a letter,
 * tracking included) and is never smaller than `min`. The text is anchored by
 * its baseline, which stays where the designer's was whatever the size. Past
 * `min` the stylesheet's ellipsis takes over.
 */
function fitted(
  text: string,
  { size, min, room, em, baseline }: { size: number; min: number; room: number; em: number; baseline: number },
): CSSProperties {
  const letters = Math.max(1, [...text].length);
  const fontSize = Math.max(min, Math.min(size, room / (letters * em)));
  return { fontSize: `${fontSize.toFixed(2)}cqw`, top: `${(baseline - 0.9875 * fontSize).toFixed(2)}cqw` };
}

/**
 * The boarding pass. Its words — destination, date, country — are HTML laid over
 * `travel-boarding-pass-v12.webp`, not part of the picture: the designer's file
 * had his own wedding's town and day drawn into it, and the leak test cannot
 * read inside an image. The WebP was cleaned of that text on purpose; do not put
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
  // The calendar day written in `startsAt`, not the instant: an instant prints a
  // different day on a server in UTC and in a browser far west of it.
  const date = shortDate(data.event.startsAt.slice(0, 10), locale);

  return (
    <div className="travel-ticket cv-ticket">
      <div className="cv-ticket-art">
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative, positioned and animated by CSS. */}
        <img className="cv-ticket-img" src="/themes/cabo-verde/travel-boarding-pass-v12.webp" alt="" loading="lazy" />
        <div className="cv-ticket-text">
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
        <Art className="travel-passport" file="travel-passport-v12" />
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
