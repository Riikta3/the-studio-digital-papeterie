import { Fragment, type ReactNode } from "react";

import type { InvitationData, ModuleId } from "../types";

// Order matters: `blanc-couture.css` is generated from the source theme, and
// `responsive.css` layers the integration fixes and wider breakpoints on top.
import "./blanc-couture.css";
import "./responsive.css";

import { blancCoutureFontVars } from "./fonts";
import { CarpoolSection } from "./sections/CarpoolSection";
import { DressCodeSection } from "./sections/DressCodeSection";
import { FaqSection } from "./sections/FaqSection";
import { FooterSection } from "./sections/FooterSection";
import { HeroSection } from "./sections/HeroSection";
import { PlaylistSection } from "./sections/PlaylistSection";
import { ProgrammeSection } from "./sections/ProgrammeSection";
import { RevealObserver } from "./sections/RevealObserver";
import { RsvpSection } from "./sections/RsvpSection";
import { SaveTheDateSection } from "./sections/SaveTheDateSection";
import { StaysSection } from "./sections/StaysSection";
import { VenueSection } from "./sections/VenueSection";

/** A section that has survived the module filter, not yet given its side. */
type Slot = { key: string; render: (side: "left" | "right") => ReactNode };

/**
 * "Blanc Couture" — white stationery, gold foil, Villa Ephrussi.
 *
 * The hero and the closing page always render: they carry the couple's names,
 * and an invitation without them is not an invitation. Everything between is
 * gated on `data.modules`, so a wedding only shows what it actually bought.
 *
 * Every rule in `blanc-couture.css` is scoped under `.theme-blanc-couture`,
 * which is why this wrapper is not optional — without it the theme is unstyled.
 */
export function BlancCoutureRoot({ data }: { data: InvitationData }) {
  // No module list at all means "render everything the data supports", which is
  // what the demo route and the live preview want.
  const enabled = data.modules;
  const has = (id: ModuleId) => !enabled || enabled.includes(id);

  /**
   * The source alternated which side the eyebrow slides in from with
   * `.page:nth-of-type(even)`. That counts rendered elements, so omitting one
   * module flipped every section after it. Sections are collected unrendered
   * here and the alternation is applied over the surviving list, which keeps
   * the rhythm intact for any subset.
   *
   * Carpool is gated on `transport` — the closest module the catalogue has —
   * rather than on a `carpool` id, which does not exist in `ModuleId`.
   */
  const slots: Slot[] = [];
  /** Collect a section only when the wedding bought the module behind it. */
  const add = (when: boolean, key: string, render: Slot["render"]) => {
    if (when) slots.push({ key, render });
  };

  add(true, "hero", (side) => <HeroSection data={data} side={side} />);
  add(has("countdown"), "save", (side) => <SaveTheDateSection data={data} side={side} />);
  add(has("map"), "venue", (side) => <VenueSection data={data} side={side} />);
  add(has("timeline"), "programme", (side) => <ProgrammeSection data={data} side={side} />);
  add(has("dress-code"), "dress", (side) => <DressCodeSection data={data} side={side} />);
  add(has("accommodation"), "stays", (side) => <StaysSection data={data} side={side} />);
  add(has("transport"), "carpool", (side) => <CarpoolSection data={data} side={side} />);
  add(has("playlist"), "playlist", (side) => <PlaylistSection data={data} side={side} />);
  add(has("faq"), "faq", (side) => <FaqSection data={data} side={side} />);
  add(has("rsvp"), "rsvp", (side) => <RsvpSection data={data} side={side} />);

  return (
    <main className={`theme-blanc-couture ${blancCoutureFontVars}`}>
      <RevealObserver />
      {slots.map((slot, index) => (
        <Fragment key={slot.key}>{slot.render(index % 2 === 0 ? "left" : "right")}</Fragment>
      ))}
      <FooterSection data={data} />
    </main>
  );
}
