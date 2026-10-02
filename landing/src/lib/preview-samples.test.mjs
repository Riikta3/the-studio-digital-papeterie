import assert from "node:assert/strict";
import test from "node:test";

import { MODULE_SAMPLES, withSamples } from "./preview-samples.ts";

const base = () => ({
  couple: { partner1: "Camille", partner2: "Julien" },
  event: { date: "2027-06-12" },
  venue: { name: "Domaine des Oliviers", city: "Lourmarin" },
  modules: ["gallery", "faq", "transport", "rsvp"],
  faq: [{ question: "Parking ?", answer: "Oui." }],
});

test("an empty module gets the shared sample when the theme's demo has none", () => {
  const { data, sampled } = withSamples(base(), {}, ["gallery", "faq", "rsvp"]);
  assert.deepEqual(data.gallery, MODULE_SAMPLES.gallery);
  assert.deepEqual(data.faq, [{ question: "Parking ?", answer: "Oui." }], "the couple's own content wins");
  assert.deepEqual(sampled, ["gallery"]);
});

test("the theme's own demo comes before the shared sample", () => {
  const demo = { gallery: { images: ["/themes/x/demo.webp"] } };
  assert.deepEqual(withSamples(base(), demo, ["gallery"]).data.gallery, demo.gallery);
});

test("transport samples the venue's travel directions only when there are none", () => {
  const sampled = withSamples(base(), {}, ["transport"]);
  assert.ok(sampled.data.venue.access.length > 0);
  assert.deepEqual(sampled.sampled, ["transport"]);

  const filled = base();
  filled.venue.access = [{ mode: "En voiture", details: "A7, sortie Cavaillon" }];
  assert.deepEqual(withSamples(filled, {}, ["transport"]).sampled, []);
});

test("nothing is sampled for modules that are not listed", () => {
  const { data, sampled } = withSamples(base(), {}, []);
  assert.equal(data.gallery, undefined);
  assert.deepEqual(sampled, []);
});
