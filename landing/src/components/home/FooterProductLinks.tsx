"use client";

import { scrollToSection } from "@/lib/scroll-to-section";
import { usePathname, useRouter } from "@/navigation";

// Order matches Footer.productLinks in the message files, which mirrors
// the page's actual section order (see [locale]/page.tsx).
const PRODUCT_LINK_ANCHORS = [
  "demo",
  "fonctionnalites",
  "tarifs",
  "sur-mesure",
  "espace-maries",
  "jour-j",
  "faq",
];

export function FooterProductLinks({ labels }: { labels: string[] }) {
  const pathname = usePathname();
  const router = useRouter();
  // `usePathname` from `@/navigation` is locale-stripped: the homepage is "/".
  const isHome = pathname === "/";

  return (
    <ul className="mt-4 flex flex-col gap-3">
      {labels.map((label, i) => (
        <li key={label}>
          <button
            type="button"
            onClick={() =>
              // The footer renders on more than the homepage, where none of
              // these sections exist and scrolling in place did nothing.
              scrollToSection(PRODUCT_LINK_ANCHORS[i] ?? "demo", {
                isHome,
                navigate: (href) => router.push(href),
              })
            }
            className="font-body text-sm text-studio-jaune hover:text-white"
          >
            {label}
          </button>
        </li>
      ))}
    </ul>
  );
}
