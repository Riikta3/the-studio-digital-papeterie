/**
 * What a guest's answer becomes on the wire, and how a playlist selection
 * behaves. Pure functions only: the hooks that wrap them are React.
 *
 *   node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs \
 *     --test landing/src/lib/theme-guest-forms.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_TRACKS,
  addTrack,
  isSearchable,
  removeTrack,
  toPlaylistSubmission,
} from "../components/invitation/themes/guest-playlist.ts";
import {
  MAX_CHILDREN,
  buildRsvpSubmission,
} from "../components/invitation/themes/guest-rsvp-payload.ts";

function form(entries) {
  const data = new FormData();
  for (const [name, value] of Object.entries(entries)) data.set(name, value);
  return data;
}

const base = {
  weddingId: "wedding-1",
  attending: true,
  partyMode: "solo",
  childCount: 0,
  allowChildren: true,
};

/* -- buildRsvpSubmission ------------------------------------------------ */

test("a solo guest sends their split name, diet and message", () => {
  const submission = buildRsvpSubmission({
    ...base,
    form: form({ fullName: "  Camille  Durand-Martin ", dietary: "Végétarien", message: "Merci !" }),
  });
  assert.deepEqual(submission, {
    weddingId: "wedding-1",
    firstName: "Camille",
    lastName: "Durand-Martin",
    attendance: true,
    dietary: "Végétarien",
    message: "Merci !",
    companions: [],
  });
});

test("a single-word name has an empty last name, and a blank form is still shaped", () => {
  assert.equal(buildRsvpSubmission({ ...base, form: form({ fullName: "Madonna" }) }).lastName, "");
  const empty = buildRsvpSubmission({ ...base, form: form({}) });
  assert.equal(empty.firstName, "");
  assert.equal(empty.dietary, "");
  assert.deepEqual(empty.companions, []);
});

test("a partner is a companion only when the guest comes with one", () => {
  const fields = form({ fullName: "Camille Durand", partnerName: "Jonas Petit" });
  const withPartner = buildRsvpSubmission({ ...base, partyMode: "partner", form: fields });
  assert.deepEqual(withPartner.companions, [{ firstName: "Jonas", lastName: "Petit" }]);
  assert.deepEqual(buildRsvpSubmission({ ...base, partyMode: "solo", form: fields }).companions, []);
});

test("children are companions that inherit the guest's surname", () => {
  const submission = buildRsvpSubmission({
    ...base,
    childCount: 2,
    form: form({ fullName: "Camille Durand", "childName-0": "Léo", "childName-1": "Alba Petit" }),
  });
  assert.deepEqual(submission.companions, [
    { firstName: "Léo", lastName: "Durand", relationType: "child" },
    { firstName: "Alba", lastName: "Petit", relationType: "child" },
  ]);
});

test("an adults-only wedding never sends children, whatever the form holds", () => {
  const submission = buildRsvpSubmission({
    ...base,
    allowChildren: false,
    childCount: 2,
    form: form({ fullName: "Camille Durand", "childName-0": "Léo" }),
  });
  assert.deepEqual(submission.companions, []);
});

test("blank child names are skipped and the count is capped", () => {
  const entries = { fullName: "Camille Durand" };
  for (let index = 0; index < 8; index += 1) entries[`childName-${index}`] = `Enfant${index}`;
  entries["childName-1"] = "   ";
  const submission = buildRsvpSubmission({ ...base, childCount: 99, form: form(entries) });
  assert.equal(submission.companions.length, MAX_CHILDREN - 1);
  assert.deepEqual(submission.companions.map((c) => c.firstName), ["Enfant0", "Enfant2", "Enfant3"]);
});

test("someone who is not coming sends nobody else, even with stale party state", () => {
  const submission = buildRsvpSubmission({
    ...base,
    attending: false,
    partyMode: "partner",
    childCount: 2,
    form: form({ fullName: "Camille Durand", partnerName: "Jonas Petit", "childName-0": "Léo" }),
  });
  assert.equal(submission.attendance, false);
  assert.deepEqual(submission.companions, []);
});

/* -- playlist selection ------------------------------------------------- */

const track = (id, extra = {}) => ({
  id,
  title: `Titre ${id}`,
  artist: `Artiste ${id}`,
  coverUrl: `https://img.test/${id}.jpg`,
  uri: `spotify:track:${id}`,
  spotifyUrl: `https://open.spotify.com/track/${id}`,
  ...extra,
});

