/**
 * The control datasets must be valid enough to render and different enough from
 * every demo to expose a theme that kept the demo couple's content.
 *
 *   node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs \
 *     --test landing/src/lib/theme-fixtures.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";

import { demoDataFor } from "../components/invitation/themes/fixtures/index.ts";
import {
  HEAVY_WEDDING,
  MINIMAL_WEDDING,
} from "../components/invitation/themes/fixtures/other-wedding.ts";

const DEMO = { couple: { partner1: "A", partner2: "B" }, event: { startsAt: "2030-01-01T10:00:00Z" }, venue: { name: "V" } };

test("both datasets are demos: they never carry a wedding id", () => {
  assert.equal(MINIMAL_WEDDING.weddingId, undefined);
  assert.equal(HEAVY_WEDDING.weddingId, undefined);
});

test("the minimal dataset leaves every optional field empty", () => {
  const keys = Object.keys(MINIMAL_WEDDING).sort();
  assert.deepEqual(keys, ["couple", "event", "venue"]);
  assert.deepEqual(Object.keys(MINIMAL_WEDDING.couple).sort(), ["partner1", "partner2"]);
});

test("the heavy dataset exercises counts, long strings and every optional field", () => {
  assert.ok(HEAVY_WEDDING.schedule.length >= 8);
  assert.ok(HEAVY_WEDDING.stays.length >= 10);
  assert.ok(HEAVY_WEDDING.faq.length >= 12);
  assert.equal(HEAVY_WEDDING.events.length, 3);
  assert.ok(HEAVY_WEDDING.dressCode.colors.length >= 8);
  assert.ok(HEAVY_WEDDING.venue.access.length >= 5);
  assert.equal(HEAVY_WEDDING.rsvp.allowChildren, false);
  assert.ok(HEAVY_WEDDING.couple.partner1.length > 12, "a long first name");
  assert.ok(HEAVY_WEDDING.dayOf, "the Jour J blocks are exercised");
});

test("neither dataset shares a name with the three demo couples", () => {
  const forbidden = ["Sienna", "Malo", "Éléonore", "Raphaël", "Paula", "Ricardo", "Camille", "Jonas"];
  const text = JSON.stringify([MINIMAL_WEDDING, HEAVY_WEDDING]);
  for (const word of forbidden) assert.equal(text.includes(word), false, word);
});

test("demoDataFor picks a dataset by name and otherwise keeps the demo", () => {
  assert.equal(demoDataFor(DEMO, "minimal"), MINIMAL_WEDDING);
  assert.equal(demoDataFor(DEMO, "heavy"), HEAVY_WEDDING);
  assert.equal(demoDataFor(DEMO, undefined), DEMO);
  assert.equal(demoDataFor(DEMO, "nope"), DEMO);
});

test("in production the query string changes nothing", () => {
  const before = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    assert.equal(demoDataFor(DEMO, "heavy"), DEMO);
  } finally {
    process.env.NODE_ENV = before;
  }
});
