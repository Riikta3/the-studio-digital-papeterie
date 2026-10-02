import assert from "node:assert/strict";
import test from "node:test";

import { MONTHS_FR, checkedWeddingDate, monthIndexFrom, weddingDateFrom } from "./wedding-date.ts";

// `StudioStart.months` as the messages hold it (a test cannot import the JSON).
const FR = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const JA = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

test("weddingDateFrom reads a French month label", () => {
  assert.equal(weddingDateFrom({ day: "14", month: "Mars", year: "2027" }, FR), "2027-03-14");
  assert.equal(weddingDateFrom({ day: "14", month: "  décembre ", year: "2027" }, FR), "2027-12-14");
});

test("weddingDateFrom reads a label in the couple's own locale", () => {
  assert.equal(weddingDateFrom({ day: "21", month: "September", year: "2028" }, EN), "2028-09-21");
  assert.equal(weddingDateFrom({ day: "21", month: "10月", year: "2028" }, JA), "2028-10-21");
});

test("weddingDateFrom still reads a French label from a basket stored before the fix", () => {
  assert.equal(weddingDateFrom({ day: "2", month: "Février", year: "2027" }, EN), "2027-02-02");
  assert.equal(monthIndexFrom("Août", JA), 8);
  assert.equal(MONTHS_FR.length, 12);
});

test("weddingDateFrom gives nothing for an unknown label or a missing part", () => {
  assert.equal(weddingDateFrom({ day: "14", month: "Brumaire", year: "2027" }, FR), undefined);
  assert.equal(weddingDateFrom({ day: "14", month: "", year: "2027" }, FR), undefined);
  assert.equal(weddingDateFrom({ day: "", month: "Mars", year: "2027" }, FR), undefined);
  assert.equal(weddingDateFrom({ day: "14", month: "Mars", year: "" }, FR), undefined);
  assert.equal(monthIndexFrom("Brumaire", FR), 0);
});

test("weddingDateFrom gives nothing for a day the month does not have", () => {
  // The day field accepts 1-31 whatever the month, so these reach the helper.
  assert.equal(weddingDateFrom({ day: "31", month: "Avril", year: "2027" }, FR), undefined);
  assert.equal(weddingDateFrom({ day: "30", month: "Février", year: "2028" }, FR), undefined);
  assert.equal(weddingDateFrom({ day: "29", month: "February", year: "2027" }, EN), undefined);
  // 2028 is a leap year: its 29 February exists.
  assert.equal(weddingDateFrom({ day: "29", month: "February", year: "2028" }, EN), "2028-02-29");
  assert.equal(weddingDateFrom({ day: "30", month: "Avril", year: "2027" }, FR), "2027-04-30");
});

test("weddingDateFrom gives nothing for a day or year that is not a number", () => {
  assert.equal(weddingDateFrom({ day: "0", month: "Mars", year: "2027" }, FR), undefined);
  assert.equal(weddingDateFrom({ day: "x", month: "Mars", year: "2027" }, FR), undefined);
  assert.equal(weddingDateFrom({ day: "14", month: "Mars", year: "202" }, FR), undefined);
});

test("weddingDateFrom pads the day and the month", () => {
  assert.equal(weddingDateFrom({ day: "5", month: "January", year: "2028" }, EN), "2028-01-05");
  assert.equal(weddingDateFrom({ day: "05", month: "Juin", year: "2028" }, FR), "2028-06-05");
});

test("checkedWeddingDate keeps a real YYYY-MM-DD date as is", () => {
  assert.equal(checkedWeddingDate("2027-12-04"), "2027-12-04");
  assert.equal(checkedWeddingDate("2028-02-29"), "2028-02-29");
});

test("checkedWeddingDate drops a date that does not exist or is not date-only", () => {
  for (const value of [
    "2027-04-31",
    "2027-02-29",
    "2027-13-01",
    "2027-12-4",
    "04/12/2027",
    "2027-12-04T10:00:00Z",
    " 2027-12-04",
    "",
    undefined,
    null,
    20271204,
  ]) {
    assert.equal(checkedWeddingDate(value), undefined, String(value));
  }
});
