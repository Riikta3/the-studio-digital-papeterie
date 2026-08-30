import type { InvitationData } from "../../types";

import { Page } from "./Page";

/**
 * The venue, framed by the oval stationery background.
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
    <Page className="venue-paper" side={side}>
      <p className="script">Le lieu</p>
      <h2>{venue.name}</h2>
      {copy?.venueIntro ? <p className="intro">{copy.venueIntro}</p> : null}

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
