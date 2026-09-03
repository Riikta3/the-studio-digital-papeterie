import { getTranslations } from "next-intl/server";
import Image from "next/image";

import { Link } from "@/navigation";

import { FooterProductLinks } from "./FooterProductLinks";

export async function Footer() {
  const t = await getTranslations("Footer");
  const year = new Date().getFullYear();
  const productLinkLabels = t.raw("productLinks") as string[];
  // Sign-in lives in the dashboard app, a different origin — there is no
  // /login page in this app, so an in-app <Link> here 404s. Same pattern as
  // `actions/create-wedding.ts`, which already redirects there after checkout.
  const dashboardUrl =
    process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3003";
  const mariesLinks = [
    { label: t("login"), href: `${dashboardUrl}/fr/login`, external: true },
  ];
  const legalLinks = [
    { label: t("cgv"), href: "/legal/cgv" },
    { label: t("privacy"), href: "/legal/privacy" },
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

      <div className="relative mx-auto grid max-w-5xl grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
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
