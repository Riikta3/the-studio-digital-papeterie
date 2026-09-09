import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import {
  hasJournal,
  isJournalSlug,
  journalAlternates,
  journalParams,
  journalPath,
  journalSlugPath,
  publishedRelated,
} from "@/lib/journal";
import { buildOpenGraph } from "@/lib/seo-metadata";
import { getSiteUrl } from "@/lib/site";
import { Link } from "@/navigation";

type Section = { title: string; body: string };

export function generateStaticParams() {
  return journalParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasJournal(locale) || !isJournalSlug(slug)) return {};

  const t = await getTranslations({ locale, namespace: `Journal.articles.${slug}` });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: journalAlternates(locale, getSiteUrl(), slug),
    openGraph: {
      ...buildOpenGraph({
        locale,
        path: journalSlugPath(slug),
        title: t("metaTitle"),
        description: t("metaDescription"),
      }),
      // Overrides the "website" the helper defaults to. An article shared on
      // LinkedIn or Facebook is rendered differently from a landing page.
      type: "article",
    },
    robots: { index: true, follow: true },
  };
}

export default async function JournalArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!hasJournal(locale) || !isJournalSlug(slug)) notFound();
  setRequestLocale(locale);

  const [t, tShared] = await Promise.all([
    getTranslations({ locale, namespace: `Journal.articles.${slug}` }),
    getTranslations({ locale, namespace: "Journal" }),
  ]);

  const sections = t.raw("sections") as Section[];
  // The copy names its ideal neighbours; only the written ones render.
  const related = publishedRelated(t.raw("related") as string[], slug);

  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}${journalPath(locale, slug)}`;

  /**
   * `Article` plus a `BreadcrumbList`.
   *
   * No `datePublished`: the articles are evergreen and carry no visible date,
   * and schema.org dates that contradict the page (or that never move) are
   * worse than absent. No `FAQPage` either — Google restricted that rich
   * result to government and health sites in 2023, and the single question at
   * the foot of each article is there for the reader, not for markup.
   */
  const graph = [
    {
      "@type": "Article",
      "@id": `${pageUrl}#article`,
      headline: t("metaTitle"),
      description: t("metaDescription"),
      inLanguage: locale,
      isPartOf: { "@id": `${siteUrl}/#website` },
      publisher: { "@id": `${siteUrl}/#organization` },
      author: { "@id": `${siteUrl}/#organization` },
      mainEntityOfPage: pageUrl,
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${pageUrl}#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: tShared("eyebrow"),
          item: `${siteUrl}${journalPath(locale)}`,
        },
        { "@type": "ListItem", position: 2, name: t("h1"), item: pageUrl },
      ],
    },
  ];

  return (
    <main className="bg-studio-creme">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": graph,
          }).replace(/</g, "\\u003c"),
        }}
      />

      <article className="px-6 py-20 md:px-12">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/journal"
            className="font-body text-h5 tracking-luxe text-studio-pourpre underline-offset-4 hover:underline"
          >
            ← {tShared("backToJournal")}
          </Link>

          <h1 className="mt-8 font-heading text-h1 text-studio-violet">
            {t("h1")}
          </h1>
          {/* The lede is deliberately larger than the body: it carries the
              short answer, so a reader who stops there still has one. */}
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

          <div className="mt-12 rounded-2xl border border-studio-lavande/40 bg-white p-6 md:p-8">
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

          {related.length > 0 && (
            <nav className="mt-12" aria-labelledby="related-heading">
              <h2
                id="related-heading"
                className="font-heading text-h3 text-studio-violet"
              >
                {tShared("relatedTitle")}
              </h2>
              <ul className="mt-5 flex flex-col gap-3">
                {related.map((other) => (
                  <li key={other}>
                    <Link
                      href={`/journal/${other}`}
                      className="font-body text-sm text-studio-pourpre underline-offset-4 hover:underline md:text-base"
                    >
                      → {tShared(`articles.${other}.h1`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <aside className="mt-12 rounded-2xl bg-studio-violet p-6 text-white md:p-8">
            <h2 className="font-heading text-h3">{tShared("ctaTitle")}</h2>
            <p className="mt-3 font-body text-sm leading-relaxed text-white/80 md:text-base">
              {tShared("ctaBody")}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/themes"
                className="inline-flex items-center justify-center rounded-full bg-studio-jaune px-6 py-3 font-body text-sm tracking-luxe text-studio-violet transition-opacity hover:opacity-90"
              >
                {tShared("ctaCollections")}
              </Link>
              <Link
                href="/studio/start"
                className="inline-flex items-center justify-center rounded-full border border-white/40 px-6 py-3 font-body text-sm tracking-luxe text-white transition-colors hover:bg-white/10"
              >
                {tShared("ctaCreate")}
              </Link>
            </div>
          </aside>
        </div>
      </article>
    </main>
  );
}
