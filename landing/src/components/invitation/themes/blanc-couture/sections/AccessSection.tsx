import type { InvitationData } from "../../types";

import { Page } from "./Page";

/**
 * How to get there — the couple's own travel directions, one block per mode.
 *
 * `venue.access` has been in the contract from the start and was rendered by
 * ciao-amore alone, so on this theme the parking, the station and the shuttle
 * times reached the page and were dropped. It is the question guests ask first.
 *
 * Its own page rather than a block inside `VenueSection`: that one's content
 * sits inside a `contain`-fitted oval wreath sized to its artwork, and several
 * modes of a few lines each spill out of it. This page uses the plain floral
 * ground the other module pages use, which has no frame to overflow.
 *
 * The mode names and their lines are the couple's own wording — typed in the
 * dashboard's venue or transport screen — so nothing here is translatable
 * copy. The theme's own label stays French until blanc-couture goes through
 * the i18n pass (see `Checklist nouveau thème` in the vault).
 */
export function AccessSection({ data, side }: { data: InvitationData; side: "left" | "right" }) {
  const access = data.venue.access ?? [];

  // The root gates this on the `map` module, but a wedding can own that module
  // and still have written no directions.
  if (access.length === 0) return null;

  return (
    <Page
      className="soft-floral-paper module-page access-page"
      side={side}
      monogram={data.couple.monogram}
      couple={data.couple}
    >
      <p className="script">Pour venir</p>
      <h2>Accès</h2>

      <dl className="venue-access">
        {access.map((entry) => (
          <div key={entry.mode}>
            <dt>{entry.mode}</dt>
            {entry.details.map((detail) => (
              <dd key={detail}>
                {/* A carpool entry carries its link as a detail line, so a URL
                    is rendered as one rather than printed raw. */}
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
    </Page>
  );
}
