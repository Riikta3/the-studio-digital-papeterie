import assert from "node:assert/strict";
import test from "node:test";

import {
  DOMAIN_MAX_YEARS,
  addOnQuote,
  computeOrderTotal,
  domainPrice,
  domainYearsFor,
  hasMeteredAddOns,
  isRealDate,
  parseDomainYears,
} from "./pricing.ts";

test("isRealDate knows how many days each month has", () => {
  assert.equal(isRealDate(2027, 4, 30), true);
  assert.equal(isRealDate(2027, 4, 31), false);
  assert.equal(isRealDate(2028, 2, 29), true);
  assert.equal(isRealDate(2027, 2, 29), false);
  assert.equal(isRealDate(2100, 2, 29), false);
  assert.equal(isRealDate(2000, 2, 29), true);
  for (const [y, m, d] of [[2027, 0, 1], [2027, 13, 1], [2027, 1, 0], [2027, 1, 1.5], [Number.NaN, 1, 1]]) {
    assert.equal(isRealDate(y, m, d), false, `${y}-${m}-${d}`);
  }
});

test("addOnQuote includes everything on unlimited plans", () => {
  assert.deepEqual(addOnQuote("sur-mesure", 9, 3), { included: 3, billable: 0, totalEuros: 0 });
  assert.deepEqual(addOnQuote("prestige", 0, 2), { included: 2, billable: 0, totalEuros: 0 });
});

test("addOnQuote bills Signature beyond the four included modules", () => {
  assert.deepEqual(addOnQuote("signature", 4, 2), { included: 0, billable: 2, totalEuros: 10 });
  assert.deepEqual(addOnQuote("signature", 3, 2), { included: 1, billable: 1, totalEuros: 5 });
  assert.deepEqual(addOnQuote("signature", 1, 2), { included: 2, billable: 0, totalEuros: 0 });
});

test("addOnQuote is the checkout's price difference for Signature", () => {
  const ids = (n) => Array.from({ length: n }, (_, i) => `m${i}`);
  for (let owned = 0; owned <= 6; owned += 1) {
    for (let added = 0; added <= 4; added += 1) {
      const before = computeOrderTotal({ plan: "signature", modules: ids(owned) });
      const after = computeOrderTotal({ plan: "signature", modules: ids(owned + added) });
      assert.equal(addOnQuote("signature", owned, added).totalEuros, after - before, `${owned}+${added}`);
    }
  }
});

test("legacy plans keep what they were sold, unknown plans are metered", () => {
  assert.equal(hasMeteredAddOns("premium"), false);
  assert.equal(hasMeteredAddOns("experience"), true);
  assert.equal(hasMeteredAddOns("essential"), true);
  assert.equal(hasMeteredAddOns(null), true);
  assert.deepEqual(addOnQuote("premium", 5, 3), { included: 3, billable: 0, totalEuros: 0 });
  assert.deepEqual(addOnQuote("essential", 0, 5), { included: 4, billable: 1, totalEuros: 5 });
});

test("addOnQuote ignores nonsense counts", () => {
  assert.deepEqual(addOnQuote("signature", -3, -1), { included: 0, billable: 0, totalEuros: 0 });
  assert.deepEqual(addOnQuote("signature", 4, 1.7), { included: 0, billable: 1, totalEuros: 5 });
});

// Domain years and price (docs/superpowers/specs/2026-10-02-custom-domain-design.md, D1).
// Every case is anchored on the same "today", given in UTC.
const TODAY = new Date("2026-10-02T00:00:00Z");

test("domainYearsFor gives 1 year without a usable wedding date", () => {
  assert.equal(domainYearsFor(undefined, TODAY), 1);
  assert.equal(domainYearsFor(null, TODAY), 1);
  assert.equal(domainYearsFor("", TODAY), 1);
  assert.equal(domainYearsFor("not a date", TODAY), 1);
  assert.equal(domainYearsFor("2027-13-01", TODAY), 1);
  // 2027 is not a leap year: a 29 February that does not exist is not rolled into March.
  assert.equal(domainYearsFor("2027-02-29", TODAY), 1);
  // A date written with a time is not the YYYY-MM-DD the checkout stores.
  assert.equal(domainYearsFor("2030-06-01T12:00:00Z", TODAY), 1);
  assert.equal(domainYearsFor("2030-06-01", new Date("invalid")), 1);
});

test("domainYearsFor gives 1 year for a wedding already past", () => {
  assert.equal(domainYearsFor("2026-09-01", TODAY), 1);
  assert.equal(domainYearsFor("2019-06-15", TODAY), 1);
});

test("domainYearsFor covers three months after the wedding, boundaries included", () => {
  // Exactly 9 months away: the domain bought today expires the day cover ends.
  assert.equal(domainYearsFor("2027-07-02", TODAY), 1);
  assert.equal(domainYearsFor("2027-07-03", TODAY), 2);
  // 21 months away, then one day more.
  assert.equal(domainYearsFor("2028-07-02", TODAY), 2);
  assert.equal(domainYearsFor("2028-07-03", TODAY), 3);
  // 40 months away.
  assert.equal(domainYearsFor("2030-02-02", TODAY), 4);
});

