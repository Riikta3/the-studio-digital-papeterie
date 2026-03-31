# Live Preview Panel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un panneau de prévisualisation live du faire-part dans le configurateur studio — bottom drawer sur mobile, sidebar collapsable sur desktop — mis à jour en temps réel selon les choix du store Zustand.

**Architecture:** On crée 4 nouveaux composants dans `landing/src/components/configurator/`. Le composant central `InvitationPreviewScaled` render l'invitation complète (Hero + modules) via les composants existants des thèmes, wrappés dans `InvitationDemoContext` avec `isDemo=true` et scalés par CSS transform. `LivePreviewPanel` choisit entre `LivePreviewDrawer` (mobile) et `LivePreviewSidebar` (desktop) selon un media query. Le layout `(configurator)/layout.tsx` intègre le panel hors du flux principal.

**Tech Stack:** React, Framer Motion, Zustand (`useOrderStore`), composants invitation existants (`getModuleComponent`, `InvitationHero`, `InvitationIntro`), `InvitationDemoContext`

---

## File Map

| Fichier | Action | Responsabilité |
|---------|--------|----------------|
| `landing/src/components/configurator/InvitationPreviewScaled.tsx` | Créer | Render l'invitation complète scalée, gère frame statique vs animation |
| `landing/src/components/configurator/LivePreviewDrawer.tsx` | Créer | Bottom drawer mobile (collapsé + déplié) |
| `landing/src/components/configurator/LivePreviewSidebar.tsx` | Créer | Sidebar desktop collapsable |
| `landing/src/components/configurator/LivePreviewPanel.tsx` | Créer | Orchestrateur : détecte surface, rend Drawer ou Sidebar |
| `landing/src/components/invitation/InvitationIntro.tsx` | Modifier | Ajouter prop `loop?: boolean` |
| `landing/src/app/[locale]/(configurator)/layout.tsx` | Modifier | Intégrer `<LivePreviewPanel />` + ajuster padding |

---

## Task 1 : Ajouter `loop` prop à `InvitationIntro`

**Files:**
- Modify: `landing/src/components/invitation/InvitationIntro.tsx`

- [ ] **Step 1 : Ajouter `loop` à l'interface et au destructuring**

Dans `landing/src/components/invitation/InvitationIntro.tsx`, modifier l'interface et le composant :

```tsx
// Interface — ajouter après mobileFrameCount:
/** Loop the animation indefinitely instead of calling onComplete (preview mode) */
loop?: boolean;

// Destructuring — ajouter loop = false :
export function InvitationIntro({
  onComplete,
  autoplay = false,
  forceDesktop = false,
  desktopPath = DEFAULT_DESKTOP_PATH,
  mobilePath = DEFAULT_MOBILE_PATH,
  desktopFrameCount = DEFAULT_DESKTOP_FRAME_COUNT,
  mobileFrameCount = DEFAULT_MOBILE_FRAME_COUNT,
  loop = false,
}: InvitationIntroProps) {
```

- [ ] **Step 2 : Modifier `runSequence` pour boucler quand `loop=true`**

Remplacer le bloc de fin dans `runSequence` :

```tsx
// AVANT (ligne ~183) :
      if (frame < totalFrames) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setOverlayOpacity(1);
        setTimeout(onComplete, 400);
      }

// APRÈS :
      if (frame < totalFrames) {
        rafRef.current = requestAnimationFrame(tick);
      } else if (loop) {
        // Restart from frame 0 without calling onComplete
        frame = 0;
        lastTime = 0;
        setOverlayOpacity(0);
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setOverlayOpacity(1);
        setTimeout(onComplete, 400);
      }
```

- [ ] **Step 3 : Commit**

```bash
git add landing/src/components/invitation/InvitationIntro.tsx
git commit -m "feat(invitation): add loop prop to InvitationIntro for preview mode"
```

---

## Task 2 : Créer `InvitationPreviewScaled`

**Files:**
- Create: `landing/src/components/configurator/InvitationPreviewScaled.tsx`

