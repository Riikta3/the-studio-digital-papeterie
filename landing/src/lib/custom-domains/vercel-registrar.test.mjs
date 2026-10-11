import assert from "node:assert/strict";
import test from "node:test";

import { RegistrarError, createRegistrar, registrarFromEnv } from "./vercel-registrar.ts";

const DEPS = { token: "tok_test", teamId: "team_123", projectId: "prj_456" };

/**
 * A `fetch` that answers each call from `answers` in turn — `{ status, body }`
 * or a thrown error — and records what it was asked. No test reaches Vercel:
 * a successful buy call costs real money, and there is no sandbox.
 */
function fakeFetch(...answers) {
  const calls = [];
  const fetch = async (url, init = {}) => {
    timeouts.push(lastTimeout);
    calls.push({
      url: new URL(String(url)),
      method: init.method ?? "GET",
      headers: init.headers ?? {},
      body: init.body === undefined ? undefined : JSON.parse(init.body),
      signal: init.signal,
    });
    const answer = answers.shift();
    if (!answer) throw new Error("fakeFetch: no answer left");
    if (answer instanceof Error) throw answer;
    return new Response(answer.body === undefined ? null : JSON.stringify(answer.body), {
      status: answer.status ?? 200,
      headers: { "content-type": "application/json", ...(answer.headers ?? {}) },
    });
  };
  return { fetch, calls };
}

/**
 * The timeout each request was given: `AbortSignal.timeout` is wrapped for
 * the duration of the tests, so the milliseconds asked for can be read back.
 */
const timeouts = [];
let lastTimeout = null;
const realTimeout = AbortSignal.timeout.bind(AbortSignal);
AbortSignal.timeout = (ms) => {
  lastTimeout = ms;
  return realTimeout(ms);
};

function registrar(...answers) {
  const { fetch, calls } = fakeFetch(...answers);
  return { registrar: createRegistrar({ ...DEPS, fetch }), calls };
}

const CONTACT = {
  firstName: "Camille",
  lastName: "Martin",
  email: "domaines@example.com",
  phone: "+33.612345678",
  address1: "1 rue de la Paix",
  city: "Paris",
  state: "Île-de-France",
  zip: "75002",
  country: "FR",
  companyName: "The Studio SAS",
};

test("every call carries the team, the token and a timeout", async () => {
  const { registrar: r, calls } = registrar({ body: { years: 2, purchasePrice: 22.5, renewalPrice: 11.25, transferPrice: 11.25 } });

  await r.quotePrice("sophie-et-pierre.com", 2);

  const [call] = calls;
  assert.equal(call.url.origin, "https://api.vercel.com");
  assert.equal(call.url.pathname, "/v1/registrar/domains/sophie-et-pierre.com/price");
  assert.equal(call.url.searchParams.get("years"), "2");
  assert.equal(call.url.searchParams.get("teamId"), "team_123");
  assert.equal(call.headers.Authorization, "Bearer tok_test");
  assert.ok(call.signal instanceof AbortSignal, "every call is bounded by a timeout");
});

test("quotePrice returns the total for N years, or null when the name is taken", async () => {
  const { registrar: r } = registrar(
    { body: { years: 2, purchasePrice: 22.5, renewalPrice: 11.25, transferPrice: 11.25 } },
    { body: { years: 1, purchasePrice: null, renewalPrice: null, transferPrice: null } },
  );

  assert.deepEqual(await r.quotePrice("sophie-et-pierre.com", 2), { years: 2, purchasePrice: 22.5 });
  assert.deepEqual(await r.quotePrice("google.com", 1), { years: 1, purchasePrice: null });
});

test("a quote without a purchasePrice field is refused rather than read as taken", async () => {
  const { registrar: r } = registrar({ body: { years: 1 } });
  await assert.rejects(r.quotePrice("a-b-c.com", 1), (error) => error instanceof RegistrarError && error.code === "invalid_response");
});

test("buyDomain sends the quoted total as expectedPrice, never renews, and returns the order", async () => {
  const { registrar: r, calls } = registrar({ body: { orderId: "ord_1", _links: {} } });

  const result = await r.buyDomain("sophie-et-pierre.com", { years: 2, expectedPrice: 22.5, contact: CONTACT });

  assert.deepEqual(result, { orderId: "ord_1" });
  const [call] = calls;
  assert.equal(call.method, "POST");
  assert.equal(call.url.pathname, "/v1/registrar/domains/sophie-et-pierre.com/buy");
  assert.equal(call.url.searchParams.get("teamId"), "team_123");
  assert.equal(call.headers["Content-Type"], "application/json");
  assert.deepEqual(call.body, {
    autoRenew: false,
    years: 2,
    expectedPrice: 22.5,
    contactInformation: CONTACT,
  });
});

