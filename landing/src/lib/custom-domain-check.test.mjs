import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_ALTERNATIVES,
  alternativeCandidates,
  checkDomain,
  clientIp,
  createRateLimiter,
  parseCheckRequest,
} from "./custom-domain-check.ts";

const SOPHIE = { partner1: "Sophie Martin", partner2: "Pierre", connector: "et", year: "2027" };

/** A fake `searchDomains`: every `.com` is free unless listed. */
function fakeSearch(unavailable = {}) {
  const calls = [];
  const search = async (names) => {
    calls.push(names);
    return names.map((name) =>
      name in unavailable ? { name, available: false, reason: unavailable[name] } : { name, available: true, priceUsd: 11 },
    );
  };
  return { search, calls };
}

/** A fake `custom_domain_name_taken`: true for the names our couples hold. */
function fakeOurRows(held = [], error = null) {
  const asked = [];
  const nameTaken = async (name) => {
    asked.push(name);
    return error ? { data: null, error } : { data: held.includes(name), error: null };
  };
  return { nameTaken, asked };
}

test("parseCheckRequest normalises the label and refuses what cannot be bought", () => {
  assert.equal(parseCheckRequest({ label: "https://www.Sophie-et-Pierre.com/" }).label, "sophie-et-pierre");
  assert.equal(parseCheckRequest({ label: "Lætitia & Benoît" }).label, "laetitia-benoit");
  assert.equal(parseCheckRequest({ label: "ab" }), null);
  assert.equal(parseCheckRequest({ label: "ليلى" }), null); // no Latin letters at all
  assert.equal(parseCheckRequest({ label: 42 }), null);
  assert.equal(parseCheckRequest({}), null);
  assert.equal(parseCheckRequest(null), null);
  assert.equal(parseCheckRequest({ label: "a".repeat(201) }), null);
});

test("parseCheckRequest keeps the optional names and drops a year that is not one", () => {
  const request = parseCheckRequest({ label: "google", ...SOPHIE });
  assert.deepEqual(request, { label: "google", partner1: "Sophie Martin", partner2: "Pierre", connector: "et", year: "2027" });
  assert.equal(parseCheckRequest({ label: "google", year: "27" }).year, "");
  assert.equal(parseCheckRequest({ label: "google", partner1: 7 }).partner1, "");
});

test("alternatives: the couple's names first, then the label's own, never the label", () => {
  const request = parseCheckRequest({ label: "sophie-et-pierre", ...SOPHIE });
  // `sophie-et-pierre-2027` comes from both lists and is kept once.
  assert.deepEqual(alternativeCandidates(request), [
    "sophie-et-pierre-2027",
    "mariage-sophie-pierre",
    "sophiepierre",
    "sophie-pierre",
    "mariage-sophie-et-pierre",
  ]);
});

test("alternatives without names are built on the label alone", () => {
  assert.deepEqual(alternativeCandidates(parseCheckRequest({ label: "google", year: "2027" })), [
    "google-2027",
    "mariage-google",
  ]);
  assert.deepEqual(alternativeCandidates(parseCheckRequest({ label: "google" })), ["mariage-google"]);
});

test("a connector without Latin letters drops out of the suggestion", () => {
  const ar = parseCheckRequest({ label: "google", partner1: "Sophie", partner2: "Pierre", connector: "و", year: "2027" });
  assert.equal(alternativeCandidates(ar)[0], "sophie-pierre");
  for (const connector of ["和", "と"]) {
    const request = parseCheckRequest({ label: "google", partner1: "Sophie", partner2: "Pierre", connector });
    assert.ok(alternativeCandidates(request).every((label) => !label.includes("--")));
  }
});

test("a free name: one search for every candidate, then our rows for that name", async () => {
  const { search, calls } = fakeSearch();
  const { nameTaken, asked } = fakeOurRows();
  const answer = await checkDomain(parseCheckRequest({ label: "sophie-et-pierre", ...SOPHIE }), { search, nameTaken });

  assert.deepEqual(answer, {
    status: 200,
    body: { name: "sophie-et-pierre.com", available: true, reason: null, alternatives: [] },
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], "sophie-et-pierre.com");
  assert.ok(calls[0].length > 1, "the alternatives ride along in the same call");
  assert.deepEqual(asked, ["sophie-et-pierre.com"]);
});

