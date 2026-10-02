import type { InvitationData, ScheduleEntry, WeddingEvent } from "../types";

/**
 * Which of the couple's events and moments the programme and the brunch draw.
 *
 * The contract keeps a moment's event on the entry. A programme built on the old
 * timeline screen knew no events, so an entry that names none belongs to the
 * wedding day — or to the day after when it says `day: 2`.
 */

type EventKind = NonNullable<ScheduleEntry["event"]>;

/** The event a moment belongs to. */
export function eventOf(entry: ScheduleEntry): EventKind {
  return entry.event ?? (entry.day === 2 ? "brunch" : "wedding-day");
}

/** The calendar day of the wedding: the wedding-day event's date, else the day written in `startsAt`. */
export function weddingDayOf(data: InvitationData): string {
  const dated = data.events?.find((event) => event.kind === "wedding-day")?.date;
  return (dated ?? data.event.startsAt).slice(0, 10);
}

/**
 * The events the programme draws besides the wedding day itself — a welcome
 * dinner, a party. The brunch is the day-two block, not part of the timeline.
 */
export function extraEvents(data: InvitationData): WeddingEvent[] {
  return (data.events ?? []).filter((event) => event.kind !== "wedding-day" && event.kind !== "brunch");
}

/** The moments an event owns, in the couple's order. */
export function momentsOf(data: InvitationData, kind: EventKind): ScheduleEntry[] {
  return (data.schedule ?? []).filter((entry) => eventOf(entry) === kind);
}

/**
 * The moments on the wedding day's timeline: its own, and those of an event that
 * has no card of its own (an entry left behind by an event the couple switched
 * off), which keep a place rather than vanish.
 */
export function weddingDayMoments(data: InvitationData): ScheduleEntry[] {
  const withCard = new Set<string>(extraEvents(data).map((event) => event.kind));
  return (data.schedule ?? []).filter((entry) => {
    const kind = eventOf(entry);
    return kind === "wedding-day" || (kind !== "brunch" && !withCard.has(kind));
  });
}

/** Whether the day after has anything to say: the day-two block, or a brunch event. */
export function hasDayTwo(data: InvitationData): boolean {
  return Boolean(data.dayTwo) || Boolean(data.events?.some((event) => event.kind === "brunch"));
}
