import type { InvitationData } from "../types";

/**
 * The wedding as a Google Calendar event, and the venue on Google Maps.
 *
 * Both are built from the couple's data. The designer's links hard-coded the
 * demo wedding's dates and place.
 */

/** A wedding runs late; eight hours covers the ceremony to the small hours. */
const DEFAULT_DURATION_HOURS = 8;

function compact(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function calendarUrl(data: Pick<InvitationData, "couple" | "event" | "venue">): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${data.couple.partner1} & ${data.couple.partner2}`,
    location: [data.venue.name, data.venue.address].filter(Boolean).join(", "),
  });

  const start = new Date(data.event.startsAt);
  if (!Number.isNaN(start.getTime())) {
    const end = new Date(start.getTime() + DEFAULT_DURATION_HOURS * 3_600_000);
    params.set("dates", `${compact(start)}/${compact(end)}`);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function mapsUrl(venue: InvitationData["venue"]): string {
  if (venue.mapsUrl) return venue.mapsUrl;
  const query = [venue.name, venue.address ?? venue.city].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?${new URLSearchParams({ api: "1", query })}`;
}
