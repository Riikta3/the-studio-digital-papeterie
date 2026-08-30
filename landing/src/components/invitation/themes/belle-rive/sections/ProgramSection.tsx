import { formatFrenchWeekday } from "../../format";
import type { InvitationData } from "../../types";
import { Reveal } from "../Reveal";
import { Media } from "./Media";
import { TimelineIcon } from "./TimelineIcon";

/**
 * Day-1 timeline, under the swaying garland.
 *
 * The source hard-coded which entry got which clip by array position
 * (`i === 0 && <Media name="ceremony.mp4" />`), so reordering the programme
 * silently reassigned the footage. Each entry now carries its own `image`.
 */
export function ProgramSection({ data }: { data: InvitationData }) {
  const dayOne = (data.schedule ?? []).filter((entry) => entry.day === 1);
  if (dayOne.length === 0) return null;

  const dayLabel = formatFrenchWeekday(data.event.startsAt, {
    timeZone: data.event.timezone,
  });

  return (
    <section className="panel program">
      <Reveal>
        <p className="eyebrow">Le programme</p>
        <h2>{data.copy?.scheduleIntro ?? "Deux jours d’exception"}</h2>
        <p className="eyebrow">Jour 1</p>
        {dayLabel ? <h3 style={{ textTransform: "capitalize" }}>{dayLabel}</h3> : null}
      </Reveal>

      <div className="timeline">
        {dayOne.map((entry, index) => (
          <Reveal
            key={`${entry.time}-${entry.title}`}
            as="article"
            className="event"
            delay={(index % 4) * 70}
          >
            <div className="event-icon">
              <TimelineIcon type={entry.icon} />
            </div>
            <div className="event-copy">
              <time>{entry.time}</time>
              <h4>{entry.title}</h4>
              {entry.description ? <p>{entry.description}</p> : null}
              {entry.image ? <Media src={entry.image} alt={entry.title} /> : null}
            </div>
          </Reveal>
        ))}
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element -- decorative overhang,
          positioned and animated by the theme's CSS. */}
      <img
        className="program-garlands"
        src="/themes/belle-rive/garlands-round-white.webp"
        alt=""
        aria-hidden="true"
        loading="lazy"
      />
    </section>
  );
}
