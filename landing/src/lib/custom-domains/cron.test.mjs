import assert from "node:assert/strict";
import test from "node:test";

import { handleCustomDomainsCron } from "./cron.ts";

/*
 * The cron route's door: only Vercel Cron, with `Authorization: Bearer
 * $CRON_SECRET`, may drive the purchases. The engine is a fake that records
 * whether it ran: nothing here reaches Vercel or the database.
 */

const SUMMARY = { claimed: 1, outcomes: { purchasing: 1 }, notices: { sent: 0, skipped: 0, failed: 0 } };

function fakeEngine(result = async () => SUMMARY) {
  const runs = [];
  return {
    runs,
    run: async () => {
      runs.push(Date.now());
      return result();
    },
  };
}

const request = (authorization) =>
  new Request("https://example.com/api/cron/custom-domains", {
    headers: authorization === undefined ? {} : { authorization },
  });

/** Runs `fn` with `console[level]` silenced. */
async function quiet(level, fn) {
  const original = console[level];
  console[level] = () => {};
  try {
    return await fn();
  } finally {
    console[level] = original;
  }
}

test("without a secret configured, everyone is refused and the engine never runs", async () => {
  for (const secret of [undefined, "", "   "]) {
    for (const header of [undefined, "Bearer ", "Bearer undefined", `Bearer ${secret}`]) {
      const engine = fakeEngine();
      const response = await handleCustomDomainsCron(request(header), { secret, run: engine.run });
      assert.equal(response.status, 401, `${JSON.stringify(secret)} / ${header}`);
      assert.equal(engine.runs.length, 0);
    }
  }
});

test("a missing or wrong Authorization header is refused", async () => {
  // (A trailing space is no case: Headers strips it before anyone reads it.)
  for (const header of [undefined, "", "s3cret", "Bearer", "Bearer wrong", "bearer s3cret", "Bearer  s3cret", "Bearer s3cret2", "Basic s3cret"]) {
    const engine = fakeEngine();
    const response = await handleCustomDomainsCron(request(header), { secret: "s3cret", run: engine.run });
    assert.equal(response.status, 401, String(header));
    assert.equal(await response.text(), "Unauthorized");
    assert.equal(engine.runs.length, 0, String(header));
  }
});

test("the right secret runs the engine once and answers its summary", async () => {
  const engine = fakeEngine();
  const response = await quiet("log", () => handleCustomDomainsCron(request("Bearer s3cret"), { secret: "s3cret", run: engine.run }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), SUMMARY);
  assert.equal(engine.runs.length, 1);
});

test("an engine that throws answers 500 without its message", async () => {
  const engine = fakeEngine(async () => {
    throw new Error("custom_domains: claim_due_custom_domains failed (secret detail)");
  });
  const response = await quiet("error", () => handleCustomDomainsCron(request("Bearer s3cret"), { secret: "s3cret", run: engine.run }));
  assert.equal(response.status, 500);
  assert.doesNotMatch(await response.text(), /secret detail/);
});
