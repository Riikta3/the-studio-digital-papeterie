# Landing Page Refonte Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refondre la landing page de The Studio en une expérience de vente immersive haut de gamme avec Hero animé, catalogue filtrable, comparatif prix, témoignages carrousel et footer bordeaux.

**Architecture:** Chaque section est un composant autonome dans `landing/src/components/landing/`. Le hook `useImageSequence` est extrait pour la Hero. `page.tsx` est mis à jour en dernier (Chunk 4) quand tous les composants existent. Les traductions sont ajoutées en merge dans `fr.json` puis propagées aux 8 autres locales. Les sections existantes dépréciées sont retirées de `page.tsx` mais leurs fichiers sont conservés.

**Tech Stack:** Next.js 14 App Router, React, Tailwind CSS, Framer Motion, next-intl, shadcn/ui, Lucide icons

**Note sur les builds intermédiaires:** `page.tsx` n'est mis à jour qu'en Task 13 (dernier chunk) quand tous les composants existent. Chaque composant peut être développé et linté indépendamment sans casser le build.

---

## Chunk 1: Fondations — hook + traductions

### Task 1: Hook `useImageSequence`

**Files:**
- Create: `landing/src/hooks/use-image-sequence.ts`

- [ ] **Step 1: Créer le hook**

```typescript
// landing/src/hooks/use-image-sequence.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseImageSequenceOptions {
  frameCount: number;
  fps?: number;
  /** Must be a stable reference (module-level function or useCallback) */
  getFramePath: (index: number) => string;
  loop?: boolean;
}

export function useImageSequence({
  frameCount,
  fps = 24,
  getFramePath,
  loop = true,
}: UseImageSequenceOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const rafRef = useRef<number | null>(null);
  const currentFrameRef = useRef(0);
  const lastTimeRef = useRef(0);
  const [ready, setReady] = useState(false);

  const drawFrame = useCallback((index: number) => {
    const canvas = canvasRef.current;
    const img = framesRef.current[index];
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const scale = Math.max(
      canvas.width / img.naturalWidth,
      canvas.height / img.naturalHeight,
    );
    const sw = img.naturalWidth * scale;
    const sh = img.naturalHeight * scale;
    const sx = (canvas.width - sw) / 2;
    const sy = (canvas.height - sh) / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, sx, sy, sw, sh);
  }, []);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const startLoop = useCallback(() => {
    stopLoop();
    const interval = 1000 / fps;
    const tick = (now: number) => {
      if (now - lastTimeRef.current >= interval) {
        lastTimeRef.current = now;
        drawFrame(currentFrameRef.current);
        if (loop) {
          currentFrameRef.current = (currentFrameRef.current + 1) % frameCount;
        } else {
          if (currentFrameRef.current < frameCount - 1) {
            currentFrameRef.current += 1;
          } else {
            return; // stop at last frame
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [fps, frameCount, loop, drawFrame, stopLoop]);

  // Debounced resize handler
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      drawFrame(currentFrameRef.current);
    };
    let debounceTimer: ReturnType<typeof setTimeout>;
    const debouncedResize = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(handleResize, 150);
    };
    window.addEventListener("resize", debouncedResize);
    return () => {
      window.removeEventListener("resize", debouncedResize);
      clearTimeout(debounceTimer);
    };
  }, [drawFrame]);

  // Preload + autostart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth || window.innerWidth;
    canvas.height = canvas.offsetHeight || window.innerHeight;

    // prefers-reduced-motion: show first frame statically
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const img = new Image();
      img.onload = () => {
        framesRef.current[0] = img;
        drawFrame(0);
        setReady(true);
      };
      img.src = getFramePath(0);
      return;
    }

    // Load first frame, then stream the rest
    const firstImg = new Image();
    firstImg.onload = () => {
      framesRef.current[0] = firstImg;
      drawFrame(0);
      setReady(true);
      for (let i = 1; i < frameCount; i++) {
        const img = new Image();
        const idx = i;
        img.onload = () => {
          framesRef.current[idx] = img;
        };
        img.src = getFramePath(idx);
      }
      startLoop();
    };
    firstImg.src = getFramePath(0);

    return () => stopLoop();
  // getFramePath must be a stable reference — pass module-level functions or useCallback
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameCount, getFramePath]);

  return { canvasRef, ready };
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie
git add landing/src/hooks/use-image-sequence.ts
git commit -m "feat: add useImageSequence hook for looping canvas animation"
```

---

### Task 2: Traductions — merge dans fr.json et propagation

**Files:**
- Modify: `landing/messages/fr.json`
- Modify: `landing/messages/en.json` (et toutes les autres locales)

- [ ] **Step 1: Ajouter les nouvelles clés dans `fr.json` en conservant les clés existantes**

Ouvrir `landing/messages/fr.json` et **ajouter** les clés suivantes (ne pas supprimer les clés existantes `Features`, `FAQ`, `CookieConsent`) :

