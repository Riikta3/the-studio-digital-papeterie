import type { IntentDomain } from "@/lib/order-metadata";
import { domainPrice } from "@/lib/pricing";
import { toCents } from "@/lib/stripe";

/**
 * The `custom_domains` row a paid checkout creates
 * (docs/superpowers/specs/2026-10-02-custom-domain-design.md, D2 and D3).
 *
 * Called by `createWedding` once the site exists, on both provisioning paths
 * (the buyer's browser and the webhook), so it must be safe to run twice for
 * the same payment and must never fail the order: the couple has paid, and a
 * domain problem is something the dashboard and the purchase engine recover
 * from, not a reason to leave them without a wedding. Like
 * `seedInvitationContent`, it logs and returns instead of throwing.
 *
 * The insert is injected so the conflict handling is tested without a
 * database; `createWedding` passes the service-role client's.
 */

/** A Postgres error as PostgREST reports it. */
export interface RowError {
  code?: string;
  message?: string;
  details?: string;
}

export type DomainRowInsert = (
  row: Record<string, unknown>,
) => PromiseLike<{ data: { id: string } | null; error: RowError | null }>;

export interface CustomDomainRowInput {
  siteId: string;
  weddingId: string;
  paymentIntentId: string;
  /** From the intent's metadata (`verifyPaymentForOrder`), never the browser's payload. */
  domain: IntentDomain;
}

export type CustomDomainRowResult =
  | { outcome: "inserted"; id: string }
  | { outcome: "name-lost"; id: string }
  | { outcome: "replay" | "failed" | "none" };

/** Postgres's unique_violation. */
const UNIQUE_VIOLATION = "23505";

/**
 * Unique constraints that mean "this payment's row already exists": the
 * other provisioning path got there first (supabase/migrations/20261002120000_custom_domains.sql).
 */
const REPLAY_CONSTRAINTS = ["custom_domains_site_id_key", "custom_domains_stripe_payment_intent_id_key"];
const REPLAY_COLUMNS = ["site_id", "stripe_payment_intent_id"];
/** The partial unique index on `name`: another of our couples holds it. */
const NAME_INDEX = "custom_domains_name_key";

/**
 * What a failed insert means:
 * - "ignore": a replay — the row for this site or this payment exists;
 * - "name-lost": another couple's row holds the name;
 * - "failed": anything else, including a unique violation on a constraint
 *   this code does not know (better logged than guessed at).
 *
 * The constraint is read from the message, where Postgres names it, and
 * failing that from the details' `Key (column)=…`.
 */
export function classifyDomainRowError(error: RowError | null | undefined): "ignore" | "name-lost" | "failed" {
  if (error?.code !== UNIQUE_VIOLATION) return "failed";

  const message = error.message ?? "";
  if (REPLAY_CONSTRAINTS.some((name) => message.includes(`"${name}"`))) return "ignore";
  if (message.includes(`"${NAME_INDEX}"`)) return "name-lost";

  const column = /Key \(([^)]+)\)=/.exec(error.details ?? "")?.[1];
  if (column && REPLAY_COLUMNS.includes(column)) return "ignore";
  if (column === "name") return "name-lost";
  return "failed";
}

export async function recordCustomDomain(
  insert: DomainRowInsert,
  { siteId, weddingId, paymentIntentId, domain }: CustomDomainRowInput,
): Promise<CustomDomainRowResult> {
  if (!domain.has) return { outcome: "none" };

  const row = {
    site_id: siteId,
    wedding_id: weddingId,
    name: domain.name ?? null,
    years: domain.years,
    // What the couple paid for it, from the same rule and the same years as
    // the charge — `verifyPaymentForOrder` has just reconciled the two.
    price_paid_cents: toCents(domainPrice(domain.years)),
    stripe_payment_intent_id: paymentIntentId,
    // `status_changed_at` is left to the column's default: the database's
    // clock, like every other time the engine compares against.
    status: domain.name ? "queued" : "awaiting_choice",
  };

  const fail = (error: unknown): CustomDomainRowResult => {
    console.error("[DOMAIN_ROW_FAILED]", { siteId, paymentIntentId }, error);
    return { outcome: "failed" };
  };

  try {
    const first = await insert(row);
    if (first.data && !first.error) return { outcome: "inserted", id: first.data.id };

    const kind = classifyDomainRowError(first.error);
    if (kind === "ignore") return { outcome: "replay" };
    if (kind === "failed") return fail(first.error);

    /*
     * Another of our couples paid for the same name between this couple's
     * check and their payment, and won the unique index. The name is theirs,
     * so this row waits without one, flagged so the dashboard (and the
     * engine's email) can tell the couple to choose another — for free: the
     * domain is paid for, only the name changes (spec D2).
     */
    console.warn("[DOMAIN_NAME_LOST]", { siteId, paymentIntentId, name: domain.name });
    const retry = await insert({
      ...row,
      name: null,
      status: "awaiting_choice",
      last_error: "name_unavailable",
    });
    if (retry.data && !retry.error) return { outcome: "name-lost", id: retry.data.id };
    if (classifyDomainRowError(retry.error) === "ignore") return { outcome: "replay" };
    return fail(retry.error);
  } catch (error) {
    return fail(error);
  }
}
