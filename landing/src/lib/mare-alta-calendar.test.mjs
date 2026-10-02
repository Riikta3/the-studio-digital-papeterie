/**
 *   node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs \
 *     --test landing/src/lib/mare-alta-calendar.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";

import { calendarUrl, mapsUrl } from "../components/invitation/themes/mare-alta/calendar-url.ts";

const data = {
  couple: { partner1: "Léa", partner2: "Hugo" },
  event: { startsAt: "2027-06-19T17:00:00+01:00" },
  venue: { name: "Domaine des Lilas", address: "12 chemin des Lilas, Annecy" },
};

test("the calendar link carries the names, the instant in UTC and the place", () => {
  const url = new URL(calendarUrl(data));
  assert.equal(url.origin + url.pathname, "https://calendar.google.com/calendar/render");
  assert.equal(url.searchParams.get("action"), "TEMPLATE");
  assert.equal(url.searchParams.get("text"), "Léa & Hugo");
  assert.equal(url.searchParams.get("dates"), "20270619T160000Z/20270620T000000Z");
  assert.equal(url.searchParams.get("location"), "Domaine des Lilas, 12 chemin des Lilas, Annecy");
});

test("without an address the venue's name stands in", () => {
  const url = new URL(calendarUrl({ ...data, venue: { name: "Salle des Fêtes" } }));
  assert.equal(url.searchParams.get("location"), "Salle des Fêtes");
});

test("an unreadable start gives a link without dates, not a broken one", () => {
  const url = new URL(calendarUrl({ ...data, event: { startsAt: "soon" } }));
  assert.equal(url.searchParams.has("dates"), false);
});

test("the maps link is the couple's own, else a search for the place", () => {
  assert.equal(mapsUrl({ name: "X", mapsUrl: "https://maps.example/x" }), "https://maps.example/x");
  const search = new URL(mapsUrl({ name: "Domaine des Lilas", address: "12 chemin des Lilas" }));
  assert.equal(search.searchParams.get("query"), "Domaine des Lilas, 12 chemin des Lilas");
});