```json
{
  "Navbar": {
    "themes": "Thèmes",
    "demo": "Démo",
    "pricing": "Tarifs",
    "login": "Espace Mariés",
    "createButton": "Créer mon invitation"
  },
  "Hero": {
    "eyebrow": "Faire-part digital",
    "titleLine1": "Le faire-part",
    "titleLine2": "réinventé au digital",
    "description": "Pour les amoureux, les grandes fêtes et les invitations qui marquent le début d'une belle histoire.",
    "createButton": "Créer mon invitation",
    "demoButton": "Voir une démo",
    "discoverThemes": "Découvrir les thèmes"
  },
  "DemoSection": {
    "eyebrow": "Voir en vrai",
    "title": "Une invitation",
    "titleAccent": "comme la vôtre",
    "subtitle": "Ouvrez une vraie invitation et vivez l'expérience de vos invités.",
    "ctaButton": "Voir la démo live",
    "ctaSubtext": "Ouvrir une vraie invitation"
  },
  "HowItWorks": {
    "eyebrow": "Simple & rapide",
    "title": "En 3 étapes",
    "titleAccent": "c'est prêt",
    "step1Title": "Choisissez un design",
    "step1Desc": "Parcourez nos thèmes et trouvez celui qui vous ressemble.",
    "step2Title": "Personnalisez",
    "step2Desc": "Textes, photos, modules — tout se configure en quelques minutes.",
    "step3Title": "Envoyez le lien",
    "step3Desc": "Partagez par SMS, WhatsApp ou email. Vos invités reçoivent une expérience unique."
  },
  "Catalogue": {
    "eyebrow": "Les thèmes",
    "title": "Trouvez",
    "titleAccent": "votre style",
    "filterAll": "Tous",
    "filterEnvelope": "Enveloppe",
    "filterCurtains": "Rideaux",
    "filterDoors": "Portes",
    "badgeNew": "Nouveau",
    "themes": {
      "floral": "Floral",
      "boho": "Bohème",
      "minimalist": "Minimaliste",
      "royal": "Royal",
      "modern": "Modern",
      "champetre": "Champêtre",
      "voyage": "Voyage",
      "bridgerton": "Bridgerton",
      "oriental": "Oriental"
    }
  },
  "PricingComparison": {
    "eyebrow": "Pour 200 invités",
    "title": "La différence",
    "titleAccent": "qui compte",
    "paperLabel": "Papier traditionnel",
    "paperDetails": "Impression + timbres + enveloppes",
    "studioLabel": "The Studio",
    "studioDetails": "Tout inclus, illimité",
    "studioFrom": "À partir de",
    "savingBadge": "Économisez {amount}€",
    "feature1": "Envoi instantané",
    "feature2": "Modifiable",
    "feature3": "RSVP intégré",
    "feature4": "Zéro papier"
  },
  "ValueCards": {
    "eyebrow": "Pourquoi The Studio",
    "title": "Tout ce dont",
    "titleAccent": "vous avez besoin",
    "card1Title": "Design élégant",
    "card1Desc": "Thèmes créés par des graphistes, pour un rendu haut de gamme.",
    "card2Title": "Envoi instantané",
    "card2Desc": "Partagez le lien en un clic, vos invités l'ouvrent immédiatement.",
    "card3Title": "Écologique",
    "card3Desc": "Zéro papier, zéro timbre, zéro gaspillage.",
    "card4Title": "Modifiable",
    "card4Desc": "Changez les infos à tout moment, même après l'envoi.",
    "card5Title": "Sur-mesure",
    "card5Desc": "Modules au choix, langues multiples, votre histoire racontée à votre façon."
  },
  "Customization": {
    "eyebrow": "Aller plus loin",
    "title": "Personnalisation",
    "titleAccent": "sur-mesure",
    "subtitle": "Chaque mariage est unique. Votre invitation aussi.",
    "feature1Title": "Programme",
    "feature1Desc": "Déroulé de la journée, horaires, lieux.",
    "feature2Title": "Galerie photos",
    "feature2Desc": "Partagez vos plus belles photos en avant-première.",
    "feature3Title": "Liste de cadeaux",
    "feature3Desc": "Intégrez votre liste directement dans l'invitation.",
    "bespokeBadge": "100% sur-mesure",
    "bespokeTitle": "Un projet unique ?",
    "bespokeDesc": "Pour les mariages d'exception, nous proposons une création entièrement sur-mesure sur rendez-vous.",
    "bespokeButton": "Nous contacter",
    "bespokeEmail": "hello@thestudio-papeterie.fr"
  },
  "Testimonials": {
    "eyebrow": "Ils nous ont fait confiance",
    "badge": "Déjà 130+ invitations envoyées",
    "title": "Ce qu'ils",
    "titleAccent": "en pensent"
  },
  "Footer": {
    "tagline": "Le faire-part réinventé au digital.",
    "colProduct": "Produit",
    "colMarries": "Mariés",
    "colLegal": "Légal",
    "linkThemes": "Thèmes",
    "linkDemo": "Démo",
    "linkPricing": "Tarifs",
    "linkBespoke": "Sur-mesure",
    "linkLogin": "Se connecter",
    "linkCreate": "Créer mon invitation",
    "linkCGV": "CGV",
    "linkPrivacy": "Confidentialité",
    "copyright": "© {year} The Studio · Fait avec ♥ en France"
  }
}
```

- [ ] **Step 2: Propager les nouvelles clés dans les 8 autres locales**

Pour chaque fichier `landing/messages/{en,de,es,pt,it,ar,zh,ja}.json`, copier les mêmes blocs de clés avec les valeurs françaises comme placeholder (à traduire ultérieurement). Seule la valeur de `fr.json` doit être copiée, les clés doivent être identiques.

Ouvrir chaque fichier et ajouter les mêmes blocs JSON (`Navbar`, `Hero`, `DemoSection`, `HowItWorks`, `Catalogue`, `PricingComparison`, `ValueCards`, `Customization`, `Testimonials`, `Footer`) avec les mêmes valeurs qu'en français.

