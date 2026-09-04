"use client";

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
  return (
    <ul className="mt-4 flex flex-col gap-3">
      {labels.map((label, i) => (
        <li key={label}>
          <button
            type="button"
            onClick={() =>
              document
                .getElementById(PRODUCT_LINK_ANCHORS[i] ?? "demo")
                ?.scrollIntoView({ behavior: "smooth" })
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
