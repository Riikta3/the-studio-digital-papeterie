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
    <section className="overflow-hidden bg-mc-cream">
      {/*
        Two entirely separate treatments, not one shared DOM stretched by
        breakpoint — the two source assets aren't the same shape of image.
        Mobile mirrors the Figma mock: a bordered portrait card that must
        never be cropped, sized to its own aspect ratio with cream showing
        below it. Desktop has no mock to match — the board only designs a
        mobile frame — and the landscape crop is a borderless texture built
        for exactly this: a genuine full-width, full-height (100vh) bleed,
        safe to `object-cover` since there's no border to lose.
      */}
      <div className="flex min-h-[100svh] flex-col md:hidden">
        <div className="relative isolate mx-auto aspect-[941/1672] max-h-[82svh] w-full shrink-0">
          <Image
            src={assets.paperFramePortrait1}
            alt=""
            width={941}
            height={1672}
            priority
            // `object-contain`, not `cover`: the ornate border is part of the
            // artwork and must never be cropped.
            className="absolute inset-0 -z-10 h-full w-full object-contain"
          />

          <Petal className="-left-14 -top-8" variant={0} size={190} rotate={-15} />
          <Petal className="-right-10 -top-6" variant={2} size={190} rotate={20} flip />
          <Petal className="-left-20 top-[42%]" variant={4} size={165} rotate={-40} />
          <Petal className="-bottom-10 -right-14" variant={1} size={210} rotate={10} flip />

          <div className="relative z-10 flex h-full flex-col items-center justify-center gap-[6vh] px-8 text-center">
            <p className="font-mc-serif text-[18px] tracking-[0.04em] text-mc-brown backdrop-blur-[4px]">
              {intro}
            </p>

            <h1 className="flex flex-col items-center gap-[3vh] text-mc-brown backdrop-blur-[4px]">
              {/* 120px matches the design system's display/script token at
                  the 402px reference frame (30vw ≈ 120.6px there). The 14vh
                  term is a safety floor for short, wide viewports (landscape
                  phones) where vw alone would overflow the frame's height. */}
              <span className="font-mc-script text-[clamp(56px,min(30vw,14vh),120px)] leading-[0.85]">
                {partner1}
              </span>
              <span className="font-mc-serif text-[22px] italic leading-none">et</span>
              <span className="font-mc-script text-[clamp(56px,min(30vw,14vh),120px)] leading-[0.85]">
                {partner2}
              </span>
            </h1>

            <p className="font-mc-serif text-[18px] tracking-[0.04em] text-mc-brown backdrop-blur-[4px]">
              {dateLabel}
            </p>
          </div>
        </div>

        {/* Cream remainder. The indicator lives here, in the flow, so it is
            visible at init and can never land on top of the date. */}
        <div className="relative flex flex-1 items-center justify-center py-8">
          <ScrollIndicator />
        </div>
      </div>

      <div className="relative isolate hidden min-h-[100svh] flex-col overflow-hidden md:flex">
        <Image
          src={assets.paperEmbossLandscape}
          alt=""
          fill
          priority
          className="-z-10 object-cover"
        />

        <Petal className="left-10 top-10 lg:left-20 lg:top-16" variant={0} size={220} rotate={-15} />
        <Petal className="right-10 top-8 lg:right-20 lg:top-14" variant={2} size={220} rotate={20} flip />
        <Petal className="bottom-10 left-10 lg:left-24" variant={4} size={190} rotate={-40} />
        <Petal className="bottom-10 right-10 lg:right-24" variant={1} size={240} rotate={10} flip />

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-[6vh] px-8 text-center">
          <p className="font-mc-serif text-[22px] tracking-[0.04em] text-mc-brown backdrop-blur-[4px]">
            {intro}
          </p>

          <h1 className="flex flex-col items-center gap-[3vh] text-mc-brown backdrop-blur-[4px]">
            <span className="font-mc-script text-[150px] leading-[0.85] lg:text-[185px]">
              {partner1}
            </span>
            <span className="font-mc-serif text-[30px] italic leading-none">et</span>
            <span className="font-mc-script text-[150px] leading-[0.85] lg:text-[185px]">
              {partner2}
            </span>
          </h1>

          <p className="font-mc-serif text-[22px] tracking-[0.04em] text-mc-brown backdrop-blur-[4px]">
            {dateLabel}
          </p>
        </div>

        <div className="relative z-10 flex shrink-0 justify-center pb-12 pt-6">
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
