import assert from "node:assert/strict";
import test from "node:test";

import { processClaimedRow } from "./advance.ts";
import { engineDepsFromEnv } from "./engine.ts";

/*
 * The engine as wired from the landing's environment. The database and the
 * mailer are fakes; the point is what the environment alone decides: without
 * the Vercel variables there is no registrar, and a row is failed with an
 * alert instead of anything being called.
 */

const REGISTRANT = {
  DOMAIN_REGISTRANT_FIRST_NAME: "Camille",
  DOMAIN_REGISTRANT_LAST_NAME: "Martin",
  COMPANY_LEGAL_NAME: "The Studio SAS",
  COMPANY_DOMAINS_EMAIL: "domaines@example.com",
  COMPANY_PHONE: "+33.612345678",
  COMPANY_ADDRESS: "1 rue de la Paix",
  COMPANY_POSTAL_CODE: "75002",
  COMPANY_CITY: "Paris",
  COMPANY_REGION: "Île-de-France",
  COMPANY_COUNTRY: "FR",
};
const VERCEL = { VERCEL_API_TOKEN: "tok", VERCEL_TEAM_ID: "team", VERCEL_LANDING_PROJECT_ID: "prj" };

const NOW = new Date("2026-10-02T10:00:00.000Z");

function claimedRow(status) {
  return {
    id: "row-1",
    site_id: "site-1",
    wedding_id: "wed-1",
    name: "sophie-et-pierre.com",
    years: 1,
    price_paid_cents: 6500,
    stripe_payment_intent_id: "pi_1",
    status,
    status_changed_at: NOW.toISOString(),
    vercel_order_id: null,
    purchase_started_at: null,
    registered_at: status === "registered" ? NOW.toISOString() : null,
    expires_at: null,
    activated_at: null,
    attempts: 0,
    next_attempt_at: NOW.toISOString(),
    locked_until: NOW.toISOString(),
    lease_token: "lease-1",
    claims_since_progress: 1,
    last_error: null,
    notices_sent: [],
    created_at: NOW.toISOString(),
    updated_at: NOW.toISOString(),
  };
}

function fakes() {
  const writes = [];
  const alerts = [];
  const db = {
    async update(_id, _lease, patch) {
      writes.push(patch);
      return true;
    },
    async claimNotice() {
      return true;
    },
    async releaseNotice() {},
  };
  const mailer = {
    async sendStudioAlert(alert) {
      alerts.push(alert);
      return { sent: true };
    },
    async sendCoupleNotice() {
      return { sent: true };
    },
  };
  return { db, mailer, writes, alerts };
}

/** Runs `fn` with console.error silenced (the engine logs the failure it records). */
async function quiet(fn) {
  const original = console.error;
  console.error = () => {};
  try {
    return await fn();
  } finally {
    console.error = original;
  }
}

test("without VERCEL_* the engine has no registrar, and fails a row with an alert instead of calling anything", async () => {
  for (const missing of Object.keys(VERCEL)) {
    const env = { ...REGISTRANT, ...VERCEL, [missing]: "" };
    const { db, mailer, writes, alerts } = fakes();
    const fetches = [];
    const realFetch = globalThis.fetch;
    globalThis.fetch = async (...args) => {
      fetches.push(args);
      throw new Error("no network in tests");
    };
    try {
      const deps = engineDepsFromEnv(env, { db, mailer, now: () => NOW });
      assert.equal(deps.registrar, null, missing);
      assert.ok(deps.contact, "the registrant is complete");

      for (const status of ["queued", "purchasing", "registered"]) {
        writes.length = 0;
        alerts.length = 0;
        assert.equal(await quiet(() => processClaimedRow(claimedRow(status), deps)), "failed", `${missing} ${status}`);
        assert.equal(writes.at(-1).status, "failed");
        assert.equal(writes.at(-1).last_error, "registrar_not_configured");
        assert.equal(alerts.length, 1);
        assert.equal(alerts[0].lastError, "registrar_not_configured");
      }
    } finally {
      globalThis.fetch = realFetch;
    }
    assert.equal(fetches.length, 0, "nothing reached the network");
  }
});

test("with every variable, the engine has a registrar and the registrant in ASCII", () => {
  const deps = engineDepsFromEnv({ ...REGISTRANT, ...VERCEL });
  assert.ok(deps.registrar);
  assert.equal(deps.contact.state, "Ile-de-France");
});
