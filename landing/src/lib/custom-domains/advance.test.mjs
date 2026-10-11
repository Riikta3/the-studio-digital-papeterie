import assert from "node:assert/strict";
import test from "node:test";

import {
  BACKOFF_MINUTES,
  NOTICE_BATCH,
  REMINDER_AFTER_DAYS,
  REMINDER_GIVE_UP_DAYS,
  STUDIO_ALERT_RETRY_DAYS,
  UNCONFIRMED_CHECK_MINUTES,
  UNSENT_RETRY_DAYS,
  advanceCustomDomain,
  advanceDue,
  processClaimedRow,
} from "./advance.ts";
import { RegistrarError, createRegistrar } from "./vercel-registrar.ts";

/*
 * The purchase engine against fakes only: an in-memory table that honours
 * the lease token, the writes' expectations and the notice windows of the
 * real db.ts, a fake registrar, a fake clock, mailer and probe. Nothing here
 * can reach Vercel — every successful buy call costs real money and there is
 * no sandbox.
 */

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const T0 = Date.parse("2026-10-02T10:00:00.000Z");
const iso = (ms) => new Date(ms).toISOString();

const NAME = "sophie-et-pierre.com";
const COUPLE = { email: "sophie@example.com", firstName: "Sophie", partnerName: "Pierre", locale: "fr" };
const CONTACT = {
  firstName: "Camille",
  lastName: "Martin",
  email: "domaines@example.com",
  phone: "+33.612345678",
  address1: "1 rue de la Paix",
  city: "Paris",
  state: "Ile-de-France",
  zip: "75002",
  country: "FR",
  companyName: "The Studio SAS",
};
/** Bought through Vercel after the row was created: ours to adopt. */
const OURS = { expiresAt: Date.parse("2028-10-02T10:00:00.000Z"), boughtAt: T0 - 30 * MIN };

function row(overrides = {}) {
  return {
    id: "row-1",
    site_id: "site-1",
    wedding_id: "wed-1",
    name: NAME,
    years: 2,
    price_paid_cents: 8500,
    stripe_payment_intent_id: "pi_1",
    status: "queued",
    status_changed_at: iso(T0 - HOUR),
    vercel_order_id: null,
    purchase_started_at: null,
    registered_at: null,
    expires_at: null,
    activated_at: null,
    attempts: 0,
    next_attempt_at: iso(T0 - MIN),
    locked_until: null,
    lease_token: null,
    claims_since_progress: 0,
    last_error: null,
    notices_sent: [],
    created_at: iso(T0 - HOUR),
    updated_at: iso(T0 - HOUR),
    ...overrides,
  };
}

function fakeClock(start = T0) {
  let t = start;
  return {
    now: () => new Date(t),
    get ms() {
      return t;
    },
    set(ms) {
      t = ms;
    },
    advance(ms) {
      t += ms;
    },
  };
}

const CLAIMABLE = new Set(["queued", "purchasing", "registered"]);

/**
 * The table, as the SQL functions, the conditioned update and db.ts's
 * lookups treat it — windows and batch size included.
 */
function fakeDb(rows, clock, { contact = COUPLE, failUpdate = () => false } = {}) {
  const table = new Map(rows.map((r) => [r.id, structuredClone(r)]));
  const writes = [];
  const log = [];
  let minted = 0;

  const due = (r) =>
    CLAIMABLE.has(r.status) &&
    Date.parse(r.next_attempt_at) <= clock.ms &&
    (r.locked_until === null || Date.parse(r.locked_until) < clock.ms);
  const lease = (r) => {
    r.lease_token = `lease-${++minted}`;
    r.locked_until = iso(clock.ms + 2 * MIN);
    r.claims_since_progress += 1;
    return structuredClone(r);
  };
  const since = (r, days) => Date.parse(r.status_changed_at) >= clock.ms - days * DAY;
  const byChange = (a, b) => Date.parse(a.status_changed_at) - Date.parse(b.status_changed_at);

  return {
    table,
    writes,
    log,
    get: (id = "row-1") => table.get(id),
    /** What another run's claim does to the row: a fresh token. */
    steal(id = "row-1") {
      table.get(id).lease_token = `stolen-${++minted}`;
    },
    async claim(id) {
      const r = table.get(id);
      return r && due(r) ? lease(r) : null;
    },
    async claimDue(limit) {
      return [...table.values()]
        .filter(due)
        .sort((a, b) => Date.parse(a.next_attempt_at) - Date.parse(b.next_attempt_at))
        .slice(0, limit)
        .map(lease);
    },
    async update(id, leaseToken, patch, opts = {}) {
      if (failUpdate(patch)) {
        log.push(`update:${patch.status ?? "-"}:threw`);
        throw new Error("custom_domains: update failed (connection reset)");
      }
      const r = table.get(id);
      const expected = Object.entries(opts.expect ?? {}).every(([column, value]) => r?.[column] === value);
      const matched = Boolean(r) && r.lease_token === leaseToken && expected;
      writes.push({ patch, opts, matched });
      log.push(`update:${patch.status ?? "-"}:${matched}`);
      if (matched) Object.assign(r, structuredClone(patch));
      return matched;
    },
    async claimNotice(id, code) {
      const r = table.get(id);
      log.push(`claim:${code}`);
      if (!r || r.notices_sent.includes(code)) return false;
      r.notices_sent = [...r.notices_sent, code];
      return true;
    },
    async releaseNotice(id, code) {
      const r = table.get(id);
      log.push(`release:${code}`);
      if (r) r.notices_sent = r.notices_sent.filter((c) => c !== code);
    },
    async loadCoupleContact() {
      return contact;
    },
    // db.ts: awaiting_choice, 7 to 30 days since the status changed, no reminder yet.
    async findReminderDue(now) {
      return [...table.values()]
        .filter((r) => r.status === "awaiting_choice")
        .filter((r) => Date.parse(r.status_changed_at) <= now.getTime() - REMINDER_AFTER_DAYS * DAY)
        .filter((r) => since(r, REMINDER_GIVE_UP_DAYS))
        .filter((r) => !r.notices_sent.includes("reminder"))
        .sort(byChange)
        .slice(0, NOTICE_BATCH)
        .map((r) => structuredClone(r));
    },
    // db.ts: the couple's emails for 7 days, the studio's alert for 30.
    async findUnsentNotices() {
      const unsent = (status, code, days, extra = () => true) =>
        [...table.values()]
          .filter((r) => r.status === status && since(r, days) && !r.notices_sent.includes(code) && extra(r))
          .sort(byChange)
          .slice(0, NOTICE_BATCH)
          .map((r) => ({ row: structuredClone(r), code }));
      return [
        ...unsent("active", "active", UNSENT_RETRY_DAYS),
        ...unsent("awaiting_choice", "name_unavailable", UNSENT_RETRY_DAYS, (r) => r.last_error === "name_unavailable"),
        ...unsent("failed", "studio_failed", STUDIO_ALERT_RETRY_DAYS),
      ];
    },
  };
}

/** Every registrar method records its call in `log`, so the order of calls and writes is checkable. */
function fakeRegistrar(log, overrides = {}) {
  const calls = [];
  const defaults = {
    getOwnedDomain: async () => null,
    quotePrice: async (_name, years) => ({ years, purchasePrice: 11.25 * years }),
    buyDomain: async () => ({ orderId: "ord_1" }),
    getOrder: async () => ({ status: "purchasing", domains: [{ domainName: NAME, status: "pending" }] }),
    getProjectDomain: async () => null,
    attachProjectDomain: async () => {},
  };
  const registrar = {};
  for (const [method, impl] of Object.entries({ ...defaults, ...overrides })) {
    registrar[method] = async (...args) => {
      calls.push({ method, args });
      log.push(`registrar:${method}`);
      return impl(...args);
    };
  }
  const called = (method) => calls.filter((c) => c.method === method);
  /** The timeout each call was given (the trailing CallOptions). */
  const timeouts = (method) => called(method).map((c) => c.args.at(-1)?.timeoutMs);
  return { registrar, calls, called, timeouts };
}

