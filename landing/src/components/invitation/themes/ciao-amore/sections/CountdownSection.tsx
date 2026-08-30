"use client";

import { useEffect, useState } from "react";

import type { InvitationData } from "../../types";

const UNITS = ["jours", "heures", "minutes", "secondes"] as const;

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
    return { jours: 0, heures: 0, minutes: 0, secondes: 0 };
  }

  const distance = Math.max(0, target - now);
  return {
    jours: Math.floor(distance / 86400000),
    heures: Math.floor((distance / 3600000) % 24),
    minutes: Math.floor((distance / 60000) % 60),
    secondes: Math.floor((distance / 1000) % 60),
  };
}

export function CountdownSection({ data }: { data: InvitationData }) {
  const remaining = useRemaining(data.event.startsAt);

  return (
    <section id="ca-compte" className="paper countdown-section">
      <span className="decor-rays" aria-hidden="true" />
      <p className="eyebrow">La dolce vita commence dans</p>
      <h2>
        Chaque seconde
        <br />
        nous rapproche de vous
      </h2>
      <div className="countdown">
        {UNITS.map((unit) => (
          <div key={unit}>
            <strong>{String(remaining[unit]).padStart(2, "0")}</strong>
            <span>{unit}</span>
          </div>
        ))}
      </div>
      {data.copy?.dateSpelled ? <p className="date-script">{data.copy.dateSpelled}</p> : null}
    </section>
  );
}
