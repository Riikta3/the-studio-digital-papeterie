import assert from "node:assert/strict";
import test from "node:test";

import {
  CLAIM_POLL_MS,
  CLAIM_STALE_MS,
  CLAIM_WAIT_MS,
  claimProvisioning,
  decideClaim,
  isPaymentsWedding,
  weddingInsertConflict,
} from "./provision-claim.ts";

const T0 = Date.parse("2026-10-02T18:00:00.000Z");
/** `claimed_at` as PostgREST sends it: microseconds and an explicit offset. */
const at = (ms) => new Date(ms).toISOString().replace("Z", "123+00:00");

const claim = (fields) => ({ payment_intent_id: "pi_1", wedding_id: null, claimed_at: at(T0), ...fields });

test("the timings: stale after 10 minutes, twice Vercel's default function limit; polled every second for 8", () => {
  assert.equal(CLAIM_STALE_MS, 10 * 60_000);
  assert.equal(CLAIM_POLL_MS, 1_000);
  assert.equal(CLAIM_WAIT_MS, 8_000);
});

test("a claim that names a wedding is adopted, however old", () => {
  assert.deepEqual(decideClaim(claim({ wedding_id: "w1" }), T0 + 1_000), { action: "adopt", weddingId: "w1" });
  assert.deepEqual(decideClaim(claim({ wedding_id: "w1" }), T0 + 60 * 60_000), { action: "adopt", weddingId: "w1" });
});

test("a fresh claim with no wedding yet is waited on", () => {
  assert.deepEqual(decideClaim(claim({}), T0), { action: "wait" });
  // A run that hits Vercel's default 300 s limit is still well inside the window.
  assert.deepEqual(decideClaim(claim({}), T0 + 300_000), { action: "wait" });
  assert.deepEqual(decideClaim(claim({}), T0 + CLAIM_STALE_MS), { action: "wait" });
  // The database's clock a little ahead of the server's: still someone's claim.
  assert.deepEqual(decideClaim(claim({}), T0 - 2_000), { action: "wait" });
});

test("a claim older than 10 minutes with no wedding is taken over, on the exact value read", () => {
  const read = claim({});
  assert.deepEqual(decideClaim(read, T0 + CLAIM_STALE_MS + 1), { action: "take-over", claimedAt: read.claimed_at });
  // Unreadable: taking over is the recoverable side, and the conditional update
  // still lets one pass at most do it.
  assert.deepEqual(decideClaim(claim({ claimed_at: "not a date" }), T0), { action: "take-over", claimedAt: "not a date" });
});

test("PostgREST's microsecond timestamps are read to the millisecond", () => {
  const read = claim({ claimed_at: "2026-10-02T18:00:00.123456+00:00" });
  assert.deepEqual(decideClaim(read, Date.parse("2026-10-02T18:10:00.123Z")), { action: "wait" });
  assert.equal(decideClaim(read, Date.parse("2026-10-02T18:10:00.125Z")).action, "take-over");
});

test("a claim that vanished between the insert and the read is claimed again", () => {
  assert.deepEqual(decideClaim(null, T0), { action: "claim-again" });
});

/**
 * A fake `checkout_provisions`, driven by fake time. `script` can change the
 * row as time passes (another pass recording its wedding, building its site,
 * releasing, ...). `sites` holds the weddings whose site exists.
 */
function fakeStore({ row = null, sites = [], script = () => {}, errors = {} } = {}) {
  const clock = { now: T0 };
  const calls = { insert: 0, read: 0, takeOver: [], siteOf: [], sleeps: [] };
  const state = { row, sites: new Set(sites) };
  const store = {
    async siteOf(weddingId) {
      calls.siteOf.push(weddingId);
      if (errors.siteOf) return { data: null, error: errors.siteOf };
      return { data: state.sites.has(weddingId) ? { id: `site-of-${weddingId}` } : null, error: null };
    },
    async insert(id) {
      calls.insert++;
      if (errors.insert) return { data: null, error: errors.insert };
      if (state.row) return { data: null, error: null };
      state.row = { payment_intent_id: id, wedding_id: null, claimed_at: at(clock.now) };
      return { data: { ...state.row }, error: null };
    },
    async read() {
      calls.read++;
      if (errors.read) return { data: null, error: errors.read };
      return { data: state.row && { ...state.row }, error: null };
    },
    async takeOver(id, claimedAt) {
      calls.takeOver.push(claimedAt);
      if (errors.takeOver) return { data: null, error: errors.takeOver };
      if (!state.row || state.row.claimed_at !== claimedAt || state.row.wedding_id) return { data: null, error: null };
      state.row = { ...state.row, claimed_at: at(clock.now) };
      return { data: { ...state.row }, error: null };
    },
  };
  const options = {
    now: () => clock.now,
    sleep: async (ms) => {
      calls.sleeps.push(ms);
      clock.now += ms;
      script(state, clock.now - T0);
    },
  };
  return { store, options, calls, state };
}

