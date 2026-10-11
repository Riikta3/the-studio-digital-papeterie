import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyDomainRowError,
  domainRowToStart,
  ensureCustomDomainRow,
  ensureCustomDomainRowForIntent,
  recordCustomDomain,
} from "./custom-domain-row.ts";

/** A unique violation as PostgREST reports it. */
const uniqueViolation = (constraint, column, value) => ({
  code: "23505",
  message: `duplicate key value violates unique constraint "${constraint}"`,
  details: `Key (${column})=(${value}) already exists.`,
});

const SITE_TAKEN = uniqueViolation("custom_domains_site_id_key", "site_id", "s1");
const INTENT_TAKEN = uniqueViolation("custom_domains_stripe_payment_intent_id_key", "stripe_payment_intent_id", "pi_1");
const NAME_TAKEN = uniqueViolation("custom_domains_name_key", "name", "sophie-et-pierre.com");

test("a replayed provisioning is told apart from a lost name", () => {
  assert.equal(classifyDomainRowError(SITE_TAKEN), "ignore");
  assert.equal(classifyDomainRowError(INTENT_TAKEN), "ignore");
  assert.equal(classifyDomainRowError(NAME_TAKEN), "name-lost");
});

test("the constraint is found in the details when the message does not name it", () => {
  assert.equal(classifyDomainRowError({ code: "23505", message: "duplicate key", details: "Key (name)=(a.com) already exists." }), "name-lost");
  assert.equal(classifyDomainRowError({ code: "23505", message: "duplicate key", details: "Key (site_id)=(s1) already exists." }), "ignore");
});

test("anything else is a failure", () => {
  assert.equal(classifyDomainRowError({ code: "23505", message: "duplicate key value violates unique constraint \"other_key\"" }), "failed");
  assert.equal(classifyDomainRowError({ code: "23514", message: "violates check constraint \"custom_domains_name_format\"" }), "failed");
  assert.equal(classifyDomainRowError({ code: "23503", message: "violates foreign key constraint \"custom_domains_site_wedding_fkey\"" }), "failed");
  assert.equal(classifyDomainRowError({ message: "fetch failed" }), "failed");
});

const INPUT = {
  siteId: "s1",
  weddingId: "w1",
  paymentIntentId: "pi_1",
};

/** An insert that answers each call from `answers` in turn, and records what it was given. */
function fakeInsert(...answers) {
  const rows = [];
  const insert = async (row) => {
    rows.push(row);
    const answer = answers[rows.length - 1];
    if (answer instanceof Error) throw answer;
    return answer ?? { data: null, error: { message: "unexpected call" } };
  };
  return { insert, rows };
}

test("a chosen name is queued, priced from the intent's years", async () => {
  const db = fakeInsert({ data: { id: "cd1" }, error: null });
  const result = await recordCustomDomain(db.insert, {
    ...INPUT,
    domain: { has: true, name: "sophie-et-pierre.com", years: 2 },
  });

  assert.deepEqual(result, { outcome: "inserted", id: "cd1", status: "queued" });
  assert.deepEqual(db.rows, [
    {
      site_id: "s1",
      wedding_id: "w1",
      name: "sophie-et-pierre.com",
      years: 2,
      price_paid_cents: 8500,
      stripe_payment_intent_id: "pi_1",
      status: "queued",
    },
  ]);
});

test("« plus tard » waits for the couple's choice", async () => {
  const db = fakeInsert({ data: { id: "cd1" }, error: null });
  const result = await recordCustomDomain(db.insert, { ...INPUT, domain: { has: true, years: 1 } });
  assert.deepEqual(result, { outcome: "inserted", id: "cd1", status: "awaiting_choice" });
  assert.equal(db.rows[0].name, null);
  assert.equal(db.rows[0].status, "awaiting_choice");
  assert.equal(db.rows[0].price_paid_cents, 6500);
});

test("a name another couple won is dropped, and the row waits for a new choice", async () => {
  const db = fakeInsert({ data: null, error: NAME_TAKEN }, { data: { id: "cd2" }, error: null });
  const result = await recordCustomDomain(db.insert, {
    ...INPUT,
    domain: { has: true, name: "sophie-et-pierre.com", years: 4 },
  });

  assert.deepEqual(result, { outcome: "name-lost", id: "cd2" });
  assert.equal(db.rows.length, 2);
  assert.deepEqual(db.rows[1], {
    site_id: "s1",
    wedding_id: "w1",
    name: null,
    years: 4,
    price_paid_cents: 12500,
    stripe_payment_intent_id: "pi_1",
    status: "awaiting_choice",
    last_error: "name_unavailable",
  });
});

test("a replay inserts nothing more", async () => {
  const db = fakeInsert({ data: null, error: SITE_TAKEN });
  const result = await recordCustomDomain(db.insert, { ...INPUT, domain: { has: true, name: "a-b-c.com", years: 1 } });
  assert.deepEqual(result, { outcome: "replay" });
  assert.equal(db.rows.length, 1);

  // Lost the name, then found the row already there on the retry.
  const raced = fakeInsert({ data: null, error: NAME_TAKEN }, { data: null, error: INTENT_TAKEN });
  assert.deepEqual(
    await recordCustomDomain(raced.insert, { ...INPUT, domain: { has: true, name: "a-b-c.com", years: 1 } }),
    { outcome: "replay" },
  );
});

