"use client";

import { useEffect, useState } from "react";

const UNITS = ["jours", "heures", "minutes", "secondes"] as const;

/**
 * Countdown to the ceremony.
 *
 * `now` stays `null` until the client mounts so the server and the first client
 * render agree on zeroes rather than disagreeing on a timestamp — the source
 * rendered the live value immediately and produced a hydration mismatch on
 * every load.
 */
export function CountdownClock({ startsAt }: { startsAt: string }) {
  const target = new Date(startsAt).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const distance = now === null || Number.isNaN(target) ? 0 : Math.max(0, target - now);
  const remaining = {
    jours: Math.floor(distance / 86400000),
    heures: Math.floor(distance / 3600000) % 24,
    minutes: Math.floor(distance / 60000) % 60,
    secondes: Math.floor(distance / 1000) % 60,
  };

  return (
    <div className="countdown">
      {UNITS.map((unit) => (
        <div key={unit}>
          <strong>{String(remaining[unit]).padStart(2, "0")}</strong>
          <span>{unit}</span>
        </div>
      ))}
    </div>
  );
}
