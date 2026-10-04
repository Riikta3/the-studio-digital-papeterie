import { useLocale, useTranslations } from "next-intl";
import type { CSSProperties } from "react";

import { JsFlag } from "../reveal";
import { monogramOf } from "../monogram";
import { cssString, slot } from "../text";
import type { InvitationData, ModuleId } from "../types";

// Order matters: `cabo-verde.css` is generated from the designer's sheet,
// `responsive.css` layers the safety nets and the fixes on top of it, and
// `modules.css` draws the sections the designer did not (and the motion added
// to the ones he did).
import "./cabo-verde.css";
import "./responsive.css";
import "./modules.css";

import { caboVerdeFontVars } from "./fonts";
import { CountdownSection } from "./sections/CountdownSection";
import { DressSection } from "./sections/DressSection";
import { FaqSection } from "./sections/FaqSection";
import { FooterSection } from "./sections/FooterSection";
import { GallerySection } from "./sections/GallerySection";
import { GiftsSection } from "./sections/GiftsSection";
import { GuestbookSection } from "./sections/GuestbookSection";
import { HeroSection } from "./sections/HeroSection";
import { IntroVideoSection } from "./sections/IntroVideoSection";
import { ItinerarySection } from "./sections/ItinerarySection";
import { MenuSection } from "./sections/MenuSection";
import { ParallaxShift } from "./sections/ParallaxShift";
import { PlaylistSection } from "./sections/PlaylistSection";
import { RsvpSection } from "./sections/RsvpSection";
import { StaySection } from "./sections/StaySection";
import { TravelSection } from "./sections/TravelSection";
import { VenueSection } from "./sections/VenueSection";
import { WelcomeSection } from "./sections/WelcomeSection";

/**
 * "Cabo Verde" — a beach wedding in a painted card.
 *
 * The root is the page backdrop (the designer's `body`); the column inside it is
 * the designer's `main`. Three words of the stylesheet are drawn with `content:`
 * (the stamp on the hero, a place line and a monogram on dead selectors); the
 * pipeline turned them into custom properties, set here from the couple's data.
 *
 * The hero and the footer always render: they carry the couple's names. Every
 * section between them is gated on `data.modules`.
 */
export function CaboVerdeRoot({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.caboVerde");
  const locale = useLocale();
  const enabled = data.modules;
  const has = (id: ModuleId) => !enabled || enabled.includes(id);

  const place = [data.venue.city, data.venue.country].filter(Boolean).join(" · ");
  const decor = {
    "--cv-place": cssString(place.toLocaleUpperCase(locale)),
    "--cv-stamp": cssString((slot(data, "hero.stamp") ?? t("hero.stamp")).toLocaleUpperCase(locale)),
    "--cv-monogram": cssString(monogramOf(data.couple, "&")),
  } as CSSProperties;

  return (
    <main className={`theme-cabo-verde ${caboVerdeFontVars}`} data-theme-root="" style={decor}>
      <JsFlag />
      <ParallaxShift />
      <div className="cv-column">
        <HeroSection data={data} />
        <WelcomeSection data={data} />
        {/* The couple speak first: their announcement, their film, their
            album — then the countdown and the practical pages. */}
        {has("intro-video") ? <IntroVideoSection data={data} /> : null}
        {has("gallery") ? <GallerySection data={data} /> : null}
        {has("countdown") ? <CountdownSection data={data} /> : null}
        {has("map") ? <VenueSection data={data} /> : null}
        {has("timeline") ? <ItinerarySection data={data} /> : null}
        {/* The dinner follows the programme that announces it. */}
        {has("menu") ? <MenuSection data={data} /> : null}
        {has("dress-code") ? <DressSection data={data} /> : null}
        {has("accommodation") ? <StaySection data={data} /> : null}
        {has("playlist") ? <PlaylistSection data={data} /> : null}
        {/* The guests' words follow the guests' songs: a postcard to the couple,
            kept apart from the gift note's postcard by the practical pages. */}
        {has("guestbook") ? <GuestbookSection data={data} /> : null}
        {/* The travel notebook is the venue's directions: owning the transport
            module or the map shows it (and only when there are directions). */}
        {has("transport") || has("map") ? <TravelSection data={data} /> : null}
        {/* The questions close the practical pages, and the gift note comes
            before the reply so that the RSVP stays the last call. */}
        {has("faq") ? <FaqSection data={data} /> : null}
        {has("gift-list") ? <GiftsSection data={data} /> : null}
        {has("rsvp") ? (
          <RsvpSection
            // Outside a real invitation (the showcase, the editor's preview) a
            // reply only flips the form to its thank-you state, which then hid
            // every option the couple went on to change. Their options are the
            // key, so a change shows a fresh form. A real invitation keeps one.
            key={data.weddingId ? "rsvp" : JSON.stringify(data.rsvp ?? {})}
            data={data}
          />
        ) : null}
        <FooterSection data={data} />
      </div>
    </main>
  );
}
