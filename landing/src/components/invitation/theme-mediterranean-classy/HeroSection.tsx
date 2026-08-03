import Image from "next/image";

import { assets } from "./tokens";
import { Petal } from "./ui";

/**
 * Hero: the embossed lavender paper frame fills the viewport, with the couple's
 * names set in Ballet over it and cut-out petals bleeding past the frame edges.
 */
export function HeroSection({
  intro,
  partner1,
  partner2,
  dateLabel,
}: {
  intro: string;
  partner1: string;
  partner2: string;
  dateLabel: string;
}) {
  return (
    // One block for every breakpoint: full width, full 100vh. `object-cover`:
    // with `contain`, a viewport whose ratio doesn't match the artwork's
    // leaves a visible cream gap above/below the card instead of filling the
    // screen — confirmed against a real device screenshot, so cropping a
    // sliver of the border is the better trade-off than empty space. Only the
    // source image and the text/petal sizing change by breakpoint — the
    // structure doesn't.
    <section className="overflow-hidden bg-mc-cream">
      {/*
        `100svh` alone isn't enough: on a real device (confirmed on iPhone SE),
        mobile Safari can under-report the small-viewport-height on first
        paint, before its dynamic toolbar has settled — a documented WebKit
        quirk that a headless WebKit test at a fixed viewport doesn't
        reproduce. This script measures the *actual* visible height in JS and
        pins it to a CSS variable, which the section below reads with `100svh`
        kept only as the pre-JS/no-JS fallback.
      */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){function s(){var h=(window.visualViewport&&window.visualViewport.height)||window.innerHeight;document.documentElement.style.setProperty('--hero-vh',h+'px');}s();addEventListener('resize',s);if(window.visualViewport){visualViewport.addEventListener('resize',s);}})();`,
        }}
      />
      <div
        className="relative isolate w-full overflow-hidden"
        style={{ minHeight: "var(--hero-vh, 100svh)" }}
      >
        {/* Portrait crop below md (bordered card, matches the Figma mock),
            landscape crop from md up (borderless texture — there is no
            desktop mock to match, so this is the best full-bleed source). */}
        <Image
          src={assets.paperFramePortrait1}
          alt=""
          fill
          priority
          className="-z-10 object-cover md:hidden"
        />
        <Image
          src={assets.paperEmbossLandscape}
          alt=""
          fill
          priority
          className="-z-10 hidden object-cover md:block"
        />

        <Petal
          className="-left-14 -top-8 md:left-10 md:top-10 lg:left-20 lg:top-16"
          variant={0}
          size={190}
          rotate={-15}
        />
        <Petal
          className="-right-10 -top-6 md:right-10 md:top-8 lg:right-20 lg:top-14"
          variant={2}
          size={190}
          rotate={20}
          flip
        />
        <Petal
          className="-left-20 top-[42%] md:left-10 md:top-auto md:bottom-10 lg:left-24"
          variant={4}
          size={165}
          rotate={-40}
        />
        <Petal
          className="-bottom-10 -right-14 md:bottom-10 md:right-10 lg:right-24"
          variant={1}
          size={210}
          rotate={10}
          flip
        />

        {/* `absolute inset-0`, not a flex sibling of the indicator: centering
            within a flex-1 box only centers in the space the indicator
            *doesn't* take, which visibly sits above true screen-centre. This
            spans the full section instead, so the text centres on the actual
            middle of the viewport at any size. */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-[7vh] px-8 text-center">
          {/* intro/date: bounded by height as well as width (2.2vh), which is
              what keeps the whole block short enough to clear the indicator
              on short landscape phones — a pure vw/md size never shrinks
              there. The 22px ceiling matches the size already used at the
              normal desktop reference (900–1080px tall). */}
          <p className="font-mc-serif text-[clamp(14px,min(4.5vw,2.2vh),22px)] tracking-[0.04em] text-mc-brown backdrop-blur-[4px]">
            {intro}
          </p>

          <h1 className="flex flex-col items-center gap-[4vh] text-mc-brown backdrop-blur-[4px]">
            {/* One formula for every breakpoint rather than fixed md/lg sizes:
                30vw matches the design system's 120px token at the 402px
                reference frame, and 17vh keeps that same ~120px at the
                original desktop reference (900-1080px tall) — so it lines up
                with the sizes already approved there. Bounding by height
                everywhere (not just below md) is what fixes the overlap with
                the indicator on short, wide viewports (e.g. 820×500), where
                the old fixed 150px didn't shrink at all. */}
            <span className="font-mc-script text-[clamp(56px,min(30vw,17vh),200px)] leading-[0.85]">
              {partner1}
            </span>
            <span className="font-mc-serif text-[clamp(14px,min(5.5vw,3vh),30px)] italic leading-none">
              et
            </span>
            <span className="font-mc-script text-[clamp(56px,min(30vw,17vh),200px)] leading-[0.85]">
              {partner2}
            </span>
          </h1>

          <p className="font-mc-serif text-[clamp(14px,min(4.5vw,2.2vh),22px)] tracking-[0.04em] text-mc-brown backdrop-blur-[4px]">
            {dateLabel}
          </p>
        </div>

        {/* Floats independently near the bottom rather than reserving flex
            space, so it never pulls the text block off true centre. Both the
            circle's own size and its offset from the edge shrink with height
            (`8vh`, `3vh`) — fixed-px values here are what let the indicator
            eat a growing share of a short viewport and collide with the
            (also height-bounded) text block above. */}
        <div className="absolute inset-x-0 z-10 flex justify-center" style={{ bottom: "max(1rem, 3vh)" }}>
          <ScrollIndicator />
        </div>
      </div>
    </section>
  );
}

/**
 * Outlined circle with a downward arrow, anchored at the bottom of the hero.
 * Bobs gently to signal there is more below; the motion is dropped for anyone
 * who asked for reduced motion.
 */
export function ScrollIndicator() {
  return (
    // Height-bounded like the hero text (8vh, capped at 58px): a fixed-px
    // circle is what let it eat a growing share of a short viewport and
    // collide with the (also height-bounded) text above it.
    <span className="flex h-[clamp(36px,8vh,58px)] w-[clamp(36px,8vh,58px)] items-center justify-center rounded-full border border-mc-green bg-mc-cream/40 backdrop-blur-[1px] motion-safe:animate-scroll-bob">
      <svg
        width="16"
        height="26"
        viewBox="0 0 16 26"
        fill="none"
        aria-hidden
        className="text-mc-green"
      >
        <path
          d="M8 0v24M1 17l7 7 7-7"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
