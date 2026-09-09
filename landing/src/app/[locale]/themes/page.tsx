import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getSiteUrl } from "@/lib/site";
import { buildOpenGraph } from "@/lib/seo-metadata";
import {
  THEME_PAGE_SLUGS,
  assertThemePageLocale,
  themePageAlternates,
  themePageLocaleParams,
  themePageSlugPath,
} from "@/lib/theme-pages";
import { Link } from "@/navigation";
import { PageHeader } from "@/components/home/PageHeader";

/**
 * The theme collection page — the site's second indexable URL.
 *
 * Until this shipped the whole domain had one page Google could rank (plus two
 * legal pages marked `index: false`), which is why nothing but the homepage's
 * own keyword had anywhere to land. The three themes were already built and
 * already beautiful, and reachable only through `/invitation/demo/<id>`, which
 * is correctly `noindex` — a preview rendering demo content on a real domain.
 * These pages are the indexable counterpart: editorial copy about each theme,
 * linking out to that demo.
 */

export function generateStaticParams() {
  return themePageLocaleParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!assertThemePageLocale(locale)) return {};

  const t = await getTranslations({ locale, namespace: "Themes" });
  const siteUrl = getSiteUrl();
  const ogPath = themePageSlugPath();

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    // Self-referencing canonical only — see `themePageAlternates` on why there
    // is no hreflang map while the pages are French-only.
    alternates: themePageAlternates(locale, siteUrl),
    // The whole block, not a patch: declaring `openGraph` at all replaces the
    // layout's object wholesale.
    openGraph: buildOpenGraph({
      locale,
      path: ogPath,
      title: t("metaTitle"),
      description: t("metaDescription"),
    }),
    robots: { index: true, follow: true },
  };
}

export default async function ThemesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // A locale with no `Themes` copy would otherwise render its heading as the
  // literal message key — next-intl's default fallback — and Google would
  // index that.
  if (!assertThemePageLocale(locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "Themes" });

  return (
    <main className="bg-studio-creme">
      <PageHeader />

      <section className="px-6 py-20 md:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex items-center justify-center gap-3 font-body text-h5 tracking-luxe text-studio-pourpre">
            <Image
              src="/images/eyebrow-separator-left.svg"
              alt=""
              width={42}
              height={1}
            />
            <span>{t("eyebrow")}</span>
            <Image
              src="/images/eyebrow-separator-right.svg"
              alt=""
              width={42}
              height={1}
            />
          </div>
          <h1 className="mt-4 font-heading text-h1 text-studio-violet">
            {t("h1")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl font-body text-sm leading-relaxed text-studio-violet/70 md:text-base">
            {t("intro")}
          </p>
        </div>

        <ul className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-3">
          {THEME_PAGE_SLUGS.map((slug) => (
            <li key={slug}>
              {/* One link wrapping the whole card rather than a link on the
                  image and another on the title: two anchors to the same URL
                  split the internal link signal and make the card two tab
                  stops. */}
              <Link
                href={`/themes/${slug}`}
                className="group block overflow-hidden rounded-2xl border border-studio-lavande/40 bg-white transition-colors hover:border-studio-lavande"
              >
                <Image
                  src={`/themes/${slug}/cover.webp`}
                  alt={t(`items.${slug}.tagline`)}
                  width={780}
                  height={1452}
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="h-auto w-full"
                />
                <div className="p-6">
                  <h2 className="font-heading text-h3 text-studio-violet">
                    {t(`items.${slug}.h1`).split(",")[0]}
                  </h2>
                  <p className="mt-2 font-body text-sm leading-relaxed text-studio-violet/70">
                    {t(`items.${slug}.tagline`)}
                  </p>
                  <span className="mt-4 inline-block font-body text-h5 tracking-luxe text-studio-pourpre underline-offset-4 group-hover:underline">
                    {t("cardCta")}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
