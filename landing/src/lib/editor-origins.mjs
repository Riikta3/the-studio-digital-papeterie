/**
 * The dashboard origins allowed to drive the invitation editor's live preview.
 *
 * `/[locale]/invitation/apercu` draws whatever invitation it is sent through
 * `postMessage`. That is safe only because it listens to nobody but the
 * couple's dashboard — otherwise any page could frame it and have our domain
 * render words of its choosing. Two guards use this one list:
 *
 *   - `next.config.mjs` sends it as the route's `frame-ancestors`, so only
 *     these origins can embed the preview at all;
 *   - the preview itself drops any message whose `event.origin` is not in it.
 *
 * Plain JavaScript so `next.config.mjs` can import it too; the types live in
 * `editor-origins.d.mts`.
 *
 * Sources, all optional:
 *   NEXT_PUBLIC_DASHBOARD_URL   the dashboard of this environment
 *   EDITOR_ALLOWED_ORIGINS      extra origins, comma-separated (a preview
 *                               deployment's own URL, say)
 *   localhost:3003              in development only, where the dashboard runs
 */

/** @returns {string[]} */
export function editorOrigins() {
  const origins = new Set();

  const add = (value) => {
    if (!value) return;
    try {
      origins.add(new URL(value.trim()).origin);
    } catch {
      // A malformed entry is skipped rather than allowed: an origin we cannot
      // parse is not one we can compare against.
    }
  };

  add(process.env.NEXT_PUBLIC_DASHBOARD_URL);
  for (const entry of (process.env.EDITOR_ALLOWED_ORIGINS ?? "").split(",")) {
    add(entry);
  }
  if (process.env.NODE_ENV !== "production") add("http://localhost:3003");

  return [...origins];
}
