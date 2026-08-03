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
    // One block for every breakpoint: full width, full 100vh (`svh` so mobile
    // toolbars don't push the next section into view). `object-cover`: with
    // `contain`, a viewport whose ratio doesn't match the artwork's leaves a
    // visible cream gap above/below the card instead of filling the screen —
    // confirmed against a real device screenshot, so cropping a sliver of the
    // border is the better trade-off than empty space. Only the source image
    // and the text/petal sizing change by breakpoint — the structure doesn't.
    <section className="overflow-hidden bg-mc-cream">
      <div className="relative isolate flex min-h-[100svh] w-full flex-col overflow-hidden">
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

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-[6vh] px-8 text-center">
          <p className="font-mc-serif text-[18px] tracking-[0.04em] text-mc-brown backdrop-blur-[4px] md:text-[22px]">
            {intro}
          </p>

          <h1 className="flex flex-col items-center gap-[3vh] text-mc-brown backdrop-blur-[4px]">
            {/* 120px matches the design system's display/script token at the
                402px reference frame (30vw ≈ 120.6px there). The 14vh term is
                a safety floor for short, wide viewports (landscape phones)
                where vw alone would overflow the frame's height. md/lg switch
                to fixed sizes once the layout is a genuine full-bleed. */}
            <span className="font-mc-script text-[clamp(56px,min(30vw,14vh),120px)] leading-[0.85] md:text-[150px] lg:text-[185px]">
              {partner1}
            </span>
            <span className="font-mc-serif text-[22px] italic leading-none md:text-[30px]">
              et
            </span>
            <span className="font-mc-script text-[clamp(56px,min(30vw,14vh),120px)] leading-[0.85] md:text-[150px] lg:text-[185px]">
              {partner2}
            </span>
          </h1>

          <p className="font-mc-serif text-[18px] tracking-[0.04em] text-mc-brown backdrop-blur-[4px] md:text-[22px]">
            {dateLabel}
          </p>
        </div>

        {/* In the flow, not absolutely positioned: it reserves its own space
            so it is always visible at init and can never land on the date. */}
        <div className="relative z-10 flex shrink-0 justify-center py-8 md:pb-12 md:pt-6">
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
    <span className="flex h-[58px] w-[58px] items-center justify-center rounded-full border border-mc-green bg-mc-cream/40 backdrop-blur-[1px] motion-safe:animate-scroll-bob">
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