test("the first pass owns the payment", async () => {
  const { store, options, calls } = fakeStore();
  const outcome = await claimProvisioning(store, "pi_1", options);
  assert.deepEqual(outcome, { kind: "owner", claimedAt: at(T0), tookOver: false });
  assert.equal(calls.read, 0);
  assert.deepEqual(calls.sleeps, []);
});

test("a pass arriving after the wedding was built adopts it at once", async () => {
  const { store, options, calls } = fakeStore({ row: claim({ wedding_id: "w1" }), sites: ["w1"] });
  assert.deepEqual(await claimProvisioning(store, "pi_1", options), { kind: "adopt", weddingId: "w1", waited: false });
  assert.deepEqual(calls.sleeps, []);
  assert.deepEqual(calls.takeOver, []);
  assert.deepEqual(calls.siteOf, ["w1"]);
});

test("the race: a pass that finds the owner mid-way waits, then adopts its wedding", async () => {
  const { store, options, calls } = fakeStore({
    row: claim({}),
    // The owner records its wedding and builds its site 2.5 s after this pass arrived.
    script: (state, elapsed) => {
      if (elapsed >= 2_500) {
        state.row.wedding_id = "w1";
        state.sites.add("w1");
      }
    },
  });
  assert.deepEqual(await claimProvisioning(store, "pi_1", options), { kind: "adopt", weddingId: "w1", waited: true });
  assert.deepEqual(calls.sleeps, [1_000, 1_000, 1_000]);
  assert.deepEqual(calls.takeOver, []);
});

test("a recorded wedding with no site yet is still being built: waited on, adopted once its site exists", async () => {
  const { store, options, calls } = fakeStore({
    // The owner records its wedding before the settings and the site.
    row: claim({ wedding_id: "w1" }),
    script: (state, elapsed) => {
      if (elapsed >= 3_500) state.sites.add("w1");
    },
  });
  assert.deepEqual(await claimProvisioning(store, "pi_1", options), { kind: "adopt", weddingId: "w1", waited: true });
  assert.deepEqual(calls.sleeps, [1_000, 1_000, 1_000, 1_000]);
  assert.deepEqual(calls.takeOver, []);
});

test("a wedding whose site does not come within 8 s leaves the pass in progress, never adopted", async () => {
  // However old the claim: a recorded wedding is never taken over.
  const { store, options, calls } = fakeStore({
    row: claim({ wedding_id: "w1", claimed_at: at(T0 - CLAIM_STALE_MS - 1) }),
  });
  assert.deepEqual(await claimProvisioning(store, "pi_1", options), { kind: "in-progress" });
  assert.equal(calls.sleeps.reduce((sum, ms) => sum + ms, 0), CLAIM_WAIT_MS);
  assert.deepEqual(calls.takeOver, []);
});

test("an owner still at work after 8 s leaves the pass in progress, never owner", async () => {
  const { store, options, calls } = fakeStore({ row: claim({}) });
  assert.deepEqual(await claimProvisioning(store, "pi_1", options), { kind: "in-progress" });
  assert.equal(calls.sleeps.reduce((sum, ms) => sum + ms, 0), CLAIM_WAIT_MS);
  assert.ok(calls.sleeps.every((ms) => ms === CLAIM_POLL_MS));
  assert.deepEqual(calls.takeOver, []);
});

test("a dead owner's claim is taken over, conditionally on the value read", async () => {
  const stale = claim({ claimed_at: at(T0 - CLAIM_STALE_MS - 1) });
  const { store, options, calls } = fakeStore({ row: stale });
  assert.deepEqual(await claimProvisioning(store, "pi_1", options), { kind: "owner", claimedAt: at(T0), tookOver: true });
  assert.deepEqual(calls.takeOver, [stale.claimed_at]);
  assert.deepEqual(calls.sleeps, []);
});

