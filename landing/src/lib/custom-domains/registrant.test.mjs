import assert from "node:assert/strict";
import test from "node:test";

import { registrantFromEnv, registrantProblems } from "./registrant.ts";

const ENV = {
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

test("a complete environment gives Vercel's contactInformation", () => {
  assert.deepEqual(registrantFromEnv(ENV), {
    firstName: "Camille",
    lastName: "Martin",
    email: "domaines@example.com",
    phone: "+33.612345678",
    address1: "1 rue de la Paix",
    city: "Paris",
    // ASCII: registries refuse anything else in a contact.
    state: "Ile-de-France",
    zip: "75002",
    country: "FR",
    companyName: "The Studio SAS",
  });
  assert.deepEqual(registrantProblems(ENV), []);
});

test("every field is transliterated to ASCII before it reaches Vercel", () => {
  const contact = registrantFromEnv({
    ...ENV,
    DOMAIN_REGISTRANT_FIRST_NAME: "Lætitia",
    DOMAIN_REGISTRANT_LAST_NAME: "Bœuf-Müller",
    COMPANY_LEGAL_NAME: "Œuvres & Æther Straße SARL",
    COMPANY_ADDRESS: "12 rue de l’Église",
    COMPANY_CITY: "Saint-Étienne",
    COMPANY_REGION: "Auvergne-Rhône-Alpes",
    COMPANY_POSTAL_CODE: "42000",
  });
  assert.equal(contact.firstName, "Laetitia");
  assert.equal(contact.lastName, "Boeuf-Muller");
  assert.equal(contact.companyName, "OEuvres & AEther Strasse SARL");
  assert.equal(contact.address1, "12 rue de l'Eglise");
  assert.equal(contact.city, "Saint-Etienne");
  assert.equal(contact.state, "Auvergne-Rhone-Alpes");
  for (const value of Object.values(contact)) assert.match(value, /^[\x20-\x7E]+$/, value);
});

test("a field that cannot be written in ASCII is refused, by name", () => {
  for (const [key, value] of [["COMPANY_CITY", "東京"], ["DOMAIN_REGISTRANT_LAST_NAME", "Ζαχαρίου"]]) {
    assert.equal(registrantFromEnv({ ...ENV, [key]: value }), null, value);
    assert.deepEqual(registrantProblems({ ...ENV, [key]: value }), [key], value);
  }
});

test("values are trimmed", () => {
  const contact = registrantFromEnv({ ...ENV, COMPANY_CITY: "  Paris  ", DOMAIN_REGISTRANT_FIRST_NAME: " Camille" });
  assert.equal(contact.city, "Paris");
  assert.equal(contact.firstName, "Camille");
});

test("any missing variable gives null, and is named", () => {
  for (const key of Object.keys(ENV)) {
    const rest = { ...ENV };
    delete rest[key];
    assert.equal(registrantFromEnv(rest), null, `${key} missing`);
    assert.equal(registrantFromEnv({ ...ENV, [key]: "   " }), null, `${key} blank`);
    assert.deepEqual(registrantProblems(rest), [key]);
  }
});

test("the phone must be E.164 as Vercel reads it", () => {
  for (const phone of ["+33612345678", "+33.612345678", "+1.4155550100", "+33 6 12 34 56 78", "+33-6-12-34-56-78"]) {
    assert.ok(registrantFromEnv({ ...ENV, COMPANY_PHONE: phone }), phone);
  }
  // Spaces and hyphens are formatting and are dropped; nothing else is.
  assert.equal(registrantFromEnv({ ...ENV, COMPANY_PHONE: "+33 6 12 34 56 78" }).phone, "+33612345678");
  for (const phone of ["0612345678", "33612345678", "+0612345678", "+33 (0)6 12 34 56 78", "+331234", "+3361234567890123", "+33..612345678"]) {
    assert.equal(registrantFromEnv({ ...ENV, COMPANY_PHONE: phone }), null, phone);
    assert.deepEqual(registrantProblems({ ...ENV, COMPANY_PHONE: phone }), ["COMPANY_PHONE"], phone);
  }
});

test("the country is ISO alpha-2, or a common name the invoice already prints", () => {
  // The invoice prints COMPANY_COUNTRY as is (landing/src/lib/company.ts), so
  // « France » stays valid there and is mapped here.
  for (const [value, iso] of [["FR", "FR"], ["fr", "FR"], ["France", "FR"], ["france ", "FR"], ["Belgique", "BE"], ["Suisse", "CH"], ["Luxembourg", "LU"], ["Monaco", "MC"]]) {
    assert.equal(registrantFromEnv({ ...ENV, COMPANY_COUNTRY: value })?.country, iso, value);
  }
  for (const value of ["FRA", "Frankreich", "F", "1A"]) {
    assert.equal(registrantFromEnv({ ...ENV, COMPANY_COUNTRY: value }), null, value);
    assert.deepEqual(registrantProblems({ ...ENV, COMPANY_COUNTRY: value }), ["COMPANY_COUNTRY"], value);
  }
});

test("the country must be a real ISO 3166-1 alpha-2 code: GB, not UK", () => {
  for (const value of ["GB", "gb", "US", "DE", "MC", "RE", "JP"]) {
    assert.equal(registrantFromEnv({ ...ENV, COMPANY_COUNTRY: value })?.country, value.toUpperCase(), value);
  }
  // Two letters are not enough: UK and EU are reserved, XX and ZZ assigned to nobody.
  for (const value of ["UK", "uk", "EU", "XX", "ZZ", "AA"]) {
    assert.equal(registrantFromEnv({ ...ENV, COMPANY_COUNTRY: value }), null, value);
    assert.deepEqual(registrantProblems({ ...ENV, COMPANY_COUNTRY: value }), ["COMPANY_COUNTRY"], value);
  }
});

test("the email must look like one", () => {
  assert.equal(registrantFromEnv({ ...ENV, COMPANY_DOMAINS_EMAIL: "domaines" }), null);
  assert.equal(registrantFromEnv({ ...ENV, COMPANY_DOMAINS_EMAIL: "a b@c.com" }), null);
});
