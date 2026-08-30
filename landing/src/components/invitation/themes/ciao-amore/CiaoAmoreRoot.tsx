import type { InvitationData, ModuleId } from "../types";

// Order matters: `ciao-amore.css` is generated from the source theme, and
// `responsive.css` layers the wider breakpoints on top of it.
import "./ciao-amore.css";
import "./responsive.css";

import { CountdownSection } from "./sections/CountdownSection";
import { DayTwoSection } from "./sections/DayTwoSection";
import { DressCodeSection } from "./sections/DressCodeSection";
import { FaqSection } from "./sections/FaqSection";
import { FooterSection } from "./sections/FooterSection";
import { HeroSection } from "./sections/HeroSection";
import { PlaylistSection } from "./sections/PlaylistSection";
import { RsvpSection } from "./sections/RsvpSection";
import { ScheduleSection } from "./sections/ScheduleSection";
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
export function CiaoAmoreRoot({ data }: { data: InvitationData }) {
  // No module list at all means "render everything the data supports", which is
  // what the demo route and the live preview want.
  const enabled = data.modules;
  const has = (id: ModuleId) => !enabled || enabled.includes(id);

  return (
    <main className={`theme-ciao-amore ${ciaoAmoreFontVars}`}>
      <HeroSection data={data} />

      {has("countdown") ? <CountdownSection data={data} /> : null}
      {has("timeline") ? <ScheduleSection data={data} /> : null}
      {has("timeline") ? <DayTwoSection data={data} /> : null}
      {has("dress-code") ? <DressCodeSection data={data} /> : null}
      {has("map") ? <VenueSection data={data} /> : null}
      {has("accommodation") ? <StaysSection data={data} /> : null}
      {has("playlist") ? <PlaylistSection data={data} /> : null}
      {has("faq") ? <FaqSection data={data} /> : null}
      {has("rsvp") ? <RsvpSection data={data} /> : null}

      <FooterSection data={data} />
    </main>
  );
}