- [ ] **Step 3: Commit**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie
git add landing/messages/
git commit -m "feat: add translation keys for landing refonte (all locales, fr values as placeholder)"
```

---

## Chunk 2: Navbar + Hero

### Task 3: Refonte Navbar

**Files:**
- Modify: `landing/src/components/landing/navbar.tsx`

- [ ] **Step 1: Réécrire navbar.tsx**

```tsx
"use client";

import { LanguageSwitcher } from "@/components/language-switcher";
import { cn } from "@/lib/utils";
import { Link } from "@/navigation";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "framer-motion";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";

// Note: scrollTo only works when navbar is rendered on the home page.
// If Navbar is ever moved to a shared layout, these should become href="/#anchor" Links.
const NAV_LINKS = [
  { key: "themes" as const, anchor: "themes" },
  { key: "demo" as const, anchor: "apercu" },
  { key: "pricing" as const, anchor: "comparatif" },
] as const;

export function Navbar() {
  const t = useTranslations("Navbar");
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  const scrollTo = (anchor: string) => {
    setIsMobileMenuOpen(false);
    document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? "py-4" : "py-6",
      )}
    >
      <div className="container mx-auto px-4">
        <div
          className={cn(
            "mx-auto flex items-center justify-between px-6 transition-all duration-300",
            isScrolled
              ? "rounded-full bg-card/80 backdrop-blur-md shadow-sm border border-border/20 py-3 max-w-7xl"
              : "bg-transparent py-2 max-w-7xl",
          )}
        >
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 z-50 shrink-0"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div className="relative h-12 w-32">
              <Image
                src="/images/logo.png"
                alt="The Studio Digital Papeterie"
                fill
                className="object-contain mix-blend-multiply"
                priority
              />
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map(({ key, anchor }) => (
              <button
                key={key}
                onClick={() => scrollTo(anchor)}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {t(key)}
              </button>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-6 shrink-0">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("login")}
            </Link>
            <LanguageSwitcher />
            <Link
              href="/create"
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-transform hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              {t("createButton")}
            </Link>
          </div>

          {/* Mobile — CTA pill + burger */}
          <div className="flex items-center gap-3 lg:hidden z-50">
            <Link
              href="/create"
              onClick={() => setIsMobileMenuOpen(false)}
              className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-md active:scale-95 whitespace-nowrap"
            >
              {t("createButton")}
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-foreground"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 flex flex-col bg-background pt-24 px-6 lg:hidden overflow-y-auto"
          >
            <nav className="flex flex-col gap-6 items-center pb-8">
              <div className="mb-4">
                <LanguageSwitcher />
              </div>
              {NAV_LINKS.map(({ key, anchor }) => (
                <button
                  key={key}
                  onClick={() => scrollTo(anchor)}
                  className="text-2xl font-heading font-medium text-foreground hover:text-primary transition-colors"
                >
                  {t(key)}
                </button>
              ))}
              <div className="w-12 h-[1px] bg-border my-2" />
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-lg font-heading font-medium text-muted-foreground hover:text-primary"
              >
                {t("login")}
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
```

- [ ] **Step 2: Lint**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie/landing && npm run lint
```
Attendu : aucune erreur

- [ ] **Step 3: Commit**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie
git add landing/src/components/landing/navbar.tsx
git commit -m "feat: refonte navbar — 3 liens, CTA mobile pill, scrollTo"
```

---

### Task 4: Refonte Hero

**Files:**
- Modify: `landing/src/components/landing/hero.tsx`

- [ ] **Step 1: Réécrire hero.tsx**

```tsx
"use client";

import { useImageSequence } from "@/hooks/use-image-sequence";
import { Link } from "@/navigation";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

const DESKTOP_FRAME_COUNT = 34;
const MOBILE_FRAME_COUNT = 53;

// Module-level stable functions — safe to pass as getFramePath without useCallback
function getDesktopFrame(i: number) {
  return `/videos/desktop/Animation enveloppe personnalisée_${String(i).padStart(3, "0")}.webp`;
}
function getMobileFrame(i: number) {
  return `/videos/mobile/Mobile Test 2_${String(i).padStart(3, "0")}.webp`;
}

export function Hero() {
  const t = useTranslations("Hero");
  // Use ref instead of state to avoid double-initialization of the hook on mobile
  const isMobileRef = useRef(false);
  const frameCountRef = useRef(DESKTOP_FRAME_COUNT);
  const getFramePathRef = useRef(getDesktopFrame);

  useEffect(() => {
    isMobileRef.current = window.innerWidth < 768;
    if (isMobileRef.current) {
      frameCountRef.current = MOBILE_FRAME_COUNT;
      getFramePathRef.current = getMobileFrame;
    }
  }, []);

  const { canvasRef } = useImageSequence({
    frameCount: frameCountRef.current,
    fps: 24,
    getFramePath: getFramePathRef.current,
    loop: true,
  });

  const scrollToThemes = () => {
    document.getElementById("themes")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden pt-20">
      {/* Canvas background — looping image sequence */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: "cover" }}
        aria-hidden="true"
      />

      {/* Overlay vaporeux crème */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 5%, rgba(253,251,247,0.88) 75%)",
        }}
      />

      {/* Grain overlay */}
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.04] mix-blend-multiply bg-noise" />

      <div className="container relative mx-auto flex flex-col items-center justify-center px-4 text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, ease: "easeOut" }}
          className="flex max-w-4xl flex-col items-center gap-8"
        >
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xs uppercase tracking-[0.3em] text-primary font-medium"
          >
            {t("eyebrow")}
          </motion.p>

          <h1 className="font-heading text-6xl md:text-8xl font-medium tracking-tight text-foreground leading-[0.9] drop-shadow-sm">
            {t("titleLine1")} <br />
            <span className="italic text-primary font-semibold">
              {t("titleLine2")}
            </span>
          </h1>

          <p className="max-w-lg text-lg md:text-xl text-muted-foreground leading-relaxed">
            {t("description")}
          </p>

          <div className="mt-6 flex flex-col items-center gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link
                href="/create"
                className="group relative overflow-hidden rounded-full bg-primary px-10 py-4 text-base font-heading font-semibold italic text-primary-foreground shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl active:scale-95"
              >
                <span className="relative z-10 flex items-center gap-3">
                  {t("createButton")}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>

              <button
                onClick={() =>
                  document.getElementById("apercu")?.scrollIntoView({ behavior: "smooth" })
                }
                className="rounded-full border border-primary/40 px-8 py-4 text-base font-medium text-primary transition-all hover:bg-primary/5 active:scale-95"
              >
                {t("demoButton")}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll anchor — Découvrir les thèmes */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 1, repeat: Infinity, repeatType: "reverse" }}
        >
          <button
            onClick={scrollToThemes}
            className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <span className="text-[10px] uppercase tracking-widest font-medium">
              {t("discoverThemes")}
            </span>
            <ChevronDown className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Lint**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie/landing && npm run lint
