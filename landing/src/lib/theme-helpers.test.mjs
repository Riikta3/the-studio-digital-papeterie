/**
 * Pure helpers shared by the ported themes.
 *
 *   node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs \
 *     --test landing/src/lib/theme-helpers.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  formatDateRange,
  formatDottedDate,
  heroDates,
  weddingSpan,
} from "../components/invitation/themes/date-range.ts";
import { monogramOf } from "../components/invitation/themes/monogram.ts";

/** Intl puts thin spaces around the range dash; compare with plain ones. */
const plain = (text) => text?.replace(/\s/g, " ");

/* -- monogramOf --------------------------------------------------------- */

test("the monogram the couple wrote wins, trimmed", () => {
  const couple = { partner1: "Valérie", partner2: "Gaël", monogram: "  V & G " };
  assert.equal(monogramOf(couple), "V & G");
});

test("without one, the monogram is the initials", () => {
  const couple = { partner1: "Camille", partner2: "Jonas" };
  assert.equal(monogramOf(couple), "C & J");
  assert.equal(monogramOf(couple, " · "), "C · J");
});

test("initials are upper-cased and keep their accent", () => {
  assert.equal(monogramOf({ partner1: "éléonore", partner2: "raphaël" }), "É & R");
});

test("a missing partner gives one initial, and nobody gives nothing", () => {
  assert.equal(monogramOf({ partner1: "Sienna", partner2: "" }), "S");
  assert.equal(monogramOf({ partner1: "  ", partner2: "" }), "");
});

test("a blank written monogram falls back to the initials", () => {
  assert.equal(monogramOf({ partner1: "Léa", partner2: "Hugo", monogram: "   " }), "L & H");
});

/* -- formatDateRange ---------------------------------------------------- */

test("a two-day range reads as one string", () => {
  assert.equal(formatDateRange("2027-06-19", "2027-06-20", { locale: "fr-FR" }), "19–20 juin 2027");
});

test("a range starting on the first keeps the French ordinal", () => {
  assert.equal(formatDateRange("2027-06-01", "2027-06-02", { locale: "fr-FR" }), "1er–2 juin 2027");
  assert.equal(
    plain(formatDateRange("2027-06-30", "2027-07-01", { locale: "fr-FR" })),
    "30 juin – 1er juillet 2027",
  );
});

test("other locales use their own range format", () => {
  assert.equal(plain(formatDateRange("2027-06-19", "2027-06-20", { locale: "en-US" })), "June 19 – 20, 2027");
});

test("a range never carries a thin or narrow space, so the server and the browser agree", () => {
  // Node's ICU writes U+2009 around the dash where Chrome's writes a plain
  // space. A theme prints the range from components that render on the server
  // and again in the browser: two spellings of one date is a hydration mismatch.
  for (const locale of ["fr", "en", "de", "es", "pt", "it", "ar", "zh", "ja"]) {
    for (const [start, end] of [
      ["2027-06-19", "2027-06-20"],
      ["2027-06-30", "2027-07-01"],
    ]) {
      assert.doesNotMatch(formatDateRange(start, end, { locale }), /[  ]/, `${locale} ${start}`);
    }
  }
});

test("one day, a missing end and a reversed range never break", () => {
  assert.equal(formatDateRange("2027-06-19", "2027-06-19", { locale: "fr-FR" }), "19 juin 2027");
  assert.equal(formatDateRange("2027-06-19", undefined, { locale: "fr-FR" }), "19 juin 2027");
  assert.equal(formatDateRange("2027-06-20", "2027-06-19", { locale: "fr-FR" }), "19–20 juin 2027");
});

test("an unreadable start gives null, not 'Invalid Date'", () => {
  assert.equal(formatDateRange(undefined, "2027-06-19"), null);
  assert.equal(formatDateRange("not a date", "2027-06-19"), null);
  assert.equal(formatDateRange("2027-06-19", "garbage", { locale: "fr-FR" }), "19 juin 2027");
});

/* -- formatDottedDate --------------------------------------------------- */

test("the dotted date follows the locale's order", () => {
  assert.equal(formatDottedDate("2027-04-30", { locale: "fr-FR" }), "30 · 04 · 2027");
  assert.equal(formatDottedDate("2027-04-30", { locale: "en-US" }), "04 · 30 · 2027");
  assert.equal(formatDottedDate("2027-04-30", { locale: "ja-JP" }), "2027 · 04 · 30");
});

test("the dotted date ignores a time and rejects garbage", () => {
  assert.equal(formatDottedDate("2027-04-30T16:30:00+01:00", { locale: "fr-FR" }), "30 · 04 · 2027");
  assert.equal(formatDottedDate("soon"), null);
  assert.equal(formatDottedDate(null), null);
});

/* -- weddingSpan -------------------------------------------------------- */

const event = (date) => ({ kind: "wedding-day", name: "x", day: 1, date });

test("the span covers the start and every dated event", () => {
  assert.deepEqual(
    weddingSpan({
      event: { startsAt: "2027-06-19T17:00:00+01:00" },
      events: [event("2027-06-20"), event("2027-06-18"), event(undefined)],
    }),
    { start: "2027-06-18", end: "2027-06-20" },
  );
});

test("a wedding with no events spans its own day", () => {
  assert.deepEqual(weddingSpan({ event: { startsAt: "2027-06-19T17:00:00+01:00" } }), {
    start: "2027-06-19",
    end: "2027-06-19",
  });
});

test("nothing readable means no span", () => {
  assert.equal(weddingSpan({ event: { startsAt: "soon" }, events: [event("later")] }), null);
});

/* -- heroDates ---------------------------------------------------------- */

// What the mapper hands a theme: both labels already formatted in French.
const mapped = {
  event: { startsAt: "2027-06-19T17:00:00+02:00" },
  copy: { dateLabel: "19 · 06 · 2027", dateSpelled: "samedi 19 juin 2027" },
};

test("the mapper's derived labels are re-derived in the page's language", () => {
  assert.deepEqual(heroDates(mapped, "fr-FR"), { dotted: "19 · 06 · 2027", spelled: "samedi 19 juin 2027" });
  assert.deepEqual(heroDates(mapped, "en-US"), { dotted: "06 · 19 · 2027", spelled: "Saturday, June 19, 2027" });
});

test("a label the couple rewrote is kept, in every language", () => {
  const written = {
    event: mapped.event,
    copy: { dateLabel: "Le grand jour", dateSpelled: "Un samedi de juin" },
  };
  assert.deepEqual(heroDates(written, "en-US"), { dotted: "Le grand jour", spelled: "Un samedi de juin" });
});

test("without any label the dates are derived, and a late hour does not move the day", () => {
  const late = { event: { startsAt: "2027-06-19T00:30:00+02:00" } };
  assert.deepEqual(heroDates(late, "fr-FR"), { dotted: "19 · 06 · 2027", spelled: "samedi 19 juin 2027" });
});

test("an unreadable start gives no dates", () => {
  assert.deepEqual(heroDates({ event: { startsAt: "soon" } }, "fr-FR"), { dotted: null, spelled: null });
});

test("blank labels count as unwritten", () => {
  const blank = { event: mapped.event, copy: { dateLabel: "  ", dateSpelled: "" } };
  assert.deepEqual(heroDates(blank, "fr-FR"), { dotted: "19 · 06 · 2027", spelled: "samedi 19 juin 2027" });
});
