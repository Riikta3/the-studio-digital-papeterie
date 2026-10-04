import assert from "node:assert/strict";
import test from "node:test";

import { dayOfIncluded } from "./day-of-access.ts";

const NOW = "2026-11-01T10:00:00Z";

test("dayOfIncluded: unlimited plans always have the Jour J", () => {
  assert.equal(dayOfIncluded({ plan_id: "sur-mesure", modules: [], created_at: NOW }, false), true);
  assert.equal(dayOfIncluded({ plan_id: "prestige", modules: [], created_at: NOW }, false), true);
});

test("dayOfIncluded: Signature only with the module", () => {
  assert.equal(dayOfIncluded({ plan_id: "signature", modules: ["countdown"], created_at: NOW }, false), false);
  assert.equal(dayOfIncluded({ plan_id: "signature", modules: ["jour-j"], created_at: NOW }, false), true);
});

test("dayOfIncluded: sites sold before the module, or already on, keep it", () => {
  assert.equal(dayOfIncluded({ plan_id: "signature", modules: [], created_at: "2026-09-20T10:00:00Z" }, false), true);
  assert.equal(dayOfIncluded({ plan_id: "signature", modules: [], created_at: NOW }, true), true);
  assert.equal(dayOfIncluded(null, false), false);
});