```
Attendu : aucune erreur

- [ ] **Step 3: Commit**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie
git add landing/src/components/landing/hero.tsx
git commit -m "feat: refonte Hero — séquence WebP en boucle, overlay crème, 3 CTAs"
```

---

## Chunk 3: Sections de contenu

### Task 5: DemoSection

**Files:**
- Create: `landing/src/components/landing/demo-section.tsx`

- [ ] **Step 1: Ajouter `NEXT_PUBLIC_DEMO_WEDDING_CODE` au `.env.local`**

Ouvrir ou créer `landing/.env.local` et ajouter :
```
NEXT_PUBLIC_DEMO_WEDDING_CODE=<weddingCode d'une invitation existante en base>
```

- [ ] **Step 2: Créer le composant**

```tsx
"use client";

import { Link } from "@/navigation";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";

const DEMO_WEDDING_CODE = process.env.NEXT_PUBLIC_DEMO_WEDDING_CODE;

const THEME_SWATCHES = [
  { bg: "from-[#fdf5f7] to-[#f0d8dc]", label: "Floral" },
  { bg: "from-[#f5f3ee] to-[#e8dcc8]", label: "Bohème" },
  { bg: "from-[#1b2a41] to-[#2d4566]", label: "Royal" },
];

export function DemoSection() {
  const t = useTranslations("DemoSection");

  return (
    <section id="apercu" className="py-24 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center gap-12"
        >
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-primary font-medium mb-3">
              {t("eyebrow")}
            </p>
            <h2 className="font-heading text-4xl md:text-6xl font-medium text-foreground leading-tight">
              {t("title")}{" "}
              <span className="italic text-primary">{t("titleAccent")}</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-md mx-auto">
              {t("subtitle")}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-10">
            {/* Phone mockup */}
            <div
              className="w-[160px] h-[280px] rounded-[24px] border-2 border-primary/20 bg-white shadow-2xl overflow-hidden flex items-center justify-center"
              style={{ transform: "rotate(-4deg)" }}
            >
              <div className="w-[148px] h-[268px] rounded-[20px] bg-gradient-to-b from-[#fdf5f7] to-[#fdfbf7] flex flex-col items-center justify-center gap-3 p-4">
                <div className="relative w-16 h-11 border border-primary/30 rounded-sm bg-white shadow-sm">
                  <div
                    className="absolute inset-x-0 top-0 w-0 h-0 border-l-[32px] border-r-[32px] border-t-[20px] border-l-transparent border-r-transparent"
                    style={{ borderTopColor: "rgba(136,32,64,0.12)" }}
                  />
                  <div className="absolute inset-x-0 bottom-2 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-primary/80" />
                  </div>
                </div>
                <p className="font-heading italic text-primary text-sm text-center leading-tight">
                  Sophie & Thomas
                </p>
                <p className="text-[10px] text-muted-foreground text-center">14 juin 2026</p>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col items-center gap-3">
              {DEMO_WEDDING_CODE ? (
                <Link
                  href={`/invitation/${DEMO_WEDDING_CODE}`}
                  className="group flex items-center gap-3 rounded-2xl bg-primary px-8 py-5 text-primary-foreground shadow-xl hover:-translate-y-1 transition-all duration-300 active:scale-95"
                >
                  <span className="font-heading text-lg italic font-semibold">
                    {t("ctaButton")}
                  </span>
                  <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ) : null}
              <p className="text-xs text-muted-foreground">{t("ctaSubtext")}</p>
            </div>
          </div>

          {/* Theme swatches */}
          <div className="flex gap-4">
            {THEME_SWATCHES.map(({ bg, label }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className={`w-20 h-14 rounded-xl bg-gradient-to-br ${bg} border border-primary/10 shadow-sm`} />
                <span className="text-xs text-muted-foreground font-medium">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Lint**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie/landing && npm run lint
```
Attendu : aucune erreur

- [ ] **Step 4: Commit**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie
git add landing/src/components/landing/demo-section.tsx
git commit -m "feat: add DemoSection — phone mockup + CTA vers invitation live"
```

---

### Task 6: HowItWorks

**Files:**
- Create: `landing/src/components/landing/how-it-works.tsx`

- [ ] **Step 1: Créer le composant**

```tsx
"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Palette, Settings2, Send } from "lucide-react";

