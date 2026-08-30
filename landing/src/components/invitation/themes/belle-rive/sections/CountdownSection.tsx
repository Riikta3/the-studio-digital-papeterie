"use client";

import { useEffect, useState } from "react";

import type { InvitationData } from "../../types";
import { Reveal } from "../Reveal";

const UNITS = ["jours", "heures", "minutes", "secondes"] as const;

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
    <section className="panel pearled" id="br-count">
      <Reveal>
        <p className="eyebrow">Compte à rebours</p>
        <h2>
          Nous avons hâte
          <br />
          de célébrer avec vous
        </h2>
      </Reveal>

      <Reveal delay={70}>
        <div className="count">
          {UNITS.map((unit) => (
            <div key={unit}>
              <b>{String(remaining[unit]).padStart(2, "0")}</b>
              <small>{unit}</small>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
