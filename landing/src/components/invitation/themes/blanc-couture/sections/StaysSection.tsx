import type { InvitationData } from "../../types";

import { Page } from "./Page";

/**
 * Where to stay.
 *
 * The source printed "Saint-Jean-Cap-Ferrat" verbatim inside every card and
 * numbered this page "IV" while it is the sixth section — the numeral was a
 * leftover and is dropped rather than renumbered, since no other section
 * carries one. The city now comes from each stay.
 */
export function StaysSection({ data, side }: { data: InvitationData; side: "left" | "right" }) {
  const stays = data.stays ?? [];
  if (stays.length === 0) return null;

  return (
    <Page className="soft-floral-paper" side={side} monogram={data.couple.monogram} couple={data.couple}>
      <p className="script">Où dormir</p>
      {/* "sur la Riviera" was written here, so a wedding in Brittany invited
          its guests to stay on the Côte d'Azur. The couple's own city is used
          when they gave one — the cards below already do the same — and the
          heading stands alone when they did not. */}
      <h2>
        Votre séjour
        {data.venue.city ? (
          <>
            <br />à {data.venue.city}
          </>
        ) : null}
      </h2>
      <div className="hotel-list">
        {stays.map((stay) => {
          const location = stay.city ?? data.venue.city;
          const card = (
            <>
              <div>
                <h3>{stay.name}</h3>
                {location ? <p>{location}</p> : null}
              </div>
              {stay.distance ? <span>À {stay.distance} du lieu</span> : null}
            </>
          );

          return stay.url ? (
            <a className="hotel" href={stay.url} target="_blank" rel="noreferrer" key={stay.name}>
              {card}
            </a>
          ) : (
            <div className="hotel" key={stay.name}>
              {card}
            </div>
          );
        })}
      </div>
      {data.copy?.staysIntro ? <p className="note">{data.copy.staysIntro}</p> : null}
    </Page>
  );
}