const STEPS = [
  { icon: Palette, titleKey: "step1Title", descKey: "step1Desc", number: "01" },
  { icon: Settings2, titleKey: "step2Title", descKey: "step2Desc", number: "02" },
  { icon: Send, titleKey: "step3Title", descKey: "step3Desc", number: "03" },
] as const;

export function HowItWorks() {
  const t = useTranslations("HowItWorks");

  return (
    <section id="comment-ca-marche" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-primary font-medium mb-3">
            {t("eyebrow")}
          </p>
          <h2 className="font-heading text-4xl md:text-6xl font-medium text-foreground leading-tight">
            {t("title")}{" "}
            <span className="italic text-primary">{t("titleAccent")}</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-10 left-[16.66%] right-[16.66%] h-[1px] bg-gradient-to-r from-primary/10 via-primary/30 to-primary/10" />

          {STEPS.map(({ icon: Icon, titleKey, descKey, number }, i) => (
            <motion.div
              key={number}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="flex flex-col items-center text-center gap-4"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-full border border-primary/20 bg-background flex items-center justify-center shadow-sm">
                  <Icon className="w-8 h-8 text-primary" strokeWidth={1.5} />
                </div>
                <span className="absolute -top-2 -right-2 text-[10px] font-heading font-bold text-primary/40 tracking-widest">
                  {number}
                </span>
              </div>
              <h3 className="font-heading text-xl font-semibold text-foreground">
                {t(titleKey)}
              </h3>
              <p className="text-muted-foreground leading-relaxed text-sm max-w-[240px]">
                {t(descKey)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Lint**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie/landing && npm run lint
```

- [ ] **Step 3: Commit**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie
git add landing/src/components/landing/how-it-works.tsx
git commit -m "feat: add HowItWorks — 3 étapes avec icônes"
```

---

### Task 7: Catalogue

**Files:**
- Create: `landing/src/components/landing/catalogue.tsx`

- [ ] **Step 1: Créer le composant**

```tsx
"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useState } from "react";

type OpeningType = "all" | "envelope" | "curtains" | "doors";

interface Theme {
  key: string;
  nameKey: string;
  opening: Exclude<OpeningType, "all">;
  openingLabelKey: string;
  bg: string;
  isNew?: boolean;
  tall?: boolean;
}

const THEMES: Theme[] = [
  { key: "floral", nameKey: "floral", opening: "envelope", openingLabelKey: "filterEnvelope", bg: "from-[#fdf5f7] to-[#f0d8dc]", isNew: true, tall: true },
  { key: "boho", nameKey: "boho", opening: "curtains", openingLabelKey: "filterCurtains", bg: "from-[#f5f3ee] to-[#e8dcc8]" },
  { key: "minimalist", nameKey: "minimalist", opening: "doors", openingLabelKey: "filterDoors", bg: "from-[#f5f5f3] to-[#e0ddd8]" },
  { key: "royal", nameKey: "royal", opening: "envelope", openingLabelKey: "filterEnvelope", bg: "from-[#1b2a41] to-[#2d4566]", tall: true },
  { key: "modern", nameKey: "modern", opening: "curtains", openingLabelKey: "filterCurtains", bg: "from-[#ede8f5] to-[#d5caea]", isNew: true },
  { key: "champetre", nameKey: "champetre", opening: "envelope", openingLabelKey: "filterEnvelope", bg: "from-[#eef5e8] to-[#d5e8c8]", tall: true },
  { key: "voyage", nameKey: "voyage", opening: "doors", openingLabelKey: "filterDoors", bg: "from-[#e8f0f8] to-[#c8daf0]" },
  { key: "bridgerton", nameKey: "bridgerton", opening: "curtains", openingLabelKey: "filterCurtains", bg: "from-[#f8f0f5] to-[#f0d8e8]", isNew: true },
  { key: "oriental", nameKey: "oriental", opening: "envelope", openingLabelKey: "filterEnvelope", bg: "from-[#f8f0e0] to-[#f0d8a8]", tall: true },
];

const FILTERS: { key: OpeningType; labelKey: string }[] = [
  { key: "all", labelKey: "filterAll" },
  { key: "envelope", labelKey: "filterEnvelope" },
  { key: "curtains", labelKey: "filterCurtains" },
  { key: "doors", labelKey: "filterDoors" },
];

export function Catalogue() {
  const t = useTranslations("Catalogue");
  const [activeFilter, setActiveFilter] = useState<OpeningType>("all");

  const filtered = THEMES.filter(
    (th) => activeFilter === "all" || th.opening === activeFilter,
  );

  return (
    <section id="themes" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-primary font-medium mb-3">
            {t("eyebrow")}
          </p>
          <h2 className="font-heading text-4xl md:text-6xl font-medium text-foreground leading-tight">
            {t("title")}{" "}
            <span className="italic text-primary">{t("titleAccent")}</span>
          </h2>
        </motion.div>

        {/* Tabs filter */}
        <div className="flex justify-center gap-8 mb-10 border-b border-border/40">
          {FILTERS.map(({ key, labelKey }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`pb-3 text-sm font-medium transition-all duration-200 border-b-2 -mb-[1px] ${
                activeFilter === key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>

        {/* Masonry grid */}
        <motion.div
          key={activeFilter}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="columns-2 md:columns-3 lg:columns-4 gap-4"
        >
          {filtered.map((theme) => (
            <div
              key={theme.key}
              className="break-inside-avoid mb-4 rounded-2xl overflow-hidden border border-border/20 hover:shadow-lg transition-shadow duration-300 cursor-pointer group"
            >
              <div
                className={`bg-gradient-to-br ${theme.bg} flex items-center justify-center relative ${
                  theme.tall ? "h-48" : "h-32"
                }`}
              >
                {theme.isNew && (
                  <span className="absolute top-3 right-3 bg-primary text-primary-foreground text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full">
                    {t("badgeNew")}
                  </span>
                )}
              </div>
              <div className="p-3 bg-white flex items-center justify-between gap-2">
                <p className="font-heading text-sm font-semibold text-foreground">
                  {t(`themes.${theme.nameKey}`)}
                </p>
                <span className="text-[9px] text-primary/60 border border-primary/15 rounded-full px-2 py-0.5 whitespace-nowrap flex-shrink-0">
                  {t(theme.openingLabelKey)}
                </span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Lint**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie/landing && npm run lint
```

- [ ] **Step 3: Commit**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie
git add landing/src/components/landing/catalogue.tsx
git commit -m "feat: add Catalogue — masonry + tabs filtres + badge ouverture sur chaque card"
```

---

## Chunk 4: Conversion + Footer + page.tsx

### Task 8: PricingComparison

**Files:**
- Create: `landing/src/components/landing/pricing-comparison.tsx`

- [ ] **Step 1: Créer le composant**

```tsx
"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";

const PAPER_PRICE = 860;
const STUDIO_PRICE = 149;
const SAVING = PAPER_PRICE - STUDIO_PRICE;

const FEATURE_KEYS = ["feature1", "feature2", "feature3", "feature4"] as const;

export function PricingComparison() {
  const t = useTranslations("PricingComparison");

  return (
    <section id="comparatif" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-primary font-medium mb-3">
            {t("eyebrow")}
          </p>
          <h2 className="font-heading text-4xl md:text-6xl font-medium text-foreground leading-tight">
            {t("title")}{" "}
            <span className="italic text-primary">{t("titleAccent")}</span>
          </h2>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-2 gap-4 md:gap-8">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="rounded-2xl border border-border p-6 md:p-8 bg-background text-center"
            >
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-4">
                {t("paperLabel")}
              </p>
              <p className="font-heading text-5xl font-semibold text-muted-foreground/60 line-through">
                {PAPER_PRICE}€
              </p>
              <p className="text-xs text-muted-foreground mt-2">{t("paperDetails")}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="rounded-2xl border-2 border-primary bg-primary/5 p-6 md:p-8 text-center relative"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
                {t("savingBadge", { amount: SAVING })}
              </div>
              <p className="text-xs uppercase tracking-widest text-primary font-medium mb-4">
                {t("studioLabel")}
              </p>
              <p className="text-xs text-primary/60 mb-1">{t("studioFrom")}</p>
              <p className="font-heading text-5xl font-semibold text-primary">
                {STUDIO_PRICE}€
              </p>
              <p className="text-xs text-muted-foreground mt-2">{t("studioDetails")}</p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2"
          >
            {FEATURE_KEYS.map((key) => (
              <span key={key} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                {t(key)}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Lint**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie/landing && npm run lint
```

- [ ] **Step 3: Commit**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie
git add landing/src/components/landing/pricing-comparison.tsx
git commit -m "feat: add PricingComparison — 2 cards prix + badge économie"
```

---

### Task 9: ValueCards

**Files:**
- Create: `landing/src/components/landing/value-cards.tsx`

- [ ] **Step 1: Créer le composant**

```tsx
"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Sparkles, Zap, Leaf, RefreshCw, Wand2 } from "lucide-react";

const CARDS = [
  { icon: Sparkles, titleKey: "card1Title", descKey: "card1Desc" },
  { icon: Zap, titleKey: "card2Title", descKey: "card2Desc" },
  { icon: Leaf, titleKey: "card3Title", descKey: "card3Desc" },
  { icon: RefreshCw, titleKey: "card4Title", descKey: "card4Desc" },
  { icon: Wand2, titleKey: "card5Title", descKey: "card5Desc" },
] as const;

export function ValueCards() {
  const t = useTranslations("ValueCards");

  return (
    <section id="valeur" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-primary font-medium mb-3">
            {t("eyebrow")}
          </p>
          <h2 className="font-heading text-4xl md:text-6xl font-medium text-foreground leading-tight">
            {t("title")}{" "}
            <span className="italic text-primary">{t("titleAccent")}</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {CARDS.map(({ icon: Icon, titleKey, descKey }, i) => (
            <motion.div
              key={titleKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="flex flex-col items-center text-center gap-3 p-6 rounded-2xl border border-border/40 bg-card hover:border-primary/20 hover:shadow-md transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="font-heading text-base font-semibold text-foreground">
                {t(titleKey)}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t(descKey)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Lint**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie/landing && npm run lint
```

- [ ] **Step 3: Commit**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie
git add landing/src/components/landing/value-cards.tsx
git commit -m "feat: add ValueCards — 5 cartes valeur ajoutée"
```

---

### Task 10: Customization

**Files:**
- Create: `landing/src/components/landing/customization.tsx`

- [ ] **Step 1: Créer le composant**

```tsx
"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { CalendarDays, Images, Gift, Mail } from "lucide-react";

const FEATURES = [
  { icon: CalendarDays, titleKey: "feature1Title", descKey: "feature1Desc" },
  { icon: Images, titleKey: "feature2Title", descKey: "feature2Desc" },
  { icon: Gift, titleKey: "feature3Title", descKey: "feature3Desc" },
] as const;

export function Customization() {
  const t = useTranslations("Customization");

  return (
    <section id="sur-mesure" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-primary font-medium mb-3">
            {t("eyebrow")}
          </p>
          <h2 className="font-heading text-4xl md:text-6xl font-medium text-foreground leading-tight">
            {t("title")}{" "}
            <span className="italic text-primary">{t("titleAccent")}</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-md mx-auto">{t("subtitle")}</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {FEATURES.map(({ icon: Icon, titleKey, descKey }, i) => (
            <motion.div
              key={titleKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-8 rounded-2xl border border-border/40 bg-background hover:border-primary/20 hover:shadow-md transition-all duration-300"
            >
              <Icon className="w-8 h-8 text-primary mb-4" strokeWidth={1.5} />
              <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
                {t(titleKey)}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{t(descKey)}</p>
            </motion.div>
          ))}
        </div>

        {/* Bespoke CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-xl mx-auto rounded-2xl border border-primary/20 bg-primary/5 p-10 text-center"
        >
          <span className="inline-block bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            {t("bespokeBadge")}
          </span>
          <h3 className="font-heading text-2xl font-semibold text-foreground mb-3">
            {t("bespokeTitle")}
          </h3>
          <p className="text-muted-foreground text-sm mb-6">{t("bespokeDesc")}</p>
          <a
            href={`mailto:${t("bespokeEmail")}`}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Mail className="w-4 h-4" />
            {t("bespokeButton")}
          </a>
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Lint**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie/landing && npm run lint
```

- [ ] **Step 3: Commit**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie
git add landing/src/components/landing/customization.tsx
git commit -m "feat: add Customization — modules + bespoke mailto CTA"
```

---

### Task 11: Refonte Testimonials

**Files:**
- Modify: `landing/src/components/landing/testimonials.tsx`

- [ ] **Step 1: Réécrire testimonials.tsx**

```tsx
"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

// Static data — not translated (exception i18n documentée dans la spec)
const TESTIMONIALS = [
  {
    names: "Sarah & Thomas",
    date: "Mariés en Juin 2024",
    text: "Nos invités ont été bluffés par l'animation de l'enveloppe ! C'est le détail qui a tout changé. La gestion des RSVP nous a sauvé un temps précieux.",
  },
  {
    names: "Élodie & Marc",
    date: "Mariés en Septembre 2024",
    text: "Enfin un site de mariage qui ne ressemble pas à un blog des années 2000. C'est chic, épuré et très facile à modifier. Le service client est adorable.",
  },
  {
    names: "Juliette & Pierre",
    date: "Mariés en Août 2024",
    text: "Nous avions un mariage à l'étranger et la fonctionnalité multilingue était indispensable. Tout a fonctionné parfaitement. Merci !",
  },
];

export function Testimonials() {
  const t = useTranslations("Testimonials");
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = (index: number) => setCurrent(index);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % TESTIMONIALS.length);
  }, []);

  useEffect(() => {
    if (paused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(next, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused, next]);

  const testimonial = TESTIMONIALS[current];

  return (
    <section
      id="temoignages"
      className="py-24 bg-background"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-primary font-medium mb-3">
            {t("eyebrow")}
          </p>
          <span className="inline-block border border-primary/20 text-primary text-xs font-medium px-4 py-1.5 rounded-full mb-6">
            {t("badge")}
          </span>
          <h2 className="font-heading text-4xl md:text-6xl font-medium text-foreground leading-tight">
            {t("title")}{" "}
            <span className="italic text-primary">{t("titleAccent")}</span>
          </h2>
        </div>

        <div className="max-w-2xl mx-auto text-center relative">
          <div className="font-heading text-[80px] text-primary/15 leading-none select-none absolute -top-4 left-0">
            "
          </div>
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 px-8"
          >
            <p className="font-heading text-xl md:text-2xl italic text-foreground/80 leading-relaxed mb-8">
              {testimonial.text}
            </p>
            <div className="flex flex-col items-center gap-1">
              <div className="flex gap-0.5 text-primary mb-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className="text-sm">★</span>
                ))}
              </div>
              <p className="font-heading italic text-primary font-medium">
                {testimonial.names}
              </p>
              <p className="text-xs text-muted-foreground">{testimonial.date}</p>
            </div>
          </motion.div>
        </div>

        {/* Dots navigation — pause on hover/focus (WCAG 2.2.2) */}
        <div className="flex justify-center gap-3 mt-10">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Témoignage ${i + 1}`}
              className={`transition-all duration-300 rounded-full ${
                i === current
                  ? "w-6 h-2 bg-primary"
                  : "w-2 h-2 bg-primary/20 hover:bg-primary/40"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Lint**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie/landing && npm run lint
```

- [ ] **Step 3: Commit**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie
git add landing/src/components/landing/testimonials.tsx
git commit -m "feat: refonte Testimonials — grande citation carrousel, autoplay 5s, pause hover/focus"
```

---

### Task 12: Refonte Footer

**Files:**
- Modify: `landing/src/components/landing/footer.tsx`

- [ ] **Step 1: Réécrire footer.tsx**

Note : `Link` de `@/navigation` est utilisé pour les liens `href="/#anchor"` (navigates home then scrolls — pattern déjà en place dans le footer existant). Le lien `mailto:` est passé à un `<a>` natif pour éviter les conflits de typage avec le composant `Link` de next-intl.

```tsx
import { Link } from "@/navigation";
import { getTranslations } from "next-intl/server";
import Image from "next/image";

export async function Footer() {
  const t = await getTranslations("Footer");

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        {/* Top row */}
        <div className="flex flex-col md:flex-row justify-between gap-10 mb-12">
          {/* Logo + tagline + social */}
          <div className="flex flex-col gap-4 max-w-[220px]">
            <div className="relative h-10 w-28">
              <Image
                src="/images/logo.png"
                alt="The Studio Digital Papeterie"
                fill
                className="object-contain brightness-0 invert"
              />
            </div>
            <p className="text-sm italic text-primary-foreground/60 font-heading leading-relaxed">
              {t("tagline")}
            </p>
            <div className="flex gap-3 mt-2">
              {(["ig", "pi", "tk"] as const).map((s) => (
                <div
                  key={s}
                  className="w-8 h-8 rounded-full border border-primary-foreground/20 flex items-center justify-center text-xs text-primary-foreground/60 hover:border-primary-foreground/50 hover:text-primary-foreground transition-colors cursor-pointer"
                >
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* 3 columns */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            {/* Produit */}
            <div>
              <h4 className="text-[10px] uppercase tracking-[0.2em] text-primary-foreground/40 font-medium mb-4">
                {t("colProduct")}
              </h4>
              <ul className="flex flex-col gap-3">
                <li><Link href="/#themes" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">{t("linkThemes")}</Link></li>
                <li><Link href="/#apercu" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">{t("linkDemo")}</Link></li>
                <li><Link href="/#comparatif" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">{t("linkPricing")}</Link></li>
                <li>
                  <a href="mailto:hello@thestudio-papeterie.fr" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                    {t("linkBespoke")}
                  </a>
                </li>
              </ul>
            </div>
            {/* Mariés */}
            <div>
              <h4 className="text-[10px] uppercase tracking-[0.2em] text-primary-foreground/40 font-medium mb-4">
                {t("colMarries")}
              </h4>
              <ul className="flex flex-col gap-3">
                <li><Link href="/login" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">{t("linkLogin")}</Link></li>
                <li><Link href="/create" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">{t("linkCreate")}</Link></li>
              </ul>
            </div>
            {/* Légal */}
            <div>
              <h4 className="text-[10px] uppercase tracking-[0.2em] text-primary-foreground/40 font-medium mb-4">
                {t("colLegal")}
              </h4>
              <ul className="flex flex-col gap-3">
                <li><Link href="/legal/cgv" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">{t("linkCGV")}</Link></li>
                <li><Link href="/legal/privacy" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">{t("linkPrivacy")}</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-primary-foreground/10 pt-8 text-center text-xs text-primary-foreground/30 tracking-wide">
          {t("copyright", { year: new Date().getFullYear() })}
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Lint**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie/landing && npm run lint
```
Attendu : aucune erreur

- [ ] **Step 3: Commit**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie
git add landing/src/components/landing/footer.tsx
git commit -m "feat: refonte Footer — fond primary bordeaux, 3 colonnes"
```

---

### Task 13: Mise à jour page.tsx (dernier — tous les composants existent)

**Files:**
- Modify: `landing/src/app/[locale]/page.tsx`

- [ ] **Step 1: Remplacer le contenu de page.tsx**

```tsx
import { DemoSection } from "@/components/landing/demo-section";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Catalogue } from "@/components/landing/catalogue";
import { PricingComparison } from "@/components/landing/pricing-comparison";
import { ValueCards } from "@/components/landing/value-cards";
import { Customization } from "@/components/landing/customization";
import { Testimonials } from "@/components/landing/testimonials";
import { Hero } from "@/components/landing/hero";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { ScrollToTop } from "@/components/ui/scroll-to-top";

export default function Home() {
  return (
    <main className="min-h-screen w-full relative">
      <Navbar />
      <Hero />
      <DemoSection />
      <HowItWorks />
      <Catalogue />
      <PricingComparison />
      <ValueCards />
      <Customization />
      <Testimonials />
      <Footer />
      <ScrollToTop />
    </main>
  );
}
```

- [ ] **Step 2: Vérifier que le build passe**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie && npm run build:landing
```
Attendu : build réussi sans erreurs TypeScript

- [ ] **Step 3: Vérification visuelle complète**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie && npm run dev:landing
```

Ouvrir http://localhost:3002 et vérifier dans l'ordre :
- [ ] Navbar : 3 liens, CTA pill mobile, burger
- [ ] Hero : animation enveloppe visible, overlay crème, titre, 2 boutons + scroll anchor
- [ ] DemoSection : phone mockup, bouton démo (si `NEXT_PUBLIC_DEMO_WEDDING_CODE` configuré)
- [ ] HowItWorks : 3 étapes avec icônes et ligne de connexion
- [ ] Catalogue : 4 tabs filtres, grille masonry, badges ouverture sur chaque card
- [ ] PricingComparison : 2 cards, badge "Économisez 711€"
- [ ] ValueCards : 5 cartes
- [ ] Customization : 3 modules + encart bespoke
- [ ] Testimonials : grande citation, dots de navigation, autoplay
- [ ] Footer : fond bordeaux, 3 colonnes, logo inversé

- [ ] **Step 4: Commit final**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie
git add landing/src/app/[locale]/page.tsx
git commit -m "feat: landing page refonte — 10 sections, expérience immersive haut de gamme"
```
