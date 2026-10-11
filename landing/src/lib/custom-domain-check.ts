import { isValidLabel, normalizeLabel, suggestLabels, toDomainName } from "@shared/lib/custom-domain";
import type { DomainAvailability, DomainUnavailableReason } from "@shared/lib/domain-search";

/**
 * The studio's « is this name free? » answer
 * (docs/superpowers/specs/2026-10-02-custom-domain-design.md, D3), kept apart
 * from `app/api/custom-domains/check/route.ts` so it can be tested without
 * Next, Supabase or Vercel: the route only wires the real lookups in.
 *
 * It is a hint for the couple while they type, never a reservation: the
 * payment route checks the name again, uncached, right before the money is
 * taken (`refuseDomainBeforePayment`).
 */

/** At most this many alternatives are offered under a taken name. */
export const MAX_ALTERNATIVES = 3;
/** Longer than any name a couple types; anything more is not a domain. */
const MAX_INPUT_LENGTH = 200;
/** Candidates searched besides the label: one search call, so keep it small. */
const MAX_CANDIDATES = 8;

export interface CheckDomainRequest {
  /** Normalised and valid: `parseCheckRequest` refuses anything else. */
  label: string;
  partner1: string;
  partner2: string;
  /** The locale's word for "and" (`CustomDomain.connector`). */
  connector: string;
  year: string;
}

/** A string field of an untrusted body, trimmed and capped; "" when absent or not a string. */
function field(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  return typeof value === "string" ? value.trim().slice(0, MAX_INPUT_LENGTH) : "";
}

/**
 * Reads the browser's body. Null when the label cannot be bought as typed —
 * the route answers 400 then. The label is normalised here even though the
 * panel already does it, since the route is reachable directly.
 */
export function parseCheckRequest(body: unknown): CheckDomainRequest | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  if (typeof record.label !== "string" || record.label.length > MAX_INPUT_LENGTH) return null;

  const label = normalizeLabel(record.label);
  if (!isValidLabel(label)) return null;

  return {
    label,
    partner1: field(record, "partner1"),
    partner2: field(record, "partner2"),
    connector: field(record, "connector"),
    year: /^\d{4}$/.test(field(record, "year")) ? field(record, "year") : "",
  };
}

/**
 * The labels to offer when `label` is taken, in order of preference: the
 * couple's own (`suggestLabels`, when their names were sent), then two built
 * on what they typed. Valid, distinct, never the label itself.
 */
export function alternativeCandidates(request: CheckDomainRequest): string[] {
  const { label, partner1, partner2, connector, year } = request;
  const fromNames = suggestLabels({ partner1, partner2, connector, year });
  const fromLabel = [year ? `${label}-${year}` : "", `mariage-${label}`].map(normalizeLabel);
  return [...new Set([...fromNames, ...fromLabel])]
    .filter((candidate) => candidate !== label && isValidLabel(candidate))
    .slice(0, MAX_CANDIDATES);
}

export interface CheckDomainLookups {
  /** `searchDomains`: one call for every name, throws `domain-search: …` when the registrar cannot be asked. */
  search: (names: string[]) => Promise<DomainAvailability[]>;
  /** `custom_domain_name_taken(name)` through the service role. Answers like a PostgREST call. */
  nameTaken: (name: string) => PromiseLike<{ data: unknown; error: unknown }>;
}

export interface CheckDomainBody {
  name: string;
  available: boolean;
  /** Why the name is not available; null when it is. */
  reason: DomainUnavailableReason | null;
  /** Up to MAX_ALTERNATIVES names (`label.com`) the studio can sell; empty when the name is available. */
  alternatives: string[];
}

export type CheckDomainAnswer =
  | { status: 200; body: CheckDomainBody }
  | { status: 503; body: { error: string } };

const UNAVAILABLE: CheckDomainAnswer = { status: 503, body: { error: "Vérification indisponible" } };

