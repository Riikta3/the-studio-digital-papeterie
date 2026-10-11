import { domainYearsFor } from "@/lib/pricing";
import { isValidLabel, normalizeLabel, toDomainName } from "@shared/lib/custom-domain";

/**
 * What the payment route charges and records for the custom domain
 * (docs/superpowers/specs/2026-10-02-custom-domain-design.md, D1 and D3).
 *
 * Pure, so the rule the money depends on is tested without Stripe: whether the
 * order has the domain, how many years it pays for, and which name the studio
 * will buy (`planDomainForCheckout`), then whether that name may be paid for
 * (`refuseDomainBeforePayment`, its lookups injected). The route writes the
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

/** What the payment route answers instead of taking the money. */
export interface DomainRefusal {
  status: 400 | 409 | 503;
  body: { error: string; domainInvalid?: true; domainUnavailable?: true };
}

export interface DomainAvailabilityLookups {
  /**
   * `custom_domain_name_taken(name)` through the service role: whether another
   * of our couples holds the name. Answers like a PostgREST call.
   */
  nameTaken: (name: string) => PromiseLike<{ data: unknown; error: unknown }>;
  /**
   * Vercel's search for this one name, uncached (`maxAgeMs: 0`). Throws when
   * the registrar cannot be asked. `reason` is `searchDomains`'s.
   */
  searchName: (name: string) => Promise<{ available: boolean; reason?: string } | undefined>;
}

/** Our own rows hold it: another of our couples paid for it moments ago. */
const NAME_JUST_TAKEN = "Ce nom vient d'être pris. Choisissez-en un autre.";
/**
 * Vercel will not sell it to us: registered elsewhere, premium, or above the
 * price ceiling. « Vient d'être pris » would be wrong for a premium name
 * nobody has bought.
 */
const NAME_NOT_AVAILABLE = "Ce nom n'est pas disponible. Choisissez-en un autre.";

/**
 * The domain name, checked once more right before the money is taken
 * (spec D3). The studio's options step shows availability while the couple
 * types, but that answer may be a minute old, and the route is reachable
 * directly.
 *
 * Two sources, because neither knows everything:
 * - our own rows: Vercel's search answers "available" for a name another of
 *   our couples has paid for but that is not bought yet;
 * - Vercel's search, uncached, for the rest of the world.
 *
 * Returns null when the order may be charged — no domain, « plus tard », or a
 * name that passed — and otherwise the answer to send. A taken name is a 409
 * `domainUnavailable`, the same shape as `emailTaken`, so the checkout can
 * send the couple back to the options step before anything is charged.
 */
export async function refuseDomainBeforePayment(
  plan: CheckoutDomainPlan,
  lookups: DomainAvailabilityLookups,
): Promise<DomainRefusal | null> {
  if (!plan.wanted || !plan.name) return null;

  if (plan.invalid) {
    return { status: 400, body: { error: "Nom de domaine invalide.", domainInvalid: true } };
  }

  const unavailable = (error: string): DomainRefusal => ({
    status: 409,
    body: { error, domainUnavailable: true },
  });

  let ours: { data: unknown; error: unknown };
  try {
    ours = await lookups.nameTaken(plan.name);
  } catch (error) {
    ours = { data: null, error };
  }
  if (ours.error) {
    // Closed, like the route's email lookup: provisioning would lose this
    // name to the other couple on the unique index, and this couple would pay
    // for a name the studio already knew it could not buy them.
    console.error("[DOMAIN_TAKEN_LOOKUP_FAILED]", ours.error);
    return {
      status: 503,
      body: {
        error:
          "Impossible de vérifier le nom de domaine pour le moment. " +
          "Merci de réessayer dans quelques instants.",
      },
    };
  }
  if (ours.data) return unavailable(NAME_JUST_TAKEN);

  try {
    const result = await lookups.searchName(plan.name);
    if (!result || result.reason === "unknown") {
      // Open, like an unreachable search: the name left out of the answer, or
      // an entry missing a field, says nothing about the name. Refusing would
      // turn a change in Vercel's answer into « nom pris » for every couple;
      // the purchase engine asks again before buying (D5).
      console.warn("[DOMAIN_SEARCH_INCONCLUSIVE]", { name: plan.name, reason: result?.reason ?? "missing" });
    } else if (!result.available) {
      // taken, premium, above_ceiling (or unsupported, which a `.com` never is).
      return unavailable(NAME_NOT_AVAILABLE);
    }
  } catch (searchError) {
    // Open, unlike our own rows: the order goes through on the name the
    // couple chose, and the purchase engine still checks it before buying — a
    // name taken in the meantime falls back to `awaiting_choice`, and the
    // couple picks another for free (D5).
    console.warn("[DOMAIN_SEARCH_UNREACHABLE]", searchError);
  }
  return null;
}