test("buyDomain refuses to call with a price or years nobody quoted", async () => {
  const { registrar: r, calls } = registrar();
  await assert.rejects(r.buyDomain("a-b-c.com", { years: 0, expectedPrice: 11.25, contact: CONTACT }), RangeError);
  await assert.rejects(r.buyDomain("a-b-c.com", { years: 1, expectedPrice: Number.NaN, contact: CONTACT }), RangeError);
  await assert.rejects(r.buyDomain("a-b-c.com", { years: 1, expectedPrice: 0, contact: CONTACT }), RangeError);
  assert.equal(calls.length, 0);
});

test("a buy answering 2xx without an order id is an error, not a success", async () => {
  const { registrar: r } = registrar({ body: {} });
  await assert.rejects(
    r.buyDomain("a-b-c.com", { years: 1, expectedPrice: 11.25, contact: CONTACT }),
    (error) => error instanceof RegistrarError && error.code === "invalid_response",
  );
});

test("errors in the flat shape are normalised", async () => {
  const { registrar: r } = registrar({
    status: 400,
    body: { status: 400, code: "expected_price_mismatch", message: "The expected price does not match" },
  });
  await assert.rejects(
    r.buyDomain("a-b-c.com", { years: 1, expectedPrice: 11.25, contact: CONTACT }),
    (error) =>
      error instanceof RegistrarError &&
      error.status === 400 &&
      error.code === "expected_price_mismatch" &&
      error.message === "The expected price does not match",
  );
});

test("errors in the nested shape are normalised", async () => {
  const { registrar: r } = registrar({
    status: 400,
    body: { error: { code: "domain_not_available", message: "Domain is not available" } },
  });
  await assert.rejects(
    r.buyDomain("a-b-c.com", { years: 1, expectedPrice: 11.25, contact: CONTACT }),
    (error) =>
      error instanceof RegistrarError &&
      error.status === 400 &&
      error.code === "domain_not_available" &&
      error.message === "Domain is not available",
  );
});

test("an error without a body gets a code from its status", async () => {
  const { registrar: r } = registrar({ status: 500 });
  await assert.rejects(r.getOrder("ord_1"), (error) => error instanceof RegistrarError && error.status === 500 && error.code === "http_500");
});

test("a network failure or a timeout is a RegistrarError with status 0", async () => {
  const timeout = new DOMException("The operation was aborted due to timeout", "TimeoutError");
  const { registrar: r } = registrar(new TypeError("fetch failed"), timeout);

  await assert.rejects(r.getOrder("ord_1"), (error) => error instanceof RegistrarError && error.status === 0 && error.code === "network_error");
  await assert.rejects(r.getOrder("ord_1"), (error) => error instanceof RegistrarError && error.status === 0 && error.code === "timeout");
});

test("the token never appears in an error message", async () => {
  const { registrar: r } = registrar(new TypeError("fetch failed"), { status: 403, body: { error: { code: "forbidden", message: "Not authorized" } } });
  for (const call of [r.getOrder("ord_1"), r.getOrder("ord_1")]) {
    await assert.rejects(call, (error) => !String(error.message).includes("tok_test"));
  }
});

test("getOrder reads the order and each domain's status", async () => {
  const body = {
    id: "ord_1",
    status: "failed",
    domains: [{ domainName: "a-b-c.com", status: "failed", error: { code: "unavailable-legal" } }],
    error: { code: "unexpected-error" },
  };
  const { registrar: r, calls } = registrar({ body });

  assert.deepEqual(await r.getOrder("ord_1"), {
    status: "failed",
    domains: [{ domainName: "a-b-c.com", status: "failed", errorCode: "unavailable-legal" }],
    errorCode: "unexpected-error",
  });
  assert.equal(calls[0].url.pathname, "/v1/registrar/orders/ord_1");
});

test("getOwnedDomain returns the expiry and the purchase time when the domain is ours, null on 404", async () => {
  const { registrar: r, calls } = registrar(
    { body: { domain: { name: "a-b-c.com", expiresAt: 1830000000000, boughtAt: 1798000000000 } } },
    { status: 404, body: { error: { code: "not_found", message: "Domain not found" } } },
    // Added to the team without being bought through Vercel: no boughtAt.
    { body: { domain: { name: "d-e-f.com", expiresAt: null, boughtAt: null } } },
  );

  assert.deepEqual(await r.getOwnedDomain("a-b-c.com"), { expiresAt: 1830000000000, boughtAt: 1798000000000 });
  assert.equal(await r.getOwnedDomain("x-y-z.com"), null);
  assert.deepEqual(await r.getOwnedDomain("d-e-f.com"), { expiresAt: null, boughtAt: null });
  assert.equal(calls[0].url.pathname, "/v5/domains/a-b-c.com");
});

test("each call takes the caller's timeout, never more than 20 s", async () => {
  timeouts.length = 0;
  const { registrar: r } = registrar(
    { body: { status: "purchasing", domains: [] } },
    { body: { status: "purchasing", domains: [] } },
    { body: { status: "purchasing", domains: [] } },
    { body: { orderId: "ord_1" } },
  );
  await r.getOrder("ord_1");
  await r.getOrder("ord_1", { timeoutMs: 7_500 });
  await r.getOrder("ord_1", { timeoutMs: 60_000 });
  await r.buyDomain("a-b-c.com", { years: 1, expectedPrice: 11.25, contact: CONTACT }, { timeoutMs: 3_000 });
  assert.deepEqual(timeouts, [20_000, 7_500, 20_000, 3_000]);
});