/** Whether another of our couples holds `name`. Throws when the lookup fails. */
async function heldByUs(name: string, lookups: CheckDomainLookups): Promise<boolean> {
  const { data, error } = await lookups.nameTaken(name);
  if (error) throw new Error(`custom_domain_name_taken failed for ${name}`, { cause: error });
  return Boolean(data);
}

/**
 * Asks Vercel once for the label and every alternative, then our own rows
 * for the names Vercel calls free: a name another of our couples has paid for
 * but that is not bought yet looks free to Vercel (spec D3, "Our own rows
 * count as taken").
 *
 * Either lookup failing gives a 503: the panel then says « vérification
 * indisponible » rather than « disponible » for a name nobody could vouch for.
 */
export async function checkDomain(
  request: CheckDomainRequest,
  lookups: CheckDomainLookups,
): Promise<CheckDomainAnswer> {
  const name = toDomainName(request.label);
  const alternatives = alternativeCandidates(request).map(toDomainName);

  let results: DomainAvailability[];
  try {
    results = await lookups.search([name, ...alternatives]);
  } catch (error) {
    console.warn("[DOMAIN_CHECK_SEARCH_FAILED]", error);
    return UNAVAILABLE;
  }
  const byName = new Map(results.map((result) => [result.name, result]));
  const own = byName.get(name) ?? { name, available: false, reason: "unknown" as const };

  try {
    if (own.available) {
      if (await heldByUs(name, lookups)) {
        return { status: 200, body: { name, available: false, reason: "taken", alternatives: await freeAlternatives() } };
      }
      return { status: 200, body: { name, available: true, reason: null, alternatives: [] } };
    }
    return {
      status: 200,
      body: { name, available: false, reason: own.reason ?? "unknown", alternatives: await freeAlternatives() },
    };
  } catch (error) {
    console.error("[DOMAIN_CHECK_TAKEN_LOOKUP_FAILED]", error);
    return UNAVAILABLE;
  }

  /** The alternatives Vercel calls free and no couple of ours holds, in order. */
  async function freeAlternatives(): Promise<string[]> {
    const free = alternatives.filter((candidate) => byName.get(candidate)?.available === true);
    const held = await Promise.all(free.map((candidate) => heldByUs(candidate, lookups)));
    return free.filter((_, index) => !held[index]).slice(0, MAX_ALTERNATIVES);
  }
}

/**
 * A fixed-window counter per key, in memory.
 *
 * Deliberately per process, like the Spotify search's: it stops one client
 * hammering the endpoint (and through it Vercel's public search, which has
 * its own limits for the whole studio), not a distributed attack. Each
 * serverless instance counts on its own and forgets on redeploy. Moving to a
 * shared store would keep this shape.
 *
 * `hit(key)` returns null when the request may go through, otherwise the
 * seconds to wait.
 */
export function createRateLimiter({
  limit,
  windowMs,
  maxKeys = 5_000,
  now = Date.now,
}: {
  limit: number;
  windowMs: number;
  /** Bounds the map: past it, expired windows are swept, then everything. */
  maxKeys?: number;
  now?: () => number;
}) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return {
    hit(key: string): number | null {
      const at = now();
      if (hits.size >= maxKeys) {
        for (const [k, entry] of hits) if (entry.resetAt <= at) hits.delete(k);
        if (hits.size >= maxKeys) hits.clear();
      }
      const entry = hits.get(key);
      if (!entry || entry.resetAt <= at) {
        hits.set(key, { count: 1, resetAt: at + windowMs });
        return null;
      }
      entry.count += 1;
      return entry.count > limit ? Math.max(1, Math.ceil((entry.resetAt - at) / 1000)) : null;
    },
  };
}

/**
 * Best-effort client identity. `x-forwarded-for` is set by Vercel's proxy;
 * it is spoofable when the app is reached directly, which is why the limiter
 * above is a guard and not a defence.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim() || "unknown";
  return headers.get("x-real-ip")?.trim() || "unknown";
}
