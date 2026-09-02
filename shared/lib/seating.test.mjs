import assert from "node:assert/strict";
import test from "node:test";

import {
  assignGuest,
  searchSeatedGuests,
  seatingSummary,
  tableOfGuest,
  unassignGuest,
  unseatedGuests,
} from "./seating.ts";

const guests = [
  { id: "g1", firstName: "Marie", lastName: "Dupont", isChild: false, status: "confirmed" },
  { id: "g2", firstName: "Jordy", lastName: "Moreau", isChild: false, status: "confirmed" },
  { id: "g3", firstName: "Léa", lastName: "Blanc", isChild: true, status: "confirmed" },
  { id: "g4", firstName: "Hugo", lastName: "Roux", isChild: false, status: "pending" },
  { id: "g5", firstName: "Marion", lastName: "Caron", isChild: false, status: "declined" },
];

const tables = [
  { id: "t1", name: "Capri", shape: "round", capacity: 2, x: 0, y: 0, position: 0, guestIds: ["g1"] },
  { id: "t2", name: "Amalfi", shape: "round", capacity: 4, x: 0, y: 0, position: 1, guestIds: [] },
];

test("summary counts seated, unseated and capacity", () => {
  const s = seatingSummary(tables, guests);
  assert.equal(s.seated, 1);
  // Only confirmed guests are seatable: g4 pending and g5 declined don't count.
  assert.equal(s.seatable, 3);
  assert.equal(s.unseated, 2);
  assert.equal(s.totalCapacity, 6);
});

test("assigning a guest puts them on the table", () => {
  const next = assignGuest(tables, "g2", "t1");
  assert.deepEqual(next.find((t) => t.id === "t1").guestIds, ["g1", "g2"]);
});

test("a guest can only sit at one table", () => {
  const next = assignGuest(assignGuest(tables, "g2", "t1"), "g2", "t2");
  assert.deepEqual(next.find((t) => t.id === "t1").guestIds, ["g1"]);
  assert.deepEqual(next.find((t) => t.id === "t2").guestIds, ["g2"]);
});

test("capacity is never exceeded", () => {
  const full = assignGuest(tables, "g2", "t1"); // t1 capacity is 2, now full
  const next = assignGuest(full, "g3", "t1");
  assert.deepEqual(next.find((t) => t.id === "t1").guestIds, ["g1", "g2"]);
});

test("assigning a guest already at that table changes nothing", () => {
  const next = assignGuest(tables, "g1", "t1");
  assert.deepEqual(next.find((t) => t.id === "t1").guestIds, ["g1"]);
});

test("unassigning removes the guest from every table", () => {
  const next = unassignGuest(tables, "g1");
  assert.deepEqual(next.find((t) => t.id === "t1").guestIds, []);
});

test("unseated lists confirmed guests only", () => {
  const list = unseatedGuests(tables, guests).map((g) => g.id);
  assert.deepEqual(list, ["g2", "g3"]);
});

test("tableOfGuest finds the table, or undefined", () => {
  assert.equal(tableOfGuest(tables, "g1").name, "Capri");
  assert.equal(tableOfGuest(tables, "g2"), undefined);
});

test("search needs at least two characters", () => {
  assert.deepEqual(searchSeatedGuests(tables, guests, "m"), []);
});

test("search matches first or last name, case and accent insensitive", () => {
  const byFirst = searchSeatedGuests(tables, guests, "mar");
  assert.deepEqual(byFirst, [
    { firstName: "Marie", lastName: "Dupont", tableName: "Capri", seatsLabel: undefined },
  ]);
  assert.equal(searchSeatedGuests(tables, guests, "DUPONT").length, 1);
});

test("search never returns unseated or unconfirmed guests", () => {
  assert.deepEqual(searchSeatedGuests(tables, guests, "jordy"), []);
  assert.deepEqual(searchSeatedGuests(tables, guests, "marion"), []);
});

test("search skips a seated guest who is not confirmed", () => {
  // Reachable state: assignGuest never checks status, so a pending guest can
  // end up seated. The privacy boundary must still exclude them.
  const pending = [
    { id: "p1", firstName: "Paul", lastName: "Pending", isChild: false, status: "pending" },
    { id: "p2", firstName: "Paula", lastName: "Declined", isChild: false, status: "declined" },
  ];
  const seatedTable = [{
    id: "tp", name: "Ischia", shape: "round", capacity: 8, x: 0, y: 0,
    position: 0, guestIds: ["p1", "p2"],
  }];
  assert.deepEqual(searchSeatedGuests(seatedTable, pending, "pau"), []);
});

test("search caps at five results", () => {
  const many = Array.from({ length: 9 }, (_, i) => ({
    id: `x${i}`, firstName: "Alexandre", lastName: `Nom${i}`,
    isChild: false, status: "confirmed",
  }));
  const bigTable = [{
    id: "t9", name: "Grande", shape: "long", capacity: 20, x: 0, y: 0,
    position: 0, guestIds: many.map((g) => g.id),
  }];
  assert.equal(searchSeatedGuests(bigTable, many, "alex").length, 5);
});
