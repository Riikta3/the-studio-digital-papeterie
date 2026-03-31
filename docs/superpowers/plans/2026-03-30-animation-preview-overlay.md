# AnimationPreviewOverlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer le composant `AnimationPreviewOverlay` + les helpers `getAnimationPreview`/`getAnimationFrames` que la page `studio/animation` importe déjà, avec un layout bottom-sheet sur mobile et modal plein-format sur desktop, toggle device desktop/mobile, boutons "Retour" et "Choisir".

**Architecture:** Un seul fichier client `AnimationPreviewOverlay.tsx` exporte le composant overlay et deux helpers purs. Le composant est responsive : bottom-sheet natif sur mobile (≤ md), modal centrée sur desktop. Le toggle device change l'aspect-ratio de la zone de preview (9/16 mp4 vs 16/9 webp) sans charger d'iframe — on joue directement le fichier via `<video>` ou `<img>` animée selon le type d'asset. La convention de nommage des assets suit le pattern `/videos/animation/{category}/{variant}/{device}/animation-{category}-{variant}-{device}.{ext}`.

**Tech Stack:** Next.js App Router, React 18, Framer Motion (AnimatePresence déjà utilisé dans la page), Tailwind CSS, Lucide React (icons), assets dans `public/videos/animation/`.

---

## File map

| Fichier | Action | Rôle |
|---|---|---|
| `landing/src/components/configurator/AnimationPreviewOverlay.tsx` | **Créer** | Composant overlay + helpers `getAnimationPreview` / `getAnimationFrames` |
| `landing/src/app/[locale]/(configurator)/studio/animation/page.tsx` | **Pas toucher** | Importe déjà tout correctement |

---

## Task 1 : Helpers `getAnimationPreview` et `getAnimationFrames`

**Files:**
- Create: `landing/src/components/configurator/AnimationPreviewOverlay.tsx`

Ces deux helpers sont importés par la page. Ils doivent être présents dès le début.

**Convention assets:**
```
/videos/animation/{category}/{variant}/preview/animation-{category}-{variant}-preview.png
/videos/animation/{category}/{variant}/desktop/animation-{category}-{variant}-desktop.webp  (image animée)
/videos/animation/{category}/{variant}/mobile/animation-{category}-{variant}-mobile.mp4
```

Mapping `animationId → {category, variant}` :
- `envelope-classic` → `envelop/classic`
- `envelope-kraft`   → `envelop/kraft`
- `envelope-luxury`  → `envelop/luxury`
- `envelope-vintage` → `envelop/vintage`
- `door-royal`       → `doors/royal`
- `door-floral`      → `doors/floral`
- `door-classic`     → `doors/classic`
- `door-authentic`   → `doors/authentic`
- `door-modern`      → `doors/modern`
- `curtain-velvet`   → `curtain/velvet`
- `curtain-linen`    → `curtain/linen`
- `curtain-silk`     → `curtain/silk`
- `book-leather`     → `book/leather`
- `book-floral`      → `book/floral`
- `book-modern`      → `book/modern`
- `floral-roses`     → `floral/roses`
- `floral-wildflower`→ `floral/wildflower`
- `floral-peony`     → `floral/peony`

- [ ] **Step 1 : Créer le fichier avec les helpers**

