# Theme Step Redesign — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the `/create/theme` step (step 2 of the configurator) with a mobile-first horizontal scroll carousel of theme cards, each with a fake invitation preview and a "Voir la démo" button that opens a fullscreen overlay showing the real invitation iframe pre-set to the correct theme.

**Architecture:** Replace the existing grid layout in `theme/page.tsx` with a horizontal scroll carousel. A new `ThemeDemoOverlay` client component renders a fullscreen overlay that loads the invitation demo page (`/fr/invitation/demo-envelope?demo=true&device=mobile`) directly in an iframe — the same URL that `ProductDemoViewer` already uses internally. After the iframe loads, `ThemeDemoOverlay` sends a `SET_THEME` postMessage directly to the invitation iframe, using the same payload shape as `ProductDemoViewer.sendTheme()`. No extra wrapper page needed — no double-iframing.

**Tech Stack:** Next.js App Router, React, Tailwind CSS, Zustand (`useOrderStore`), existing `ProductDemoViewer` constants (imported, not duplicated), `postMessage` API.

---

## Key architecture notes (read before implementing)

**How theme-switching works in the existing codebase:**

- `ProductDemoViewer` owns an `<iframe>` that loads `/fr/invitation/[weddingCode]?demo=true&device=mobile`
- It calls `sendTheme()` which does `iframe.contentWindow.postMessage({ type: "SET_THEME", theme, device, heroAsset, animationSequence }, origin)` to the invitation iframe
- The invitation page receives this message and applies the theme/animation
- `ProductDemoViewer` also listens for outgoing `SYNC_THEME` / `SYNC_ANIMATION` messages from the invitation iframe (those go child → parent, not parent → child)

**Our overlay does exactly the same thing:** loads the invitation iframe directly and calls `sendTheme()` to set the theme. No intermediate wrapper page needed.

**Navigation in the wizard:**

The existing `theme/page.tsx` calls `router.push("/create/modules")` on selection. The configurator layout (`(configurator)/layout.tsx`) also has a "Continuer" footer button that pushes `nextStep`. In the redesign we **keep** `router.push("/create/modules")` removed — the user explicitly clicks "Choisir ce thème" then presses "Continuer →" in the footer. This gives users time to browse multiple themes before advancing. The layout's "Continuer" button is always enabled on the theme step (no `plan` guard), so this works.

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| **Create** | `landing/src/components/configurator/ThemeDemoOverlay.tsx` | Fullscreen overlay with invitation iframe + SET_THEME postMessage |
| **Modify** | `landing/src/app/[locale]/(configurator)/create/theme/page.tsx` | Full rewrite — horizontal carousel layout |
| **Modify** | `landing/src/app/globals.css` | Add `.scrollbar-hide` CSS rule |

---

## Task 1: Create ThemeDemoOverlay component

Fullscreen overlay that loads the invitation iframe and sends `SET_THEME` after load. Uses the same constants and payload as `ProductDemoViewer.sendTheme()`.

**Files:**
- Create: `landing/src/components/configurator/ThemeDemoOverlay.tsx`

- [ ] **Step 1: Read ProductDemoViewer to get exact postMessage payload**

Open `landing/src/components/landing/product-demo-viewer.tsx` and find:
- `ANIMATION_SEQUENCES` (the full object, ~lines 23–42)
- `DEMO_HERO` / `THEME_HERO_ASSETS` (lines ~49–60)
- `sendTheme()` function (lines ~366–386) — note the exact payload shape

You need these to send the correct message. Do **not** copy-paste them — import from the file.

- [ ] **Step 2: Check what is exported from product-demo-viewer.tsx**

```bash
grep "^export" landing/src/components/landing/product-demo-viewer.tsx
```

If `ANIMATION_SEQUENCES`, `DEMO_HERO`, and `THEME_HERO_ASSETS` are not exported, add `export` to each declaration in `product-demo-viewer.tsx` before creating `ThemeDemoOverlay`.

- [ ] **Step 3: Export the constants from product-demo-viewer.tsx (if needed)**

