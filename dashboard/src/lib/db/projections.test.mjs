import { test } from "node:test";
import assert from "node:assert/strict";
import {
  toSeatingGuest, toGroupsGuest, toMealsGuest, toGroupsHousehold, visibleMedia,
} from "./projections.ts";

const FULL_GUEST = {
  id: "g-1", firstName: "Élodie", lastName: "Moreau",
  email: "elodie@example.com", phone: "0600000000",
  householdId: "h-1", group: "friends",
  isChild: false, isPlusOne: false, status: "confirmed",
  meal: "vegetarian", dietaryFlags: ["gluten-free"],
  allergies: "arachides", notes: "témoin de la mariée",
  tableId: "t-1",
};

// Every field the seating board must never receive.
for (const forbidden of ["email", "phone", "notes", "allergies", "dietaryFlags", "meal"]) {
  test(`seating projection drops ${forbidden}`, () => {
    assert.ok(!(forbidden in toSeatingGuest(FULL_GUEST)));
  });
}

test("seating projection keeps what the board needs", () => {
  const s = toSeatingGuest(FULL_GUEST);
  assert.deepEqual(Object.keys(s).sort(),
    ["firstName", "id", "isChild", "lastName", "status", "tableId"]);
});

for (const forbidden of ["email", "phone", "notes", "allergies"]) {
  test(`groups projection drops ${forbidden}`, () => {
    assert.ok(!(forbidden in toGroupsGuest(FULL_GUEST)));
  });
}

// The meals screen displays allergies and dietary flags: they are its subject.
// Contact details and private notes are not.
for (const forbidden of ["email", "phone", "notes"]) {
  test(`meals projection drops ${forbidden}`, () => {
    assert.ok(!(forbidden in toMealsGuest(FULL_GUEST)));
  });
}

test("meals projection keeps the dietary fields it exists to show", () => {
  const m = toMealsGuest(FULL_GUEST);
  assert.equal(m.meal, "vegetarian");
  assert.deepEqual(m.dietaryFlags, ["gluten-free"]);
  assert.equal(m.allergies, "arachides");
});

test("household projection drops contact details", () => {
  const h = toGroupsHousehold({
    id: "h-1", name: "Famille Moreau", group: "family",
    email: "contact@example.com", phone: "0600000000",
    address: "12 rue des Lilas",
  });
  assert.ok(!("email" in h));
  assert.ok(!("phone" in h));
  assert.ok(!("address" in h));
  assert.equal(h.name, "Famille Moreau");
});

test("hidden media never reaches the client", () => {
  const media = [
    { id: "m-1", kind: "photo", url: "u1", uploadedAt: "2027-06-19", hidden: false },
    { id: "m-2", kind: "photo", url: "u2", uploadedAt: "2027-06-19", hidden: true },
  ];
  const visible = visibleMedia(media);
  assert.equal(visible.length, 1);
  assert.equal(visible[0].id, "m-1");
});