test("two takers: the one whose update matched nothing waits on the other", async () => {
  const stale = claim({ claimed_at: at(T0 - CLAIM_STALE_MS - 1) });
  const { store, options, calls } = fakeStore({
    row: stale,
    sites: ["w1"],
    script: (state, elapsed) => {
      if (elapsed >= 1_000) state.row.wedding_id = "w1";
    },
  });
  // The other taker gets there between this pass's read and its update.
  const takeOver = store.takeOver;
  store.takeOver = async (id, claimedAt) => {
    store.takeOver = takeOver;
    await takeOver(id, claimedAt);
    return { data: null, error: null };
  };
  assert.deepEqual(await claimProvisioning(store, "pi_1", options), { kind: "adopt", weddingId: "w1", waited: true });
  assert.equal(calls.takeOver.length, 1);
});

test("a claim released by its owner (it failed before creating a wedding) is claimed again", async () => {
  const { store, options } = fakeStore({
    row: claim({}),
    script: (state, elapsed) => {
      if (elapsed >= 1_000) state.row = null;
    },
  });
  const outcome = await claimProvisioning(store, "pi_1", options);
  assert.equal(outcome.kind, "owner");
  assert.equal(outcome.tookOver, false);
});

test("a database error is a failure, never ownership", async () => {
  const boom = { message: "fetch failed" };
  for (const which of ["insert", "read", "takeOver"]) {
    const row = which === "insert" ? null : claim({ claimed_at: at(T0 - CLAIM_STALE_MS - 1) });
    const { store, options } = fakeStore({ row, errors: { [which]: boom } });
    assert.deepEqual(await claimProvisioning(store, "pi_1", options), { kind: "failed", error: boom }, which);
  }
  const { store, options } = fakeStore({ row: claim({ wedding_id: "w1" }), errors: { siteOf: boom } });
  assert.deepEqual(await claimProvisioning(store, "pi_1", options), { kind: "failed", error: boom }, "siteOf");
});

test("a claim that keeps vanishing does not loop forever", async () => {
  let reads = 0;
  const store = {
    insert: async () => ({ data: null, error: null }),
    read: async () => {
      reads++;
      return { data: null, error: null };
    },
    takeOver: async () => ({ data: null, error: null }),
  };
  const outcome = await claimProvisioning(store, "pi_1", { now: () => T0, sleep: async () => {} });
  assert.deepEqual(outcome, { kind: "in-progress" });
  assert.ok(reads < 100, `${reads} reads`);
});

test("a refused wedding insert names the rule it broke: one wedding per account, or per payment", () => {
  const unique = (constraint, column) => ({
    code: "23505",
    message: `duplicate key value violates unique constraint "${constraint}"`,
    details: `Key (${column})=(x) already exists.`,
  });
  assert.equal(weddingInsertConflict(unique("weddings_one_per_user", "user_id")), "account");
  assert.equal(weddingInsertConflict(unique("weddings_payment_intent_id_key", "payment_intent_id")), "payment");

  // The constraint read from the details when the message does not name it.
  assert.equal(weddingInsertConflict({ code: "23505", details: "Key (user_id)=(u1) already exists." }), "account");
  assert.equal(weddingInsertConflict({ code: "23505", details: "Key (payment_intent_id)=(pi_1) already exists." }), "payment");

  // Anything else is not a conflict this code knows how to answer.
  assert.equal(weddingInsertConflict(unique("weddings_pkey", "id")), null);
  assert.equal(weddingInsertConflict({ code: "23503", message: "violates foreign key constraint" }), null);
  assert.equal(weddingInsertConflict(null), null);
});

test("a wedding is this payment's only when it carries this payment; older weddings carry none", () => {
  assert.equal(isPaymentsWedding({ payment_intent_id: "pi_1" }, "pi_1"), true);
  assert.equal(isPaymentsWedding({ payment_intent_id: "pi_2" }, "pi_1"), false);
  // Built before `weddings.payment_intent_id` existed: never adopted as this
  // payment's, so a second purchase on such an account is still refunded.
  assert.equal(isPaymentsWedding({ payment_intent_id: null }, "pi_1"), false);
  assert.equal(isPaymentsWedding({ payment_intent_id: null }, ""), false);
});