```tsx
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, Check, Monitor, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Asset path helpers ────────────────────────────────────────────────────────

const ANIMATION_ASSET_MAP: Record<string, { category: string; variant: string }> = {
  "envelope-classic":   { category: "envelop",  variant: "classic"     },
  "envelope-kraft":     { category: "envelop",  variant: "kraft"       },
  "envelope-luxury":    { category: "envelop",  variant: "luxury"      },
  "envelope-vintage":   { category: "envelop",  variant: "vintage"     },
  "door-royal":         { category: "doors",    variant: "royal"       },
  "door-floral":        { category: "doors",    variant: "floral"      },
  "door-classic":       { category: "doors",    variant: "classic"     },
  "door-authentic":     { category: "doors",    variant: "authentic"   },
  "door-modern":        { category: "doors",    variant: "modern"      },
  "curtain-velvet":     { category: "curtain",  variant: "velvet"      },
  "curtain-linen":      { category: "curtain",  variant: "linen"       },
  "curtain-silk":       { category: "curtain",  variant: "silk"        },
  "book-leather":       { category: "book",     variant: "leather"     },
  "book-floral":        { category: "book",     variant: "floral"      },
  "book-modern":        { category: "book",     variant: "modern"      },
  "floral-roses":       { category: "floral",   variant: "roses"       },
  "floral-wildflower":  { category: "floral",   variant: "wildflower"  },
  "floral-peony":       { category: "floral",   variant: "peony"       },
};

function assetBase(animationId: string): string | null {
  const entry = ANIMATION_ASSET_MAP[animationId];
  if (!entry) return null;
  return `/videos/animation/${entry.category}/${entry.variant}`;
}

/** Returns the static preview image path (PNG) or null if not mapped. */
export function getAnimationPreview(animationId: string): string | null {
  const base = assetBase(animationId);
  if (!base) return null;
  const { category, variant } = ANIMATION_ASSET_MAP[animationId];
  return `${base}/preview/animation-${category}-${variant}-preview.png`;
}

/**
 * Returns frame paths for canvas animation (desktop webp sequence).
 * For now we only have single-file animated webp, so frames = [path] length 1.
 * Returns frames: [] when no asset exists (triggers "bientôt" placeholder).
 */
export function getAnimationFrames(animationId: string): { frames: string[]; fps: number } {
  const base = assetBase(animationId);
  if (!base) return { frames: [], fps: 24 };
  const { category, variant } = ANIMATION_ASSET_MAP[animationId];
  return {
    frames: [`${base}/desktop/animation-${category}-${variant}-desktop.webp`],
    fps: 24,
  };
}

/** Returns the mobile mp4 path or null. */
function getMobileVideo(animationId: string): string | null {
  const base = assetBase(animationId);
  if (!base) return null;
  const { category, variant } = ANIMATION_ASSET_MAP[animationId];
  return `${base}/mobile/animation-${category}-${variant}-mobile.mp4`;
}

/** Returns the desktop animated-webp path or null. */
function getDesktopWebp(animationId: string): string | null {
  const base = assetBase(animationId);
  if (!base) return null;
  const { category, variant } = ANIMATION_ASSET_MAP[animationId];
  return `${base}/desktop/animation-${category}-${variant}-desktop.webp`;
}
```

- [ ] **Step 2 : Vérifier que le fichier compile (pas encore de composant JSX, juste les exports)**

```bash
cd /path/to/project/landing && npx tsc --noEmit --project tsconfig.json 2>&1 | head -20
```

Attendu : erreur sur `AnimationPreviewOverlay` non exporté (normal, pas encore écrit). Pas d'erreur sur les helpers.

---

## Task 2 : Composant `AnimationPreviewOverlay` — structure et props

**Files:**
- Modify: `landing/src/components/configurator/AnimationPreviewOverlay.tsx`

- [ ] **Step 1 : Ajouter l'interface et le composant vide**

Après les helpers dans le même fichier, ajouter :

```tsx
// ── Component ─────────────────────────────────────────────────────────────────

export interface AnimationPreviewOverlayProps {
  animationId: string;
  animationName: string;               // ex: "Porte — Florale"
  initialDevice?: "mobile" | "desktop";
  onClose: () => void;
  onSelect: () => void;
}

export function AnimationPreviewOverlay({
  animationId,
  animationName,
  initialDevice = "desktop",
  onClose,
  onSelect,
}: AnimationPreviewOverlayProps) {
  const [device, setDevice] = useState<"mobile" | "desktop">(initialDevice);

  const mobileVideo  = getMobileVideo(animationId);
  const desktopWebp  = getDesktopWebp(animationId);

  // Lock body scroll while overlay is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleSelect = () => {
    onSelect();
    onClose();
  };

  return null; // placeholder — remplacé dans Task 3
}
```

- [ ] **Step 2 : Vérifier la compilation**

```bash
cd landing && npx tsc --noEmit 2>&1 | head -20
```

Attendu : 0 erreur.

---

## Task 3 : Layout mobile — Bottom Sheet

**Files:**
- Modify: `landing/src/components/configurator/AnimationPreviewOverlay.tsx`

Remplacer `return null;` par le JSX complet. Le composant détecte le contexte responsive via CSS (Tailwind `md:hidden` / `hidden md:flex`) — pas de JS media-query.

- [ ] **Step 1 : Implémenter le JSX**

