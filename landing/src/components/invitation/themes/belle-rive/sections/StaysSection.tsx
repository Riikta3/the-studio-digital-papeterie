import type { InvitationData, Stay } from "../../types";
import { Reveal } from "../Reveal";

/**
 * Accommodation, in three tiers.
 *
 * The source kept three separate arrays (`featuredStays`, `nearbyStays`,
 * `moreStays`) with three different shapes. They are one `Stay[]` here, and the
 * tier falls out of the data: a stay with an `offer` is a partner card, a
 * `secondary` one goes behind the disclosure, and everything else is a plain
 * row. That way a couple adds a hotel without also picking a bucket.
 */
function tiers(stays: Stay[]) {
  return {
    featured: stays.filter((stay) => stay.offer && !stay.secondary),
    nearby: stays.filter((stay) => !stay.offer && !stay.secondary),
    more: stays.filter((stay) => stay.secondary),
  };
}

function StayRow({ stay }: { stay: Stay }) {
  const body = (
    <span>
      <b>{stay.name}</b>
      {stay.distance ? <small>{stay.distance}</small> : null}
    </span>
  );

  return stay.url ? (
    <a href={stay.url} target="_blank" rel="noreferrer">
      {body}
    </a>
  ) : (
    // Keep the same row when a stay has nothing to link to.
    <div>{body}</div>
  );
}

export function StaysSection({ data }: { data: InvitationData }) {
  const stays = data.stays ?? [];
  if (stays.length === 0) return null;

  const { featured, nearby, more } = tiers(stays);

  return (
    <section className="panel stays pearled">
      <Reveal>
        <p className="eyebrow">Hébergements</p>
        <h2>Sélectionnés pour vous</h2>
        {data.copy?.staysIntro ? <p className="stays-intro">{data.copy.staysIntro}</p> : null}
      </Reveal>

      {featured.length > 0 ? (
        <>
          <p className="stays-kicker">Nos offres partenaires</p>
          <Reveal delay={70} className="featured-stays">
            {featured.map((stay) => {
              const card = (
                <>
                  <span className="stay-star">✦</span>
                  <h3>{stay.name}</h3>
                  {stay.distance ? <p>{stay.distance}</p> : null}
                  {stay.offer ? <strong>{stay.offer}</strong> : null}
                  {stay.address ? <small>{stay.address}</small> : null}
                  {stay.url ? <span className="stay-link">Découvrir &amp; réserver</span> : null}
                </>
              );

              return stay.url ? (
                <a
                  className="stay-featured"
                  href={stay.url}
                  target="_blank"
                  rel="noreferrer"
                  key={stay.name}
                >
                  {card}
                </a>
              ) : (
                <div className="stay-featured" key={stay.name}>
                  {card}
                </div>
              );
            })}
          </Reveal>
        </>
      ) : null}

      {nearby.length > 0 ? (
        <>
          <p className="stays-kicker">Gîtes &amp; maisons à proximité</p>
          <Reveal delay={140} className="stay-list">
            {nearby.map((stay) => (
              <StayRow key={stay.name} stay={stay} />
            ))}
          </Reveal>
        </>
      ) : null}

      {more.length > 0 ? (
        <details className="more-stays">
          <summary>Voir plus d’options</summary>
          <div className="stay-list">
            {more.map((stay) => (
              <StayRow key={stay.name} stay={stay} />
            ))}
          </div>
        </details>
      ) : null}
    </section>
  );
}
