import { getTranslations } from "next-intl/server";

import type { InvitationData } from "../../types";
import { Reveal } from "../Reveal";
import { Media } from "./Media";

/** Venue, inside the ornate engraved frame (`venue-frame.webp`). */
export async function VenueSection({ data }: { data: InvitationData }) {
  const t = await getTranslations("Invitation.belleRive.venue");
  const { venue, copy } = data;
  const access = venue.access ?? [];

  return (
    <section className="panel venue ornate-venue">
      <div className="venue-content">
        <Reveal>
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2>{venue.name}</h2>
        </Reveal>

        {copy?.venueIntro ? (
          <Reveal delay={35}>
            <p className="venue-intro">{copy.venueIntro}</p>
          </Reveal>
        ) : null}

        {venue.image ? (
          <Reveal delay={70} className="venue-photo">
            <Media src={venue.image} alt={venue.name} />
          </Reveal>
        ) : null}

        {venue.address ? (
          <Reveal delay={140}>
            <p>
              {venue.address.split("\n").map((line, index, lines) => (
                <span key={line}>
                  {line}
                  {index < lines.length - 1 ? <br /> : null}
                </span>
              ))}
            </p>
          </Reveal>
        ) : null}

        {venue.wazeUrl || venue.mapsUrl ? (
          <Reveal delay={210} className="actions">
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
          </Reveal>
        ) : null}
      </div>

      {/* How to get there — the couple's travel directions, by mode.
          Deliberately OUTSIDE `.venue-content`: that div is the engraved frame
          image, sized to its own artwork, and a list of driving directions
          inside it pushes the copy past the engraving. It sits under the frame
          instead, on the panel's own ground.

          `venue.access` has been in the contract from the start and was
          rendered by ciao-amore alone, so on this theme a couple's parking,
          station and shuttle notes reached the page and were dropped. */}
      {access.length > 0 ? (
        <Reveal delay={280}>
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
        </Reveal>
      ) : null}
    </section>
  );
}