Ce composant render l'invitation complète (Hero + modules actifs) via les composants du thème choisi, scalée par CSS transform dans un conteneur de dimensions connues.

- [ ] **Step 1 : Créer le fichier**

```tsx
"use client";

import { useRef, useEffect, useState } from "react";
import { InvitationDemoContext } from "@/components/invitation/InvitationDemoContext";
import { getModuleComponent } from "@/components/invitation/module-registry";
import { ModulesWrapper } from "@/components/invitation/ModulesWrapper";
import { InvitationIntro } from "@/components/invitation/InvitationIntro";
import { getAnimationPreview } from "@/components/configurator/AnimationPreviewOverlay";

// Thème → composant InvitationHero (import dynamique par map)
import { InvitationHero as HeroFloral }      from "@/components/invitation/themes/theme-floral/InvitationHero";
import { InvitationHero as HeroMinimalist }  from "@/components/invitation/themes/theme-minimalist/InvitationHero";
import { InvitationHero as HeroBoho }        from "@/components/invitation/themes/theme-boho/InvitationHero";
import { InvitationHero as HeroRoyal }       from "@/components/invitation/themes/theme-royal/InvitationHero";
import { InvitationHero as HeroModern }      from "@/components/invitation/themes/theme-modern/InvitationHero";

const HERO_MAP: Record<string, React.ComponentType<{ firstName: string; partnerName: string; weddingDate?: string | null }>> = {
  "theme-floral":      HeroFloral,
  "theme-minimalist":  HeroMinimalist,
  "theme-boho":        HeroBoho,
  "theme-royal":       HeroRoyal,
  "theme-modern":      HeroModern,
};

// Largeur virtuelle de l'invitation (mobile portrait)
const VIRTUAL_WIDTH = 390;

export interface InvitationPreviewScaledProps {
  theme: string;
  animation: string;
  modules: string[];
  partner1: string;
  partner2: string;
  weddingDate: string; // "DD/MM/YYYY" ou vide
  venue: string;
  /** true = lance l'animation InvitationIntro en boucle, false = frame statique */
  isExpanded: boolean;
  /** Largeur réelle du conteneur en px — utilisée pour calculer le scale */
  containerWidth: number;
}

export function InvitationPreviewScaled({
  theme,
  animation,
  modules,
  partner1,
  partner2,
  weddingDate,
  venue,
  isExpanded,
  containerWidth,
}: InvitationPreviewScaledProps) {
  const scale = containerWidth > 0 ? containerWidth / VIRTUAL_WIDTH : 0.35;

  const InvitationHero = HERO_MAP[theme] ?? HeroFloral;

  // Convertit "DD Mois YYYY" → "YYYY-MM-DD" pour InvitationHero
  const isoDate = weddingDate || null;

  // Preview image de l'animation (frame statique)
  const animationPreviewImg = getAnimationPreview(animation);

  return (
    <InvitationDemoContext.Provider
      value={{
        isDemo: true,
        activeTheme: theme,
        heroAsset: { frames: 0, sequencePath: null },
        animationSequence: null,
      }}
    >
      {/* Conteneur outer — dimensions réelles affichées */}
      <div
        style={{
          width: containerWidth,
          height: containerWidth * (16 / 9), // ratio portrait approximatif
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Inner — dimensions virtuelles, scalé */}
        <div
          style={{
            width: VIRTUAL_WIDTH,
            transformOrigin: "top left",
            transform: `scale(${scale})`,
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          {/* Animation intro : boucle si expanded, frame statique sinon */}
          {isExpanded ? (
            <InvitationIntro
              onComplete={() => {}}
              autoplay
              loop
              forceDesktop={false}
            />
          ) : animationPreviewImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={animationPreviewImg}
              alt="Animation preview"
              style={{ width: VIRTUAL_WIDTH, height: "auto", display: "block" }}
            />
          ) : (
            // Placeholder si pas d'asset pour cette animation
            <div
              style={{
                width: VIRTUAL_WIDTH,
                height: 200,
                background: "linear-gradient(135deg, #fdf6f0, #f0d9cc)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                color: "#c97a90",
                fontStyle: "italic",
              }}
            >
              {animation ? animation.replace(/-/g, " ") : "Animation"}
            </div>
          )}

          {/* Hero du thème */}
          <InvitationHero
            firstName={partner1 || "Sophie"}
            partnerName={partner2 || "Pierre"}
            weddingDate={isoDate}
          />

          {/* Modules actifs */}
          <ModulesWrapper>
            {modules.map((moduleId) => {
              const ModuleComponent = getModuleComponent(theme, moduleId);
              if (!ModuleComponent) return null;
              return (
                <ModuleComponent
                  key={moduleId}
                  weddingId="preview"
                  partner1={partner1 || "Sophie"}
                  partner2={partner2 || "Pierre"}
                  weddingDate={isoDate}
                  isDemo
                />
              );
            })}
          </ModulesWrapper>
        </div>
      </div>
    </InvitationDemoContext.Provider>
  );
}
```

