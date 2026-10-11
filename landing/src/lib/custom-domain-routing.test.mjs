import assert from "node:assert/strict";
import test from "node:test";

import {
  CUSTOM_DOMAIN_NOT_FOUND_COPY,
  CUSTOM_DOMAIN_NOT_FOUND_HTML,
  CUSTOM_DOMAIN_UNAVAILABLE_COPY,
  CUSTOM_DOMAIN_UNAVAILABLE_HTML,
  createCustomDomainResolver,
  customDomainRequestHeaders,
  guestHref,
  isCoupleDomainChrome,
  isOwnHost,
  mapCustomDomainPath,
  normalizeHost,
  routeCustomDomain,
  toCustomDomainResolution,
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
const UNAVAILABLE = { kind: "unavailable" };

const LIVE = { kind: "live", slug: SLUG, languages: ["fr", "en"] };
const NOT_LIVE = { kind: "notLive" };
const UNKNOWN = { kind: "unknown" };
const ERROR = { kind: "error" };

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
  assert.equal(isOwnHost(normalizeHost("[::1]:3010"), SITE), true);
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
// toCustomDomainResolution — what `resolve_custom_domain` returned

test("no row from the resolver means a host that is not ours", () => {
  assert.deepEqual(toCustomDomainResolution([]), UNKNOWN);
  assert.deepEqual(toCustomDomainResolution(null), UNKNOWN);
  assert.deepEqual(toCustomDomainResolution(undefined), UNKNOWN);
});

test("a known domain that is not live keeps nothing but that", () => {
  assert.deepEqual(
    toCustomDomainResolution([{ live: false, slug: null, languages: null }]),
    NOT_LIVE,
  );
});

test("a live domain carries its slug and languages", () => {
  assert.deepEqual(
    toCustomDomainResolution([{ live: true, slug: SLUG, languages: ["fr", "en"] }]),
    LIVE,
  );
  assert.deepEqual(
    toCustomDomainResolution([{ live: true, slug: SLUG, languages: null }]),
    { kind: "live", slug: SLUG, languages: [] },
  );
});

test("a live answer without a slug cannot be served, so it is not live", () => {
  assert.deepEqual(
    toCustomDomainResolution([{ live: true, slug: null, languages: ["fr"] }]),
    NOT_LIVE,
  );
  assert.deepEqual(
    toCustomDomainResolution([{ live: true, slug: "", languages: ["fr"] }]),
    NOT_LIVE,
  );
});

// ---------------------------------------------------------------------------
// routeCustomDomain — the host decision once the lookup has answered

test("an unknown host falls through to the shop", () => {
  assert.equal(routeCustomDomain("/", UNKNOWN, COUPLE), null);
  assert.equal(routeCustomDomain("/studio", UNKNOWN, COUPLE), null);
});

test("a known domain that is not live is a 404 on every path", () => {
  assert.deepEqual(routeCustomDomain("/", NOT_LIVE, COUPLE), NOT_FOUND);
  assert.deepEqual(routeCustomDomain("/jourj", NOT_LIVE, COUPLE), NOT_FOUND);
});

test("a lookup that failed with nothing to fall back on is a 503, never the shop", () => {
  assert.deepEqual(routeCustomDomain("/", ERROR, COUPLE), UNAVAILABLE);
  assert.deepEqual(routeCustomDomain("/studio", ERROR, COUPLE), UNAVAILABLE);
});

test("a live domain is routed through the table with its own slug and languages", () => {
  const live = { kind: "live", slug: "lea-marc-z9", languages: ["en"] };
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

// ---------------------------------------------------------------------------
// The bare pages a couple's domain answers with

const NO_WAY_OUT = /<a\b|href=|<script|src=/i;

test("the couple's 404 is a standalone French page with no way into the shop", () => {
  assert.match(CUSTOM_DOMAIN_NOT_FOUND_HTML, /^<!doctype html>/i);
  assert.match(CUSTOM_DOMAIN_NOT_FOUND_HTML, /<html lang="fr">/);
  assert.match(CUSTOM_DOMAIN_NOT_FOUND_HTML, /name="robots" content="noindex"/);
  assert.doesNotMatch(CUSTOM_DOMAIN_NOT_FOUND_HTML, NO_WAY_OUT);
});

test("the proxy's 404 says what the app's bare 404 says, from one constant", () => {
  const { eyebrow, title } = CUSTOM_DOMAIN_NOT_FOUND_COPY;
  assert.equal(title, "Page introuvable");
  assert.match(CUSTOM_DOMAIN_NOT_FOUND_HTML, new RegExp(`<title>${title}</title>`));
  assert.match(CUSTOM_DOMAIN_NOT_FOUND_HTML, new RegExp(`<h1>${title}</h1>`));
  assert.match(CUSTOM_DOMAIN_NOT_FOUND_HTML, new RegExp(`<p>${eyebrow}</p>`));
});

test("the couple's 503 asks the guest to try again, with no way into the shop", () => {
  const { title, note } = CUSTOM_DOMAIN_UNAVAILABLE_COPY;
  assert.match(CUSTOM_DOMAIN_UNAVAILABLE_HTML, /^<!doctype html>/i);
  assert.match(CUSTOM_DOMAIN_UNAVAILABLE_HTML, /<html lang="fr">/);
  assert.match(CUSTOM_DOMAIN_UNAVAILABLE_HTML, /name="robots" content="noindex"/);
  assert.match(title, /^Un instant/);
  assert.match(note, /réessayez dans quelques secondes/i);
  assert.ok(CUSTOM_DOMAIN_UNAVAILABLE_HTML.includes(title));
  assert.ok(CUSTOM_DOMAIN_UNAVAILABLE_HTML.includes(note));
  assert.doesNotMatch(CUSTOM_DOMAIN_UNAVAILABLE_HTML, NO_WAY_OUT);
});

// ---------------------------------------------------------------------------
// isCoupleDomainChrome — what the app's 404s and layout decide from headers

test("a request the proxy stamped wears the couple's chrome, whatever its host", () => {
  const stamped = new Headers({ host: "localhost:3010", "x-custom-domain": "sophie-et-pierre.com" });
  assert.equal(isCoupleDomainChrome(stamped, SITE), true);
});

test("a host that is not ours wears the couple's chrome even unstamped", () => {
  // A path with a dot skips the proxy, so nothing stamps it.
  const unstamped = new Headers({ host: "Sophie-Et-Pierre.com:443" });
  assert.equal(isCoupleDomainChrome(unstamped, SITE), true);
});

test("our own hosts keep the shop's chrome", () => {
  for (const host of ["the-studio.digital", "www.the-studio.digital", "localhost:3010", "x.vercel.app"]) {
    assert.equal(isCoupleDomainChrome(new Headers({ host }), SITE), false, host);
  }
  assert.equal(isCoupleDomainChrome(new Headers(), SITE), false);
});

// ---------------------------------------------------------------------------
// customDomainRequestHeaders — the rewrite's request headers

test("the rewrite keeps the incoming headers and sets the four of D6", () => {
  const incoming = new Headers({
    cookie: "guest=1",
    "user-agent": "Mobile Safari",
    "x-pathname": "/",
    "X-NEXT-INTL-LOCALE": "fr",
  });

  const headers = customDomainRequestHeaders(incoming, {
    host: "sophie-et-pierre.com",
    locale: "en",
    rewrittenPath: `/en/invitation/${SLUG}`,
    base: "/en",
  });

  assert.equal(headers.get("cookie"), "guest=1");
  assert.equal(headers.get("user-agent"), "Mobile Safari");
  assert.equal(headers.get("x-next-intl-locale"), "en");
  assert.equal(headers.get("x-pathname"), `/en/invitation/${SLUG}`);
  assert.equal(headers.get("x-custom-domain"), "sophie-et-pierre.com");
  assert.equal(headers.get("x-custom-domain-base"), "/en");
  // A copy: the request's own headers are left as they were.
  assert.equal(incoming.get("x-pathname"), "/");
  assert.equal(incoming.get("x-custom-domain"), null);
});

test("the first language's base is set, as an empty string", () => {
  const headers = customDomainRequestHeaders(new Headers(), {
    host: "sophie-et-pierre.com",
    locale: "fr",
    rewrittenPath: `/fr/invitation/${SLUG}`,
    base: "",
  });
  assert.equal(headers.get("x-custom-domain-base"), "");
  assert.equal(headers.has("x-custom-domain-base"), true);
});

// ---------------------------------------------------------------------------
// createCustomDomainResolver — the proxy's cached `resolve_custom_domain`

const LIVE_ROW = [{ live: true, slug: SLUG, languages: ["fr", "en"] }];
const NOT_LIVE_ROW = [{ live: false, slug: null, languages: null }];

/**
 * A resolver on a fake clock. `answers[host]` is what the rpc returns for it:
 * rows, an `Error` to throw, `{ error }` for PostgREST's own error shape, or
 * `"hang"` for a call that never settles. `calls` lists the hosts looked up.
 */
function fakeResolver(answers, options = {}) {
  const clock = { t: 0 };
  const calls = [];
  const signals = [];
  const errors = [];
  const resolver = createCustomDomainResolver({
    rpc: async (host, signal) => {
      calls.push(host);
      signals.push(signal);
      const answer = answers[host];
      if (answer === "hang") return new Promise(() => {});
      if (answer instanceof Error) throw answer;
      if (answer && !Array.isArray(answer) && "error" in answer) return { data: null, error: answer.error };
      return { data: answer ?? [], error: null };
    },
    now: () => clock.t,
    max: 1_000,
    liveTtlMs: 60_000,
    otherTtlMs: 10_000,
    timeoutMs: 3_000,
    onError: (host, error) => errors.push([host, error]),
    ...options,
  });
  return { resolver, clock, calls, signals, errors };
}

test("the lookup's answers come back as live, notLive and unknown", async () => {
  const { resolver } = fakeResolver({
    "live.com": LIVE_ROW,
    "queued.com": NOT_LIVE_ROW,
  });
  assert.deepEqual(await resolver.resolve("live.com"), LIVE);
  assert.deepEqual(await resolver.resolve("queued.com"), NOT_LIVE);
  assert.deepEqual(await resolver.resolve("nobody.com"), UNKNOWN);
});

test("a live answer is kept 60 s", async () => {
  const { resolver, clock, calls } = fakeResolver({ "live.com": LIVE_ROW });
  await resolver.resolve("live.com");
  clock.t = 59_999;
  await resolver.resolve("live.com");
  assert.deepEqual(calls, ["live.com"]);
  clock.t = 60_000;
  await resolver.resolve("live.com");
  assert.deepEqual(calls, ["live.com", "live.com"]);
});

test("any other answer is kept 10 s, so a domain that just went live shows within seconds", async () => {
  const answers = { "queued.com": NOT_LIVE_ROW };
  const { resolver, clock, calls } = fakeResolver(answers);

  assert.deepEqual(await resolver.resolve("queued.com"), NOT_LIVE);
  assert.deepEqual(await resolver.resolve("nobody.com"), UNKNOWN);
  clock.t = 9_999;
  await resolver.resolve("queued.com");
  await resolver.resolve("nobody.com");
  assert.deepEqual(calls, ["queued.com", "nobody.com"]);

  answers["queued.com"] = LIVE_ROW;
  clock.t = 10_000;
  assert.deepEqual(await resolver.resolve("queued.com"), LIVE);
  await resolver.resolve("nobody.com");
  assert.deepEqual(calls, ["queued.com", "nobody.com", "queued.com", "nobody.com"]);
});

test("a failed lookup serves the last answer, stale or not, and retries 10 s later", async () => {
  const answers = { "live.com": LIVE_ROW };
  const { resolver, clock, calls, errors } = fakeResolver(answers);
  await resolver.resolve("live.com");

  answers["live.com"] = new Error("connection refused");
  clock.t = 61_000;
  assert.deepEqual(await resolver.resolve("live.com"), LIVE);
  assert.equal(errors.length, 1);
  assert.equal(errors[0][0], "live.com");

  // An outage costs one query per host per ten seconds, not one per request.
  clock.t = 70_999;
  assert.deepEqual(await resolver.resolve("live.com"), LIVE);
  assert.equal(calls.length, 2);

  // And the stale answer survives a second failure.
  clock.t = 71_000;
  assert.deepEqual(await resolver.resolve("live.com"), LIVE);
  assert.equal(calls.length, 3);
});

test("PostgREST's own error shape counts as a failure", async () => {
  const { resolver, errors } = fakeResolver({
    "live.com": { error: { code: "42501", message: "permission denied" } },
  });
  assert.deepEqual(await resolver.resolve("live.com"), ERROR);
  assert.equal(errors.length, 1);
});

test("a failed lookup with nothing cached is an error, kept 10 s", async () => {
  const answers = { "live.com": new Error("timeout") };
  const { resolver, clock, calls } = fakeResolver(answers);

  assert.deepEqual(await resolver.resolve("live.com"), ERROR);
  clock.t = 9_999;
  assert.deepEqual(await resolver.resolve("live.com"), ERROR);
  assert.deepEqual(calls, ["live.com"]);

  answers["live.com"] = LIVE_ROW;
  clock.t = 10_000;
  assert.deepEqual(await resolver.resolve("live.com"), LIVE);
});

test("a lookup that hangs is given up after the timeout, and its call aborted", async () => {
  const { resolver, signals } = fakeResolver({ "slow.com": "hang" }, { timeoutMs: 20 });
  const started = Date.now();
  assert.deepEqual(await resolver.resolve("slow.com"), ERROR);
  assert.ok(Date.now() - started < 1_000);
  assert.equal(signals[0].aborted, true);
});

test("a hit refreshes a host, and the least recently used goes when full", async () => {
  const { resolver, calls } = fakeResolver(
    { "a.com": LIVE_ROW, "b.com": LIVE_ROW, "c.com": LIVE_ROW },
    { max: 2 },
  );
  await resolver.resolve("a.com");
  await resolver.resolve("b.com");
  await resolver.resolve("a.com"); // hit: b is now the least recently used
  await resolver.resolve("c.com"); // full: b goes
  assert.deepEqual(calls, ["a.com", "b.com", "c.com"]);

  await resolver.resolve("a.com");
  assert.deepEqual(calls, ["a.com", "b.com", "c.com"], "a was kept");
  await resolver.resolve("b.com");
  assert.deepEqual(calls, ["a.com", "b.com", "c.com", "b.com"], "b was evicted");
});

test("expired entries go before the least recently used", async () => {
  const { resolver, clock, calls } = fakeResolver(
    { "a.com": LIVE_ROW, "b.com": NOT_LIVE_ROW, "c.com": LIVE_ROW },
    { max: 2 },
  );
  await resolver.resolve("a.com"); // kept 60 s, least recently used
  await resolver.resolve("b.com"); // kept 10 s
  clock.t = 11_000;
  await resolver.resolve("c.com"); // full: b has expired, so b goes, not a

  await resolver.resolve("a.com");
  assert.deepEqual(calls, ["a.com", "b.com", "c.com"], "a was kept");
});
