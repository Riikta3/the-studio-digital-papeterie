"use client";

import { useTranslations } from "next-intl";

/**
 * Footer link that reopens the consent banner.
 *
 * Required, not a nicety: consent has to be as easy to withdraw as it was to
 * give, and once the banner has been answered it never shows itself again.
 * Without this there would be no way back to the choice.
 *
 * Its own client component so the footer — a Server Component that renders on
 * every page — does not have to become one for a single button.
 */
export function CookieSettingsLink() {
  const t = useTranslations("CookieConsent");

  return (
    <button
      type="button"
      onClick={() =>
        window.dispatchEvent(new Event("studio:consent-reopen"))
      }
      className="text-start font-body text-sm text-studio-jaune hover:text-white"
    >
      {t("reopen")}
    </button>
  );
}
