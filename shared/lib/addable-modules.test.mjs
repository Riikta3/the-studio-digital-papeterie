import assert from "node:assert/strict";
import test from "node:test";

import { addableModules, amountDue, knownModuleIds, splitUnpaid } from "./addable-modules.ts";

const OWNED_FOUR = ["countdown", "timeline", "map", "rsvp"];

test("addableModules offers what the theme draws and the couple lacks, in catalogue order", () => {
  const list = addableModules("ciao-amore", OWNED_FOUR, ["gallery"]);
  assert.deepEqual(list, ["intro-video", "dress-code", "accommodation", "transport", "menu", "gift-list", "playlist", "faq"]);
  assert.ok(!addableModules("belle-rive", []).includes("gallery"));
});

test("splitUnpaid gives the plan's free slots to the first modules added", () => {
  assert.deepEqual(splitUnpaid("signature", ["countdown", "timeline", "rsvp"], ["gallery", "faq"], "ciao-amore"), {
    free: ["gallery"],
    billable: ["faq"],
    ignored: [],
  });
  assert.deepEqual(splitUnpaid("prestige", OWNED_FOUR, ["gallery", "faq"], "ciao-amore").billable, []);
});

test("splitUnpaid ignores unknown, owned, duplicated and undrawn ids", () => {
  assert.deepEqual(
    splitUnpaid("signature", OWNED_FOUR, ["gallery", "gallery", "rsvp", "guestbook", "nope"], "ciao-amore"),
    { free: [], billable: ["gallery"], ignored: ["gallery", "rsvp", "guestbook", "nope"] },
  );
  // Written by hand through the API on a theme that cannot draw it.
  assert.deepEqual(splitUnpaid("signature", OWNED_FOUR, ["gallery"], "belle-rive").billable, []);
});

test("amountDue is what the billable unpaid modules cost, in cents", () => {
  assert.deepEqual(amountDue("signature", OWNED_FOUR, ["gallery", "faq"], "ciao-amore"), {
    modules: ["gallery", "faq"],
    amountCents: 1000,
  });
  assert.equal(amountDue("prestige", OWNED_FOUR, ["gallery"], "ciao-amore"), null);
  assert.equal(amountDue("signature", OWNED_FOUR, [], "ciao-amore"), null);
});

test("knownModuleIds drops what is not a module, and duplicates", () => {
  assert.deepEqual(knownModuleIds(["faq", "hero", "faq", "nope", "gallery"]), ["faq", "gallery"]);
});
