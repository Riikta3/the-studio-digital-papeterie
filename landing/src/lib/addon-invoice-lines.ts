import type { InvoiceLine } from "./invoice-lines";

/**
 * The invoice lines for modules bought after the sale (spec D7). Every one is
 * at the add-on price: the modules a plan includes are granted free at save
 * and are not a sale. One line, like the checkout's « Modules
 * supplémentaires », so the two invoices read alike.
 *
 * Kept apart from `invoice-lines.ts`, whose French message import the test
 * runner cannot load.
 */
export function buildAddOnInvoiceLines(
  modules: readonly string[],
  unitPriceEuros: number,
  moduleName: (id: string) => string,
): InvoiceLine[] {
  if (modules.length === 0) return [];
  return [
    {
      label: `Modules supplémentaires (${modules.map(moduleName).join(", ")})`,
      quantity: modules.length,
      unitPrice: unitPriceEuros,
      total: modules.length * unitPriceEuros,
    },
  ];
}

/** Who an invoice is made out to: « Camille Martin & Julien ». */
export function invoiceCustomerName(firstName?: string, lastName?: string, partnerName?: string): string {
  const customer = [firstName, lastName].filter(Boolean).join(" ").trim();
  const partner = partnerName?.trim();
  if (customer && partner) return `${customer} & ${partner}`;
  return customer || partner || "";
}
