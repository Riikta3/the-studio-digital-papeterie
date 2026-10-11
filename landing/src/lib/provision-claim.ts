/**
 * Which provisioning pass builds the wedding a payment bought
 * (docs/superpowers/plans/2026-10-02-checkout-provision-claim.md).
 *
 * Two passes provision a paid checkout: the buyer's browser, and the webhook
 * that rescues a browser that died. `createWedding` used to recognise its own
 * order only by `wedding_id` on the PaymentIntent, stamped at the very end, so
 * a second pass landing before that stamp — or a reload after the stamp
 * failed — saw an account that already owned a wedding and refunded it as a
 * second purchase. The couple kept the wedding and lost the payment.
 *
 * Now every pass claims the PaymentIntent in `checkout_provisions` before
 * creating anything:
 * - its insert landed: this pass owns the order and provisions it;
 * - the claim names a wedding whose site exists: adopt it, never refund;
 * - the claim names a wedding with no site yet: its owner is still building
 *   it, so wait as below;
 * - no wedding yet and the claim is older than 10 minutes: its owner died
 *   before creating one, take over with a conditional update on the
 *   `claimed_at` read, so one taker at most;
 * - no wedding yet and the claim is fresh: another pass is at work. Poll
 *   every second for up to 8, adopt the wedding once it and its site exist,
 *   otherwise report "in progress" so the caller retries (Stripe, or the
 *   browser).
 *
 * The claim covers a pass in flight, before its wedding exists. Once it
 * exists, the wedding itself names its payment (`weddings.payment_intent_id`,
 * written by the same insert), so a claim that never learnt of its wedding
 * still cannot make the payment look like a second purchase.
 *
 * The database is injected, like `custom-domain-row.ts`, so the decisions are
 * tested without one; `createWedding` passes the service-role client's.
 */

/** A `checkout_provisions` row, as PostgREST returns it. */
export interface ProvisionClaim {
  payment_intent_id: string;
  wedding_id: string | null;
  /** `timestamptz` as PostgREST sends it: `2026-10-02T18:00:00.123456+00:00`. */
  claimed_at: string;
}

type ClaimResult = PromiseLike<{ data: ProvisionClaim | null; error: unknown }>;

export interface ClaimStore {
  /** `insert … on conflict do nothing returning`: the row if this call created it, null if it existed. */
  insert: (paymentIntentId: string) => ClaimResult;
  read: (paymentIntentId: string) => ClaimResult;
  /**
   * `update … set claimed_at = now() where payment_intent_id = $1 and
   * claimed_at = $2 and wedding_id is null returning`: the row if this call
   * took it over, null if another pass changed it first.
   */
  takeOver: (paymentIntentId: string, claimedAt: string) => ClaimResult;
  /**
   * The wedding's site (`sites.wedding_id` is unique). The owner records its
   * wedding on the claim before the settings and the site, so a wedding
   * without one is still being built.
   */
  siteOf: (weddingId: string) => PromiseLike<{ data: { id: string } | null; error: unknown }>;
}

/**
 * A claim with no wedding older than this was abandoned. Provisioning takes
 * about five seconds, and Vercel stops a function after 300 seconds by
 * default; twice that leaves room for a raised limit, so a live owner is never
 * taken over in practice — and if one were, the wedding's unique
 * `payment_intent_id` and `weddings_one_per_user` still let only one exist.
 */
export const CLAIM_STALE_MS = 10 * 60_000;
/** How long a pass waits for another pass's wedding before giving up for now. */
export const CLAIM_WAIT_MS = 8_000;
export const CLAIM_POLL_MS = 1_000;

export type ClaimDecision =
  | { action: "adopt"; weddingId: string }
  | { action: "take-over"; claimedAt: string }
  | { action: "wait" }
  | { action: "claim-again" };

/** What a pass does about a claim it did not insert. */
export function decideClaim(
  claim: ProvisionClaim | null,
  now: number,
  staleMs: number = CLAIM_STALE_MS,
): ClaimDecision {
  // Released by its owner (it failed before creating a wedding) between this
  // pass's insert and its read: the payment is free to claim again.
  if (!claim) return { action: "claim-again" };
  if (claim.wedding_id) return { action: "adopt", weddingId: claim.wedding_id };

  // Unreadable is taken over rather than waited on forever: a paid order left
  // in progress for good is worse, and the conditional update still lets one
  // pass at most take it.
  const claimedAt = Date.parse(claim.claimed_at);
  if (Number.isNaN(claimedAt) || now - claimedAt > staleMs) {
    // The exact string read, not a re-serialised Date: the update compares it
    // with `claimed_at` to the microsecond.
    return { action: "take-over", claimedAt: claim.claimed_at };
  }
  return { action: "wait" };
}

export type ClaimOutcome =
  | { kind: "owner"; claimedAt: string; tookOver: boolean }
  | { kind: "adopt"; weddingId: string; waited: boolean }
  | { kind: "in-progress" }
  | { kind: "failed"; error: unknown };

