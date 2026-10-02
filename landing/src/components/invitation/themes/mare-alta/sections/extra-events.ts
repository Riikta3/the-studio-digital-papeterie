import { formatFrenchWeekday } from "../../format";
import type { InvitationData, ScheduleEntry, ScheduleIcon, WeddingEvent } from "../../types";

/**
 * The wedding's other events — the welcome dinner the evening before, the brunch
 * after — as the programme prints them under the day's own moments.
 *
 * Pure, so the rules (what counts, what overrides what, in which order) can be
 * tested without a browser.
 */

type EventKind = WeddingEvent["kind"];

export type ExtraEvent = {
  kind: EventKind;
  /** The couple's wording; empty when they left it blank (the card then names the kind). */
  name: string;
  /** ISO day, when the event has one. */
  date?: string;
  /** The couple's own words for the day ("Jour 2 · Dimanche"), when they wrote some. */
  dateLabel?: string;
  time?: string;
  address?: string;
  body?: string;
  dressCode?: string;
  note?: string;
  image?: string;
  /** The programme's moments that belong to this event, in the couple's order. */
  moments: ScheduleEntry[];
};

/** Which event a moment belongs to; an entry that names none falls back on its day. */
export function eventOf(entry: ScheduleEntry): EventKind {
  return entry.event ?? (entry.day === 2 ? "brunch" : "wedding-day");
}

/** The moment an event stands for, so its card can borrow that moment's drawing. */
export const ICON_OF_EVENT: Record<EventKind, ScheduleIcon | undefined> = {
  "welcome-dinner": "dinner",
  "wedding-day": "ceremony",
  party: "party",
  brunch: "brunch",
};

const ORDER: Record<EventKind, number> = { "welcome-dinner": 0, "wedding-day": 1, party: 2, brunch: 3 };

export function extraEvents(data: Pick<InvitationData, "events" | "schedule" | "dayTwo">): ExtraEvent[] {
  const schedule = data.schedule ?? [];
  const dayTwo = data.dayTwo;
  const named = (data.events ?? []).filter((event) => event.kind !== "wedding-day");

  const items: ExtraEvent[] = named.map((event) => {
    // The brunch is also handed over as `dayTwo`: the event's own fields, plus the
    // time, date and note the couple wrote on the programme tab, which win.
    const second = event.kind === "brunch" ? dayTwo : undefined;
    const writtenLabel = second?.dateLabel?.trim();
    // The mapper fills `dateLabel` with the French weekday when the couple wrote
    // none; only a different text is theirs (the same rule `heroDates` applies).
    const derivedLabel = event.date ? formatFrenchWeekday(event.date, { locale: "fr-FR" }) : null;

    return {
      kind: event.kind,
      name: second?.title?.trim() || event.name,
      date: event.date,
      dateLabel: writtenLabel && writtenLabel !== derivedLabel ? writtenLabel : undefined,
      time: second?.timeLabel?.trim() || event.time,
      address: event.address,
      body: second?.body?.trim() || event.description,
      dressCode: event.dressCode,
      note: second?.note?.trim() || undefined,
      image: second?.image,
      moments: schedule.filter((entry) => eventOf(entry) === event.kind),
    };
  });

  // A day-two block with no brunch event beside it (older data) still has its say.
  if (
    dayTwo &&
    !named.some((event) => event.kind === "brunch") &&
    (dayTwo.title || dayTwo.body || dayTwo.timeLabel || dayTwo.note || dayTwo.dateLabel || dayTwo.image)
  ) {
    items.push({
      kind: "brunch",
      name: dayTwo.title?.trim() ?? "",
      dateLabel: dayTwo.dateLabel?.trim() || undefined,
      time: dayTwo.timeLabel?.trim() || undefined,
      body: dayTwo.body?.trim() || undefined,
      note: dayTwo.note?.trim() || undefined,
      image: dayTwo.image,
      moments: schedule.filter((entry) => eventOf(entry) === "brunch"),
    });
  }

  // Chronological when the days are known, else the order a wedding unfolds in.
  return items.sort((a, b) =>
    a.date && b.date && a.date !== b.date ? (a.date < b.date ? -1 : 1) : ORDER[a.kind] - ORDER[b.kind],
  );
}
