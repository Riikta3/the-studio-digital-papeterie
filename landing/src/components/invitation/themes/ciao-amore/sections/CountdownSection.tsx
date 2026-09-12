"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import type { InvitationData } from "../../types";

/**
 * The four units, as keys — never as labels.
 *
 * These used to be the French plural words (`["jours", "heures", …]`) doing
 * double duty: object keys into the remaining time AND the text printed under
 * each number. That made the labels untranslatable and printed "01 jours" on
 * the last day, since a fixed plural has no singular to fall back to.
 *
 * The keys are English and internal now; the labels come from the message
 * catalogue as ICU plurals, so "1 jour" / "2 jours" is the locale's rule
 * rather than a hard-coded "s".
 */
const UNITS = [
  { key: "days", label: "unitDays" },
  { key: "hours", label: "unitHours" },
  { key: "minutes", label: "unitMinutes" },
  { key: "seconds", label: "unitSeconds" },
] as const;

/**
 * Countdown to the ceremony.
 *
 * `now` starts as `null` and is only filled in on the client, so the server
 * and the first client render agree on zeroes instead of disagreeing on a
 * timestamp. Without that guard React reports a hydration mismatch on every
 * load.
 */
function useRemaining(startsAt: string) {
  const target = new Date(startsAt).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (now === null || Number.isNaN(target)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const distance = Math.max(0, target - now);
  return {
    days: Math.floor(distance / 86400000),
    hours: Math.floor((distance / 3600000) % 24),
    minutes: Math.floor((distance / 60000) % 60),
    seconds: Math.floor((distance / 1000) % 60),
  };
}

export function CountdownSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.ciaoAmore.countdown");
  const remaining = useRemaining(data.event.startsAt);

  return (
    <section id="ca-compte" className="paper countdown-section">
      <span className="decor-rays" aria-hidden="true" />
      <p className="eyebrow">{t("eyebrow")}</p>
      <h2>
        {t("titleLine1")}
        <br />
        {t("titleLine2")}
      </h2>
      <div className="countdown">
        {UNITS.map(({ key, label }) => (
          <div key={key}>
            <strong>{String(remaining[key]).padStart(2, "0")}</strong>
            <span>{t(label, { count: remaining[key] })}</span>
          </div>
        ))}
      </div>
      {data.copy?.dateSpelled ? <p className="date-script">{data.copy.dateSpelled}</p> : null}
    </section>
  );
}
