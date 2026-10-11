import { domainFromIntentMetadata, type IntentDomain } from "@/lib/order-metadata";
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
 * Every later pass over the same payment runs it again through
 * `ensureCustomDomainRow`, so a row a transient failure left missing is
 * written then.
 *
 * The database is injected so the conflict handling is tested without one;
 * production passes the service-role client's (`custom-domain-row-admin.ts`).
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
  | { outcome: "inserted"; id: string; status: "queued" | "awaiting_choice" }
  | { outcome: "name-lost"; id: string }
  | { outcome: "replay" | "failed" | "none" };

/**
 * The row the purchase engine can start on right away, if any: one this pass
 * has just written with a name (`queued`). « Plus tard » and a lost name wait
 * for the couple (`awaiting_choice`), a replay was started by the pass that
 * wrote it, and a failure has no row.
 */
export function domainRowToStart(
  result: CustomDomainRowResult | { outcome: "unprovisioned" },
): string | null {
  return result.outcome === "inserted" && result.status === "queued" ? result.id : null;
}

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

  const status = domain.name ? "queued" : "awaiting_choice";
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
    status,
  };

  const fail = (error: unknown): CustomDomainRowResult => {
    console.error("[DOMAIN_ROW_FAILED]", { siteId, paymentIntentId }, error);
    return { outcome: "failed" };
  };

  try {
    const first = await insert(row);
    if (first.data && !first.error) return { outcome: "inserted", id: first.data.id, status };

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

/** Where `ensureCustomDomainRow` finds the site and writes the row. */
export interface DomainRowStore {
  /** The wedding's site, as PostgREST answers it (`sites.wedding_id` is unique). */
  siteOf: (weddingId: string) => PromiseLike<{ data: { id: string } | null; error: RowError | null }>;
  insert: DomainRowInsert;
}

/**
 * Makes sure a paid domain has its row, once the wedding exists.
 *
 * `createWedding` writes the row once, right after the site. A transient
 * failure there used to be final: every later pass over the payment stops
 * before that point — a reload of the success page takes the
 * `alreadyProvisionedAs` early return, the webhook finds the wedding and skips
 * recovery — so the couple had paid for a domain with no row, and the
 * dashboard would have offered to sell it to them again. Those passes call
 * this, which finds the site and runs the same insert: a row already there is
 * a `replay`, a missing one is written (without the name, should another of
 * our couples have won it meanwhile).
 *
 * `domain` is the intent's (`domainFromIntentMetadata`), never the browser's.
 * Logs and returns like `recordCustomDomain`; the caller decides what a
 * `failed` costs — the webhook throws so Stripe retries, a reload carries on.
 */
export async function ensureCustomDomainRow(
  store: DomainRowStore,
  { weddingId, paymentIntentId, domain }: Omit<CustomDomainRowInput, "siteId">,
): Promise<CustomDomainRowResult> {
  if (!domain.has) return { outcome: "none" };

  let siteId: string | undefined;
  try {
    const site = await store.siteOf(weddingId);
    if (site.error) throw site.error;
    siteId = site.data?.id;
  } catch (error) {
    console.error("[DOMAIN_ROW_FAILED]", { weddingId, paymentIntentId }, error);
    return { outcome: "failed" };
  }
  if (!siteId) {
    // The site is written before the payment is stamped with the wedding, so
    // a stamped wedding without one has lost it since. Not something to guess
    // around: logged, and retried by whoever asked.
    console.error("[DOMAIN_ROW_FAILED]", { weddingId, paymentIntentId }, "the wedding has no site");
    return { outcome: "failed" };
  }

  return recordCustomDomain(store.insert, { siteId, weddingId, paymentIntentId, domain });
}

/** The parts of a Stripe PaymentIntent read here. */
export interface PaidIntent {
  id: string;
  metadata?: Record<string, string | undefined> | null;
}

/**
 * `ensureCustomDomainRow` for the Stripe webhook, which holds the intent but
 * not the wedding.
 *
 * The wedding is the one the payment is stamped with (`metadata.wedding_id`,
 * written by `markPaymentProvisioned`), read from a fresh copy of the intent:
 * the event's copy dates from the payment, before any stamp. Never the
 * account's wedding found by email — a second purchase, refused and refunded
 * by `createWedding`, belongs to an account that already has a wedding, and
 * its domain must not land on that one.
 *
 * An intent not stamped yet is `unprovisioned`, and nothing is done: either
 * the buyer's browser is still running `createWedding`, which writes the row
 * itself (and a reload heals it), or the payment was refused.
 *
 * The event's copy only says whether there is a domain at all, so an order
 * without one costs no Stripe call. The row is written from the fresh copy,
 * as `createWedding` writes it from `verifyPaymentForOrder`'s.
 */
export async function ensureCustomDomainRowForIntent(
  intent: PaidIntent,
  deps: { store: DomainRowStore; retrieveIntent: (id: string) => PromiseLike<PaidIntent> },
): Promise<CustomDomainRowResult | { outcome: "unprovisioned" }> {
  if (!domainFromIntentMetadata(intent.metadata).has) return { outcome: "none" };

  let fresh: PaidIntent;
  try {
    fresh = await deps.retrieveIntent(intent.id);
  } catch (error) {
    console.error("[DOMAIN_ROW_FAILED]", { paymentIntentId: intent.id }, error);
    return { outcome: "failed" };
  }

  const weddingId = fresh.metadata?.wedding_id;
  if (!weddingId) return { outcome: "unprovisioned" };

  return ensureCustomDomainRow(deps.store, {
    weddingId,
    paymentIntentId: intent.id,
    domain: domainFromIntentMetadata(fresh.metadata),
  });
}
