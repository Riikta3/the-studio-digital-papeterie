import { Waves } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Reveal } from "../../reveal";
import { slot } from "../../text";
import type { InvitationData } from "../../types";

import { ICON_OF_EVENT, eventOf, extraEvents } from "./extra-events";
import { dayMonth, shortDay } from "./event-day";
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

  // "Le récit du 19 juin", as the designer wrote it: the wording is a slot, the day is the wedding's,
  // put in place by a pattern each language orders its own way (spec D2).
  const wording = slot(data, "timeline.eyebrow") ?? t("eyebrow");
  const day = dayMonth(data.event.startsAt, locale);

  return (
    <Section id="ma-timeline" className="program coral-section" editorSection="timeline">
      <SectionTitle
        rhythm
        eyebrow={day ? t("eyebrowWithDate", { wording, date: day }) : wording}
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
            // Each card watches itself: its embroidered object turns in as the card comes into view
            // (`modules.css`). Keyed by position, so a moment the couple is retyping in the editor keeps
            // its card instead of replaying the entrance at every keystroke.
            <Reveal as="article" className="agenda-card" revealedClass="ma-seen" threshold={0.4} key={index}>
              <span className="agenda-number">{String(index + 1).padStart(2, "0")}</span>
              <ScheduleMedallion icon={entry.icon} image={entry.image} />
              <time>{entry.time}</time>
              <h3>{entry.title}</h3>
              {entry.description ? <p>{entry.description}</p> : null}
            </Reveal>
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
                <Reveal
                  as="article"
                  className="agenda-card ma-event"
                  revealedClass="ma-seen"
                  threshold={0.4}
                  key={event.kind}
                >
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
                </Reveal>
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
