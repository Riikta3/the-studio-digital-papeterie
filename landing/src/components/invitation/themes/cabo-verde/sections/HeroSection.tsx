import { useLocale, useTranslations } from "next-intl";

import { heroDates } from "../../date-range";
import { ScrollToButton } from "../../scroll-to";
import { slot } from "../../text";
import type { InvitationData } from "../../types";

import { Art } from "./Art";

/**
 * Hero — a beach at sunset, the names set over it.
 *
 * The first four children are the painted sky, the sun and the horizon: empty
 * elements the stylesheet fills and animates (a 24-second loop in which the sun
 * sets, the sky warms and three boats leave the bay). The stamp along the top
 * edge is drawn by the stylesheet too, from the `--cv-stamp` custom property the
 * root sets, so it is not rendered here.
 */
export function HeroSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.caboVerde.hero");
  const locale = useLocale();
  const { couple, venue, copy } = data;

  const date = heroDates(data, locale).dotted;
  const place = [venue.name, venue.city].filter(Boolean).join(" · ");

  return (
    <section className="hero paper-panel" data-editor-section="hero">
      <div className="hero-bg" aria-hidden="true" />
      <div className="hero-sunset" aria-hidden="true" />
      <div className="hero-sun" aria-hidden="true" />
      <div className="hero-horizon-mask" aria-hidden="true" />

      <div className="hero-copy">
        <p className="eyebrow">{copy?.heroKicker || t("eyebrow")}</p>
        <h1>
          <span>{couple.partner1}</span>
          <em>&amp;</em>
          <span>{couple.partner2}</span>
        </h1>
        {date ? <p className="date">{date}</p> : null}
        {place ? <p className="place">{place}</p> : null}
      </div>

      {/* The first view: the boats load at once, unlike the art further down. */}
      <div className="hero-boats" aria-hidden="true">
        <Art eager className="hero-boat boat-one" file="hero-boat-1-v19" />
        <Art eager className="hero-boat boat-two" file="hero-boat-2-v19" />
        <Art eager className="hero-boat boat-three" file="hero-boat-3-v19" />
      </div>

      <ScrollToButton target="#cv-welcome" className="scroll-cue">
        {slot(data, "hero.cta") ?? t("cta")} <span aria-hidden="true">↓</span>
      </ScrollToButton>
    </section>
  );
}
