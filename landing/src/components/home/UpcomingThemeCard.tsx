import { cn } from "@shared/lib/utils";

/**
 * The card that closes the theme carousels: "more collections coming".
 *
 * Drawn rather than photographed, on purpose — a mock invitation here would
 * advertise a design that does not exist, which is what the six invented
 * themes on this page used to do. This reads as a placeholder at a glance.
 *
 * It is inert: no click target, no demo to open. It sits at the end of the
 * carousels and is never a selectable index.
 *
 * Its copy arrives as props rather than being read from a namespace here: the
 * card is used from both `Preview` and `HowItWorks`, whose strings live under
 * different keys, and a hard-coded `useTranslations("Preview")` would throw the
 * moment it was rendered outside that section.
 *
 * `compact` is for the step-01 grid, where four cards share the width one
 * carousel card gets — around 70px on a phone. At that size the full copy
 * overflows the border on both axes, so the subtitle is dropped and the title
 * shrinks; the carousel keeps the roomier default.
 */
export function UpcomingThemeCard({
  title,
  subtitle,
  compact = false,
  className,
}: {
  title: string;
  subtitle: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center overflow-hidden text-center",
        compact ? "gap-1.5 px-1.5" : "gap-3 px-4",
        // A dashed rule and no artwork: the visual language of something not
        // filled in yet, next to cards that are all photograph.
        "rounded-xl border border-dashed border-studio-violet/30 bg-studio-creme",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "font-display leading-none text-studio-violet/50",
          compact ? "text-lg" : "text-2xl",
        )}
      >
        &#43;
      </span>
      <p
        className={cn(
          "font-body leading-snug text-studio-violet",
          compact ? "text-[10px] md:text-[11px]" : "text-h5",
        )}
      >
        {title}
      </p>
      {/* Dropped in the compact grid: at ~70px wide it wraps to five lines and
          spills past the card's own border. */}
      <p
        className={cn(
          "font-body leading-snug text-studio-violet/60",
          compact ? "hidden lg:block lg:text-[10px]" : "text-[11px]",
        )}
      >
        {subtitle}
      </p>
    </div>
  );
}