test("a failure never throws: provisioning carries on", async () => {
  const originalError = console.error;
  const logged = [];
  console.error = (...args) => logged.push(args);
  try {
    const failed = fakeInsert({ data: null, error: { code: "23503", message: "foreign key" } });
    assert.deepEqual(
      await recordCustomDomain(failed.insert, { ...INPUT, domain: { has: true, years: 1 } }),
      { outcome: "failed" },
    );

    const thrown = fakeInsert(new Error("fetch failed"));
    assert.deepEqual(
      await recordCustomDomain(thrown.insert, { ...INPUT, domain: { has: true, years: 1 } }),
      { outcome: "failed" },
    );

    // The retry after a lost name can fail too.
    const retryFailed = fakeInsert({ data: null, error: NAME_TAKEN }, { data: null, error: { message: "timeout" } });
    assert.deepEqual(
      await recordCustomDomain(retryFailed.insert, { ...INPUT, domain: { has: true, name: "a-b-c.com", years: 1 } }),
      { outcome: "failed" },
    );
  } finally {
    console.error = originalError;
  }
  assert.equal(logged.length, 3);
  for (const args of logged) assert.equal(args[0], "[DOMAIN_ROW_FAILED]");
});

test("only a row just written with a name starts the purchase", () => {
  assert.equal(domainRowToStart({ outcome: "inserted", id: "cd1", status: "queued" }), "cd1");
  // « Plus tard », or a name another couple won: the couple chooses first.
  assert.equal(domainRowToStart({ outcome: "inserted", id: "cd1", status: "awaiting_choice" }), null);
  assert.equal(domainRowToStart({ outcome: "name-lost", id: "cd2" }), null);
  // The pass that wrote the row started it; nothing was written otherwise.
  for (const outcome of ["replay", "failed", "none", "unprovisioned"]) {
    assert.equal(domainRowToStart({ outcome }), null);
  }
});

test("nothing is inserted when the order has no domain", async () => {
  const db = fakeInsert();
  assert.deepEqual(await recordCustomDomain(db.insert, { ...INPUT, domain: { has: false, years: 1 } }), {
    outcome: "none",
  });
  assert.equal(db.rows.length, 0);
});

// ── A later pass over the same payment: a reload, the webhook ───────────────

/** A store whose wedding `w1` has site `s1`, inserting as `answers` say. */
function fakeStore(...answers) {
  const db = fakeInsert(...answers);
  const sitesAsked = [];
  return {
    db,
    sitesAsked,
    store: {
      siteOf: async (weddingId) => {
        sitesAsked.push(weddingId);
        return weddingId === "w1" ? { data: { id: "s1" }, error: null } : { data: null, error: null };
      },
      insert: db.insert,
    },
  };
}

const PAID = { weddingId: "w1", paymentIntentId: "pi_1" };
const NAMED_DOMAIN = { has: true, name: "sophie-et-pierre.com", years: 2 };

/** Runs `fn` with `console.error` captured. */
async function quietly(fn) {
  const originalError = console.error;
  const logged = [];
  console.error = (...args) => logged.push(args);
  try {
    return { result: await fn(), logged };
  } finally {
    console.error = originalError;
  }
}

test("ensure: an order without a domain reads and writes nothing", async () => {
  const { store, db, sitesAsked } = fakeStore();
  assert.deepEqual(await ensureCustomDomainRow(store, { ...PAID, domain: { has: false, years: 1 } }), {
    outcome: "none",
  });
  assert.deepEqual(sitesAsked, []);
  assert.equal(db.rows.length, 0);
});

test("ensure: the row the first pass wrote is a replay", async () => {
  const { store, db } = fakeStore({ data: null, error: SITE_TAKEN });
  assert.deepEqual(await ensureCustomDomainRow(store, { ...PAID, domain: NAMED_DOMAIN }), { outcome: "replay" });
  assert.equal(db.rows.length, 1);
});

test("ensure: a row the first pass failed to write is written, on the wedding's site", async () => {
  const { store, db, sitesAsked } = fakeStore({ data: { id: "cd1" }, error: null });
  assert.deepEqual(await ensureCustomDomainRow(store, { ...PAID, domain: NAMED_DOMAIN }), {
    outcome: "inserted",
    id: "cd1",
    status: "queued",
  });
  assert.deepEqual(sitesAsked, ["w1"]);
  assert.equal(db.rows[0].site_id, "s1");
  assert.equal(db.rows[0].wedding_id, "w1");
  assert.equal(db.rows[0].stripe_payment_intent_id, "pi_1");
  assert.equal(db.rows[0].status, "queued");
});

