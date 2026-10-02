import assert from "node:assert/strict";
import test from "node:test";

import {
  DOMAIN_TLD,
  isValidLabel,
  normalizeLabel,
  suggestLabels,
  toDomainName,
} from "./custom-domain.ts";

test("normalizeLabel strips accents, lowercases and keeps only a-z, 0-9 and hyphens", () => {
  assert.equal(normalizeLabel("Hélène"), "helene");
  assert.equal(normalizeLabel("Joël & Zoé"), "joel-zoe");
  assert.equal(normalizeLabel("François_Noël"), "francois-noel");
  assert.equal(normalizeLabel("  Sophie   et   Pierre  "), "sophie-et-pierre");
  assert.equal(normalizeLabel("Mariage 2027!"), "mariage-2027");
});

test("normalizeLabel turns both apostrophes into hyphens", () => {
  assert.equal(normalizeLabel("D'Artagnan"), "d-artagnan");
  assert.equal(normalizeLabel("D’Artagnan"), "d-artagnan");
});

test("normalizeLabel transliterates the letters NFKD does not decompose", () => {
  assert.equal(normalizeLabel("Lætitia"), "laetitia");
  assert.equal(normalizeLabel("Cœur"), "coeur");
  assert.equal(normalizeLabel("ÆSOP Œuvre"), "aesop-oeuvre");
  assert.equal(normalizeLabel("Strauß"), "strauss");
  assert.equal(normalizeLabel("Søren"), "soren");
  assert.equal(normalizeLabel("Łukasz"), "lukasz");
  assert.equal(normalizeLabel("Đorđe"), "dorde");
  assert.equal(normalizeLabel("Þóra"), "thora");
  assert.equal(normalizeLabel("Yıldız"), "yildiz");
});

test("normalizeLabel decomposes ligatures and full-width letters", () => {
  assert.equal(normalizeLabel("ﬁona"), "fiona");
  assert.equal(normalizeLabel("Ｓｏｐｈｉｅ"), "sophie");
});

test("normalizeLabel turns Unicode dashes and dots into hyphens", () => {
  assert.equal(normalizeLabel("Anne‑Sophie"), "anne-sophie");
  assert.equal(normalizeLabel("Anne–Marie"), "anne-marie");
  assert.equal(normalizeLabel("Anne‐Marie―Lou"), "anne-marie-lou");
  assert.equal(normalizeLabel("Sophie.Pierre"), "sophie-pierre");
});

test("normalizeLabel strips what a couple pastes around the label", () => {
  assert.equal(normalizeLabel("sophie-et-pierre.com"), "sophie-et-pierre");
  assert.equal(normalizeLabel("www.sophie-et-pierre.com"), "sophie-et-pierre");
  assert.equal(normalizeLabel("https://sophie.fr"), "sophie");
  assert.equal(normalizeLabel("HTTP://WWW.Sophie-Pierre.COM"), "sophie-pierre");
  assert.equal(normalizeLabel("Sophie-et-Pierre.com"), "sophie-et-pierre");
  assert.equal(normalizeLabel("  sophie.com  "), "sophie");
  // Copied from the address bar, with its trailing slash.
  assert.equal(normalizeLabel("https://sophie-et-pierre.com/"), "sophie-et-pierre");
});

test("normalizeLabel strips a trailing TLD only when it is a known one, in any case", () => {
  assert.equal(normalizeLabel("Sophie.FR"), "sophie");
  assert.equal(normalizeLabel("sophie-et-pierre.Com"), "sophie-et-pierre");
  assert.equal(normalizeLabel("sophie-et-pierre.wedding"), "sophie-et-pierre");
  // Two first names joined by a dot, whatever their case: not a TLD.
  assert.equal(normalizeLabel("sophie.pierre"), "sophie-pierre");
  assert.equal(normalizeLabel("SOPHIE.PIERRE"), "sophie-pierre");
  // Only the last segment is looked at, and only once.
  assert.equal(normalizeLabel("sophie.com.pierre"), "sophie-com-pierre");
});

test("normalizeLabel collapses and trims hyphens", () => {
  assert.equal(normalizeLabel("--sophie---pierre--"), "sophie-pierre");
  assert.equal(normalizeLabel("- ' _"), "");
});

