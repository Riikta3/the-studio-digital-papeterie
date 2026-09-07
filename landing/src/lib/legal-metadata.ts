import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { buildAlternates } from "@/lib/seo-metadata";

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

  return {
    title: t("metaTitle"),
    alternates: buildAlternates(locale, path),
    robots: { index: false, follow: true },
  };
}
