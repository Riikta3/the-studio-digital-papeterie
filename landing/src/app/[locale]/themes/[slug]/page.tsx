import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { themeDemoPath } from "@/components/home/themes";
import { getSiteUrl } from "@/lib/site";
import { buildOpenGraph } from "@/lib/seo-metadata";
import {
  assertThemePageLocale,
  isThemeId,
  themePageAlternates,
  themePageParams,
  themePagePath,
  themePageSlugPath,
} from "@/lib/theme-pages";
import { Link } from "@/navigation";

/**
 * One theme's marketing page.
 *
 * Distinct from `/invitation/demo/<id>`, which renders the theme itself with
 * demo content and is `noindex`. This page is *about* the theme: editorial
 * copy, its palette, what an invitation built on it contains, and links to the
 * demo and the studio. It is the indexable surface; the demo stays a preview.
 */

export function generateStaticParams() {
  return themePageParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!assertThemePageLocale(locale) || !isThemeId(slug)) return {};

  const t = await getTranslations({ locale, namespace: `Themes.items.${slug}` });
  const siteUrl = getSiteUrl();
  const ogPath = themePageSlugPath(slug);

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: themePageAlternates(locale, siteUrl, slug),
    openGraph: buildOpenGraph({
      locale,
      path: ogPath,
      title: t("metaTitle"),
      description: t("metaDescription"),
    }),
    robots: { index: true, follow: true },
  };
}

export default async function ThemePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  // `isThemeId` narrows the slug, so a hand-typed URL 404s instead of throwing
  // on a missing translation namespace.
  if (!assertThemePageLocale(locale) || !isThemeId(slug)) notFound();
  setRequestLocale(locale);

  const [t, tShared] = await Promise.all([
    getTranslations({ locale, namespace: `Themes.items.${slug}` }),
    getTranslations({ locale, namespace: "Themes" }),
  ]);

  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}${themePagePath(locale, slug)}`;

  /**
   * `Product` rather than `WebPage`: the page sells one purchasable design.
   *
   * No `offers` node — the three price tiers are a property of the plan the
   * couple picks in the studio, not of the theme, and every theme is available
   * on every plan. Attaching the homepage's `AggregateOffer` here would tell
   * Google each theme has its own price range, which is not true.
   */
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${pageUrl}#product`,
    name: t("h1"),
    description: t("metaDescription"),
    image: `${siteUrl}/themes/${slug}/cover.webp`,
    brand: { "@id": `${siteUrl}/#organization` },
    url: pageUrl,
    isPartOf: { "@id": `${siteUrl}/#website` },
  };

  return (
    <main className="bg-studio-creme">
      <script
        type="application/ld+json"
        // Serialised, not interpolated: a `<` inside translated copy would
        // otherwise be able to close the tag early.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productLd).replace(/</g, "\\u003c"),
        }}
      />

      <section className="px-6 py-20 md:px-12">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/themes"
            className="font-body text-h5 tracking-luxe text-studio-pourpre underline-offset-4 hover:underline"
          >
            ← {tShared("backToCollections")}
          </Link>

          <p className="mt-8 font-body text-h5 tracking-luxe text-studio-pourpre">
            {t("tagline")}
          </p>
          <h1 className="mt-3 font-heading text-h1 text-studio-violet">
            {t("h1")}
          </h1>

          <div className="mt-8 space-y-5 font-body text-sm leading-relaxed text-studio-violet/70 md:text-base">
            <p>{t("intro")}</p>
            <p>{t("body1")}</p>
            <p>{t("body2")}</p>
            <p>{t("body3")}</p>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-2xl">
          <Image
            src={`/themes/${slug}/cover.webp`}
            alt={`${t("h1")} — aperçu de la collection`}
            width={780}
            height={1452}
            sizes="(min-width: 768px) 768px, 100vw"
            className="h-auto w-full"
            priority
          />
        </div>

        <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-studio-lavande/40 bg-white p-6 md:p-8">
          <h2 className="font-heading text-h3 text-studio-violet">
            {tShared("sectionsTitle")}
          </h2>
          <p className="mt-3 font-body text-sm leading-relaxed text-studio-violet/70 md:text-base">
            {t("bestFor")}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {/* A plain <a>, not next-intl's Link: the demo route is outside
                this page's locale-prefixed navigation and is `noindex`, so it
                is a preview to open rather than part of the crawlable set. */}
            <a
              href={themeDemoPath(locale, slug)}
              className="inline-flex items-center justify-center rounded-full border border-studio-lavande px-6 py-3 font-body text-sm tracking-luxe text-studio-violet transition-colors hover:bg-studio-lavande/20"
            >
              {tShared("previewCta")}
            </a>
            <Link
              href="/studio/start"
              className="inline-flex items-center justify-center rounded-full bg-studio-jaune px-6 py-3 font-body text-sm tracking-luxe text-studio-violet transition-opacity hover:opacity-90"
            >
              {tShared("createCta")}
            </Link>
          </div>
        </div>

        {/* One question per theme, answering the objection that theme actually
            raises — not a copy of the homepage's FAQ, which would be duplicate
            body copy on a different URL. Rendered open: there is a single
            entry, so there is nothing to collapse away. */}
        <div className="mx-auto mt-12 max-w-3xl">
          <h2 className="font-heading text-h3 text-studio-violet">
            {tShared("faqSectionTitle")}
          </h2>
          <h3 className="mt-6 font-heading text-lg text-studio-violet md:text-xl">
            {t("faqTitle")}
          </h3>
          <p className="mt-3 font-body text-sm leading-relaxed text-studio-violet/70 md:text-base">
            {t("faqBody")}
          </p>
        </div>
      </section>
    </main>
  );
}
