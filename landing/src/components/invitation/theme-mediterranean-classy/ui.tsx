import Image from "next/image";
import type { ReactNode } from "react";

import { assets, petals } from "./tokens";

/**
 * Shared primitives for the "Mediterranean Classy" theme.
 * Server components — none of these hold state.
 */

/** Tileable noise, laid over the whole page at the mock's 2% / darken. */
export function GrainOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 opacity-[0.02] mix-blend-darken"
      style={{
        backgroundImage: `url(${assets.textureGrain})`,
        backgroundSize: "256px 256px",
      }}
    />
  );
}

/**
 * A single cut-out petal, used as decoration. The mock overlaps them with the
 * section edges, so they are absolutely positioned and allowed to bleed out.
 * `variant` selects one of the eight cut-outs (0-indexed, wraps around).
 *
 * Petals sit at z-0: above section backgrounds, below anything readable. Text
 * containers that a petal can reach must carry `relative z-10`.
 */
export function Petal({
  variant = 0,
  className,
  size = 180,
  rotate = 0,
  flip = false,
  opacity = 1,
}: {
  variant?: number;
  className?: string;
  size?: number;
  rotate?: number;
  flip?: boolean;
  opacity?: number;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute z-0 ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        opacity,
        transform: `rotate(${rotate}deg)${flip ? " scaleX(-1)" : ""}`,
      }}
    >
      <Image
        src={petals[variant % petals.length]}
        alt=""
        width={size}
        height={size}
        className="h-full w-full object-contain"
      />
    </div>
  );
}

/**
 * Embossed paper surface. In the mock almost nothing is a flat fill — section
 * backgrounds, cards and plates all carry the lavender relief. Drop this into
 * any `relative` container; it sits behind the content and never intercepts
 * clicks.
 *
 * `strength` picks how present the relief is: `page` for large backgrounds
 * (barely there), `card` for small surfaces where it should read as paper.
 */
export function PaperTexture({
  strength = "card",
  className,
}: {
  strength?: "page" | "card";
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className ?? ""}`}
    >
      <Image
        src={assets.paperField}
        alt=""
        width={650}
        height={1060}
        // The page relief has to stay well under the card relief, otherwise
        // cards stop separating from the background they sit on.
        className={`h-full w-full object-cover ${
          strength === "page" ? "opacity-[0.18]" : "opacity-70"
        }`}
      />
    </span>
  );
}

/**
 * Content column. Mobile-first: the mock's 402px frame is the base, then the
 * column widens at md/lg so the invitation fills a tablet or desktop instead of
 * staying a pinned phone strip. Section backgrounds stay full-bleed — only the
 * content inside them is constrained.
 */
export function Container({
  children,
  className,
  size = "default",
}: {
  children: ReactNode;
  className?: string;
  /** `narrow` keeps line length readable for body copy and cards. */
  size?: "default" | "narrow";
}) {
  const width =
    size === "narrow"
      ? "max-w-[430px] md:max-w-[560px]"
      : "max-w-[430px] md:max-w-[700px] lg:max-w-[880px]";
  return (
    <div className={`mx-auto w-full ${width} ${className ?? ""}`}>{children}</div>
  );
}

/** Short centred hairline used under section titles. */
export function Rule({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`mx-auto block h-px w-16 bg-mc-sage ${className ?? ""}`}
    />
  );
}

/** Section heading: serif title in green, optional sans subtitle, hairline. */
export function SectionTitle({
  title,
  subtitle,
  rule = true,
  className,
}: {
  title: string;
  subtitle?: string;
  rule?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative z-10 text-center ${className ?? ""}`}>
      <h2 className="font-mc-serif text-[40px] font-semibold uppercase leading-none tracking-[0.02em] text-mc-green md:text-[52px] lg:text-[60px]">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-3 font-mc-sans text-[18px] tracking-[0.06em] text-mc-sage md:mt-4 md:text-[20px]">
          {subtitle}
        </p>
      ) : null}
      {rule ? <Rule className="mt-5 md:mt-6 md:w-20" /> : null}
    </div>
  );
}

