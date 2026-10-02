import assert from "node:assert/strict";
import test from "node:test";

import {
  guestHref,
  isOwnHost,
  mapCustomDomainPath,
  normalizeHost,
  routeCustomDomain,
} from "./custom-domain-routing.ts";

const LOCALES = ["fr", "en", "de", "es", "pt", "it", "ar", "zh", "ja"];
const SLUG = "sophie-pierre-k3x9";

/** A couple who bought French (their default), English and Arabic. */
const COUPLE = {
  slug: SLUG,
  languages: ["fr", "en", "ar"],
  locales: LOCALES,
  defaultLocale: "fr",
};

const map = (pathname, overrides = {}) =>
  mapCustomDomainPath(pathname, { ...COUPLE, ...overrides });

const rewrite = (path, locale, base) => ({ kind: "rewrite", path, locale, base });
const redirect = (path) => ({ kind: "redirect", path });
const NOT_FOUND = { kind: "notFound" };

// ---------------------------------------------------------------------------
// normalizeHost

test("a host is lowercased and loses its port and trailing dot", () => {
  assert.equal(normalizeHost("Sophie-Et-Pierre.COM"), "sophie-et-pierre.com");
  assert.equal(normalizeHost("sophie-et-pierre.com:443"), "sophie-et-pierre.com");
  assert.equal(normalizeHost("sophie-et-pierre.com."), "sophie-et-pierre.com");
  assert.equal(normalizeHost("WWW.Sophie-Et-Pierre.com.:8080"), "www.sophie-et-pierre.com");
  assert.equal(normalizeHost("  localhost:3010 "), "localhost");
});

test("a missing host normalises to an empty string", () => {
  assert.equal(normalizeHost(null), "");
  assert.equal(normalizeHost(undefined), "");
  assert.equal(normalizeHost(""), "");
});

// ---------------------------------------------------------------------------
// isOwnHost

const SITE = { siteUrl: "https://the-studio.digital" };

test("the shop's own host and its www twin are ours", () => {
  assert.equal(isOwnHost("the-studio.digital", SITE), true);
  assert.equal(isOwnHost("www.the-studio.digital", SITE), true);
});

test("a site URL written with www also covers the apex", () => {
  const site = { siteUrl: "https://www.the-studio.digital/" };
  assert.equal(isOwnHost("www.the-studio.digital", site), true);
  assert.equal(isOwnHost("the-studio.digital", site), true);
});

test("local and preview hosts are ours", () => {
  assert.equal(isOwnHost("localhost", SITE), true);
  assert.equal(isOwnHost("127.0.0.1", SITE), true);
  assert.equal(isOwnHost("the-studio-git-main-team.vercel.app", SITE), true);
});

test("an empty host is treated as ours, so it never costs a lookup", () => {
  assert.equal(isOwnHost("", SITE), true);
});

test("a couple's domain is not ours", () => {
  assert.equal(isOwnHost("sophie-et-pierre.com", SITE), false);
  assert.equal(isOwnHost("www.sophie-et-pierre.com", SITE), false);
});

test("look-alikes of our hosts are not ours", () => {
  assert.equal(isOwnHost("vercel.app", SITE), false);
  assert.equal(isOwnHost("evil-vercel.app", SITE), false);
  assert.equal(isOwnHost("the-studio.digital.evil.com", SITE), false);
  assert.equal(isOwnHost("www.www.the-studio.digital", SITE), false);
  assert.equal(isOwnHost("localhost.evil.com", SITE), false);
});

test("a missing or malformed site URL still recognises the fixed hosts", () => {
  assert.equal(isOwnHost("localhost", { siteUrl: undefined }), true);
  assert.equal(isOwnHost("x.vercel.app", { siteUrl: "not a url" }), true);
  assert.equal(isOwnHost("sophie-et-pierre.com", { siteUrl: undefined }), false);
});

// ---------------------------------------------------------------------------
// mapCustomDomainPath — D6's table