- [ ] **Step 2 : Vérifier que le build ne casse pas**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie/landing && npx tsc --noEmit 2>&1 | head -40
```

Attendu : 0 erreur (ou uniquement des erreurs pré-existantes non liées).

- [ ] **Step 3 : Commit**

```bash
git add landing/src/components/configurator/InvitationPreviewScaled.tsx
git commit -m "feat(configurator): add InvitationPreviewScaled component"
```

---

## Task 3 : Créer `LivePreviewDrawer` (mobile)

**Files:**
- Create: `landing/src/components/configurator/LivePreviewDrawer.tsx`

Bottom drawer avec deux états : collapsé (barre ~64px) et déplié (85vh). Utilise Framer Motion pour l'animation spring.

- [ ] **Step 1 : Créer le fichier**

```tsx
"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, Eye } from "lucide-react";
import { InvitationPreviewScaled } from "./InvitationPreviewScaled";

interface LivePreviewDrawerProps {
  theme: string;
  animation: string;
  modules: string[];
  partner1: string;
  partner2: string;
  weddingDate: string;
  venue: string;
}

const COLLAPSED_H = 64; // px
const EXPANDED_VH = 0.85;

export function LivePreviewDrawer({
  theme,
  animation,
  modules,
  partner1,
  partner2,
  weddingDate,
  venue,
}: LivePreviewDrawerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Largeur du conteneur de preview = 90vw centré dans le drawer
  const containerWidth = typeof window !== "undefined"
    ? Math.min(window.innerWidth * 0.88, 360)
    : 320;

  const displayPartner1 = partner1 || "Sophie";
  const displayPartner2 = partner2 || "Pierre";
  const moduleCount = modules.length;

  // Résumé des choix pour la barre collapsée
  const themeName = theme.replace("theme-", "");
  const animationName = animation
    ? animation.split("-").slice(1).join(" ") || animation
    : "—";

  return (
    <>
      {/* Backdrop quand expanded */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-[48] bg-black/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-[49] bg-background rounded-t-2xl border-t border-border/60 shadow-[0_-4px_24px_rgba(0,0,0,0.10)]"
        animate={{ height: isExpanded ? `${EXPANDED_VH * 100}vh` : COLLAPSED_H }}
        transition={{ type: "spring", stiffness: 300, damping: 35 }}
        style={{ overflow: "hidden" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-2 pb-0">
          <div className="w-8 h-1 rounded-full bg-border/60" />
        </div>

        {/* Collapsed bar — toujours visible */}
        <button
          className="w-full flex items-center gap-3 px-4 py-2.5"
          onClick={() => setIsExpanded((v) => !v)}
        >
          {/* Miniature thème */}
          <div
            className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-[9px] font-bold font-sans overflow-hidden"
            style={{
              background:
                theme === "theme-floral"     ? "linear-gradient(135deg,#fdf6f0,#f0d9cc)" :
                theme === "theme-minimalist" ? "linear-gradient(135deg,#f5f5f5,#e5e5e5)" :
                theme === "theme-boho"       ? "linear-gradient(135deg,#fdf0e5,#e8c99a)" :
                theme === "theme-royal"      ? "linear-gradient(135deg,#eef2ff,#c7d4f5)" :
                theme === "theme-modern"     ? "linear-gradient(135deg,#fff0f5,#f5c8db)" :
                "linear-gradient(135deg,#fdf6f0,#f0d9cc)",
              color:
                theme === "theme-floral"     ? "#c97a90" :
                theme === "theme-minimalist" ? "#555" :
                theme === "theme-boho"       ? "#a98467" :
                theme === "theme-royal"      ? "#1e3a8a" :
                theme === "theme-modern"     ? "#be185d" :
                "#c97a90",
              fontStyle: "italic",
            }}
          >
            {displayPartner1[0]}&{displayPartner2[0]}
          </div>

          {/* Texte résumé */}
          <div className="flex-1 text-left">
            <p className="text-[12px] font-bold text-foreground leading-none">
              {displayPartner1} & {displayPartner2}
            </p>
            <p className="text-[10px] text-muted-foreground font-sans mt-0.5 capitalize">
              {themeName} · {animationName} · {moduleCount} module{moduleCount !== 1 ? "s" : ""}
            </p>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-bold font-sans px-3 py-1.5 rounded-full flex-shrink-0">
            <Eye className="w-3 h-3" />
            <span>{isExpanded ? "Fermer" : "Voir"}</span>
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </div>
        </button>

        {/* Preview expanded */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              ref={previewRef}
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="flex flex-col items-center overflow-y-auto pb-8"
              style={{ maxHeight: `calc(${EXPANDED_VH * 100}vh - ${COLLAPSED_H}px - 20px)` }}
            >
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50 font-sans mb-3">
                Aperçu en direct
              </p>
              <InvitationPreviewScaled
                theme={theme}
                animation={animation}
                modules={modules}
                partner1={partner1}
                partner2={partner2}
                weddingDate={weddingDate}
                venue={venue}
                isExpanded={isExpanded}
                containerWidth={containerWidth}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
```

- [ ] **Step 2 : Vérifier TypeScript**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie/landing && npx tsc --noEmit 2>&1 | head -40
```

- [ ] **Step 3 : Commit**

```bash
git add landing/src/components/configurator/LivePreviewDrawer.tsx
git commit -m "feat(configurator): add LivePreviewDrawer mobile component"
```

---

## Task 4 : Créer `LivePreviewSidebar` (desktop)

**Files:**
- Create: `landing/src/components/configurator/LivePreviewSidebar.tsx`

Panneau latéral droit : réduit à 44px (icône) → 280px (preview complète). Slide depuis la droite.

- [ ] **Step 1 : Créer le fichier**

```tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ChevronRight } from "lucide-react";
import { InvitationPreviewScaled } from "./InvitationPreviewScaled";

interface LivePreviewSidebarProps {
  theme: string;
  animation: string;
  modules: string[];
  partner1: string;
  partner2: string;
  weddingDate: string;
  venue: string;
}

const SIDEBAR_OPEN_WIDTH = 280;
const SIDEBAR_CLOSED_WIDTH = 44;
// Largeur réelle de la zone de preview dans la sidebar (padding compris)
const PREVIEW_CONTAINER_WIDTH = SIDEBAR_OPEN_WIDTH - 24;

export function LivePreviewSidebar({
  theme,
  animation,
  modules,
  partner1,
  partner2,
  weddingDate,
  venue,
}: LivePreviewSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const displayPartner1 = partner1 || "Sophie";
  const displayPartner2 = partner2 || "Pierre";

  return (
    <motion.div
      className="fixed top-14 right-0 bottom-20 z-40 flex flex-col bg-background border-l border-border/40 shadow-[-4px_0_20px_rgba(0,0,0,0.06)]"
      animate={{ width: isOpen ? SIDEBAR_OPEN_WIDTH : SIDEBAR_CLOSED_WIDTH }}
      transition={{ type: "spring", stiffness: 320, damping: 36 }}
      style={{ overflow: "hidden" }}
    >
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex-shrink-0 h-14 flex items-center justify-center gap-2 border-b border-border/40 hover:bg-muted/40 transition-colors"
        title={isOpen ? "Masquer l'aperçu" : "Voir le rendu"}
      >
        {isOpen ? (
          <>
            <EyeOff className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <AnimatePresence>
              <motion.span
                key="label-open"
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-[11px] font-bold text-muted-foreground font-sans whitespace-nowrap"
              >
                Masquer l&apos;aperçu
              </motion.span>
            </AnimatePresence>
          </>
        ) : (
          <Eye className="w-4 h-4 text-primary flex-shrink-0" />
        )}
      </button>

      {/* Sidebar content when open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="sidebar-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, delay: 0.1 }}
            className="flex-1 overflow-y-auto flex flex-col items-center py-4 px-3 gap-3"
          >
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50 font-sans self-start">
              Aperçu en direct
            </p>

            <p className="text-[11px] font-semibold text-foreground font-heading self-start italic">
              {displayPartner1} & {displayPartner2}
            </p>

            <InvitationPreviewScaled
              theme={theme}
              animation={animation}
              modules={modules}
              partner1={partner1}
              partner2={partner2}
              weddingDate={weddingDate}
              venue={venue}
              isExpanded={isOpen}
              containerWidth={PREVIEW_CONTAINER_WIDTH}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
```

- [ ] **Step 2 : Vérifier TypeScript**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie/landing && npx tsc --noEmit 2>&1 | head -40
```

- [ ] **Step 3 : Commit**

```bash
git add landing/src/components/configurator/LivePreviewSidebar.tsx
git commit -m "feat(configurator): add LivePreviewSidebar desktop component"
```

---

## Task 5 : Créer `LivePreviewPanel` (orchestrateur)

**Files:**
- Create: `landing/src/components/configurator/LivePreviewPanel.tsx`

Lit le store Zustand, détecte la surface, délègue au bon composant.

- [ ] **Step 1 : Créer le fichier**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useOrderStore } from "@/stores/use-order-store";
import { LivePreviewDrawer } from "./LivePreviewDrawer";
import { LivePreviewSidebar } from "./LivePreviewSidebar";

const MONTHS = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre",
];

/** Convertit day/month/year du store en "YYYY-MM-DD" ou "" */
function toIsoDate(day: string, month: string, year: string): string {
  const m = MONTHS.indexOf(month) + 1;
  if (!day || !m || !year) return "";
  return `${year}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function LivePreviewPanel() {
  const theme      = useOrderStore((s) => s.theme);
  const animation  = useOrderStore((s) => s.animation);
  const modules    = useOrderStore((s) => s.modules);
  const weddingInfo = useOrderStore((s) => s.weddingInfo);

  const weddingDate = toIsoDate(weddingInfo.day, weddingInfo.month, weddingInfo.year);

  // Détection surface — côté client uniquement
  const [isDesktop, setIsDesktop] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (!mounted) return null;

  const props = {
    theme,
    animation,
    modules,
    partner1: weddingInfo.partner1,
    partner2: weddingInfo.partner2,
    weddingDate,
    venue: weddingInfo.venue,
  };

  return isDesktop
    ? <LivePreviewSidebar {...props} />
    : <LivePreviewDrawer {...props} />;
}
```

- [ ] **Step 2 : Vérifier TypeScript**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie/landing && npx tsc --noEmit 2>&1 | head -40
```

- [ ] **Step 3 : Commit**

```bash
git add landing/src/components/configurator/LivePreviewPanel.tsx
git commit -m "feat(configurator): add LivePreviewPanel orchestrator"
```

---

## Task 6 : Intégrer dans le layout configurateur

**Files:**
- Modify: `landing/src/app/[locale]/(configurator)/layout.tsx`

Ajouter `<LivePreviewPanel />` dans le layout, et ajuster le padding mobile (`pb-32` → `pb-[140px]`) pour que le footer sticky + le drawer mobile ne se superposent pas.

- [ ] **Step 1 : Importer `LivePreviewPanel` dans le layout**

En haut du fichier `layout.tsx`, ajouter :

```tsx
import { LivePreviewPanel } from "@/components/configurator/LivePreviewPanel";
```

- [ ] **Step 2 : Ajouter `<LivePreviewPanel />` avant la fermeture du `<div>` racine**

Juste avant la fermeture de `</div>` (la toute dernière ligne du return, après le dialog Quit), ajouter :

```tsx
      {/* LIVE PREVIEW PANEL */}
      <LivePreviewPanel />
```

- [ ] **Step 3 : Ajuster le padding bottom du `<main>` pour mobile**

Le drawer fait 64px, le footer sticky ~80px → total ~144px. Modifier la classe du `<main>` :

```tsx
// AVANT :
<main className='flex-1 container mx-auto px-4 pt-20 pb-32 z-10 max-w-4xl relative'>

// APRÈS :
<main className='flex-1 container mx-auto px-4 pt-20 pb-[150px] md:pb-32 z-10 max-w-4xl relative md:pr-[52px]'>
```

Le `md:pr-[52px]` laisse de la place pour la sidebar desktop quand elle est réduite (44px + 8px marge).

- [ ] **Step 4 : Vérifier que le build de la landing passe**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie && npm run build:landing 2>&1 | tail -30
```

Attendu : `✓ Compiled successfully` ou `Route (app)` sans erreurs critiques.

- [ ] **Step 5 : Commit**

```bash
git add landing/src/app/[locale]/\(configurator\)/layout.tsx
git commit -m "feat(configurator): integrate LivePreviewPanel into studio layout"
```

---

## Task 7 : Test manuel et polish

- [ ] **Step 1 : Lancer le dev server**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie && npm run dev:landing
```

- [ ] **Step 2 : Checklist mobile (DevTools → iPhone viewport)**

Ouvrir `http://localhost:3002/fr/studio/start` en viewport mobile (375px).

- [ ] Barre collapsée visible en bas, au-dessus du footer sticky
- [ ] Tap "Voir" → drawer remonte jusqu'à 85vh
- [ ] Preview affiche le thème par défaut (floral) avec "Sophie & Pierre"
- [ ] Changer l'étape → thème, animation, modules → la preview se met à jour
- [ ] Saisir les prénoms → les noms se mettent à jour en live dans le drawer
- [ ] Tap backdrop ou handle → drawer se ferme

- [ ] **Step 3 : Checklist desktop (viewport > 768px)**

- [ ] Sidebar réduite visible à droite (44px, icône œil)
- [ ] Click → s'ouvre à 280px, preview visible
- [ ] Le contenu du configurateur n'est pas masqué
- [ ] Changements en temps réel → preview se met à jour
- [ ] Click "Masquer" → sidebar se réduit

- [ ] **Step 4 : Commit final si tout OK**

```bash
git add -p  # stager uniquement les ajustements éventuels
git commit -m "fix(configurator): polish live preview panel after manual testing"
```

---

## Self-Review

**Spec coverage :**
- ✓ Bottom drawer mobile (collapsé + déplié) → Task 3
- ✓ Sidebar desktop collapsable → Task 4
- ✓ Rendu complet avec composants existants → Task 2
- ✓ `isDemo=true` propagé → Task 2 (InvitationDemoContext + ModuleProps)
- ✓ Frame statique collapsé / animation en boucle déplié → Task 1 + Task 2
- ✓ Données temps réel depuis store Zustand → Task 5
- ✓ Fallback defaults (Sophie & Pierre, thème floral) → Task 2 + Task 3
- ✓ Intégration layout → Task 6

**Type consistency :**
- `InvitationPreviewScaledProps` définit `isExpanded: boolean` → utilisé identiquement dans Task 3 et Task 4
- `LivePreviewDrawer` et `LivePreviewSidebar` partagent les mêmes 7 props → propagées de `LivePreviewPanel` via spread `{...props}`
- `toIsoDate()` défini dans Task 5 uniquement, non dupliqué
