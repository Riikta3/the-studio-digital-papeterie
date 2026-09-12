import { formatFrenchWeekday } from "../../format";
import type { InvitationData, ScheduleEntry, ScheduleIcon } from "../../types";

/**
 * Day-1 timeline, plus the arched intro card that precedes it.
 *
 * The per-entry icons are drawn in CSS (`.icon-church`, `.icon-spritz`, …), so
 * the set is closed: an entry whose `icon` is unknown falls back to the party
 * glyph rather than rendering an empty circle.
 *
 * `ScheduleIcon` names the moment, this theme names its drawing of it — a
 * church for the ceremony, a spritz for the cocktail — so the contract's keys
 * are mapped onto the CSS classes here. Before this the three themes each had
 * their own vocabulary, and an entry written for one fell back to a default in
 * the other two.
 */
const ICON_CLASS: Record<ScheduleIcon, string> = {
  ceremony: "church",
  cocktail: "spritz",
  dinner: "plate",
  party: "party",
  // No drawing of its own; the day-2 block has its own artwork anyway.
  brunch: "spritz",
};

function iconClass(entry: ScheduleEntry) {
  return `icon icon-${(entry.icon && ICON_CLASS[entry.icon]) || "party"}`;
}

export function ScheduleSection({ data }: { data: InvitationData }) {
  const dayOne = (data.schedule ?? []).filter((entry) => entry.day === 1);
  if (dayOne.length === 0) return null;

  const dayLabel = formatFrenchWeekday(data.event.startsAt, {
    timeZone: data.event.timezone,
  });

  return (
    <>
      <div className="italian-ribbon">
        <span>Amore</span>
        <i>✦</i>
        <span>Limoni</span>
        <i>✦</i>
        <span>Dolce Vita</span>
      </div>

      <section className="arch-section">
        <span className="postcard-stamp" aria-hidden="true">
          ITALIA
          <br />
          <b>{new Date(data.event.startsAt).getFullYear()}</b>
        </span>
        <div className="arch-copy">
          <p className="eyebrow">Deux jours d&rsquo;exception</p>
          <h2>Le programme</h2>
          {data.copy?.scheduleIntro ? <p>{data.copy.scheduleIntro}</p> : null}
        </div>
      </section>

      <section className="paper timeline-section">
        <span className="program-sun" aria-hidden="true" />
        <span className="program-stripe" aria-hidden="true" />
        <p className="eyebrow">
          Jour 1{dayLabel ? " · " : ""}
          <span style={{ textTransform: "capitalize" }}>{dayLabel}</span>
        </p>
        <h2>Le grand jour</h2>
        <div className="timeline">
          {dayOne.map((entry) => (
            <article key={`${entry.time}-${entry.title}`}>
              <time>{entry.time}</time>
              <div className={iconClass(entry)} aria-hidden="true">
                <i />
              </div>
              <div>
                <h3>{entry.title}</h3>
                {entry.description ? <p>{entry.description}</p> : null}
                {entry.image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- the
                  // theme's CSS sizes these with `max-height` + `object-fit`;
                  // next/image's wrapper fights that layout.
                  <img src={entry.image} alt={entry.title} loading="lazy" />
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
