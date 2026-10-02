import assert from "node:assert/strict";
import test from "node:test";

import { classifyDomainRowError, recordCustomDomain } from "./custom-domain-row.ts";

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

  assert.deepEqual(result, { outcome: "inserted", id: "cd1" });
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
  await recordCustomDomain(db.insert, { ...INPUT, domain: { has: true, years: 1 } });
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

test("nothing is inserted when the order has no domain", async () => {
  const db = fakeInsert();
  assert.deepEqual(await recordCustomDomain(db.insert, { ...INPUT, domain: { has: false, years: 1 } }), {
    outcome: "none",
  });
  assert.equal(db.rows.length, 0);
});
