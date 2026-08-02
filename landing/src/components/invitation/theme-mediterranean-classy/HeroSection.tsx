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
    <section className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-mc-cream">
      {/* The embossed paper exists as a portrait and a landscape crop; swapping
          at md keeps the ornate border intact instead of cropping it away. */}
      <Image
        src={assets.paperFramePortrait1}
        alt=""
        width={941}
        height={1672}
        priority
        className="absolute inset-0 -z-10 h-full w-full object-cover md:hidden"
      />
      <Image
        src={assets.paperEmbossLandscape}
        alt=""
        width={1600}
        height={900}
        priority
        className="absolute inset-0 -z-10 hidden h-full w-full object-cover md:block"
      />

      <Petal
        variant={0}
        className="-left-16 -top-10 md:-left-20 md:-top-16"
        size={200}
        rotate={-15}
      />
      <Petal
        variant={2}
        className="-right-12 -top-8 md:-right-16 md:-top-14"
        size={200}
        rotate={20}
        flip
      />
      <Petal variant={4} className="-left-20 top-[45%]" size={170} rotate={-40} />
      <Petal
        variant={1}
        className="-right-16 bottom-[-2rem]"
        size={220}
        rotate={10}
        flip
      />

      {/* `flex-1` centres the names in whatever space the indicator leaves.
          Padding tightens on short viewports (landscape phones) so the whole
          hero still fits without the indicator dropping below the fold. */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-8 pt-20 text-center [@media(max-height:640px)]:pt-8">
        <p className="font-mc-serif text-[18px] tracking-[0.04em] text-mc-brown md:text-[22px]">
          {intro}
        </p>

        <h1 className="mt-8 flex flex-col items-center text-mc-brown md:mt-10 [@media(max-height:640px)]:mt-3">
          {/* Sized against both axes: `vw` alone overflows a landscape phone,
              where width is generous but height is not. */}
          <span className="font-mc-script text-[clamp(64px,min(26vw,20vh),185px)] leading-[0.85]">
            {partner1}
          </span>
          <span className="my-2 font-mc-serif text-[24px] italic leading-none md:my-4 md:text-[32px]">
            et
          </span>
          {/* Sized against both axes: `vw` alone overflows a landscape phone,
              where width is generous but height is not. */}
          <span className="font-mc-script text-[clamp(64px,min(26vw,20vh),185px)] leading-[0.85]">
            {partner2}
          </span>
        </h1>

        <p className="mt-12 font-mc-serif text-[18px] tracking-[0.04em] text-mc-brown md:mt-16 md:text-[22px] [@media(max-height:640px)]:mt-4">
          {dateLabel}
        </p>
      </div>

      {/* Inside the hero so it is visible at init, and in the flow rather than
          absolutely positioned: it reserves its own space, so a short viewport
          can no longer push the date underneath it. */}
      <div className="relative z-10 flex shrink-0 justify-center pb-10 pt-8 [@media(max-height:640px)]:pb-4 [@media(max-height:640px)]:pt-2">
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
