import { NextRequest, NextResponse } from "next/server";

/**
 * Spotify track search, used by the invitation themes' playlist section.
 *
 * Ported from `landing-deprecated/src/app/api/spotify/search/route.ts` with its
 * two defects fixed — see below. The response shape is unchanged, so the
 * dashboard's `Track` type and `submitPlaylistSuggestions` both still fit it:
 *
 *   { results: [{ id, title, artist, coverUrl, uri, spotifyUrl }] }
 *
 * ── Why this route is public ─────────────────────────────────────────────────
 * A guest opening an invitation is anonymous by design — there is no login on
 * that page — and the public demo must be able to search too, since it is the
 * showcase. So the route cannot be gated behind a session. Searching writes
 * nothing; only `submitPlaylistSuggestions` persists, and that one requires a
 * real `weddingId`. What this route has to protect is therefore not data but
 * the Spotify quota, which the two guards below do.
 *
 * ── Defect 1 (fixed): a token was minted on every single search ─────────────
 * The original hit `accounts.spotify.com/api/token` before every query, adding
 * a full round-trip to each keystroke-debounced search and burning quota on an
 * endpoint whose answer is valid for an hour. The token is cached in module
 * scope with a safety margin instead.
 *
 * The cache is per server instance, not shared: on a serverless platform each
 * cold instance mints its own, which is correct — the token is per-app, not
 * per-user, and Spotify allows concurrent ones. A concurrent-request guard
 * (`inflight`) means a burst of searches on a cold instance triggers ONE token
 * fetch, not one per request.
 *
 * ── Defect 2 (fixed): no limits at all ──────────────────────────────────────
 * The route was public, unauthenticated and unbounded: anyone could loop it and
 * exhaust the Spotify rate limit for every couple at once. Now:
 *
 *   - the query is capped at MAX_QUERY_LEN characters and must be at least
 *     MIN_QUERY_LEN, so it cannot be used to smuggle a huge string upstream;
 *   - a fixed-window counter allows RATE_LIMIT requests per RATE_WINDOW_MS per
 *     client IP, answering 429 with `Retry-After` beyond that.
 *
 * The rate limiter is deliberately in-memory: it is one process-local Map with
 * no dependency to add or configure, which is the right weight for a guard
 * whose job is to stop a single client hammering the endpoint. Its limits are
 * honest ones — per instance, and reset on redeploy — so it slows down casual
 * abuse and accidental loops rather than a distributed attack. If this ever
 * needs to hold against a real one, it should move to a shared store (Upstash
 * or the like) keyed the same way; the shape here is meant to make that swap
 * a drop-in.
 */

/** Spotify's client-credentials token lives an hour; renew before it lapses. */
const TOKEN_MARGIN_MS = 60_000;

const MIN_QUERY_LEN = 2;
/** Longer than any real "title artist" pair; anything more is not a search. */
const MAX_QUERY_LEN = 100;

/**
 * Results returned per search.
 *
 * Four, not six: the panel shows four rows without scrolling, and a dropdown
 * that scrolls is both harder to scan and the source of a rendering artefact —
 * the scrollbar gutter is not clipped by the panel's `border-radius`, so its
 * ground showed as a hard square in the rounded corner. Four rows is also
 * enough to find the intended track for a query specific enough to be worth
 * typing.
 */
const RESULT_LIMIT = 4;

/** Per-IP fixed window. 30 searches/minute is far above a human typing. */
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

/** Cap the number of tracked IPs so the Map cannot grow without bound. */
const MAX_TRACKED_IPS = 5_000;

type CachedToken = { value: string; expiresAt: number };

let cachedToken: CachedToken | null = null;
/** In-flight token request, so a burst mints one token rather than N. */
let inflightToken: Promise<string> | null = null;

const hits = new Map<string, { count: number; resetAt: number }>();

/**
 * Fixed-window counter. Returns null when allowed, or the seconds to wait.
 *
 * Sweeps expired entries when the Map gets large: without it a long-lived
 * instance would accumulate one entry per IP seen since boot.
 */
function rateLimit(ip: string): number | null {
  const now = Date.now();

  if (hits.size > MAX_TRACKED_IPS) {
    for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
    // Still oversized (all windows live): drop the oldest rather than grow.
    if (hits.size > MAX_TRACKED_IPS) hits.clear();
  }

  const entry = hits.get(ip);
  if (!entry || entry.resetAt <= now) {
    hits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return null;
  }

  entry.count += 1;
  if (entry.count > RATE_LIMIT) return Math.ceil((entry.resetAt - now) / 1000);
  return null;
}

/**
 * Best-effort client identity. `x-forwarded-for` is set by the platform proxy
 * in production; it is spoofable when the app is exposed directly, which is
 * why this limiter is described above as a guard rather than a defence.
 */
function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

async function fetchToken(clientId: string, clientSecret: string): Promise<string> {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`token request failed: ${res.status}`);

  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new Error("token response had no access_token");

  const ttlMs = (json.expires_in ?? 3600) * 1000;
  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + Math.max(ttlMs - TOKEN_MARGIN_MS, 0),
  };
  return json.access_token;
}

/** Returns a valid token, reusing the cached one until its margin runs out. */
async function getToken(clientId: string, clientSecret: string): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;
  if (inflightToken) return inflightToken;

  inflightToken = fetchToken(clientId, clientSecret).finally(() => {
    inflightToken = null;
  });
  return inflightToken;
}

type SpotifyTrack = {
  id: string;
  name: string;
  uri: string;
  artists?: Array<{ name: string }>;
  album?: { images?: Array<{ url: string }> };
  external_urls?: { spotify?: string };
};

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("q") ?? "";
  const query = raw.trim().slice(0, MAX_QUERY_LEN);

  if (query.length < MIN_QUERY_LEN) {
    // Not an error worth surfacing: the client debounces and simply has not
    // typed enough yet. An empty result keeps that path free of error states.
    return NextResponse.json({ results: [] });
  }

  const waitSeconds = rateLimit(clientIp(req));
  if (waitSeconds !== null) {
    return NextResponse.json(
      { error: "Trop de recherches. Merci de patienter un instant." },
      { status: 429, headers: { "Retry-After": String(waitSeconds) } },
    );
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error("[spotify] credentials not configured");
    return NextResponse.json({ error: "Recherche indisponible." }, { status: 503 });
  }

  try {
    let token = await getToken(clientId, clientSecret);

    const search = async (bearer: string) =>
      fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${RESULT_LIMIT}`,
        { headers: { Authorization: `Bearer ${bearer}` }, cache: "no-store" },
      );

    let res = await search(token);

    // A cached token can be revoked before its stated expiry. One retry with a
    // freshly minted token, then give up — never loop against an upstream 401.
    if (res.status === 401) {
      cachedToken = null;
      token = await getToken(clientId, clientSecret);
      res = await search(token);
    }

    if (!res.ok) throw new Error(`search failed: ${res.status}`);

    const data = (await res.json()) as { tracks?: { items?: SpotifyTrack[] } };

    const results = (data.tracks?.items ?? []).map((track) => ({
      id: track.id,
      title: track.name,
      artist: (track.artists ?? []).map((a) => a.name).join(", "),
      coverUrl: track.album?.images?.[1]?.url || track.album?.images?.[0]?.url || "",
      uri: track.uri,
      spotifyUrl: track.external_urls?.spotify ?? null,
    }));

    return NextResponse.json({ results });
  } catch (error) {
    // Never echo the upstream body: it can carry credentials-adjacent detail.
    console.error("[spotify] search failed", (error as Error).message);
    return NextResponse.json({ error: "Recherche indisponible." }, { status: 502 });
  }
}
