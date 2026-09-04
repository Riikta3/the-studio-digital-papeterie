// Canonical origin for absolute URLs in <link rel="canonical">, hreflang,
// Open Graph, robots.txt and the sitemap.
//
// Single source of truth on purpose: metadata, robots and sitemap must not
// drift apart.
//
// A function rather than a constant: `next build` imports every route to
// collect page data, so resolving (and possibly rejecting) the environment at
// module load would fail the build instead of the request. Same reasoning as
// the lazy Stripe client in `lib/stripe.ts`.
export { getLandingUrl as getSiteUrl } from "@/lib/urls";
