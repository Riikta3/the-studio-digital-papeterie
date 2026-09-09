import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site";

// Lives at src/app/ (not under [locale]/) so the URL stays /robots.txt with
// no locale prefix. Without this file the proxy matcher lets /robots.txt fall
// through to the catch-all page render, which served the HTML homepage with a
// 200 — an unparseable robots.txt as far as crawlers are concerned.
export default function robots(): MetadataRoute.Robots {
  // Resolved here, not at module load: getSiteUrl() throws in production when
  // NEXT_PUBLIC_SITE_URL is missing, and a module-level call would turn that
  // into a build failure instead of a request-time error.
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The studio funnel is NOT disallowed here, deliberately, even though it
      // must stay out of the index. It now serves `noindex` from
      // `[locale]/studio/layout.tsx`, and a crawler has to fetch a page to see
      // that header — Disallow would block the fetch and leave any already-
      // indexed URL stuck, since the directive it needs is unreachable. Crawl
      // it, read the noindex, drop it: that is the working order.
      //
      // Locale-prefixed routes need a wildcard: a bare "/jourj/" would match
      // no real URL, since every page lives under /{locale}/.
      disallow: ["/api/", "/*/jourj/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
