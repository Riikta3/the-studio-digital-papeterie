import assert from "node:assert/strict";
import test from "node:test";

import { clearDomainSearchCache, searchDomains } from "./domain-search.ts";

const FREE = "sophie-et-pierre-test-8417263.com";

/** The search endpoint's real answer on 2026-10-02, for one free, one taken and one `.fr` name. */
const REAL_RESPONSE = {
  results: [
    { domain: FREE, available: true, years: 1, price: 11.25, renewalPrice: 11.25, premium: false },
    { domain: "google.com", available: false },
    { domain: "example-test-8417263.fr", available: false },
  ],
};

/** A `fetch` that answers every call with `body`, and records what it was asked. */
function fakeFetch(body = REAL_RESPONSE, status = 200) {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push({ url: String(url), init, domains: JSON.parse(init.body).domains });
    return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  };
  return { fetch, calls };
}

const at = (ms) => () => ms;

test("searchDomains asks the public search endpoint once and answers in input order", async () => {
  clearDomainSearchCache();
  const { fetch, calls } = fakeFetch();

  const results = await searchDomains(["google.com", FREE], { fetch, now: at(0) });

  assert.deepEqual(results, [
    { name: "google.com", available: false },
    { name: FREE, available: true, priceUsd: 11.25 },
  ]);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.vercel.com/v1/registrar/domains/search");
  assert.equal(calls[0].init.method, "POST");
  assert.deepEqual(calls[0].domains, ["google.com", FREE]);
});

test("a premium name is not available, whatever its price", async () => {
  clearDomainSearchCache();
  const { fetch } = fakeFetch({
    results: [{ domain: "amour.com", available: true, years: 1, price: 9.5, renewalPrice: 9.5, premium: true }],
  });

  assert.deepEqual(await searchDomains(["amour.com"], { fetch, now: at(0) }), [
    { name: "amour.com", available: false, priceUsd: 9.5 },
  ]);
});

test("a name above the price ceiling is not available; one at the ceiling is", async () => {
  clearDomainSearchCache();
  const { fetch } = fakeFetch({
    results: [
      { domain: "cher.com", available: true, years: 1, price: 15.01, renewalPrice: 15.01, premium: false },
      { domain: "juste.com", available: true, years: 1, price: 15, renewalPrice: 15, premium: false },
      { domain: "sans-prix.com", available: true, years: 1, premium: false },
    ],
  });

  assert.deepEqual(await searchDomains(["cher.com", "juste.com", "sans-prix.com"], { fetch, now: at(0) }), [
    { name: "cher.com", available: false, priceUsd: 15.01 },
    { name: "juste.com", available: true, priceUsd: 15 },
    // No price to hold against the ceiling: not offered.
    { name: "sans-prix.com", available: false },
  ]);
});

test("a name outside .com is never available, even if the registrar says so", async () => {
  clearDomainSearchCache();
  const { fetch, calls } = fakeFetch({
    results: [
      { domain: "example-test-8417263.fr", available: true, years: 1, price: 8, renewalPrice: 8, premium: false },
      { domain: FREE, available: true, years: 1, price: 11.25, renewalPrice: 11.25, premium: false },
    ],
  });

  const results = await searchDomains(["example-test-8417263.fr", FREE], { fetch, now: at(0) });

  assert.deepEqual(results, [
    { name: "example-test-8417263.fr", available: false },
    { name: FREE, available: true, priceUsd: 11.25 },
  ]);
  // Not worth asking about.
  assert.deepEqual(calls[0].domains, [FREE]);
});

test("a name the registrar left out of its answer is not available", async () => {
  clearDomainSearchCache();
  const { fetch } = fakeFetch({ results: [] });

  assert.deepEqual(await searchDomains(["oublie.com"], { fetch, now: at(0) }), [
    { name: "oublie.com", available: false },
  ]);
});