function fakeMailer({ noticeSent = true, alertSent = true, hang = false } = {}) {
  const notices = [];
  const alerts = [];
  const never = new Promise(() => {});
  return {
    notices,
    alerts,
    noticeSent,
    alertSent,
    hang,
    async sendCoupleNotice(notice) {
      notices.push(notice);
      if (this.hang) return never;
      return { sent: this.noticeSent };
    },
    async sendStudioAlert(alert) {
      alerts.push(alert);
      if (this.hang) return never;
      return { sent: this.alertSent };
    },
  };
}

/** One row, every dependency faked; each piece can be overridden. */
function setup({
  rows = [row()],
  registrar = {},
  search,
  probe = async () => false,
  contact,
  mailer = fakeMailer(),
  failUpdate,
  deps = {},
} = {}) {
  const clock = fakeClock();
  const db = fakeDb(rows, clock, { ...(contact === undefined ? {} : { contact }), ...(failUpdate ? { failUpdate } : {}) });
  const reg = fakeRegistrar(db.log, registrar);
  const searches = [];
  const probes = [];
  const sleeps = [];
  const fullDeps = {
    db,
    registrar: reg.registrar,
    contact: CONTACT,
    search: async (names, opts) => {
      searches.push({ names, opts });
      return search ? search(names, opts) : names.map((name) => ({ name, available: true, priceUsd: 11.25 }));
    },
    probe: async (url, opts) => {
      probes.push({ url, opts });
      return probe(url, db);
    },
    mailer,
    now: clock.now,
    sleep: async (ms) => {
      sleeps.push(ms);
    },
    ...deps,
  };
  return { deps: fullDeps, db, reg, mailer, clock, searches, probes, sleeps };
}

/** The bookkeeping every engine write must carry (spec D5, "The lease is owned"). */
function assertWritesReleaseTheLease(db, clock) {
  for (const { patch } of db.writes) {
    assert.equal(patch.claims_since_progress, 0);
    assert.equal(patch.locked_until, null);
    assert.equal(patch.updated_at, iso(clock.ms));
  }
}

const search = (verdict) => (names) => names.map((name) => ({ name, ...verdict }));
const refuse = (status, code, extra = {}) => async () => {
  throw Object.assign(new RegistrarError(status, code, `${code} from Vercel`), extra);
};

// ── Before any step ───────────────────────────────────────────────────────────

test("a row that cannot be claimed is left alone", async () => {
  const leased = setup({ rows: [row({ locked_until: iso(T0 + MIN), lease_token: "other" })] });
  assert.equal(await advanceCustomDomain("row-1", leased.deps), "not_claimed");
  assert.equal(leased.reg.calls.length, 0);
  assert.equal(leased.db.writes.length, 0);

  const notDue = setup({ rows: [row({ next_attempt_at: iso(T0 + MIN) })] });
  assert.equal(await advanceCustomDomain("row-1", notDue.deps), "not_claimed");

  const waiting = setup({ rows: [row({ status: "awaiting_choice", name: null })] });
  assert.equal(await advanceCustomDomain("row-1", waiting.deps), "not_claimed");
});

test("a step that keeps dying is failed, with a studio alert, before any call", async () => {
  // Two claims died without writing; this claim is the third.
  const s = setup({ rows: [row({ claims_since_progress: 2 })] });

  assert.equal(await advanceCustomDomain("row-1", s.deps), "failed");

  assert.equal(s.db.get().status, "failed");
  assert.equal(s.db.get().last_error, "step_keeps_dying");
  assert.equal(s.db.get().claims_since_progress, 0);
  assert.equal(s.db.get().status_changed_at, iso(T0));
  assert.equal(s.reg.calls.length, 0);
  assert.equal(s.mailer.alerts.length, 1);
  assert.equal(s.mailer.alerts[0].lastError, "step_keeps_dying");
  assert.equal(s.mailer.alerts[0].previousStatus, "queued");
  assert.equal(s.mailer.alerts[0].status, "failed");
  assert.deepEqual(s.db.get().notices_sent, ["studio_failed"]);
  assertWritesReleaseTheLease(s.db, s.clock);
});

test("without a registrar configured, nothing is bought and the studio is alerted", async () => {
  for (const status of ["queued", "purchasing", "registered"]) {
    const s = setup({ rows: [row({ status })], deps: { registrar: null } });

    assert.equal(await advanceCustomDomain("row-1", s.deps), "failed");

    assert.equal(s.db.get().status, "failed");
    assert.equal(s.db.get().last_error, "registrar_not_configured");
    assert.equal(s.mailer.alerts.length, 1);
    assert.equal(s.mailer.alerts[0].previousStatus, status);
  }
});

test("without a registrant, a queued row is failed before any registrar call", async () => {
  const s = setup({ deps: { contact: null } });

  assert.equal(await advanceCustomDomain("row-1", s.deps), "failed");

  assert.equal(s.db.get().last_error, "registrant_missing");
  assert.equal(s.reg.calls.length, 0);
  assert.equal(s.searches.length, 0);
  assert.equal(s.mailer.alerts.length, 1);
});

test("the registrant is only needed to buy: a registered row still gets attached", async () => {
  const s = setup({ rows: [row({ status: "registered", registered_at: iso(T0 - HOUR) })], deps: { contact: null } });

  assert.equal(await advanceCustomDomain("row-1", s.deps), "waiting");
  assert.equal(s.db.get().status, "registered");
  assert.equal(s.mailer.alerts.length, 0);
});

// ── queued ────────────────────────────────────────────────────────────────────

test("queued: a domain we bought for this row is registered without buying", async () => {
  const s = setup({ registrar: { getOwnedDomain: async () => OURS } });

  assert.equal(await advanceCustomDomain("row-1", s.deps), "registered");

  const r = s.db.get();
  assert.equal(r.status, "registered");
  assert.equal(r.registered_at, iso(T0));
  assert.equal(r.expires_at, "2028-10-02T10:00:00.000Z");
  assert.equal(r.status_changed_at, iso(T0));
  assert.equal(r.next_attempt_at, iso(T0));
  assert.equal(s.searches.length, 0);
  assert.equal(s.reg.called("buyDomain").length, 0);
  assertWritesReleaseTheLease(s.db, s.clock);
});

test("queued: a domain in the account since before the row is never given to the couple", async () => {
  for (const owned of [
    // The team has owned it for years.
    { expiresAt: T0 + 300 * DAY, boughtAt: T0 - 3 * 365 * DAY },
    // A minute before this row was created.
    { expiresAt: T0 + 300 * DAY, boughtAt: T0 - HOUR - MIN },
    // Added to the team without being bought through Vercel.
    { expiresAt: null, boughtAt: null },
  ]) {
    const s = setup({ registrar: { getOwnedDomain: async () => owned } });

    assert.equal(await advanceCustomDomain("row-1", s.deps), "failed", JSON.stringify(owned));

    assert.equal(s.db.get().status, "failed");
    assert.equal(s.db.get().last_error, "domain_already_in_account");
    assert.equal(s.mailer.alerts.length, 1);
    assert.equal(s.mailer.alerts[0].lastError, "domain_already_in_account");
    assert.equal(s.mailer.notices.length, 0);
    assert.equal(s.reg.called("buyDomain").length, 0);
  }
  // Bought exactly when the row was created counts as this row's.
  const same = setup({ registrar: { getOwnedDomain: async () => ({ expiresAt: null, boughtAt: T0 - HOUR }) } });
  assert.equal(await advanceCustomDomain("row-1", same.deps), "registered");
});

test("queued: an underpaid row is failed before anything is asked or bought", async () => {
  // 2 years cost 85 €: one cent short.
  const s = setup({ rows: [row({ price_paid_cents: 8499 })] });

  assert.equal(await advanceCustomDomain("row-1", s.deps), "failed");

  assert.equal(s.db.get().last_error, "paid_amount_mismatch");
  assert.equal(s.reg.calls.length, 0);
  assert.equal(s.searches.length, 0);
  assert.equal(s.mailer.alerts.length, 1);
  assert.equal(s.mailer.alerts[0].orderMayExist, false);

  // Paying more is not a problem.
  const more = setup({ rows: [row({ price_paid_cents: 9000 })] });
  assert.equal(await advanceCustomDomain("row-1", more.deps), "purchasing");
});

