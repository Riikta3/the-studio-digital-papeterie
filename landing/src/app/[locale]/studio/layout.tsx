import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * Keeps the whole studio funnel out of the index.
 *
 * Every page under /studio was serving a robots meta of "index, follow",
 * inherited from the [locale] layout, which sets robots.index = true for the
 * marketing pages and is the right default there. None of the five funnel
 * pages declared its own, so all five were indexable, checkout included.
 *
 * robots.txt was not covering this. It disallows the checkout step with a
 * wildcard locale pattern, but Disallow governs CRAWLING, not indexing: a URL
 * that Google is told not to
 * fetch can still be indexed from a link elsewhere, and then appears in
 * results with no snippet — the worst of both outcomes. The four earlier
 * steps were not disallowed at all.
 *
 * This is a layout rather than a metadata export on each of the five pages
 * because every page in the funnel is a Client Component ("use client"), and
 * a client module cannot export metadata at all. A Server Component layout at
 * the segment root covers all of them, and covers any step added later by
 * default — which is the behaviour worth having: a new funnel step should
 * have to opt IN to being indexed, not remember to opt out.
 *
 * follow stays true rather than nofollow: the funnel links back to the
 * homepage and the legal pages, and there is no reason to stop equity flowing
 * back to them.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function StudioLayout({ children }: { children: ReactNode }) {
  return children;
}
