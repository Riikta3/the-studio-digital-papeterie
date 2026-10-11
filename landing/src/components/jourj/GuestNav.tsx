"use client";

import { usePathname } from "@/navigation";
import { cn } from "@shared/lib/utils";
import { Image as ImageIcon, MapPin, UtensilsCrossed } from "lucide-react";

import { GuestLink } from "./GuestLink";

const TABS = [
  { key: "ma-table", label: "Ma table", icon: MapPin },
  { key: "menu", label: "Le menu", icon: UtensilsCrossed },
  { key: "photos", label: "Nos photos", icon: ImageIcon },
];

/**
 * `custom` and `base` come from the layout, which reads the proxy's headers:
 * a client component cannot. See `GuestLink` for why they change the links.
 */
export function GuestNav({
  slug,
  custom,
  base,
}: {
  slug: string;
  custom: boolean;
  base: string;
}) {
  const pathname = usePathname();

  return (
    <nav className='fixed inset-x-0 bottom-0 border-t border-studio-lavande/40 bg-white/95 backdrop-blur'>
      <ul className='mx-auto flex max-w-md'>
        {TABS.map(({ key, label, icon: Icon }) => {
          const active = pathname.includes(`/${key}`);
          return (
            <li key={key} className='flex-1'>
              <GuestLink
                subpath={key}
                slug={slug}
                custom={custom}
                base={base}
                className={cn(
                  // pb-6 clears the iOS home indicator.
                  "flex min-h-16 flex-col items-center justify-center gap-1 pb-6 pt-2 text-xs",
                  active ? "text-studio-violet" : "text-studio-violet/50",
                )}
              >
                <Icon className='h-5 w-5' />
                {label}
              </GuestLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
