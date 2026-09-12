import { getTranslations } from "next-intl/server";

import type { InvitationData } from "../../types";

/**
 * Venue card: name, photograph, address, the two route links, and how to get
 * there.
 *
 * `venue.access` has been in the contract from the start and was rendered by
 * no theme at all, so a couple's travel directions — the parking, the station,
 * the shuttle times — reached the invitation and were dropped. It is the
 * answer to the question guests ask first.
 */
export async function VenueSection({ data }: { data: InvitationData }) {
  const t = await getTranslations("Invitation.ciaoAmore.venue");
  const { venue, copy } = data;
  const access = venue.access ?? [];

  return (
    <section className="venue-section">
      <div className="venue-frame">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h2>{venue.name}</h2>

        {copy?.venueIntro ? <p className="venue-intro">{copy.venueIntro}</p> : null}

        {venue.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- framed by the theme's CSS.
          <img src={venue.image} alt={venue.name} loading="lazy" />
        ) : null}

        {venue.address ? (
          <p>
            {venue.address.split("\n").map((line, index, lines) => (
              <span key={line}>
                {line}
                {index < lines.length - 1 ? <br /> : null}
              </span>
            ))}
          </p>
        ) : null}

        {venue.wazeUrl || venue.mapsUrl ? (
          <div className="buttons">
            {venue.wazeUrl ? (
              <a href={venue.wazeUrl} target="_blank" rel="noreferrer">
                {t("wazeLink")}
              </a>
            ) : null}
            {venue.mapsUrl ? (
              <a href={venue.mapsUrl} target="_blank" rel="noreferrer">
                {t("mapsLink")}
              </a>
            ) : null}
          </div>
        ) : null}

        {access.length > 0 ? (
          <dl className="venue-access">
            {access.map((entry) => (
              <div key={entry.mode}>
                <dt>{entry.mode}</dt>
                {entry.details.map((detail) => (
                  <dd key={detail}>
                    {/* A carpool entry carries its link as a detail line, so a
                        URL is rendered as one rather than printed raw. */}
                    {/^https?:\/\//.test(detail) ? (
                      <a href={detail} target="_blank" rel="noreferrer">
                        {detail.replace(/^https?:\/\//, "")}
                      </a>
                    ) : (
                      detail
                    )}
                  </dd>
                ))}
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </section>
  );
}
