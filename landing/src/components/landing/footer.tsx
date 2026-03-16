import { Link } from "@/navigation";
import { Instagram } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { EmailLink } from "@/components/ui/EmailLink";

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
            <div className='flex gap-4 mt-4'>
              <a
                href='https://www.instagram.com/thestudio.papeterie'
                target='_blank'
                rel='noopener noreferrer'
                className='w-10 h-10 rounded-full border border-primary-foreground/20 flex items-center justify-center text-primary-foreground/60 hover:border-primary-foreground/50 hover:bg-white/10 hover:text-primary-foreground transition-all duration-300'
                aria-label='Instagram'
              >
                <Instagram size={20} strokeWidth={1.5} />
              </a>
              <a
                href='https://www.pinterest.fr/thestudiopapeterie'
                target='_blank'
                rel='noopener noreferrer'
                className='w-10 h-10 rounded-full border border-primary-foreground/20 flex items-center justify-center text-primary-foreground/60 hover:border-primary-foreground/50 hover:bg-white/10 hover:text-primary-foreground transition-all duration-300'
                aria-label='Pinterest'
              >
                <svg
                  width='20'
                  height='20'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='1.5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <line
                    x1='12'
                    y1='8'
                    x2='12'
                    y2='22'
                  />
                  <path d='M9 22c-1.25 0-2.5-1-2.5-2.5 0-1.5 1.5-2.5 2.5-2.5h3v2.5c0 1.5-1.25 2.5-2.5 2.5z' />
                  <path d='M8 10.5C9 8.5 12 6 12 2s4 6 5 8.5' />
                  <path d='M16 10.5c1-2 2.5-3.5 2.5-5.5 0-1.5-1.5-2.5-2.5-2.5s-2.5 1-2.5 2.5v2.5' />
                </svg>
              </a>
              <a
                href='https://www.tiktok.com/@thestudio.papeterie'
                target='_blank'
                rel='noopener noreferrer'
                className='w-10 h-10 rounded-full border border-primary-foreground/20 flex items-center justify-center text-primary-foreground/60 hover:border-primary-foreground/50 hover:bg-white/10 hover:text-primary-foreground transition-all duration-300'
                aria-label='TikTok'
              >
                <svg
                  width='18'
                  height='18'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='1.5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <path d='M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5' />
                </svg>
              </a>
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
                    href='/#demo-viewer'
                    className='text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors'
                  >
                    {t("linkDemo")}
                  </Link>
                </li>
                <li>
                  <Link
                    href='/#comment-ca-marche'
                    className='text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors'
                  >
                    {t("linkFeatures")}
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
                  <Link
                    href='/#temoignages'
                    className='text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors'
                  >
                    {t("linkTestimonials")}
                  </Link>
                </li>
                <li>
                  <EmailLink
                    email={t("linkBespokeEmail") || "contact@thestudiopapeteriedigitale.com"}
                    className='text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors'
                  >
                    {t("linkBespoke")}
                  </EmailLink>
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
