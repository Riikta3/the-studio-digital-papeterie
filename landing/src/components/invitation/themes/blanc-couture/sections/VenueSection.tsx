import type { InvitationData } from "../../types";

import { Page } from "./Page";

/**
 * The venue, framed by the oval stationery background.
 *
 * How to get there is NOT here: `venue.access` can run to several modes of a
 * few lines each, and this page's content sits inside a `contain`-fitted oval
 * wreath that a list that long spills straight out of. It has its own page —
 * see `AccessSection`.
 *
 * The source's two route links opened in the same tab, which drops a guest out
 * of the invitation onto Google Maps with no way back; both now open in a new
 * one. They are rendered only when the couple supplied the URL.
 */
export function VenueSection({ data, side }: { data: InvitationData; side: "left" | "right" }) {
  const { venue, copy } = data;

  // The source broke the venue name across two lines by hand. Splitting on the
  // last "de"/"of" style particle would be guesswork, so the name is printed as
  // one string and the CSS wraps it.
  return (
    <Page className="venue-paper" side={side} monogram={data.couple.monogram} couple={data.couple}>
      <p className="script">Le lieu</p>
      <h2>{venue.name}</h2>
      {copy?.venueIntro ? <p className="intro">{copy.venueIntro}</p> : null}

      {venue.address ? (
        <p className="venue-address">
          {venue.address.split("\n").map((line, index, lines) => (
            <span key={line}>
              {line}
              {index < lines.length - 1 ? <br /> : null}
            </span>
          ))}
        </p>
      ) : null}

      {venue.mapsUrl || venue.wazeUrl ? (
        <nav className="route-links" aria-label="Itinéraires">
          {venue.mapsUrl ? (
            <a href={venue.mapsUrl} target="_blank" rel="noreferrer">
              <span>Itinéraire</span>Google Maps
            </a>
          ) : null}
          {venue.wazeUrl ? (
            <a href={venue.wazeUrl} target="_blank" rel="noreferrer">
              <span>Itinéraire</span>Waze
            </a>
          ) : null}
        </nav>
      ) : null}

    </Page>
  );
}
