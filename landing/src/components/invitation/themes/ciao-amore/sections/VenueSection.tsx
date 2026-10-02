import { useTranslations } from "next-intl";

import { slot } from "../../text";
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
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function VenueSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.ciaoAmore.venue");
  const { venue, copy } = data;
  const access = venue.access ?? [];

  // The city is its own field in the editor's venue tab and was printed
  // everywhere but here. Added after the address, unless the address already
  // closes on it as a locality — "13090 Aix-en-Provence", "…, Lourmarin". A
  // road named after the town ("Route de Lourmarin") is not the town.
  const addressLines = venue.address ? venue.address.split("\n") : [];
  const lastLine = addressLines[addressLines.length - 1]?.trim().toLowerCase() ?? "";
  const city = venue.city?.trim().toLowerCase() ?? "";
  const cityWritten =
    Boolean(city) && (lastLine.endsWith(`, ${city}`) || new RegExp(`\\d\\s+${escapeRegExp(city)}$`).test(lastLine));
  const lines = venue.city && !cityWritten ? [...addressLines, venue.city] : addressLines;

  return (
    <section className="venue-section" data-editor-section="map">
      <div className="venue-frame">
        <p className="eyebrow">{slot(data, "map.eyebrow") ?? t("eyebrow")}</p>
        <h2>{venue.name}</h2>

        {copy?.venueIntro ? <p className="venue-intro">{copy.venueIntro}</p> : null}

        {venue.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- framed by the theme's CSS.
          <img src={venue.image} alt={venue.name} loading="lazy" />
        ) : null}

        {lines.length > 0 ? (
          <p>
            {lines.map((line, index) => (
              <span key={`${index}-${line}`}>
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
          // The directions are the transport tab's in the editor, even though
          // they sit inside the venue: a click here opens that tab.
          <dl className="venue-access" data-editor-section="transport">
            {access.map((entry, entryIndex) => (
              <div key={`${entryIndex}-${entry.mode}`}>
                <dt>{entry.mode}</dt>
                {entry.details.map((detail, index) => (
                  <dd key={`${index}-${detail}`}>
                    {/* A couple may paste a link into their directions: it is
                        rendered as one rather than printed raw. */}
                    {/^https?:\/\//.test(detail) ? (
                      <a href={detail} target="_blank" rel="noreferrer">
                        {detail.replace(/^https?:\/\//, "")}
                      </a>
                    ) : (
                      detail
                    )}
                  </dd>
                ))}
                {entry.link ? (
                  <dd>
                    <a href={entry.link.url} target="_blank" rel="noreferrer">
                      {entry.link.label || entry.link.url.replace(/^https?:\/\//, "")}
                    </a>
                  </dd>
                ) : null}
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </section>
  );
}
