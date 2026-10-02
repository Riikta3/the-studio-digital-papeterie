/**
 * Links a couple types, and whether they may be printed on a public page.
 *
 * Every link in the invitation editor — the venue's Maps and Waze links, a
 * hotel's booking page, the gift registry — ends up as an `href` on the page
 * guests open. A `javascript:` URL in one of them is script that runs in every
 * guest's browser, on our domain, the moment they tap "Voir sur Waze". So the
 * rule is the same on both sides of the product: only web links, ever.
 *
 * Two functions because the two sides want different things. The dashboard
 * receives what a person typed and should be forgiving about it — most people
 * paste `www.hotel.fr`, not `https://www.hotel.fr` — while the invitation only
 * ever re-checks a value that should already be clean, and must never "fix"
 * anything on its way to a guest.
 */

const WEB_PROTOCOLS = new Set(["http:", "https:"]);

/**
 * `value` if it is an absolute http(s) URL, else undefined.
 *
 * Strict on purpose: this is the last check before a link reaches a guest. It
 * accepts plain http because local development serves storage over it
 * (`http://127.0.0.1:54321/storage/…`).
 */
export function safeUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  try {
    return WEB_PROTOCOLS.has(new URL(trimmed).protocol) ? trimmed : undefined;
  } catch {
    return undefined;
  }
}

/** Something written like a scheme: `https:`, `mailto:`, `javascript:`. */
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/**
 * A host written without its scheme — `www.hotel.fr`, `hotel-du-lac.com/offre`.
 *
 * Needs a dot and a letters-only top-level label, so "pas un lien" and
 * "localhost" are not mistaken for one.
 */
const BARE_HOST =
  /^[\p{L}\p{N}-]+(\.[\p{L}\p{N}-]+)*\.\p{L}{2,}(:\d+)?([/?#].*)?$/u;

/**
 * What a couple typed, as a link that is safe to store — or undefined.
 *
 * A bare host gets `https://` in front of it. Anything that already names a
 * scheme is accepted only if the scheme is a web one, so `mailto:` and
 * `javascript:` are refused rather than "repaired".
 */
export function normaliseUserUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (HAS_SCHEME.test(trimmed)) return safeUrl(trimmed);
  if (BARE_HOST.test(trimmed)) return safeUrl(`https://${trimmed}`);

  return undefined;
}
