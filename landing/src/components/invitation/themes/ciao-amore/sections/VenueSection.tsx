import type { InvitationData } from "../../types";

/** Venue card: name, photograph, address and the two route links. */
export function VenueSection({ data }: { data: InvitationData }) {
  const { venue } = data;

  return (
    <section className="venue-section">
      <div className="venue-frame">
        <p className="eyebrow">Le lieu</p>
        <h2>{venue.name}</h2>

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
                Voir sur Waze
              </a>
            ) : null}
            {venue.mapsUrl ? (
              <a href={venue.mapsUrl} target="_blank" rel="noreferrer">
                Google Maps
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
