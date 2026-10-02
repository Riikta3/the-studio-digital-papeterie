import { useLocale, useTranslations } from "next-intl";

import { Reveal } from "../../reveal";
import { slot } from "../../text";
import type { InvitationData, ScheduleIcon, WeddingEvent } from "../../types";
import { dayHeading } from "../dates";
import { extraEvents, momentsOf, weddingDayMoments, weddingDayOf } from "../programme";

import { EventIcon } from "./EventIcon";
import { ProgrammeTimeline } from "./ProgrammeTimeline";

/** The medallion of an event that is not the wedding day: what the evening is. */
const ICON_OF_EVENT: Partial<Record<WeddingEvent["kind"], ScheduleIcon>> = {
  "welcome-dinner": "dinner",
  party: "party",
};

/**
 * The programme: the wedding day as a timeline that lights up as you scroll.
 *
 * Besides the day's own moments the couple may have a welcome dinner or a party.
 * The designer's page knows only the one day, so each such event takes a place
 * in the timeline as a card of its own — before the day when it is dated before
 * it, after the last moment otherwise — carrying the weekday it falls on, its
 * description, its address and its own moments as small lines.
 *
 * Renders nothing without a moment and without an event.
 */
export function ProgrammeSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.chateauRoyal.programme");
  const locale = useLocale();

  const moments = weddingDayMoments(data);
  const extras = extraEvents(data);
  if (moments.length === 0 && extras.length === 0) return null;

  const day = weddingDayOf(data);
  const before = extras.filter((event) => event.date && event.date.slice(0, 10) < day);
  const after = extras.filter((event) => !before.includes(event));

  const eyebrow = [dayHeading(day, locale), slot(data, "timeline.dayOne") ?? t("dayOne")]
    .filter(Boolean)
    .join(" · ");
  const intro = data.copy?.scheduleIntro?.trim() || slot(data, "timeline.intro") || t("intro");
  const dressLabel = slot(data, "timeline.dressLabel") ?? t("dressLabel");

  const extraCard = (event: WeddingEvent) => {
    const day = dayHeading(event.date, locale);
    const own = momentsOf(data, event.kind);
    return (
      <article className="event cr-extra" key={event.kind}>
        <div className="event-card">
          {day || event.time ? (
            <span className="event-time">
              {day}
              {day && event.time ? " · " : null}
              {/* A time must not break across lines ("19 h" / "00"). */}
              {event.time ? <span className="cr-nowrap">{event.time}</span> : null}
            </span>
          ) : null}
          <h3>{event.name}</h3>
          {event.description ? <p>{event.description}</p> : null}
          {event.address ? <p className="cr-event-where">{event.address}</p> : null}
          {event.dressCode ? (
            <p className="cr-event-where">
              <b>{dressLabel}</b> {event.dressCode}
            </p>
          ) : null}
          {own.length > 0 ? (
            <ul className="cr-event-moments">
              {own.map((entry, index) => (
                <li key={`${index}-${entry.time}-${entry.title}`}>
                  <span>{entry.time}</span> {entry.title}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <EventIcon icon={ICON_OF_EVENT[event.kind]} />
      </article>
    );
  };

  return (
    <section className="programme" id="cr-programme" data-editor-section="timeline">
      <Reveal as="div" className="section-heading reveal" revealedClass="visible" threshold={0.12}>
        <div className="section-eyebrow">{eyebrow}</div>
        <h2>{slot(data, "timeline.title") ?? t("title")}</h2>
        <p>{intro}</p>
      </Reveal>
      <ProgrammeTimeline>
        {before.map(extraCard)}
        {moments.map((entry, index) => (
          <article className="event" key={`${index}-${entry.time}-${entry.title}`}>
            <div className="event-card">
              <span className="event-time">{entry.time}</span>
              <h3>{entry.title}</h3>
              {entry.description ? <p>{entry.description}</p> : null}
            </div>
            <EventIcon icon={entry.icon} image={entry.image} label={entry.title} />
          </article>
        ))}
        {after.map(extraCard)}
      </ProgrammeTimeline>
    </section>
  );
}
