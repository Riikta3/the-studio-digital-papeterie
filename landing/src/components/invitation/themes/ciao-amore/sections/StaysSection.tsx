"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

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
    <section className="paper stays-section">
      <span className="hotel-key" aria-hidden="true">
        {(data.venue.city ?? data.venue.name).toUpperCase()}
        <br />
        <b>CAMERA 01</b>
      </span>
      <p className="eyebrow">{data.copy?.staysIntro ?? t("eyebrowFallback")}</p>
      <h2>{t("title")}</h2>

      <div className="hotels">
        {primary.map((stay) => {
          const body = (
            <>
              {/* "À proximité de la Villa" was printed on every card — the
                  demo's Villa Cimbrone, announced beside the hotels of a
                  wedding held anywhere else. The venue's own name is used when
                  there is one, and the line is dropped when there is not. */}
              {data.venue.name ? <span>{t("nearVenue", { venueName: data.venue.name })}</span> : null}
              <h3>{stay.name}</h3>
              {stay.distance ? <p>{stay.distance}</p> : null}
              {stay.address ? <small>{stay.address}</small> : null}
            </>
          );

          return stay.url ? (
            <a href={stay.url} target="_blank" rel="noreferrer" key={stay.name}>
              {body}
            </a>
          ) : (
            // Keep the same box when a stay has no link to point at.
            <div key={stay.name}>{body}</div>
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
              {secondary.map((stay) => (
                <p key={stay.name}>
                  {stay.name}
                  {stay.distance ? ` · ${stay.distance}` : ""}
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
