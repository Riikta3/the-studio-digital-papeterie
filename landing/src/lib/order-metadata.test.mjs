import assert from "node:assert/strict";
import test from "node:test";

import {
  SERVER_WRITTEN_KEYS,
  buildOrderMetadata,
  domainFromIntentMetadata,
  metadataForUpdate,
  parseOrderMetadata,
} from "./order-metadata.ts";

const ORDER = {
  plan: "signature",
  modules: ["rsvp", "gallery"],
  languages: ["fr", "en"],
  extras: ["custom-domain"],
  email: "sophie@example.com",
  themeId: "ciao-amore",
  firstName: "Sophie",
  partnerName: "Pierre",
  weddingDate: "2027-12-04",
  locale: "fr",
};

/** What Stripe hands back: the metadata on an intent. */
const intentWith = (metadata) => ({ metadata, receipt_email: null });

test("the domain's name and years survive the round trip through the intent", () => {
  const metadata = buildOrderMetadata({
    ...ORDER,
    domainName: "sophie-et-pierre.com",
    domainYears: 2,
  });
  assert.equal(metadata.domain_name, "sophie-et-pierre.com");
  assert.equal(metadata.domain_years, "2");

  const order = parseOrderMetadata(intentWith(metadata));
  assert.equal(order.domainName, "sophie-et-pierre.com");
  assert.equal(order.domainYears, 2);
  assert.deepEqual(order.extras, ["custom-domain"]);
  assert.equal(order.firstName, "Sophie");
});

test("an order without a domain writes no domain key and reads none back", () => {
  const metadata = buildOrderMetadata({ ...ORDER, extras: [] });
  assert.equal("domain_name" in metadata, false);
  assert.equal("domain_years" in metadata, false);

  const order = parseOrderMetadata(intentWith(metadata));
  assert.equal(order.domainName, undefined);
  assert.equal(order.domainYears, undefined);
});

test("« plus tard » writes the years but no name", () => {
  const metadata = buildOrderMetadata({ ...ORDER, domainYears: 1 });
  assert.equal("domain_name" in metadata, false);
  assert.equal(metadata.domain_years, "1");
  assert.equal(parseOrderMetadata(intentWith(metadata)).domainYears, 1);
});

test("years that are not a number of years the registry sells are not written", () => {
  for (const domainYears of [0, 11, 2.5, Number.NaN]) {
    const metadata = buildOrderMetadata({ ...ORDER, domainYears });
    assert.equal("domain_years" in metadata, false, String(domainYears));
  }
});

test("metadataForUpdate clears a name the couple swapped for « plus tard »", () => {
  const existing = buildOrderMetadata({ ...ORDER, domainName: "sophie-et-pierre.com", domainYears: 2 });
  const next = buildOrderMetadata({ ...ORDER, domainYears: 2 });

  const update = metadataForUpdate(existing, next);
  // Stripe deletes a key set to an empty string; omitting it would keep it.
  assert.equal(update.domain_name, "");
  assert.equal(update.domain_years, "2");
  for (const [key, value] of Object.entries(next)) assert.equal(update[key], value, key);
});

test("metadataForUpdate clears every optional key the new order no longer has", () => {
  const existing = { ...buildOrderMetadata(ORDER), venue: "Domaine des Hauts Vents", adults_only: "1" };
  const next = buildOrderMetadata({ ...ORDER, extras: [] });

  const update = metadataForUpdate(existing, next);
  assert.equal(update.venue, "");
  assert.equal(update.adults_only, "");
  assert.equal(update.extras, "");
  assert.equal(update.plan, "signature");
});

test("metadataForUpdate spares the keys the server writes after creation", () => {
  assert.deepEqual([...SERVER_WRITTEN_KEYS].sort(), ["refunded_reason", "wedding_id"]);

  const existing = {
    ...buildOrderMetadata({ ...ORDER, domainName: "sophie-et-pierre.com", domainYears: 2 }),
    wedding_id: "6f1c0d2e-0000-4000-8000-000000000001",
    refunded_reason: "duplicate purchase",
  };
  const update = metadataForUpdate(existing, buildOrderMetadata({ ...ORDER, domainYears: 2 }));

  assert.equal("wedding_id" in update, false);
  assert.equal("refunded_reason" in update, false);
  assert.equal(update.domain_name, "");
});

test("metadataForUpdate returns the new metadata as is when nothing was dropped", () => {
  const next = buildOrderMetadata({ ...ORDER, domainName: "sophie-et-pierre.com", domainYears: 2 });
  assert.deepEqual(metadataForUpdate({}, next), next);
  assert.deepEqual(metadataForUpdate(next, next), next);
});

test("domainFromIntentMetadata reads the domain the intent was paid for", () => {
  const metadata = buildOrderMetadata({ ...ORDER, domainName: "sophie-et-pierre.com", domainYears: 2 });
  assert.deepEqual(domainFromIntentMetadata(metadata), {
    has: true,
    name: "sophie-et-pierre.com",
    years: 2,
  });

  // « plus tard »: paid for, no name yet.
  assert.deepEqual(domainFromIntentMetadata(buildOrderMetadata({ ...ORDER, domainYears: 3 })), {
    has: true,
    name: undefined,
    years: 3,
  });
});

test("domainFromIntentMetadata takes `has` from the intent's own extras", () => {
  const noDomain = buildOrderMetadata({ ...ORDER, extras: ["custom-music"] });
  assert.equal(domainFromIntentMetadata(noDomain).has, false);
  assert.equal(domainFromIntentMetadata({ extras: "custom-music,custom-domain" }).has, true);
  assert.equal(domainFromIntentMetadata({}).has, false);
  assert.equal(domainFromIntentMetadata(null).has, false);
});

test("domainFromIntentMetadata refuses tampered years and names", () => {
  const base = { extras: "custom-domain" };
  assert.equal(domainFromIntentMetadata({ ...base, domain_years: "99" }).years, 1);
  assert.equal(domainFromIntentMetadata({ ...base, domain_years: "2.5" }).years, 1);
  assert.equal(domainFromIntentMetadata({ ...base, domain_years: " 2" }).years, 1);
  assert.equal(domainFromIntentMetadata(base).years, 1);

  for (const domain_name of [
    "sophie-et-pierre.fr",
    "Sophie-et-Pierre.com",
    "so--phie.com",
    "xn--abc.com",
    "ab.com",
    "www.sophie.com",
    ".com",
    "sophie et pierre.com",
  ]) {
    assert.equal(domainFromIntentMetadata({ ...base, domain_name }).name, undefined, domain_name);
  }
});

test("parseOrderMetadata applies the same rules to the domain as provisioning", () => {
  const order = parseOrderMetadata(
    intentWith({
      ...buildOrderMetadata(ORDER),
      domain_name: "Sophie.com",
      domain_years: "99",
    }),
  );
  assert.equal(order.domainName, undefined);
  assert.equal(order.domainYears, undefined);
});
