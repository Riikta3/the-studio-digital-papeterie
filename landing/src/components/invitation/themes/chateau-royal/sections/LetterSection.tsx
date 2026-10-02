import { useLocale, useTranslations } from "next-intl";

import { weddingSpan } from "../../date-range";
import { monogramOf } from "../../monogram";
import { Reveal } from "../../reveal";
import { slot } from "../../text";
import type { InvitationData } from "../../types";
import { weekdayRange } from "../dates";

import { TitleLines } from "./TitleLines";

/**
 * The letter that follows the hero: the monogram, the invitation line, the
 * two-line title and the date, on a ruled page with four corner marks.
 *
 * The veil of rings (`alliances-voile`) is the theme's own art and appears
 * whatever the couple's data says.
 */
export function LetterSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.chateauRoyal.letter");
  const locale = useLocale();

  const span = weddingSpan(data);
  const date = span ? weekdayRange(span.start, span.end, locale) : null;
  const monogram = monogramOf(data.couple, " · ");
  const announcement = data.copy?.announcement?.trim();

  return (
    <section
      className={announcement ? "letter cr-has-announcement" : "letter"}
      id="cr-invitation"
      data-editor-section="hero"
    >
      <Reveal as="div" className="letter-inner reveal" revealedClass="visible" threshold={0.12}>
        {monogram ? <div className="letter-top">✦ &nbsp; {monogram} &nbsp; ✦</div> : null}
        <p className="letter-small">{slot(data, "hero.letterIntro") ?? t("intro")}</p>
        <h1>
          <TitleLines
            text={slot(data, "hero.letterTitle") ?? `${t("titleLine1")}\n${t("titleLine2")}`}
          />
        </h1>
        <div className="letter-divider">
          <span>✣</span>
        </div>
        {date ? <p className="letter-date">{date}</p> : null}
        {/* The hero tab's announcement, under the date. */}
        {announcement ? <p className="letter-small cr-announcement">{announcement}</p> : null}
      </Reveal>
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative, positioned by CSS. */}
      <img className="marriage-still" src="/themes/chateau-royal/alliances-voile.webp" alt="" loading="lazy" />
      <div className="letter-corners" aria-hidden="true">
        <span>✧</span>
        <span>✧</span>
        <span>✧</span>
        <span>✧</span>
      </div>
    </section>
  );
}