test("ensure: a name lost since is written without it, awaiting a choice", async () => {
  const { store, db } = fakeStore({ data: null, error: NAME_TAKEN }, { data: { id: "cd2" }, error: null });
  assert.deepEqual(await ensureCustomDomainRow(store, { ...PAID, domain: NAMED_DOMAIN }), {
    outcome: "name-lost",
    id: "cd2",
  });
  assert.equal(db.rows[1].name, null);
  assert.equal(db.rows[1].status, "awaiting_choice");
  assert.equal(db.rows[1].last_error, "name_unavailable");
});

test("ensure: an insert failure, an unreadable site or no site at all is a failure, never a throw", async () => {
  const insertFails = fakeStore({ data: null, error: { code: "57014", message: "statement timeout" } });
  const siteErrors = fakeStore();
  siteErrors.store.siteOf = async () => ({ data: null, error: { message: "fetch failed" } });
  const siteThrows = fakeStore();
  siteThrows.store.siteOf = async () => {
    throw new Error("socket hang up");
  };
  const noSite = fakeStore();

  const { result, logged } = await quietly(async () => [
    await ensureCustomDomainRow(insertFails.store, { ...PAID, domain: NAMED_DOMAIN }),
    await ensureCustomDomainRow(siteErrors.store, { ...PAID, domain: NAMED_DOMAIN }),
    await ensureCustomDomainRow(siteThrows.store, { ...PAID, domain: NAMED_DOMAIN }),
    await ensureCustomDomainRow(noSite.store, { ...PAID, weddingId: "w-gone", domain: NAMED_DOMAIN }),
  ]);

  assert.deepEqual(result, Array(4).fill({ outcome: "failed" }));
  assert.equal(logged.length, 4);
  for (const args of logged) assert.equal(args[0], "[DOMAIN_ROW_FAILED]");
  // Nothing written without a site to write it on.
  assert.equal(siteErrors.db.rows.length + siteThrows.db.rows.length + noSite.db.rows.length, 0);
});

// ── The webhook's pass, from the intent ─────────────────────────────────────

const DOMAIN_METADATA = { extras: "custom-music,custom-domain", domain_name: "sophie-et-pierre.com", domain_years: "2" };

/** Stripe's fresh copy of the intent, as `retrieveIntent` returns it. */
function fakeStripe(fresh) {
  const retrieved = [];
  return {
    retrieved,
    retrieveIntent: async (id) => {
      retrieved.push(id);
      if (fresh instanceof Error) throw fresh;
      return { id, metadata: fresh };
    },
  };
}

test("webhook: an order without a domain costs no Stripe call", async () => {
  const stripe = fakeStripe({ wedding_id: "w1" });
  const { store, sitesAsked } = fakeStore();
  const result = await ensureCustomDomainRowForIntent(
    { id: "pi_1", metadata: { extras: "custom-music" } },
    { store, retrieveIntent: stripe.retrieveIntent },
  );
  assert.deepEqual(result, { outcome: "none" });
  assert.deepEqual(stripe.retrieved, []);
  assert.deepEqual(sitesAsked, []);
});

test("webhook: the row goes on the wedding the payment is stamped with", async () => {
  // The event's copy dates from the payment: no stamp on it yet.
  const stripe = fakeStripe({ ...DOMAIN_METADATA, wedding_id: "w1" });
  const { store, db, sitesAsked } = fakeStore({ data: { id: "cd1" }, error: null });
  const result = await ensureCustomDomainRowForIntent(
    { id: "pi_1", metadata: DOMAIN_METADATA },
    { store, retrieveIntent: stripe.retrieveIntent },
  );

  assert.deepEqual(result, { outcome: "inserted", id: "cd1", status: "queued" });
  assert.deepEqual(stripe.retrieved, ["pi_1"]);
  assert.deepEqual(sitesAsked, ["w1"]);
  assert.equal(db.rows[0].name, "sophie-et-pierre.com");
  assert.equal(db.rows[0].years, 2);
  assert.equal(db.rows[0].price_paid_cents, 8500);
});

test("webhook: an intent not stamped yet is left alone", async () => {
  // The browser is still provisioning it, or it was refused and refunded:
  // the account's existing wedding is never assumed to be this payment's.
  const stripe = fakeStripe({ ...DOMAIN_METADATA, refunded_reason: "duplicate purchase" });
  const { store, db, sitesAsked } = fakeStore();
  const result = await ensureCustomDomainRowForIntent(
    { id: "pi_2", metadata: DOMAIN_METADATA },
    { store, retrieveIntent: stripe.retrieveIntent },
  );
  assert.deepEqual(result, { outcome: "unprovisioned" });
  assert.deepEqual(sitesAsked, []);
  assert.equal(db.rows.length, 0);
});

test("webhook: Stripe unreachable is a failure, so the delivery is retried", async () => {
  const stripe = fakeStripe(new Error("api.stripe.com: ECONNRESET"));
  const { store, db } = fakeStore();
  const { result, logged } = await quietly(() =>
    ensureCustomDomainRowForIntent({ id: "pi_1", metadata: DOMAIN_METADATA }, { store, retrieveIntent: stripe.retrieveIntent }),
  );
  assert.deepEqual(result, { outcome: "failed" });
  assert.equal(logged[0][0], "[DOMAIN_ROW_FAILED]");
  assert.equal(db.rows.length, 0);
});
