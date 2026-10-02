import { useLocale, useTranslations } from "next-intl";
import { Fragment } from "react";

import { formatFrenchWeekday } from "../../format";
import { Lines, slot } from "../../text";
import type { InvitationData, ScheduleEntry, ScheduleIcon, WeddingEvent } from "../../types";

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

/** Also the day-after card's, so a brunch moment's icon is drawn there too. */
export function iconClass(entry: ScheduleEntry) {
  return `icon icon-${(entry.icon && ICON_CLASS[entry.icon]) || "party"}`;
}

/**
 * The ribbon's words, one `<span>` each.
 *
 * "Amore ✦ Limoni ✦ Dolce Vita" was written into the markup, so a wedding in
 * Provence was announced with lemons. It is a slot now; the couple types the
 * words on one line, separated by "·" or commas, and the stars between them
 * stay the theme's.
 */
function ribbonWords(value: string): string[] {
  return value
    .split(/[·,]/)
    .map((word) => word.trim())
    .filter(Boolean);
}

/**
 * One event's card — when, what, where, what to wear: everything the couple
 * wrote on it in the editor's programme.
 *
 * The date is printed only when it is not the wedding day's. The heading above
 * already names the day, and a welcome dinner the evening before is exactly
 * the event whose card must say so.
 */
function EventCard({
  event,
  showDate,
  dressLabel,
}: {
  event: WeddingEvent;
  showDate: boolean;
  dressLabel: string;
}) {
  const locale = useLocale();
  const date = showDate ? formatFrenchWeekday(event.date, { locale }) : null;
  const when = [date, event.time].filter(Boolean).join(" · ");

  return (
    <div className="ca-event">
      {when ? <p className="ca-event-when">{when}</p> : null}
      {event.name ? <h3>{event.name}</h3> : null}
      {event.address ? <p className="ca-event-where">{event.address}</p> : null}
      {event.description ? (
        <p className="ca-event-body">
          <Lines text={event.description} />
        </p>
      ) : null}
      {event.dressCode ? (
        <p className="ca-event-dress">
          <b>{dressLabel}</b> {event.dressCode}
        </p>
      ) : null}
    </div>
  );
}

function Timeline({ entries }: { entries: ScheduleEntry[] }) {
  return (
    <div className="timeline">
      {entries.map((entry, index) => (
        <article key={`${index}-${entry.time}-${entry.title}`}>
          <time>{entry.time}</time>
          <div className={iconClass(entry)} aria-hidden="true">
            <i />
          </div>
          <div>
            <h3>{entry.title}</h3>
            {entry.description ? <p>{entry.description}</p> : null}
            {entry.image ? (
              // The theme's CSS sizes these with `max-height` + `object-fit`;
              // next/image's wrapper fights that layout.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={entry.image} alt={entry.title} loading="lazy" />
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

export function ScheduleSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.ciaoAmore.schedule");
  const locale = useLocale();
  const dayOne = (data.schedule ?? []).filter((entry) => entry.day === 1);
  const dayOneEvents = (data.events ?? []).filter((event) => event.day === 1);
  if (dayOne.length === 0 && dayOneEvents.length === 0) return null;

  // Each event's card, then its own moments, in the couple's order. Moments
  // tied to no event printed here — a programme written on the old timeline
  // module screen — keep the single list they always had, after them.
  const printed = new Set(dayOneEvents.map((event) => event.kind));
  const loose = dayOne.filter((entry) => !entry.event || !printed.has(entry.event));
  const weddingDay = data.event.startsAt.slice(0, 10);
  const dressLabel = slot(data, "timeline.dressLabel") ?? t("dressLabel");

  const ribbon = ribbonWords(slot(data, "timeline.ribbon") ?? t("ribbon"));
  // No date yet (the couple cleared it in the editor) would print "NaN".
  const year = new Date(data.event.startsAt).getFullYear();

  const dayLabel = formatFrenchWeekday(data.event.startsAt, {
    timeZone: data.event.timezone,
    locale,
  });

  return (
    <>
      <div className="italian-ribbon" data-editor-section="timeline">
        {ribbon.map((word, index) => (
          <Fragment key={`${word}-${index}`}>
            {index > 0 ? <i>✦</i> : null}
            <span>{word}</span>
          </Fragment>
        ))}
      </div>

      <section className="arch-section" data-editor-section="timeline">
        <span className="postcard-stamp" aria-hidden="true">
          {slot(data, "timeline.stamp") ?? t("stamp")}
          {Number.isNaN(year) ? null : (
            <>
              <br />
              <b>{year}</b>
            </>
          )}
        </span>
        <div className="arch-copy">
          {/* "Deux jours d'exception" is the showcase's two-day weekend; a
              one-day wedding rewrites it here. */}
          <p className="eyebrow">{slot(data, "timeline.introEyebrow") ?? t("introEyebrow")}</p>
          <h2>{slot(data, "timeline.introTitle") ?? t("introTitle")}</h2>
          {data.copy?.scheduleIntro ? <p>{data.copy.scheduleIntro}</p> : null}
        </div>
      </section>

      <section className="paper timeline-section" data-editor-section="timeline">
        <span className="program-sun" aria-hidden="true" />
        <span className="program-stripe" aria-hidden="true" />
        <p className="eyebrow">
          {slot(data, "timeline.dayOneEyebrow") ?? t("dayOneEyebrow")}
          {dayLabel ? t("dayOneSeparator") : ""}
          <span style={{ textTransform: "capitalize" }}>{dayLabel}</span>
        </p>
        <h2>{slot(data, "timeline.dayOneTitle") ?? t("dayOneTitle")}</h2>
        {dayOneEvents.map((event) => {
          const moments = dayOne.filter((entry) => entry.event === event.kind);
          return (
            <Fragment key={event.kind}>
              <EventCard
                event={event}
                showDate={Boolean(event.date) && event.date !== weddingDay}
                dressLabel={dressLabel}
              />
              {moments.length > 0 ? <Timeline entries={moments} /> : null}
            </Fragment>
          );
        })}
        {loose.length > 0 ? <Timeline entries={loose} /> : null}
      </section>
    </>
  );
}
