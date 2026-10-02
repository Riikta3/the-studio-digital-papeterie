import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDomainAddOnMetadata,
  checkDomainAddOnIntent,
  isDomainAddOn,
  isReusableDomainIntent,
  isUnsettledDomainAddOn,
  parseDomainAddOnMetadata,
} from "./domain-addon.ts";
import { buildAddOnMetadata } from "./module-addon.ts";

const order = {
  weddingId: "w1",
  siteId: "s1",
  userId: "u1",
  domainName: "sophie-et-pierre.com",
  domainYears: 2,
  amountCents: 8500,
  email: "camille@example.com",
  firstName: "Camille",
  partnerName: "Julien",
  locale: "fr",
};

const intent = (overrides = {}) => ({
  status: "succeeded",
  currency: "eur",
  amount: 8500,
  amount_received: 8500,
  metadata: buildDomainAddOnMetadata(order),
  ...overrides,
});

const withMeta = (changes) => intent({ metadata: { ...buildDomainAddOnMetadata(order), ...changes } });

test("metadata round-trips, without a plan key", () => {
  const metadata = buildDomainAddOnMetadata(order);
  assert.equal(metadata.plan, undefined);
  assert.equal(metadata.kind, "domain_addon");
  assert.equal(metadata.domain_name, "sophie-et-pierre.com");
  assert.equal(metadata.domain_years, "2");
  assert.equal(metadata.amount_cents, "8500");
  assert.equal("last_name" in metadata, false);
  assert.deepEqual(parseDomainAddOnMetadata(intent()), { ...order, lastName: undefined });
});

test("a checkout or a module add-on is not a domain add-on", () => {
  assert.equal(isDomainAddOn({ metadata: { plan: "signature", email: "x@example.com" } }), false);
  const moduleAddOn = {
    metadata: buildAddOnMetadata({
      weddingId: "w1",
      siteId: "s1",
      userId: "u1",
      modules: ["gallery"],
      unitPriceCents: 500,
      amountCents: 500,
      planId: "signature",
      email: "camille@example.com",
    }),
  };
  assert.equal(isDomainAddOn(moduleAddOn), false);
  assert.equal(parseDomainAddOnMetadata(moduleAddOn), null);
  assert.equal(isDomainAddOn({ metadata: null }), false);
  assert.equal(isDomainAddOn(intent()), true);
});

test("parseDomainAddOnMetadata refuses incomplete or impossible orders", () => {
  for (const key of ["wedding_id", "site_id", "user_id", "domain_name", "domain_years", "amount_cents"]) {
    assert.equal(parseDomainAddOnMetadata(withMeta({ [key]: "" })), null, key);
  }
  // Years outside what the registry sells, or not a whole number.
  for (const years of ["0", "11", "2.5", "-1", "two"]) {
    assert.equal(parseDomainAddOnMetadata(withMeta({ domain_years: years })), null, years);
  }
  // Only a valid, normalised `.com` label is a name the studio buys.
  for (const name of ["sophie-et-pierre.fr", "Sophie.com", "ab.com", "sophie.et.pierre.com", ".com", "sophie-et-pierre"]) {
    assert.equal(parseDomainAddOnMetadata(withMeta({ domain_name: name })), null, name);
  }
  assert.equal(parseDomainAddOnMetadata(withMeta({ amount_cents: "85.00" })), null);
});

test("the email falls back to the receipt email, and is required", () => {
  const noEmail = withMeta({ email: "" });
  assert.equal(parseDomainAddOnMetadata(noEmail), null);
  assert.equal(parseDomainAddOnMetadata({ ...noEmail, receipt_email: "julien@example.com" })?.email, "julien@example.com");
});

test("checkDomainAddOnIntent vouches only for a settled, well-formed, matching payment", () => {
  assert.equal(checkDomainAddOnIntent(intent()).ok, true);
  assert.equal(checkDomainAddOnIntent(intent(), { siteId: "s1" }).ok, true);
  assert.equal(checkDomainAddOnIntent(intent({ status: "processing" })).ok, false);
  assert.equal(checkDomainAddOnIntent(intent({ amount_received: 6500 })).ok, false);
  assert.equal(checkDomainAddOnIntent(intent({ currency: "usd" })).ok, false);
  // A PayPal return URL carrying another couple's payment.
  assert.equal(checkDomainAddOnIntent(intent(), { siteId: "someone-else" }).ok, false);
  // Two years for the price of one.
  const tampered = withMeta({ amount_cents: "6500" });
  assert.equal(checkDomainAddOnIntent({ ...tampered, amount_received: 6500 }).ok, false);
  // Years the registry does not sell.
  assert.equal(checkDomainAddOnIntent(withMeta({ domain_years: "0" })).ok, false);
  assert.equal(checkDomainAddOnIntent(withMeta({ domain_years: "11" })).ok, false);
});

test("a domain payment Stripe took, or is taking, for this site is unsettled: paying again would charge twice", () => {
  const site = { siteId: "s1" };
  assert.equal(isUnsettledDomainAddOn(intent(), site), true);
  assert.equal(isUnsettledDomainAddOn(intent({ status: "processing" }), site), true);
  assert.equal(isUnsettledDomainAddOn(intent({ status: "requires_payment_method" }), site), false);
  assert.equal(isUnsettledDomainAddOn(intent({ status: "requires_action" }), site), false);
  assert.equal(isUnsettledDomainAddOn(intent({ status: "canceled" }), site), false);
  // Another couple's payment, or one that is not a domain add-on at all.
  assert.equal(isUnsettledDomainAddOn(intent(), { siteId: "s2" }), false);
  assert.equal(isUnsettledDomainAddOn(intent({ metadata: { plan: "signature" } }), site), false);
  assert.equal(isUnsettledDomainAddOn(intent({ metadata: { kind: "module_addon", site_id: "s1" } }), site), false);
  // Metadata the studio could not have written.
  assert.equal(isUnsettledDomainAddOn(withMeta({ domain_years: "11" }), site), false);
});

test("an open intent for the same name, years and site is reused, nothing else is", () => {
  const open = intent({ status: "requires_payment_method" });
  assert.equal(isReusableDomainIntent(open, order), true);
  assert.equal(isReusableDomainIntent({ ...open, status: "requires_confirmation" }, order), true);
  assert.equal(isReusableDomainIntent({ ...open, status: "requires_action" }, order), true);
  assert.equal(isReusableDomainIntent({ ...open, status: "succeeded" }, order), false);
  assert.equal(isReusableDomainIntent({ ...open, status: "canceled" }, order), false);
  assert.equal(isReusableDomainIntent(open, { ...order, domainName: "sophie-pierre.com" }), false);
  assert.equal(isReusableDomainIntent(open, { ...order, domainYears: 3, amountCents: 10500 }), false);
  assert.equal(isReusableDomainIntent(open, { ...order, siteId: "s2" }), false);
  assert.equal(isReusableDomainIntent({ ...open, amount: 10500 }, order), false);
  assert.equal(isReusableDomainIntent({ ...open, currency: "usd" }, order), false);
  assert.equal(
    isReusableDomainIntent({ ...open, metadata: { ...open.metadata, kind: "module_addon" } }, order),
    false,
  );
});
