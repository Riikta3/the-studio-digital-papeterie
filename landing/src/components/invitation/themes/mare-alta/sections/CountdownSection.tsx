"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, useSyncExternalStore } from "react";

import { slot } from "../../text";
import type { InvitationData } from "../../types";

import { Section } from "./Section";
import { RhythmTitle } from "./SectionTitle";

const UNITS = [
  { key: "days", label: "unitDays" },
  { key: "hours", label: "unitHours" },
  { key: "minutes", label: "unitMinutes" },
  { key: "seconds", label: "unitSeconds" },
] as const;

type Remaining = Record<(typeof UNITS)[number]["key"], number>;

/** A count that takes the plural form in every language, for the "--" placeholders. */
const PLACEHOLDER_COUNT = 10;

const noSubscription = () => () => {};

/** False on the server and during hydration, true once the page is the browser's. */
function useIsClient(): boolean {
  return useSyncExternalStore(noSubscription, () => true, () => false);
}

/**
 * Time left until the ceremony. The server and the hydrating client both print
 * the "--" placeholders (`isClient` is false for both), so they never disagree
 * on a timestamp; the numbers appear right after, and tick every second.
 */
function useRemaining(startsAt: string): Remaining | null {
  const target = new Date(startsAt).getTime();
  const isClient = useIsClient();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (!isClient || Number.isNaN(target)) return null;
  const distance = Math.max(0, target - now);
  return {
    days: Math.floor(distance / 86_400_000),
    hours: Math.floor((distance / 3_600_000) % 24),
    minutes: Math.floor((distance / 60_000) % 60),
    seconds: Math.floor((distance / 1000) % 60),
  };
}

/**
 * The time to the wedding, in four cards.
 *
 * The designer drew a metallic layer on each card, to be scratched away on a
 * canvas. Their final stylesheet hides it (`.scratch-card canvas { display:
 * none }`, in two of its last layers, and so does the live reference): the
 * numbers are on show from the start. The class names stay — the stylesheet
 * addresses them — but nothing is drawn or listened to for a layer that is never
 * visible.
 */
export function CountdownSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.mareAlta.countdown");
  const remaining = useRemaining(data.event.startsAt);

  return (
    <Section id="ma-countdown" className="countdown night-section" editorSection="countdown">
      <p className="eyebrow light">{slot(data, "countdown.eyebrow") ?? t("eyebrow")}</p>
      <h2 className="type-rhythm countdown-title">
        <RhythmTitle text={slot(data, "countdown.title") ?? `${t("titleLine1")}\n${t("titleLine2")}`} />
      </h2>
      <div className="countdown-grid">
        {UNITS.map(({ key, label }) => {
          // Before the numbers arrive the label is the plural ("jours", not "jour"),
          // so it does not change under the "--" when they do.
          const count = remaining?.[key] ?? PLACEHOLDER_COUNT;
          const unit = t(label, { count });
          const value = remaining ? String(count).padStart(2, "0") : "--";
          return (
            // The whole sentence for a screen reader ("12 jours avant le mariage");
            // before mount there is no number to say, only the unit.
            <div
              className="scratch-card"
              key={key}
              role="group"
              aria-label={remaining ? t("cardLabel", { value, unit }) : unit}
            >
              <div className="scratch-value">
                <span>{value}</span>
                <small>{unit}</small>
              </div>
            </div>
          );
        })}
      </div>
      <p className="countdown-note">{slot(data, "countdown.note") ?? t("note")}</p>
    </Section>
  );
}
