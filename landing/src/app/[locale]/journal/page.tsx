import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import {
  JOURNAL_SLUGS,
  hasJournal,
  journalAlternates,
  journalLocaleParams,
  journalSlugPath,
} from "@/lib/journal";
import { buildOpenGraph } from "@/lib/seo-metadata";
import { getSiteUrl } from "@/lib/site";
import { Link } from "@/navigation";
import { PageHeader } from "@/components/home/PageHeader";

/**
 * The Journal index.
 *
 * Its job in the site's structure is to be the hub of a topical cluster: each
 * article answers one query a couple actually types, and links to its
 * neighbours, so the set reads as coverage of a subject rather than five
 * unrelated posts. It also gives the FAQ and the theme pages somewhere to
 * point once those internal links go in.
 */

export function generateStaticParams() {
  return journalLocaleParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasJournal(locale)) return {};

  const t = await getTranslations({ locale, namespace: "Journal" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: journalAlternates(locale, getSiteUrl()),
    openGraph: buildOpenGraph({
      locale,
      path: journalSlugPath(),
      title: t("metaTitle"),
      description: t("metaDescription"),
    }),
    robots: { index: true, follow: true },
  };
}

export default async function JournalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasJournal(locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "Journal" });

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

        <ul className="mx-auto mt-14 flex max-w-2xl flex-col gap-4">
          {JOURNAL_SLUGS.map((slug) => (
            <li key={slug}>
              <Link
                href={`/journal/${slug}`}
                className="group block rounded-2xl border border-studio-lavande/40 bg-white p-6 transition-colors hover:border-studio-lavande md:p-8"
              >
                <h2 className="font-heading text-h3 text-studio-violet">
                  {t(`articles.${slug}.h1`)}
                </h2>
                <p className="mt-3 font-body text-sm leading-relaxed text-studio-violet/70 md:text-base">
                  {t(`articles.${slug}.metaDescription`)}
                </p>
                <span className="mt-4 inline-block font-body text-h5 tracking-luxe text-studio-pourpre underline-offset-4 group-hover:underline">
                  {t("readMore")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
