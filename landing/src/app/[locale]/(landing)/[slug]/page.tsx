import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import {
  hasLandingPages,
  isLandingSlug,
  landingAlternates,
  landingParams,
  landingPath,
  landingSlugPath,
  showsPricing,
} from "@/lib/landing-pages";
import { buildOpenGraph } from "@/lib/seo-metadata";
import { getSiteUrl } from "@/lib/site";
import { Link } from "@/navigation";
import { PageHeader } from "@/components/home/PageHeader";

type Section = { title: string; body: string };
type Plan = {
  id: string;
  name: string;
  price: string;
  description: string;
  positioning?: string;
};
type CompareRow = Record<string, string>;

/**
 * The three commercial landing pages, on one route.
 *
 * Grouped in a `(landing)` route group so the slugs sit at the root of the
 * locale — `/fr/tarifs`, not `/fr/pages/tarifs`. A shorter URL containing only
 * the keyword is the whole point of these pages.
 *
 * The route group matters for a second reason: a bare `[slug]` directly under
 * `[locale]` would compete with every other first-level segment (`themes`,
 * `journal`, `studio`, `legal`). Next resolves static segments before dynamic
 * ones, so those still win, but `isLandingSlug` is what makes the intent
 * explicit — anything not in the list 404s instead of rendering an empty page.
 */

