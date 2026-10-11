import type { InvoiceLine } from "./invoice-lines";
import { domainPrice } from "@/lib/pricing";
import { DOMAIN_TLD } from "@shared/lib/custom-domain";

/**
 * The custom domain's invoice line
 * (docs/superpowers/specs/2026-10-02-custom-domain-design.md, D1):
 * « Nom de domaine personnalisé (.com) — 2 ans ».
 *
 * It never names the domain. An invoice cannot be edited once issued, and
 * the name can still change after payment: the couple may not have chosen it
 * yet (« plus tard »), another of our couples may win it on the unique index,
 * or it may be registered elsewhere before the purchase engine buys it — in
 * each case the couple picks another for free (D2, D5). What was sold is the
 * registration for so many years, and that is what the line says.
 *
 * `buildInvoiceLines` must emit it itself: the domain has no `EXTRA_PRICES`
 * entry, since its price depends on the years, and the invoice would
 * otherwise come up short of the charge — `issueInvoiceForPayment` then
 * refuses to issue it. Priced with `domainPrice` from the years on the
 * intent, the same rule and figure the charge used.
 */
export function domainInvoiceLine(years: number): InvoiceLine {
  const price = domainPrice(years);
  const duration = years === 1 ? "1 an" : `${years} ans`;
  return {
    label: `Nom de domaine personnalisé (.${DOMAIN_TLD}) — ${duration}`,
    quantity: 1,
    unitPrice: price,
    total: price,
  };
}
