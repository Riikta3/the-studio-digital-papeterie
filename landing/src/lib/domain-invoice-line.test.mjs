import assert from "node:assert/strict";
import test from "node:test";

import { domainInvoiceLine } from "./domain-invoice-line.ts";
import { PLAN_PRICES, computeOrderTotal, domainPrice } from "./pricing.ts";

test("the line names the domain and the years paid for", () => {
  assert.deepEqual(domainInvoiceLine("sophie-et-pierre.com", 2), {
    label: "Nom de domaine sophie-et-pierre.com — 2 ans",
    quantity: 1,
    unitPrice: 85,
    total: 85,
  });
  assert.equal(domainInvoiceLine("sophie-et-pierre.com", 1).label, "Nom de domaine sophie-et-pierre.com — 1 an");
});

test("without a name yet, the line says « personnalisé »", () => {
  assert.deepEqual(domainInvoiceLine(undefined, 1), {
    label: "Nom de domaine personnalisé — 1 an",
    quantity: 1,
    unitPrice: 65,
    total: 65,
  });
  assert.equal(domainInvoiceLine(undefined, 4).label, "Nom de domaine personnalisé — 4 ans");
});

test("the domain line reconciles with the amount charged", () => {
  for (const years of [1, 2, 4]) {
    const line = domainInvoiceLine("sophie-et-pierre.com", years);
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