test("queued: a name the search says is taken or premium goes back to the couple, name kept, with one email", async () => {
  for (const verdict of [{ available: false, reason: "taken" }, { available: false, reason: "premium", priceUsd: 9.5 }]) {
    const s = setup({ search: search(verdict) });

    assert.equal(await advanceCustomDomain("row-1", s.deps), "awaiting_choice", verdict.reason);

    const r = s.db.get();
    assert.equal(r.status, "awaiting_choice");
    assert.equal(r.name, NAME);
    assert.equal(r.last_error, "name_unavailable");
    assert.equal(r.status_changed_at, iso(T0));
    assert.deepEqual(r.notices_sent, ["name_unavailable"]);
    assert.deepEqual(s.mailer.notices, [{ code: "name_unavailable", name: NAME, contact: COUPLE }]);
    assert.deepEqual(s.searches[0].names, [NAME]);
    assert.equal(s.searches[0].opts.maxAgeMs, 0);
    assert.equal(s.reg.called("quotePrice").length, 0);
    assert.equal(s.reg.called("buyDomain").length, 0);
  }
});

test("queued: a search price above the ceiling fails and alerts rather than telling the couple it was taken", async () => {
  const s = setup({ search: search({ available: false, reason: "above_ceiling", priceUsd: 15.01 }) });

  assert.equal(await advanceCustomDomain("row-1", s.deps), "failed");

  assert.equal(s.db.get().last_error, "price_above_ceiling");
  assert.equal(s.mailer.notices.length, 0);
  assert.equal(s.mailer.alerts.length, 1);
  assert.equal(s.reg.called("buyDomain").length, 0);
});

test("queued: a search that cannot tell is a retryable error, never a « nom pris » email", async () => {
  for (const answer of [
    search({ available: false, reason: "unknown" }),
    // The name left out of the answer altogether.
    () => [],
    // An answer without a reason is not one the engine acts on.
    search({ available: false }),
  ]) {
    const s = setup({ search: answer });

    assert.equal(await advanceCustomDomain("row-1", s.deps), "retry");

    assert.equal(s.db.get().status, "queued");
    assert.equal(s.db.get().last_error, "search_unknown");
    assert.equal(s.db.get().attempts, 1);
    assert.equal(s.mailer.notices.length, 0);
    assert.equal(s.reg.called("buyDomain").length, 0);
  }

  // The fifth one fails the row and alerts the studio — still no email to the couple.
  const fifth = setup({ rows: [row({ attempts: 4 })], search: search({ available: false, reason: "unknown" }) });
  assert.equal(await advanceCustomDomain("row-1", fifth.deps), "failed");
  assert.equal(fifth.db.get().last_error, "search_unknown");
  assert.equal(fifth.mailer.notices.length, 0);
  assert.equal(fifth.mailer.alerts.length, 1);
});

test("queued: a null quote right after a positive search is retried, not read as taken", async () => {
  const s = setup({ registrar: { quotePrice: async (_n, years) => ({ years, purchasePrice: null }) } });

  assert.equal(await advanceCustomDomain("row-1", s.deps), "retry");
  assert.equal(s.db.get().status, "queued");
  assert.equal(s.db.get().last_error, "quote_unavailable");
  assert.equal(s.mailer.notices.length, 0);
  assert.equal(s.reg.called("buyDomain").length, 0);
});

test("queued: a quote above the per-year ceiling fails with an alert and buys nothing", async () => {
  // 2 years at 15.5 $ each.
  const s = setup({ registrar: { quotePrice: async (_n, years) => ({ years, purchasePrice: 31 }) } });

  assert.equal(await advanceCustomDomain("row-1", s.deps), "failed");

  assert.equal(s.db.get().status, "failed");
  assert.equal(s.db.get().last_error, "price_above_ceiling");
  assert.equal(s.reg.called("buyDomain").length, 0);
  assert.equal(s.mailer.alerts.length, 1);
});

test("queued: a quote exactly at the ceiling is bought", async () => {
  const s = setup({ registrar: { quotePrice: async (_n, years) => ({ years, purchasePrice: 30 }) } });
  assert.equal(await advanceCustomDomain("row-1", s.deps), "purchasing");
  assert.equal(s.reg.called("buyDomain")[0].args[1].expectedPrice, 30);
});

test("queued: a quote for other years than asked is an error, not a purchase", async () => {
  const s = setup({ registrar: { quotePrice: async () => ({ years: 1, purchasePrice: 11.25 }) } });
  assert.equal(await advanceCustomDomain("row-1", s.deps), "retry");
  assert.equal(s.db.get().last_error, "quote_years_mismatch");
  assert.equal(s.reg.called("buyDomain").length, 0);
});

test("queued: the purchasing marker is written before the buy call, conditioned on status, name and years", async () => {
  const s = setup();

  assert.equal(await advanceCustomDomain("row-1", s.deps), "purchasing");

  // Write-ahead first, then the buy, then the order id.
  const order = s.db.log.filter((entry) => entry.startsWith("update") || entry === "registrar:buyDomain");
  assert.deepEqual(order, ["update:purchasing:true", "registrar:buyDomain", "update:-:true"]);
  assert.deepEqual(s.db.writes[0].opts, { expect: { status: "queued", name: NAME, years: 2 } });
  // The order id is only written onto the purchase it belongs to.
  assert.deepEqual(s.db.writes[1].opts, { expect: { status: "purchasing" } });

  const [buy] = s.reg.called("buyDomain");
  assert.equal(buy.args[0], NAME);
  // The total for both years, never the per-year price.
  assert.deepEqual(buy.args[1], { years: 2, expectedPrice: 22.5, contact: CONTACT });

  const r = s.db.get();
  assert.equal(r.status, "purchasing");
  assert.equal(r.purchase_started_at, iso(T0));
  assert.equal(r.status_changed_at, iso(T0));
  assert.equal(r.vercel_order_id, "ord_1");
  assert.equal(r.attempts, 0);
  assert.equal(r.next_attempt_at, iso(T0 + 2 * MIN));
  assertWritesReleaseTheLease(s.db, s.clock);
});

test("queued: a write-ahead that finds the status, the name or the years changed stops before buying", async () => {
  for (const change of [{ status: "awaiting_choice" }, { name: "autre-nom.com" }, { years: 3 }]) {
    const s = setup({
      registrar: {
        // Someone edits the row while the price is being asked.
        quotePrice: async (_n, years) => {
          Object.assign(s.db.get(), change);
          return { years, purchasePrice: 22.5 };
        },
      },
    });

    assert.equal(await advanceCustomDomain("row-1", s.deps), "lost_lease", JSON.stringify(change));

    assert.equal(s.reg.called("buyDomain").length, 0);
    assert.equal(s.db.writes.length, 1);
    assert.equal(s.db.writes[0].matched, false);
  }
});

test("queued: a write-ahead that lost the lease stops before buying", async () => {
  const s = setup({
    registrar: {
      quotePrice: async (_n, years) => {
        s.db.steal();
        return { years, purchasePrice: 22.5 };
      },
    },
  });

  assert.equal(await advanceCustomDomain("row-1", s.deps), "lost_lease");
  assert.equal(s.reg.called("buyDomain").length, 0);
  assert.equal(s.db.writes.length, 1);
});

test("queued: a buy answering domain_not_available goes back to the couple", async () => {
  const s = setup({ registrar: { buyDomain: refuse(400, "domain_not_available") } });

  assert.equal(await advanceCustomDomain("row-1", s.deps), "awaiting_choice");

  const r = s.db.get();
  assert.equal(r.status, "awaiting_choice");
  assert.equal(r.name, NAME);
  assert.equal(r.last_error, "name_unavailable");
  assert.equal(r.purchase_started_at, null);
  assert.equal(s.mailer.notices.length, 1);
});

test("queued: expected_price_mismatch goes back to queued to re-quote in 2 minutes", async () => {
  const s = setup({ registrar: { buyDomain: refuse(400, "expected_price_mismatch") } });

  assert.equal(await advanceCustomDomain("row-1", s.deps), "requeued");

  const r = s.db.get();
  assert.equal(r.status, "queued");
  assert.equal(r.attempts, 1);
  assert.equal(r.last_error, "expected_price_mismatch");
  assert.equal(r.purchase_started_at, null);
  assert.equal(r.next_attempt_at, iso(T0 + 2 * MIN));
  assert.equal(r.status_changed_at, iso(T0));
});

