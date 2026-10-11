import assert from "node:assert/strict";
import test from "node:test";

import { planDomainForCheckout, refuseDomainBeforePayment } from "./checkout-domain.ts";

const NOW = new Date("2026-10-02T10:00:00Z");
const WITH_DOMAIN = ["custom-music", "custom-domain"];

test("no domain in the extras: nothing to plan, whatever the browser sent", () => {
  assert.deepEqual(
    planDomainForCheckout({ extras: ["custom-music"], domain: { label: "sophie" }, weddingDate: "2027-12-04", now: NOW }),
    { wanted: false },
  );
  assert.deepEqual(planDomainForCheckout({ extras: undefined, domain: undefined, weddingDate: undefined, now: NOW }), {
    wanted: false,
  });
  // A hand-made request: extras is not a list.
  assert.deepEqual(planDomainForCheckout({ extras: "custom-domain", domain: undefined, weddingDate: undefined, now: NOW }), {
    wanted: false,
  });
});

test("the years come from the wedding date and the server's today", () => {
  // 14 months ahead: the domain must run until 17 months from now.
  assert.equal(planDomainForCheckout({ extras: WITH_DOMAIN, weddingDate: "2027-12-04", now: NOW }).years, 2);
  // Exactly 9 months ahead is still one year.
  assert.equal(planDomainForCheckout({ extras: WITH_DOMAIN, weddingDate: "2027-07-02", now: NOW }).years, 1);
  // No date, or one that does not exist: one year.
  assert.equal(planDomainForCheckout({ extras: WITH_DOMAIN, weddingDate: undefined, now: NOW }).years, 1);
  assert.equal(planDomainForCheckout({ extras: WITH_DOMAIN, weddingDate: "2027-04-31", now: NOW }).years, 1);
});

test("a label is normalised into the name the studio will buy", () => {
  assert.deepEqual(
    planDomainForCheckout({
      extras: WITH_DOMAIN,
      domain: { label: "Sophie et Pierre" },
      weddingDate: "2027-12-04",
      now: NOW,
    }),
    { wanted: true, years: 2, name: "sophie-et-pierre.com" },
  );
  assert.equal(
    planDomainForCheckout({ extras: WITH_DOMAIN, domain: { label: "https://www.Hélène-Joël.com/" }, now: NOW }).name,
    "helene-joel.com",
  );
});

test("« plus tard », or no label at all, plans the domain without a name", () => {
  for (const domain of [
    { later: true },
    { later: true, label: "sophie-et-pierre" },
    { label: "" },
    { label: "   " },
    {},
    undefined,
    null,
  ]) {
    assert.deepEqual(
      planDomainForCheckout({ extras: WITH_DOMAIN, domain, weddingDate: "2027-12-04", now: NOW }),
      { wanted: true, years: 2 },
      JSON.stringify(domain),
    );
  }
});

test("a label that cannot be bought is flagged invalid, with the name it gave", () => {
  assert.deepEqual(planDomainForCheckout({ extras: WITH_DOMAIN, domain: { label: "ab" }, now: NOW }), {
    wanted: true,
    years: 1,
    name: "ab.com",
    invalid: true,
  });
  assert.equal(planDomainForCheckout({ extras: WITH_DOMAIN, domain: { label: "سارة" }, now: NOW }).invalid, true);
  assert.equal(
    planDomainForCheckout({ extras: WITH_DOMAIN, domain: { label: "a".repeat(64) }, now: NOW }).invalid,
    true,
  );
  // Normalising collapses the hyphens, so the punycode prefix cannot survive.
  assert.deepEqual(planDomainForCheckout({ extras: WITH_DOMAIN, domain: { label: "xn--abc" }, now: NOW }), {
    wanted: true,
    years: 1,
    name: "xn-abc.com",
  });
});

test("a label that is not a string is ignored rather than trusted", () => {
  assert.deepEqual(planDomainForCheckout({ extras: WITH_DOMAIN, domain: { label: 42 }, now: NOW }), {
    wanted: true,
    years: 1,
  });
});

// ── The check right before payment ──────────────────────────────────────────

const NAMED = { wanted: true, years: 2, name: "sophie-et-pierre.com" };

/** Lookups answering as told (a free name by default), recording which were asked. */
function lookups(answers = {}) {
  const ours = "ours" in answers ? answers.ours : { data: false, error: null };
  const search = "search" in answers ? answers.search : { available: true };
  const asked = [];
  return {
    asked,
    nameTaken: async (name) => {
      asked.push(["ours", name]);
      if (ours instanceof Error) throw ours;
      return ours;
    },
    searchName: async (name) => {
      asked.push(["vercel", name]);
      if (search instanceof Error) throw search;
      return search;
    },
  };
}

