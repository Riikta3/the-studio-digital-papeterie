import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site";
import { routing } from "@/navigation";

// Public, indexable routes only — the studio funnel and the guest /jourj
// pages are disallowed in robots.ts and deliberately absent here.
const PATHS = ["", "/legal/cgv", "/legal/privacy"];

export default function sitemap(): MetadataRoute.Sitemap {
  // Hoisted so every entry reports one consistent timestamp.
  const lastModified = new Date();
  // See robots.ts: resolved here rather than at module load.
  const siteUrl = getSiteUrl();

  return routing.locales.flatMap((locale) =>
    PATHS.map((path) => ({
      url: `${siteUrl}/${locale}${path}`,
      lastModified,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, `${siteUrl}/${l}${path}`]),
        ),
      },
    })),
  );
}
