// Type only: `invoice-lines.ts` imports the French message file, which the
// test runner cannot load, and a type import is erased before anything runs.
import type { InvoiceLine } from "./invoice-lines";
import { domainPrice } from "@/lib/pricing";

/**
 * The custom domain's invoice line
 * (docs/superpowers/specs/2026-10-02-custom-domain-design.md, D1):
 * « Nom de domaine sophie-et-pierre.com — 2 ans », or « Nom de domaine
 * personnalisé — 1 an » while the couple has not chosen it yet.
 *
 * `buildInvoiceLines` must emit it itself: the domain has no `EXTRA_PRICES`
 * entry, since its price depends on the years, and the invoice would
 * otherwise come up short of the charge — `issueInvoiceForPayment` then
 * refuses to issue it. Priced with `domainPrice` from the years on the
 * intent, the same rule and figure the charge used.
 */
export function domainInvoiceLine(name: string | undefined, years: number): InvoiceLine {
  const price = domainPrice(years);
  const duration = years === 1 ? "1 an" : `${years} ans`;
  return {
    label: `Nom de domaine ${name ?? "personnalisé"} — ${duration}`,
    quantity: 1,
    unitPrice: price,
    total: price,
  };
}