test("normalizeLabel leaves nothing of a name without Latin letters", () => {
  assert.equal(normalizeLabel("سارة"), "");
  assert.equal(normalizeLabel("李"), "");
});

test("isValidLabel wants 3 to 63 characters of an already normalised label", () => {
  assert.equal(isValidLabel("abc"), true);
  assert.equal(isValidLabel("sophie-et-pierre"), true);
  assert.equal(isValidLabel("a".repeat(63)), true);
  assert.equal(isValidLabel("ab"), false);
  assert.equal(isValidLabel("a".repeat(64)), false);
  assert.equal(isValidLabel(""), false);
  assert.equal(isValidLabel("-abc"), false);
  assert.equal(isValidLabel("abc-"), false);
  // Not normalised: the couple must see, and buy, the name exactly as stored.
  assert.equal(isValidLabel("Sophie"), false);
  assert.equal(isValidLabel("so--phie"), false);
  assert.equal(isValidLabel("xn--abc"), false);
  assert.equal(isValidLabel("sophie.com"), false);
});

test("toDomainName appends the one TLD the studio sells", () => {
  assert.equal(DOMAIN_TLD, "com");
  assert.equal(toDomainName("sophie-et-pierre"), "sophie-et-pierre.com");
});

test("suggestLabels builds the alternatives from each partner's first word", () => {
  assert.deepEqual(
    suggestLabels({ partner1: "Sophie Martin", partner2: "Pierre", connector: "et", year: "2027" }),
    [
      "sophie-et-pierre",
      "sophie-et-pierre-2027",
      "mariage-sophie-pierre",
      "sophiepierre",
      "sophie-pierre",
    ],
  );
});

test("suggestLabels strips accents and handles apostrophes", () => {
  assert.deepEqual(
    suggestLabels({ partner1: "Hélène", partner2: "Joël Dupont", connector: "et", year: 2028 }),
    ["helene-et-joel", "helene-et-joel-2028", "mariage-helene-joel", "helenejoel", "helene-joel"],
  );
  assert.deepEqual(
    suggestLabels({ partner1: "D’Artagnan", partner2: "Constance", connector: "and", year: "2027" })[0],
    "d-artagnan-and-constance",
  );
});

test("suggestLabels transliterates the partners' names", () => {
  assert.equal(
    suggestLabels({ partner1: "Lætitia", partner2: "Benoît", connector: "et", year: "2027" })[0],
    "laetitia-et-benoit",
  );
});

test("suggestLabels gives nothing when a name has no Latin letters", () => {
  assert.deepEqual(
    suggestLabels({ partner1: "سارة", partner2: "أحمد", connector: "و", year: "2027" }),
    [],
  );
  assert.deepEqual(
    suggestLabels({ partner1: "Sophie", partner2: "李", connector: "et", year: "2027" }),
    [],
  );
  assert.deepEqual(suggestLabels({ partner1: "", partner2: "Pierre", connector: "et", year: "" }), []);
});

test("suggestLabels returns only valid labels, whatever the length of the names", () => {
  const long = "a".repeat(70);
  const fromLong = suggestLabels({ partner1: long, partner2: "Pierre", connector: "et", year: "2027" });
  assert.deepEqual(fromLong, []);

  // 28 + 28 letters: the joined forms fit, the longer ones do not.
  const a = "b".repeat(28);
  const b = "c".repeat(28);
  const mixed = suggestLabels({ partner1: a, partner2: b, connector: "et", year: "2027" });
  assert.deepEqual(mixed, [`${a}-et-${b}`, `${a}${b}`, `${a}-${b}`]);
  for (const label of mixed) assert.equal(isValidLabel(label), true, label);
});

test("suggestLabels removes duplicates, keeping the first", () => {
  // No year and a connector that normalises to nothing: three forms collapse.
  assert.deepEqual(
    suggestLabels({ partner1: "Sophie", partner2: "Pierre", connector: "و", year: "" }),
    ["sophie-pierre", "mariage-sophie-pierre", "sophiepierre"],
  );
  assert.deepEqual(
    suggestLabels({ partner1: "Sophie", partner2: "Pierre", connector: "et" }),
    ["sophie-et-pierre", "mariage-sophie-pierre", "sophiepierre", "sophie-pierre"],
  );
});
