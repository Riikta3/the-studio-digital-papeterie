"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import {
  CONSENT_EVENT,
  type ConsentValue,
  emitConsentChange,
  readConsent,
  writeConsent,
} from "@/lib/consent";
import { Link, usePathname } from "@/navigation";

/**
 * The consent gate for non-essential cookies.
 *
 * Ships before any tracking script, on purpose: under the French
 * implementation of ePrivacy, an analytics or advertising cookie needs consent
 * BEFORE it is set, so the gate has to exist first. Nothing reads
 * `hasConsent()` yet — the Meta pixel will.
 *
 * Rendered nowhere in the SSR HTML. `mounted` stays false through the server
 * render and the first client render, so the banner appears only after
 * hydration. Two reasons: the stored choice lives in localStorage and is
 * unreadable on the server, so SSR-ing the banner would flash it at every
 * returning visitor who had already answered; and a fixed overlay in the
 * served markup is content a crawler sees on every page.
 */
/**
 * Route prefixes that are a couple's own stationery rather than our marketing.
 *
 * An invitation and the Jour J pages are opened by a wedding's guests from a
 * link the couple sent them. A consent pill over that is our banner on their
 * paper: it is the first thing a guest sees on a page the couple paid for, and
 * it belongs to a site the guest did not choose to visit.
 *
 * Safe to exclude because these pages set no non-essential cookie — nothing
 * reads `hasConsent()` yet, and when the Meta pixel does it will live on the
 * marketing pages. Should tracking ever reach an invitation, the banner has to
 * come back here first.
 */
const PRIVATE_PREFIXES = ["/invitation", "/jourj"];

export function CookieConsent() {
  const t = useTranslations("CookieConsent");
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // No stored answer means the visitor has never chosen. Not the same as a
    // refusal: a refusal is remembered and the banner stays closed.
    if (readConsent() === null) setVisible(true);

    // Lets the footer link reopen the banner without a page reload.
    const reopen = () => setVisible(true);
    window.addEventListener("studio:consent-reopen", reopen);
    return () => window.removeEventListener("studio:consent-reopen", reopen);
  }, []);

  const answer = useCallback((value: ConsentValue) => {
    writeConsent(value);
    emitConsentChange(value);
    setVisible(false);
  }, []);

  // `usePathname` from `@/navigation` is locale-stripped, so one prefix covers
  // all nine locales. Checked after the hooks above, never before: the effect
  // that listens for the footer's reopen event must run on every page.
  const isPrivatePage = PRIVATE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isPrivatePage || !visible) return null;

  return (
    // `role="dialog"` rather than `alertdialog`: this interrupts nothing and
    // must not steal focus from a visitor already reading the page. It is not
    // modal either — the site stays usable while it is open, which is itself a
    // compliance point, since refusing must be as easy as accepting and
    // neither may be forced.
    //
    // A floating pill rather than a full-width bar: the bar read as a second
    // page footer and cut the hero in half. Inset from the edges and rounded,
    // it registers as an overlay the visitor can answer and dismiss, which is
    // what it is. It still spans the width on the narrowest screens, where
    // there is no room to inset anything.
    //
    // Anchored to the bottom-start corner from `sm` up, for two reasons: the
    // bottom-end corner is taken by ScrollToTop and ContactBubble, and in a
    // left-to-right locale the start corner is where the eye already rests.
    // `start-*` and not `left-*` so it flips with the writing direction — but
    // that flip lands it on the two floating controls in Arabic, which is why
    // ContactBubble measures the overlap instead of assuming a side.
    <div
      role="dialog"
      aria-labelledby="cookie-consent-text"
      // Marked so ContactBubble can measure this banner and sit above it: its
      // height depends on the locale's text length, so it cannot be hardcoded.
      data-cookie-banner=""
      className="fixed inset-x-3 bottom-3 z-50 rounded-3xl border border-studio-jaune/40 bg-studio-violet/95 px-5 py-4 shadow-[0_8px_32px_rgba(75,63,114,0.28)] backdrop-blur-sm sm:inset-x-auto sm:bottom-6 sm:start-6 sm:max-w-2xl sm:px-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <p
          id="cookie-consent-text"
          className="min-w-0 flex-1 font-body text-xs leading-relaxed text-studio-creme/85"
        >
          {t("bannerText")}{" "}
          <Link
            href="/legal/privacy"
            className="text-studio-jaune underline underline-offset-4 transition-opacity hover:opacity-80"
          >
            {t("learnMore")}
          </Link>
        </p>

        {/* Refuse first in the DOM, and styled with the same prominence as
            accept. A refusal that is harder to reach than an acceptance is the
            specific pattern the CNIL calls out, so neither button is a
            low-contrast afterthought. */}
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => answer("denied")}
            className="flex-1 rounded-full border border-studio-jaune/70 px-4 py-2 font-body text-xs tracking-luxe text-studio-jaune transition-colors hover:bg-studio-jaune/15 sm:flex-none"
          >
            {t("declineButton")}
          </button>
          <button
            type="button"
            onClick={() => answer("granted")}
            className="flex-1 rounded-full bg-studio-jaune px-4 py-2 font-body text-xs tracking-luxe text-studio-violet transition-opacity hover:opacity-90 sm:flex-none"
          >
            {t("acceptButton")}
          </button>
        </div>
      </div>
    </div>
  );
}
