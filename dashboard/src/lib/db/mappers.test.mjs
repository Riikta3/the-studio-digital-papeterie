import { test } from "node:test";
import assert from "node:assert/strict";
import {
  rowToGuest, guestToRow,
  rowToHousehold, householdToRow,
  rowToEvent, eventToRow,
  rowToTable,
} from "./mappers.ts";

test("guest row maps guest_group to group and back", () => {
  const row = {
    id: "g-1", wedding_id: "w-1", household_id: "h-1",
    first_name: "Élodie", last_name: "Moreau",
    email: "e@example.com", phone: "0600000000",
    status: "confirmed", table_id: "t-1",
    is_child: false, is_plus_one: false,
    meal: "vegetarian", dietary_flags: ["gluten-free"],
    allergies: "arachides", notes: "témoin",
    guest_group: "friends",
  };
  const guest = rowToGuest(row);
  assert.equal(guest.group, "friends");
  assert.equal(guest.householdId, "h-1");
  assert.equal(guest.isChild, false);
  assert.deepEqual(guest.dietaryFlags, ["gluten-free"]);

  const back = guestToRow(guest);
  assert.equal(back.guest_group, "friends");
  assert.equal(back.household_id, "h-1");
  assert.equal(back.first_name, "Élodie");
  // The deprecated column must never be written.
  assert.ok(!("dietary_requirements" in back));
});

test("household row maps guest_group to group", () => {
  const h = rowToHousehold({
    id: "h-1", wedding_id: "w-1", name: "Famille Moreau",
    guest_group: "family", email: null, phone: null, address: null,
  });
  assert.equal(h.group, "family");
  assert.equal(h.email, undefined);
  assert.equal(householdToRow(h).guest_group, "family");
});

test("event date stays a plain YYYY-MM-DD string", () => {
  const e = rowToEvent({
    id: "e-1", wedding_id: "w-1", key: "wedding-day",
    name: "Cérémonie", date: "2027-06-19", time: "17h00",
    address: null, description: null, dress_code: null,
    position: 1, enabled: true,
  });
  assert.equal(e.date, "2027-06-19");
  assert.equal(e.dressCode, undefined);
  assert.equal(eventToRow(e).dress_code, null);
});

test("table rebuilds guestIds from the ids it is handed", () => {
  const t = rowToTable(
    { id: "t-1", wedding_id: "w-1", name: "Capri", capacity: 12,
      seats_label: "Table 1", position: 0, shape: "round", x: 120, y: 120 },
    ["g-1", "g-2"],
  );
  assert.deepEqual(t.guestIds, ["g-1", "g-2"]);
  assert.equal(t.seatsLabel, "Table 1");
  assert.equal(t.x, 120);
});

test("null columns become undefined, not the string null", () => {
  const g = rowToGuest({
    id: "g-2", wedding_id: "w-1", household_id: "h-1",
    first_name: "Marc", last_name: "Petit",
    email: null, phone: null, status: "pending", table_id: null,
    is_child: false, is_plus_one: false, meal: "standard",
    dietary_flags: null, allergies: null, notes: null, guest_group: "other",
  });
  assert.equal(g.email, undefined);
  assert.equal(g.tableId, undefined);
  assert.deepEqual(g.dietaryFlags, []);
});
