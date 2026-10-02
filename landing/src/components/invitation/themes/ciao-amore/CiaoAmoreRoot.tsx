import { useTranslations } from "next-intl";
import type { CSSProperties } from "react";

import { cssString, slot } from "../text";
import type { InvitationData, ModuleId } from "../types";

// Order matters: `ciao-amore.css` is generated from the source theme, and
// `responsive.css` layers the wider breakpoints on top of it.
import "./ciao-amore.css";
import "./responsive.css";
import "./modules.css";

import { CountdownSection } from "./sections/CountdownSection";
import { DayTwoSection } from "./sections/DayTwoSection";
import { DressCodeSection } from "./sections/DressCodeSection";
import { FaqSection } from "./sections/FaqSection";
import { FooterSection } from "./sections/FooterSection";
import { GallerySection } from "./sections/GallerySection";
import { GiftsSection } from "./sections/GiftsSection";
import { HeroSection } from "./sections/HeroSection";
import { IntroVideoSection } from "./sections/IntroVideoSection";
import { MenuSection } from "./sections/MenuSection";
import { PlaylistSection } from "./sections/PlaylistSection";
import { RsvpSection } from "./sections/RsvpSection";
import { ScheduleSection } from "./sections/ScheduleSection";
import { ScrollTopButton } from "./sections/ScrollTopButton";
import { StaysSection } from "./sections/StaysSection";
import { VenueSection } from "./sections/VenueSection";
import { ciaoAmoreFontVars } from "./fonts";

/**
 * "Ciao Amore" — Amalfi coast, lemons and pastel.
 *
 * The hero and the footer always render: they carry the couple's names, and an
 * invitation without them is not an invitation. Everything between them is
 * gated on `data.modules`, so a wedding only shows what it actually bought.
 *
 * Every rule in `ciao-amore.css` is scoped under `.theme-ciao-amore`, which is
 * why this wrapper element is not optional — without it the theme is unstyled.
 */
/**
 * Words the stylesheet draws with `content:` — the hero's "MATRIMONIO IN
 * ITALIA" watermark, the friezes under the programme. Written into the
 * generated CSS, they announced Italy on every wedding. `modules.css` now reads
 * each from a custom property, set here from the couple's text or the
 * catalogue's default: slot key, catalogue key, custom property.
 */
const DECOR_WORDS = [
  ["hero.watermark", "decor.heroWatermark", "--ca-hero-watermark"],
  ["timeline.introTag", "decor.introTag", "--ca-timeline-intro-tag"],
  ["timeline.archFooter", "decor.archFooter", "--ca-timeline-arch-footer"],
  ["timeline.footer", "decor.timelineFooter", "--ca-timeline-footer"],
  ["playlist.tag", "decor.playlistTag", "--ca-playlist-tag"],
] as const;

export function CiaoAmoreRoot({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.ciaoAmore");
  const decor = Object.fromEntries(
    DECOR_WORDS.map(([key, message, property]) => [property, cssString(slot(data, key) ?? t(message))]),
  ) as CSSProperties;

  // No module list at all means "render everything the data supports", which is
  // what the demo route and the live preview want.
  const enabled = data.modules;
  const has = (id: ModuleId) => !enabled || enabled.includes(id);

  return (
    <main className={`theme-ciao-amore ${ciaoAmoreFontVars}`} style={decor}>
      <HeroSection data={data} />

      {has("intro-video") ? <IntroVideoSection data={data} /> : null}
      {has("countdown") ? <CountdownSection data={data} /> : null}
      {has("timeline") ? <ScheduleSection data={data} /> : null}
      {has("timeline") ? <DayTwoSection data={data} /> : null}
      {has("menu") ? <MenuSection data={data} /> : null}
      {has("dress-code") ? <DressCodeSection data={data} /> : null}
      {/* The transport module has no section of its own here: its modes are
          drawn as the venue's travel directions, so owning either module
          shows the venue. */}
      {has("map") || has("transport") ? <VenueSection data={data} /> : null}
      {has("gallery") ? <GallerySection data={data} /> : null}
      {has("accommodation") ? <StaysSection data={data} /> : null}
      {has("playlist") ? <PlaylistSection data={data} /> : null}
      {has("faq") ? <FaqSection data={data} /> : null}
      {has("rsvp") ? (
        <RsvpSection
          // Outside a real invitation (the editor's preview, the demo) a reply
          // only flips the form to its thank-you state — which then hid every
          // option the couple went on to change. Their options are the key, so
          // a change shows a fresh form. A real invitation keeps one form.
          key={data.weddingId ? "rsvp" : JSON.stringify(data.rsvp ?? {})}
          data={data}
        />
      ) : null}
      {has("gift-list") ? <GiftsSection data={data} /> : null}

      <FooterSection data={data} />

      {/* Fixed, so its position in the tree is only about reading order: last,
          after the content it lets you escape. It watches the hero itself. */}
      <ScrollTopButton />
    </main>
  );
}