test("/ serves the invitation in the couple's first language", () => {
  assert.deepEqual(map("/"), rewrite(`/fr/invitation/${SLUG}`, "fr", ""));
  assert.deepEqual(
    map("/", { languages: ["en", "fr"] }),
    rewrite(`/en/invitation/${SLUG}`, "en", ""),
  );
});

test("an empty language list falls back to the default locale", () => {
  assert.deepEqual(
    map("/", { languages: [] }),
    rewrite(`/fr/invitation/${SLUG}`, "fr", ""),
  );
  assert.deepEqual(
    map("/en", { languages: [] }),
    redirect("/"),
  );
});

test("unsupported language codes are ignored", () => {
  assert.deepEqual(
    map("/", { languages: ["nl", "en"] }),
    rewrite(`/en/invitation/${SLUG}`, "en", ""),
  );
});

test("/{L} with L bought serves the invitation in L", () => {
  assert.deepEqual(map("/en"), rewrite(`/en/invitation/${SLUG}`, "en", "/en"));
  assert.deepEqual(map("/ar"), rewrite(`/ar/invitation/${SLUG}`, "ar", "/ar"));
});

test("the first language's own prefix serves it with an empty base", () => {
  assert.deepEqual(map("/fr"), rewrite(`/fr/invitation/${SLUG}`, "fr", ""));
});

test("a locale not bought redirects to the same path without it", () => {
  assert.deepEqual(map("/ja"), redirect("/"));
  assert.deepEqual(map("/de/"), redirect("/"));
  assert.deepEqual(map("/ja/jourj"), redirect("/jourj"));
  assert.deepEqual(map("/ja/jourj/menu"), redirect("/jourj/menu"));
});

test("a locale not bought on a path outside the table is a 404, not a hop", () => {
  assert.deepEqual(map("/ja/studio"), NOT_FOUND);
  assert.deepEqual(map("/ja/jourj/nope"), NOT_FOUND);
});

test("the Jour J home and its three pages", () => {
  assert.deepEqual(map("/jourj"), rewrite(`/fr/jourj/${SLUG}`, "fr", ""));
  assert.deepEqual(map("/jourj/ma-table"), rewrite(`/fr/jourj/${SLUG}/ma-table`, "fr", ""));
  assert.deepEqual(map("/jourj/menu"), rewrite(`/fr/jourj/${SLUG}/menu`, "fr", ""));
  assert.deepEqual(map("/jourj/photos"), rewrite(`/fr/jourj/${SLUG}/photos`, "fr", ""));
});

test("the Jour J under a bought locale prefix", () => {
  assert.deepEqual(map("/en/jourj"), rewrite(`/en/jourj/${SLUG}`, "en", "/en"));
  assert.deepEqual(map("/ar/jourj/menu"), rewrite(`/ar/jourj/${SLUG}/menu`, "ar", "/ar"));
  assert.deepEqual(map("/fr/jourj/photos"), rewrite(`/fr/jourj/${SLUG}/photos`, "fr", ""));
});

test("a trailing slash is tolerated", () => {
  assert.deepEqual(map("/en/"), rewrite(`/en/invitation/${SLUG}`, "en", "/en"));
  assert.deepEqual(map("/jourj/"), rewrite(`/fr/jourj/${SLUG}`, "fr", ""));
  assert.deepEqual(map("/jourj/menu/"), rewrite(`/fr/jourj/${SLUG}/menu`, "fr", ""));
});

test("the shop, the studio and the journal are not on a couple's domain", () => {
  for (const path of ["/studio", "/journal", "/journal/some-article", "/contact", "/en/studio", "/fr/coming-soon", "/sitemap-0.xml"]) {
    assert.deepEqual(map(path), NOT_FOUND, path);
  }
});

