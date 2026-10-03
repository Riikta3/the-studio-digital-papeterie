import { useLocale } from "next-intl";
import type { CSSProperties } from "react";

import { formatFrenchDate } from "../format";
import { JsFlag } from "../reveal";
import { monogramOf } from "../monogram";
import { cssString } from "../text";
import type { InvitationData, ModuleId } from "../types";

import "./mare-alta.css";
import "./responsive.css";
import "./modules.css";

import { mareAltaFontVars } from "./fonts";
import { CountdownSection } from "./sections/CountdownSection";
import { PhotosBlock, TableBlock } from "./sections/DayOfSection";
import { DressCodeSection } from "./sections/DressCodeSection";
import { FaqSection } from "./sections/FaqSection";
import { FloatingNav } from "./sections/FloatingNav";
import { FooterSection } from "./sections/FooterSection";
import { GallerySection } from "./sections/GallerySection";
import { GiftsSection } from "./sections/GiftsSection";
import { HeroSection } from "./sections/HeroSection";
import { IntroVideoSection } from "./sections/IntroVideoSection";
import { MenuSection } from "./sections/MenuSection";
import { PlaylistSection } from "./sections/PlaylistSection";
import { RsvpSection } from "./sections/RsvpSection";
import { StaysSection } from "./sections/StaysSection";
import { TimelineSection } from "./sections/TimelineSection";
import { TransportSection } from "./sections/TransportSection";
import { VenueSection } from "./sections/VenueSection";

/**
 * "Maré Alta" — an embroidered garden on linen.
 *
 * The hero and the footer always render: they carry the couple's names. Every
 * section between them is gated on `data.modules`, so a wedding shows only what
 * it bought. The Jour J blocks are gated on `data.dayOf` instead — the Jour J is
 * not a module.
 *
 * The root is the full-width sage backdrop (the designer's `body`); the column
 * inside it is the designer's `main` (720px, ivory, shadowed). The pipeline kept
 * them apart on purpose — see `themes:port-css`.
 *
 * Two words of the stylesheet are drawn with `content:` (the menu card's crest
 * and its footer line). The pipeline turned them into custom properties; they
 * are set here from the couple's data. The monogram is also lettered on the
 * travel notebook's luggage tag (`responsive.css`), which the designer had
 * embroidered with the demo couple's initials.
 */
export function MareAltaRoot({ data }: { data: InvitationData }) {
  const locale = useLocale();

  const enabled = data.modules;
  const has = (id: ModuleId) => !enabled || enabled.includes(id);

  const day = formatFrenchDate(data.event.startsAt.slice(0, 10), { locale });
  const menuFooter = data.menu?.footer?.length
    ? data.menu.footer.join(" · ")
    : [data.venue.name, day].filter(Boolean).join(" · ");

  const monogram = monogramOf(data.couple, " · ");
  // Embroidered on the luggage tag, the initials sit close around their dot ("S·M"), as the designer stitched them.
  const tagMonogram = monogram.replace(/\s*·\s*/g, "·");

  const decor = {
    "--ma-menu-monogram": cssString(monogram),
    "--ma-menu-footer": cssString(menuFooter.toLocaleUpperCase(locale)),
    // How many characters the monogram has: the crests make room for a long one.
    "--ma-monogram-chars": String(Math.max([...monogram].length, 1)),
    "--ma-tag-monogram": cssString(tagMonogram),
    // The tag sizes its lettering by its own count.
    "--ma-tag-chars": String(Math.max([...tagMonogram].length, 1)),
  } as CSSProperties;

  return (
    <main className={`theme-mare-alta ${mareAltaFontVars}`} data-theme-root="" style={decor}>
      <JsFlag />
      <div className="ma-column">
        {/* The designer's quick links to the place, the programme and the reply, for what the wedding has. */}
        <FloatingNav
          targets={[
            ...(has("map") ? ["#ma-map"] : []),
            ...(has("timeline") ? ["#ma-timeline"] : []),
            ...(has("rsvp") ? ["#ma-rsvp"] : []),
          ]}
        />
        <HeroSection data={data} />
        {has("countdown") ? <CountdownSection data={data} /> : null}
        {/* The couple's film opens what the invitation has to tell, once the hero and the countdown
            (the designer's opening pair) have set the date. */}
        {has("intro-video") ? <IntroVideoSection data={data} /> : null}
        {has("map") ? <VenueSection data={data} /> : null}
        {has("timeline") ? <TimelineSection data={data} /> : null}
        {has("dress-code") ? <DressCodeSection data={data} /> : null}
        {has("accommodation") ? <StaysSection data={data} /> : null}
        {/* The notebook is the venue's directions: owning the map or the transport module shows it. */}
        {has("transport") || has("map") ? <TransportSection data={data} /> : null}
        {has("menu") ? <MenuSection data={data} /> : null}
        {has("playlist") ? <PlaylistSection data={data} /> : null}
        {/* The couple's photographs: a pause after the evening (the menu, the music), before the two
            things the page asks of a guest (a gift, a reply). */}
        {has("gallery") ? <GallerySection data={data} /> : null}
        {has("gift-list") ? <GiftsSection data={data} /> : null}
        {has("rsvp") ? (
          <RsvpSection
            // Outside a real invitation (the editor's preview, the demo) a reply only flips the form
            // to its thank-you state, which then hid every option the couple went on to change. Their
            // options are the key, so a change shows a fresh form; a real invitation keeps one form.
            key={data.weddingId ? "rsvp" : JSON.stringify(data.rsvp ?? {})}
            data={data}
          />
        ) : null}
        {/* The Jour J blocks are not modules: they follow the wedding's own Jour J page. */}
        <PhotosBlock data={data} />
        {has("faq") ? <FaqSection data={data} /> : null}
        <TableBlock data={data} />
        <FooterSection data={data} />
      </div>
    </main>
  );
}
