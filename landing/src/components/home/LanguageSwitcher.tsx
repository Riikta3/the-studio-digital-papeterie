"use client";

import { cn } from "@shared/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
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

// Deliberately NOT built on the Radix dropdown primitive: this is a flat
// 9-item list with no submenus, radio groups or typeahead, and pulling in
// @radix-ui/react-dropdown-menu put a 92.8 KB chunk into the eager entry
// graph of the homepage and all three /studio routes — for a menu that lives
// inside a closed drawer and never opens on a desktop page load.
export function LanguageSwitcher({
  onSwitchStart,
  onLocaleChange,
}: {
  // Fired as soon as a different locale is picked, so the host (the mobile
  // drawer) can show the switch is in flight instead of looking frozen.
  onSwitchStart?: () => void;
  // Fired once the new locale has actually rendered, so the drawer closes on
  // translated content rather than snapping shut mid-navigation.
  onLocaleChange?: () => void;
} = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  // The switch is a server round-trip (new RSC payload for the new locale
  // segment), so it is not instant. `useTransition` gives us the pending flag
  // that turns a frozen UI into a visible "working on it".
  const [isPending, startTransition] = useTransition();
  const [pendingLocale, setPendingLocale] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  // Call sites pass inline arrows, so their identity changes on every render.
  // Held in a ref to keep them out of the effect's dependencies.
  const onLocaleChangeRef = useRef(onLocaleChange);
  onLocaleChangeRef.current = onLocaleChange;

  const selectLocale = (nextLocale: string) => {
    setOpen(false);
    if (nextLocale === locale) return;
    setPendingLocale(nextLocale);
    onSwitchStart?.();
    // Navigate inside a transition and keep this component mounted while it
    // runs, so the trigger can show the spinner. Closing the drawer here
    // instead would unmount the switcher along with it and the pending state
    // would never be painted — the drawer is closed in the effect below,
    // once the new locale has actually landed.
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  // The transition resolves when the new locale's RSC payload has rendered,
  // which is also the moment the drawer's exit animation can play against
  // fully-translated content. Closing any earlier looks like a snap.
  useEffect(() => {
    if (pendingLocale && !isPending) {
      setPendingLocale(null);
      onLocaleChangeRef.current?.();
    }
  }, [isPending, pendingLocale]);

  // Close on outside click and on Escape, the two behaviours the primitive
  // gave us for free that actually matter here.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
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
        className="flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 font-body text-sm text-white transition-opacity disabled:opacity-70"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Globe className="h-4 w-4" />
        )}
        {(pendingLocale ?? locale).toUpperCase()}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 opacity-60 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Anchored to the trigger's LEFT edge on purpose. This menu renders
          inside the mobile drawer, whose `overflow-y-auto` makes it clip on
          both axes, and the trigger sits against the drawer's left padding —
          a right-anchored panel spilled past that edge and got cut off. */}
      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
            style={{ transformOrigin: "top left" }}
            className="absolute left-0 z-50 mt-2 max-h-[300px] min-w-[11rem] overflow-y-auto rounded-xl border border-studio-lavande/40 bg-white py-1 shadow-lg"
          >
            {LANGUAGES.map((language) => (
              <li key={language.value} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={locale === language.value}
                  onClick={() => selectLocale(language.value)}
                  className="flex w-full cursor-pointer items-center gap-2 px-2 py-1.5 text-left font-body text-sm text-studio-violet hover:bg-studio-creme focus:bg-studio-creme focus:outline-none"
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      locale === language.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="font-medium">
                    {language.value.toUpperCase()}
                  </span>
                  <span className="text-xs text-studio-violet/60">
                    {language.label}
                  </span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
