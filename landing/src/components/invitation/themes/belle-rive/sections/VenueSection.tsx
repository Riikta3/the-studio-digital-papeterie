import { getTranslations } from "next-intl/server";

import type { InvitationData } from "../../types";
import { Reveal } from "../Reveal";
import { Media } from "./Media";

/** Venue, inside the ornate engraved frame (`venue-frame.webp`). */
export async function VenueSection({ data }: { data: InvitationData }) {
  const t = await getTranslations("Invitation.belleRive.venue");
  const { venue } = data;

  return (
    <section className="panel venue ornate-venue">
      <div className="venue-content">
        <Reveal>
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2>{venue.name}</h2>
        </Reveal>

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
    </section>
  );
}