test("queued: expected_price_mismatch at the fifth attempt fails the row, saying no order exists", async () => {
  const s = setup({ rows: [row({ attempts: 4 })], registrar: { buyDomain: refuse(400, "expected_price_mismatch") } });

  assert.equal(await advanceCustomDomain("row-1", s.deps), "failed");

  const r = s.db.get();
  assert.equal(r.status, "failed");
  assert.equal(r.attempts, 5);
  assert.equal(r.last_error, "expected_price_mismatch");
  assert.equal(r.purchase_started_at, null);
  assert.equal(s.mailer.alerts.length, 1);
  assert.equal(s.mailer.alerts[0].orderMayExist, false);
});

test("queued: the other definitive refusals fail the row at once, with an alert, and buy nothing more", async () => {
  for (const code of [
    "tld_not_supported",
    "order_too_expensive",
    "domain_too_short",
    "invalid_additional_contact_info",
    "additional_contact_info_required",
    "emoji_tld_not_supported",
    "language_code_required",
  ]) {
    const s = setup({ registrar: { buyDomain: refuse(400, code) } });

    assert.equal(await advanceCustomDomain("row-1", s.deps), "failed", code);

    const r = s.db.get();
    assert.equal(r.status, "failed");
    assert.equal(r.last_error, code);
    assert.equal(r.purchase_started_at, null);
    assert.equal(s.mailer.notices.length, 0);
    assert.equal(s.mailer.alerts.length, 1);
    assert.equal(s.mailer.alerts[0].orderMayExist, false, code);
    assert.equal(s.reg.called("buyDomain").length, 1);
  }
});

// ── An uncertain purchase (spec D5, "Uncertain purchases are never the couple's problem") ──

test("a buy with no clear answer stays purchasing as buy_unconfirmed, without spending an attempt", async () => {
  for (const error of [
    new RegistrarError(0, "timeout", "POST buy: timed out"),
    new RegistrarError(0, "network_error", "POST buy: fetch failed"),
    new RegistrarError(500, "internal_server_error", "Internal error"),
    new RegistrarError(502, "http_502", "Bad gateway"),
    new RegistrarError(200, "invalid_response", "POST buy: no orderId"),
    // A 4xx Vercel does not document for this call: not known to be pre-order.
    new RegistrarError(400, "something_new", "?"),
    new RegistrarError(409, "http_409", "conflict"),
    new Error("socket hang up"),
  ]) {
    const s = setup({
      registrar: {
        buyDomain: async () => {
          throw error;
        },
      },
    });

    assert.equal(await advanceCustomDomain("row-1", s.deps), "unconfirmed", error.message);

    const r = s.db.get();
    assert.equal(r.status, "purchasing");
    assert.equal(r.vercel_order_id, null);
    assert.equal(r.purchase_started_at, iso(T0));
    assert.equal(r.last_error, "buy_unconfirmed");
    assert.equal(r.attempts, 0);
    assert.equal(r.next_attempt_at, iso(T0 + 30 * MIN));
    assert.equal(s.mailer.notices.length, 0);
    assert.equal(s.mailer.alerts.length, 0);
  }
});

const purchasing = (overrides = {}) => row({ status: "purchasing", purchase_started_at: iso(T0 - 10 * MIN), ...overrides });

/** Claims the row each time it falls due, until it leaves `status` or `max` steps ran. */
async function runWhileDue(s, { max = 20, status = "purchasing" } = {}) {
  const outcomes = [];
  for (let i = 0; i < max && s.db.get().status === status; i += 1) {
    s.clock.set(Math.max(s.clock.ms, Date.parse(s.db.get().next_attempt_at)));
    outcomes.push(await advanceCustomDomain("row-1", s.deps));
  }
  return outcomes;
}

test("an unconfirmed buy is checked at +30 min, +2 h, +6 h and +24 h, then failed with an alert — never requeued", async () => {
  const checks = [];
  const s = setup({
    rows: [purchasing({ purchase_started_at: iso(T0), last_error: "buy_unconfirmed", next_attempt_at: iso(T0 + 30 * MIN) })],
    registrar: {
      getOwnedDomain: async () => {
        checks.push(s.clock.ms - T0);
        return null;
      },
    },
  });

  const outcomes = await runWhileDue(s);

  assert.deepEqual(UNCONFIRMED_CHECK_MINUTES, [30, 120, 360, 1440]);
  assert.deepEqual(checks, [30 * MIN, 2 * HOUR, 6 * HOUR, 24 * HOUR]);
  assert.deepEqual(outcomes, ["unconfirmed", "unconfirmed", "unconfirmed", "failed"]);
  const r = s.db.get();
  assert.equal(r.status, "failed");
  assert.equal(r.last_error, "buy_unconfirmed");
  // Never back to queued, never to the couple, never a second buy.
  assert.ok(s.db.writes.every(({ patch }) => patch.status !== "queued" && patch.status !== "awaiting_choice"));
  assert.equal(s.reg.called("buyDomain").length, 0);
  assert.equal(s.mailer.notices.length, 0);
  assert.equal(s.mailer.alerts.length, 1);
  assert.equal(s.mailer.alerts[0].lastError, "buy_unconfirmed");
  assert.equal(s.mailer.alerts[0].orderMayExist, true);
});

test("an unconfirmed buy whose domain turns up in the account is registered", async () => {
  const s = setup({
    rows: [purchasing({ purchase_started_at: iso(T0), last_error: "buy_unconfirmed", next_attempt_at: iso(T0 + 30 * MIN) })],
    registrar: {
      // The order completes 45 minutes after the call.
      getOwnedDomain: async () => (s.clock.ms >= T0 + 45 * MIN ? { expiresAt: T0 + 2 * 365 * DAY, boughtAt: T0 + 45 * MIN } : null),
    },
  });

  assert.deepEqual(await runWhileDue(s), ["unconfirmed", "registered"]);
  assert.equal(s.db.get().status, "registered");
  assert.equal(s.mailer.notices.length, 0);
});

test("a process that died in the buy call is an unconfirmed buy too: it waits, then checks", async () => {
  // The write-ahead cleared last_error; nothing else was written.
  const s = setup({ rows: [purchasing()] });

  assert.equal(await advanceCustomDomain("row-1", s.deps), "waiting");

  assert.equal(s.db.get().status, "purchasing");
  assert.equal(s.db.get().last_error, "buy_unconfirmed");
  assert.equal(s.db.get().attempts, 0);
  assert.equal(s.db.get().next_attempt_at, iso(T0 + 20 * MIN));
  assert.equal(s.reg.calls.length, 0);
});

test("an unconfirmed buy whose ownership check fails backs off and stays purchasing", async () => {
  const s = setup({
    rows: [purchasing({ purchase_started_at: iso(T0 - 31 * MIN), last_error: "buy_unconfirmed" })],
    registrar: { getOwnedDomain: refuse(500, "internal_server_error") },
  });

  assert.equal(await advanceCustomDomain("row-1", s.deps), "retry");
  assert.equal(s.db.get().status, "purchasing");
  assert.equal(s.db.get().attempts, 1);
  assert.equal(s.db.get().next_attempt_at, iso(T0 + 2 * MIN));
});

test("an unconfirmed buy finding a domain older than the row fails it instead of adopting it", async () => {
  const s = setup({
    rows: [purchasing({ purchase_started_at: iso(T0 - 31 * MIN), last_error: "buy_unconfirmed" })],
    registrar: { getOwnedDomain: async () => ({ expiresAt: T0 + DAY, boughtAt: T0 - 400 * DAY }) },
  });

  assert.equal(await advanceCustomDomain("row-1", s.deps), "failed");
  assert.equal(s.db.get().last_error, "domain_already_in_account");
});

// ── The order id must never be lost ───────────────────────────────────────────

