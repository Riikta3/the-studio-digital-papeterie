/**
 * Where the invitation editor's live preview is drawn: the landing app's
 * `/[locale]/invitation/apercu`, framed by the editor.
 *
 * Not `NEXT_PUBLIC_LANDING_URL`, which says where guests read the invitation.
 * The preview must run the same code as the editor driving it — the rows it is
 * sent and the messages it answers move with the editor — and in development
 * that is the landing on this machine, whatever the env file says. A dashboard
 * run on the production database keeps a landing URL on the deployment, whose
 * preview is older than the editor, or missing altogether.
 *
 * Read by the editor for its iframe and by `next.config.ts` for `frame-src`, so
 * the frame the editor renders is always one the policy allows. No imports: the
 * config loader resolves no path aliases.
 *
 * The first one set wins:
 *   EDITOR_PREVIEW_URL        an explicit renderer (a preview deployment's landing)
 *   http://localhost:3010     outside production, where `landing/package.json` serves
 *   NEXT_PUBLIC_LANDING_URL   the landing of this environment
 *   the production domain
 *
 * The landing lets the dashboard in through its `src/lib/editor-origins.mjs`:
 * localhost:3003 outside production, its NEXT_PUBLIC_DASHBOARD_URL otherwise.
 */

const LOCAL_LANDING = "http://localhost:3010";
const PRODUCTION_LANDING = "https://www.thestudiopapeteriedigitale.com";

/** The preview's origin, e.g. `http://localhost:3010`. */
export function editorPreviewUrl(): string {
  const candidates = [
    process.env.EDITOR_PREVIEW_URL,
    process.env.NODE_ENV !== "production" ? LOCAL_LANDING : undefined,
    process.env.NEXT_PUBLIC_LANDING_URL,
  ];

  for (const candidate of candidates) {
    if (!candidate?.trim()) continue;
    try {
      return new URL(candidate.trim()).origin;
    } catch {
      // A malformed value falls through to the next: an address that does not
      // parse can be neither framed nor compared against.
    }
  }
  return PRODUCTION_LANDING;
}
