import assert from "node:assert/strict";
import test from "node:test";

import { buildAddOnInvoiceLines, invoiceCustomerName } from "./addon-invoice-lines.ts";

const names = { gallery: "Galerie Photo", faq: "FAQ / Pratique" };

test("one line for the modules bought, at the add-on price", () => {
  assert.deepEqual(buildAddOnInvoiceLines(["gallery", "faq"], 5, (id) => names[id]), [
    { label: "Modules supplémentaires (Galerie Photo, FAQ / Pratique)", quantity: 2, unitPrice: 5, total: 10 },
  ]);
  assert.deepEqual(buildAddOnInvoiceLines([], 5, String), []);
});

test("the invoice is made out to the couple", () => {
  assert.equal(invoiceCustomerName("Camille", "Martin", "Julien"), "Camille Martin & Julien");
  assert.equal(invoiceCustomerName("Camille", undefined, undefined), "Camille");
  assert.equal(invoiceCustomerName(undefined, undefined, "Julien"), "Julien");
  assert.equal(invoiceCustomerName(), "");
});
