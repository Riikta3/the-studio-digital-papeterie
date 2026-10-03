"use client";

import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";

import { Reveal } from "../../reveal";
import { slot } from "../../text";
import type { InvitationData } from "../../types";

/**
 * The four units, as keys — never as labels: each label is an ICU plural of the
 * catalogue ("1 jour", "2 jours").
 */
const UNITS = [
  { key: "days", label: "unitDays" },
  { key: "hours", label: "unitHours" },
  { key: "minutes", label: "unitMinutes" },
  { key: "seconds", label: "unitSeconds" },
] as const;

type Remaining = Record<(typeof UNITS)[number]["key"], number>;

/** A count that takes the plural form in every language, for the labels under the placeholders. */
const PLACEHOLDER_COUNT = 10;

/** Ticks once a second while the section is mounted. */
function subscribe(notify: () => void) {
  const timer = window.setInterval(notify, 1000);
  return () => window.clearInterval(timer);
}

/** The current second, whole: a snapshot must not change between two reads inside one second. */
const readSecond = () => Math.floor(Date.now() / 1000) * 1000;

/** The server has no clock worth printing. */
const readServer = () => null;

/**
 * Time left to the ceremony, or null on the server and during hydration.
 *
 * The clock is the browser's only: the server and the hydrating client both
 * print the placeholders, and the figures replace them right after — instead of
 * two renders disagreeing on a timestamp, which is a hydration mismatch.
 */
function useRemaining(startsAt: string): Remaining | null {
  const target = new Date(startsAt).getTime();
  const now = useSyncExternalStore<number | null>(subscribe, readSecond, readServer);

  if (now === null || Number.isNaN(target)) return null;
  const gap = Math.max(0, target - now);
  return {
    days: Math.floor(gap / 86_400_000),
    hours: Math.floor((gap % 86_400_000) / 3_600_000),
    minutes: Math.floor((gap % 3_600_000) / 60_000),
    seconds: Math.floor((gap % 60_000) / 1000),
  };
}

/**
 * The time left, engraved in the ivory page under the letter: four numerals in
 * the display face, pressed into the paper, between gold hairlines.
 *
 * A screen reader hears one sentence ("Plus que 12 jours, 4 heures et
 * 30 minutes…"), not four numbers changing every second; the engraved figures
 * are for the eye.
 */
export function CountdownSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.chateauRoyal.countdown");
  const remaining = useRemaining(data.event.startsAt);

  const label = remaining
    ? t("remaining", { days: remaining.days, hours: remaining.hours, minutes: remaining.minutes })
    : t("label");

  return (
    <section className="cr-countdown" id="cr-countdown" data-editor-section="countdown">
      <Reveal as="div" className="cr-countdown-inner reveal" revealedClass="visible" threshold={0.2}>
        <span className="section-eyebrow">{slot(data, "countdown.eyebrow") ?? t("eyebrow")}</span>
        <div className="cr-count" role="timer" aria-label={label}>
          {UNITS.map(({ key, label: unitLabel }) => {
            // Before the figures arrive the label is the plural ("jours", not "jour"),
            // so it does not change under the placeholder when they do.
            const count = remaining?.[key] ?? PLACEHOLDER_COUNT;
            return (
              <div className="cr-count-unit" key={key} aria-hidden="true">
                <strong>{remaining ? String(count).padStart(2, "0") : "––"}</strong>
                <span>{t(unitLabel, { count })}</span>
              </div>
            );
          })}
        </div>
        <p className="cr-countdown-note">{slot(data, "countdown.note") ?? t("note")}</p>
      </Reveal>
    </section>
  );
}
