import NextLink from "next/link";
import type { ReactNode } from "react";

import { guestHref } from "@/lib/custom-domain-routing";
import { Link } from "@/navigation";

/**
 * A link to a Jour J page, `subpath` being "" for its home or `ma-table`,
 * `menu`, `photos`.
 *
 * On a couple's own domain the path is the clean one (`/jourj/menu`, or
 * `/en/jourj/menu` past their first language) and it goes through `next/link`:
 * next-intl's `Link` always re-adds the locale (`localePrefix` is `'always'`),
 * which would send the guest to a path that domain does not serve. On the
 * generic link it is today's slugged path through next-intl's `Link`.
 *
 * No "use client": it renders as whichever side imports it.
 */
export function GuestLink({
  subpath,
  slug,
  custom,
  base,
  className,
  children,
}: {
  subpath: string;
  slug: string;
  custom: boolean;
  base: string;
  className?: string;
  children: ReactNode;
}) {
  const href = guestHref(subpath, { slug, base, custom });

  return custom ? (
    <NextLink href={href} className={className}>
      {children}
    </NextLink>
  ) : (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
