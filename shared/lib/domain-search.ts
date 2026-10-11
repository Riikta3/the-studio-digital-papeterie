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
 * Every name that is not available says why (`reason`), because the callers
 * act on the difference: a name `taken` or `premium` goes back to the couple,
 * a price `above_ceiling` alerts the studio, and an `unknown` answer — the
 * name left out, or an entry missing a field the decision needs — is not a
 * « nom pris ». The checkout lets the order through on it, and the purchase
 * engine asks again later (spec D5, "Search answers carry a reason").
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

/** Why a name is not available. Only `taken` and `premium` say the name itself is lost. */
export type DomainUnavailableReason =
  /** Registered by someone: Vercel's `available: false`. */
  | "taken"
  /** Free, but sold at a premium the studio does not pay. */
  | "premium"
  /** Free and ordinary, but priced above DOMAIN_MAX_USD_PER_YEAR. */
  | "above_ceiling"
  /** Not a `.com`: the studio sells nothing else, so it is not even asked. */
  | "unsupported"
  /** Left out of the answer, or the answer lacks what the decision needs. */
  | "unknown";

export interface DomainAvailability {
  name: string;
  available: boolean;
  /** Set whenever `available` is false. */
  reason?: DomainUnavailableReason;
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
  /**
   * Milliseconds the request may take, capped by the search's own 5 s. The
   * purchase engine passes what is left of its step's budget.
   */
  timeoutMs?: number;
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
 * kept: a failed search, a name left out of the answer or a malformed entry
 * (`unknown`) is asked again.
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
  if (!entry) return { name, available: false, reason: "unknown" };
  const price = typeof entry.price === "number" && Number.isFinite(entry.price) ? entry.price : undefined;
  const unavailable = (reason: DomainUnavailableReason): DomainAvailability =>
    price === undefined ? { name, available: false, reason } : { name, available: false, reason, priceUsd: price };

  // A taken name comes back bare (`{ domain, available: false }`): no price
  // or premium flag is needed to know it is gone.
  if (entry.available === false) return unavailable("taken");
  if (entry.available !== true) return unavailable("unknown");
  if (entry.premium === true) return unavailable("premium");
  // `premium === false` rather than `!premium`, and a price required: if a
  // field goes missing the name is neither sold at a loss nor called taken.
  if (entry.premium !== false || price === undefined) return unavailable("unknown");
  if (price > DOMAIN_MAX_USD_PER_YEAR) return unavailable("above_ceiling");
  return { name, available: true, priceUsd: price };
}

/** One call to the search endpoint, its entries keyed by lowercase name. Throws `domain-search: …`. */
async function requestSearch(
  domains: string[],
  fetchImpl: typeof fetch,
  timeoutMs: number,
): Promise<Map<string, SearchEntry>> {
  let response: Response;
  try {
    response = await fetchImpl(DOMAIN_SEARCH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domains }),
      signal: AbortSignal.timeout(timeoutMs),
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
  const timeoutMs = Math.max(1, Math.min(REQUEST_TIMEOUT_MS, deps.timeoutMs ?? REQUEST_TIMEOUT_MS));

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
    const answered = await requestSearch(toAsk, fetchImpl, timeoutMs);
    for (const name of toAsk) {
      const result = toAvailability(name, answered.get(name));
      found.set(name, result);
      if (result.reason !== "unknown") cache.set(name, { at: now, result });
    }
  }

  // Copies, so a caller editing its results cannot edit the cache.
  return unique.map((name) => ({ ...(found.get(name) ?? { name, available: false, reason: "unsupported" }) }));
}
