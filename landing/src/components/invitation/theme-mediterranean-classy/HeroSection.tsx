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
    // Full viewport on load — nothing but the hero is visible at init. `svh`
    // rather than `vh`: on mobile, `100vh` overflows under the browser toolbar
    // and lets the next section peek through.
    <section className="flex min-h-[100svh] flex-col overflow-hidden bg-mc-cream">
      {/*
        The paper frame keeps its own proportions instead of being stretched to
        the viewport: covering a full-height section zoomed the emboss and cut
        the ornate border off. It ends partway down, exactly as in the mock, and
        the cream below carries the scroll cue. `max-h` keeps it from eating a
        short viewport whole.
      */}
      <div className="relative isolate aspect-[941/1672] max-h-[82svh] w-full shrink-0 md:aspect-[16/9]">
        {/*
          `object-contain`, not `cover`: the ornate border is part of the
          artwork and must never be cropped. The container carries each crop's
          own aspect ratio (941/1672 portrait, 16/9 landscape) so contain shows
          the whole sheet edge to edge without letterboxing it.
        */}
        <Image
          src={assets.paperFramePortrait1}
          alt=""
          width={941}
          height={1672}
          priority
          className="absolute inset-0 -z-10 h-full w-full object-contain md:hidden"
        />
        <Image
          src={assets.paperEmbossLandscape}
          alt=""
          width={1600}
          height={900}
          priority
          className="absolute inset-0 -z-10 hidden h-full w-full object-contain md:block"
        />

        <Petal
          variant={0}
          className="-left-14 -top-8 md:-left-20 md:-top-16"
          size={190}
          rotate={-15}
        />
        <Petal
          variant={2}
          className="-right-10 -top-6 md:-right-16 md:-top-14"
          size={190}
          rotate={20}
          flip
        />
        <Petal variant={4} className="-left-20 top-[42%]" size={165} rotate={-40} />
        <Petal
          variant={1}
          className="-bottom-10 -right-14"
          size={210}
          rotate={10}
          flip
        />

        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-[6vh] px-8 text-center">
          <p className="font-mc-serif text-[18px] tracking-[0.04em] text-mc-brown backdrop-blur-[4px] md:text-[22px]">
            {intro}
          </p>

          <h1 className="flex flex-col items-center gap-[3vh] text-mc-brown backdrop-blur-[4px]">
            {/* 120px matches the design system's display/script token at the
                402px reference frame (30vw ≈ 120.6px there). The 14vh term is
                a safety floor for short, wide viewports (landscape phones)
                where vw alone would overflow the frame's height. md/lg then
                take over with fixed sizes once the layout switches to the
                landscape frame. */}
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
      </div>

      {/* Cream remainder. The indicator lives here, in the flow, so it is
          visible at init and can never land on top of the date. */}
      <div className="relative flex flex-1 items-center justify-center py-8">
        <ScrollIndicator />
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
