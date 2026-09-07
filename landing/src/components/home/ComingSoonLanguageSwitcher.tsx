"use client";

import { cn } from "@shared/lib/utils";
import { Check, ChevronDown, Globe, Loader2 } from "lucide-react";
import { useLocale } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";

import { usePathname, useRouter } from "@/navigation";

const LANGUAGES = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
  { value: "de", label: "Deutsch" },
  { value: "es", label: "Español" },
  { value: "pt", label: "Português" },
  { value: "it", label: "Italiano" },
  { value: "ar", label: "العربية" },
  { value: "zh", label: "中文" },
  { value: "ja", label: "日本語" },
];

/**
 * The locale picker for the coming-soon page.
 *
 * Deliberately not `home/LanguageSwitcher.tsx`, which is built to live inside
 * the mobile drawer: its panel is anchored to the trigger's LEFT edge (the
 * drawer clips on both axes) and painted white-on-white, neither of which
 * suits a switcher sitting alone at the top-right of a violet page. This one
 * is right-anchored and uses the page's violet/cream palette.
 */
export function ComingSoonLanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  // Switching locale is a server round-trip for a new RSC payload, so it is
  // not instant — this is what turns a frozen trigger into a visible spinner.
  const [isPending, startTransition] = useTransition();
  // The locale being switched to, kept only so the trigger can show it while
  // the transition runs. Read through `isPending` rather than cleared by an
  // effect: it is derived state, and resetting it from an effect body cost a
  // cascading render on every switch.
  const [requestedLocale, setRequestedLocale] = useState<string | null>(null);
  const pendingLocale = isPending ? requestedLocale : null;
  const rootRef = useRef<HTMLDivElement>(null);

  // Warm every other locale's RSC payload while the list is open, so the
  // switch resolves from the router cache instead of a fresh round-trip.
  useEffect(() => {
    if (!open) return;
    for (const language of LANGUAGES) {
      if (language.value === locale) continue;
      router.prefetch(pathname, { locale: language.value });
    }
  }, [open, locale, pathname, router]);

  const selectLocale = (nextLocale: string) => {
    setOpen(false);
    if (nextLocale === locale) return;
    setRequestedLocale(nextLocale);
    startTransition(() => {
      // See home/LanguageSwitcher: keep the scroll position across the
      // remount the locale segment change forces.
      router.replace(pathname, { locale: nextLocale, scroll: false });
    });
  };

  // Close on a click anywhere outside this component, and on Escape.
  //
  // Bound to `click`, not `mousedown`/`pointerdown`: a press that starts on
  // the trigger or on an option must be allowed to complete as a click before
  // anything closes the panel. Listening on the *down* half of the gesture
  // tore the interaction apart — the panel closed (and its options stopped
  // hit-testing, since a hidden element takes no clicks) before the matching
  // `click` could ever reach the option, so picking a language did nothing.
  //
  // `rootRef` covers both the trigger and the panel, so clicks on either are
  // ignored here and handled by their own React handlers.
  useEffect(() => {
    if (!open) return;

    const onDocumentClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("click", onDocumentClick);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("click", onDocumentClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={isPending}
        onClick={() => setOpen((previous) => !previous)}
        className="flex cursor-pointer items-center gap-1.5 rounded-full border border-studio-lavande/40 px-3.5 py-2 font-body text-sm text-white transition-colors hover:border-studio-jaune/60 hover:bg-white/5 disabled:cursor-wait disabled:opacity-70"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Globe className="h-4 w-4" />
        )}
        {(pendingLocale ?? locale).toUpperCase()}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 opacity-60 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Mounted only while open, and animated with opacity/transform alone.
          An always-mounted panel toggled via `visible`/`invisible` did not
          work here: `visibility` is not an interpolable property, so pairing
          it with `transition-all` left the panel stuck at `hidden` even once
          the open classes were applied — it stayed invisible, took no clicks,
          and picking a language appeared to do nothing.
          Anchored to the trigger's right edge: this switcher sits at the
          top-right of the viewport. */}
      {open && (
        <ul
          role="listbox"
          aria-label="Language"
          className="absolute right-0 z-50 mt-2 min-w-[12rem] overflow-hidden rounded-xl border border-studio-lavande/30 bg-studio-creme py-1.5 shadow-2xl"
        >
          {LANGUAGES.map((language) => {
            const isActive = locale === language.value;
            return (
              <li key={language.value} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => selectLocale(language.value)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left font-body text-sm transition-colors",
                    isActive
                      ? "bg-studio-card-selected text-studio-violet"
                      : "text-studio-violet/80 hover:bg-studio-card-selected hover:text-studio-violet focus:bg-studio-card-selected focus:outline-none",
                  )}
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0 text-studio-violet",
                      isActive ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="font-medium">
                    {language.value.toUpperCase()}
                  </span>
                  <span className="text-xs opacity-70">{language.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
