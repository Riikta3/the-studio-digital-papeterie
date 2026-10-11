import type { Metadata } from "next";

import { CustomDomainNotFound } from "@/components/custom-domain/CustomDomainNotFound";
import { NotFoundViewLoader } from "@/components/home/NotFoundViewLoader";
import { isCoupleDomainRequest } from "@/lib/custom-domain-request";
import { CUSTOM_DOMAIN_NOT_FOUND_COPY } from "@/lib/custom-domain-routing";

/**
 * Next 16 resolves a not-found file's `generateMetadata` like a page's
 * (`getDefinedMetadata` on the error-convention module), so the tab title can
 * follow the host too. On a couple's domain it does not name the shop.
 */
export async function generateMetadata(): Promise<Metadata> {
  if (await isCoupleDomainRequest()) {
    return {
      title: CUSTOM_DOMAIN_NOT_FOUND_COPY.title,
      robots: { index: false, follow: false },
    };
  }

  return {
    title: "Page introuvable — The Studio Papeterie Digitale",
    robots: { index: false, follow: false },
  };
}

export default async function LocaleNotFound() {
  // On a couple's domain — a page the proxy rewrote that 404s (a Jour J the
  // couple has not switched on, say), or a path with a dot that the proxy
  // never saw — NotFoundView's shop menu, language switcher and studio links
  // have no business there. It gets the same bare page as the proxy's own 404.
  if (await isCoupleDomainRequest()) return <CustomDomainNotFound />;

  return <NotFoundViewLoader />;
}
