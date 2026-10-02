/**
 * Reads the `supports` list out of a theme's `theme.config.ts`, as text.
 *
 * `sync-themes.mjs` cannot import a manifest — it pulls in React sections, CSS
 * and fonts — and the dashboard needs that one list to offer and sell only the
 * modules a couple's theme draws. Manifests write it as a plain array of
 * string literals with comments in between; that is all this accepts, and
 * anything else returns null so the sync fails loudly instead of guessing.
 */
export function readSupports(source) {
  const match = /\bsupports\s*:\s*\[([\s\S]*?)\]/.exec(source);
  if (!match) return null;

  const body = match[1].replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
  const leftover = body.replace(/(["'])[a-z0-9-]+\1/g, "").replace(/[\s,]/g, "");
  if (leftover) return null;

  return [...body.matchAll(/(["'])([a-z0-9-]+)\1/g)].map((found) => found[2]);
}
