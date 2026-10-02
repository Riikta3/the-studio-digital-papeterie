import { JsFlag } from "../reveal";
import type { InvitationData, ModuleId } from "../types";

import "./chateau-royal.css";
import "./responsive.css";

import { chateauRoyalFontVars } from "./fonts";
import { hasDayTwo } from "./programme";
import { BrunchSection } from "./sections/BrunchSection";
import { FooterSection } from "./sections/FooterSection";
import { HeroSection } from "./sections/HeroSection";
import { LetterSection } from "./sections/LetterSection";
import { MenuSection } from "./sections/MenuSection";
import { PracticalSection } from "./sections/PracticalSection";
import { ProgrammeSection } from "./sections/ProgrammeSection";
import { RsvpSection } from "./sections/RsvpSection";
import { VenueSection } from "./sections/VenueSection";

/**
 * "Château Royal" — a château at the turn of day and night.
 *
 * The hero, the letter and the footer always render: they carry the couple's
 * names. The sections between them are gated on `data.modules`. The programme
 * and the brunch both belong to the `timeline` module (the brunch is its second
 * day); the "small details" grid gathers three modules and gates each group.
 *
 * Full-bleed: the stylesheet's `html`, `body` and `main` rules all landed on
 * this element.
 */
export function ChateauRoyalRoot({ data }: { data: InvitationData }) {
  const enabled = data.modules;
  const has = (id: ModuleId) => !enabled || enabled.includes(id);
  const brunch = has("timeline") && hasDayTwo(data);

  return (
    <main className={`theme-chateau-royal ${chateauRoyalFontVars}`} data-theme-root="">
      <JsFlag />
      <HeroSection data={data} />
      <LetterSection data={data} />
      <div className="transition transition-one" aria-hidden="true">
        <span className="transition-rule" />
        <span className="transition-center">✣</span>
        <span className="transition-rule" />
      </div>
      {has("map") ? <VenueSection data={data} /> : null}
      {has("timeline") ? <ProgrammeSection data={data} /> : null}
      {has("menu") ? <MenuSection data={data} /> : null}
      {/* The fold that carries the eye from the pale pages down to the banquet photograph. */}
      {brunch ? <div className="nightfold" aria-hidden="true" /> : null}
      {brunch ? <BrunchSection data={data} /> : null}
      {/* Three modules feed this grid (dress code, directions, questions): it decides for itself. */}
      <PracticalSection data={data} />
      {has("rsvp") ? (
        <RsvpSection
          // Outside a real invitation (the editor's preview, the demo) a reply only flips the form to
          // its thank-you state, which then hid every option the couple went on to change. Their
          // options are the key, so a change shows a fresh form. A real invitation keeps one form.
          key={data.weddingId ? "rsvp" : JSON.stringify(data.rsvp ?? {})}
          data={data}
        />
      ) : null}
      <FooterSection data={data} />
    </main>
  );
}
