import { DOMAIN_TLD } from "./custom-domain";
import { DOMAIN_MAX_USD_PER_YEAR } from "./pricing";

/**
 * Whether `.com` names can be sold to a couple right now
 * (docs/superpowers/specs/2026-10-02-custom-domain-design.md, D3).
 *
 * Asks Vercel's public registrar search, which needs no token. Never call the
 * registrar's per-domain `…/{domain}/availability` endpoint instead: it
 * answered `true` for a `.fr`, a TLD Vercel does not even sell.
 *
 * "Available" here means the studio can sell it, which is narrower than the
 * registrar's own flag: the name must be a `.com`, free, not premium, and at
 * or under the per-year price the studio's 65 € covers. Anything the answer
 * does not vouch for is reported as not available.
 *
 * This is a hint for the couple, not a reservation: the purchase engine checks
 * the price again right before buying.
 */
export const DOMAIN_SEARCH_URL = "https://api.vercel.com/v1/registrar/domains/search";

/** The endpoint's own limit per request. */
const MAX_NAMES = 200;
/** The studio panel searches as the couple types; a name rarely changes hands within a minute. */
const CACHE_TTL_MS = 60_000;
/**
 * The checkout waits on this before taking payment. A search that hangs is
 * turned into an error the caller can decide to fail open on.
 */
const REQUEST_TIMEOUT_MS = 5_000;

const SOLD_SUFFIX = `.${DOMAIN_TLD}`;

export interface DomainAvailability {
  name: string;
  available: boolean;
  /** The registrar's first-year price, when it gave one — kept even when too high, for the logs. */
  priceUsd?: number;
}

export interface DomainSearchDeps {
  fetch?: typeof fetch;
  /** Milliseconds, for the cache. */
  now?: () => number;
  /**
   * How old, in milliseconds, a cached answer may be to be served instead of
   * asking the registrar. Defaults to the cache's 60 s; it can only narrow
   * that, since older answers are no longer kept.
   *
   * The payment route passes 0: the check made right before money is taken
   * must be a fresh one, not the answer the couple's typing cached up to a
   * minute ago (spec D3, "Our own rows count as taken"). A fresh answer is
   * still written to the cache, so the studio panel benefits from it.
   */
  maxAgeMs?: number;
}

/** One entry of the search's `results`, as loosely as it may come back. */
interface SearchEntry {
  domain?: unknown;
  available?: unknown;
  price?: unknown;
  premium?: unknown;
}

/**
 * Per name, per server instance. Only answers the registrar actually gave are
 * kept: a failed search or a name left out of the answer is asked again.
 */
const cache = new Map<string, { at: number; result: DomainAvailability }>();

/** Test-only: forget every cached answer. */
export function clearDomainSearchCache(): void {
  cache.clear();
}

function sweepExpired(now: number): void {
  for (const [name, entry] of cache) {
    if (now - entry.at >= CACHE_TTL_MS) cache.delete(name);
  }
}

function toAvailability(name: string, entry: SearchEntry | undefined): DomainAvailability {
  const price = typeof entry?.price === "number" && Number.isFinite(entry.price) ? entry.price : undefined;
  // `premium === false` rather than `!premium`: if the field ever goes
  // missing, names are shown as taken rather than sold at a loss.
  const available =
    entry?.available === true &&
    entry.premium === false &&
    price !== undefined &&
    price <= DOMAIN_MAX_USD_PER_YEAR;
  return price === undefined ? { name, available } : { name, available, priceUsd: price };
}

/** One call to the search endpoint, its entries keyed by lowercase name. Throws `domain-search: …`. */
async function requestSearch(domains: string[], fetchImpl: typeof fetch): Promise<Map<string, SearchEntry>> {
  let response: Response;
  try {
    response = await fetchImpl(DOMAIN_SEARCH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domains }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`domain-search: request failed (${reason})`, { cause: error });
  }
  if (!response.ok) throw new Error(`domain-search: HTTP ${response.status}`);

  let body: unknown;
  try {
    body = await response.json();
  } catch (error) {
    throw new Error("domain-search: the answer is not JSON", { cause: error });
  }
  const results = (body as { results?: unknown } | null)?.results;
  if (!Array.isArray(results)) throw new Error("domain-search: the answer has no results");

  const byName = new Map<string, SearchEntry>();
  for (const entry of results as SearchEntry[]) {
    if (entry && typeof entry.domain === "string") byName.set(entry.domain.toLowerCase(), entry);
  }
  return byName;
}

/**
 * Which of `names` the studio can sell, one answer per distinct name, in the
 * order first given. Names are compared trimmed and lowercased.
 *
 * Throws an `Error` whose message starts with `domain-search:` when the
 * registrar cannot be asked or answers badly, and leaves the decision to the
 * caller: the checkout, for one, lets the order through (D3), because the
 * purchase engine still catches a name taken in the meantime.
 */
export async function searchDomains(
  names: string[],
  deps: DomainSearchDeps = {},
): Promise<DomainAvailability[]> {
  const fetchImpl = deps.fetch ?? fetch;
  const now = (deps.now ?? Date.now)();
  const maxAgeMs = deps.maxAgeMs ?? CACHE_TTL_MS;

  const unique = [...new Set(names.map((name) => name.trim().toLowerCase()))].filter(Boolean);
  if (unique.length > MAX_NAMES) {
    throw new Error(`domain-search: at most ${MAX_NAMES} names per search, got ${unique.length}`);
  }

  sweepExpired(now);
  const found = new Map<string, DomainAvailability>();
  for (const name of unique) {
    const hit = cache.get(name);
    // `<`, so 0 never serves even an answer cached in this same millisecond.
    if (hit && now - hit.at < maxAgeMs) found.set(name, hit.result);
  }

  // Another TLD is never for sale here, so it is not worth asking about —
  // and the registrar's "false" for it would not mean "taken" anyway.
  const toAsk = unique.filter((name) => name.endsWith(SOLD_SUFFIX) && !found.has(name));
  if (toAsk.length > 0) {
    const answered = await requestSearch(toAsk, fetchImpl);
    for (const name of toAsk) {
      const entry = answered.get(name);
      const result = toAvailability(name, entry);
      found.set(name, result);
      if (entry) cache.set(name, { at: now, result });
    }
  }

  // Copies, so a caller editing its results cannot edit the cache.
  return unique.map((name) => ({ ...(found.get(name) ?? { name, available: false }) }));
}
