/**
 * Legal identity of the seller, as it must appear on every invoice.
 *
 * ⚠️ TODO — REPLACE EVERY PLACEHOLDER BELOW BEFORE THE FIRST REAL SALE.
 *
 * A French invoice is only valid with the seller's registered name, legal
 * form, SIRET, registered address and VAT status on it (art. L441-9 code de
 * commerce). The same details are still "[à compléter]" in the CGV and privacy
 * messages — this file is meant to become the one place they live, so the two
 * can never disagree.
 *
 * `assertCompanyConfigured()` refuses to issue an invoice while placeholders
 * remain, rather than shipping a legally void PDF to a paying customer.
 */

/** Marks a value that still has to be filled in. */
const TODO = "[à compléter]";

export const COMPANY = {
  /** Registered name, e.g. "The Studio Digital Papeterie". */
  legalName: TODO,
  /** Trading name shown as the invoice letterhead. */
  tradingName: "The Studio Digital Papeterie",
  /** e.g. "SASU", "EURL", "Entrepreneur individuel". */
  legalForm: TODO,
  /** Share capital in euros; leave empty for an entrepreneur individuel. */
  shareCapital: "",
  /** 14 digits, no spaces. */
  siret: TODO,
  /** City of the RCS registry; empty for a micro-entreprise without RCS. */
  rcsCity: "",
  addressLine1: TODO,
  postalCode: TODO,
  city: TODO,
  country: "France",
  email: "contact@thestudiopapeteriedigitale.com",
  /** Optional; omitted from the invoice when empty. */
  phone: "",
  website: "www.thestudiopapeteriedigitale.com",
} as const;

/**
 * VAT regime.
 *
 * "franchise" is the small-business exemption (franchise en base de TVA): no
 * VAT is charged, and the invoice must carry the article 293 B mention
 * verbatim. Switch to "standard" once the turnover threshold is crossed —
 * `VAT_RATE` then applies and prices are treated as VAT-inclusive.
 */
export const VAT_REGIME: "franchise" | "standard" = "franchise";

/** Standard French rate, applied only when VAT_REGIME is "standard". */
export const VAT_RATE = 0.2;

/** Mandatory wording for an invoice issued under the franchise en base. */
export const VAT_EXEMPTION_NOTICE =
  "TVA non applicable, article 293 B du Code général des impôts.";

/**
 * Late-payment terms, mandatory on any invoice issued to a customer.
 * Kept short: these are consumer sales, settled immediately by card.
 */
export const PAYMENT_TERMS =
  "Paiement comptant à la commande. Aucun escompte pour paiement anticipé. " +
  "En cas de retard : pénalités au taux de 3 fois le taux d'intérêt légal " +
  "et indemnité forfaitaire de recouvrement de 40 €.";

/** Every placeholder that must be replaced before invoicing. */
function missingFields(): string[] {
  const required: Record<string, string> = {
    legalName: COMPANY.legalName,
    legalForm: COMPANY.legalForm,
    siret: COMPANY.siret,
    addressLine1: COMPANY.addressLine1,
    postalCode: COMPANY.postalCode,
    city: COMPANY.city,
  };

  return Object.entries(required)
    .filter(([, value]) => !value || value === TODO)
    .map(([key]) => key);
}

/** True once every legally required field carries a real value. */
export function isCompanyConfigured(): boolean {
  return missingFields().length === 0;
}

/**
 * Throws unless the seller's identity is complete.
 *
 * Called before generating a PDF: an invoice reading "[à compléter]" where the
 * SIRET belongs is worse than no invoice at all, because the customer files it
 * as a valid receipt and only finds out at their own audit.
 */
export function assertCompanyConfigured(): void {
  const missing = missingFields();
  if (missing.length === 0) return;

  throw new Error(
    `Cannot issue an invoice: company details still unset in lib/company.ts ` +
      `(${missing.join(", ")}). Fill them in — a French invoice is void ` +
      `without the seller's registered name, legal form, SIRET and address.`,
  );
}

/** Seller block as printed at the top of the invoice, one entry per line. */
export function companyAddressLines(): string[] {
  const lines: string[] = [COMPANY.legalName];

  const form = COMPANY.shareCapital
    ? `${COMPANY.legalForm} au capital de ${COMPANY.shareCapital} €`
    : COMPANY.legalForm;
  lines.push(form);

  lines.push(COMPANY.addressLine1);
  lines.push(`${COMPANY.postalCode} ${COMPANY.city}`);
  lines.push(COMPANY.country);
  lines.push(`SIRET : ${COMPANY.siret}`);

  if (COMPANY.rcsCity) lines.push(`RCS ${COMPANY.rcsCity}`);
  lines.push(COMPANY.email);
  if (COMPANY.phone) lines.push(COMPANY.phone);

  return lines;
}
