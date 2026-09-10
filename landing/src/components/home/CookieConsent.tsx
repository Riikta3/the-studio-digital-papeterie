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
import { Link } from "@/navigation";

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
export function CookieConsent() {
  const t = useTranslations("CookieConsent");
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

  if (!visible) return null;

  return (
    // `role="dialog"` rather than `alertdialog`: this interrupts nothing and
    // must not steal focus from a visitor already reading the page. It is not
    // modal either — the site stays usable while it is open, which is itself a
    // compliance point, since refusing must be as easy as accepting and
    // neither may be forced.
    <div
      role="dialog"
      aria-labelledby="cookie-consent-text"
      // Marked so ContactBubble can measure this banner and sit above it: its
      // height depends on the locale's text length, so it cannot be hardcoded.
      data-cookie-banner=""
      className="fixed inset-x-0 bottom-0 z-50 border-t border-studio-lavande/40 bg-white p-4 shadow-[0_-4px_24px_rgba(75,63,114,0.10)] md:p-6"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p
          id="cookie-consent-text"
          className="font-body text-sm leading-relaxed text-studio-violet/80"
        >
          {t("bannerText")}{" "}
          <Link
            href="/legal/privacy"
            className="text-studio-pourpre underline underline-offset-4"
          >
            {t("learnMore")}
          </Link>
        </p>

        {/* Refuse first in the DOM, and styled with the same prominence as
            accept. A refusal that is harder to reach than an acceptance is the
            specific pattern the CNIL calls out, so neither button is a
            low-contrast afterthought. */}
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => answer("denied")}
            className="flex-1 rounded-full border border-studio-lavande px-5 py-2.5 font-body text-sm tracking-luxe text-studio-violet transition-colors hover:bg-studio-lavande/20 md:flex-none"
          >
            {t("declineButton")}
          </button>
          <button
            type="button"
            onClick={() => answer("granted")}
            className="flex-1 rounded-full bg-studio-jaune px-5 py-2.5 font-body text-sm tracking-luxe text-studio-violet transition-opacity hover:opacity-90 md:flex-none"
          >
            {t("acceptButton")}
          </button>
        </div>
      </div>
    </div>
  );
}
