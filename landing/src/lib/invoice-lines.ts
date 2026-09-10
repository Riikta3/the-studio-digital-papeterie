import frMessages from "../../messages/fr.json";
import {
  EXTRA_MODULE_PRICE,
  EXTRA_PRICES,
  FREE_MODULES_LIMIT,
  LANGUAGE_PRICE,
  PLAN_PRICES,
  hasMeteredModules,
  type OrderItems,
} from "@/lib/pricing";

/**
 * Turns an order into the itemised lines a French invoice must show.
 *
 * An invoice has to detail each item sold with its unit price and quantity —
 * a single "Formule Signature 314 €" line would not be compliant, and would
 * leave the couple unable to see what they actually paid for.
 *
 * Prices come from `lib/pricing.ts`, the same module the charge is computed
 * from, so the invoice total can never disagree with the amount taken. The
 * total is nonetheless reconciled against Stripe before the PDF is written.
 */

export interface InvoiceLine {
  label: string;
  quantity: number;
  /** Unit price in euros. */
  unitPrice: number;
  /** quantity × unitPrice, in euros. */
  total: number;
}

/** Human labels for the paid extras, matching the studio's option cards. */
const EXTRA_LABELS: Record<string, string> = {
  "custom-music": "Musique personnalisée",
  "custom-illustration": "Illustration personnalisée",
  "animated-video": "Vidéo animée",
  "custom-domain": "Nom de domaine personnalisé",
};

/** Plan labels as sold on the homepage pricing cards. */
const PLAN_LABELS: Record<string, string> = {
  signature: "Formule Signature",
  "sur-mesure": "Formule Sur-Mesure",
  prestige: "Formule Prestige",
};

/**
 * Builds the invoice lines for an order.
 *
 * `moduleName` resolves a module id to its display name. The webhook has no
 * next-intl context, so it passes a plain lookup rather than a translator —
 * invoices are issued in French regardless of the couple's browsing locale,
 * which is what a French accounting document requires.
 */
export function buildInvoiceLines(
  items: OrderItems,
  moduleName: (id: string) => string,
): InvoiceLine[] {
  const lines: InvoiceLine[] = [];

  const plan = items.plan ?? "";
  const basePrice = PLAN_PRICES[plan];

  if (basePrice !== undefined) {
    lines.push({
      label: PLAN_LABELS[plan] ?? `Formule ${plan}`,
      quantity: 1,
      unitPrice: basePrice,
      total: basePrice,
    });
  }

  const modules = items.modules ?? [];

  // Metered plans include an allowance; only the overage is billed, so the
  // invoice shows the included modules at 0 € rather than hiding them — the
  // couple paid for a bundle and should see what it contained.
  if (modules.length > 0) {
    const billableCount = hasMeteredModules(plan)
      ? Math.max(0, modules.length - FREE_MODULES_LIMIT)
      : 0;

    const includedCount = modules.length - billableCount;

    if (includedCount > 0) {
      lines.push({
        label: `Modules inclus dans la formule (${modules
          .slice(0, includedCount)
          .map(moduleName)
          .join(", ")})`,
        quantity: includedCount,
        unitPrice: 0,
        total: 0,
      });
    }

    if (billableCount > 0) {
      lines.push({
        label: `Modules supplémentaires (${modules
          .slice(includedCount)
          .map(moduleName)
          .join(", ")})`,
        quantity: billableCount,
        unitPrice: EXTRA_MODULE_PRICE,
        total: billableCount * EXTRA_MODULE_PRICE,
      });
    }
  }

  const languages = items.languages ?? [];
  if (languages.length > 0) {
    lines.push({
      label: `Langues supplémentaires (${languages.join(", ").toUpperCase()})`,
      quantity: languages.length,
      unitPrice: LANGUAGE_PRICE,
      total: languages.length * LANGUAGE_PRICE,
    });
  }

  for (const extra of items.extras ?? []) {
    const price = EXTRA_PRICES[extra];
    if (price === undefined) continue;

    lines.push({
      label: EXTRA_LABELS[extra] ?? extra,
      quantity: 1,
      unitPrice: price,
      total: price,
    });
  }

  return lines;
}

/**
 * Resolves a module id to its French name, for invoices issued outside i18n.
 *
 * Reads the same `StudioModules.catalog` entries the studio displays, through
 * a translator built over the French message file. The webhook runs with no
 * request context, so `getTranslations()` is unavailable there — and an
 * invoice must be French regardless of the couple's locale anyway.
 */
export function frenchModuleName(id: string): string {
  const entry = (
    frMessages as { StudioModules?: { catalog?: Record<string, { name?: string }> } }
  ).StudioModules?.catalog?.[id];

  return entry?.name ?? id;
}
