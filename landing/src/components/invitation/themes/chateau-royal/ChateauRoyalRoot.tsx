import { JsFlag, Reveal } from "../reveal";
import type { InvitationData, ModuleId } from "../types";

import "./chateau-royal.css";
import "./responsive.css";
import "./modules.css";

import { chateauRoyalFontVars } from "./fonts";
import { hasDayTwo } from "./programme";
import { BrunchSection } from "./sections/BrunchSection";
import { CountdownSection } from "./sections/CountdownSection";
import { FooterSection } from "./sections/FooterSection";
import { GallerySection } from "./sections/GallerySection";
import { GiftsSection } from "./sections/GiftsSection";
import { GuestbookSection } from "./sections/GuestbookSection";
import { HeroSection } from "./sections/HeroSection";
import { IntroVideoSection } from "./sections/IntroVideoSection";
import { LetterSection } from "./sections/LetterSection";
import { MenuSection } from "./sections/MenuSection";
import { PlaylistSection } from "./sections/PlaylistSection";
import { PracticalSection } from "./sections/PracticalSection";
import { ProgrammeSection } from "./sections/ProgrammeSection";
import { RsvpSection } from "./sections/RsvpSection";
import { StaysSection } from "./sections/StaysSection";
import { VenueSection } from "./sections/VenueSection";

/**
 * "Château Royal" — a château at the turn of day and night.
 *
 * The hero, the letter and the footer always render: they carry the couple's
 * names. The sections between them are gated on `data.modules`. The programme
 * and the brunch both belong to the `timeline` module (the brunch is its second
 * day); the "small details" grid gathers three modules and gates each group.
 *
 * The page follows the day: the letter and the time left to it, the place, the
 * couple's film, the programme, the dinner, then night falls on the ball (the
 * playlist's dance card) and the next day opens on the brunch; the souvenirs,
 * the small details and where to sleep, the gift note, the reply, a word in
 * the guestbook (« livre d'or », signed on leaving, as in a château's hall),
 * the signature.
 *
 * Full-bleed: the stylesheet's `html`, `body` and `main` rules all landed on
 * this element.
 */
export function ChateauRoyalRoot({ data }: { data: InvitationData }) {
  const enabled = data.modules;
  const has = (id: ModuleId) => !enabled || enabled.includes(id);
  const brunch = has("timeline") && hasDayTwo(data);
  const ball = has("playlist");

  return (
    <main className={`theme-chateau-royal ${chateauRoyalFontVars}`} data-theme-root="">
      <JsFlag />
      <HeroSection data={data} />
      <LetterSection data={data} />
      {/* Under the letter, on the same ivory page. */}
      {has("countdown") ? <CountdownSection data={data} /> : null}
      <div className="transition transition-one" aria-hidden="true">
        {/* The two rules draw out from the ornament the first time they are seen. */}
        <Reveal as="span" className="cr-transition-draw" revealedClass="visible" threshold={0.6}>
          <span className="transition-rule" />
          <span className="transition-center">✣</span>
          <span className="transition-rule" />
        </Reveal>
      </div>
      {has("map") ? <VenueSection data={data} /> : null}
      {/* The film, once the place is known — the designer reveals it in this order. */}
      {has("intro-video") ? <IntroVideoSection data={data} /> : null}
      {has("timeline") ? <ProgrammeSection data={data} /> : null}
      {has("menu") ? <MenuSection data={data} /> : null}
      {/* The fold that carries the eye from the pale pages down into the night of the ball, or to
          the banquet photograph. */}
      {brunch || ball ? <div className="nightfold" aria-hidden="true" /> : null}
      {/* After the dinner, the ball: the dance card on the night ground. */}
      {ball ? <PlaylistSection data={data} /> : null}
      {brunch ? <BrunchSection data={data} /> : null}
      {has("gallery") ? <GallerySection data={data} /> : null}
      {/* Three modules feed this grid (dress code, directions, questions): it decides for itself. */}
      <PracticalSection data={data} />
      {/* Where to sleep follows the ways to get there, in the same card language. */}
      {has("accommodation") ? <StaysSection data={data} /> : null}
      {has("gift-list") ? <GiftsSection data={data} /> : null}
      {has("rsvp") ? (
        <RsvpSection
          // Outside a real invitation (the editor's preview, the demo) a reply only flips the form to
          // its thank-you state, which then hid every option the couple went on to change. Their
          // options are the key, so a change shows a fresh form. A real invitation keeps one form.
          key={data.weddingId ? "rsvp" : JSON.stringify(data.rsvp ?? {})}
          data={data}
        />
      ) : null}
      {/* The guestbook is signed on the way out: after the reply, before the signature. */}
      {has("guestbook") ? <GuestbookSection data={data} /> : null}
      <FooterSection data={data} />
    </main>
  );
}
