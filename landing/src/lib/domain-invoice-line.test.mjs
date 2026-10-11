import assert from "node:assert/strict";
import test from "node:test";

import { domainInvoiceLine } from "./domain-invoice-line.ts";
import { PLAN_PRICES, computeOrderTotal, domainPrice } from "./pricing.ts";

test("the line states the years paid for, never the name", () => {
  assert.deepEqual(domainInvoiceLine(2), {
    label: "Nom de domaine personnalisé (.com) — 2 ans",
    quantity: 1,
    unitPrice: 85,
    total: 85,
  });
  assert.deepEqual(domainInvoiceLine(1), {
    label: "Nom de domaine personnalisé (.com) — 1 an",
    quantity: 1,
    unitPrice: 65,
    total: 65,
  });
  assert.equal(domainInvoiceLine(4).label, "Nom de domaine personnalisé (.com) — 4 ans");
});

test("the domain line reconciles with the amount charged", () => {
  for (const years of [1, 2, 4]) {
    const line = domainInvoiceLine(years);
    assert.equal(line.total, domainPrice(years), `${years} years`);
    assert.equal(line.quantity * line.unitPrice, line.total, `${years} years`);

    // What `buildInvoiceLines` emits for this order: the plan line, then the
    // domain line (no module beyond the allowance, no extra language).
    const charged = computeOrderTotal({
      plan: "signature",
      modules: ["rsvp"],
      languages: ["fr"],
      extras: ["custom-domain"],
      domainYears: years,
    });
    assert.equal(PLAN_PRICES.signature + line.total, charged, `${years} years`);
  }
});
