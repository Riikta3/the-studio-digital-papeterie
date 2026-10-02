import { useTranslations } from "next-intl";

import type { WeddingEvent } from "../../types";

/**
 * What to call one of the wedding's events when the couple left its name blank:
 * "Dîner de bienvenue", "Brunch"… A name they wrote always wins over these.
 */
export function useEventKindNames(): Record<WeddingEvent["kind"], string> {
  const t = useTranslations("Invitation.mareAlta.timeline");

  return {
    "welcome-dinner": t("kindWelcomeDinner"),
    "wedding-day": t("kindWeddingDay"),
    party: t("kindParty"),
    brunch: t("kindBrunch"),
  };
}
