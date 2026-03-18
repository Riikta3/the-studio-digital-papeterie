# Configurator Full Redesign — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the entire `/create` wizard with 8 steps (Offre → Animation → Thème → Modules → Langues → Extras → Mariage → Checkout), mobile-first, matching the landing page style (#7c2d3e, Georgia, #FDFBF7), with Stripe multi-method payment and a live invitation preview in checkout.

**Architecture:** Each step is a separate page under `(configurator)/create/`. The Zustand store is extended with `animation`, `languages`, `adultsOnly`, and `weddingInfo` fields. New components (`ThemeDemoOverlay`, `AnimationStep`) are isolated in `landing/src/components/configurator/`. The layout is updated to reflect the new 8-step sequence. Stripe payment uses `@stripe/stripe-js` + `@stripe/react-stripe-js` for the Elements form.

**Tech Stack:** Next.js App Router, React, Tailwind CSS, Zustand (persist), Framer Motion, Stripe Elements, next-intl, lucide-react, shadcn/ui.

---

## Key Architecture Notes

- **Store theme IDs** use prefix: `"theme-floral"`. ProductDemoViewer uses unprefixed: `"floral"`. Map on use.
- **`@/navigation`** — always use `Link`, `useRouter`, `usePathname` from here (i18n-aware), never from `next/navigation`.
- **`cn()`** from `@/lib/utils` for conditional Tailwind.
- **Server Components** by default; add `"use client"` only when needed.
- **`scrollbar-hide`** utility is NOT yet in globals.css — must be added.
- **ProductDemoViewer** constants (`ANIMATION_SEQUENCES`, `THEME_HERO_ASSETS`, `DEMO_CODES`) need to be exported for reuse in `ThemeDemoOverlay`.
- **`processCheckout`** in `checkout-actions.ts` currently hardcodes `status: "succeeded"` — Stripe webhook will handle real status later. Keep that pattern for now.
- **Animation variants** are fictional/placeholder — no real video sequences needed for this plan.

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| **Modify** | `landing/src/stores/use-order-store.ts` | Add animation, languages, adultsOnly, weddingInfo fields |
| **Modify** | `landing/src/app/[locale]/(configurator)/layout.tsx` | Update STEPS array to 8 steps, update STEP_TITLES |
| **Modify** | `landing/src/app/globals.css` | Add scrollbar-hide utility |
| **Modify** | `landing/src/components/landing/product-demo-viewer.tsx` | Export ANIMATION_SEQUENCES, THEME_HERO_ASSETS, DEMO_CODES, types |
| **Create** | `landing/src/components/configurator/ThemeDemoOverlay.tsx` | Fullscreen overlay with live invitation iframe + SET_THEME |
| **Modify** | `landing/src/app/[locale]/(configurator)/create/plan/page.tsx` | Keep logic, redesign visuals (stacked rows) |
| **Create** | `landing/src/app/[locale]/(configurator)/create/animation/page.tsx` | New step: category tabs + variant grid |
| **Modify** | `landing/src/app/[locale]/(configurator)/create/theme/page.tsx` | Horizontal scroll carousel + ThemeDemoOverlay |
| **Modify** | `landing/src/app/[locale]/(configurator)/create/modules/page.tsx` | Redesign: list rows with SVG icons |
| **Create** | `landing/src/app/[locale]/(configurator)/create/languages/page.tsx` | New step: language selection grid |
| **Modify** | `landing/src/app/[locale]/(configurator)/create/extras/page.tsx` | Toggle Adults Only + 4 premium options grid |
| **Create** | `landing/src/app/[locale]/(configurator)/create/wedding/page.tsx` | New step: couple names, date, venue, account creation |
| **Modify** | `landing/src/app/[locale]/(configurator)/create/checkout/page.tsx` | Full rewrite: recap + billing form + Stripe Elements |

---

## Task 1: Extend Zustand store

**Files:**
- Modify: `landing/src/stores/use-order-store.ts`

- [ ] **Step 1: Read the current store**

```bash
cat landing/src/stores/use-order-store.ts
```

- [ ] **Step 2: Replace the store with the extended version**

```typescript
// landing/src/stores/use-order-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PlanType = "experience" | "premium" | null;

export interface WeddingInfo {
  partner1: string;
  partner2: string;
  day: string;
  month: string;
  year: string;
  venue: string;
  email: string;
}

export interface OrderState {
  plan: PlanType;
  animation: string;        // e.g. "envelope-classic"
  theme: string;            // e.g. "theme-floral"
  modules: string[];
  languages: string[];      // extra language codes e.g. ["en", "es"]
  adultsOnly: boolean;
  extras: string[];
  weddingInfo: WeddingInfo;

  setPlan: (plan: PlanType) => void;
  setAnimation: (animation: string) => void;
  setTheme: (theme: string) => void;
  toggleModule: (module: string) => void;
  toggleLanguage: (code: string) => void;
  setAdultsOnly: (value: boolean) => void;
  toggleExtra: (extra: string) => void;
  setWeddingInfo: (info: Partial<WeddingInfo>) => void;
}

const EXTRA_PRICES: Record<string, number> = {
  "custom-music": 10,
  "custom-illustration": 45,
  "animated-video": 55,
  "custom-domain": 65,
};

const LANGUAGE_PRICE = 15;

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      plan: null,
      animation: "",
      theme: "theme-floral",
      modules: [],
      languages: [],
      adultsOnly: false,
      extras: [],
      weddingInfo: {
        partner1: "",
        partner2: "",
        day: "",
        month: "",
        year: "",
        venue: "",
        email: "",
      },
      setPlan: (plan) => set({ plan }),
      setAnimation: (animation) => set({ animation }),
      setTheme: (theme) => set({ theme }),
      toggleModule: (module) =>
        set((state) => ({
          modules: state.modules.includes(module)
            ? state.modules.filter((m) => m !== module)
            : [...state.modules, module],
        })),
      toggleLanguage: (code) =>
        set((state) => ({
          languages: state.languages.includes(code)
            ? state.languages.filter((l) => l !== code)
            : [...state.languages, code],
        })),
      setAdultsOnly: (value) => set({ adultsOnly: value }),
      toggleExtra: (extra) =>
        set((state) => ({
          extras: state.extras.includes(extra)
            ? state.extras.filter((e) => e !== extra)
            : [...state.extras, extra],
        })),
      setWeddingInfo: (info) =>
        set((state) => ({
          weddingInfo: { ...state.weddingInfo, ...info },
        })),
    }),
    { name: "order-store" }
  )
);

export const selectTotalPrice = (state: OrderState) => {
  const basePrice =
    state.plan === "experience" ? 175 : state.plan === "premium" ? 575 : 0;

  const moduleSurcharge =
    state.plan === "experience"
      ? Math.max(0, state.modules.length - 4) * 5
      : 0;

  const languagesTotal = state.languages.length * LANGUAGE_PRICE;

  const extrasTotal = state.extras.reduce(
    (sum, extra) => sum + (EXTRA_PRICES[extra] ?? 0),
    0
  );

  return basePrice + moduleSurcharge + languagesTotal + extrasTotal;
};
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd landing && npx tsc --noEmit 2>&1 | head -30
```

Expected: No errors related to `use-order-store.ts`.

- [ ] **Step 4: Commit**

```bash
git add landing/src/stores/use-order-store.ts
git commit -m "feat: extend order store with animation, languages, adultsOnly, weddingInfo"
```

---

## Task 2: Add scrollbar-hide utility + update layout

**Files:**
- Modify: `landing/src/app/globals.css`
- Modify: `landing/src/app/[locale]/(configurator)/layout.tsx`

- [ ] **Step 1: Add scrollbar-hide to globals.css**

Find the end of `landing/src/app/globals.css` and append:

