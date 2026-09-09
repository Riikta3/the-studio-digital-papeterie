/**
 * Consent state for non-essential cookies.
 *
 * Read by whatever loads a tracking script, so nothing tracking-related has
 * to know how consent is stored. Today there is no such script — this ships
 * ahead of the Meta pixel deliberately, because the pixel cannot legally be
 * added until the gate exists.
 *
 * Under the French implementation of the ePrivacy directive, analytics and
 * advertising cookies need consent BEFORE they are set. A banner that merely
 * informs is not compliant: the CNIL has fined for exactly that. So the rule
 * this module encodes is that absence of an answer means refusal — a visitor
 * who has not chosen, or who closed the banner, is treated as having declined.
 */

const STORAGE_KEY = "studio.consent.v1";

/**
 * `granted` and `denied` are the only stored values. A visitor who has never
 * answered has no entry at all, which is what `null` means — distinct from
 * `denied`, because it is the state that should still show the banner.
 */
export type ConsentValue = "granted" | "denied";

/**
 * The stored choice, or null if the visitor has not answered.
 *
 * Wrapped in try/catch: `localStorage` throws outright in some contexts —
 * Safari's private mode historically, browsers set to block site data, and
 * embedded webviews — and a consent banner that crashes the page it sits on
 * is worse than no banner.
 */
export function readConsent(): ConsentValue | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === "granted" || raw === "denied" ? raw : null;
  } catch {
    return null;
  }
}

/** Persist a choice. Silently a no-op if storage is unavailable. */
export function writeConsent(value: ConsentValue): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Nothing to do: the banner will simply ask again next visit, which is
    // the safe failure mode — it never tracks without an answer.
  }
}

/**
 * Whether non-essential scripts may load.
 *
 * The single check a future pixel loader should make. Note it returns false
 * for `null`: no answer is not permission.
 */
export function hasConsent(): boolean {
  return readConsent() === "granted";
}

/**
 * Fired when the visitor answers, so anything listening can react without a
 * page reload — a pixel can start on grant, and the banner can be reopened
 * from the footer link.
 */
export const CONSENT_EVENT = "studio:consent";

export function emitConsentChange(value: ConsentValue): void {
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
}