/** Runs `fn` with `console[level]` captured. */
async function capturing(level, fn) {
  const original = console[level];
  const logged = [];
  console[level] = (...args) => logged.push(args);
  try {
    return { result: await fn(), logged };
  } finally {
    console[level] = original;
  }
}

test("nothing to check without a name: no domain, or « plus tard »", async () => {
  for (const plan of [{ wanted: false }, { wanted: true, years: 2 }]) {
    const deps = lookups();
    assert.equal(await refuseDomainBeforePayment(plan, deps), null);
    assert.deepEqual(deps.asked, []);
  }
});

test("an invalid name is refused before asking anyone", async () => {
  const deps = lookups();
  assert.deepEqual(await refuseDomainBeforePayment({ ...NAMED, name: "ab.com", invalid: true }, deps), {
    status: 400,
    body: { error: "Nom de domaine invalide.", domainInvalid: true },
  });
  assert.deepEqual(deps.asked, []);
});

test("a free name passes both checks", async () => {
  const deps = lookups();
  assert.equal(await refuseDomainBeforePayment(NAMED, deps), null);
  assert.deepEqual(deps.asked, [
    ["ours", "sophie-et-pierre.com"],
    ["vercel", "sophie-et-pierre.com"],
  ]);
});

test("our own rows failing to answer refuses the payment: 503", async () => {
  for (const ours of [{ data: null, error: { message: "connection refused" } }, new Error("fetch failed")]) {
    const deps = lookups({ ours });
    const { result, logged } = await capturing("error", () => refuseDomainBeforePayment(NAMED, deps));
    assert.equal(result.status, 503);
    assert.match(result.body.error, /Impossible de vérifier le nom de domaine/);
    assert.equal(result.body.domainUnavailable, undefined);
    assert.equal(logged[0][0], "[DOMAIN_TAKEN_LOOKUP_FAILED]");
    // Never on to Vercel: the order is refused either way.
    assert.deepEqual(deps.asked, [["ours", "sophie-et-pierre.com"]]);
  }
});

test("a name another of our couples holds: 409, « vient d'être pris »", async () => {
  const deps = lookups({ ours: { data: true, error: null } });
  assert.deepEqual(await refuseDomainBeforePayment(NAMED, deps), {
    status: 409,
    body: { error: "Ce nom vient d'être pris. Choisissez-en un autre.", domainUnavailable: true },
  });
  assert.deepEqual(deps.asked, [["ours", "sophie-et-pierre.com"]]);
});

test("a name Vercel will not sell: 409, « n'est pas disponible »", async () => {
  // Registered elsewhere, premium or over the ceiling all read as unavailable.
  for (const search of [
    { available: false, reason: "taken" },
    { available: false, reason: "premium", priceUsd: 9.5 },
    { available: false, reason: "above_ceiling", priceUsd: 15.01 },
    { available: false, reason: "unsupported" },
    // An answer without a reason is still not a yes.
    { available: false },
  ]) {
    assert.deepEqual(await refuseDomainBeforePayment(NAMED, lookups({ search })), {
      status: 409,
      body: { error: "Ce nom n'est pas disponible. Choisissez-en un autre.", domainUnavailable: true },
    }, JSON.stringify(search));
  }
});

test("a search that cannot tell (name left out, malformed answer): the payment goes through, with a warning", async () => {
  // Like an unreachable search: refusing would turn a schema drift at Vercel
  // into « nom pris » for every couple, and the engine checks again anyway.
  for (const search of [{ available: false, reason: "unknown" }, undefined]) {
    const { result, logged } = await capturing("warn", () => refuseDomainBeforePayment(NAMED, lookups({ search })));
    assert.equal(result, null, JSON.stringify(search));
    assert.equal(logged.length, 1);
    assert.equal(logged[0][0], "[DOMAIN_SEARCH_INCONCLUSIVE]");
  }
});

test("Vercel's search unreachable: the payment goes through, with a warning", async () => {
  const deps = lookups({ search: new Error("domain-search: HTTP 502") });
  const { result, logged } = await capturing("warn", () => refuseDomainBeforePayment(NAMED, deps));
  assert.equal(result, null);
  assert.equal(logged.length, 1);
  assert.equal(logged[0][0], "[DOMAIN_SEARCH_UNREACHABLE]");
});