test("no invitation is reachable by its slug, not even the couple's own", () => {
  assert.deepEqual(map(`/invitation/${SLUG}`), NOT_FOUND);
  assert.deepEqual(map(`/fr/invitation/${SLUG}`), NOT_FOUND);
  assert.deepEqual(map("/invitation/another-couple-a1b2"), NOT_FOUND);
  assert.deepEqual(map("/invitation"), NOT_FOUND);
});

test("another couple's slug opens nothing", () => {
  assert.deepEqual(map("/jourj/another-couple-a1b2"), NOT_FOUND);
  assert.deepEqual(map("/jourj/another-couple-a1b2/menu"), NOT_FOUND);
  assert.deepEqual(map("/en/jourj/another-couple-a1b2/photos"), NOT_FOUND);
});

test("an unknown Jour J page or a deeper path is a 404", () => {
  assert.deepEqual(map("/jourj/nope"), NOT_FOUND);
  assert.deepEqual(map("/jourj/menu/extra"), NOT_FOUND);
  assert.deepEqual(map("/en/extra"), NOT_FOUND);
});

test("the couple's own slugged Jour J link redirects to its clean path", () => {
  // What a theme's next-intl Link produces from `dayOf.slug` on that domain.
  assert.deepEqual(map(`/fr/jourj/${SLUG}/photos`), redirect("/jourj/photos"));
  assert.deepEqual(map(`/jourj/${SLUG}`), redirect("/jourj"));
  assert.deepEqual(map(`/en/jourj/${SLUG}/ma-table`), redirect("/en/jourj/ma-table"));
  assert.deepEqual(map(`/ja/jourj/${SLUG}/menu`), redirect("/jourj/menu"));
  assert.deepEqual(map(`/jourj/${SLUG}/nope`), NOT_FOUND);
});

test("locale segments are matched exactly", () => {
  assert.deepEqual(map("/EN"), NOT_FOUND);
  assert.deepEqual(map("/JOURJ"), NOT_FOUND);
});

// ---------------------------------------------------------------------------
// routeCustomDomain — the host decision once the lookup has answered

test("an unknown host falls through to the shop", () => {
  assert.equal(routeCustomDomain("/", null, COUPLE), null);
  assert.equal(routeCustomDomain("/studio", null, COUPLE), null);
});

test("a known domain that is not live is a 404 on every path", () => {
  assert.deepEqual(routeCustomDomain("/", { live: false }, COUPLE), NOT_FOUND);
  assert.deepEqual(routeCustomDomain("/jourj", { live: false }, COUPLE), NOT_FOUND);
});

test("a live domain is routed through the table with its own slug and languages", () => {
  const live = { live: true, slug: "lea-marc-z9", languages: ["en"] };
  const options = { locales: LOCALES, defaultLocale: "fr" };

  assert.deepEqual(
    routeCustomDomain("/", live, options),
    rewrite("/en/invitation/lea-marc-z9", "en", ""),
  );
  assert.deepEqual(routeCustomDomain("/fr", live, options), redirect("/"));
  assert.deepEqual(routeCustomDomain("/studio", live, options), NOT_FOUND);
});

// ---------------------------------------------------------------------------
// guestHref

test("on a couple's domain the Jour J links are clean", () => {
  const custom = { slug: SLUG, base: "", custom: true };
  assert.equal(guestHref("", custom), "/jourj");
  assert.equal(guestHref("ma-table", custom), "/jourj/ma-table");
  assert.equal(guestHref("photos", { ...custom, base: "/en" }), "/en/jourj/photos");
});

test("on the generic link the Jour J links keep today's slugged paths", () => {
  const generic = { slug: SLUG, base: "", custom: false };
  assert.equal(guestHref("", generic), `/jourj/${SLUG}`);
  assert.equal(guestHref("menu", generic), `/jourj/${SLUG}/menu`);
  // The base only means something on a couple's domain.
  assert.equal(guestHref("menu", { ...generic, base: "/en" }), `/jourj/${SLUG}/menu`);
});
