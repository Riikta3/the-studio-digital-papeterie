import type { Metadata } from "next";

import { getSiteUrl } from "@/lib/site";
import { routing } from "@/navigation";

/**
 * Canonical + hreflang for one page, in one place.
 *
 * Next merges metadata per key, not per field: a page that returns no
 * `alternates` inherits the parent layout's object verbatim. The `[locale]`
 * layout used to declare `canonical: ${siteUrl}/${locale}`, and because that
 * is an absolute string (not a `URL` instance and not a relative path) Next
 * never merges the current pathname into it — every sub-page announced the
 * homepage as its canonical, which asks Google to drop it in favour of `/`.
 *
 * So the layout no longer declares a canonical at all, and every indexable
 * page calls this with its own locale-less path ("" for the homepage,
 * "/themes", "/themes/belle-rive"). A page that forgets emits no canonical
 * link, which is merely a missed opportunity rather than a deindex request.
 *
 * `path` must NOT carry the locale prefix and must NOT end in a slash.
 */
export function buildAlternates(locale: string, path: string): Metadata["alternates"] {
  const siteUrl = getSiteUrl();

  return {
    canonical: `${siteUrl}/${locale}${path}`,
    languages: {
      ...Object.fromEntries(
        routing.locales.map((l) => [l, `${siteUrl}/${l}${path}`]),
      ),
      "x-default": `${siteUrl}/${routing.defaultLocale}${path}`,
    },
  };
}

/**
 * The Open Graph block for one page.
 *
 * Declaring `openGraph` at all REPLACES the parent's object wholesale — Next
 * resolves only the child's own object, so a page returning `{ url }` alone
 * silently loses `siteName`, `type`, `locale`, `alternateLocale` and, worse,
 * the `opengraph-image.tsx` image that the `[locale]` segment injects. Every
 * caller therefore gets the whole block, not a patch of it.
 *
 * `images` is deliberately absent: Next fills it from the file convention in
 * this segment whenever the page's own metadata does not declare the key.
 */
export function buildOpenGraph({
  locale,
  path,
  title,
  description,
}: {
  locale: string;
  path: string;
  title: string;
  description: string;
}): Metadata["openGraph"] {
  return {
    type: "website",
    siteName: "The Studio Digital Papeterie",
    locale,
    alternateLocale: routing.locales.filter((l) => l !== locale),
    url: `${getSiteUrl()}/${locale}${path}`,
    title,
    description,
  };
}
