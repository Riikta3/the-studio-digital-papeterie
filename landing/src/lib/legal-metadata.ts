import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { getSiteUrl } from "@/lib/site";
import { routing } from "@/navigation";

/**
 * Metadata for the two legal pages.
 *
 * They only ever returned a `title`. Both exist in all nine locales and are
 * listed in the sitemap, so Google saw eighteen near-identical pages with no
 * language signal and no canonical — a duplicate-content risk for no gain.
 *
 * `index: false, follow: true` on purpose: terms and a privacy policy have no
 * search value of their own, but they must keep passing link equity back to
 * the pages that do.
 */
export async function buildLegalMetadata({
  locale,
  namespace,
  path,
}: {
  locale: string;
  namespace: "Legal.Cgv" | "Legal.Privacy";
  path: string;
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace });
  const siteUrl = getSiteUrl();

  return {
    title: t("metaTitle"),
    alternates: {
      canonical: `${siteUrl}/${locale}${path}`,
      languages: {
        ...Object.fromEntries(
          routing.locales.map((l) => [l, `${siteUrl}/${l}${path}`]),
        ),
        "x-default": `${siteUrl}/${routing.defaultLocale}${path}`,
      },
    },
    robots: { index: false, follow: true },
  };
}
