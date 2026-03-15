import { Link } from "@/navigation";
import { getTranslations } from "next-intl/server";
import Image from "next/image";

export async function Footer() {
  const t = await getTranslations("Footer");

  return (
    <footer className='bg-primary text-primary-foreground'>
      <div className='container mx-auto px-4 py-16'>
        {/* Top row */}
        <div className='flex flex-col md:flex-row justify-between gap-10 mb-12'>
          {/* Logo + tagline + social */}
          <div className='flex flex-col gap-4 max-w-[220px]'>
            <div className='relative h-20 w-40'>
              <Image
                src='/images/logo-the-studio-rectangulaire.svg'
                alt='The Studio Digital Papeterie — Faire-part digital haut de gamme'
                fill
                className='object-contain brightness-0 invert'
              />
            </div>
            <p className='text-sm italic text-primary-foreground/60 font-heading leading-relaxed'>
              {t("tagline")}
            </p>
            <div className='flex gap-3 mt-2'>
              {(["ig", "pi", "tk"] as const).map((s) => (
                <div
                  key={s}
                  className='w-8 h-8 rounded-full border border-primary-foreground/20 flex items-center justify-center text-xs text-primary-foreground/60 hover:border-primary-foreground/50 hover:text-primary-foreground transition-colors cursor-pointer'
                >
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* 3 columns */}
          <div className='grid grid-cols-2 md:grid-cols-3 gap-8'>
            {/* Produit */}
            <div>
              <h4 className='text-[10px] uppercase tracking-[0.2em] text-primary-foreground/40 font-medium mb-4'>
                {t("colProduct")}
              </h4>
              <ul className='flex flex-col gap-3'>
                <li>
                  <Link
                    href='/#themes'
                    className='text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors'
                  >
                    {t("linkThemes")}
                  </Link>
                </li>
                <li>
                  <Link
                    href='/#themes'
                    className='text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors'
                  >
                    {t("linkDemo")}
                  </Link>
                </li>
                <li>
                  <Link
                    href='/#comparatif'
                    className='text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors'
                  >
                    {t("linkPricing")}
                  </Link>
                </li>
                <li>
                  <a
                    href='mailto:hello@thestudio-papeterie.fr'
                    className='text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors'
                  >
                    {t("linkBespoke")}
                  </a>
                </li>
              </ul>
            </div>
            {/* Mariés */}
            <div>
              <h4 className='text-[10px] uppercase tracking-[0.2em] text-primary-foreground/40 font-medium mb-4'>
                {t("colMarries")}
              </h4>
              <ul className='flex flex-col gap-3'>
                <li>
                  <Link
                    href='/login'
                    className='text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors'
                  >
                    {t("linkLogin")}
                  </Link>
                </li>
                <li>
                  <Link
                    href='/create'
                    className='text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors'
                  >
                    {t("linkCreate")}
                  </Link>
                </li>
              </ul>
            </div>
            {/* Légal */}
            <div>
              <h4 className='text-[10px] uppercase tracking-[0.2em] text-primary-foreground/40 font-medium mb-4'>
                {t("colLegal")}
              </h4>
              <ul className='flex flex-col gap-3'>
                <li>
                  <Link
                    href='/legal/cgv'
                    className='text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors'
                  >
                    {t("linkCGV")}
                  </Link>
                </li>
                <li>
                  <Link
                    href='/legal/privacy'
                    className='text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors'
                  >
                    {t("linkPrivacy")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className='border-t border-primary-foreground/10 pt-8 text-center text-xs text-primary-foreground/30 tracking-wide'>
          {t("copyright", { year: new Date().getFullYear() })}
        </div>
      </div>
    </footer>
  );
}