export function generateStaticParams() {
  return landingParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLandingPages(locale) || !isLandingSlug(slug)) return {};

  const t = await getTranslations({ locale, namespace: `Landing.pages.${slug}` });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: landingAlternates(locale, getSiteUrl(), slug),
    openGraph: buildOpenGraph({
      locale,
      path: landingSlugPath(slug),
      title: t("metaTitle"),
      description: t("metaDescription"),
    }),
    robots: { index: true, follow: true },
  };
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!hasLandingPages(locale) || !isLandingSlug(slug)) notFound();
  setRequestLocale(locale);

  const [t, tShared, tPricing] = await Promise.all([
    getTranslations({ locale, namespace: `Landing.pages.${slug}` }),
    getTranslations({ locale, namespace: "Landing" }),
    getTranslations({ locale, namespace: "Pricing" }),
  ]);

  const sections = t.raw("sections") as Section[];
  const withPricing = showsPricing(slug);
  // Read from the Pricing namespace the homepage already renders, so a price
  // cannot drift between the two pages that quote it.
  const plans = withPricing ? (tPricing.raw("plans") as Plan[]) : [];
  const compareRows = withPricing
    ? (tPricing.raw("compareRows") as CompareRow[])
    : [];

  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}${landingPath(locale, slug)}`;

  /**
   * `WebPage` on the two prose pages; `Product` with an `AggregateOffer` on
   * `/tarifs`, which is the only one of the three that states a price.
   *
   * The offer range is computed from the same translated plan list the table
   * renders, so the markup and the visible price cannot disagree — Google
   * treats that mismatch as a structured-data violation.
   */
  const prices = plans
    .map((plan) => Number(plan.price.replace(/[^0-9.,]/g, "").replace(",", ".")))
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b);

  const node = withPricing
    ? {
        "@type": "Product",
        "@id": `${pageUrl}#product`,
        name: t("h1"),
        description: t("metaDescription"),
        brand: { "@id": `${siteUrl}/#organization` },
        offers: {
          "@type": "AggregateOffer",
          lowPrice: prices[0],
          highPrice: prices[prices.length - 1],
          offerCount: prices.length,
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          url: pageUrl,
        },
      }
    : {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        name: t("metaTitle"),
        description: t("metaDescription"),
        inLanguage: locale,
        isPartOf: { "@id": `${siteUrl}/#website` },
        publisher: { "@id": `${siteUrl}/#organization` },
      };

  return (
    <main className="bg-studio-creme">
      <PageHeader />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [node],
          }).replace(/</g, "\\u003c"),
        }}
      />

      <section className="px-6 py-20 md:px-12">
        <div className="mx-auto max-w-2xl">
          <p className="font-body text-h5 tracking-luxe text-studio-pourpre">
            {t("eyebrow")}
          </p>
          <h1 className="mt-3 font-heading text-h1 text-studio-violet">
            {t("h1")}
          </h1>
          <p className="mt-6 font-body text-base leading-relaxed text-studio-violet/80 md:text-lg">
            {t("lede")}
          </p>

          <div className="mt-12 flex flex-col gap-10">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="font-heading text-h3 text-studio-violet">
                  {section.title}
                </h2>
                <p className="mt-3 font-body text-sm leading-relaxed text-studio-violet/70 md:text-base">
                  {section.body}
                </p>
              </section>
            ))}
          </div>
        </div>

        {withPricing && (
          <>
            <div className="mx-auto mt-16 max-w-5xl">
              <h2 className="text-center font-heading text-h2 text-studio-violet">
                {t("plansTitle")}
              </h2>
              <ul className="mt-10 grid gap-6 md:grid-cols-3">
                {plans.map((plan) => (
                  <li
                    key={plan.id}
                    className="flex flex-col rounded-2xl border border-studio-lavande/40 bg-white p-6"
                  >
                    <h3 className="font-heading text-h3 text-studio-violet">
                      {plan.name}
                    </h3>
                    <p className="mt-2 font-heading text-h2 text-studio-pourpre">
                      {plan.price}
                    </p>
                    <p className="mt-4 flex-1 font-body text-sm leading-relaxed text-studio-violet/70">
                      {plan.description}
                    </p>
                    <Link
                      href={`/studio/start?plan=${plan.id}`}
                      className="mt-6 inline-flex items-center justify-center rounded-full bg-studio-jaune px-6 py-3 font-body text-sm tracking-luxe text-studio-violet transition-opacity hover:opacity-90"
                    >
                      {tShared("createCta")}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* `w-full` alongside `max-w-3xl`, unlike the other blocks on this
                page: a plain max-width lets a block-level div take its
                CONTENT's width when that is wider, and the table inside has a
                34rem min-width. At 320px this container grew past the viewport
                and the page scrolled sideways with the plan columns
                unreachable, instead of the table scrolling inside it. */}
            <div className="mx-auto mt-16 w-full max-w-3xl">
              <h2 className="font-heading text-h3 text-studio-violet">
                {t("compareTitle")}
              </h2>

              {/* Below `md`, one block per plan instead of the table: the same
                  rows, read down rather than across, so nothing sits
                  off-screen. Only the included features are listed — a mobile
                  reader comparing offers wants to know what a plan HAS, and
                  nine "non inclus" lines under Signature is noise. The table
                  below still carries both states for wider screens. */}
              <div className="mt-6 flex flex-col gap-4 md:hidden">
                {plans.map((plan) => {
                  const included = compareRows.filter(
                    (row) => row[plan.id] === "inc",
                  );
                  return (
                    <div
                      key={plan.id}
                      className="rounded-2xl border border-studio-lavande/40 bg-white p-5"
                    >
                      <h3 className="font-heading text-lg text-studio-violet">
                        {plan.name}
                      </h3>
                      {included.length > 0 ? (
                        <ul className="mt-3 flex flex-col gap-2">
                          {included.map((row) => (
                            <li
                              key={row.key}
                              className="font-body text-sm text-studio-violet/70"
                            >
                              {row.label}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-3 font-body text-sm text-studio-violet/70">
                          {plan.positioning || plan.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Hidden below `md`, where the mobile list above replaces it.
                  A 34rem table inside a 272px column scrolls correctly, but a
                  reader at 320px saw only the feature labels with all three
                  plan columns off-screen and no affordance saying they could
                  swipe — a comparison table where the things being compared
                  are invisible. */}
              <div className="mt-6 hidden min-w-0 overflow-x-auto md:block">
                <table className="w-full min-w-[34rem] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-studio-lavande/40">
                      <th className="py-3 pr-4 font-body text-h5 tracking-luxe text-studio-violet/60">
                        {tPricing("compareFeatureHeader")}
                      </th>
                      {plans.map((plan) => (
                        <th
                          key={plan.id}
                          className="py-3 px-3 font-heading text-base text-studio-violet"
                        >
                          {plan.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {compareRows.map((row) => (
                      <tr
                        key={row.key}
                        className="border-b border-studio-lavande/20"
                      >
                        <th
                          scope="row"
                          className="py-3 pr-4 font-body text-sm font-normal text-studio-violet/70"
                        >
                          {row.label}
                        </th>
                        {plans.map((plan) => (
                          <td
                            key={plan.id}
                            className="py-3 px-3 font-body text-sm text-studio-violet/70"
                          >
                            {/* The glyph is decorative; the sr-only text is
                                what a screen reader announces, so a row is
                                not read as a line of bare symbols. */}
                            <span aria-hidden="true">
                              {row[plan.id] === "inc" ? "●" : "—"}
                            </span>
                            <span className="sr-only">
                              {row[plan.id] === "inc"
                                ? tPricing("compareIncluded")
                                : tPricing("compareExcluded")}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 font-body text-sm text-studio-violet/60">
                {tPricing("note")}
              </p>
            </div>
          </>
        )}

        <div className="mx-auto mt-16 max-w-2xl">
          <div className="rounded-2xl border border-studio-lavande/40 bg-white p-6 md:p-8">
            <h2 className="font-heading text-h3 text-studio-violet">
              {tShared("faqSectionTitle")}
            </h2>
            <h3 className="mt-5 font-heading text-lg text-studio-violet md:text-xl">
              {t("faqTitle")}
            </h3>
            <p className="mt-3 font-body text-sm leading-relaxed text-studio-violet/70 md:text-base">
              {t("faqBody")}
            </p>
          </div>

          <aside className="mt-8 rounded-2xl bg-studio-violet p-6 text-white md:p-8">
            <h2 className="font-heading text-h3">{t("ctaTitle")}</h2>
            <p className="mt-3 font-body text-sm leading-relaxed text-white/80 md:text-base">
              {t("ctaBody")}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/themes"
                className="inline-flex items-center justify-center rounded-full bg-studio-jaune px-6 py-3 font-body text-sm tracking-luxe text-studio-violet transition-opacity hover:opacity-90"
              >
                {tShared("collectionsCta")}
              </Link>
              <Link
                href={withPricing ? "/studio/start" : "/tarifs"}
                className="inline-flex items-center justify-center rounded-full border border-white/40 px-6 py-3 font-body text-sm tracking-luxe text-white transition-colors hover:bg-white/10"
              >
                {withPricing ? tShared("createCta") : tShared("pricingCta")}
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