test("a track is added once, up to the limit", () => {
  let selected = [];
  selected = addTrack(selected, track("a"));
  selected = addTrack(selected, track("b"));
  assert.deepEqual(selected.map((t) => t.id), ["a", "b"]);

  const unchanged = addTrack(selected, track("a"));
  assert.equal(unchanged, selected, "a duplicate returns the same array");

  selected = addTrack(selected, track("c"));
  assert.equal(selected.length, MAX_TRACKS);
  const full = addTrack(selected, track("d"));
  assert.equal(full, selected, "a fourth track is ignored");
});

test("a track can be taken back", () => {
  const selected = [track("a"), track("b")];
  assert.deepEqual(removeTrack(selected, "a").map((t) => t.id), ["b"]);
  assert.deepEqual(removeTrack(selected, "zzz").map((t) => t.id), ["a", "b"]);
});

test("the submission carries the ids the dashboard keys on, and no empty link", () => {
  const submission = toPlaylistSubmission("wedding-1", [
    track("a"),
    track("b", { spotifyUrl: null }),
  ]);
  assert.equal(submission.weddingId, "wedding-1");
  assert.deepEqual(submission.tracks[0], {
    id: "a",
    title: "Titre a",
    artist: "Artiste a",
    coverUrl: "https://img.test/a.jpg",
    spotifyUrl: "https://open.spotify.com/track/a",
  });
  assert.equal("spotifyUrl" in submission.tracks[1], false);
});

test("searching waits for two characters and stops once sent or full", () => {
  assert.equal(isSearchable("a", { sent: false, full: false }), false);
  assert.equal(isSearchable("  a ", { sent: false, full: false }), false);
  assert.equal(isSearchable("ab", { sent: false, full: false }), true);
  assert.equal(isSearchable("ab", { sent: true, full: false }), false);
  assert.equal(isSearchable("ab", { sent: false, full: true }), false);
});

/* -- diets, per person -------------------------------------------------- */

import { dietChoices, readDiet } from "../components/invitation/themes/guest-diet.ts";

function multiForm(entries) {
  const data = new FormData();
  for (const [name, value] of entries) data.append(name, value);
  return data;
}

test("the couple's list loses its own « Autre » and « Aucun », blanks and repeats", () => {
  assert.deepEqual(
    dietChoices(["Aucun", "Végétarien", " Sans gluten ", "", "végétarien", "Autre", "Halal"]),
    ["Végétarien", "Sans gluten", "Halal"],
  );
  assert.deepEqual(dietChoices(undefined), []);
});

test("one person's line: ticked options in order, then what they typed", () => {
  const data = multiForm([
    ["diet-self", "Sans gluten"],
    ["diet-self", "Halal"],
    ["diet-self", "Halal"],
    ["dietOther-self", "  arachides   et kiwi "],
    ["diet-partner", "Vegan"],
  ]);
  assert.equal(readDiet(data, "self"), "Sans gluten, Halal, arachides et kiwi");
  assert.equal(readDiet(data, "partner"), "Vegan");
  assert.equal(readDiet(data, "child-0"), "");
});

test("each person of the answer carries their own diet", () => {
  const data = multiForm([
    ["fullName", "Camille Durand"],
    ["diet-self", "Végétarien"],
    ["partnerName", "Sam Lee"],
    ["diet-partner", "Sans lactose"],
    ["dietOther-partner", "fraises"],
    ["childName-0", "Léo"],
    ["diet-child-0", "Sans gluten"],
    ["childName-1", "Inès"],
  ]);
  const submission = buildRsvpSubmission({ ...base, form: data, partyMode: "partner", childCount: 2 });
  assert.equal(submission.dietary, "Végétarien");
  assert.deepEqual(submission.companions, [
    { firstName: "Sam", lastName: "Lee", dietary: "Sans lactose, fraises" },
    { firstName: "Léo", lastName: "Durand", relationType: "child", dietary: "Sans gluten" },
    { firstName: "Inès", lastName: "Durand", relationType: "child" },
  ]);
});

test("a guest who is not coming sends no diet, and an old single field still counts", () => {
  const declined = multiForm([["fullName", "Camille Durand"], ["diet-self", "Halal"]]);
  assert.equal(buildRsvpSubmission({ ...base, attending: false, form: declined }).dietary, "");
  const legacy = multiForm([["fullName", "Camille Durand"], ["dietary", "Végétarien"]]);
  assert.equal(buildRsvpSubmission({ ...base, form: legacy }).dietary, "Végétarien");
});
