import { useLocale, useTranslations } from "next-intl";

import { formatDateRange, formatDottedDate, heroDates, weddingSpan } from "../../date-range";
import type { InvitationData } from "../../types";

/**
 * The date the couple wrote in the hero tab's "displayed date" field, if they
 * wrote one. `heroDates` keeps a rewritten label and otherwise re-derives the
 * dotted date in the page's language, so a label that differs from that derived
 * date is the couple's own.
 */
function writtenDate(data: InvitationData, locale: string): string | null {
  const { dotted } = heroDates(data, locale);
  const derived = formatDottedDate(data.event.startsAt.slice(0, 10), { locale });
  return dotted && dotted !== derived ? dotted : null;
}

/**
 * Hero — a château that alternates between day and night.
 *
 * The two scenes, the shade and the copy are the designer's markup: the sheet
 * cross-fades the night scene over the day one, swaps the ink from dark to
 * light and lights the rings in time with it. The names, the dates and the
 * single line the couple may write above the names are the only variable parts.
 */
export function HeroSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.chateauRoyal.hero");
  const locale = useLocale();
  const { partner1, partner2 } = data.couple;

  // The span of the wedding ("19–20 June 2027"), unless the couple wrote their own.
  const span = weddingSpan(data);
  const prelude =
    writtenDate(data, locale) ?? (span ? formatDateRange(span.start, span.end, { locale }) : null);
  const kicker = data.copy?.heroKicker?.trim();

  return (
    <section
      className="hero"
      aria-label={t("label", { partner1, partner2 })}
      data-editor-section="hero"
    >
      <div className="scene day" />
      <div className="scene night" />
      <div className="hero-shade" />
      <div className="hero-copy">
        {prelude ? <span className="hero-prelude">{prelude}</span> : null}
        <div className="hero-rule">
          <i />
          <svg className="hero-rings" viewBox="0 0 64 64" aria-hidden="true">
            <circle cx="24" cy="36" r="12" />
            <circle cx="40" cy="36" r="12" />
            <path d="m24 18 4-6 4 6-4 3z" />
          </svg>
          <i />
        </div>
        <div className="hero-title">
          <span>{partner1}</span>
          <em>&amp;</em>
          <span>{partner2}</span>
        </div>
        {/* The hero tab's "sur-titre". The stylesheet keeps a `.hero-place` line for
            exactly this spot — one tracked line under the names. */}
        {kicker ? <div className="hero-place">{kicker}</div> : null}
      </div>
    </section>
  );
}
