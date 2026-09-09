import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ContactForm } from "@/components/contact/ContactForm";
import { PageHeader } from "@/components/home/PageHeader";
import { Footer } from "@/components/home/Footer";
import { TextureOverlay } from "@/components/home/TextureOverlay";
import { buildAlternates, buildOpenGraph } from "@/lib/seo-metadata";
import { routing } from "@/navigation";

/**
 * The Contact page — owner brief: `.superpowers/sdd/2026-09-09-contact-form/
 * owner-brief-fr.md`. That brief supersedes the original spec for layout,
 * copy and structure; this file follows it, not the spec.
 *
 * Short hero, two-column desktop layout (editorial column + form), reordered
 * on mobile so the form comes right after the hero copy and the editorial
 * block becomes a secondary block afterwards — see the brief's "Mobile"
 * section for the exact order. Achieved with `order-*` rather than two
 * separate markups: same DOM, same content for SEO either way.
 */

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Contact" });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: buildAlternates(locale, "/contact"),
    openGraph: buildOpenGraph({
      locale,
      path: "/contact",
      title: t("meta.title"),
      description: t("meta.description"),
    }),
    robots: { index: true, follow: true },
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "Contact" });
  const markers = t.raw("editorial.markers") as {
    title: string;
    desc: string;
  }[];

  // beurre, not creme: creme (#FFFDE8) sat so close to the jaune of the burger
  // and the option pills that both read as washed out against it. beurre
  // (#FFF9D6) is the deeper of the two page yellows already in the palette, so
  // the yellow UI on top of it keeps its edge.
  return (
    <main className="bg-studio-beurre">
      <PageHeader />

      {/* ── HERO — short on purpose, no big block before the form ── */}
      <section className="px-6 pb-4 pt-6 md:px-12 md:pb-10 md:pt-10">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex items-center justify-center gap-3 font-body text-h5 tracking-luxe text-studio-pourpre">
            <Image
              src="/images/eyebrow-separator-left.svg"
              alt=""
              width={42}
              height={1}
            />
            <span>{t("hero.eyebrow")}</span>
            <Image
              src="/images/eyebrow-separator-right.svg"
              alt=""
              width={42}
              height={1}
            />
          </div>
          <h1 className="mt-4 font-heading text-h1 text-studio-violet">
            {t("hero.h1")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl font-body text-sm leading-relaxed text-studio-violet/70 md:text-base">
            {t("hero.subtitle")}
          </p>
        </div>
      </section>

      {/* ── TWO-COLUMN BODY ──
          Mobile order (see brief): form, then the editorial block.
          Desktop: editorial column on the start side, form on the end side —
          `order-*` handles both from one markup. */}
      <section className="px-6 pb-24 md:px-12">
        {/* `items-start`: the two columns are different heights, and without it
            the grid stretches both to the taller one — which, combined with
            the editorial column's own centring, pushed its heading 350px below
            the form's first field on desktop. Both columns start at the top. */}
        <div className="mx-auto grid max-w-5xl items-start gap-14 md:grid-cols-2 md:gap-16">
          <div className="order-2 flex flex-col gap-10 md:order-1">
            <div>
              <h2 className="font-heading text-h3 text-studio-violet">
                {t("editorial.title")}
              </h2>
              <p className="mt-4 font-body text-sm leading-relaxed text-studio-violet/70 md:text-base">
                {t("editorial.text")}
              </p>
            </div>

            <ul className="flex flex-col gap-6">
              {markers.map((marker) => (
                <li
                  key={marker.title}
                  className="border-s-2 border-studio-lavande ps-4"
                >
                  <p className="font-body text-sm font-semibold text-studio-violet">
                    {marker.title}
                  </p>
                  <p className="mt-1 font-body text-sm text-studio-violet/60">
                    {marker.desc}
                  </p>
                </li>
              ))}
            </ul>

            <div className="border-t border-studio-violet/10 pt-6">
              <p className="font-heading text-lg text-studio-violet">
                {t("editorial.signatureName")}
              </p>
              <p className="mt-1 font-body text-sm text-studio-violet/60">
                {t("editorial.signatureTagline")}
              </p>
            </div>
          </div>

          <div className="order-1 md:order-2">
            <ContactForm />
          </div>
        </div>
      </section>

      <div className="relative overflow-hidden bg-studio-violet">
        <TextureOverlay />
        <div className="relative">
          <Footer />
        </div>
      </div>
    </main>
  );
}
