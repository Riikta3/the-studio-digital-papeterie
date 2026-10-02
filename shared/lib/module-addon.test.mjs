import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAddOnMetadata,
  checkAddOnIntent,
  isModuleAddOn,
  isReusableIntent,
  isUnsettledAddOn,
  parseAddOnMetadata,
} from "./module-addon.ts";

const order = {
  weddingId: "w1",
  siteId: "s1",
  userId: "u1",
  modules: ["gallery", "faq"],
  unitPriceCents: 500,
  amountCents: 1000,
  planId: "signature",
  email: "camille@example.com",
  firstName: "Camille",
  partnerName: "Julien",
  locale: "fr",
};

const intent = (overrides = {}) => ({
  status: "succeeded",
  currency: "eur",
  amount: 1000,
  amount_received: 1000,
  metadata: buildAddOnMetadata(order),
  ...overrides,
});

test("metadata round-trips, without a plan key", () => {
  const metadata = buildAddOnMetadata(order);
  assert.equal(metadata.plan, undefined);
  assert.equal(metadata.kind, "module_addon");
  assert.deepEqual(parseAddOnMetadata(intent()), { ...order, lastName: undefined });
});

test("a checkout or an old-dialog intent is not an add-on", () => {
  assert.equal(isModuleAddOn({ metadata: { plan: "signature", email: "x@example.com" } }), false);
  assert.equal(isModuleAddOn({ metadata: { type: "extra_module", module_id: "gallery", user_id: "u" } }), false);
  assert.equal(isModuleAddOn({ metadata: null }), false);
  assert.equal(isModuleAddOn(intent()), true);
});

test("checkAddOnIntent vouches only for a settled, well-formed, matching payment", () => {
  assert.equal(checkAddOnIntent(intent()).ok, true);
  assert.equal(checkAddOnIntent(intent(), { siteId: "s1" }).ok, true);
  assert.equal(checkAddOnIntent(intent({ status: "processing" })).ok, false);
  assert.equal(checkAddOnIntent(intent({ amount_received: 500 })).ok, false);
  assert.equal(checkAddOnIntent(intent({ currency: "usd" })).ok, false);
  // A PayPal return URL carrying another couple's payment.
  assert.equal(checkAddOnIntent(intent(), { siteId: "someone-else" }).ok, false);
  // Two modules for the price of one.
  const tampered = { ...buildAddOnMetadata(order), amount_cents: "500" };
  assert.equal(checkAddOnIntent(intent({ metadata: tampered, amount_received: 500 })).ok, false);
});

test("an open intent for the same basket is reused, nothing else is", () => {
  const open = intent({ status: "requires_payment_method" });
  assert.equal(isReusableIntent(open, order), true);
  assert.equal(isReusableIntent({ ...open, status: "succeeded" }, order), false);
  assert.equal(isReusableIntent({ ...open, status: "canceled" }, order), false);
  assert.equal(isReusableIntent(open, { ...order, modules: ["gallery"] }), false);
  assert.equal(isReusableIntent(open, { ...order, siteId: "s2" }), false);
  assert.equal(isReusableIntent({ ...open, amount: 1500 }, order), false);
});

test("a payment Stripe took for modules not live yet is unsettled: paying again would charge twice", () => {
  const site = { siteId: "s1", owned: ["rsvp"] };
  assert.equal(isUnsettledAddOn(intent(), site), true);
  assert.equal(isUnsettledAddOn(intent({ status: "processing" }), site), true);
  // One of the two still missing.
  assert.equal(isUnsettledAddOn(intent(), { siteId: "s1", owned: ["gallery"] }), true);
  // Granted since, by the fast path or the webhook.
  assert.equal(isUnsettledAddOn(intent(), { siteId: "s1", owned: ["gallery", "faq"] }), false);
  assert.equal(isUnsettledAddOn(intent({ status: "requires_payment_method" }), site), false);
  assert.equal(isUnsettledAddOn(intent({ status: "canceled" }), site), false);
  assert.equal(isUnsettledAddOn(intent(), { siteId: "s2", owned: [] }), false);
  assert.equal(isUnsettledAddOn(intent({ metadata: { plan: "signature" } }), site), false);
});