test("an attach and its read-back share the call's timeout", async () => {
  timeouts.length = 0;
  const { registrar: r } = registrar(
    { status: 409, body: { error: { code: "domain_already_in_use", message: "already" } } },
    { body: { name: "a-b-c.com" } },
  );
  await r.attachProjectDomain("a-b-c.com", undefined, { timeoutMs: 10_000 });
  assert.equal(timeouts.length, 2);
  assert.equal(timeouts[0], 10_000);
  assert.ok(timeouts[1] <= 10_000 && timeouts[1] > 0, `read-back got ${timeouts[1]}`);
});

test("a 429 carries how long to wait: Retry-After in seconds, or the body's retryAfter", async () => {
  const { registrar: r } = registrar(
    { status: 429, headers: { "retry-after": "42" }, body: { status: 429, code: "too_many_requests", message: "slow down" } },
    { status: 429, body: { status: 429, code: "too_many_requests", message: "slow down", retryAfter: { value: 90, str: "90s" }, limit: { total: 1, remaining: 0, reset: 0 } } },
    { status: 429, body: { status: 429, code: "too_many_requests", message: "slow down" } },
  );
  await assert.rejects(r.getOrder("ord_1"), (error) => error instanceof RegistrarError && error.status === 429 && error.retryAfterMs === 42_000);
  await assert.rejects(r.getOrder("ord_1"), (error) => error.retryAfterMs === 90_000);
  await assert.rejects(r.getOrder("ord_1"), (error) => error.status === 429 && error.retryAfterMs === undefined);
});

test("getOwnedDomain throws on any other error", async () => {
  const { registrar: r } = registrar({ status: 403, body: { error: { code: "forbidden", message: "no" } } });
  await assert.rejects(r.getOwnedDomain("a-b-c.com"), (error) => error instanceof RegistrarError && error.code === "forbidden");
});

test("attachProjectDomain posts the name, or the www redirect", async () => {
  const { registrar: r, calls } = registrar({ body: { name: "a-b-c.com" } }, { body: { name: "www.a-b-c.com" } });

  await r.attachProjectDomain("a-b-c.com");
  await r.attachProjectDomain("www.a-b-c.com", { redirect: "a-b-c.com", redirectStatusCode: 308 });

  assert.equal(calls[0].method, "POST");
  assert.equal(calls[0].url.pathname, "/v10/projects/prj_456/domains");
  assert.deepEqual(calls[0].body, { name: "a-b-c.com" });
  assert.deepEqual(calls[1].body, { name: "www.a-b-c.com", redirect: "a-b-c.com", redirectStatusCode: 308 });
});

test("an attach answering 400 or 409 is read back, and counts as attached when it is", async () => {
  for (const status of [400, 409]) {
    const { registrar: r, calls } = registrar(
      { status, body: { error: { code: "domain_already_in_use_by_project", message: "already" } } },
      { body: { name: "a-b-c.com", verified: true } },
    );
    await r.attachProjectDomain("a-b-c.com");
    assert.equal(calls[1].method, "GET");
    assert.equal(calls[1].url.pathname, "/v9/projects/prj_456/domains/a-b-c.com");
  }
});

test("an attach answering 400 that is not attached after all throws the original error", async () => {
  const { registrar: r } = registrar(
    { status: 400, body: { error: { code: "invalid_domain", message: "bad" } } },
    { status: 404, body: { error: { code: "not_found", message: "no" } } },
  );
  await assert.rejects(r.attachProjectDomain("a-b-c.com"), (error) => error instanceof RegistrarError && error.code === "invalid_domain");
});

test("getProjectDomain returns null on 404", async () => {
  const { registrar: r } = registrar({ body: { name: "a-b-c.com", verified: true } }, { status: 404, body: { error: { code: "not_found" } } });
  assert.deepEqual(await r.getProjectDomain("a-b-c.com"), { name: "a-b-c.com" });
  assert.equal(await r.getProjectDomain("a-b-c.com"), null);
});

test("registrarFromEnv needs the token, the team and the project", () => {
  const full = { VERCEL_API_TOKEN: "t", VERCEL_TEAM_ID: "team", VERCEL_LANDING_PROJECT_ID: "prj" };
  assert.ok(registrarFromEnv(full));
  for (const key of Object.keys(full)) {
    assert.equal(registrarFromEnv({ ...full, [key]: "" }), null, `${key} empty`);
    assert.equal(registrarFromEnv({ ...full, [key]: "  " }), null, `${key} blank`);
    const rest = { ...full };
    delete rest[key];
    assert.equal(registrarFromEnv(rest), null, `${key} missing`);
  }
});