test("an order id whose write fails is written again, after a short wait", async () => {
  let failures = 1;
  const s = setup({ failUpdate: (patch) => patch.vercel_order_id === "ord_1" && failures-- > 0 });

  assert.equal(await advanceCustomDomain("row-1", s.deps), "purchasing");

  assert.equal(s.db.get().vercel_order_id, "ord_1");
  assert.equal(s.db.get().attempts, 0);
  assert.equal(s.sleeps.length, 1);
  assert.ok(s.sleeps[0] > 0 && s.sleeps[0] <= 1_000);
});

test("an order id that cannot be written in three tries is carried by the failure write", async () => {
  let failures = 3;
  const s = setup({ failUpdate: (patch) => patch.vercel_order_id === "ord_1" && failures-- > 0 });

  assert.equal(await advanceCustomDomain("row-1", s.deps), "retry");

  const r = s.db.get();
  assert.equal(r.status, "purchasing");
  assert.equal(r.vercel_order_id, "ord_1");
  assert.equal(r.last_error, "order_id_not_saved");
  assert.equal(r.attempts, 1);
  assert.equal(s.sleeps.length, 2);
  // The next step follows that order rather than wondering whether one exists.
  s.clock.set(Date.parse(r.next_attempt_at));
  assert.equal(await advanceCustomDomain("row-1", s.deps), "waiting");
  assert.deepEqual(s.reg.called("getOrder").map((c) => c.args[0]), ["ord_1"]);
  assert.equal(s.reg.called("buyDomain").length, 1);
});

test("an order id no write could save goes to the studio directly, and the row checks the account later", async () => {
  const s = setup({ failUpdate: (patch) => patch.vercel_order_id === "ord_1" });

  assert.equal(await advanceCustomDomain("row-1", s.deps), "error");

  assert.equal(s.mailer.alerts.length, 1);
  assert.equal(s.mailer.alerts[0].orderId, "ord_1");
  assert.equal(s.mailer.alerts[0].lastError, "order_id_not_saved");
  assert.equal(s.mailer.alerts[0].orderMayExist, true);
  // What the write-ahead left: an unconfirmed buy, checked after 30 minutes.
  const r = s.db.get();
  assert.equal(r.status, "purchasing");
  assert.equal(r.vercel_order_id, null);
  assert.equal(r.next_attempt_at, iso(T0 + 30 * MIN));
});

test("a row edited while its buy ran: the order id is not written over it, and goes to the studio", async () => {
  const s = setup({
    registrar: {
      buyDomain: async () => {
        s.db.get().status = "failed";
        return { orderId: "ord_1" };
      },
    },
  });

  assert.equal(await advanceCustomDomain("row-1", s.deps), "lost_lease");
  assert.equal(s.db.get().vercel_order_id, null);
  assert.equal(s.mailer.alerts.length, 1);
  assert.equal(s.mailer.alerts[0].orderId, "ord_1");
});

// ── Failures, auth and rate limits ────────────────────────────────────────────

test("the backoff grows with each failure, and the fifth one fails the row", async () => {
  const boom = { getOwnedDomain: async () => Promise.reject(new RegistrarError(0, "timeout", "timed out")) };

  for (const [attempts, minutes] of BACKOFF_MINUTES.entries()) {
    const s = setup({ rows: [row({ attempts })], registrar: boom });
    assert.equal(await advanceCustomDomain("row-1", s.deps), "retry");
    assert.equal(s.db.get().attempts, attempts + 1);
    assert.equal(s.db.get().next_attempt_at, iso(T0 + minutes * MIN));
    assert.equal(s.db.get().status, "queued");
    assert.equal(s.db.get().last_error, "timeout");
  }
  assert.deepEqual(BACKOFF_MINUTES, [2, 10, 30, 120]);

  const fifth = setup({ rows: [row({ attempts: 4 })], registrar: boom });
  assert.equal(await advanceCustomDomain("row-1", fifth.deps), "failed");
  assert.equal(fifth.db.get().status, "failed");
  assert.equal(fifth.db.get().attempts, 5);
  assert.equal(fifth.db.get().last_error, "timeout");
  assert.equal(fifth.mailer.alerts.length, 1);
});

test("an unexpected error is recorded with a generic code", async () => {
  const s = setup({ registrar: { getOwnedDomain: async () => Promise.reject(new Error("boom")) } });
  assert.equal(await advanceCustomDomain("row-1", s.deps), "retry");
  assert.equal(s.db.get().last_error, "unexpected_error");
});

test("401 or 403 alerts the studio at once, spends no attempt and retries in 30 minutes", async () => {
  for (const [status, code] of [[401, "unauthorized"], [403, "forbidden"], [403, "not_authorized_for_scope"]]) {
    for (const start of [row({ attempts: 2 }), purchasing({ purchase_started_at: iso(T0 - HOUR) }), row({ status: "registered", registered_at: iso(T0 - HOUR) })]) {
      const s = setup({
        rows: [start],
        registrar: { getOwnedDomain: refuse(status, code), getProjectDomain: refuse(status, code) },
      });

      assert.equal(await advanceCustomDomain("row-1", s.deps), "unauthorized", `${status} ${start.status}`);

      const r = s.db.get();
      assert.equal(r.status, start.status);
      assert.equal(r.attempts, start.attempts);
      assert.equal(r.last_error, "vercel_unauthorized");
      assert.equal(r.next_attempt_at, iso(T0 + 30 * MIN));
      assert.deepEqual(r.notices_sent, ["studio_auth"]);
      assert.equal(s.mailer.alerts.length, 1);
      assert.equal(s.mailer.alerts[0].status, start.status);
      assert.equal(s.mailer.alerts[0].lastError, "vercel_unauthorized");
      assert.match(s.mailer.alerts[0].detail, new RegExp(`${status} ${code}`));
    }
  }
});

test("the auth alert goes once per row, and again only after the row recovered", async () => {
  let forbidden = true;
  const s = setup({
    registrar: {
      getOwnedDomain: async () => {
        if (forbidden) throw new RegistrarError(403, "forbidden", "Not authorized");
        return null;
      },
    },
  });

  assert.equal(await advanceCustomDomain("row-1", s.deps), "unauthorized");
  s.clock.advance(30 * MIN);
  assert.equal(await advanceCustomDomain("row-1", s.deps), "unauthorized");
  assert.equal(s.mailer.alerts.length, 1);

  // The token is fixed: the row goes on, and its alert is free again.
  forbidden = false;
  s.clock.advance(30 * MIN);
  assert.equal(await advanceCustomDomain("row-1", s.deps), "purchasing");
  assert.deepEqual(s.db.get().notices_sent, []);
});

test("a buy refused with 401/403 goes back to queued (no order was placed) and alerts", async () => {
  const s = setup({ registrar: { buyDomain: refuse(403, "forbidden") } });

  assert.equal(await advanceCustomDomain("row-1", s.deps), "unauthorized");

  const r = s.db.get();
  assert.equal(r.status, "queued");
  assert.equal(r.purchase_started_at, null);
  assert.equal(r.attempts, 0);
  assert.equal(r.next_attempt_at, iso(T0 + 30 * MIN));
  assert.equal(s.mailer.alerts.length, 1);
});

test("429 waits as long as Vercel asks, without spending an attempt or alerting", async () => {
  const s = setup({ rows: [row({ attempts: 3 })], registrar: { getOwnedDomain: refuse(429, "too_many_requests", { retryAfterMs: 42_000 }) } });

  assert.equal(await advanceCustomDomain("row-1", s.deps), "rate_limited");

  assert.equal(s.db.get().status, "queued");
  assert.equal(s.db.get().attempts, 3);
  assert.equal(s.db.get().last_error, "rate_limited");
  assert.equal(s.db.get().next_attempt_at, iso(T0 + 42_000));
  assert.equal(s.mailer.alerts.length, 0);

  // Without Retry-After: 5 minutes.
  const bare = setup({ registrar: { getOwnedDomain: refuse(429, "too_many_requests") } });
  assert.equal(await advanceCustomDomain("row-1", bare.deps), "rate_limited");
  assert.equal(bare.db.get().next_attempt_at, iso(T0 + 5 * MIN));
});

