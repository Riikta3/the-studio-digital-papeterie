import { headers } from "next/headers";

import {
  CUSTOM_DOMAIN_BASE_HEADER,
  CUSTOM_DOMAIN_HEADER,
  isCoupleDomainChrome,
} from "@/lib/custom-domain-routing";

/** Read once: `NEXT_PUBLIC_*` is fixed at build time anyway. */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

/**
 * Whether this request is being served on a couple's own domain, as
 * `proxy.ts` stamped it on its rewrite (spec D6). Server components only.
 *
 * Trustworthy on every page the proxy serves: it deletes any client-sent copy
 * of both headers before anything else, on every host. The paths its matcher
 * skips (any path with a dot) are the exception: nothing stamps them and
 * nothing deletes a forged copy. No page of a couple's is served there, only
 * the app's 404s, so those decide with `isCoupleDomainRequest()` instead, which
 * also looks at the host. A forged header there only changes what the forger
 * sees: no page is cached.
 *
 * `base` is the current locale's prefix on that domain (`""` or `/en`), which
 * the guest pages' links start with. Meaningless when `custom` is false.
 */
export async function getCustomDomainContext(): Promise<{
  custom: boolean;
  base: string;
}> {
  const headerList = await headers();
  const host = headerList.get(CUSTOM_DOMAIN_HEADER);

  return {
    custom: Boolean(host),
    base: host ? (headerList.get(CUSTOM_DOMAIN_BASE_HEADER) ?? "") : "",
  };
}

/**
 * Whether this request must wear a couple's domain's chrome rather than the
 * shop's: the bare 404 rather than `NotFoundView`, and no `ContactBubble` or
 * `CookieConsent`. Stamped by the proxy, or on a host that is not ours, so a
 * path the proxy never saw still gets it (see `isCoupleDomainChrome`). No
 * database call.
 *
 * The price, accepted: an alias of the shop's that `isOwnHost` does not list
 * gets the bare 404, and no contact bubble or cookie banner on any page (the
 * layout asks this too). Only 404s and chrome, never a working page, which the
 * proxy still serves as the shop. A missing cookie banner fails safe: without
 * consent, no non-essential cookie is set.
 */
export async function isCoupleDomainRequest(): Promise<boolean> {
  return isCoupleDomainChrome(await headers(), { siteUrl: SITE_URL });
}
