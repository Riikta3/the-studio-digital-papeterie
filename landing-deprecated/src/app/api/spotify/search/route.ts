import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 },
    );
  }

  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Spotify credentials not configured" },
        { status: 500 },
      );
    }

    // 1. Get Access Token
    const authString = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64",
    );
    const tokenResponse = await fetch(
      "https://accounts.spotify.com/api/token",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${authString}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
        cache: "no-store",
      },
    );

    if (!tokenResponse.ok) {
      throw new Error(`Failed to fetch token: ${tokenResponse.statusText}`);
    }

    const { access_token } = await tokenResponse.json();

    // 2. Search Tracks
    const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(
      query,
    )}&type=track&limit=5`;

    const searchResponse = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!searchResponse.ok) {
      throw new Error(`Failed to search tracks: ${searchResponse.statusText}`);
    }

    const data = await searchResponse.json();

    // Map the response to the format our frontend expects
    const formattedResults = data.tracks.items.map((track: any) => ({
      id: track.id,
      title: track.name,
      artist: track.artists.map((a: any) => a.name).join(", "),
      coverUrl: track.album.images[1]?.url || track.album.images[0]?.url || "",
      uri: track.uri,
      spotifyUrl: track.external_urls?.spotify ?? null,
    }));

    return NextResponse.json({ results: formattedResults });
  } catch (error) {
    console.error("Spotify API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch from Spotify" },
      { status: 500 },
    );
  }
}
