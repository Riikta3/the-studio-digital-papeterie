"use client";

import { Button } from "@shared/components/ui/button";
import { SplitText } from "@shared/components/ui/split-text";
import { ArrowRight, Menu } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { hasThemePages } from "@/lib/theme-pages";
import { Link } from "@/navigation";

import { HeroCarousel } from "./HeroCarousel";
import {
  setSelectedThemeIndex,
  useSelectedThemeIndex,
} from "./selected-theme";
import { StickyHeader } from "./StickyHeader";
import { THEMES } from "./themes";
import { TextureOverlay } from "./TextureOverlay";

// The drawer is closed on load and never opens during a page-load trace, but
// it (and the language switcher inside it) was pulling its whole subtree into
// the homepage's eager entry graph. Named export, hence the explicit .then().
// Gating the render is required, not cosmetic: without it next/dynamic still
// fetches the chunk on mount. It stays mounted after the first open so
// MobileMenu's own <AnimatePresence> can still play its exit animation.
const MobileMenu = dynamic(
  () => import("./MobileMenu").then((m) => m.MobileMenu),
  { ssr: false },
);

// The hero copy renders plainly (`animate={false}`). The word-by-word reveal
// this component used to run staggered every block behind the previous one's
// last word, which put a ~3.6s chain in front of text that is already in the
// initial viewport — it delayed the largest paint rather than decorating it.

export function Hero() {
  const t = useTranslations("Hero");
  const locale = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  // Latches on the first open: gates the dynamic import without discarding
  // the drawer's exit animation on close.
  const [menuMounted, setMenuMounted] = useState(false);
  const title1Text = t("titleLine1");
  const subtitleText = t("subtitle");

  // The violet backdrop must always stop exactly at the vertical midpoint of
  // the carousel, regardless of screen size or translated text length (both
  // change the height of the content above it). Measure the real DOM heights
  // instead of hardcoding a vh/px value.
  const contentRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [violetHeight, setVioletHeight] = useState<number | null>(null);
  // The fan opens on its middle card; `HeroCarousel` centres on the same index.
  // The selection is shared with the phone mockup below rather than kept local,
  // so "Tester le thème X" scrolls to a mockup already showing X.
  const activeThemeName = THEMES[useSelectedThemeIndex()].name;

  useEffect(() => {
    const measure = () => {
      const contentH = contentRef.current?.offsetHeight ?? 0;
      const carouselEl = carouselRef.current;
      const carouselH = carouselEl?.offsetHeight ?? 0;
      const carouselMarginTop = carouselEl
        ? parseFloat(getComputedStyle(carouselEl).marginTop)
        : 0;
      setVioletHeight(contentH + carouselMarginTop + carouselH / 2);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (contentRef.current) ro.observe(contentRef.current);
    if (carouselRef.current) ro.observe(carouselRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div id="accueil" className="relative bg-studio-beurre">
      {/* Rendered server-side with a viewport-derived fallback height, then
          refined by the measurement effect. It used to be gated on
          `violetHeight !== null` and fade itself in, which meant the hero's
          own background colour was absent from the SSR HTML and only appeared
          after hydration — pure Speed Index cost for no visual gain. */}
      <div
        style={{ height: violetHeight ?? undefined }}
        className={`absolute inset-x-0 top-0 overflow-hidden bg-studio-violet ${
          violetHeight === null ? "h-[62vh] md:h-[68vh]" : ""
        }`}
      >
        <TextureOverlay />
        <Image
          src="/images/hero-leaf-top.svg"
          alt=""
          width={82}
          height={138}
          className="pointer-events-none absolute right-0 top-16 h-auto w-24 md:top-24 md:w-40"
        />
      </div>

      <div className="relative z-10 flex flex-col items-center pt-8 md:pt-10">
        <div ref={contentRef} className="flex w-full flex-col items-center">
        <nav className="flex w-full max-w-6xl items-center justify-between px-6 md:px-12">
          <Image src="/logo.svg" alt="The Studio Digital Papeterie" width={40} height={42} />
          <button
            type="button"
            onClick={() => {
              setMenuMounted(true);
              setMenuOpen(true);
            }}
            aria-label={t("menuAriaLabel")}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-studio-jaune text-studio-violet"
          >
            <Menu className="h-5 w-5" />
          </button>
        </nav>

        <StickyHeader
          onOpenMenu={() => {
            setMenuMounted(true);
            setMenuOpen(true);
          }}
          menuAriaLabel={t("menuAriaLabel")}
        />

        {menuMounted && (
          <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
        )}

        <div className="flex flex-col items-center px-6 md:px-12">
          {/* The two lines carry one sentence, so the whitespace between the
              spans is content, not formatting. The spans are `block`, which
              every layout engine and Google treat as a line break, but the raw
              HTML has no separator between the closing and opening tag —
              anything reading the markup without applying CSS would run the two
              lines together into a single word. The explicit space costs
              nothing visually (it collapses at the end of a block line) and
              keeps the sentence intact in the text extraction. */}
          <h1 className="mt-10 text-center font-heading text-h1 md:mt-14">
            <SplitText
              as="span"
              text={title1Text}
              className="block text-white"
              animate={false}
            />{" "}
            <SplitText
              as="span"
              text={t("titleLine2")}
              className="block text-studio-jaune"
              animate={false}
            />
          </h1>

          <SplitText
            as="p"
            text={subtitleText}
            className="mt-4 text-center font-body text-body-p text-white/80"
            animate={false}
          />

          <div className="mt-8 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:justify-center sm:gap-4">
            {/* A real link to /themes, not the `scrollIntoView("#demo")` this
                used to be. The button said "Découvrir les collections" and
                scrolled to the phone mockup, so the collections had no
                crawlable path into them at all — the theme pages would have
                been orphans, reachable only from the sitemap. Same intent for
                the visitor, and now a link Google can follow.
                Only where those pages exist: `hasThemePages` is false for the
                eight locales whose `Themes` copy is unwritten, and they 404,
                so those keep scrolling to the mockup instead. */}
            {hasThemePages(locale) ? (
              <Button variant="studio-outline" size="pill" asChild>
                <Link href="/themes">{t("discoverButton")}</Link>
              </Button>
            ) : (
              <Button
                variant="studio-outline"
                size="pill"
                onClick={() =>
                  document
                    .getElementById("demo")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                {t("discoverButton")}
              </Button>
            )}
            <Button variant="studio-jaune" size="pill" asChild>
              <Link href="/studio/start">
                {t("createButton")} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
        </div>

        <div ref={carouselRef} className="relative mt-4 w-full md:mt-20">
          <div className="relative z-10">
            <HeroCarousel onActiveThemeChange={setSelectedThemeIndex} />
          </div>
          <Image
            src="/images/hero-leaf-bottom.svg"
            alt=""
            width={106}
            height={188}
            className="pointer-events-none absolute left-2 top-4 z-0 h-auto w-28 md:left-12 md:top-8 md:w-44"
          />
        </div>

        <div className="relative z-10 mt-4 flex w-full justify-center px-6 md:px-12">
          <Button
            variant="studio-violet"
            size="pill"
            className="text-studio-jaune"
            // Targets the phone mockup, not the #demo section: the visitor
            // asked to *see* the theme, so the scroll should settle on the
            // preview itself rather than on the section heading above it.
            onClick={() =>
              document
                .getElementById("demo-phone")
                ?.scrollIntoView({ behavior: "smooth", block: "center" })
            }
          >
            {t("themeCta", { name: activeThemeName })}{" "}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
