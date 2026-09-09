import { getLocale, getTranslations } from "next-intl/server";
import Image from "next/image";

import { hasJournal } from "@/lib/journal";
import { hasLandingPages } from "@/lib/landing-pages";
import { hasThemePages } from "@/lib/theme-pages";
import { Link } from "@/navigation";

import { FooterProductLinks } from "./FooterProductLinks";

export async function Footer() {
  const t = await getTranslations("Footer");
  const locale = await getLocale();
  const year = new Date().getFullYear();
  const productLinkLabels = t.raw("productLinks") as string[];
  // Sign-in lives in the dashboard app, a different origin — there is no
  // /login page in this app, so an in-app <Link> here 404s. Same pattern as
  // `actions/create-wedding.ts`, which already redirects there after checkout.
  const dashboardUrl =
    process.env.NEXT_PUBLIC_DASHBOARD_URL ||
    "https://app-the-studio-digital-papeterie.vercel.app";
  const mariesLinks = [
    { label: t("login"), href: `${dashboardUrl}/fr/login`, external: true },
  ];
  const legalLinks = [
    { label: t("cgv"), href: "/legal/cgv" },
    { label: t("privacy"), href: "/legal/privacy" },
  ];
  // Only where the pages exist: the collections and the Journal are
  // French-only (see `theme-pages.ts` and `journal.ts`), and the other eight
  // locales 404. An empty array renders no column at all.
  const resourceLinks = [
    ...(hasThemePages(locale)
      ? [{ label: t("collections"), href: "/themes" }]
      : []),
    ...(hasLandingPages(locale)
      ? [{ label: t("pricing"), href: "/tarifs" }]
      : []),
    ...(hasJournal(locale) ? [{ label: t("journal"), href: "/journal" }] : []),
  ];

  return (
    <div className="relative overflow-hidden border-t border-white/10 px-6 py-14 md:px-12">
      <Image
        src="/images/hero-leaf-bottom.svg"
        alt=""
        width={106}
        height={188}
        className="pointer-events-none absolute -right-4 top-16 h-auto w-24 md:-right-6 md:w-32"
      />

      {/* Five columns from `md`, not four: the Resources column (collections +
          Journal) was wrapping "Légal" onto a second row under the logo, which
          left the footer visibly lopsided. Below `md` the two-column layout is
          unchanged. */}
      <div className="relative mx-auto grid max-w-5xl grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-5">
        <div className="col-span-2 md:col-span-1">
          <Image
            src="/logo.svg"
            alt={t("logoAlt")}
            width={40}
            height={42}
          />
        </div>

        <nav>
          <p className="font-body text-h5 tracking-luxe text-white/50">
            {t("colProduct")}
          </p>
          <FooterProductLinks labels={productLinkLabels} />
        </nav>

        <div className="flex flex-col gap-8 md:contents">
          <nav>
            <p className="font-body text-h5 tracking-luxe text-white/50">
              {t("colMaries")}
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              {mariesLinks.map((link) => (
                <li key={link.label}>
                  {/* A plain anchor, not next-intl's Link: this target is
                      another origin, and Link would prefix it with a locale. */}
                  <a
                    href={link.href}
                    className="font-body text-sm text-studio-jaune hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {resourceLinks.length > 0 && (
            <nav>
              <p className="font-body text-h5 tracking-luxe text-white/50">
                {t("colResources")}
              </p>
              <ul className="mt-4 flex flex-col gap-3">
                {resourceLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-body text-sm text-studio-jaune hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <nav>
            <p className="font-body text-h5 tracking-luxe text-white/50">
              {t("colLegal")}
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="font-body text-sm text-studio-jaune hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      <p className="relative mx-auto mt-14 max-w-5xl border-t border-white/10 pt-6 text-center font-body text-xs text-white/50">
        {t("copyright", { year })}
      </p>
    </div>
  );
}
