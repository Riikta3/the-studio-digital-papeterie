import type { InvitationData, ModuleId } from "../types";

// Order matters: `belle-rive.css` is generated from the source theme, and
// `responsive.css` layers the wider breakpoints on top of it.
import "./belle-rive.css";
import "./responsive.css";

import { belleRiveFontVars } from "./fonts";
import { ActivitiesSection } from "./sections/ActivitiesSection";
import { CarpoolSection } from "./sections/CarpoolSection";
import { CountdownSection } from "./sections/CountdownSection";
import { DressCodeSection } from "./sections/DressCodeSection";
import { FaqSection } from "./sections/FaqSection";
import { FinaleSection } from "./sections/FinaleSection";
import { GiftsSection } from "./sections/GiftsSection";
import { HeroSection } from "./sections/HeroSection";
import { PlaylistSection } from "./sections/PlaylistSection";
import { ProgramSection } from "./sections/ProgramSection";
import { RsvpSection } from "./sections/RsvpSection";
import { StaysSection } from "./sections/StaysSection";
import { VenueSection } from "./sections/VenueSection";
import type { CarpoolTrip } from "./types";

/**
 * "Belle Rive" — Riviera pearl, olive and gold.
 *
 * The hero and the finale always render: they carry the couple's names, and an
 * invitation without them is not an invitation. Everything between is gated on
 * `data.modules`, so a wedding only shows what it actually bought.
 *
 * Every rule in `belle-rive.css` sits under `.theme-belle-rive`, which is why
 * this wrapper is not optional — without it the theme is unstyled. The source's
 * `main` selector was folded onto this same class by the scoping script, so the
 * element is also what carries the 480px column.
 */
export function BelleRiveRoot({
  data,
  trips = [],
}: {
  data: InvitationData;
  /**
   * Carpooling has no `ModuleId` and so cannot be gated like the rest. It
   * renders only when trips are supplied, which keeps a wedding that never
   * asked for it from getting an empty panel.
   */
  trips?: CarpoolTrip[];
}) {
  // No module list at all means "render everything the data supports", which is
  // what the demo route and the live preview want.
  const enabled = data.modules;
  const has = (id: ModuleId) => !enabled || enabled.includes(id);

  return (
    <main className={`theme-belle-rive ${belleRiveFontVars}`}>
      <HeroSection data={data} />

      {has("countdown") ? <CountdownSection data={data} /> : null}
      {has("map") ? <VenueSection data={data} /> : null}
      {has("timeline") ? <ProgramSection data={data} /> : null}
      {has("timeline") ? <ActivitiesSection data={data} /> : null}
      {has("dress-code") ? <DressCodeSection data={data} /> : null}
      {has("accommodation") ? <StaysSection data={data} /> : null}
      {has("playlist") ? <PlaylistSection data={data} /> : null}
      {trips.length > 0 ? <CarpoolSection trips={trips} /> : null}
      {has("faq") ? <FaqSection data={data} /> : null}
      {has("rsvp") ? <RsvpSection data={data} /> : null}
      {has("gift-list") ? <GiftsSection /> : null}

      <FinaleSection data={data} />
    </main>
  );
}
