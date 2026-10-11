/**
 * The authenticated calls the purchase engine makes to Vercel
 * (docs/superpowers/specs/2026-10-02-custom-domain-design.md, D5): price a
 * registration, buy it, follow the order, check the domain is in the team's
 * account, attach it to the landing project.
 *
 * A thin client on purpose. Every decision (when to buy, what an error means
 * for the row) belongs to `advance.ts`; this file only turns HTTP into typed
 * answers and one typed error. `fetch`, the token and the ids are injected,
 * so the tests replay Vercel's answers and none of them can reach the real
 * API: every successful buy call costs real money, and Vercel has no
 * registrar sandbox.
 *
 * Availability is not asked here. It comes from the public search
 * (`shared/lib/domain-search.ts`), never from the registrar's per-domain
 * availability endpoint, which answered `true` for a `.fr`, a TLD Vercel
 * does not even sell.
 */

export const VERCEL_API_URL = "https://api.vercel.com";

/**
 * Far under the engine's 2-minute lease, so a hanging call cannot outlive the
 * claim that made it (spec D5, "The lease is owned"). A caller may ask for
 * less — the engine passes what is left of its step's 90 s — never for more.
 */
export const REQUEST_TIMEOUT_MS = 20_000;

/** Per call: how long it may take, everything included (a read-back too). */
export interface CallOptions {
  timeoutMs?: number;
}

export interface RegistrarDeps {
  fetch: typeof fetch;
  /** A team-scoped token: a project-scoped one is refused on domains. */
  token: string;
  teamId: string;
  /** The landing project, which serves the couples' domains. */
  projectId: string;
}

/** Vercel's `contactInformation`, the registrant of every domain (the studio). */
export interface RegistrantContact {
  firstName: string;
  lastName: string;
  email: string;
  /** E.164, optionally with a dot after the country code: `+33.612345678`. */
  phone: string;
  address1: string;
  city: string;
  state: string;
  zip: string;
  /** ISO 3166-1 alpha-2. */
  country: string;
  companyName?: string;
}

export interface PriceQuote {
  years: number;
  /** The total for `years`, in USD — not a per-year price. Null when the name is taken. */
  purchasePrice: number | null;
}

export interface OrderDomain {
  domainName: string;
  /** `pending`, `completed`, `failed`, `refunded` or `refund-failed`. */
  status: string;
  /** e.g. `unavailable-legal`, `invalid-contact`, `price-change`. */
  errorCode?: string;
}

export interface RegistrarOrder {
  /** `draft`, `purchasing`, `completed` or `failed`. */
  status: string;
  domains: OrderDomain[];
  /** e.g. `payment-failed`, `tld-outage`, `price-mismatch`, `unexpected-error`. */
  errorCode?: string;
}

export interface OwnedDomain {
  /** Milliseconds since the epoch, as Vercel reports it. */
  expiresAt: number | null;
  /**
   * When it was bought through Vercel, in milliseconds; null for a domain
   * added to the team without being bought there. The engine only adopts a
   * domain bought after its row was created (spec D5, "Adopting").
   */
  boughtAt: number | null;
}

export interface AttachOptions {
  /** Serve this name as a redirect to another one, e.g. `www.x.com` → `x.com`. */
  redirect?: string;
  redirectStatusCode?: 301 | 302 | 307 | 308;
}

export interface Registrar {
  quotePrice(name: string, years: number, call?: CallOptions): Promise<PriceQuote>;
  buyDomain(
    name: string,
    order: { years: number; expectedPrice: number; contact: RegistrantContact },
    call?: CallOptions,
  ): Promise<{ orderId: string }>;
  getOrder(orderId: string, call?: CallOptions): Promise<RegistrarOrder>;
  /** Null when the domain is not in the team's account (404). */
  getOwnedDomain(name: string, call?: CallOptions): Promise<OwnedDomain | null>;
  /** Resolves once the name is on the project, whether this call added it or not. */
  attachProjectDomain(name: string, opts?: AttachOptions, call?: CallOptions): Promise<void>;
  /** Null when the name is not on the project (404). */
  getProjectDomain(name: string, call?: CallOptions): Promise<{ name: string } | null>;
}

/**
 * Every failure of a call, normalised: Vercel answers errors in two shapes,
 * `{ status, code, message }` and `{ error: { code, message } }`, and some
 * with no body at all.
 *
 * `status` is the HTTP status, or 0 when no answer came back (network
 * failure, timeout): the engine must then assume the call may have reached
 * Vercel. `code` is Vercel's machine code (`domain_not_available`, …), or
 * `http_<status>`, `network_error`, `timeout` or `invalid_response`. Messages
 * name the call, never the token.
 *
 * `retryAfterMs` is set on a 429 that said how long to wait: the
 * `Retry-After` header (seconds), or else the body's `retryAfter.value`.
 */
export class RegistrarError extends Error {
  status: number;
  code: string;
  retryAfterMs?: number;

