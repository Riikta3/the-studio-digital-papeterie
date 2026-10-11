import assert from "node:assert/strict";
import test from "node:test";

import { buildInvoiceLines, frenchModuleName } from "./invoice-lines.ts";
import { buildOrderMetadata, parseOrderMetadata } from "./order-metadata.ts";
import { computeOrderTotal } from "./pricing.ts";

/*
 * The invoice for a checkout with the custom domain, built the way
 * `issueInvoiceForPayment` builds it: from the intent's metadata, read back by
 * `parseOrderMetadata`. Its lines must add up to the charge, or the invoice
 * is refused (`[INVOICE_TOTAL_MISMATCH]`) and the couple receives none.
 */

/** A paid intent carrying this order, as the payment route writes it. */
function intentFor({ domainName, domainYears }) {
  return {
    id: "pi_1",
    receipt_email: null,
    metadata: buildOrderMetadata({
      plan: "signature",
      // Six modules: four in the allowance, two billed.
      modules: ["rsvp", "gallery", "timeline", "accommodation", "faq", "gifts"],
      // French is included; English and German are paid extras.
      languages: ["fr", "en", "de"],
      extras: ["custom-music", "custom-domain"],
      email: "sophie@example.com",
      firstName: "Sophie",
      partnerName: "Pierre",
      domainName,
      domainYears,
    }),
  };
}

const sum = (lines) => lines.reduce((total, line) => total + line.total, 0);
const domainLines = (lines) => lines.filter((line) => line.label.startsWith("Nom de domaine"));

for (const years of [1, 2, 4]) {
  test(`a domain bought for ${years} year(s): the lines add up to the charge`, () => {
    const order = parseOrderMetadata(intentFor({ domainName: "sophie-et-pierre.com", domainYears: years }));
    const lines = buildInvoiceLines(order, frenchModuleName);

    assert.equal(sum(lines), computeOrderTotal(order));
    // The years are the intent's, and nothing was recomputed on the way.
    assert.equal(order.domainYears, years);

    const [domain] = domainLines(lines);
    assert.equal(domainLines(lines).length, 1);
    assert.equal(domain.label, `Nom de domaine personnalisé (.com) — ${years === 1 ? "1 an" : `${years} ans`}`);
    // The name the couple chose stays off the invoice: it can still be lost.
    assert.ok(lines.every((line) => !line.label.includes("sophie-et-pierre")));
  });
}

test("« plus tard »: the domain is invoiced for its years, without a name", () => {
  const order = parseOrderMetadata(intentFor({ domainName: undefined, domainYears: 2 }));
  assert.equal(order.domainName, undefined);

  const lines = buildInvoiceLines(order, frenchModuleName);
  assert.equal(sum(lines), computeOrderTotal(order));
  assert.deepEqual(domainLines(lines), [
    { label: "Nom de domaine personnalisé (.com) — 2 ans", quantity: 1, unitPrice: 85, total: 85 },
  ]);
});

test("an intent without years is invoiced, and was charged, for one", () => {
  const order = parseOrderMetadata(intentFor({ domainName: "sophie-et-pierre.com", domainYears: undefined }));
  assert.equal(order.domainYears, undefined);

  const lines = buildInvoiceLines(order, frenchModuleName);
  assert.equal(sum(lines), computeOrderTotal(order));
  assert.equal(domainLines(lines)[0].total, 65);
});

test("an order without the domain has no domain line", () => {
  const order = parseOrderMetadata(intentFor({ domainName: undefined, domainYears: undefined }));
  const withoutDomain = { ...order, extras: ["custom-music"] };
  const lines = buildInvoiceLines(withoutDomain, frenchModuleName);
  assert.deepEqual(domainLines(lines), []);
  assert.equal(sum(lines), computeOrderTotal(withoutDomain));
});
