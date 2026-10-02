/**
 * The embed page for a video link a couple pasted, when it is one we know how
 * to frame — or null, and the theme shows nothing.
 *
 * Only YouTube and Vimeo, and only the player URLs rebuilt from the video id:
 * the couple's link is never put in an `<iframe src>` as typed, so it cannot
 * frame an arbitrary page inside their invitation. YouTube goes through its
 * no-cookie domain — an invitation is not a place to track guests.
 */
export function videoEmbedUrl(link: string): string | null {
  let url: URL;
  try {
    url = new URL(link);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^(www\.|m\.)/, "");
  const youtube = (id: string | null) =>
    id && /^[\w-]{6,20}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;

  if (host === "youtu.be") return youtube(url.pathname.slice(1));

  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") return youtube(url.searchParams.get("v"));
    const match = url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)/);
    return youtube(match?.[1] ?? null);
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const match = url.pathname.match(/^\/(?:video\/)?(\d+)/);
    return match ? `https://player.vimeo.com/video/${match[1]}` : null;
  }

  return null;
}
