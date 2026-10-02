/**
 *   node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs \
 *     --test landing/src/lib/chateau-royal-dates.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";

import { dayHeading, weekdayRange } from "../components/invitation/themes/chateau-royal/dates.ts";
import { splitMonogram } from "../components/invitation/themes/chateau-royal/monogram-parts.ts";

const plain = (text) => text?.replace(/\s/g, " ");

test("a day heading is the weekday, day and month — no year", () => {
  assert.equal(dayHeading("2027-06-19", "fr-FR"), "samedi 19 juin");
  assert.equal(dayHeading("2027-06-01", "fr-FR"), "mardi 1er juin");
  assert.equal(dayHeading("2027-06-19", "en-US"), "Saturday, June 19");
  assert.equal(dayHeading(undefined, "fr-FR"), null);
  assert.equal(dayHeading("later", "fr-FR"), null);
});

test("a weekday range names both days once", () => {
  assert.equal(plain(weekdayRange("2027-06-19", "2027-06-20", "fr-FR")), "samedi 19 – dimanche 20 juin 2027");
  assert.equal(weekdayRange("2027-06-19", "2027-06-19", "fr-FR"), "samedi 19 juin 2027");
  assert.equal(weekdayRange("2027-06-19", undefined, "fr-FR"), "samedi 19 juin 2027");
  assert.equal(weekdayRange("nope", "2027-06-20", "fr-FR"), null);
});

test("a range is written with plain spaces only, and the French first of the month is an ordinal", () => {
  // Node's ICU puts thin spaces around the dash and a browser's may not: two
  // spellings of one date is a hydration mismatch, and a thin space after the
  // day would also hide the "1er" from the ordinal rule.
  for (const locale of ["fr-FR", "en-US", "de", "es", "it"]) {
    assert.doesNotMatch(weekdayRange("2027-06-19", "2027-06-20", locale), /[  ]/, locale);
  }
  assert.equal(weekdayRange("2027-06-01", "2027-06-02", "fr-FR"), "mardi 1er – mercredi 2 juin 2027");
  assert.equal(weekdayRange("2027-05-31", "2027-06-01", "fr-FR"), "lundi 31 mai – mardi 1er juin 2027");
  assert.equal(weekdayRange("2027-06-20", "2027-06-19", "fr-FR"), "samedi 19 – dimanche 20 juin 2027");
});

test("a monogram with a separator is split so the separator can be set apart", () => {
  assert.deepEqual(splitMonogram("E & R"), { left: "E", separator: "&", right: "R" });
  assert.deepEqual(splitMonogram("MC · JB"), { left: "MC", separator: "·", right: "JB" });
  assert.deepEqual(splitMonogram("S+M"), { left: "S", separator: "+", right: "M" });
});

test("free text with no separator stays whole", () => {
  assert.equal(splitMonogram("Maré"), null);
  assert.equal(splitMonogram(""), null);
  assert.equal(splitMonogram("   "), null);
});