test("a buy refused with 429 goes back to queued until Retry-After", async () => {
  const s = setup({ registrar: { buyDomain: refuse(429, "too_many_requests", { retryAfterMs: 90_000 }) } });

  assert.equal(await advanceCustomDomain("row-1", s.deps), "rate_limited");
  assert.equal(s.db.get().status, "queued");
  assert.equal(s.db.get().purchase_started_at, null);
  assert.equal(s.db.get().next_attempt_at, iso(T0 + 90_000));
});

// ── The step's time budget ────────────────────────────────────────────────────

test("every Vercel call of a step gets at most 20 s", async () => {
  const s = setup();
  assert.equal(await advanceCustomDomain("row-1", s.deps), "purchasing");
  for (const method of ["getOwnedDomain", "quotePrice", "buyDomain"]) assert.deepEqual(s.reg.timeouts(method), [20_000], method);
  assert.ok(s.searches[0].opts.timeoutMs <= 20_000);
});

/** A registrar method that takes `ms` of the fake clock, or times out at the timeout it was given. */
const slow = (s, ms, answer) => async (...args) => {
  const timeoutMs = args.at(-1)?.timeoutMs ?? 20_000;
  if (ms > timeoutMs) {
    s.clock.advance(timeoutMs);
    throw new RegistrarError(0, "timeout", "timed out");
  }
  s.clock.advance(ms);
  return answer;
};

test("the registered step fits its 90 s even when every call is slow", async () => {
  const s = setup({
    rows: [row({ status: "registered", registered_at: iso(T0 - HOUR) })],
    registrar: {
      getProjectDomain: (...args) => slow(s, 19_000, null)(...args),
      attachProjectDomain: (...args) => slow(s, 19_000, undefined)(...args),
    },
    probe: async () => {
      s.clock.advance(9_000);
      return false;
    },
  });

  assert.equal(await advanceCustomDomain("row-1", s.deps), "waiting");

  assert.deepEqual(s.reg.timeouts("getProjectDomain"), [20_000, 20_000]);
  assert.deepEqual(s.reg.timeouts("attachProjectDomain"), [20_000, 20_000]);
  assert.equal(s.probes[0].opts.timeoutMs, 10_000);
  assert.ok(s.clock.ms - T0 <= 90_000, `the step took ${(s.clock.ms - T0) / 1000} s`);
});

test("a call late in the step only gets what is left of the budget", async () => {
  const s = setup({
    rows: [row({ status: "registered", registered_at: iso(T0 - HOUR) })],
    registrar: {
      getProjectDomain: (...args) => slow(s, 19_000, null)(...args),
      attachProjectDomain: (...args) => slow(s, 19_000, undefined)(...args),
    },
    deps: { stepBudgetMs: 60_000 },
  });

  // 57 s in, the www attach gets 3 s, not 20, and times out.
  assert.equal(await advanceCustomDomain("row-1", s.deps), "retry");
  assert.deepEqual(s.reg.timeouts("attachProjectDomain"), [20_000, 3_000]);
  assert.ok(s.clock.ms - T0 <= 60_000);
});

test("a step out of budget stops where it is, without spending an attempt", async () => {
  const s = setup({
    rows: [row({ status: "registered", registered_at: iso(T0 - HOUR), attempts: 1 })],
    registrar: {
      getProjectDomain: (...args) => slow(s, 15_000, null)(...args),
      attachProjectDomain: (...args) => slow(s, 15_000, undefined)(...args),
    },
    deps: { stepBudgetMs: 30_000 },
  });

  assert.equal(await advanceCustomDomain("row-1", s.deps), "waiting");
  assert.equal(s.db.get().status, "registered");
  assert.equal(s.db.get().attempts, 1);
  assert.equal(s.db.get().next_attempt_at, iso(s.clock.ms));
  assert.equal(s.reg.called("attachProjectDomain").length, 1);
});

test("a buy never starts without its full 20 s left", async () => {
  const s = setup({
    registrar: { getOwnedDomain: (...args) => slow(s, 15_000, null)(...args) },
    deps: { stepBudgetMs: 30_000 },
  });

  assert.equal(await advanceCustomDomain("row-1", s.deps), "waiting");
  assert.equal(s.reg.called("buyDomain").length, 0);
  assert.equal(s.db.get().status, "queued");
  assert.equal(s.db.get().attempts, 0);
});

// ── purchasing, with an order ─────────────────────────────────────────────────

const withOrder = (order, extra = {}, rowOverrides = {}) =>
  setup({ rows: [purchasing({ vercel_order_id: "ord_1", ...rowOverrides })], registrar: { getOrder: async () => order, ...extra } });

test("purchasing: a completed order registers the domain with Vercel's expiry", async () => {
  const s = withOrder(
    { status: "completed", domains: [{ domainName: NAME, status: "completed" }] },
    { getOwnedDomain: async () => OURS },
  );

  assert.equal(await advanceCustomDomain("row-1", s.deps), "registered");

  const r = s.db.get();
  assert.equal(r.status, "registered");
  assert.equal(r.registered_at, iso(T0));
  assert.equal(r.expires_at, "2028-10-02T10:00:00.000Z");
  assert.equal(s.reg.called("getOrder")[0].args[0], "ord_1");
});

test("purchasing: a completed order whose domain is not in the account yet is a failure, not a guess", async () => {
  const s = withOrder({ status: "completed", domains: [{ domainName: NAME, status: "completed" }] });
  assert.equal(await advanceCustomDomain("row-1", s.deps), "retry");
  assert.equal(s.db.get().status, "purchasing");
  assert.equal(s.db.get().attempts, 1);
});

test("purchasing: a pending order is looked at again in 2 minutes, which is not a failure", async () => {
  for (const order of [
    { status: "draft", domains: [{ domainName: NAME, status: "pending" }] },
    { status: "purchasing", domains: [{ domainName: NAME, status: "pending" }] },
    { status: "completed", domains: [{ domainName: NAME, status: "pending" }] },
  ]) {
    const s = withOrder(order);
    assert.equal(await advanceCustomDomain("row-1", s.deps), "waiting");
    assert.equal(s.db.get().status, "purchasing");
    assert.equal(s.db.get().attempts, 0);
    assert.equal(s.db.get().next_attempt_at, iso(T0 + 2 * MIN));
  }
});

test("purchasing: an order still pending 24 h after the buy call fails with an alert", async () => {
  const pending = { status: "purchasing", domains: [{ domainName: NAME, status: "pending" }] };

  const late = withOrder(pending, {}, { purchase_started_at: iso(T0 - 24 * HOUR) });
  assert.equal(await advanceCustomDomain("row-1", late.deps), "failed");
  assert.equal(late.db.get().last_error, "order_pending_timeout");
  assert.equal(late.mailer.alerts.length, 1);
  assert.equal(late.mailer.alerts[0].orderId, "ord_1");
  assert.equal(late.mailer.alerts[0].orderMayExist, true);

  const almost = withOrder(pending, {}, { purchase_started_at: iso(T0 - 24 * HOUR + MIN) });
  assert.equal(await advanceCustomDomain("row-1", almost.deps), "waiting");
});

test("purchasing: unavailable-legal goes back to the couple, and the dead order is forgotten", async () => {
  const s = withOrder({ status: "failed", domains: [{ domainName: NAME, status: "failed", errorCode: "unavailable-legal" }] });

  assert.equal(await advanceCustomDomain("row-1", s.deps), "awaiting_choice");

  assert.equal(s.db.get().status, "awaiting_choice");
  assert.equal(s.db.get().last_error, "name_unavailable");
  // Or the couple's next name would follow this failed order instead of being bought.
  assert.equal(s.db.get().vercel_order_id, null);
  assert.equal(s.mailer.notices[0].code, "name_unavailable");
  assert.equal(s.mailer.alerts.length, 0);
});

