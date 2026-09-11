import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

/**
 * Spotify track search, for the playlist screens.
 *
 * This route had neither authentication nor limits: it minted a fresh
 * client-credentials token on every single query and forwarded anything to
 * Spotify, so any stranger could spend the app's Spotify quota — two requests
 * to Spotify per request to us — and exhaust it for every couple at once. The
 * landing's copy of this proxy was fixed for exactly that
 * (`landing/src/app/api/spotify/search/route.ts`) and the fix was never
 * carried over here.
 *
 * The two differ in one way that matters: every caller of this one is a
 * signed-in couple (`PlaylistClient.tsx`, `ModulePreview.tsx`), so it requires
 * a session rather than rate-limiting by IP. That is the stronger guard — it
 * costs an attacker an account instead of an address — and it makes the
 * endpoint uninteresting to anyone who does not have one.
 *
 * The token cache is carried over as-is: it is per server instance, which is
 * correct because the token is per-app, and the in-flight promise means a
 * burst on a cold instance mints one token rather than N.
 */

/** Spotify's client-credentials token lives an hour; renew before it lapses. */
const TOKEN_MARGIN_MS = 60_000;

const MIN_QUERY_LEN = 2;
/** Longer than any real "title artist" pair; anything more is not a search. */
const MAX_QUERY_LEN = 100;

const RESULT_LIMIT = 6;

type CachedToken = { value: string; expiresAt: number };

/** The fields this route reads off a Spotify track. */
type SpotifyTrack = {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { images: { url: string }[] };
  external_urls?: { spotify?: string };
};

let cachedToken: CachedToken | null = null;
/** In-flight token request, so a burst mints one token rather than N. */
let inflightToken: Promise<string> | null = null;

async function getAccessToken(
  clientId: string,
  clientSecret: string,
): Promise<string> {
  const now = Date.now();

  if (cachedToken && cachedToken.expiresAt > now + TOKEN_MARGIN_MS) {
    return cachedToken.value;
  }

  if (inflightToken) return inflightToken;

  inflightToken = (async () => {
    const authString = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64",
    );

    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${authString}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      cache: "no-store",
    });

    if (!tokenRes.ok) throw new Error(`Spotify token: ${tokenRes.status}`);

    const { access_token, expires_in } = await tokenRes.json();
    if (!access_token) throw new Error("Spotify token: empty response");

    cachedToken = {
      value: access_token as string,
      expiresAt: Date.now() + (Number(expires_in) || 3600) * 1000,
    };

    return cachedToken.value;
  })();

  try {
    return await inflightToken;
  } finally {
    // Cleared either way: a failed mint must not be retried forever from cache.
    inflightToken = null;
  }
}

export async function GET(req: NextRequest) {
  // Signed-in couples only. Checked before anything reaches Spotify, so an
  // anonymous request costs nothing beyond one session lookup.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query.length < MIN_QUERY_LEN) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }
  if (query.length > MAX_QUERY_LEN) {
    return NextResponse.json({ error: "Query too long" }, { status: 400 });
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Spotify not configured" },
      { status: 500 },
    );
  }

  try {
    const accessToken = await getAccessToken(clientId, clientSecret);

    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${RESULT_LIMIT}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!searchRes.ok) {
      // A 401 here means the cached token was revoked early; drop it so the
      // next search mints a fresh one instead of failing until it expires.
      if (searchRes.status === 401) cachedToken = null;
      return NextResponse.json({ error: "Spotify error" }, { status: 502 });
    }

    const data = await searchRes.json();

    const results = (data.tracks?.items ?? []).map((track: SpotifyTrack) => ({
      id: track.id,
      title: track.name,
      artist: track.artists.map((a) => a.name).join(", "),
      coverUrl: track.album.images[1]?.url || track.album.images[0]?.url || "",
      spotifyUrl: track.external_urls?.spotify ?? null,
    }));

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[SPOTIFY_SEARCH]", err);
    return NextResponse.json({ error: "Spotify error" }, { status: 500 });
  }
}