  constructor(status: number, code: string, message: string, options?: { cause?: unknown; retryAfterMs?: number }) {
    super(message, options);
    this.name = "RegistrarError";
    this.status = status;
    this.code = code;
    if (options?.retryAfterMs !== undefined) this.retryAfterMs = options.retryAfterMs;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const text = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value : undefined;

/** Seconds as `Retry-After` writes them, or an HTTP date; undefined for anything else. */
function retryAfterFrom(response: Response, body: Record<string, unknown> | undefined): number | undefined {
  const header = response.headers.get("retry-after")?.trim();
  if (header) {
    if (/^\d+$/.test(header)) return Number(header) * 1000;
    const at = Date.parse(header);
    if (Number.isFinite(at)) return Math.max(0, at - Date.now());
  }
  const value = isRecord(body?.retryAfter) ? body.retryAfter.value : undefined;
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value * 1000 : undefined;
}

async function errorFrom(response: Response, call: string): Promise<RegistrarError> {
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // No body, or not JSON: the status is all there is.
  }
  const nested = isRecord(body) && isRecord(body.error) ? body.error : undefined;
  const flat = isRecord(body) ? body : undefined;
  const code = text(nested?.code) ?? text(flat?.code) ?? `http_${response.status}`;
  const message = text(nested?.message) ?? text(flat?.message) ?? `${call}: HTTP ${response.status}`;
  const retryAfterMs = response.status === 429 ? retryAfterFrom(response, nested ?? flat) : undefined;
  return new RegistrarError(response.status, code, message, retryAfterMs === undefined ? undefined : { retryAfterMs });
}

/** The caller's timeout, within 1 ms and REQUEST_TIMEOUT_MS. */
const timeoutOf = (call?: CallOptions): number =>
  Math.max(1, Math.min(REQUEST_TIMEOUT_MS, Math.floor(call?.timeoutMs ?? REQUEST_TIMEOUT_MS)));

/** One authenticated call, its JSON answer on success, a RegistrarError otherwise. */
async function request(
  deps: RegistrarDeps,
  method: "GET" | "POST",
  path: string,
  { query = {}, body, timeoutMs = REQUEST_TIMEOUT_MS }: { query?: Record<string, string>; body?: unknown; timeoutMs?: number } = {},
): Promise<unknown> {
  const url = new URL(path, VERCEL_API_URL);
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
  url.searchParams.set("teamId", deps.teamId);
  const call = `${method} ${url.pathname}`;

  let response: Response;
  try {
    response = await deps.fetch(url.toString(), {
      method,
      headers: {
        Authorization: `Bearer ${deps.token}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
      // Next patches fetch with a cache; none of these answers may be reused.
      cache: "no-store",
    });
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    const reason = error instanceof Error ? error.message : String(error);
    throw new RegistrarError(0, timedOut ? "timeout" : "network_error", `${call}: ${reason}`, { cause: error });
  }

  if (!response.ok) throw await errorFrom(response, call);
  try {
    return await response.json();
  } catch (error) {
    throw new RegistrarError(response.status, "invalid_response", `${call}: the answer is not JSON`, { cause: error });
  }
}

/** `request`, with a 404 answered as null instead of thrown. */
async function requestOrNull(deps: RegistrarDeps, path: string, timeoutMs: number): Promise<unknown> {
  try {
    return await request(deps, "GET", path, { timeoutMs });
  } catch (error) {
    if (error instanceof RegistrarError && error.status === 404) return null;
    throw error;
  }
}

const invalid = (call: string, what: string) => new RegistrarError(200, "invalid_response", `${call}: ${what}`);

const domainPath = (name: string) => encodeURIComponent(name.trim().toLowerCase());

export function createRegistrar(deps: RegistrarDeps): Registrar {
  const projectPath = `/v10/projects/${encodeURIComponent(deps.projectId)}/domains`;

  const getProjectDomain: Registrar["getProjectDomain"] = async (name, call) => {
    // https://vercel.com/docs/rest-api/projects/get-a-project-domain
    const body = await requestOrNull(
      deps,
      `/v9/projects/${encodeURIComponent(deps.projectId)}/domains/${domainPath(name)}`,
      timeoutOf(call),
    );
    if (body === null) return null;
    if (!isRecord(body) || typeof body.name !== "string") throw invalid("GET project domain", "no name");
    return { name: body.name };
  };

  return {
    async quotePrice(name, years, call) {
      // https://vercel.com/docs/rest-api/domains-registrar/get-price-data-for-a-domain
      // `purchasePrice` is the total for `years` (22.5 for two years of a
      // .com at 11.25), and null for a name that is taken.
      const body = await request(deps, "GET", `/v1/registrar/domains/${domainPath(name)}/price`, {
        query: { years: String(years) },
        timeoutMs: timeoutOf(call),
      });
      if (!isRecord(body)) throw invalid("GET price", "not an object");
      const price = body.purchasePrice;
      // A missing field is not "taken": a changed answer must stop the
      // purchase, not send the couple an email saying their name was lost.
      if (price !== null && (typeof price !== "number" || !Number.isFinite(price))) {
        throw invalid("GET price", "purchasePrice is neither a number nor null");
      }
      const quotedYears = typeof body.years === "number" ? body.years : years;
      return { years: quotedYears, purchasePrice: price };
    },

    async buyDomain(name, { years, expectedPrice, contact }, call) {
      // Checked here as well as by the engine: this is the one call that
      // spends money, and a NaN or a zero sent as expectedPrice must never
      // reach it.
      if (!Number.isInteger(years) || years < 1 || years > 10) {
        throw new RangeError(`buyDomain: ${years} is not a number of registration years`);
      }
      if (typeof expectedPrice !== "number" || !Number.isFinite(expectedPrice) || expectedPrice <= 0) {
        throw new RangeError(`buyDomain: ${expectedPrice} is not a quoted price`);
      }

      // https://vercel.com/docs/rest-api/domains-registrar/buy-a-domain
      // `expectedPrice` is the quote's total for all the years, and Vercel
      // refuses the order (`expected_price_mismatch`) if its price moved.
      // `autoRenew` is always false: renewal is paid by the couple, and is a
      // separate spec.
      const body = await request(deps, "POST", `/v1/registrar/domains/${domainPath(name)}/buy`, {
        body: { autoRenew: false, years, expectedPrice, contactInformation: contact },
        timeoutMs: timeoutOf(call),
      });
      // An order may exist even so: the engine treats this like any other
      // unclear answer and checks the account before buying again.
      if (!isRecord(body) || typeof body.orderId !== "string" || !body.orderId) {
        throw invalid("POST buy", "no orderId");
      }
      return { orderId: body.orderId };
    },

    async getOrder(orderId, call) {
      // https://vercel.com/docs/rest-api/domains-registrar/get-a-domain-order
      const body = await request(deps, "GET", `/v1/registrar/orders/${encodeURIComponent(orderId)}`, {
        timeoutMs: timeoutOf(call),
      });
      if (!isRecord(body) || typeof body.status !== "string" || !Array.isArray(body.domains)) {
        throw invalid("GET order", "no status or domains");
      }
      const domains: OrderDomain[] = body.domains.filter(isRecord).map((entry) => {
        const errorCode = isRecord(entry.error) ? text(entry.error.code) : undefined;
        return {
          domainName: String(entry.domainName ?? ""),
          status: String(entry.status ?? ""),
          ...(errorCode ? { errorCode } : {}),
        };
      });
      const errorCode = isRecord(body.error) ? text(body.error.code) : undefined;
      return { status: body.status, domains, ...(errorCode ? { errorCode } : {}) };
    },

    async getOwnedDomain(name, call) {
      // https://vercel.com/docs/rest-api/domains/get-information-for-a-single-domain
      // 200 when the domain is in the team's account, 404 when it is not.
      const body = await requestOrNull(deps, `/v5/domains/${domainPath(name)}`, timeoutOf(call));
      if (body === null) return null;
      if (!isRecord(body) || !isRecord(body.domain)) throw invalid("GET domain", "no domain");
      const ms = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : null);
      return { expiresAt: ms(body.domain.expiresAt), boughtAt: ms(body.domain.boughtAt) };
    },

    async attachProjectDomain(name, opts = {}, call) {
      // https://vercel.com/docs/rest-api/projects/add-a-domain-to-a-project
      // The POST and its read-back share the caller's timeout, so the engine's
      // step budget holds for the whole call.
      const budget = timeoutOf(call);
      const startedAt = Date.now();
      try {
        await request(deps, "POST", projectPath, {
          body: {
            name,
            ...(opts.redirect ? { redirect: opts.redirect } : {}),
            ...(opts.redirectStatusCode ? { redirectStatusCode: opts.redirectStatusCode } : {}),
          },
          timeoutMs: budget,
        });
      } catch (error) {
        // A name already on the project answers 400 with a code Vercel does
        // not document (409 seen too), so the answer is checked by reading
        // the project back rather than by matching a code.
        if (error instanceof RegistrarError && (error.status === 400 || error.status === 409)) {
          if (await getProjectDomain(name, { timeoutMs: budget - (Date.now() - startedAt) })) return;
        }
        throw error;
      }
    },

    getProjectDomain,
  };
}

/**
 * The registrar from the landing's server environment, or null when any of
 * the three variables is missing: the engine then refuses to go on and
 * alerts the studio rather than half-running. The dashboard never imports
 * this file and never holds the token (plan, Phase 7 guards).
 */
export function registrarFromEnv(
  env: Record<string, string | undefined> = process.env,
  fetchImpl: typeof fetch = (input, init) => fetch(input, init),
): Registrar | null {
  const token = env.VERCEL_API_TOKEN?.trim();
  const teamId = env.VERCEL_TEAM_ID?.trim();
  const projectId = env.VERCEL_LANDING_PROJECT_ID?.trim();
  if (!token || !teamId || !projectId) return null;
  return createRegistrar({ fetch: fetchImpl, token, teamId, projectId });
}