In `landing/src/components/landing/product-demo-viewer.tsx`, add `export` to:
```tsx
export const ANIMATION_SEQUENCES: Record<AnimationKey, AnimationSequence> = { ... }
export const DEMO_HERO: HeroAsset = { ... }
export const THEME_HERO_ASSETS: Record<ThemeKey, HeroAsset> = { ... }
export type { AnimationKey, ThemeKey, HeroAsset, AnimationSequence }
```

- [ ] **Step 4: Create ThemeDemoOverlay.tsx**

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

// Maps store theme IDs ("theme-floral") to ProductDemoViewer theme keys ("floral")
const THEME_KEY_MAP: Record<string, ThemeKey> = {
  "theme-floral":     "floral",
  "theme-minimalist": "minimalist",
  "theme-boho":       "boho",
  "theme-royal":      "royal",
  "theme-modern":     "modern",
};

const DEFAULT_ANIMATION: AnimationKey = "envelope";

// Demo wedding codes — same as used in ProductDemoViewer
const DEMO_CODE = "demo-envelope";

interface ThemeDemoOverlayProps {
  themeId: string;    // store value, e.g. "theme-floral"
  themeName: string;  // display name, e.g. "Floral"
  onClose: () => void;
  onSelect: () => void; // called when user confirms theme from overlay
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

  // Lock body scroll while open
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

  const handleIframeLoad = () => {
    setLoading(false);
    setTimeout(sendTheme, 100);
  };

