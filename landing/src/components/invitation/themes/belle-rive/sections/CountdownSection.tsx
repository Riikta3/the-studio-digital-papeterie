"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import type { InvitationData } from "../../types";
import { Reveal } from "../Reveal";

/**
 * The four units, as keys — never as labels.
 *
 * These used to be the French plural words (`["jours", "heures", …]`) doing
 * double duty: object keys into the remaining time AND the text printed under
 * each number. That made the labels untranslatable and printed "01 jours" on
 * the last day, since a fixed plural has no singular to fall back to.
 *
 * The keys are English and internal now; the labels come from the message
 * catalogue as ICU plurals, so "1 jour" / "2 jours" follows the locale's own
 * rule rather than a hard-coded "s".
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
 * `now` stays `null` until the client mounts so the server and the first client
 * render agree on zeroes rather than disagreeing on a timestamp — without that
 * guard React reports a hydration mismatch on every load.
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
  const t = useTranslations("Invitation.belleRive.countdown");
  const remaining = useRemaining(data.event.startsAt);

  return (
    <section className="panel pearled" id="br-count">
      <Reveal>
        <p className="eyebrow">{t("eyebrow")}</p>
        <h2>
          {t("titleLine1")}
          <br />
          {t("titleLine2")}
        </h2>
      </Reveal>

      <Reveal delay={70}>
        <div className="count">
          {UNITS.map(({ key, label }) => (
            <div key={key}>
              <b>{String(remaining[key]).padStart(2, "0")}</b>
              <small>{t(label, { count: remaining[key] })}</small>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