```tsx
  return (
    <>
      {/* ── MOBILE : Bottom Sheet ────────────────────────────────────── */}
      <div className="md:hidden fixed inset-0 z-[9999]">
        {/* Scrim */}
        <motion.div
          className="absolute inset-0 bg-foreground/30 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Sheet */}
        <motion.div
          className="absolute bottom-0 inset-x-0 bg-card rounded-t-[24px] overflow-hidden shadow-[0_-8px_32px_rgba(0,0,0,0.08)]"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-9 h-1 rounded-full bg-border" />
          </div>

          {/* Header */}
          <div className="flex items-center px-4 py-2 gap-3">
            <span className="flex-1 text-[15px] font-bold truncate">{animationName}</span>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
              aria-label="Fermer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Device pills */}
          <div className="flex gap-2 px-4 pb-3">
            <button
              onClick={() => setDevice("mobile")}
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-[12px] font-semibold transition-all",
                device === "mobile"
                  ? "bg-foreground border-foreground text-background"
                  : "bg-card border-border text-muted-foreground",
              )}
            >
              <Smartphone className="w-3 h-3" />
              Mobile
            </button>
            <button
              onClick={() => setDevice("desktop")}
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-[12px] font-semibold transition-all",
                device === "desktop"
                  ? "bg-foreground border-foreground text-background"
                  : "bg-card border-border text-muted-foreground",
              )}
            >
              <Monitor className="w-3.5 h-3.5" />
              Desktop
            </button>
          </div>

          {/* Preview area */}
          <div className="mx-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={device}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className={cn(
                  "w-full rounded-xl bg-muted overflow-hidden flex items-center justify-center",
                  device === "mobile" ? "aspect-[9/14]" : "aspect-[16/9]",
                )}
              >
                {device === "mobile" && mobileVideo ? (
                  <video
                    key={mobileVideo}
                    src={mobileVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : device === "desktop" && desktopWebp ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={desktopWebp}
                    alt={animationName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 opacity-30">
                    <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center">
                      <svg className="w-4 h-4 text-foreground" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
                    </div>
                    <span className="text-[10px] text-muted-foreground">Bientôt disponible</span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex gap-2 px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-5 py-3 rounded-full border border-border text-[13px] font-bold text-muted-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
              Retour
            </button>
            <button
              onClick={handleSelect}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-full bg-primary text-primary-foreground text-[13px] font-bold"
            >
              <Check className="w-4 h-4" />
              Choisir cette animation
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
```

- [ ] **Step 2 : Vérifier la compilation**

```bash
cd landing && npx tsc --noEmit 2>&1 | head -20
```

Attendu : 0 erreur.

- [ ] **Step 3 : Commit partiel**

```bash
git add landing/src/components/configurator/AnimationPreviewOverlay.tsx
git commit -m "feat: add AnimationPreviewOverlay helpers and mobile bottom sheet"
```

---

## Task 4 : Layout desktop — Modal plein-format

**Files:**
- Modify: `landing/src/components/configurator/AnimationPreviewOverlay.tsx`

Ajouter le layout desktop **à l'intérieur du même fragment**, après le `</div>` du bloc mobile.

- [ ] **Step 1 : Ajouter le JSX desktop**

Remplacer la ligne `    </>` finale par :

