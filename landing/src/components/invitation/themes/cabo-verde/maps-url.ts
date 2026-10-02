import type { InvitationData } from "../types";

/** The couple's own maps link, else a Google Maps search for the place. */
export function mapsUrl(venue: InvitationData["venue"]): string {
  if (venue.mapsUrl) return venue.mapsUrl;
  const query = [venue.name, venue.address ?? venue.city].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?${new URLSearchParams({ api: "1", query })}`;
}
