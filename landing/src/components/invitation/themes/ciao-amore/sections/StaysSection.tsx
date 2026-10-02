"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { slot } from "../../text";
import type { InvitationData } from "../../types";

/**
 * Accommodation. The primary stays are cards; the ones flagged `secondary`
 * sit behind a "voir plus d'options" toggle, as in the source.
 */
export function StaysSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.ciaoAmore.stays");
  const [showMore, setShowMore] = useState(false);

  const stays = data.stays ?? [];
  const primary = stays.filter((stay) => !stay.secondary);
  const secondary = stays.filter((stay) => stay.secondary);

  if (stays.length === 0) return null;

  return (
    <section className="paper stays-section" data-editor-section="accommodation">
      <span className="hotel-key" aria-hidden="true">
        {(data.venue.city ?? data.venue.name).toUpperCase()}
        <br />
        <b>{slot(data, "accommodation.tag") ?? t("keyTag")}</b>
      </span>
      <p className="eyebrow">{data.copy?.staysIntro ?? t("eyebrowFallback")}</p>
      <h2>{slot(data, "accommodation.title") ?? t("title")}</h2>

      <div className="hotels">
        {primary.map((stay, index) => {
          // Everything the couple wrote on the hotel's card in the editor —
          // its city, phone, offer and photo were collected and never shown.
          const where = [stay.distance, stay.city].filter(Boolean).join(" · ");
          const body = (
            <>
              {stay.image ? (
                // The couple's upload, cropped to the card's head by the theme's CSS.
                // eslint-disable-next-line @next/next/no-img-element
                <img className="ca-stay-photo" src={stay.image} alt={stay.name} loading="lazy" />
              ) : null}
              {/* "À proximité de la Villa" was printed on every card — the
                  demo's Villa Cimbrone, announced beside the hotels of a
                  wedding held anywhere else. The venue's own name is used when
                  there is one, and the line is dropped when there is not. */}
              {data.venue.name ? <span>{t("nearVenue", { venueName: data.venue.name })}</span> : null}
              <h3>{stay.name}</h3>
              {where ? <p>{where}</p> : null}
              {stay.address ? <small>{stay.address}</small> : null}
              {stay.phone ? <small className="ca-stay-phone">{stay.phone}</small> : null}
              {stay.offer ? <em className="ca-stay-offer">{stay.offer}</em> : null}
            </>
          );

          // Two hotels may share a name while the couple is still typing.
          const key = `${index}-${stay.name}`;
          return stay.url ? (
            <a href={stay.url} target="_blank" rel="noreferrer" key={key}>
              {body}
            </a>
          ) : (
            // Keep the same box when a stay has no link to point at.
            <div key={key}>{body}</div>
          );
        })}
      </div>

      {secondary.length > 0 ? (
        <>
          <button
            type="button"
            className="more"
            onClick={() => setShowMore((open) => !open)}
            aria-expanded={showMore}
          >
            {showMore ? t("hideOptions") : t("showMoreOptions")}
          </button>
          {showMore ? (
            <div className="more-list">
              {secondary.map((stay, index) => (
                <p key={`${index}-${stay.name}`}>
                  {stay.url ? (
                    <a href={stay.url} target="_blank" rel="noreferrer">
                      {stay.name}
                    </a>
                  ) : (
                    stay.name
                  )}
                  {[stay.distance, stay.city].filter(Boolean).map((part) => ` · ${part}`)}
                  {stay.address ? <small>{stay.address}</small> : null}
                  {stay.phone ? <small>{stay.phone}</small> : null}
                  {stay.offer ? <small className="ca-stay-offer-line">{stay.offer}</small> : null}
                </p>
              ))}
            </div>
          ) : null}
        </>
      ) : null}

      {/* eslint-disable-next-line @next/next/no-img-element -- decorative, positioned by CSS. */}
      <img
        className="dolce-suitcase"
        src="/themes/ciao-amore/decor/dolce-vita-luggage-set.webp"
        alt=""
        aria-hidden="true"
        loading="lazy"
      />
    </section>
  );
}