export interface ClaimOptions {
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  staleMs?: number;
  waitMs?: number;
  pollMs?: number;
}

/**
 * Claims a PaymentIntent for this pass, or says whose wedding to adopt.
 *
 * A wedding is adopted only once its site exists: before that, its owner is
 * still building it, and an adopter that stamped the intent or healed the
 * domain row would do it for a site that is not there yet (a false
 * `[DOMAIN_ROW_FAILED]`, and a stamp that sends the webhook's domain pass
 * looking for that site).
 *
 * `adopt.waited` tells the caller the owner was seen at work moments ago, so
 * it is still finishing the order (domain row, stamp) and the adopter should
 * not second-guess any of it.
 */
export async function claimProvisioning(
  store: ClaimStore,
  paymentIntentId: string,
  {
    now = Date.now,
    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    staleMs = CLAIM_STALE_MS,
    waitMs = CLAIM_WAIT_MS,
    pollMs = CLAIM_POLL_MS,
  }: ClaimOptions = {},
): Promise<ClaimOutcome> {
  const deadline = now() + waitMs;
  let waited = false;

  // Bounded: a wait is one poll, and the other steps only repeat when another
  // pass changed the row in between, which cannot go on for long.
  const maxRounds = 3 * (Math.ceil(waitMs / pollMs) + 1);
  for (let round = 0; round < maxRounds; round++) {
    const inserted = await store.insert(paymentIntentId);
    if (inserted.error) return { kind: "failed", error: inserted.error };
    if (inserted.data) return { kind: "owner", claimedAt: inserted.data.claimed_at, tookOver: false };

    const read = await store.read(paymentIntentId);
    if (read.error) return { kind: "failed", error: read.error };

    const decision = decideClaim(read.data, now(), staleMs);
    switch (decision.action) {
      case "adopt": {
        const site = await store.siteOf(decision.weddingId);
        if (site.error) return { kind: "failed", error: site.error };
        if (site.data) return { kind: "adopt", weddingId: decision.weddingId, waited };
        // Still being built: waited on like a claim with no wedding yet,
        // within the same budget.
        if (now() + pollMs > deadline) return { kind: "in-progress" };
        await sleep(pollMs);
        waited = true;
        continue;
      }

      case "take-over": {
        const taken = await store.takeOver(paymentIntentId, decision.claimedAt);
        if (taken.error) return { kind: "failed", error: taken.error };
        if (taken.data) return { kind: "owner", claimedAt: taken.data.claimed_at, tookOver: true };
        // Another pass took it, or recorded a wedding, first: look again.
        continue;
      }

      case "claim-again":
        continue;

      case "wait":
        if (now() + pollMs > deadline) return { kind: "in-progress" };
        await sleep(pollMs);
        waited = true;
        continue;
    }
  }
  return { kind: "in-progress" };
}

/**
 * Whether a wedding is the one this payment bought.
 *
 * `weddings.payment_intent_id` is written by the wedding's own insert, so it
 * holds even when the claim never learnt of the wedding (its record failed, or
 * its owner died right after the insert). Weddings built before the column
 * existed carry none, and are never taken for this payment's: a second
 * purchase on such an account is refunded, as it always was.
 */
export function isPaymentsWedding(
  wedding: { payment_intent_id: string | null },
  paymentIntentId: string,
): boolean {
  return Boolean(paymentIntentId) && wedding.payment_intent_id === paymentIntentId;
}

/** Postgres's unique_violation. */
const UNIQUE_VIOLATION = "23505";

/**
 * The unique rules a wedding insert can break
 * (supabase/migrations/20260913210000_one_wedding_per_account.sql and
 * 20261002220000_checkout_provisions.sql), by name and by column.
 */
const WEDDING_CONFLICTS = {
  account: { constraint: "weddings_one_per_user", column: "user_id" },
  payment: { constraint: "weddings_payment_intent_id_key", column: "payment_intent_id" },
} as const;

/**
 * Which rule a refused wedding insert broke:
 * - "account": the account already owns a wedding — this payment's, built by
 *   another pass, or another payment's;
 * - "payment": a wedding for this payment already exists;
 * - null: anything else, including a unique rule this code does not know.
 *
 * Read from the message, where Postgres names the constraint, and failing
 * that from the details' `Key (column)=…`, like `classifyDomainRowError`.
 * When a row breaks both, Postgres reports the account's: its index is older.
 */
export function weddingInsertConflict(
  error: { code?: string; message?: string; details?: string } | null | undefined,
): "account" | "payment" | null {
  if (error?.code !== UNIQUE_VIOLATION) return null;

  const kinds = Object.keys(WEDDING_CONFLICTS) as (keyof typeof WEDDING_CONFLICTS)[];
  const message = error.message ?? "";
  const named = kinds.find((kind) => message.includes(`"${WEDDING_CONFLICTS[kind].constraint}"`));
  if (named) return named;

  const column = /Key \(([^)]+)\)=/.exec(error.details ?? "")?.[1];
  return kinds.find((kind) => WEDDING_CONFLICTS[kind].column === column) ?? null;
}
