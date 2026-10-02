import assert from "node:assert/strict";
import test from "node:test";

import { planDomainForCheckout } from "./checkout-domain.ts";

const NOW = new Date("2026-10-02T10:00:00Z");
const WITH_DOMAIN = ["custom-music", "custom-domain"];

test("no domain in the extras: nothing to plan, whatever the browser sent", () => {
  assert.deepEqual(
    planDomainForCheckout({ extras: ["custom-music"], domain: { label: "sophie" }, weddingDate: "2027-12-04", now: NOW }),
    { wanted: false },
  );
  assert.deepEqual(planDomainForCheckout({ extras: undefined, domain: undefined, weddingDate: undefined, now: NOW }), {
    wanted: false,
  });
  // A hand-made request: extras is not a list.
  assert.deepEqual(planDomainForCheckout({ extras: "custom-domain", domain: undefined, weddingDate: undefined, now: NOW }), {
    wanted: false,
  });
});

test("the years come from the wedding date and the server's today", () => {
  // 14 months ahead: the domain must run until 17 months from now.
  assert.equal(planDomainForCheckout({ extras: WITH_DOMAIN, weddingDate: "2027-12-04", now: NOW }).years, 2);
  // Exactly 9 months ahead is still one year.
  assert.equal(planDomainForCheckout({ extras: WITH_DOMAIN, weddingDate: "2027-07-02", now: NOW }).years, 1);
  // No date, or one that does not exist: one year.
  assert.equal(planDomainForCheckout({ extras: WITH_DOMAIN, weddingDate: undefined, now: NOW }).years, 1);
  assert.equal(planDomainForCheckout({ extras: WITH_DOMAIN, weddingDate: "2027-04-31", now: NOW }).years, 1);
});

test("a label is normalised into the name the studio will buy", () => {
  assert.deepEqual(
    planDomainForCheckout({
      extras: WITH_DOMAIN,
      domain: { label: "Sophie et Pierre" },
      weddingDate: "2027-12-04",
      now: NOW,
    }),
    { wanted: true, years: 2, name: "sophie-et-pierre.com" },
  );
  assert.equal(
    planDomainForCheckout({ extras: WITH_DOMAIN, domain: { label: "https://www.Hélène-Joël.com/" }, now: NOW }).name,
    "helene-joel.com",
  );
});

test("« plus tard », or no label at all, plans the domain without a name", () => {
  for (const domain of [
    { later: true },
    { later: true, label: "sophie-et-pierre" },
    { label: "" },
    { label: "   " },
    {},
    undefined,
    null,
  ]) {
    assert.deepEqual(
      planDomainForCheckout({ extras: WITH_DOMAIN, domain, weddingDate: "2027-12-04", now: NOW }),
      { wanted: true, years: 2 },
      JSON.stringify(domain),
    );
  }
});

test("a label that cannot be bought is flagged invalid, with the name it gave", () => {
  assert.deepEqual(planDomainForCheckout({ extras: WITH_DOMAIN, domain: { label: "ab" }, now: NOW }), {
    wanted: true,
    years: 1,
    name: "ab.com",
    invalid: true,
  });
  assert.equal(planDomainForCheckout({ extras: WITH_DOMAIN, domain: { label: "سارة" }, now: NOW }).invalid, true);
  assert.equal(
    planDomainForCheckout({ extras: WITH_DOMAIN, domain: { label: "a".repeat(64) }, now: NOW }).invalid,
    true,
  );
  // Normalising collapses the hyphens, so the punycode prefix cannot survive.
  assert.deepEqual(planDomainForCheckout({ extras: WITH_DOMAIN, domain: { label: "xn--abc" }, now: NOW }), {
    wanted: true,
    years: 1,
    name: "xn-abc.com",
  });
});

test("a label that is not a string is ignored rather than trusted", () => {
  assert.deepEqual(planDomainForCheckout({ extras: WITH_DOMAIN, domain: { label: 42 }, now: NOW }), {
    wanted: true,
    years: 1,
  });
});