```tsx
      {/* ── DESKTOP : Modal centrée ──────────────────────────────────── */}
      <div className="hidden md:flex fixed inset-0 z-[9999] items-center justify-center p-8">
        {/* Scrim */}
        <motion.div
          className="absolute inset-0 bg-foreground/20 backdrop-blur-[3px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="relative bg-card rounded-[20px] border border-border shadow-[0_24px_64px_rgba(0,0,0,0.12)] overflow-hidden w-full max-w-3xl"
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border/60">
            <span className="flex-1 text-[16px] font-bold">{animationName}</span>

            {/* Device toggle */}
            <div className="flex bg-muted rounded-[10px] p-[3px] gap-0.5">
              <button
                onClick={() => setDevice("desktop")}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] text-[12px] font-semibold transition-all",
                  device === "desktop"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground",
                )}
              >
                <Monitor className="w-3.5 h-3.5" />
                Desktop
              </button>
              <button
                onClick={() => setDevice("mobile")}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] text-[12px] font-semibold transition-all",
                  device === "mobile"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground",
                )}
              >
                <Smartphone className="w-3 h-3" />
                Mobile
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-border transition-colors"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Video zone — plein format, pas de fiche */}
          <AnimatePresence mode="wait">
            <motion.div
              key={device}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "w-full bg-muted flex items-center justify-center overflow-hidden",
                device === "desktop" ? "aspect-[16/9]" : "aspect-[unset]",
              )}
              style={device === "mobile" ? { height: 480 } : undefined}
            >
              {device === "mobile" && mobileVideo ? (
                <video
                  key={mobileVideo}
                  src={mobileVideo}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="h-full w-auto object-cover rounded"
                  style={{ aspectRatio: "9/16" }}
                />
              ) : device === "desktop" && desktopWebp ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={desktopWebp}
                  alt={animationName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 opacity-30">
                  <div className="w-12 h-12 rounded-full bg-foreground/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-foreground" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Bientôt disponible</span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Footer */}
          <div className="flex items-center gap-3 px-5 py-4 border-t border-border/60">
            <span className="flex-1 text-[13px] text-muted-foreground">
              Animation : <strong className="text-foreground font-bold">{animationName}</strong>
            </span>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-border text-[13px] font-bold text-muted-foreground hover:border-foreground/30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Retour
            </button>
            <button
              onClick={handleSelect}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-[13px] font-bold"
            >
              <Check className="w-4 h-4" />
              Choisir cette animation
            </button>
          </div>
        </motion.div>
      </div>

    </>
  );
```

- [ ] **Step 2 : Vérifier la compilation**

```bash
cd landing && npx tsc --noEmit 2>&1 | head -20
```

Attendu : 0 erreur.

- [ ] **Step 3 : Commit**

```bash
git add landing/src/components/configurator/AnimationPreviewOverlay.tsx
git commit -m "feat: add desktop modal layout to AnimationPreviewOverlay"
```

---

## Task 5 : Test visuel dans le navigateur

**Files:**
- Aucun fichier modifié — vérification uniquement

- [ ] **Step 1 : Lancer le dev server**

```bash
cd landing && npm run dev
```

Ouvrir `http://localhost:3002/fr/studio/animation`

- [ ] **Step 2 : Checklist mobile (DevTools → iPhone 14 Pro)**

- [ ] Bottom sheet monte depuis le bas
- [ ] Drag handle visible
- [ ] Pills "Mobile" / "Desktop" switchent l'aspect-ratio de la preview
- [ ] Sur `door-floral` → Mobile : `<video>` joue le mp4 ; Desktop : `<img>` affiche le webp
- [ ] Sur `envelope-classic` (asset absent) → placeholder "Bientôt disponible"
- [ ] Bouton "Retour" ferme sans sélectionner
- [ ] Bouton "Choisir" sélectionne et ferme
- [ ] Scroll de la page bloqué pendant l'overlay
- [ ] Clic sur le scrim ferme l'overlay

- [ ] **Step 3 : Checklist desktop (≥ 768px)**

- [ ] Modal centré avec scrim derrière
- [ ] Toggle "Desktop / Mobile" dans le header
- [ ] Desktop → aspect 16/9 plein format
- [ ] Mobile → vidéo 9/16 centrée (hauteur fixe 480px)
- [ ] Bouton "Retour" + "Choisir" dans le footer
- [ ] Clic scrim ferme

- [ ] **Step 4 : Commit final**

```bash
git add -p
git commit -m "feat: AnimationPreviewOverlay complete — mobile bottom sheet + desktop modal"
```

---

## Notes d'implémentation

**Assets manquants :** La plupart des variants n'ont pas encore d'assets. `getAnimationPreview` retourne un chemin valide même si le fichier n'existe pas encore — Next.js renverra 404 silencieux. Le placeholder "Bientôt disponible" s'affiche automatiquement si `mobileVideo` ou `desktopWebp` est `null`.

**`getAnimationFrames` :** Retourne un tableau avec le webp desktop pour que `AnimationCard` (canvas hover) fonctionne. Comme c'est un webp animé (pas une séquence de frames numérotées), `frames.length === 1` donc `hasAnimation` sera `false` dans `AnimationCard` — ce qui est correct pour l'instant.

**`initialDevice` :** La page passe `defaultDevice` calculé depuis `window.innerWidth` — c'est le device affiché par défaut à l'ouverture de l'overlay.
