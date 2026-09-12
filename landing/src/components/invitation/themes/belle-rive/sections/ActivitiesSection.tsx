import { getTranslations } from "next-intl/server";

import type { InvitationData } from "../../types";
import { Reveal } from "../Reveal";
import { Media } from "./Media";

/**
 * Day 2 — brunch, then the pool / tennis / pétanque gallery.
 *
 * The clips are the theme's own artwork, so their paths are fixed; only the
 * alt text varies by locale, which is why each entry names a message key
 * rather than carrying the French string it used to.
 */
const ACTIVITIES = [
  { src: "/themes/belle-rive/pool-animated.mp4", alt: "poolAlt" },
  { src: "/themes/belle-rive/tennis.mp4", alt: "tennisAlt" },
  { src: "/themes/belle-rive/petanque.mp4", alt: "petanqueAlt" },
] as const;

export async function ActivitiesSection({ data }: { data: InvitationData }) {
  const t = await getTranslations("Invitation.belleRive.activities");
  const dayTwo = data.dayTwo;
  if (!dayTwo) return null;

  return (
    <section className="panel activities pearled">
      <Reveal>
        <p className="eyebrow">{t("eyebrow")}</p>
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
          <Media src={dayTwo.image} alt={t("brunchImageAlt")} />
        </Reveal>
      ) : null}

      <Reveal delay={210} className="activity-gallery">
        {ACTIVITIES.map((activity) => (
          <Media key={activity.src} src={activity.src} alt={t(activity.alt)} />
        ))}
      </Reveal>
    </section>
  );
}
