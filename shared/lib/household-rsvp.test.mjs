import assert from "node:assert/strict";
import test from "node:test";

import { householdStatusFromGuests, isSamePerson, rankHouseholds, rsvpNameKey } from "./household-rsvp.ts";

test("rsvpNameKey ignores case, accents, hyphens and apostrophes like the SQL one", () => {
  assert.equal(rsvpNameKey("  Jean-Éric  D'Almeida "), "jean eric d almeida");
  assert.equal(rsvpNameKey("ÀÉÎÕÜÇ"), "aeiouc");
});

test("isSamePerson wants the whole name, in either order", () => {
  const claire = { first_name: "Claire", last_name: "Dubois-Hélène" };
  assert.ok(isSamePerson("claire dubois helene", claire));
  assert.ok(isSamePerson("Dubois Hélène Claire", claire));
  assert.ok(!isSamePerson("Claire", claire));
  assert.ok(!isSamePerson("Claire Dubois", claire));
});

test("householdStatusFromGuests derives the household from its members", () => {
  assert.equal(householdStatusFromGuests(["confirmed", "confirmed"]), "confirmed");
  assert.equal(householdStatusFromGuests(["declined", "declined"]), "declined");
  assert.equal(householdStatusFromGuests(["confirmed", "declined"]), "partial");
  assert.equal(householdStatusFromGuests(["confirmed", "pending"]), "partial");
  assert.equal(householdStatusFromGuests(["declined", "pending"]), "pending");
  assert.equal(householdStatusFromGuests([]), null);
});

test("rankHouseholds puts the respondent's household first, then a companion's, then a surname", () => {
  const households = [
    { id: "a", name: "Amis de fac", guests: [{ first_name: "Zoé", last_name: "Petit" }] },
    { id: "b", name: "Bernard", guests: [{ first_name: "Luc", last_name: "Martin" }] },
    { id: "c", name: "Cousins", guests: [{ first_name: "Léa", last_name: "Roux" }] },
    { id: "d", name: "Famille Martin", guests: [{ first_name: "Paul", last_name: "Martin" }] },
  ];
  const ranked = rankHouseholds(households, { respondent: "Paul Martin", companions: ["Lea Roux"] });
  assert.deepEqual(
    ranked.map(({ household, score }) => [household.id, score]),
    [["d", 3], ["c", 2], ["b", 1], ["a", 0]],
  );
});
