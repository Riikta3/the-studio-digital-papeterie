import { getTranslations } from "next-intl/server";

import { getSiteUrl } from "@/lib/site";

type FaqItem = { question: string; answer: string };

/**
 * schema.org payload for the homepage.
 *
 * Emitted server-side as one `<script type="application/ld+json">`: Google
 * parses this from the served HTML, so it must not depend on hydration.
 *
 * Three graph nodes, each earning its place:
 * - Organization — brand identity, feeds the Knowledge Panel.
 * - Product/Offer — makes the price eligible to show in the SERP.
 * - FAQPage — the six questions already translated in `Faq`, which can
 *   double the result's vertical footprint.
 */
export async function StructuredData({ locale }: { locale: string }) {
  const [tMeta, tFaq, tPricing] = await Promise.all([
    getTranslations({ locale, namespace: "Metadata" }),
    getTranslations({ locale, namespace: "Faq" }),
    getTranslations({ locale, namespace: "Pricing" }),
  ]);

  const siteUrl = getSiteUrl();
  const localeUrl = `${siteUrl}/${locale}`;
  const faqs = tFaq.raw("items") as FaqItem[];

  // "175€" in the messages; Offer.price wants a bare number and the currency
  // in its own field.
  const price = tPricing("studioPrice").replace(/[^0-9.,]/g, "").replace(",", ".");

  const graph = [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "The Studio Digital Papeterie",
      url: siteUrl,
      logo: `${siteUrl}/logo.svg`,
      description: tMeta("description"),
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "The Studio Digital Papeterie",
      publisher: { "@id": `${siteUrl}/#organization` },
      inLanguage: locale,
    },
    {
      "@type": "Product",
      "@id": `${localeUrl}#product`,
      name: tMeta("ogTitle"),
      description: tMeta("description"),
      brand: { "@id": `${siteUrl}/#organization` },
      offers: {
        "@type": "Offer",
        price,
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        url: localeUrl,
      },
    },
    {
      "@type": "FAQPage",
      "@id": `${localeUrl}#faq`,
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    },
  ];

  return (
    <script
      type="application/ld+json"
      // Serialised, not interpolated: a `<` inside a translated answer would
      // otherwise be able to close the tag early.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": graph,
        }).replace(/</g, "\\u003c"),
      }}
    />
  );
}
