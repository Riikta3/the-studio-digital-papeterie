import { useTranslations } from "next-intl";

import { cssString, slot } from "../../text";
import type { InvitationData } from "../../types";

import { mapsUrl } from "../maps-url";
import { Art } from "./Art";
import { Section } from "./Section";

/**
 * Venue — a painted ceremony in an ellipse, the venue's card over it.
 *
 * The stylesheet draws the ceremony art as the ellipse's background; the
 * couple's own photograph replaces it as soon as there is one (the card and the
 * ellipse keep their shape and filter).
 */
export function VenueSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.caboVerde.venue");
  const { venue, copy } = data;
  const location = [venue.city, venue.country].filter(Boolean).join(", ");

  return (
    <Section className="venue decorated" editorSection="map">
      {venue.image ? (
        <div
          className="venue-image"
          role="img"
          aria-label={venue.name}
          style={{ backgroundImage: `url(${cssString(venue.image)})` }}
        />
      ) : (
        <div className="venue-image" aria-hidden="true" />
      )}
      <div className="venue-card">
        <p className="eyebrow cobalt">{slot(data, "map.eyebrow") ?? t("eyebrow")}</p>
        <h2 className="motion-title">{venue.name}</h2>
        {location ? <p>{location}</p> : null}
        {copy?.venueIntro ? <p className="small">{copy.venueIntro}</p> : null}
        <a href={mapsUrl(venue)} target="_blank" rel="noreferrer">
          {t("route")}
        </a>
      </div>
      <Art className="venue-wedding-flowers" file="wedding-flowers-v22" />
    </Section>
  );
}