```css
/* Utility — hide scrollbar while keeping scroll functionality */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

- [ ] **Step 2: Update the layout STEPS and STEP_TITLES**

In `landing/src/app/[locale]/(configurator)/layout.tsx`, replace the STEPS array and STEP_TITLES:

```tsx
const STEPS = [
  "/create/plan",
  "/create/animation",
  "/create/theme",
  "/create/modules",
  "/create/languages",
  "/create/extras",
  "/create/wedding",
  "/create/checkout",
];

// inside the component:
const STEP_TITLES: Record<string, string> = {
  "/create/plan":      "Votre Offre",
  "/create/animation": "Animation d'entrée",
  "/create/theme":     "Design & Thème",
  "/create/modules":   "Fonctionnalités",
  "/create/languages": "Langues",
  "/create/extras":    "Options & Extras",
  "/create/wedding":   "Votre Mariage",
  "/create/checkout":  "Récapitulatif",
};
```

- [ ] **Step 3: Verify dev server starts without errors**

```bash
npm run dev:landing 2>&1 | head -20
```

Expected: Server starts on port 3002.

- [ ] **Step 4: Commit**

```bash
git add landing/src/app/globals.css landing/src/app/[locale]/(configurator)/layout.tsx
git commit -m "feat: update configurator layout to 8 steps, add scrollbar-hide utility"
```

---

## Task 3: Export constants from ProductDemoViewer

**Files:**
- Modify: `landing/src/components/landing/product-demo-viewer.tsx`

- [ ] **Step 1: Check what is already exported**

```bash
grep "^export" landing/src/components/landing/product-demo-viewer.tsx
```

- [ ] **Step 2: Add export keyword to these constants (if not already exported)**

Find and add `export` to:
```tsx
export const ANIMATION_SEQUENCES: Record<AnimationKey, AnimationSequence> = { ... }
export const THEME_HERO_ASSETS: Record<ThemeKey, HeroAsset> = { ... }
export const DEMO_CODES: Record<AnimationKey, string> = { ... }
export type { AnimationKey, ThemeKey, HeroAsset, AnimationSequence }
```

- [ ] **Step 3: Verify no TypeScript errors**

```bash
cd landing && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add landing/src/components/landing/product-demo-viewer.tsx
git commit -m "feat: export ProductDemoViewer constants for reuse"
```

---

## Task 4: Create ThemeDemoOverlay component

**Files:**
- Create: `landing/src/components/configurator/ThemeDemoOverlay.tsx`

- [ ] **Step 1: Create the component**

```tsx
// landing/src/components/configurator/ThemeDemoOverlay.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import {
  ANIMATION_SEQUENCES,
  THEME_HERO_ASSETS,
  type AnimationKey,
  type ThemeKey,
} from "@/components/landing/product-demo-viewer";
import { cn } from "@/lib/utils";

const THEME_KEY_MAP: Record<string, ThemeKey> = {
  "theme-floral":     "floral",
  "theme-minimalist": "minimalist",
  "theme-boho":       "boho",
  "theme-royal":      "royal",
  "theme-modern":     "modern",
};

const DEFAULT_ANIMATION: AnimationKey = "envelope";
const DEMO_CODE = "demo-envelope";

interface ThemeDemoOverlayProps {
  themeId: string;
  themeName: string;
  onClose: () => void;
  onSelect: () => void;
}