/**
 * The arch card used by "Accès" and "RSVP": a narrow arched cap, a full-width
 * textured body with an inset hairline, and a narrower rounded foot carrying
 * the embossed monogram. The three pieces overlap by 1px so they read as one
 * continuous sheet of paper.
 */
export function ArchCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="relative z-10 mx-auto w-full max-w-[365px] drop-shadow-[0_8px_23px_rgba(229,213,185,0.5)] md:max-w-[520px]">
      {/* Arched cap: the eyebrow sits inside the arch, above the body's shoulders. */}
      <div className="relative isolate mx-auto -mb-px flex h-[104px] w-[64%] items-end justify-center overflow-hidden rounded-t-[999px] bg-mc-paper pb-1 md:h-[132px]">
        <PaperTexture />
        <p className="font-mc-serif text-[40px] font-semibold uppercase leading-none text-mc-green md:text-[52px]">
          {eyebrow}
        </p>
      </div>

      {/* Body */}
      <div className="relative isolate bg-mc-paper px-5 pb-10 pt-1 md:px-10 md:pb-14">
        <PaperTexture />
        <p className="text-center font-mc-sans text-[18px] uppercase tracking-[0.14em] text-mc-sage md:text-[20px]">
          {title}
        </p>
        <Rule className="mt-4 w-44" />
        {/* Inset hairline, mirroring the printed plate edge. Open at the
            bottom so it reads as continuing into the foot. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-2 bottom-0 top-[68px] border-x border-t border-mc-warm-gray/50"
        />
        <div className="relative mt-8">{children}</div>
      </div>

      {/* Foot: narrower rounded lobe carrying the embossed monogram. */}
      <div className="relative isolate mx-auto -mt-px h-[130px] w-[60%] overflow-hidden rounded-b-[999px] bg-mc-paper md:h-[165px]">
        <PaperTexture />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-2 -top-px bottom-6 rounded-b-[999px] border-x border-b border-mc-warm-gray/50"
        />
        <Image
          src={assets.monogramEmboss}
          alt=""
          width={160}
          height={180}
          className="absolute inset-x-0 top-2 mx-auto h-[105px] w-auto object-contain opacity-80 md:h-[135px]"
        />
      </div>
    </div>
  );
}

/** Outlined green button — "Voir sur Waze", "Je réserve", "Envoyer ma réponse". */
export function RouteButton({
  children,
  href,
  type,
  className,
}: {
  children: ReactNode;
  href?: string;
  type?: "button" | "submit";
  className?: string;
}) {
  const styles = `flex w-full items-center justify-center gap-[10px] border border-mc-green px-3 py-3 font-mc-serif text-[18px] uppercase tracking-[0.14em] text-mc-green transition-colors hover:bg-mc-green hover:text-mc-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mc-green ${className ?? ""}`;

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={styles}>
        {children}
      </a>
    );
  }
  return (
    <button type={type ?? "button"} className={styles}>
      {children}
    </button>
  );
}

/** Filled sand button — "Voir plus d'options". */
export function OptionsButton({ children }: { children: ReactNode }) {
  return (
    <button
      type="button"
      className="mx-auto flex items-center justify-center gap-[10px] border border-mc-border bg-mc-beige px-6 py-3 font-mc-serif text-[18px] uppercase tracking-[0.14em] text-mc-green shadow-mc-card-dark transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mc-green"
    >
      {children}
    </button>
  );
}

/** Outlined white button, used on the dark sage playlist panel. */
export function SuggestButton({ children }: { children: ReactNode }) {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-center gap-[10px] border border-white/70 px-6 py-3 font-mc-serif text-[18px] uppercase tracking-[0.14em] text-white/90 transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      {children}
    </button>
  );
}
