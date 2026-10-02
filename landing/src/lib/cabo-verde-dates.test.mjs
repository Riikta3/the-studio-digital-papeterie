/**
 *   node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs \
 *     --test landing/src/lib/cabo-verde-dates.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";

import { dayMonth } from "../components/invitation/themes/cabo-verde/dates.ts";
import { mapsUrl } from "../components/invitation/themes/cabo-verde/maps-url.ts";

test("a day and month, without weekday or year", () => {
  assert.equal(dayMonth("2027-04-30", "fr-FR"), "30 avril");
  assert.equal(dayMonth("2027-05-01", "fr-FR"), "1er mai");
  assert.equal(dayMonth("2027-04-30", "en-US"), "April 30");
  assert.equal(dayMonth("2027-04-30T16:30:00-01:00", "fr-FR"), "30 avril");
  assert.equal(dayMonth(undefined, "fr-FR"), null);
  assert.equal(dayMonth("later", "fr-FR"), null);
});

test("the maps link is the couple's own, else a search for the place", () => {
  assert.equal(mapsUrl({ name: "X", mapsUrl: "https://maps.example/x" }), "https://maps.example/x");
  const url = new URL(mapsUrl({ name: "Plage", city: "Ville" }));
  assert.equal(url.searchParams.get("query"), "Plage, Ville");
});
