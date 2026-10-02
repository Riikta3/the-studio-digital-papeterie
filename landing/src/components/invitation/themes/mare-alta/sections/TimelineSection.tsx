import { Waves } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { slot } from "../../text";
import type { InvitationData } from "../../types";

import { ICON_OF_EVENT, eventOf, extraEvents } from "./extra-events";
import { shortDay } from "./event-day";
import { useEventKindNames } from "./event-names";
import { ScheduleMedallion } from "./ScheduleMedallion";
import { Section } from "./Section";
import { RhythmTitle, SectionTitle } from "./SectionTitle";

/**
 * The day told in order: one card per moment, then — under a heading of their
 * own — the wedding's other events with their moments.
 *
 * Renders nothing when the couple has no moment and no other event: a heading
 * over an empty list is worse than no section.
 */
export function TimelineSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.mareAlta.timeline");
  const locale = useLocale();
  const kindName = useEventKindNames();

  // The day itself. Moments of the other events are printed under those events.
  const moments = (data.schedule ?? []).filter((entry) => eventOf(entry) === "wedding-day");
  const extras = extraEvents(data);

  if (moments.length === 0 && extras.length === 0) return null;

  return (
    <Section id="ma-timeline" className="program coral-section" editorSection="timeline">
      <SectionTitle
        rhythm
        eyebrow={slot(data, "timeline.eyebrow") ?? t("eyebrow")}
        title={<RhythmTitle text={slot(data, "timeline.title") ?? `${t("titleLine1")}\n${t("titleLine2")}`} />}
        intro={data.copy?.scheduleIntro}
      />
      <div className="tempo-ribbon" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>

      {moments.length > 0 ? (
        <div className="agenda-grid">
          {moments.map((entry, index) => (
            <article className="agenda-card" key={`${index}-${entry.time}-${entry.title}`}>
              <span className="agenda-number">{String(index + 1).padStart(2, "0")}</span>
              <ScheduleMedallion icon={entry.icon} image={entry.image} />
              <time>{entry.time}</time>
              <h3>{entry.title}</h3>
              {entry.description ? <p>{entry.description}</p> : null}
            </article>
          ))}
        </div>
      ) : null}

      {/* New, for the events the designer's programme had no place for. Same cards. */}
      {extras.length > 0 ? (
        <div className="ma-also">
          <p className="eyebrow">{t("alsoTitle")}</p>
          <div className="agenda-grid">
            {extras.map((event) => {
              const day = event.dateLabel ?? shortDay(event.date, locale);
              const title = event.name || kindName[event.kind];
              return (
                <article className="agenda-card ma-event" key={event.kind}>
                  <ScheduleMedallion icon={ICON_OF_EVENT[event.kind]} image={event.image} />
                  <div className="ma-event-body">
                    {/* The day and the time share a line and wrap apart when the couple's
                        own wording for the day is long ("Dimanche matin, au jardin"). */}
                    {day || event.time ? (
                      <div className="ma-event-head">
                        {event.time ? <time>{event.time}</time> : null}
                        {day ? <span className="ma-event-day">{day}</span> : null}
                      </div>
                    ) : null}
                    {title ? <h3>{title}</h3> : null}
                    {event.body ? <p>{event.body}</p> : null}
                    {event.address ? <p className="ma-event-line">{event.address}</p> : null}
                    {event.dressCode ? (
                      <p className="ma-event-line">
                        {t("dressLabel")} · {event.dressCode}
                      </p>
                    ) : null}
                    {event.note ? <p className="ma-event-line ma-event-note">{event.note}</p> : null}
                    {event.moments.length > 0 ? (
                      <ul className="ma-event-moments">
                        {event.moments.map((entry, index) => (
                          <li key={`${index}-${entry.time}-${entry.title}`}>
                            <time>{entry.time}</time> {entry.title}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="wave-sign">
        <Waves />
        <span>{slot(data, "timeline.sign") ?? t("sign")}</span>
      </div>
    </Section>
  );
}
