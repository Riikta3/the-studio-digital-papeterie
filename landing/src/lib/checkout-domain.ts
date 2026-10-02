import { domainYearsFor } from "@/lib/pricing";
import { isValidLabel, normalizeLabel, toDomainName } from "@shared/lib/custom-domain";

/**
 * What the payment route charges and records for the custom domain
 * (docs/superpowers/specs/2026-10-02-custom-domain-design.md, D1 and D3).
 *
 * Pure, so the rule the money depends on is tested without Stripe: whether the
 * order has the domain, how many years it pays for, and which name the studio
 * will buy. The route then checks that name's availability and writes the
 * plan into the intent's metadata, where every later reader takes it from.
 */

/** What the browser sends as `items.domain`. Untrusted: any field may be missing or of the wrong type. */
export interface CheckoutDomainInput {
  label?: unknown;
  later?: unknown;
}

export type CheckoutDomainPlan =
  | { wanted: false }
  | {
      wanted: true;
      /** From the wedding date and the server's own today, never the browser's figure. */
      years: number;
      /** `label.com`, absent for « plus tard » or when no label was typed. */
      name?: string;
      /** The label normalised into something the studio cannot buy (too short, no Latin letters…). */
      invalid?: true;
    };

export function planDomainForCheckout({
  extras,
  domain,
  weddingDate,
  now,
}: {
  extras: unknown;
  domain: CheckoutDomainInput | null | undefined;
  weddingDate: string | null | undefined;
  now: Date;
}): CheckoutDomainPlan {
  const wanted = Array.isArray(extras) && extras.includes("custom-domain");
  if (!wanted) return { wanted: false };

  const years = domainYearsFor(weddingDate, now);

  // « Je choisirai plus tard » wins over a label still sitting in the field,
  // and an empty field means the same: the couple chooses from the dashboard.
  const raw = typeof domain?.label === "string" ? domain.label.trim() : "";
  if (domain?.later === true || !raw) return { wanted: true, years };

  // Normalised here even though the studio already does it: this route is
  // reachable directly, and the name written to the intent is the one bought.
  const label = normalizeLabel(raw);
  const name = toDomainName(label);
  return isValidLabel(label) ? { wanted: true, years, name } : { wanted: true, years, name, invalid: true };
}
