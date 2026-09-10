/**
 * Legal identity of the seller, as it must appear on every invoice.
 *
 * A French invoice is only valid with the seller's registered name, legal
 * form, SIRET, registered address and VAT status on it (art. L441-9 code de
 * commerce). The same details are still "[à compléter]" in the CGV and privacy
 * messages — those should eventually read from here too, so the two can never
 * disagree.
 *
 * Read from the environment rather than hardcoded: a SIRET and a registered
 * address are the trader's own identity, not project source, and they differ
 * between a preview deploy and production. Everything here is server-only (no
 * NEXT_PUBLIC_ prefix) — invoices are rendered in the Stripe webhook, so none
 * of it reaches the browser bundle.
 *
 * ⚠️ Set these in `.env.local` locally and in Vercel → Settings →
 * Environment Variables for production. `assertCompanyConfigured()` refuses to
 * issue an invoice while any required one is missing, rather than shipping a
 * legally void PDF to a paying customer.
 */

/** Reads an optional setting, normalising "unset" and "empty" to "". */
function env(name: string): string {
  return process.env[name]?.trim() ?? "";
}

export const COMPANY = {
  /** Registered name, e.g. "The Studio Digital Papeterie". Required. */
  legalName: env("COMPANY_LEGAL_NAME"),
  /** Trading name shown as the invoice letterhead. */
  tradingName: env("COMPANY_TRADING_NAME") || "The Studio Digital Papeterie",
  /** e.g. "SASU", "EURL", "Entrepreneur individuel". Required. */
  legalForm: env("COMPANY_LEGAL_FORM"),
  /** Share capital in euros; leave unset for an entrepreneur individuel. */
  shareCapital: env("COMPANY_SHARE_CAPITAL"),
  /** 14 digits, no spaces. Required. */
  siret: env("COMPANY_SIRET"),
  /** City of the RCS registry; leave unset for a micro-entreprise without RCS. */
  rcsCity: env("COMPANY_RCS_CITY"),
  addressLine1: env("COMPANY_ADDRESS"),
  postalCode: env("COMPANY_POSTAL_CODE"),
  city: env("COMPANY_CITY"),
  country: env("COMPANY_COUNTRY") || "France",
  email: env("COMPANY_EMAIL") || "contact@thestudiopapeteriedigitale.com",
  /** Optional; omitted from the invoice when empty. */
  phone: env("COMPANY_PHONE"),
  website: env("COMPANY_WEBSITE") || "www.thestudiopapeteriedigitale.com",
} as const;

/**
 * VAT regime.
 *
 * "franchise" is the small-business exemption (franchise en base de TVA): no
 * VAT is charged, and the invoice must carry the article 293 B mention
 * verbatim. Set COMPANY_VAT_REGIME=standard once the turnover threshold is
 * crossed — `VAT_RATE` then applies and prices are treated as VAT-inclusive.
 *
 * Defaults to the exemption: charging VAT that was never collected is the
 * worse of the two mistakes to make by accident.
 */
export const VAT_REGIME: "franchise" | "standard" =
  env("COMPANY_VAT_REGIME") === "standard" ? "standard" : "franchise";

/** Intra-community VAT number, mandatory on invoices once VAT is charged. */
export const VAT_NUMBER = env("COMPANY_VAT_NUMBER");

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

/** Environment variables that must be set before an invoice can be issued. */
function missingFields(): string[] {
  const required: Record<string, string> = {
    COMPANY_LEGAL_NAME: COMPANY.legalName,
    COMPANY_LEGAL_FORM: COMPANY.legalForm,
    COMPANY_SIRET: COMPANY.siret,
    COMPANY_ADDRESS: COMPANY.addressLine1,
    COMPANY_POSTAL_CODE: COMPANY.postalCode,
    COMPANY_CITY: COMPANY.city,
  };

  // Only mandatory once VAT is actually charged: an invoice under the
  // franchise en base carries the article 293 B mention instead.
  if (VAT_REGIME === "standard") {
    required.COMPANY_VAT_NUMBER = VAT_NUMBER;
  }

  return Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);
}

/** True once every legally required field carries a real value. */
export function isCompanyConfigured(): boolean {
  return missingFields().length === 0;
}

/**
 * Throws unless the seller's identity is complete.
 *
 * Called before generating a PDF: an invoice missing the SIRET is worse than
 * no invoice at all, because the customer files it as a valid receipt and only
 * finds out at their own audit.
 */
export function assertCompanyConfigured(): void {
  const missing = missingFields();
  if (missing.length === 0) return;

  throw new Error(
    `Cannot issue an invoice: unset environment variables ` +
      `(${missing.join(", ")}). Set them in .env.local, and in Vercel for ` +
      `production — a French invoice is void without the seller's registered ` +
      `name, legal form, SIRET and address. See landing/.env.example.`,
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
  // Mandatory on the invoice once VAT is charged; absent under the franchise.
  if (VAT_NUMBER) lines.push(`TVA : ${VAT_NUMBER}`);
  lines.push(COMPANY.email);
  if (COMPANY.phone) lines.push(COMPANY.phone);

  return lines;
}
