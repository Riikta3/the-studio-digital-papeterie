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
 * - Product/AggregateOffer — makes the price range eligible to show in the SERP.
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

  // The pricing section now offers three tiers; the SERP wants the range, so
  // the cheapest and dearest are read off the same translated plan list the
  // section renders. Prices are formatted per locale ("199€", "€199",
  // "199 يورو"), and AggregateOffer wants bare numbers with the currency in
  // its own field.
  type PricingPlan = { price: string };
  const planPrices = (tPricing.raw("plans") as PricingPlan[])
    .map((plan) => Number(plan.price.replace(/[^0-9.,]/g, "").replace(",", ".")))
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b);

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
        "@type": "AggregateOffer",
        lowPrice: planPrices[0],
        highPrice: planPrices[planPrices.length - 1],
        offerCount: planPrices.length,
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
