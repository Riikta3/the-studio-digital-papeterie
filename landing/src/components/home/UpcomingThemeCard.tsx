import { cn } from "@shared/lib/utils";
import { useTranslations } from "next-intl";

/**
 * The card that closes the theme carousels: "more collections coming".
 *
 * Drawn rather than photographed, on purpose — a mock invitation here would
 * advertise a design that does not exist, which is what the six invented
 * themes on this page used to do. This reads as a placeholder at a glance.
 *
 * It is inert: no click target, no demo to open. It sits at the end of the
 * carousels and is never a selectable index.
 */
export function UpcomingThemeCard({ className }: { className?: string }) {
  const t = useTranslations("Preview");

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-3 px-4 text-center",
        // A dashed rule and no artwork: the visual language of something not
        // filled in yet, next to cards that are all photograph.
        "rounded-xl border border-dashed border-studio-violet/30 bg-studio-creme",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="font-display text-2xl leading-none text-studio-violet/50"
      >
        &#43;
      </span>
      <p className="font-body text-h5 leading-snug text-studio-violet">
        {t("upcomingTitle")}
      </p>
      <p className="font-body text-[11px] leading-snug text-studio-violet/60">
        {t("upcomingSubtitle")}
      </p>
    </div>
  );
}