  const handleSelect = () => {
    onSelect();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-[#FDFBF7]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 h-[52px] border-b border-border/40 bg-background/90 backdrop-blur-md flex-shrink-0">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-sm font-semibold text-primary"
        >
          ‹ Retour
        </button>
        <span className="text-sm font-bold text-foreground truncate px-2">
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
          onLoad={handleIframeLoad}
        />
      </div>

      {/* Bottom action bar */}
      <div className="flex gap-3 px-4 py-3 border-t border-border/40 bg-background/90 backdrop-blur-md flex-shrink-0">
        <button
          onClick={onClose}
          className="px-5 py-3 rounded-full border border-border text-sm text-muted-foreground"
        >
          Retour
        </button>
        <button
          onClick={handleSelect}
          className="flex-1 py-3 rounded-full bg-primary text-primary-foreground text-sm font-bold"
        >
          ✓ Choisir ce thème
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add landing/src/components/landing/product-demo-viewer.tsx
git add landing/src/components/configurator/ThemeDemoOverlay.tsx
git commit -m "feat: add ThemeDemoOverlay and export constants from ProductDemoViewer"
```

---

## Task 2: Rewrite theme/page.tsx with the carousel

Full rewrite of the step 2 page. Mobile-first horizontal scroll, snap cards, fake invitation preview, "Voir la démo" overlay trigger, "Choisir ce thème" button, selected badge.

**Files:**
- Modify: `landing/src/app/[locale]/(configurator)/create/theme/page.tsx`

- [ ] **Step 1: Replace the file contents**

```tsx
// landing/src/app/[locale]/(configurator)/create/theme/page.tsx
"use client";

import { cn } from "@/lib/utils";
import { useOrderStore } from "@/stores/use-order-store";
import { Check } from "lucide-react";
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
        {/* Title */}
        <div className="text-center space-y-2 px-4">
          <h1 className="font-heading text-3xl font-bold md:text-4xl lg:text-5xl">
            L&apos;ambiance de votre{" "}
            <span className="italic text-primary">Mariage</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
            Glissez pour explorer. Prévisualisez en plein écran avant de choisir.
          </p>
        </div>

        {/* Horizontal carousel */}
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 px-4 md:px-6 scrollbar-hide">
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
                  {/* Dot grid texture */}
                  <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:18px_18px]" />

                  {/* Selected badge */}
                  {isSelected && (
                    <div className="absolute top-3 left-3 z-10 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" /> Sélectionné
                    </div>
                  )}

                  {/* Couple names */}
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
                  <div
                    className="relative z-10 h-[2px] w-8 rounded-full"
                    style={{ background: t.accentColor }}
                  />
                  <span
                    className="relative z-10 text-[10px] uppercase tracking-[0.18em]"
                    style={{
                      color: t.dateColor ?? t.accentColor,
                      opacity: 0.65,
                      fontFamily: "system-ui, sans-serif",
                    }}
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

                  {/* Voir la démo button */}
                  <button
                    onClick={() => setDemoTheme(t)}
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap flex items-center gap-1.5 text-[11px] font-bold text-primary px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-primary/20 shadow-sm hover:bg-white transition-colors"
                  >
                    ▶ Voir la démo
                  </button>
                </div>

                {/* Card footer */}
                <div className="p-4 border-t border-border/30">
                  <h3
                    className="font-semibold text-[15px] mb-0.5"
                    style={{ color: t.accentColor }}
                  >
                    {t.name}
                  </h3>
                  <p className="text-muted-foreground text-[11px] mb-3 line-clamp-1">
                    {t.description}
                  </p>
                  <button
                    onClick={() => setTheme(t.id)}
                    className={cn(
                      "w-full py-2.5 rounded-full text-[12px] font-bold transition-colors",
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

        {/* Scroll indicator dots (driven by store selection) */}
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

      {/* Fullscreen demo overlay */}
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

- [ ] **Step 2: Verify in browser**

Navigate to `http://localhost:3002/fr/create/theme`:
- Carousel scrolls horizontally, snaps per card
- Each card shows fake invitation preview with correct colors/fonts per theme
- "▶ Voir la démo" button visible at bottom of each preview area
- Clicking it opens `ThemeDemoOverlay` fullscreen with spinner, then the real invitation
- After iframe loads, the invitation applies the correct theme (wait ~1s for postMessage)
- "✓ Choisir ce thème" in overlay selects theme + closes overlay
- Card shows "✓ Sélectionné" badge + green button
- "Continuer →" in the wizard footer advances to `/create/modules`

- [ ] **Step 3: Check mobile (Chrome devtools → iPhone 14 Pro, 390px)**

- One card visible at a time, swipe snaps to next card
- "▶ Voir la démo" tap opens fullscreen overlay (no floating pill overlapping)
- Fullscreen overlay fills the screen, invitation visible, bottom bar accessible

- [ ] **Step 4: Check desktop (1280px+)**

- Multiple cards visible, horizontal scroll still works
- Overlay fills the full window

- [ ] **Step 5: Commit**

```bash
git add landing/src/app/[locale]/(configurator)/create/theme/page.tsx
git commit -m "feat: redesign theme step with horizontal carousel and fullscreen demo preview"
```

---

## Task 3: Add scrollbar-hide utility CSS

**Files:**
- Modify: `landing/src/app/globals.css`

- [ ] **Step 1: Find globals.css**

```bash
find landing/src -name "globals.css" | head -3
```

- [ ] **Step 2: Add the rule at the bottom of globals.css**

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

- [ ] **Step 3: Verify scrollbar not visible in Chrome, Firefox, Safari**

Scroll the carousel — no scrollbar should appear on any browser.

- [ ] **Step 4: Commit**

```bash
git add landing/src/app/globals.css
git commit -m "style: add scrollbar-hide utility for carousel"
```

---

## Notes for the implementer

- **No new route needed.** We load `/fr/invitation/demo-envelope?demo=true&device=mobile` directly — the same URL `ProductDemoViewer` already uses. `demo-envelope` is a demo wedding code that already exists in the DB/seed data.
- **postMessage flow:** `ThemeDemoOverlay` → `SET_THEME` → invitation iframe. This is identical to how `ProductDemoViewer.sendTheme()` works. The invitation page handles the message and applies theme/animation.
- **Theme IDs in the store** are prefixed: `"theme-floral"`. `ProductDemoViewer` uses unprefixed keys: `"floral"`. `THEME_KEY_MAP` in `ThemeDemoOverlay` handles this mapping.
- **The configurator layout** (`(configurator)/layout.tsx`) provides the stepper pills, progress bar, back button, and "Continuer →" footer. `theme/page.tsx` renders only the page body.
- **Scroll dot indicators** are driven by the selected theme in the Zustand store (not by scroll position). This keeps them simple and always in sync with the selection state.
- **No `router.push` in theme/page.tsx** — unlike the old version, selection does not auto-advance. The user selects a theme, then clicks "Continuer →" in the layout footer. This is intentional: users should be able to browse all themes before deciding.
