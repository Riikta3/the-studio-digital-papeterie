import { ArrowDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { heroDates } from "../../date-range";
import { ScrollToButton } from "../../scroll-to";
import { Lines, slot } from "../../text";
import type { InvitationData } from "../../types";

import { FOLIAGE_LIGHTS } from "./foliage-lights";

/**
 * The embroidered villa, the couple's names over the linen above it, and the
 * lights twinkling on the trees.
 *
 * The designer's markup, child for child: the stylesheet addresses it. Three of
 * those children (`.hero-shade`, `.hero-glint`, `.pearl-orbit`) are hidden by
 * the designer's own final cascade; they stay so that a re-port of a newer
 * stylesheet needs no change here.
 *
 * Not drawn, because the final look hides what they drive: the designer's
 * pointer-follow glint (`onPointerMove` on the section, moving `.hero-glint`).
 */
export function HeroSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.mareAlta.hero");
  const locale = useLocale();

  const { dotted, spelled } = heroDates(data, locale);
  const place = [data.venue.city, data.venue.country].filter(Boolean).join(" · ");
  const monogram = data.couple.monogram?.trim();
  const { partner1, partner2 } = data.couple;

  return (
    <section className="hero" id="ma-top" data-editor-section="hero">
      {/* eslint-disable-next-line @next/next/no-img-element -- the hero is the page's largest image, sized and cropped by CSS. */}
      <img
        src="/themes/mare-alta/embroidered-hero-no-curtains-v4.webp"
        alt={t("imageAlt")}
        fetchPriority="high"
      />
      <div className="hero-shade" />
      <svg
        className="hero-tree-lights"
        viewBox="0 0 1024 1536"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <g className="foliage-lights">
          {FOLIAGE_LIGHTS.map(([cx, cy, r]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
          ))}
        </g>
      </svg>
      <div className="hero-glint" />
      <div className="hero-topline">
        {dotted ? <span>{dotted}</span> : null}
        {/* The monogram the couple wrote, between the date and the place so the
            designer's rule that drops the place on a phone still drops the place. */}
        {monogram ? (
          <span className="ma-hero-mark" aria-hidden="true">
            {monogram}
          </span>
        ) : null}
        {place ? <span className="ma-hero-place">{place}</span> : null}
      </div>
      <div className="hero-copy">
        <p className="eyebrow light">{data.copy?.heroKicker ?? t("eyebrow")}</p>
        <h1>
          <span>{partner1}</span>
          <i>&amp;</i>
          <span>{partner2}</span>
        </h1>
        {spelled ? <p className="hero-date">{spelled}</p> : null}
        {data.copy?.announcement ? (
          <p className="ma-announcement">
            <Lines text={data.copy.announcement} />
          </p>
        ) : null}
      </div>
      <div className="pearl-orbit" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      {/* "Discover" leads to whatever follows the hero: the countdown, or the next
          section the wedding has when it did not buy one. */}
      <ScrollToButton target=".hero ~ *" className="scroll-cue">
        <span>{slot(data, "hero.cta") ?? t("cta")}</span>
        <ArrowDown size={18} />
      </ScrollToButton>
    </section>
  );
}
