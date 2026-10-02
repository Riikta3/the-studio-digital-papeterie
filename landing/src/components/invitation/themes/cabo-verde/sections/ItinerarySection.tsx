"use client";

import { useLocale, useTranslations } from "next-intl";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";

import { slot } from "../../text";
import type { InvitationData, ScheduleEntry, WeddingEvent } from "../../types";

import { dayMonth } from "../dates";
import { Art } from "./Art";
import { Section } from "./Section";

/** One day of the programme — one tab, one panel. */
type Day = {
  key: string;
  /** What the tab says: the day and month, else the event's name. */
  label: string;
  /** What the flow line says: the event's name. */
  name: string;
  event: WeddingEvent | null;
  moments: ScheduleEntry[];
};

/**
 * Which event a moment belongs to: its own, else the day it was written for
 * (1 is the ceremony's day, 2 the day after — a programme saved before events
 * existed knows nothing else).
 */
function eventOf(entry: ScheduleEntry): WeddingEvent["kind"] {
  return entry.event ?? (entry.day === 2 ? "brunch" : "wedding-day");
}

/**
 * One day per event that has a date, in date order — an event with no moments
 * still gets its tab. With no dated event at all, the moments make a single day
 * (no tabs, no flow line).
 */
function buildDays(data: InvitationData, locale: string): Day[] {
  const schedule = data.schedule ?? [];
  const dated = [...(data.events ?? [])]
    .filter((event) => event.date)
    .sort((a, b) => a.date!.localeCompare(b.date!));

  if (dated.length === 0) {
    return schedule.length > 0 ? [{ key: "all", label: "", name: "", event: null, moments: schedule }] : [];
  }

  const days: Day[] = dated.map((event) => ({
    key: event.kind,
    label: dayMonth(event.date, locale) ?? event.name,
    name: event.name,
    event,
    moments: schedule.filter((entry) => eventOf(entry) === event.kind),
  }));

  // A moment whose event is not among the days (an event without a date) is not
  // dropped: it joins the ceremony's day, else the first.
  const known = new Set(days.map((day) => day.key));
  const orphans = schedule.filter((entry) => !known.has(eventOf(entry)));
  if (orphans.length > 0) {
    const home = days.find((day) => day.key === "wedding-day") ?? days[0]!;
    home.moments = [...home.moments, ...orphans];
  }

  // Two events on the same date would give two identical tabs. Every tab then
  // takes its event's name, so the bar reads as one kind of label rather than
  // two names beside a date.
  if (new Set(days.map((day) => day.label)).size < days.length) {
    for (const day of days) day.label = day.name || day.label;
  }
  return days;
}

/** How long the cards of a freshly opened day take to arrive (the designer's 700 ms). */
const ENTER_MS = 700;

/**
 * Itinerary — the programme in day tabs, a string of lights over it.
 *
 * The days come from the couple's events (see `buildDays`), so one wedding has
 * three tabs and another none: a single day shows its moments plainly, with no
 * tabs and no flow line. The tabs follow the WAI-ARIA tabs pattern: arrows move
 * between them (mirrored in a right-to-left page), Home and End jump.
 */
export function ItinerarySection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.caboVerde.itinerary");
  const locale = useLocale();
  const uid = useId();
  const [selected, setSelected] = useState(0);
  const [entering, setEntering] = useState<number | null>(null);
  const timer = useRef(0);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const days = buildDays(data, locale);
  // Nothing to say — no moment, no detail of any event — is no section.
  const hasContent = days.some(
    (day) => day.moments.length > 0 || day.event?.description || day.event?.address || day.event?.dressCode,
  );
  if (days.length === 0 || !hasContent) return null;

  const multi = days.length > 1;
  // The couple may remove an event while the editor's preview is open.
  const active = Math.min(selected, days.length - 1);
  const title = slot(data, "timeline.title") ?? t("title");
  const tabId = (index: number) => `cv-day-tab-${uid}-${index}`;
  const panelId = (index: number) => `cv-day-panel-${uid}-${index}`;

  function select(index: number) {
    if (index === active) return;
    setSelected(index);
    setEntering(index);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setEntering(null), ENTER_MS);
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    // In a right-to-left page the first tab is on the right: the arrows mirror.
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    let next: number | null = null;
    if (event.key === "ArrowRight") next = rtl ? index - 1 : index + 1;
    else if (event.key === "ArrowLeft") next = rtl ? index + 1 : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = days.length - 1;
    if (next === null) return;

    event.preventDefault();
    next = (next + days.length) % days.length;
    select(next);
    tabs.current[next]?.focus();
  }

  return (
    <Section className="itinerary decorated" editorSection="timeline">
      <Art className="beach-decor party-lights" file="beach-guirlande-v8" />
      <p className="eyebrow light">{slot(data, "timeline.eyebrow") ?? t("eyebrow")}</p>
      <h2 className="motion-title">{title}</h2>
      {data.copy?.scheduleIntro ? <p className="intro">{data.copy.scheduleIntro}</p> : null}

      {multi ? (
        <div className="days-tabs" role="tablist" aria-label={title}>
          {days.map((day, index) => (
            <button
              key={`${day.key}-${index}`}
              ref={(node) => {
                tabs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={tabId(index)}
              aria-selected={index === active}
              aria-controls={panelId(index)}
              tabIndex={index === active ? 0 : -1}
              className={index === active ? "tab active" : "tab"}
              onClick={() => select(index)}
              onKeyDown={(event) => onKeyDown(event, index)}
            >
              {day.label}
            </button>
          ))}
        </div>
      ) : null}

      {days.map((day, index) => {
        const open = index === active;
        const className = ["day-panel", open ? "active" : null, entering === index ? "day-entering" : null]
          .filter(Boolean)
          .join(" ");
        // What the couple wrote on the event's own card. The time is only said
        // here when there is no moment to say it.
        const where = [day.moments.length === 0 ? day.event?.time : null, day.event?.address]
          .filter(Boolean)
          .join(" · ");

        return (
          <div
            key={`${day.key}-${index}`}
            id={panelId(index)}
            className={className}
            role={multi ? "tabpanel" : undefined}
            aria-labelledby={multi ? tabId(index) : undefined}
            hidden={multi && !open}
          >
            {/* Only seen without JavaScript, where every day is shown in turn. */}
            {multi ? <span className="cv-day-label">{day.label}</span> : null}
            {where || day.event?.description || day.event?.dressCode ? (
              <div className="cv-day-details">
                {where ? <p className="cv-day-where">{where}</p> : null}
                {day.event?.description ? <p>{day.event.description}</p> : null}
                {day.event?.dressCode ? <p className="cv-day-dress">{t("dress", { value: day.event.dressCode })}</p> : null}
              </div>
            ) : null}
            {day.moments.map((entry, momentIndex) => (
              <article key={`${momentIndex}-${entry.time}-${entry.title}`}>
                <time>{entry.time}</time>
                <div>
                  <h3>{entry.title}</h3>
                  {entry.description ? <p>{entry.description}</p> : null}
                </div>
              </article>
            ))}
          </div>
        );
      })}

      {multi ? (
        <div className="program-flow" role="group" aria-label={t("flowLabel")}>
          {days.flatMap((day, index) => [
            index > 0 ? <i key={`line-${index}`} aria-hidden="true" /> : null,
            <span key={`name-${index}`}>{day.name || day.label}</span>,
          ])}
        </div>
      ) : null}
    </Section>
  );
}