test("purchasing: a refunded or failed order fails the row with its code, and alerts", async () => {
  for (const [order, code] of [
    [{ status: "failed", domains: [{ domainName: NAME, status: "refunded", errorCode: "price-change" }] }, "price-change"],
    [{ status: "failed", domains: [{ domainName: NAME, status: "failed", errorCode: "invalid-contact" }] }, "invalid-contact"],
    [{ status: "failed", domains: [{ domainName: NAME, status: "pending" }], errorCode: "payment-failed" }, "payment-failed"],
    [{ status: "failed", domains: [{ domainName: NAME, status: "refunded" }] }, "refunded"],
  ]) {
    const s = withOrder(order);
    assert.equal(await advanceCustomDomain("row-1", s.deps), "failed", code);
    assert.equal(s.db.get().status, "failed");
    assert.equal(s.db.get().last_error, code);
    assert.equal(s.mailer.alerts.length, 1);
    assert.equal(s.mailer.alerts[0].orderId, "ord_1");
  }
});

test("purchasing: a failed refund always reaches the studio, whatever the reason", async () => {
  const s = withOrder({ status: "failed", domains: [{ domainName: NAME, status: "refund-failed", errorCode: "unavailable-legal" }] });
  assert.equal(await advanceCustomDomain("row-1", s.deps), "failed");
  assert.equal(s.db.get().last_error, "unavailable-legal");
  assert.equal(s.mailer.notices.length, 0);
  assert.equal(s.mailer.alerts.length, 1);
});

test("queued with an order id follows that order instead of buying", async () => {
  const completed = setup({
    rows: [row({ vercel_order_id: "ord_prev" })],
    registrar: {
      getOrder: async () => ({ status: "completed", domains: [{ domainName: NAME, status: "completed" }] }),
      getOwnedDomain: async () => OURS,
    },
  });
  assert.equal(await advanceCustomDomain("row-1", completed.deps), "registered");
  assert.deepEqual(completed.reg.called("getOrder").map((c) => c.args[0]), ["ord_prev"]);
  assert.equal(completed.reg.called("buyDomain").length, 0);
  assert.equal(completed.searches.length, 0);

  const pending = setup({ rows: [row({ vercel_order_id: "ord_prev" })] });
  assert.equal(await advanceCustomDomain("row-1", pending.deps), "waiting");
  assert.equal(pending.reg.called("buyDomain").length, 0);
  assert.equal(pending.db.get().vercel_order_id, "ord_prev");

  const failed = setup({
    rows: [row({ vercel_order_id: "ord_prev" })],
    registrar: { getOrder: async () => ({ status: "failed", domains: [{ domainName: NAME, status: "refunded", errorCode: "price-change" }] }) },
  });
  assert.equal(await advanceCustomDomain("row-1", failed.deps), "failed");
  assert.equal(failed.reg.called("buyDomain").length, 0);
});

// ── registered ────────────────────────────────────────────────────────────────

const registered = (overrides = {}) => row({ status: "registered", registered_at: iso(T0 - HOUR), ...overrides });

test("registered: both names are attached, www redirecting to the bare name", async () => {
  const s = setup({ rows: [registered()] });

  await advanceCustomDomain("row-1", s.deps);

  assert.deepEqual(
    s.reg.called("attachProjectDomain").map((c) => c.args.slice(0, 2)),
    [[NAME, undefined], [`www.${NAME}`, { redirect: NAME, redirectStatusCode: 308 }]],
  );
});

test("registered: names already on the project are not posted again", async () => {
  const s = setup({ rows: [registered()], registrar: { getProjectDomain: async (name) => ({ name }) } });
  await advanceCustomDomain("row-1", s.deps);
  assert.equal(s.reg.called("attachProjectDomain").length, 0);
});

test("registered: an attach answering 400 is read back, and counts when attached", async () => {
  // The real client against a replayed Vercel: not attached yet, POST 400
  // with an undocumented code, then the read-back finds it.
  const answers = [
    { status: 404, body: { error: { code: "not_found" } } },
    { status: 400, body: { error: { code: "domain_already_in_use", message: "already" } } },
    { status: 200, body: { name: NAME } },
    { status: 200, body: { name: `www.${NAME}` } },
  ];
  const seen = [];
  const fetch = async (url, init = {}) => {
    seen.push(`${init.method ?? "GET"} ${new URL(String(url)).pathname}`);
    const { status, body } = answers.shift();
    return new Response(JSON.stringify(body), { status });
  };
  const registrar = createRegistrar({ fetch, token: "t", teamId: "team", projectId: "prj" });
  const s = setup({ rows: [registered()], deps: { registrar }, probe: async () => true });

  assert.equal(await advanceCustomDomain("row-1", s.deps), "active");
  assert.deepEqual(seen, [
    `GET /v9/projects/prj/domains/${NAME}`,
    "POST /v10/projects/prj/domains",
    `GET /v9/projects/prj/domains/${NAME}`,
    `GET /v9/projects/prj/domains/www.${NAME}`,
  ]);
});

test("registered: no certificate yet is looked at again in 5 minutes, which is not a failure", async () => {
  const s = setup({ rows: [registered({ attempts: 2 })] });

  assert.equal(await advanceCustomDomain("row-1", s.deps), "waiting");

  assert.deepEqual(s.probes.map((p) => p.url), [`https://${NAME}/`]);
  assert.equal(s.db.get().status, "registered");
  assert.equal(s.db.get().attempts, 0);
  assert.equal(s.db.get().next_attempt_at, iso(T0 + 5 * MIN));
});

test("registered: 48 hours without a certificate fails the row and alerts", async () => {
  const s = setup({ rows: [registered({ registered_at: iso(T0 - 48 * HOUR) })] });

  assert.equal(await advanceCustomDomain("row-1", s.deps), "failed");
  assert.equal(s.db.get().last_error, "certificate_timeout");
  assert.equal(s.mailer.alerts.length, 1);

  const before = setup({ rows: [registered({ registered_at: iso(T0 - 48 * HOUR + MIN) })] });
  assert.equal(await advanceCustomDomain("row-1", before.deps), "waiting");
});

test("registered: an answer over HTTPS makes the domain active and tells the couple", async () => {
  const s = setup({ rows: [registered()], probe: async () => true });

  assert.equal(await advanceCustomDomain("row-1", s.deps), "active");

  const r = s.db.get();
  assert.equal(r.status, "active");
  assert.equal(r.activated_at, iso(T0));
  assert.equal(r.status_changed_at, iso(T0));
  assert.deepEqual(r.notices_sent, ["active"]);
  assert.deepEqual(s.mailer.notices, [{ code: "active", name: NAME, contact: COUPLE }]);
  assertWritesReleaseTheLease(s.db, s.clock);
});

// ── Emails ────────────────────────────────────────────────────────────────────

test("an email already claimed is not sent again", async () => {
  const s = setup({ rows: [registered({ notices_sent: ["active"] })], probe: async () => true });

  assert.equal(await advanceCustomDomain("row-1", s.deps), "active");
  assert.equal(s.mailer.notices.length, 0);
  assert.deepEqual(s.db.get().notices_sent, ["active"]);
});

test("a failed send releases the email so the next run retries it", async () => {
  const s = setup({ rows: [registered()], probe: async () => true, mailer: fakeMailer({ noticeSent: false }) });

  assert.equal(await advanceCustomDomain("row-1", s.deps), "active");
  assert.equal(s.mailer.notices.length, 1);
  assert.deepEqual(s.db.get().notices_sent, []);
});

test("a couple without an address releases the email too", async () => {
  const s = setup({ rows: [registered()], probe: async () => true, contact: null });

  assert.equal(await advanceCustomDomain("row-1", s.deps), "active");
  assert.equal(s.mailer.notices.length, 0);
  assert.deepEqual(s.db.get().notices_sent, []);
});

test("an email that hangs is given up after its timeout: the couple's stays claimed (at most once)", async () => {
  const s = setup({ rows: [registered()], probe: async () => true, mailer: fakeMailer({ hang: true }), deps: { mailTimeoutMs: 5 } });

  assert.equal(await advanceCustomDomain("row-1", s.deps), "active");
  assert.equal(s.mailer.notices.length, 1);
  // It may have gone out: a second one would be a duplicate.
  assert.deepEqual(s.db.get().notices_sent, ["active"]);
});

test("a studio alert that hangs is released, so the cron sends it again", async () => {
  const s = setup({ rows: [row({ claims_since_progress: 2 })], mailer: fakeMailer({ hang: true }), deps: { mailTimeoutMs: 5 } });

  assert.equal(await advanceCustomDomain("row-1", s.deps), "failed");
  assert.deepEqual(s.db.get().notices_sent, []);
});

