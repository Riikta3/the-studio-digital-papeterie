import type { InvitationData } from "../../types";
import { Reveal } from "../Reveal";
import { Media } from "./Media";

/** Day 2 — brunch, then the pool / tennis / pétanque gallery. */
const ACTIVITIES = [
  { src: "/themes/belle-rive/pool-animated.mp4", alt: "Piscine animée" },
  { src: "/themes/belle-rive/tennis.mp4", alt: "Tennis" },
  { src: "/themes/belle-rive/petanque.mp4", alt: "Pétanque" },
];

export function ActivitiesSection({ data }: { data: InvitationData }) {
  const dayTwo = data.dayTwo;
  if (!dayTwo) return null;

  return (
    <section className="panel activities pearled">
      <Reveal>
        <p className="eyebrow">Jour 2</p>
        {dayTwo.title ? <h2>{dayTwo.title}</h2> : null}
        {dayTwo.dateLabel ? <h3>{dayTwo.dateLabel}</h3> : null}
        {dayTwo.timeLabel ? <p className="hours">{dayTwo.timeLabel}</p> : null}
      </Reveal>

      <Reveal delay={70}>
        {dayTwo.body ? <p>{dayTwo.body}</p> : null}
        {dayTwo.note ? <p className="pool-note">{dayTwo.note}</p> : null}
      </Reveal>

      {dayTwo.image ? (
        <Reveal delay={140} className="feature-art brunch-art">
          <Media src={dayTwo.image} alt="Table élégante du brunch" />
        </Reveal>
      ) : null}

      <Reveal delay={210} className="activity-gallery">
        {ACTIVITIES.map((activity) => (
          <Media key={activity.src} src={activity.src} alt={activity.alt} />
        ))}
      </Reveal>
    </section>
  );
}