test("a taken name offers at most three free alternatives, in order", async () => {
  const { search } = fakeSearch({ "google.com": "taken", "sophie-et-pierre-2027.com": "taken" });
  const { nameTaken } = fakeOurRows(["mariage-sophie-pierre.com"]);
  const answer = await checkDomain(parseCheckRequest({ label: "google", ...SOPHIE }), { search, nameTaken });

  assert.equal(answer.status, 200);
  assert.equal(answer.body.available, false);
  assert.equal(answer.body.reason, "taken");
  assert.deepEqual(answer.body.alternatives, ["sophie-et-pierre.com", "sophiepierre.com", "sophie-pierre.com"]);
  assert.ok(answer.body.alternatives.length <= MAX_ALTERNATIVES);
});

test("a name Vercel calls free but one of our couples holds is taken", async () => {
  const { search } = fakeSearch();
  const { nameTaken } = fakeOurRows(["sophie-et-pierre.com"]);
  const answer = await checkDomain(parseCheckRequest({ label: "sophie-et-pierre", ...SOPHIE }), { search, nameTaken });

  assert.equal(answer.body.available, false);
  assert.equal(answer.body.reason, "taken");
  assert.equal(answer.body.alternatives[0], "sophie-et-pierre-2027.com");
});

test("premium and inconclusive answers keep Vercel's reason", async () => {
  const premium = await checkDomain(parseCheckRequest({ label: "love" }), {
    search: fakeSearch({ "love.com": "premium" }).search,
    nameTaken: fakeOurRows().nameTaken,
  });
  assert.equal(premium.body.reason, "premium");

  // The name left out of the answer altogether.
  const missing = await checkDomain(parseCheckRequest({ label: "sophie" }), {
    search: async () => [],
    nameTaken: fakeOurRows().nameTaken,
  });
  assert.deepEqual(missing.body, { name: "sophie.com", available: false, reason: "unknown", alternatives: [] });
});

test("a search failure or a failed lookup of our rows is a 503, never « disponible »", async () => {
  const down = await checkDomain(parseCheckRequest({ label: "sophie-et-pierre" }), {
    search: async () => {
      throw new Error("domain-search: HTTP 502");
    },
    nameTaken: fakeOurRows().nameTaken,
  });
  assert.deepEqual(down, { status: 503, body: { error: "Vérification indisponible" } });

  const rowsDown = await checkDomain(parseCheckRequest({ label: "sophie-et-pierre" }), {
    search: fakeSearch().search,
    nameTaken: fakeOurRows([], { message: "boom" }).nameTaken,
  });
  assert.equal(rowsDown.status, 503);
});

test("the rate limiter lets `limit` requests through per window, per key", () => {
  let now = 0;
  const limiter = createRateLimiter({ limit: 3, windowMs: 60_000, now: () => now });
  assert.equal(limiter.hit("a"), null);
  assert.equal(limiter.hit("a"), null);
  assert.equal(limiter.hit("a"), null);
  assert.equal(limiter.hit("a"), 60);
  assert.equal(limiter.hit("b"), null, "another client has its own window");
  now = 30_000;
  assert.equal(limiter.hit("a"), 30);
  now = 60_000;
  assert.equal(limiter.hit("a"), null, "a new window starts");
});

test("the rate limiter's map stays bounded", () => {
  let now = 0;
  const limiter = createRateLimiter({ limit: 1, windowMs: 1_000, maxKeys: 2, now: () => now });
  limiter.hit("a");
  limiter.hit("b");
  now = 2_000;
  assert.equal(limiter.hit("c"), null);
  assert.equal(limiter.hit("a"), null, "expired windows were swept");
});

test("clientIp reads the first forwarded address", () => {
  assert.equal(clientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" })), "1.2.3.4");
  assert.equal(clientIp(new Headers({ "x-real-ip": "5.6.7.8" })), "5.6.7.8");
  assert.equal(clientIp(new Headers()), "unknown");
});