test("domainYearsFor is capped at the registry's ten years", () => {
  assert.equal(domainYearsFor("2038-10-02", TODAY), DOMAIN_MAX_YEARS);
  assert.equal(DOMAIN_MAX_YEARS, 10);
});

test("domainYearsFor accepts a 29 February wedding", () => {
  // Cover runs to 2028-05-29, which one year from today does not reach.
  assert.equal(domainYearsFor("2028-02-29", TODAY), 2);
  assert.equal(domainYearsFor("2028-02-29", new Date("2027-05-29T00:00:00Z")), 1);
  assert.equal(domainYearsFor("2028-02-29", new Date("2027-05-28T00:00:00Z")), 2);
});

test("adding months clamps the day instead of rolling into the next month", () => {
  // 30 November + 3 months is 28 February 2027, never 2 March.
  assert.equal(domainYearsFor("2026-11-30", new Date("2026-03-01T00:00:00Z")), 1);
  // A year from 29 February is 28 February: the domain expires before 1 March.
  assert.equal(domainYearsFor("2028-12-01", new Date("2028-02-29T00:00:00Z")), 2);
});

test("domainYearsFor reads today as its UTC calendar date", () => {
  // Late in the UTC day is still the same day: exactly 9 months, 1 year.
  assert.equal(domainYearsFor("2027-07-02", new Date("2026-10-02T23:59:59Z")), 1);
  // Already 3 October in UTC, whatever the server's timezone says.
  assert.equal(domainYearsFor("2027-07-03", new Date("2026-10-02T23:30:00-05:00")), 1);
});

test("domainPrice is 65 € for the first year, then 20 € a year", () => {
  assert.equal(domainPrice(1), 65);
  assert.equal(domainPrice(2), 85);
  assert.equal(domainPrice(4), 125);
});

test("domainPrice refuses years the registry does not sell instead of guessing", () => {
  // A clamped price would charge for years the engine then buys differently.
  for (const years of [0, -3, Number.NaN, Number.POSITIVE_INFINITY, 2.7, 11, 12]) {
    assert.throws(() => domainPrice(years), RangeError, String(years));
  }
  assert.throws(() => domainPrice("2"), RangeError);
  assert.equal(domainPrice(DOMAIN_MAX_YEARS), 65 + 9 * 20);
});

test("parseDomainYears accepts a whole number of years from 1 to 10, as a number or a string", () => {
  assert.equal(parseDomainYears(1), 1);
  assert.equal(parseDomainYears(10), 10);
  assert.equal(parseDomainYears("2"), 2);
  assert.equal(parseDomainYears("10"), 10);
  for (const value of [
    0, 11, -1, 2.5, Number.NaN, Number.POSITIVE_INFINITY,
    "0", "11", "2.5", "-1", "abc", "", " 2", "1e1", "Infinity",
    undefined, null, true, [2], { years: 2 },
  ]) {
    assert.equal(parseDomainYears(value), null, String(value));
  }
});

test("computeOrderTotal never counts the RSVP towards Signature's four modules", () => {
  const four = ["countdown", "timeline", "map", "menu"];
  assert.equal(computeOrderTotal({ plan: "signature", modules: [...four, "rsvp"] }), 199);
  assert.equal(computeOrderTotal({ plan: "signature", modules: [...four, "faq", "rsvp"] }), 204);
});

test("computeOrderTotal bills the domain for its years", () => {
  const order = { plan: "signature", extras: ["custom-domain"] };
  assert.equal(computeOrderTotal({ ...order, domainYears: 1 }), 199 + 65);
  assert.equal(computeOrderTotal({ ...order, domainYears: 2 }), 199 + 85);
  assert.equal(computeOrderTotal({ ...order, domainYears: 4 }), 199 + 125);
  // Before the years are known, the domain is priced as one year.
  assert.equal(computeOrderTotal(order), 199 + 65);
  // A stored or sent value that is not a number of years the registry sells
  // is not a reason to refuse the whole order: it is priced as one year,
  // never as years nobody computed.
  for (const domainYears of [0, 11, 2.5, Number.NaN, "abc"]) {
    assert.equal(computeOrderTotal({ ...order, domainYears }), 199 + 65, String(domainYears));
  }
  assert.equal(computeOrderTotal({ ...order, domainYears: "3" }), 199 + 105);
});

test("computeOrderTotal ignores domain years when the domain is not ordered", () => {
  assert.equal(computeOrderTotal({ plan: "signature", domainYears: 4 }), 199);
  assert.equal(
    computeOrderTotal({ plan: "prestige", extras: ["custom-music"], domainYears: 3 }),
    499 + 10,
  );
  assert.equal(
    computeOrderTotal({ plan: "prestige", extras: ["custom-music", "custom-domain"], domainYears: 3 }),
    499 + 10 + 105,
  );
});
