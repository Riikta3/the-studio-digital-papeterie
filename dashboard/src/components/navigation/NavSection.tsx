"use client";

import { Link } from "@/navigation";
import { cn } from "@shared/lib/utils";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { isSectionActive, type NavSectionDef } from "./nav-config";

type Props = {
  section: NavSectionDef;
  pathname: string;
  onNavigate: () => void;
};

export function NavSection({ section, pathname, onNavigate }: Props) {
  const t = useTranslations("Sidebar.sections");
  const active = isSectionActive(section, pathname);
  // A section holding the current page starts open; the others stay folded.
  const [open, setOpen] = useState(active);

  const Icon = section.icon;
  const label = t(`${section.key}.label`);

  // Single-page sections are a plain link — no accordion to expand.
  if (section.href) {
    return (
      <Link
        href={section.href}
        onClick={onNavigate}
        className={cn(
          // min-h-11 keeps the tap target at 44px on touch screens.
          "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
          active
            ? "bg-white/15 font-medium text-white"
            : "text-white/70 hover:bg-white/10 hover:text-white",
        )}
      >
        <Icon className='h-5 w-5 shrink-0' />
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <div>
      <button
        type='button'
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm transition-colors",
          active ? "text-white" : "text-white/70 hover:text-white",
        )}
      >
        <Icon className='h-5 w-5 shrink-0' />
        <span className='flex-1 text-left'>{label}</span>
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <ul className='mt-1 space-y-0.5 border-l border-white/15 pl-4 ml-5'>
          {(section.items ?? []).map((item) => {
            const itemActive = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex min-h-11 items-center rounded-lg px-3 text-sm transition-colors",
                    itemActive
                      ? "bg-white/15 font-medium text-white"
                      : "text-white/60 hover:bg-white/10 hover:text-white",
                  )}
                >
                  {t(`${section.key}.items.${item.key}`)}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
