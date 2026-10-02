import { Car, Plane, Shell, Sun, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { slot } from "../../text";
import type { InvitationData } from "../../types";

import { Section } from "./Section";
import { RhythmTitle, SectionTitle } from "./SectionTitle";

/** The designer's four icons, in order; a fifth mode starts over. */
const ICONS: readonly LucideIcon[] = [Plane, Car, Sun, Shell];

/**
 * The travel notebook: one card per way of getting there, from the venue's
 * `access` lines — a mode, a title, a few words, and a link when the couple
 * published one (the carpool board, a transfer booking).
 *
 * The designer's page ended on an "open the full guide" button that led
 * nowhere; it is not drawn. A venue with no directions has no notebook.
 */
export function TransportSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.mareAlta.transport");

  const access = (data.venue.access ?? []).filter(
    (entry) => entry.mode.trim() || entry.details.some((line) => line.trim()) || entry.link,
  );
  if (access.length === 0) return null;

  return (
    <Section id="ma-transport" className="travel-guide paper-section" editorSection="transport">
      <SectionTitle
        rhythm
        eyebrow={slot(data, "transport.eyebrow") ?? t("eyebrow")}
        title={<RhythmTitle text={slot(data, "transport.title") ?? `${t("titleLine1")}\n${t("titleLine2")}`} />}
        intro={slot(data, "transport.intro") ?? t("intro")}
      />
      <div className="travel-flight-decor" role="img" aria-label={t("decorLabel")}>
        <i className="travel-object passport" />
        <i className="travel-object airport-stamps" />
        <i className="travel-object luggage-tag" />
        <i className="travel-object flying-plane" />
        <span className="flight-path" />
      </div>
      <div className="travel-guide-grid">
        {access.map((entry, index) => {
          const Icon = ICONS[index % ICONS.length]!;
          const [title, ...rest] = entry.details.map((line) => line.trim()).filter(Boolean);
          const text = rest.join(" ");

          return (
            <article key={`${index}-${entry.mode}`}>
              <Icon />
              {entry.mode.trim() ? <span>{entry.mode}</span> : null}
              {title ? <h3>{title}</h3> : null}
              {text ? <p>{text}</p> : null}
              {entry.link ? (
                <a className="ma-card-link" href={entry.link.url} target="_blank" rel="noreferrer">
                  {entry.link.label || t("open")}
                </a>
              ) : null}
            </article>
          );
        })}
      </div>
    </Section>
  );
}
