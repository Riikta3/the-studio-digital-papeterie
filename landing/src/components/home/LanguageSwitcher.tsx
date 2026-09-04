"use client";

import { cn } from "@shared/lib/utils";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useLocale } from "next-intl";
import { useEffect, useRef, useState } from "react";

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
export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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
        onClick={() => setOpen((previous) => !previous)}
        className="flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 font-body text-sm text-white"
      >
        <Globe className="h-4 w-4" />
        {locale.toUpperCase()}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 opacity-60 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-2 max-h-[300px] min-w-[11rem] overflow-y-auto rounded-xl border border-studio-lavande/40 bg-white py-1 shadow-lg"
        >
          {LANGUAGES.map((language) => (
            <li key={language.value} role="none">
              <button
                type="button"
                role="option"
                aria-selected={locale === language.value}
                onClick={() => {
                  setOpen(false);
                  router.replace(pathname, { locale: language.value });
                }}
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
        </ul>
      )}
    </div>
  );
}