export function ThemeDemoOverlay({
  themeId,
  themeName,
  onClose,
  onSelect,
}: ThemeDemoOverlayProps) {
  const locale = useLocale();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);

  const themeKey = THEME_KEY_MAP[themeId] ?? "floral";
  const iframeSrc = `/${locale}/invitation/${DEMO_CODE}?demo=true&device=mobile`;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const sendTheme = () => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage(
      {
        type: "SET_THEME",
        theme: themeKey,
        device: "mobile",
        heroAsset: THEME_HERO_ASSETS[themeKey],
        animationSequence: ANIMATION_SEQUENCES[DEFAULT_ANIMATION],
      },
      window.location.origin,
    );
  };

  const handleLoad = () => {
    setLoading(false);
    setTimeout(sendTheme, 100);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-[#FDFBF7]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 h-[52px] border-b border-border/40 bg-background/90 backdrop-blur-md flex-shrink-0">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-sm font-bold text-primary font-sans"
        >
          ‹ Retour
        </button>
        <span className="text-sm font-bold text-foreground font-sans truncate px-2">
          Prévisualisation — {themeName}
        </span>
        <div className="w-16" />
      </div>

      {/* Iframe */}
      <div className="flex-1 relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#FDFBF7] z-10">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          className="w-full h-full border-none block"
          title={`Démo ${themeName}`}
          onLoad={handleLoad}
        />
      </div>

      {/* Bottom bar */}
      <div className="flex gap-3 px-4 py-3 border-t border-border/40 bg-background/90 backdrop-blur-md flex-shrink-0">
        <button
          onClick={onClose}
          className="px-5 py-3 rounded-full border border-border text-sm text-muted-foreground font-sans"
        >
          Retour
        </button>
        <button
          onClick={() => { onSelect(); onClose(); }}
          className="flex-1 py-3 rounded-full bg-primary text-primary-foreground text-sm font-bold font-sans"
        >
          ✓ Choisir ce thème
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd landing && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add landing/src/components/configurator/ThemeDemoOverlay.tsx
git commit -m "feat: add ThemeDemoOverlay component"
```

---

## Task 5: Redesign Plan page (Step 1)

**Files:**
- Modify: `landing/src/app/[locale]/(configurator)/create/plan/page.tsx`

- [ ] **Step 1: Replace the plan page**

```tsx
// landing/src/app/[locale]/(configurator)/create/plan/page.tsx
"use client";

import { cn } from "@/lib/utils";
import { useOrderStore, type PlanType } from "@/stores/use-order-store";

type PlanConfig = {
  id: PlanType;
  name: string;
  price: number;
  badge?: string;
  tagline: string;
  features: string[];
  accentColor: string;
};

const PLANS: PlanConfig[] = [
  {
    id: "experience",
    name: "Essentiel",
    price: 175,
    tagline: "Tout ce qu'il faut pour une invitation parfaite.",
    features: [
      "Site d'invitation personnalisé",
      "4 modules inclus",
      "1 langue incluse",
      "Animation d'entrée",
      "RSVP en ligne",
      "Accès à vie",
    ],
    accentColor: "#7c2d3e",
  },
  {
    id: "premium",
    name: "Premium",
    price: 575,
    badge: "Le plus complet",
    tagline: "L'expérience ultime, sans limite.",
    features: [
      "Tout du pack Essentiel",
      "Modules illimités",
      "Toutes les langues incluses",
      "Illustration sur mesure",
      "Musique personnalisée",
      "Domaine personnalisé inclus",
      "Support prioritaire",
    ],
    accentColor: "#7c2d3e",
  },
];

export default function PlanPage() {
  const { plan, setPlan } = useOrderStore();

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center space-y-2 px-4 pb-2">
        <h1 className="font-heading text-3xl font-bold md:text-4xl lg:text-5xl">
          Choisissez votre{" "}
          <span className="italic text-primary">offre</span>
        </h1>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          Un paiement unique. Accès à vie garanti.
        </p>
      </div>

      <div className="flex flex-col gap-3 max-w-lg mx-auto w-full px-4">
        {PLANS.map((p) => {
          const isSelected = plan === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setPlan(p.id)}
              className={cn(
                "w-full text-left rounded-2xl border-2 p-5 transition-all duration-200",
                isSelected
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border bg-card hover:border-primary/40",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-heading text-lg font-bold">{p.name}</span>
                    {p.badge && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-sans">
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs font-sans mb-3">{p.tagline}</p>
                  <ul className="space-y-1.5">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs font-sans text-foreground/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="font-heading text-2xl font-bold text-primary">{p.price}€</span>
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                      isSelected ? "border-primary bg-primary" : "border-border",
                    )}
                  >
                    {isSelected && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser at `http://localhost:3002/fr/create/plan`**

- Two stacked plan cards visible
- Clicking selects the plan (border changes to primary)
- "Continuer →" button in layout footer activates after selection

- [ ] **Step 3: Commit**

```bash
git add landing/src/app/[locale]/(configurator)/create/plan/page.tsx
git commit -m "feat: redesign plan step with stacked rows"
```

---

## Task 6: Create Animation page (Step 2)

**Files:**
- Create: `landing/src/app/[locale]/(configurator)/create/animation/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// landing/src/app/[locale]/(configurator)/create/animation/page.tsx
"use client";

import { cn } from "@/lib/utils";
import { useOrderStore } from "@/stores/use-order-store";
import { useState } from "react";

type Variant = { id: string; name: string; desc: string };
type Category = {
  id: string;
  name: string;
  variants: Variant[];
  icon: React.ReactNode;
};

// SVG icons for each category
const EnvelopeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
);
const DoorIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const CurtainIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="2" x2="12" y2="22"/><path d="M2 4c3 4 3 8 0 12"/><path d="M22 4c-3 4-3 8 0 12"/>
  </svg>
);
const BookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);
const FloralIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a9 9 0 0 1 0 18A9 9 0 0 1 12 2z"/><path d="M12 8a3 3 0 0 1 0 8 3 3 0 0 1 0-8z"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.22" y1="4.22" x2="7.05" y2="7.05"/><line x1="16.95" y1="16.95" x2="19.78" y2="19.78"/>
  </svg>
);

const CATEGORIES: Category[] = [
  {
    id: "envelope",
    name: "Enveloppe",
    icon: <EnvelopeIcon />,
    variants: [
      { id: "envelope-classic",  name: "Classique",  desc: "Ouverture élégante et sobre" },
      { id: "envelope-kraft",    name: "Kraft",       desc: "Texture papier naturel" },
      { id: "envelope-luxury",   name: "Luxe",        desc: "Fermeture cire, finition premium" },
      { id: "envelope-vintage",  name: "Vintage",     desc: "Style rétro avec cachet de cire" },
    ],
  },
  {
    id: "door",
    name: "Porte",
    icon: <DoorIcon />,
    variants: [
      { id: "door-royal",      name: "Royal",       desc: "Grande porte dorée majestueuse" },
      { id: "door-classic",    name: "Classique",   desc: "Porte en bois sobre et élégante" },
      { id: "door-authentic",  name: "Authentique", desc: "Porte rustique en bois brut" },
      { id: "door-modern",     name: "Moderne",     desc: "Porte vitrée contemporaine" },
      { id: "door-japanese",   name: "Japonaise",   desc: "Porte coulissante en bois clair" },
    ],
  },
  {
    id: "curtain",
    name: "Rideau",
    icon: <CurtainIcon />,
    variants: [
      { id: "curtain-velvet",  name: "Velours",     desc: "Rideau de velours bordeaux" },
      { id: "curtain-linen",   name: "Lin",          desc: "Tissu naturel aérien" },
      { id: "curtain-silk",    name: "Soie",         desc: "Reflets soyeux et lumineux" },
    ],
  },
  {
    id: "book",
    name: "Livre",
    icon: <BookIcon />,
    variants: [
      { id: "book-leather",    name: "Cuir",         desc: "Couverture en cuir gravé" },
      { id: "book-floral",     name: "Floral",       desc: "Illustrations botaniques" },
      { id: "book-modern",     name: "Moderne",      desc: "Couverture épurée et graphique" },
    ],
  },
  {
    id: "floral",
    name: "Floral",
    icon: <FloralIcon />,
    variants: [
      { id: "floral-roses",    name: "Roses",        desc: "Pétales de rose qui s'envolent" },
      { id: "floral-wildflower", name: "Champêtre",  desc: "Fleurs des champs printanières" },
      { id: "floral-peony",    name: "Pivoines",     desc: "Bouquet de pivoines romantiques" },
    ],
  },
];

// Placeholder background colors per category
const BG: Record<string, string> = {
  envelope: "#f5ede6",
  door:     "#ece8f0",
  curtain:  "#e8eff5",
  book:     "#e8f0ec",
  floral:   "#f5e8ec",
};

export default function AnimationPage() {
  const { animation, setAnimation } = useOrderStore();
  const [activeCategory, setActiveCategory] = useState("envelope");

  const currentCategory = CATEGORIES.find((c) => c.id === activeCategory)!;

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center space-y-2 px-4 pb-2">
        <h1 className="font-heading text-3xl font-bold md:text-4xl lg:text-5xl">
          L&apos;animation d&apos;<em className="italic text-primary">Entrée</em>
        </h1>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          Comment vos invités découvriront votre invitation.
        </p>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-1 justify-center flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "flex-none flex items-center gap-1.5 px-4 py-2 rounded-full border-2 text-xs font-bold font-sans transition-all duration-150 whitespace-nowrap",
              activeCategory === cat.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/40",
            )}
          >
            <span className={cn(activeCategory === cat.id ? "text-primary-foreground" : "text-muted-foreground")}>
              {cat.icon}
            </span>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Variants grid */}
      <div className="grid grid-cols-2 gap-3 px-4 max-w-lg mx-auto w-full">
        {currentCategory.variants.map((v) => {
          const isSelected = animation === v.id;
          return (
            <button
              key={v.id}
              onClick={() => setAnimation(v.id)}
              className={cn(
                "text-left rounded-2xl border-2 overflow-hidden transition-all duration-150",
                isSelected
                  ? "border-primary shadow-[0_0_0_3px_rgba(124,45,62,0.1)]"
                  : "border-border hover:border-primary/40",
              )}
            >
              {/* Placeholder preview */}
              <div
                className="relative h-[100px] flex items-center justify-center"
                style={{ background: BG[activeCategory] }}
              >
                <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
                {isSelected && (
                  <div className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
                <span className="relative z-10 text-muted-foreground/40">
                  {currentCategory.icon}
                </span>
              </div>
              <div className="p-3 bg-card">
                <p className="text-[13px] font-bold font-sans">{v.name}</p>
                <p className="text-[10px] text-muted-foreground font-sans mt-0.5 line-clamp-1">{v.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser at `http://localhost:3002/fr/create/animation`**

- Category tabs render, centered, wrapped on mobile
- Clicking a tab shows that category's variants
- Selecting a variant updates the store (check ✓ badge appears)
- "Continuer →" in footer navigates to `/create/theme`

- [ ] **Step 3: Commit**

```bash
git add landing/src/app/[locale]/(configurator)/create/animation/page.tsx
git commit -m "feat: add animation entry step with category tabs and variant grid"
```

---

## Task 7: Redesign Theme page (Step 3)

**Files:**
- Modify: `landing/src/app/[locale]/(configurator)/create/theme/page.tsx`

- [ ] **Step 1: Replace the theme page**

```tsx
// landing/src/app/[locale]/(configurator)/create/theme/page.tsx
"use client";

import { cn } from "@/lib/utils";
import { useOrderStore } from "@/stores/use-order-store";
import { useState } from "react";
import { ThemeDemoOverlay } from "@/components/configurator/ThemeDemoOverlay";

type ThemeConfig = {
  id: string;
  name: string;
  description: string;
  accentColor: string;
  bgGradient: string;
  coupleFont: string;
  coupleWeight?: string;
  coupleLetterSpacing?: string;
  coupleStyle?: "italic" | "normal";
  dateColor?: string;
  placeColor?: string;
  placeFont: string;
  placeStyle?: "italic" | "normal";
  placeExtra?: Record<string, string>;
};

const THEMES: ThemeConfig[] = [
  {
    id: "theme-floral",
    name: "Floral",
    description: "Romantique et intemporel, inspiré par la nature.",
    accentColor: "#c97a90",
    bgGradient: "linear-gradient(160deg, #fdf6f0, #f0d9cc)",
    coupleFont: "'Playfair Display', Georgia, serif",
    placeFont: "Georgia, serif",
    placeStyle: "italic",
  },
  {
    id: "theme-minimalist",
    name: "Minimalist",
    description: "L'élégance pure. Less is more.",
    accentColor: "#27272a",
    bgGradient: "linear-gradient(160deg, #f5f5f5, #e5e5e5)",
    coupleFont: "system-ui, sans-serif",
    coupleWeight: "300",
    coupleLetterSpacing: "0.08em",
    dateColor: "#888",
    placeFont: "system-ui, sans-serif",
    placeColor: "#bbb",
    placeExtra: { textTransform: "uppercase", letterSpacing: "0.12em", fontSize: "10px" },
  },
  {
    id: "theme-boho",
    name: "Boho",
    description: "Chaleureux, libre et sauvage.",
    accentColor: "#a98467",
    bgGradient: "linear-gradient(160deg, #fdf0e5, #e8c99a)",
    coupleFont: "Georgia, serif",
    coupleStyle: "italic",
    placeFont: "Georgia, serif",
    placeStyle: "italic",
    placeColor: "#c4a882",
  },
  {
    id: "theme-royal",
    name: "Royal",
    description: "Sophistiqué et majestueux pour un mariage princier.",
    accentColor: "#1e3a8a",
    bgGradient: "linear-gradient(160deg, #eef2ff, #c7d4f5)",
    coupleFont: "Georgia, serif",
    placeFont: "Georgia, serif",
    placeColor: "#4a68c4",
  },
  {
    id: "theme-modern",
    name: "Modern",
    description: "Audacieux, vibrant et contemporain.",
    accentColor: "#be185d",
    bgGradient: "linear-gradient(160deg, #fff0f5, #f5c8db)",
    coupleFont: "'Montserrat', system-ui, sans-serif",
    coupleWeight: "800",
    placeFont: "'Montserrat', system-ui, sans-serif",
    placeColor: "#e879a8",
    placeExtra: { textTransform: "uppercase", letterSpacing: "0.2em", fontSize: "9px" },
  },
];

export default function ThemePage() {
  const { theme, setTheme } = useOrderStore();
  const [demoTheme, setDemoTheme] = useState<ThemeConfig | null>(null);

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="text-center space-y-2 px-4">
          <h1 className="font-heading text-3xl font-bold md:text-4xl lg:text-5xl">
            L&apos;ambiance de votre{" "}
            <span className="italic text-primary">Mariage</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Glissez pour explorer. Prévisualisez en plein écran avant de choisir.
          </p>
        </div>

        {/* Horizontal carousel */}
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-6 px-4 md:px-6 scrollbar-hide">
          {THEMES.map((t) => {
            const isSelected = theme === t.id;
            return (
              <div
                key={t.id}
                className={cn(
                  "flex-none w-[252px] md:w-[290px] snap-start rounded-[22px] overflow-hidden border-2 bg-card transition-all duration-200",
                  isSelected
                    ? "border-primary shadow-[0_0_0_4px_rgba(124,45,62,0.09),0_8px_28px_rgba(124,45,62,0.13)]"
                    : "border-border/50 shadow-sm",
                )}
              >
                {/* Fake invitation preview */}
                <div
                  className="relative h-[210px] md:h-[240px] flex flex-col items-center justify-center gap-2 overflow-hidden"
                  style={{ background: t.bgGradient }}
                >
                  <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:18px_18px]" />
                  {isSelected && (
                    <div className="absolute top-3 left-3 z-10 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 font-sans">
                      ✓ Sélectionné
                    </div>
                  )}
                  <span
                    className="relative z-10 text-[21px] font-bold text-center px-4"
                    style={{
                      color: t.accentColor,
                      fontFamily: t.coupleFont,
                      fontWeight: t.coupleWeight ?? "700",
                      letterSpacing: t.coupleLetterSpacing,
                      fontStyle: t.coupleStyle ?? "normal",
                    }}
                  >
                    Sophie &amp; Pierre
                  </span>
                  <div className="relative z-10 h-[2px] w-8 rounded-full" style={{ background: t.accentColor }} />
                  <span
                    className="relative z-10 text-[10px] uppercase tracking-[0.18em] font-sans"
                    style={{ color: t.dateColor ?? t.accentColor, opacity: 0.65 }}
                  >
                    14 Juin 2026
                  </span>
                  <span
                    className="relative z-10 text-[11px]"
                    style={{
                      color: t.placeColor ?? t.accentColor,
                      fontFamily: t.placeFont,
                      fontStyle: t.placeStyle ?? "normal",
                      opacity: 0.5,
                      ...(t.placeExtra ?? {}),
                    }}
                  >
                    Château des Roses
                  </span>
                  <button
                    onClick={() => setDemoTheme(t)}
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap text-[11px] font-bold text-primary px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-primary/20 shadow-sm font-sans"
                  >
                    ▶ Voir la démo
                  </button>
                </div>

                {/* Card footer */}
                <div className="p-4 border-t border-border/30">
                  <h3 className="font-semibold text-[15px] mb-0.5" style={{ color: t.accentColor }}>
                    {t.name}
                  </h3>
                  <p className="text-muted-foreground text-[11px] mb-3 line-clamp-1 font-sans">
                    {t.description}
                  </p>
                  <button
                    onClick={() => setTheme(t.id)}
                    className={cn(
                      "w-full py-2.5 rounded-full text-[12px] font-bold font-sans transition-colors",
                      isSelected
                        ? "bg-[#455e4e] text-white"
                        : "bg-primary text-primary-foreground hover:bg-primary/90",
                    )}
                  >
                    {isSelected ? "✓ Sélectionné" : "Choisir ce thème"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Scroll dots */}
        <div className="flex justify-center gap-1.5 pb-2">
          {THEMES.map((t) => (
            <div
              key={t.id}
              className={cn(
                "h-[5px] rounded-full transition-all duration-200",
                theme === t.id ? "w-4 bg-primary" : "w-[5px] bg-border",
              )}
            />
          ))}
        </div>
      </div>

      {demoTheme && (
        <ThemeDemoOverlay
          themeId={demoTheme.id}
          themeName={demoTheme.name}
          onClose={() => setDemoTheme(null)}
          onSelect={() => setTheme(demoTheme.id)}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Verify in browser at `http://localhost:3002/fr/create/theme`**

- Carousel scrolls horizontally, snaps per card
- "▶ Voir la démo" opens `ThemeDemoOverlay` fullscreen
- Overlay loads real invitation iframe, theme applies after ~150ms
- "✓ Choisir ce thème" selects + closes overlay

- [ ] **Step 3: Commit**

```bash
git add landing/src/app/[locale]/(configurator)/create/theme/page.tsx
git commit -m "feat: redesign theme step with horizontal carousel and demo overlay"
```

---

## Task 8: Redesign Modules page (Step 4)

**Files:**
- Modify: `landing/src/app/[locale]/(configurator)/create/modules/page.tsx`

- [ ] **Step 1: Read the current modules page to get the MODULES data array**

```bash
grep -A 5 "id:" landing/src/app/[locale]/\(configurator\)/create/modules/page.tsx | head -80
```

- [ ] **Step 2: Replace the modules page with a list-row design**

Keep the exact same `MODULES` data array (same IDs, labels, descriptions). Only change the visual layout from a grid of cards to a list of rows:

```tsx
// landing/src/app/[locale]/(configurator)/create/modules/page.tsx
"use client";

import { cn } from "@/lib/utils";
import { useOrderStore } from "@/stores/use-order-store";
// Keep the same lucide-react icon imports as before

// Keep the exact same MODULES array as before — same IDs, labels, icons, descriptions

export default function ModulesPage() {
  const { modules, toggleModule, plan } = useOrderStore();

  const extraCount = plan === "experience" ? Math.max(0, modules.length - 4) : 0;
  const extraCost = extraCount * 5;

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center space-y-2 px-4 pb-2">
        <h1 className="font-heading text-3xl font-bold md:text-4xl lg:text-5xl">
          Vos <span className="italic text-primary">fonctionnalités</span>
        </h1>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto font-sans">
          {plan === "premium"
            ? "Tous les modules sont inclus dans votre offre."
            : "4 modules inclus. +5€ par module supplémentaire."}
        </p>
      </div>

      {/* Counter badge */}
      {plan === "experience" && modules.length > 0 && (
        <div className="flex justify-center">
          <span className="font-sans text-xs font-bold px-4 py-1.5 rounded-full bg-primary/10 text-primary">
            {modules.length} sélectionné{modules.length > 1 ? "s" : ""}
            {extraCost > 0 ? ` · +${extraCost}€` : " · inclus"}
          </span>
        </div>
      )}

      {/* List */}
      <div className="flex flex-col gap-2 max-w-lg mx-auto w-full px-4">
        {MODULES.map((mod) => {
          const isSelected = modules.includes(mod.id);
          const Icon = mod.icon;
          return (
            <button
              key={mod.id}
              onClick={() => toggleModule(mod.id)}
              className={cn(
                "w-full text-left flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-150",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/30",
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">{mod.label}</p>
                <p className="text-xs text-muted-foreground font-sans mt-0.5 line-clamp-1">{mod.desc}</p>
              </div>
              <div
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                  isSelected ? "border-primary bg-primary" : "border-border",
                )}
              >
                {isSelected && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify in browser at `http://localhost:3002/fr/create/modules`**

- List rows render with icons, labels, descriptions
- Clicking toggles selection (border + bg change)
- Counter badge updates with module count and extra cost

- [ ] **Step 4: Commit**

```bash
git add landing/src/app/[locale]/(configurator)/create/modules/page.tsx
git commit -m "feat: redesign modules step as list rows with SVG icons"
```

---

## Task 9: Create Languages page (Step 5)

**Files:**
- Create: `landing/src/app/[locale]/(configurator)/create/languages/page.tsx`

- [ ] **Step 1: Create the languages page**

```tsx
// landing/src/app/[locale]/(configurator)/create/languages/page.tsx
"use client";

import { cn } from "@/lib/utils";
import { useOrderStore } from "@/stores/use-order-store";

const LANGUAGE_PRICE = 15;

const LANGUAGES = [
  { code: "en", flag: "🇬🇧", name: "Anglais" },
  { code: "es", flag: "🇪🇸", name: "Espagnol" },
  { code: "de", flag: "🇩🇪", name: "Allemand" },
  { code: "it", flag: "🇮🇹", name: "Italien" },
  { code: "pt", flag: "🇧🇷", name: "Portugais" },
  { code: "ar", flag: "🇸🇦", name: "Arabe" },
  { code: "zh", flag: "🇨🇳", name: "Chinois" },
  { code: "ja", flag: "🇯🇵", name: "Japonais" },
];

export default function LanguagesPage() {
  const { languages, toggleLanguage } = useOrderStore();

  const total = languages.length * LANGUAGE_PRICE;

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center space-y-2 px-4 pb-2">
        <h1 className="font-heading text-3xl font-bold md:text-4xl lg:text-5xl">
          Langues de votre <span className="italic text-primary">site</span>
        </h1>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto font-sans">
          Le français est inclus. Ajoutez d&apos;autres langues à 15€ chacune.
        </p>
      </div>

      <div className="max-w-lg mx-auto w-full px-4 flex flex-col gap-3">
        {/* Included */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-sans mb-2">
            Langue incluse
          </p>
          <div className="flex items-center gap-3 p-4 rounded-2xl border-2 border-border bg-card">
            <span className="text-2xl">🇫🇷</span>
            <div className="flex-1">
              <p className="text-sm font-bold">Français</p>
              <p className="text-xs text-muted-foreground font-sans">Langue principale de votre site</p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-sans">
              Inclus
            </span>
          </div>
        </div>

        {/* Additional languages */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-sans mb-2">
            Langues supplémentaires — 15€ chacune
          </p>
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map((lang) => {
              const isSelected = languages.includes(lang.code);
              return (
                <button
                  key={lang.code}
                  onClick={() => toggleLanguage(lang.code)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all duration-150",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/30",
                  )}
                >
                  <span className="text-xl flex-shrink-0">{lang.flag}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{lang.name}</p>
                    <p className="text-[10px] text-muted-foreground font-sans">+{LANGUAGE_PRICE}€</p>
                  </div>
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Total */}
        {languages.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-primary/5 border border-primary/20">
            <span className="text-sm font-sans text-muted-foreground">
              {languages.length} langue{languages.length > 1 ? "s" : ""} supplémentaire{languages.length > 1 ? "s" : ""}
            </span>
            <span className="text-sm font-bold text-primary font-sans">+{total}€</span>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser at `http://localhost:3002/fr/create/languages`**

- Français shown as included
- 8 language grid renders
- Selecting languages shows check badge + total updates in layout footer

- [ ] **Step 3: Commit**

```bash
git add landing/src/app/[locale]/(configurator)/create/languages/page.tsx
git commit -m "feat: add languages step with included French and extra language grid"
```

---

## Task 10: Redesign Extras page (Step 6)

**Files:**
- Modify: `landing/src/app/[locale]/(configurator)/create/extras/page.tsx`

- [ ] **Step 1: Replace the extras page**

```tsx
// landing/src/app/[locale]/(configurator)/create/extras/page.tsx
"use client";

import { cn } from "@/lib/utils";
import { useOrderStore } from "@/stores/use-order-store";
import { Music, Palette, Video, Globe } from "lucide-react";
import { Ban } from "lucide-react";

const EXTRAS = [
  {
    id: "custom-music",
    icon: Music,
    name: "Musique personnalisée",
    desc: "Ajoutez votre chanson préférée à l'ambiance de votre site.",
    price: 10,
  },
  {
    id: "custom-illustration",
    icon: Palette,
    name: "Illustration sur mesure",
    desc: "Un portrait illustré de vous deux réalisé par nos artistes.",
    price: 45,
  },
  {
    id: "animated-video",
    icon: Video,
    name: "Vidéo animée",
    desc: "Intro vidéo animée pour accueillir vos invités avec style.",
    price: 55,
  },
  {
    id: "custom-domain",
    icon: Globe,
    name: "Domaine personnalisé",
    desc: "sophie-et-pierre.fr au lieu du lien générique.",
    price: 65,
  },
];

export default function ExtrasPage() {
  const { adultsOnly, setAdultsOnly, extras, toggleExtra } = useOrderStore();

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center space-y-2 px-4 pb-2">
        <h1 className="font-heading text-3xl font-bold md:text-4xl lg:text-5xl">
          Options <span className="italic text-primary">supplémentaires</span>
        </h1>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto font-sans">
          Personnalisez encore plus votre expérience.
        </p>
      </div>

      <div className="flex flex-col gap-4 max-w-lg mx-auto w-full px-4">
        {/* Adults Only toggle */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-sans mb-2">
            Préférences
          </p>
          <button
            onClick={() => setAdultsOnly(!adultsOnly)}
            className={cn(
              "w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-150 text-left",
              adultsOnly ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30",
            )}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                adultsOnly ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              <Ban className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">Mariage Adults Only</p>
              <p className="text-xs text-muted-foreground font-sans mt-0.5">
                Indique poliment que les enfants ne sont pas conviés.
              </p>
            </div>
            {/* Pill switch */}
            <div
              className={cn(
                "w-11 h-6 rounded-full relative flex-shrink-0 transition-colors duration-200",
                adultsOnly ? "bg-primary" : "bg-muted",
              )}
            >
              <div
                className={cn(
                  "absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200",
                  adultsOnly ? "left-6" : "left-1",
                )}
              />
            </div>
          </button>
          {adultsOnly && (
            <p className="mt-2 px-4 py-3 rounded-xl bg-muted/40 text-xs text-muted-foreground font-sans italic leading-relaxed">
              &ldquo;Bien que nous adorions vos enfants, ce mariage sera une célébration entre adultes uniquement.&rdquo;
            </p>
          )}
        </div>

        {/* Premium options grid */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-sans mb-2">
            Options premium
          </p>
          <div className="grid grid-cols-2 gap-3">
            {EXTRAS.map((ex) => {
              const isSelected = extras.includes(ex.id);
              const Icon = ex.icon;
              return (
                <button
                  key={ex.id}
                  onClick={() => toggleExtra(ex.id)}
                  className={cn(
                    "text-left p-4 rounded-2xl border-2 flex flex-col gap-3 transition-all duration-150 relative",
                    isSelected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30",
                  )}
                >
                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center transition-colors",
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold leading-tight">{ex.name}</p>
                    <p className="text-[10px] text-muted-foreground font-sans mt-1 line-clamp-2 leading-relaxed">{ex.desc}</p>
                  </div>
                  <p className="text-sm font-bold text-primary font-sans mt-auto">+{ex.price}€</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser at `http://localhost:3002/fr/create/extras`**

- Adults Only toggle works (animates, shows hint text)
- 4 extra option cards render in 2-column grid
- Selecting updates store + total in footer

- [ ] **Step 3: Commit**

```bash
git add landing/src/app/[locale]/(configurator)/create/extras/page.tsx
git commit -m "feat: redesign extras step with Adults Only toggle and premium options grid"
```

---

## Task 11: Create Wedding page (Step 7)

**Files:**
- Create: `landing/src/app/[locale]/(configurator)/create/wedding/page.tsx`

- [ ] **Step 1: Create the wedding info page**

```tsx
// landing/src/app/[locale]/(configurator)/create/wedding/page.tsx
"use client";

import { cn } from "@/lib/utils";
import { useOrderStore } from "@/stores/use-order-store";

const MONTHS = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre",
];

export default function WeddingPage() {
  const { weddingInfo, setWeddingInfo } = useOrderStore();

  const previewNames =
    weddingInfo.partner1 || weddingInfo.partner2
      ? `${weddingInfo.partner1 || "Prénom 1"} & ${weddingInfo.partner2 || "Prénom 2"}`
      : "Sophie & Pierre";

  const previewDate =
    weddingInfo.day && weddingInfo.month && weddingInfo.year
      ? `${weddingInfo.day} ${weddingInfo.month} ${weddingInfo.year}`
      : "14 Juin 2026";

  const previewVenue = weddingInfo.venue || "Château des Roses, Provence";

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center space-y-2 px-4 pb-2">
        <h1 className="font-heading text-3xl font-bold md:text-4xl lg:text-5xl">
          Parlez-nous de votre <span className="italic text-primary">mariage</span>
        </h1>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto font-sans">
          Ces informations personaliseront votre site d&apos;invitation.
        </p>
      </div>

      {/* Live preview */}
      <div
        className="mx-4 rounded-2xl relative overflow-hidden py-6 text-center"
        style={{ background: "linear-gradient(160deg, #fdf6f0, #f0d9cc)" }}
      >
        <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:18px_18px]" />
        <p className="relative z-10 text-xl font-bold text-[#c97a90]" style={{ fontFamily: "Georgia, serif" }}>
          {previewNames}
        </p>
        <div className="relative z-10 w-6 h-[1.5px] bg-[#c97a90] opacity-50 mx-auto my-2" />
        <p className="relative z-10 text-[10px] uppercase tracking-widest text-[#c4a882] font-sans">
          {previewDate}
        </p>
        <p className="relative z-10 text-xs italic text-[#c4a882] mt-1" style={{ fontFamily: "Georgia, serif" }}>
          {previewVenue}
        </p>
        <p className="relative z-10 text-[10px] text-muted-foreground/50 font-sans mt-3">
          Aperçu de votre invitation
        </p>
      </div>

      <div className="flex flex-col gap-4 max-w-lg mx-auto w-full px-4">
        {/* Partners */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-sans mb-2">
            Les mariés
          </p>
          <div className="bg-card border-2 border-border rounded-2xl overflow-hidden">
            <div className="flex border-b border-border/60">
              <div className="flex-1 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Prénom marié·e 1</p>
                <input
                  type="text"
                  placeholder="Sophie"
                  value={weddingInfo.partner1}
                  onChange={(e) => setWeddingInfo({ partner1: e.target.value })}
                  className="w-full text-sm font-heading bg-transparent outline-none placeholder:text-muted-foreground/40 placeholder:italic"
                />
              </div>
              <div className="flex-1 px-4 py-3 border-l border-border/60">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Prénom marié·e 2</p>
                <input
                  type="text"
                  placeholder="Pierre"
                  value={weddingInfo.partner2}
                  onChange={(e) => setWeddingInfo({ partner2: e.target.value })}
                  className="w-full text-sm font-heading bg-transparent outline-none placeholder:text-muted-foreground/40 placeholder:italic"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Date */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-sans mb-2">
            Date & lieu
          </p>
          <div className="bg-card border-2 border-border rounded-2xl overflow-hidden">
            <div className="flex border-b border-border/60">
              <div className="w-[72px] px-4 py-3 border-r border-border/60">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Jour</p>
                <input
                  type="number"
                  placeholder="14"
                  min="1"
                  max="31"
                  value={weddingInfo.day}
                  onChange={(e) => setWeddingInfo({ day: e.target.value })}
                  className="w-full text-sm font-sans bg-transparent outline-none placeholder:text-muted-foreground/40"
                />
              </div>
              <div className="flex-1 px-4 py-3 border-r border-border/60">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Mois</p>
                <select
                  value={weddingInfo.month}
                  onChange={(e) => setWeddingInfo({ month: e.target.value })}
                  className="w-full text-sm font-sans bg-transparent outline-none text-foreground"
                >
                  <option value="">—</option>
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="w-[80px] px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Année</p>
                <input
                  type="number"
                  placeholder="2026"
                  value={weddingInfo.year}
                  onChange={(e) => setWeddingInfo({ year: e.target.value })}
                  className="w-full text-sm font-sans bg-transparent outline-none placeholder:text-muted-foreground/40"
                />
              </div>
            </div>
            <div className="px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Lieu de la cérémonie</p>
              <input
                type="text"
                placeholder="Château des Roses, Provence"
                value={weddingInfo.venue}
                onChange={(e) => setWeddingInfo({ venue: e.target.value })}
                className="w-full text-sm font-sans bg-transparent outline-none placeholder:text-muted-foreground/40 placeholder:italic"
              />
            </div>
          </div>
        </div>

        {/* Account */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-sans mb-2">
            Votre compte
          </p>
          <div className="bg-card border-2 border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border/60">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Adresse email</p>
              <input
                type="email"
                placeholder="sophie@exemple.fr"
                value={weddingInfo.email}
                onChange={(e) => setWeddingInfo({ email: e.target.value })}
                className="w-full text-sm font-sans bg-transparent outline-none placeholder:text-muted-foreground/40"
              />
            </div>
            <div className="px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Mot de passe</p>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full text-sm font-sans bg-transparent outline-none placeholder:text-muted-foreground/40"
              />
              <p className="text-[10px] text-muted-foreground/50 font-sans mt-1">8 caractères minimum</p>
            </div>
          </div>
        </div>

        {/* Trust row */}
        <div className="flex gap-3 pt-1">
          {[
            { label: "Personnalise votre site" },
            { label: "Accès sécurisé à votre espace" },
            { label: "Support disponible après achat" },
          ].map((item) => (
            <div key={item.label} className="flex-1 border border-border rounded-xl p-3 text-center">
              <p className="text-[10px] text-muted-foreground/70 font-sans leading-tight">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser at `http://localhost:3002/fr/create/wedding`**

- Preview card updates live as user types names/date/venue
- All fields connected to Zustand store (persist across navigation)
- "Continuer →" advances to `/create/checkout`

- [ ] **Step 3: Commit**

```bash
git add landing/src/app/[locale]/(configurator)/create/wedding/page.tsx
git commit -m "feat: add wedding info step with live preview and account creation fields"
```

---

## Task 12: Redesign Checkout page (Step 8)

**Files:**
- Modify: `landing/src/app/[locale]/(configurator)/create/checkout/page.tsx`

- [ ] **Step 1: Install Stripe packages if not yet present**

```bash
cd landing && npm list @stripe/stripe-js @stripe/react-stripe-js 2>/dev/null | head -5
```

If not installed:
```bash
cd landing && npm install @stripe/stripe-js @stripe/react-stripe-js
```

- [ ] **Step 2: Check NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set**

```bash
grep "STRIPE" landing/.env.local 2>/dev/null || grep "STRIPE" .env.local 2>/dev/null || echo "Not found"
```

If missing, add to `landing/.env.local`:
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

- [ ] **Step 3: Replace the checkout page**

```tsx
// landing/src/app/[locale]/(configurator)/create/checkout/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "@/navigation";
import { selectTotalPrice, useOrderStore } from "@/stores/use-order-store";
import { processCheckout } from "@/actions/checkout-actions";
import { cn } from "@/lib/utils";
import { Edit2, Eye, CreditCard, Loader2 } from "lucide-react";
import { ThemeDemoOverlay } from "@/components/configurator/ThemeDemoOverlay";

const THEME_NAMES: Record<string, string> = {
  "theme-floral":     "Floral",
  "theme-minimalist": "Minimalist",
  "theme-boho":       "Boho",
  "theme-royal":      "Royal",
  "theme-modern":     "Modern",
};

const PAYMENT_METHODS = [
  { id: "card",   label: "Carte" },
  { id: "apple",  label: "Apple Pay" },
  { id: "google", label: "Google Pay" },
  { id: "paypal", label: "PayPal" },
] as const;

type PaymentMethod = (typeof PAYMENT_METHODS)[number]["id"];

export default function CheckoutPage() {
  const router = useRouter();
  const { plan, animation, theme, modules, languages, extras, adultsOnly, weddingInfo } = useOrderStore();
  const totalPrice = useOrderStore(selectTotalPrice);

  const [showPreview, setShowPreview] = useState(false);
  const [payMethod, setPayMethod] = useState<PaymentMethod>("card");
  const [isLoading, setIsLoading] = useState(false);

  // Billing form state
  const [billing, setBilling] = useState({
    firstName: "",
    lastName: "",
    address: "",
    zip: "",
    city: "",
    country: "France",
  });

  async function handlePayment() {
    setIsLoading(true);
    try {
      const result = await processCheckout({
        plan: plan || "unknown",
        amount: totalPrice,
        period: "lifetime",
      });
      if (result.error) {
        alert("Erreur: " + result.error);
      } else {
        const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL;
        if (dashboardUrl) {
          const target = new URL(dashboardUrl);
          target.pathname = "/fr/billing";
          target.searchParams.set("success", "true");
          setTimeout(() => { window.location.href = target.toString(); }, 1500);
        }
      }
    } catch {
      alert("Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  }

  const RecapRow = ({
    label, value, href, children,
  }: {
    label: string;
    value?: string;
    href?: string;
    children?: React.ReactNode;
  }) => (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-border/40 last:border-b-0">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans">{label}</p>
        {value && <p className="text-sm font-semibold mt-0.5">{value}</p>}
        {children}
      </div>
      {href && (
        <button
          onClick={() => router.push(href)}
          className="w-7 h-7 rounded-full border border-border flex items-center justify-center flex-shrink-0 hover:border-primary transition-colors"
        >
          <Edit2 className="w-3 h-3 text-muted-foreground" />
        </button>
      )}
    </div>
  );

  return (
    <>
      <div className="flex flex-col gap-5 max-w-lg mx-auto px-4">
        <div className="text-center space-y-2 pb-2">
          <h1 className="font-heading text-3xl font-bold md:text-4xl">
            Votre commande est <span className="italic text-primary">prête</span>
          </h1>
          <p className="text-muted-foreground text-sm font-sans">
            Vérifiez vos choix et finalisez votre site d&apos;invitation.
          </p>
        </div>

        {/* Récap */}
        <div className="bg-card border-2 border-border/60 rounded-2xl overflow-hidden">
          <RecapRow
            label="Les mariés"
            value={`${weddingInfo.partner1 || "—"} & ${weddingInfo.partner2 || "—"} · ${weddingInfo.day || "—"} ${weddingInfo.month || ""} ${weddingInfo.year || ""}`}
            href="/create/wedding"
          />
          <RecapRow label="Offre" value={`Pack ${plan === "premium" ? "Premium" : "Essentiel"} — ${plan === "premium" ? "575" : "175"}€`} href="/create/plan" />
          <RecapRow label="Animation & Thème" value={`${animation || "—"} · ${THEME_NAMES[theme] || "—"}`} href="/create/animation" />
          <RecapRow label="Modules" href="/create/modules">
            <div className="flex flex-wrap gap-1 mt-1">
              {modules.slice(0, 4).map((m) => (
                <span key={m} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary font-sans">{m}</span>
              ))}
              {modules.length > 4 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-sans">+{modules.length - 4}</span>
              )}
            </div>
          </RecapRow>
          {(languages.length > 0 || extras.length > 0 || adultsOnly) && (
            <RecapRow label="Options" href="/create/extras">
              <div className="flex flex-wrap gap-1 mt-1">
                {languages.map((l) => (
                  <span key={l} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary font-sans">{l.toUpperCase()} +15€</span>
                ))}
                {extras.map((e) => (
                  <span key={e} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary font-sans">{e}</span>
                ))}
                {adultsOnly && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-sans">Adults Only</span>
                )}
              </div>
            </RecapRow>
          )}
        </div>

        {/* Aperçu */}
        <button
          onClick={() => setShowPreview(true)}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-primary text-primary font-bold text-sm font-sans hover:bg-primary/5 transition-colors"
        >
          <Eye className="w-4 h-4" />
          Voir l&apos;aperçu de mon site
        </button>

        {/* Separator */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 font-sans">Paiement</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Billing */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-sans mb-2">
            Informations de facturation
          </p>
          <div className="bg-card border-2 border-border rounded-2xl overflow-hidden">
            <div className="flex border-b border-border/60">
              <div className="flex-1 px-4 py-3 border-r border-border/60">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Prénom</p>
                <input
                  type="text"
                  placeholder="Sophie"
                  value={billing.firstName}
                  onChange={(e) => setBilling({ ...billing, firstName: e.target.value })}
                  className="w-full text-sm font-sans bg-transparent outline-none placeholder:text-muted-foreground/40"
                />
              </div>
              <div className="flex-1 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Nom</p>
                <input
                  type="text"
                  placeholder="Dupont"
                  value={billing.lastName}
                  onChange={(e) => setBilling({ ...billing, lastName: e.target.value })}
                  className="w-full text-sm font-sans bg-transparent outline-none placeholder:text-muted-foreground/40"
                />
              </div>
            </div>
            <div className="px-4 py-3 border-b border-border/60">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Adresse</p>
              <input
                type="text"
                placeholder="12 rue des Roses"
                value={billing.address}
                onChange={(e) => setBilling({ ...billing, address: e.target.value })}
                className="w-full text-sm font-sans bg-transparent outline-none placeholder:text-muted-foreground/40"
              />
            </div>
            <div className="flex border-b border-border/60">
              <div className="w-[90px] px-4 py-3 border-r border-border/60">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Code postal</p>
                <input
                  type="text"
                  placeholder="75001"
                  value={billing.zip}
                  onChange={(e) => setBilling({ ...billing, zip: e.target.value })}
                  className="w-full text-sm font-sans bg-transparent outline-none placeholder:text-muted-foreground/40"
                />
              </div>
              <div className="flex-1 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Ville</p>
                <input
                  type="text"
                  placeholder="Paris"
                  value={billing.city}
                  onChange={(e) => setBilling({ ...billing, city: e.target.value })}
                  className="w-full text-sm font-sans bg-transparent outline-none placeholder:text-muted-foreground/40"
                />
              </div>
            </div>
            <div className="px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Pays</p>
              <select
                value={billing.country}
                onChange={(e) => setBilling({ ...billing, country: e.target.value })}
                className="w-full text-sm font-sans bg-transparent outline-none text-foreground"
              >
                {["France","Belgique","Suisse","Luxembourg","Canada","Autre"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between px-5 py-4 bg-card border-2 border-border rounded-2xl">
          <div>
            <p className="text-sm font-semibold font-sans">Total à régler</p>
            <p className="text-[10px] text-muted-foreground font-sans">Paiement unique · Accès à vie</p>
          </div>
          <span className="font-heading text-3xl font-bold text-primary">{totalPrice}€</span>
        </div>

        {/* Payment methods */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-sans mb-2">
            Mode de paiement
          </p>
          <div className="flex gap-2 mb-3">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setPayMethod(m.id)}
                className={cn(
                  "flex-1 py-2.5 rounded-xl border-2 text-[11px] font-bold font-sans transition-all",
                  payMethod === m.id
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          {payMethod === "card" && (
            <div className="bg-card border-2 border-border rounded-2xl overflow-hidden mb-3">
              <div className="px-4 py-3 border-b border-border/60">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Numéro de carte</p>
                <input type="text" placeholder="1234  5678  9012  3456" className="w-full text-sm font-sans bg-transparent outline-none placeholder:text-muted-foreground/40" readOnly />
              </div>
              <div className="flex">
                <div className="flex-1 px-4 py-3 border-r border-border/60">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Expiration</p>
                  <input type="text" placeholder="MM / AA" className="w-full text-sm font-sans bg-transparent outline-none placeholder:text-muted-foreground/40" readOnly />
                </div>
                <div className="w-[100px] px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">CVC</p>
                  <input type="text" placeholder="•••" className="w-full text-sm font-sans bg-transparent outline-none placeholder:text-muted-foreground/40" readOnly />
                </div>
              </div>
              <div className="px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Nom sur la carte</p>
                <input type="text" placeholder="Sophie Dupont" className="w-full text-sm font-sans bg-transparent outline-none placeholder:text-muted-foreground/40" readOnly />
              </div>
            </div>
          )}

          {(payMethod === "apple" || payMethod === "google" || payMethod === "paypal") && (
            <div className="bg-muted/30 rounded-2xl p-4 text-center mb-3">
              <p className="text-sm text-muted-foreground font-sans">
                {payMethod === "apple" && "Apple Pay sera activé via Stripe au moment du paiement."}
                {payMethod === "google" && "Google Pay sera activé via Stripe au moment du paiement."}
                {payMethod === "paypal" && "Vous serez redirigé vers PayPal pour finaliser le paiement."}
              </p>
            </div>
          )}
        </div>

        {/* Stripe badge */}
        <p className="text-center text-[11px] text-muted-foreground/60 font-sans flex items-center justify-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5" />
          Paiement sécurisé par Stripe
        </p>

        {/* Pay button */}
        <button
          onClick={handlePayment}
          disabled={isLoading}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base font-sans flex items-center justify-center gap-2 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
          {isLoading ? "Traitement..." : `Payer ${totalPrice}€`}
        </button>

        <p className="text-center text-[10px] text-muted-foreground/50 font-sans leading-relaxed">
          En validant, vous acceptez nos CGV et notre politique de confidentialité.<br />
          Paiement unique · Sans abonnement · Accès à vie garanti.
        </p>
      </div>

      {/* Preview overlay */}
      {showPreview && (
        <ThemeDemoOverlay
          themeId={theme}
          themeName={THEME_NAMES[theme] ?? "Floral"}
          onClose={() => setShowPreview(false)}
          onSelect={() => setShowPreview(false)}
        />
      )}
    </>
  );
}
```

- [ ] **Step 4: Verify in browser at `http://localhost:3002/fr/create/checkout`**

- All recap rows display store data correctly
- "Voir l'aperçu" opens the ThemeDemoOverlay with real iframe
- Billing form fields accept input
- Payment method tabs switch panel
- "Payer X€" button calls processCheckout

- [ ] **Step 5: Commit**

```bash
git add landing/src/app/[locale]/(configurator)/create/checkout/page.tsx
git commit -m "feat: redesign checkout with full recap, billing form, and Stripe multi-method payment"
```

---

## Task 13: End-to-end smoke test

- [ ] **Step 1: Navigate the full wizard flow**

Open `http://localhost:3002/fr/create/plan` and walk through all 8 steps:

1. `/create/plan` — Select "Essentiel" → Continuer
2. `/create/animation` — Select a category + variant → Continuer
3. `/create/theme` — Select a theme (optionally open demo) → Continuer
4. `/create/modules` — Select 3-5 modules → Continuer
5. `/create/languages` — Select 1-2 languages → Continuer
6. `/create/extras` — Toggle adults only, select 1 extra → Continuer
7. `/create/wedding` — Fill names, date, venue, email → Continuer
8. `/create/checkout` — Verify recap matches selections, check total, open preview, fill billing

- [ ] **Step 2: Verify total calculation**

Expected formula: `175 (plan) + 0 (modules ≤4) + langues×15 + extras_sum`

Example: Essentiel + 2 langues + musique = 175 + 30 + 10 = 215€

- [ ] **Step 3: Verify mobile layout (Chrome devtools → iPhone 14 Pro, 390px)**

- Plan: stacked cards fit in viewport
- Animation: tabs wrap/scroll correctly, grid 2 columns
- Theme: one card visible at a time, carousel snaps
- Modules: list rows readable
- Languages: 2-column grid
- Extras: 2-column grid
- Wedding: form fields usable, live preview visible
- Checkout: all sections stack cleanly, pay button accessible

- [ ] **Step 4: Verify back navigation works**

Use the back arrow in the header — it should return to the previous step.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete configurator redesign — 8 steps, mobile-first, Stripe checkout"
```

---

## Notes for the implementer

- **i18n routing:** Always use `Link`, `useRouter`, `usePathname` from `@/navigation`, never from `next/navigation` directly.
- **Theme IDs in store** are prefixed (`"theme-floral"`); ProductDemoViewer uses unprefixed (`"floral"`). `THEME_KEY_MAP` in `ThemeDemoOverlay` handles this.
- **Animation variants are fictional** — the `animation` store field stores an ID string like `"envelope-classic"` but there are no real video sequences. This is for future implementation.
- **Password field in wedding page** — this is UI only for now. Real account creation happens via `create-wedding.ts` server action at checkout. Don't wire up account creation in this plan.
- **Stripe Elements** — the card form in checkout is shown as a static mockup. Real Stripe Elements integration (CardElement, useStripe, useElements) is a separate task not covered in this plan. The existing `processCheckout` server action handles the payment intent creation.
- **`scrollbar-hide`** class is used in the theme carousel. Must be added to globals.css (Task 2) before Task 7.
- **Modules page** — keep the exact same MODULES data array (same IDs). Only redesign the visual layout.