test("a studio alert that fails to send is not lost: the cron sends it, once", async () => {
  const mailer = fakeMailer({ alertSent: false });
  const s = setup({ rows: [row({ claims_since_progress: 2 })], mailer });

  assert.equal(await advanceCustomDomain("row-1", s.deps), "failed");
  assert.equal(mailer.alerts.length, 1);
  assert.deepEqual(s.db.get().notices_sent, []);

  // Resend still refuses: the claim is given back each time.
  s.clock.advance(5 * MIN);
  assert.deepEqual((await advanceDue(s.deps)).notices, { sent: 0, skipped: 0, failed: 1 });
  assert.equal(mailer.alerts.length, 2);

  mailer.alertSent = true;
  s.clock.advance(5 * MIN);
  assert.deepEqual((await advanceDue(s.deps)).notices, { sent: 1, skipped: 0, failed: 0 });
  assert.equal(mailer.alerts.length, 3);
  assert.equal(mailer.alerts[2].lastError, "step_keeps_dying");
  assert.equal(mailer.alerts[2].status, "failed");
  assert.deepEqual(s.db.get().notices_sent, ["studio_failed"]);

  s.clock.advance(5 * MIN);
  assert.deepEqual((await advanceDue(s.deps)).notices, { sent: 0, skipped: 0, failed: 0 });
  assert.equal(mailer.alerts.length, 3);
});

test("a row relaunched by hand that fails again alerts the studio again", async () => {
  // Its first failure's alert is still recorded; the studio set it back to queued.
  const s = setup({ rows: [row({ notices_sent: ["studio_failed"], claims_since_progress: 2 })] });

  assert.equal(await advanceCustomDomain("row-1", s.deps), "failed");
  assert.equal(s.mailer.alerts.length, 1);
  assert.deepEqual(s.db.get().notices_sent, ["studio_failed"]);
});

test("a lease lost mid-step stops the step: no further write, no email", async () => {
  const s = setup({
    rows: [registered()],
    // Another run claims the row while the certificate is being probed.
    probe: async (_url, db) => {
      db.steal();
      return true;
    },
  });

  assert.equal(await advanceCustomDomain("row-1", s.deps), "lost_lease");

  assert.equal(s.db.writes.length, 1);
  assert.equal(s.db.writes[0].matched, false);
  assert.equal(s.db.get().status, "registered");
  assert.equal(s.mailer.notices.length, 0);
  assert.equal(s.mailer.alerts.length, 0);
});

test("a lease lost before a failure is recorded writes nothing more", async () => {
  const s = setup({
    registrar: {
      getOwnedDomain: async () => {
        s.db.steal();
        throw new RegistrarError(500, "http_500", "down");
      },
    },
  });

  assert.equal(await advanceCustomDomain("row-1", s.deps), "lost_lease");
  assert.equal(s.db.writes.length, 1);
  assert.equal(s.db.get().attempts, 0);
});

test("processClaimedRow refuses a row without a lease token", async () => {
  const s = setup();
  assert.equal(await processClaimedRow(row({ lease_token: null }), s.deps), "lost_lease");
  assert.equal(s.reg.calls.length, 0);
  assert.equal(s.db.writes.length, 0);
});

// ── The cron's run ────────────────────────────────────────────────────────────

test("advanceDue advances every due row and counts the outcomes", async () => {
  const s = setup({
    rows: [
      row({ id: "row-1", site_id: "site-1", name: "a-b-c.com" }),
      row({ id: "row-2", site_id: "site-2", name: "d-e-f.com", status: "registered", registered_at: iso(T0 - HOUR) }),
      row({ id: "row-3", site_id: "site-3", name: "g-h-i.com", next_attempt_at: iso(T0 + HOUR) }),
    ],
  });

  const summary = await advanceDue(s.deps);

  assert.equal(summary.claimed, 2);
  assert.deepEqual(summary.outcomes, { purchasing: 1, waiting: 1 });
  assert.equal(s.db.get("row-1").status, "purchasing");
  assert.equal(s.db.get("row-2").status, "registered");
  assert.equal(s.db.get("row-3").status, "queued");
  assert.equal(s.db.get("row-3").lease_token, null);
});

test("advanceDue sends the 7-day reminder once, and gives up after 30 days", async () => {
  const s = setup({
    rows: [
      row({ id: "late", status: "awaiting_choice", name: null, status_changed_at: iso(T0 - 8 * DAY) }),
      row({ id: "recent", site_id: "site-2", status: "awaiting_choice", name: null, status_changed_at: iso(T0 - 6 * DAY) }),
      row({ id: "stale", site_id: "site-3", status: "awaiting_choice", name: null, status_changed_at: iso(T0 - 31 * DAY) }),
    ],
  });

  const first = await advanceDue(s.deps);
  assert.deepEqual(first.notices, { sent: 1, skipped: 0, failed: 0 });
  assert.deepEqual(s.mailer.notices, [{ code: "reminder", name: null, contact: COUPLE }]);
  assert.deepEqual(s.db.get("late").notices_sent, ["reminder"]);
  assert.deepEqual(s.db.get("recent").notices_sent, []);
  assert.deepEqual(s.db.get("stale").notices_sent, []);

  const second = await advanceDue(s.deps);
  assert.deepEqual(second.notices, { sent: 0, skipped: 0, failed: 0 });
  assert.equal(s.mailer.notices.length, 1);
});

test("advanceDue retries an email a previous run failed to send, within its window", async () => {
  const s = setup({
    rows: [
      row({ id: "live", status: "active", activated_at: iso(T0 - HOUR), status_changed_at: iso(T0 - HOUR) }),
      // The checkout's own name-lost row: no name, never claimed by the engine.
      row({ id: "lost", site_id: "site-2", status: "awaiting_choice", name: null, last_error: "name_unavailable", status_changed_at: iso(T0 - HOUR) }),
      // Live for 8 days: its email is no longer retried.
      row({ id: "old", site_id: "site-3", name: "o-l-d.com", status: "active", status_changed_at: iso(T0 - 8 * DAY) }),
      // Failed 29 days ago, alert never sent; 31 days ago is given up.
      row({ id: "failed", site_id: "site-4", name: "f-a-i.com", status: "failed", last_error: "http_500", status_changed_at: iso(T0 - 29 * DAY) }),
      row({ id: "ancient", site_id: "site-5", name: "a-n-c.com", status: "failed", last_error: "http_500", status_changed_at: iso(T0 - 31 * DAY) }),
    ],
  });

  const summary = await advanceDue(s.deps);

  assert.equal(summary.claimed, 0);
  assert.deepEqual(summary.notices, { sent: 3, skipped: 0, failed: 0 });
  assert.deepEqual(
    s.mailer.notices.map((n) => [n.code, n.name]),
    [["active", NAME], ["name_unavailable", null]],
  );
  assert.deepEqual(s.mailer.alerts.map((a) => [a.id, a.lastError, a.status]), [["failed", "http_500", "failed"]]);
});

test("advanceDue stops starting emails before the cron's time runs out", async () => {
  const rows = Array.from({ length: 20 }, (_, i) =>
    row({ id: `wait-${i}`, site_id: `site-w${i}`, name: null, status: "awaiting_choice", status_changed_at: iso(T0 - 8 * DAY) }),
  ).concat(
    Array.from({ length: 20 }, (_, i) =>
      row({ id: `live-${i}`, site_id: `site-l${i}`, name: `l-${i}-x.com`, status: "active", status_changed_at: iso(T0 - HOUR) }),
    ),
  );
  const mailer = fakeMailer();
  const s = setup({ rows, mailer });
  // Each email takes 10 s of the clock.
  const send = mailer.sendCoupleNotice.bind(mailer);
  mailer.sendCoupleNotice = async (notice) => {
    s.clock.advance(10_000);
    return send(notice);
  };

  const summary = await advanceDue(s.deps);

  // 240 s for the run: the 25th email would start at 240 s.
  assert.equal(summary.notices.sent, 24);
  assert.ok(s.clock.ms - T0 <= 250_000);
});