test("answers are cached for 60 s per name", async () => {
  clearDomainSearchCache();
  const { fetch, calls } = fakeFetch();

  await searchDomains([FREE], { fetch, now: at(1_000) });
  const again = await searchDomains([FREE], { fetch, now: at(1_000 + 59_000) });
  assert.equal(calls.length, 1);
  assert.deepEqual(again, [{ name: FREE, available: true, priceUsd: 11.25 }]);

  // Only the name not seen yet is asked for.
  await searchDomains([FREE, "google.com"], { fetch, now: at(1_000 + 59_500) });
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[1].domains, ["google.com"]);

  await searchDomains([FREE], { fetch, now: at(1_000 + 61_000) });
  assert.equal(calls.length, 3);
  assert.deepEqual(calls[2].domains, [FREE]);
});

test("maxAgeMs: 0 asks the registrar again, and still refreshes the cache", async () => {
  clearDomainSearchCache();
  const first = fakeFetch();
  await searchDomains([FREE], { fetch: first.fetch, now: at(1_000) });
  assert.equal(first.calls.length, 1);

  // The name was taken in the meantime; a fresh read must see it.
  const taken = fakeFetch({ results: [{ domain: FREE, available: false }] });
  const fresh = await searchDomains([FREE], { fetch: taken.fetch, now: at(2_000), maxAgeMs: 0 });
  assert.equal(taken.calls.length, 1);
  assert.deepEqual(fresh, [{ name: FREE, available: false }]);

  // A default reader right after is served that fresh answer from the cache.
  const later = fakeFetch();
  assert.deepEqual(await searchDomains([FREE], { fetch: later.fetch, now: at(3_000) }), [
    { name: FREE, available: false },
  ]);
  assert.equal(later.calls.length, 0);
});

test("maxAgeMs narrows how old a cached answer may be", async () => {
  clearDomainSearchCache();
  const { fetch, calls } = fakeFetch();
  await searchDomains([FREE], { fetch, now: at(1_000) });
  await searchDomains([FREE], { fetch, now: at(1_000 + 9_000), maxAgeMs: 10_000 });
  assert.equal(calls.length, 1);
  await searchDomains([FREE], { fetch, now: at(1_000 + 10_000), maxAgeMs: 10_000 });
  assert.equal(calls.length, 2);
});

test("a failed search throws, and caches nothing", async () => {
  clearDomainSearchCache();
  const failing = fakeFetch({ error: { code: "internal_server_error" } }, 500);
  await assert.rejects(searchDomains([FREE], { fetch: failing.fetch, now: at(0) }), /^Error: domain-search:/);

  const unreachable = async () => {
    throw new TypeError("fetch failed");
  };
  await assert.rejects(searchDomains([FREE], { fetch: unreachable, now: at(0) }), /^Error: domain-search:/);

  const malformed = fakeFetch({ unexpected: true });
  await assert.rejects(searchDomains([FREE], { fetch: malformed.fetch, now: at(0) }), /^Error: domain-search:/);

  const working = fakeFetch();
  await searchDomains([FREE], { fetch: working.fetch, now: at(0) });
  assert.equal(working.calls.length, 1);
});

test("searchDomains deduplicates its input and refuses more than 200 names", async () => {
  clearDomainSearchCache();
  const { fetch, calls } = fakeFetch();

  const results = await searchDomains([FREE, "google.com", FREE, ` ${FREE.toUpperCase()} `], { fetch, now: at(0) });
  assert.deepEqual(results.map((r) => r.name), [FREE, "google.com"]);
  assert.deepEqual(calls[0].domains, [FREE, "google.com"]);

  assert.deepEqual(await searchDomains([], { fetch, now: at(0) }), []);
  assert.equal(calls.length, 1);

  const tooMany = Array.from({ length: 201 }, (_, i) => `name-${i}.com`);
  await assert.rejects(searchDomains(tooMany, { fetch, now: at(0) }), /^Error: domain-search:/);
  assert.equal(calls.length, 1);
});
