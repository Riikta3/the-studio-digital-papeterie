"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";

import { heroDates } from "../../date-range";
import { slot } from "../../text";
import type { InvitationData } from "../../types";

import { dayMonth } from "../dates";
import { Art } from "./Art";
import { Section } from "./Section";
import { twoLines } from "./Title";

/**
 * The four units, as keys — never as labels: the label is an ICU plural of the
 * catalogue ("1 jour", "2 jours"), and the number of digits is the designer's
 * (a three-digit day counter, two for the rest).
 */
const UNITS = [
  { key: "days", label: "unitDays", digits: 3 },
  { key: "hours", label: "unitHours", digits: 2 },
  { key: "minutes", label: "unitMinutes", digits: 2 },
  { key: "seconds", label: "unitSeconds", digits: 2 },
] as const;

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
 * Time left to the ceremony, or null on the server and in the first client
 * render.
 *
 * `now` comes from the browser's clock only: the server and the hydrating
 * client both print placeholders, then the real figures replace them — instead
 * of disagreeing on a timestamp, which is a hydration mismatch on every load.
 */
function useRemaining(startsAt: string) {
  const target = new Date(startsAt).getTime();
  const now = useSyncExternalStore<number | null>(subscribe, readSecond, readServer);

  if (now === null || Number.isNaN(target)) return null;
  const gap = Math.max(0, target - now);
  return {
    days: Math.floor(gap / 86400000),
    hours: Math.floor((gap % 86400000) / 3600000),
    minutes: Math.floor((gap % 3600000) / 60000),
    seconds: Math.floor((gap % 60000) / 1000),
  };
}

export function CountdownSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.caboVerde.countdown");
  const locale = useLocale();
  const remaining = useRemaining(data.event.startsAt);

  const until = dayMonth(data.event.startsAt, locale);
  const { first, rest } = twoLines(slot(data, "countdown.title") ?? `${t("titleLine1")}\n${t("titleLine2")}`);
  const eyebrow = [slot(data, "countdown.until") ?? t("until"), until].filter(Boolean).join(" ");
  const date = heroDates(data, locale).dotted;

  return (
    <Section className="countdown" editorSection="countdown">
      <div className="count-top">
        <p className="eyebrow">{eyebrow}</p>
        {date ? <span>{date}</span> : null}
      </div>
      <h2 className="motion-title">
        <span className="count-title-line">{first}</span>
        {rest ? <em>{rest}</em> : null}
      </h2>
      <div className="count-grid" role="group" aria-label={t("label")}>
        {UNITS.map(({ key, label, digits }) => {
          const value = remaining ? String(remaining[key]).padStart(digits, "0") : "0".repeat(digits);
          return (
            <div key={key}>
              {/* A new key per value remounts the number, which replays the designer's flip. */}
              <strong key={value} className={remaining ? "digit-flip" : undefined}>
                {value}
              </strong>
              <span>{t(label, { count: remaining?.[key] ?? 0 })}</span>
            </div>
          );
        })}
      </div>
      <p className="count-caption">{slot(data, "countdown.caption") ?? t("caption")}</p>
      <Art className="wedding-rings countdown-rings" file="wedding-rings-v22" />
    </Section>
  );
}
