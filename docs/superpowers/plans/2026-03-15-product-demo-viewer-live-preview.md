# ProductDemoViewer — Live Preview Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implémenter la prévisualisation en direct des invitations de mariage dans le `ProductDemoViewer` via une iframe unique par animation + postMessage pour le changement de thème instantané.

**Architecture:**
- 1 iframe vivante par animation (3 weddingCodes démo en BDD), changement d'animation = nouveau `src` iframe
- Changement de thème = `postMessage { type: 'SET_THEME', theme }` → changement CSS instantané sans reload
- Changement de device = CSS uniquement sur le container, iframe ne bouge pas
- Mode `?demo=true` sur la page invitation : skip GuestCodeGate, bloque soumission RSVP, écoute postMessage

**Tech Stack:** Next.js App Router, Supabase (supabase-admin), TypeScript, Tailwind CSS, framer-motion, canvas API (image sequence hero)

---

## Chunk 1: Foundation — Migration SQL + données démo

### Task 1: Migration SQL — 3 mariages démo en BDD

**Files:**
- Create: `supabase/migrations/20260315100000_demo_weddings.sql`

**Contexte:** On crée 3 auth users démo, leurs profils, weddings, sites et settings. Un par animation (enveloppe, portes, rideaux). Les sites auront les modules démo activés : countdown, timeline, menu, gallery, rsvp.

- [ ] **Step 1: Créer la migration SQL**

```sql
-- supabase/migrations/20260315100000_demo_weddings.sql
-- Demo weddings — one per animation type
-- These are read-only demo entries used by ProductDemoViewer

DO $$
DECLARE
  uid_envelope  uuid := '00000000-0000-0000-0000-000000000001';
  uid_doors     uuid := '00000000-0000-0000-0000-000000000002';
  uid_curtains  uuid := '00000000-0000-0000-0000-000000000003';
  wid_envelope  uuid := gen_random_uuid();
  wid_doors     uuid := gen_random_uuid();
  wid_curtains  uuid := gen_random_uuid();
  sid_envelope  uuid := gen_random_uuid();
  sid_doors     uuid := gen_random_uuid();
  sid_curtains  uuid := gen_random_uuid();
BEGIN

  -- ── Profiles ──────────────────────────────────────────────────────────────
  INSERT INTO profiles (id, first_name, last_name, email)
  VALUES
    (uid_envelope, 'Sophie',  'Martin',   'demo-envelope@thestudio.wedding'),
    (uid_doors,    'Camille', 'Dupont',   'demo-doors@thestudio.wedding'),
    (uid_curtains, 'Léa',     'Bernard',  'demo-curtains@thestudio.wedding')
  ON CONFLICT (id) DO NOTHING;

  -- ── Weddings ──────────────────────────────────────────────────────────────
  INSERT INTO weddings (id, profile_id, partner_name, wedding_date)
  VALUES
    (wid_envelope,  uid_envelope, 'Thomas',  '2026-09-15'),
    (wid_doors,     uid_doors,    'Antoine', '2026-07-20'),
    (wid_curtains,  uid_curtains, 'Hugo',    '2026-08-10')
  ON CONFLICT (id) DO NOTHING;

  -- ── Sites ─────────────────────────────────────────────────────────────────
  -- modules: array of module slugs active on the demo site
  INSERT INTO sites (id, wedding_id, slug, theme_id, plan_id, modules, extras, languages)
  VALUES
    (
      sid_envelope, wid_envelope,
      'demo-envelope',
      'floral',
      'premium',
      '["countdown","timeline","menu","gallery","rsvp"]'::jsonb,
      '{}'::jsonb,
      '["fr"]'
    ),
    (
      sid_doors, wid_doors,
      'demo-doors',
      'floral',
      'premium',
      '["countdown","timeline","menu","gallery","rsvp"]'::jsonb,
      '{}'::jsonb,
      '["fr"]'
    ),
    (
      sid_curtains, wid_curtains,
      'demo-curtains',
      'floral',
      'premium',
      '["countdown","timeline","menu","gallery","rsvp"]'::jsonb,
      '{}'::jsonb,
      '["fr"]'
    )
  ON CONFLICT (id) DO NOTHING;

  -- ── Settings (no guest_code → public access) ──────────────────────────────
  INSERT INTO settings (wedding_id, guest_code)
  VALUES
    (wid_envelope,  NULL),
    (wid_doors,     NULL),
    (wid_curtains,  NULL)
  ON CONFLICT (wedding_id) DO NOTHING;

END $$;
```

- [ ] **Step 2: Appliquer la migration**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie
npx supabase db push
```

Expected: migration applied without errors.

- [ ] **Step 3: Vérifier les slugs en BDD**

```bash
npx supabase db remote commit --dry-run
# ou via Supabase dashboard → Table Editor → sites
# Vérifier que les 3 lignes existent avec slugs demo-envelope, demo-doors, demo-curtains
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260315100000_demo_weddings.sql
git commit -m "feat: add demo wedding data migration for ProductDemoViewer"
```

---

## Chunk 2: Page invitation — mode démo

### Task 2: Détecter `?demo=true` dans `page.tsx` et passer `isDemo` aux composants

**Files:**
- Modify: `landing/src/app/[locale]/invitation/[weddingCode]/page.tsx`

**Contexte:** La page doit lire le searchParam `demo`, skip le GuestCodeGate si `isDemo=true`, et passer `isDemo` à `InvitationPageClient` et `RsvpModule`.

- [ ] **Step 1: Modifier la signature de la page pour lire `searchParams`**

Dans `landing/src/app/[locale]/invitation/[weddingCode]/page.tsx`, modifier l'interface et la fonction :

```typescript
interface InvitationPageProps {
  params: Promise<{
    locale: string;
    weddingCode: string;
  }>;
  searchParams: Promise<{ demo?: string }>;
}

export default async function InvitationPage({ params, searchParams }: InvitationPageProps) {
  const { weddingCode } = await params;
  const { demo } = await searchParams;
  const isDemo = demo === "true";
  // ... reste du code inchangé
```

- [ ] **Step 2: Passer `isDemo` à `InvitationPageClient`**

Remplacer :
```typescript
<InvitationPageClient hasIntro>
```
Par :
```typescript
<InvitationPageClient hasIntro isDemo={isDemo}>
```

- [ ] **Step 3: Skip GuestCodeGate si isDemo**

Remplacer le bloc conditionnel final :
```typescript
  if (guestCode && !isDemo) {
    return (
      <GuestCodeGate weddingCode={guestCode} partnerNames={partnerNames}>
        {invitationContent}
      </GuestCodeGate>
    );
  }

  return invitationContent;
```

- [ ] **Step 4: Passer `isDemo` à `ModuleRenderer`**

```typescript
<ModuleRenderer
  modules={siteConfig.modules}
  weddingId={weddingId}
  siteId={siteConfig.id}
  weddingDate={profile.wedding_date}
  extras={siteConfig.extras}
  partner1={profile.first_name}
  partner2={profile.partner_name || ""}
  isDemo={isDemo}
/>
```

- [ ] **Step 5: Commit**

```bash
git add landing/src/app/[locale]/invitation/[weddingCode]/page.tsx
git commit -m "feat: detect ?demo=true on invitation page, skip GuestCodeGate"
```

---

### Task 3: `RsvpModule` — bloquer la soumission en mode démo

**Files:**
- Modify: `landing/src/components/invitation/RsvpModule.tsx`

- [ ] **Step 1: Ajouter prop `isDemo` à `RsvpModule`**

```typescript
export function RsvpModule({
  weddingId,
  extras,
  config,
  isDemo = false,
}: {
  weddingId: string;
  extras?: { rsvp_deadline?: string };
  config?: Record<string, any> | null;
  isDemo?: boolean;
}) {
```

- [ ] **Step 2: Bloquer `handleSubmit` si isDemo**

Au début de `handleSubmit` :
```typescript
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemo) return; // no-op in demo mode
    setStatus("submitting");
    // ...
```

- [ ] **Step 3: Afficher un badge visuel "Aperçu" sur le bouton submit en mode démo**

Trouver le bouton submit dans `RsvpModule` et ajouter l'indicateur :
```typescript
// Sur le bouton de soumission, si isDemo :
<button
  type="submit"
  disabled={isDemo}
  className={cn(
    "...", // classes existantes
    isDemo && "opacity-60 cursor-not-allowed"
  )}
>
  {isDemo ? "Aperçu uniquement" : "Envoyer ma réponse"}
</button>
```

- [ ] **Step 4: Commit**

```bash
git add landing/src/components/invitation/RsvpModule.tsx
git commit -m "feat: add isDemo prop to RsvpModule, block submission in demo mode"
```

---

### Task 4: `ModuleRenderer` — propager `isDemo` à `RsvpModule`

**Files:**
- Modify: `landing/src/components/invitation/ModuleRenderer.tsx`

- [ ] **Step 1: Lire le fichier ModuleRenderer**

```bash
cat landing/src/components/invitation/ModuleRenderer.tsx
```

- [ ] **Step 2: Ajouter `isDemo` aux props de `ModuleRenderer` et le passer à `RsvpModule`**

```typescript
// Ajouter dans les props
isDemo?: boolean;

// Dans le rendu du module rsvp
case "rsvp":
  return <RsvpModule weddingId={weddingId} extras={extras} config={module.config} isDemo={isDemo} />;
```

- [ ] **Step 3: Commit**

```bash
git add landing/src/components/invitation/ModuleRenderer.tsx
git commit -m "feat: propagate isDemo to RsvpModule via ModuleRenderer"
```

---

### Task 5: `InvitationPageClient` — postMessage listener + thème dynamique

**Files:**
- Modify: `landing/src/components/invitation/InvitationPageClient.tsx`

**Contexte:** En mode démo, le composant écoute les messages `SET_THEME` venant du parent (ProductDemoViewer) et met à jour la classe CSS du thème sur le root element. Le thème initial vient du weddingCode en BDD (`floral` par défaut), les switchs suivants viennent de postMessage.

- [ ] **Step 1: Ajouter les props `isDemo` et `initialTheme`**

```typescript
interface InvitationPageClientProps {
  children: React.ReactNode;
  hasIntro?: boolean;
  isDemo?: boolean;
  initialTheme?: string;
}

export function InvitationPageClient({
  children,
  hasIntro = true,
  isDemo = false,
  initialTheme = "floral",
}: InvitationPageClientProps) {
  const [introDone, setIntroDone] = useState(!hasIntro);
  const [activeTheme, setActiveTheme] = useState(initialTheme);
```

- [ ] **Step 2: Ajouter le listener postMessage**

```typescript
  useEffect(() => {
    if (!isDemo) return;
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "SET_THEME" && typeof e.data.theme === "string") {
        setActiveTheme(e.data.theme);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [isDemo]);
```

- [ ] **Step 3: Envelopper `children` avec la classe de thème dynamique**

```typescript
  return (
    <>
      <AnimatePresence>
        {hasIntro && !introDone && (
          <InvitationIntro onComplete={() => setIntroDone(true)} />
        )}
      </AnimatePresence>

      <motion.div
        initial={hasIntro ? { opacity: 0 } : false}
        animate={{ opacity: introDone ? 1 : 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ pointerEvents: introDone ? "auto" : "none", visibility: introDone ? "visible" : "hidden" }}
        className={`theme-${activeTheme}`}
      >
        {children}
      </motion.div>
    </>
  );
```

**Note:** La classe `theme-${themeId}` était sur le `<div>` dans `page.tsx`. On la déplace ici pour qu'elle soit contrôlable dynamiquement. Il faudra retirer la classe du div dans `page.tsx` (voir Task 6).

- [ ] **Step 4: Commit**

```bash
git add landing/src/components/invitation/InvitationPageClient.tsx
git commit -m "feat: add postMessage theme listener to InvitationPageClient for demo mode"
```

---

### Task 6: Retirer `themeClass` du `div` dans `page.tsx`

**Files:**
- Modify: `landing/src/app/[locale]/invitation/[weddingCode]/page.tsx`

**Contexte:** Maintenant que `InvitationPageClient` gère la classe de thème, on la retire du `div` interne pour éviter la duplication. On passe `initialTheme` à `InvitationPageClient`.

- [ ] **Step 1: Passer `initialTheme` à `InvitationPageClient`**

```typescript
<InvitationPageClient hasIntro isDemo={isDemo} initialTheme={siteConfig.theme_id}>
```

- [ ] **Step 2: Retirer `themeClass` du div interne**

Remplacer :
```typescript
<div className={`${themeClass} min-h-screen bg-background text-foreground font-sans`}>
```
Par :
```typescript
<div className="min-h-screen bg-background text-foreground font-sans">
```

Et supprimer les lignes qui construisent `themeClass` (elles ne servent plus).

- [ ] **Step 3: Vérifier visuellement que le thème s'applique toujours correctement**

```bash
npm run dev:landing
# Ouvrir http://localhost:3002/fr/invitation/demo-envelope
# Vérifier que le thème floral est bien appliqué
```

- [ ] **Step 4: Commit**

```bash
git add landing/src/app/[locale]/invitation/[weddingCode]/page.tsx
git commit -m "refactor: move theme class to InvitationPageClient for dynamic postMessage control"
```

---

## Chunk 3: Hero — HeroBackground image sequence

### Task 7: Créer `HeroBackground` — composant image sequence avec fallback

**Files:**
- Create: `landing/src/components/invitation/HeroBackground.tsx`

**Contexte:** Le Hero de la page invitation a actuellement un background image Unsplash hardcodé. On crée un composant `HeroBackground` qui joue une image sequence webp en loop (mode démo / mode vidéo) ou affiche une photo statique (fallback). En mode démo, la séquence loope doucement en ambiance. Le composant reçoit les assets via props.

Structure des assets (par thème) :
```
/videos/demo/themes/test/Bohemian Bird Video_000.webp  (boho, 82 frames)
/videos/demo/themes/floral/...  (à venir)
```

- [ ] **Step 1: Créer `HeroBackground.tsx`**

```typescript
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface HeroBackgroundProps {
  /** Nombre de frames dans la séquence (0 = pas de séquence, affiche fallback) */
  frames: number;
  /** Chemin de base de la séquence, sans l'index ni l'extension. Ex: "/videos/demo/themes/test/Bohemian Bird Video_" */
  sequencePath: string | null;
  /** URL de la photo de fallback si pas de séquence */
  fallbackUrl?: string;
  /** Si true, joue en loop infinie lente (mode démo ambiance). Si false, joue une fois. */
  loop?: boolean;
}

const DEFAULT_FALLBACK =
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=2000";

/** Durée entre chaque frame en ms pour le mode loop ambiance (très lent = cinématique) */
const LOOP_FRAME_DURATION = 80; // ~12fps pour effet doux

function getFrameSrc(basePath: string, index: number): string {
  return `${basePath}${String(index).padStart(3, "0")}.webp`;
}

export function HeroBackground({
  frames,
  sequencePath,
  fallbackUrl = DEFAULT_FALLBACK,
  loop = false,
}: HeroBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const rafRef = useRef<number | null>(null);
  const [ready, setReady] = useState(false);

  const drawFrame = useCallback((index: number) => {
    const canvas = canvasRef.current;
    const img = framesRef.current[index];
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: cw, height: ch } = canvas;
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const sw = img.naturalWidth * scale;
    const sh = img.naturalHeight * scale;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, (cw - sw) / 2, (ch - sh) / 2, sw, sh);
  }, []);

  useEffect(() => {
    if (!sequencePath || frames === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth || window.innerWidth;
    canvas.height = canvas.offsetHeight || window.innerHeight;

    // Preload all frames
    let loaded = 0;
    for (let i = 0; i < frames; i++) {
      const img = new Image();
      const idx = i;
      img.onload = () => {
        framesRef.current[idx] = img;
        loaded++;
        if (loaded === 1) {
          // Draw first frame immediately
          drawFrame(0);
          setReady(true);
        }
        if (loaded === frames && loop) {
          startLoop();
        }
      };
      img.onerror = () => { loaded++; };
      img.src = getFrameSrc(sequencePath, i);
    }

    let currentFrame = 0;
    let lastTime = 0;

    function startLoop() {
      const tick = (now: number) => {
        if (lastTime === 0) lastTime = now;
        if (now - lastTime >= LOOP_FRAME_DURATION) {
          if (framesRef.current[currentFrame]) {
            drawFrame(currentFrame);
          }
          lastTime = now;
          currentFrame = (currentFrame + 1) % frames;
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      framesRef.current = [];
    };
  }, [sequencePath, frames, loop, drawFrame]);

  // Fallback: static image
  if (!sequencePath || frames === 0) {
    return (
      <div
        className="absolute inset-0 bg-cover bg-center z-0 scale-105"
        style={{ backgroundImage: `url('${fallbackUrl}')` }}
      />
    );
  }

  return (
    <>
      {/* Fallback visible until canvas is ready */}
      {!ready && (
        <div
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{ backgroundImage: `url('${fallbackUrl}')` }}
        />
      )}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{ opacity: ready ? 1 : 0, transition: "opacity 0.3s ease" }}
      />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add landing/src/components/invitation/HeroBackground.tsx
git commit -m "feat: create HeroBackground component with image sequence and fallback"
```

---

### Task 8: Intégrer `HeroBackground` dans `page.tsx` + support postMessage hero

**Files:**
- Modify: `landing/src/app/[locale]/invitation/[weddingCode]/page.tsx`
- Modify: `landing/src/components/invitation/InvitationPageClient.tsx`

**Contexte:** Le hero dans `page.tsx` a un background hardcodé. On le remplace par `HeroBackground`. En mode démo, le background change quand le thème change (via postMessage `SET_THEME` qui inclut aussi les infos d'asset hero).

**Note importante:** `HeroBackground` est un Client Component (canvas). Le hero dans `page.tsx` est un Server Component. On doit donc extraire le hero dans un composant séparé ou utiliser `InvitationPageClient` pour passer les hero assets via state.

**Approche:** `InvitationPageClient` maintient un state `heroAsset` (mis à jour par postMessage). Il passe cet asset via React context ou via cloneElement. La solution la plus simple : extraire le hero dans un nouveau `InvitationHero` Client Component qui reçoit ses props depuis `InvitationPageClient` via un Context.

- [ ] **Step 1: Créer `InvitationDemoContext.tsx`**

```typescript
// landing/src/components/invitation/InvitationDemoContext.tsx
"use client";

import { createContext, useContext } from "react";

interface HeroAsset {
  frames: number;
  sequencePath: string | null;
}

interface DemoContextValue {
  isDemo: boolean;
  activeTheme: string;
  heroAsset: HeroAsset;
}

export const InvitationDemoContext = createContext<DemoContextValue>({
  isDemo: false,
  activeTheme: "floral",
  heroAsset: { frames: 0, sequencePath: null },
});

export function useInvitationDemo() {
  return useContext(InvitationDemoContext);
}
```

- [ ] **Step 2: Mettre à jour `InvitationPageClient` pour exposer le context**

Importer et utiliser `InvitationDemoContext.Provider` :

```typescript
import { InvitationDemoContext } from "./InvitationDemoContext";

// Dans le state, ajouter heroAsset :
const [heroAsset, setHeroAsset] = useState<{ frames: number; sequencePath: string | null }>({
  frames: 0,
  sequencePath: null,
});

// Dans le listener postMessage, aussi mettre à jour heroAsset :
if (e.data?.type === "SET_THEME") {
  if (typeof e.data.theme === "string") setActiveTheme(e.data.theme);
  if (e.data.heroAsset) setHeroAsset(e.data.heroAsset);
}

// Envelopper le return avec le Provider :
return (
  <InvitationDemoContext.Provider value={{ isDemo, activeTheme, heroAsset }}>
    <>
      {/* ... AnimatePresence + motion.div existants */}
    </>
  </InvitationDemoContext.Provider>
);
```

- [ ] **Step 3: Créer `InvitationHero.tsx` — hero avec HeroBackground dynamique**

```typescript
// landing/src/components/invitation/InvitationHero.tsx
"use client";

import { useInvitationDemo } from "./InvitationDemoContext";
import { HeroBackground } from "./HeroBackground";
import { ScrollToModules } from "./ScrollToModules";

interface InvitationHeroProps {
  firstName: string;
  partnerName: string;
  weddingDate: string | null;
  defaultFallbackUrl?: string;
}

const DEFAULT_FALLBACK =
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=2000";

export function InvitationHero({
  firstName,
  partnerName,
  weddingDate,
  defaultFallbackUrl = DEFAULT_FALLBACK,
}: InvitationHeroProps) {
  const { isDemo, heroAsset } = useInvitationDemo();

  return (
    <header className="relative h-[100svh] flex items-center justify-center overflow-hidden">
      <HeroBackground
        frames={isDemo ? heroAsset.frames : 0}
        sequencePath={isDemo ? heroAsset.sequencePath : null}
        fallbackUrl={defaultFallbackUrl}
        loop={isDemo}
      />
      <div className="absolute inset-0 bg-black/30 z-0" />
      <div className="relative z-10 text-center space-y-6 px-4 text-white">
        <h4 className="uppercase tracking-widest text-sm font-bold text-white/80 mb-4">
          Nous nous marions
        </h4>
        <h1 className="font-heading text-6xl md:text-8xl italic drop-shadow-lg">
          {firstName} <span className="text-primary/70">&</span> {partnerName}
        </h1>
        {weddingDate && (
          <p className="text-xl md:text-2xl font-light mt-4 text-white/90 drop-shadow-md">
            {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(
              new Date(weddingDate)
            )}
          </p>
        )}
      </div>
      <ScrollToModules />
    </header>
  );
}
```

- [ ] **Step 4: Remplacer le hero inline dans `page.tsx` par `<InvitationHero />`**

```typescript
import { InvitationHero } from "@/components/invitation/InvitationHero";

// Remplacer tout le bloc <header>...</header> par :
<InvitationHero
  firstName={profile.first_name}
  partnerName={profile.partner_name}
  weddingDate={profile.wedding_date}
/>
```

- [ ] **Step 5: Tester visuellement**

```bash
npm run dev:landing
# Ouvrir http://localhost:3002/fr/invitation/demo-envelope
# Vérifier que le hero s'affiche avec la photo fallback Unsplash
# Ouvrir http://localhost:3002/fr/invitation/demo-envelope?demo=true
# Vérifier que le hero s'affiche identiquement (pas de canvas, heroAsset vide au départ)
```

- [ ] **Step 6: Commit**

```bash
git add landing/src/components/invitation/InvitationDemoContext.tsx
git add landing/src/components/invitation/HeroBackground.tsx
git add landing/src/components/invitation/InvitationHero.tsx
git add landing/src/components/invitation/InvitationPageClient.tsx
git add landing/src/app/[locale]/invitation/[weddingCode]/page.tsx
git commit -m "feat: extract InvitationHero with dynamic HeroBackground, wire demo context"
```

---

## Chunk 4: ProductDemoViewer — brancher l'iframe + postMessage

### Task 9: Mettre à jour `ProductDemoViewer` avec les vrais weddingCodes et postMessage

**Files:**
- Modify: `landing/src/components/landing/product-demo-viewer.tsx`

**Contexte:** Remplacer la structure `DEMO_URLS[animation][theme]` par `DEMO_CODES[animation]` (un slug par animation). Le thème se gère par postMessage vers l'iframe. Les hero assets sont définis statiquement par thème.

- [ ] **Step 1: Remplacer la structure de données**

```typescript
// Remplacer DEMO_URLS par :

const DEMO_CODES: Record<AnimationKey, string> = {
  envelope: "demo-envelope",
  doors:    "demo-doors",
  curtains: "demo-curtains",
};

type HeroAsset = {
  frames: number;
  sequencePath: string | null;
};

const THEME_HERO_ASSETS: Record<ThemeKey, HeroAsset> = {
  boho:       { frames: 82, sequencePath: "/videos/demo/themes/test/Bohemian Bird Video_" },
  floral:     { frames: 0,  sequencePath: null },
  royal:      { frames: 0,  sequencePath: null },
  minimalist: { frames: 0,  sequencePath: null },
  modern:     { frames: 0,  sequencePath: null },
};
```

- [ ] **Step 2: Ajouter ref sur l'iframe et construire l'URL**

```typescript
import { useRef, useEffect, useRef, useState, useCallback } from "react";

// Dans le composant :
const iframeRef = useRef<HTMLIFrameElement>(null);

// URL de l'iframe active
const iframeUrl = `/fr/invitation/${DEMO_CODES[activeAnimation]}?demo=true`;
```

- [ ] **Step 3: Envoyer postMessage quand le thème change**

```typescript
// Fonction pour envoyer le thème à l'iframe
const sendTheme = useCallback((theme: ThemeKey) => {
  const iframe = iframeRef.current;
  if (!iframe?.contentWindow) return;
  iframe.contentWindow.postMessage(
    {
      type: "SET_THEME",
      theme,
      heroAsset: THEME_HERO_ASSETS[theme],
    },
    "*"
  );
}, []);

// Quand le thème change (useEffect) :
useEffect(() => {
  // Delay pour laisser le temps à l'iframe de charger si c'est un nouveau src
  const timeout = setTimeout(() => sendTheme(activeTheme), 300);
  return () => clearTimeout(timeout);
}, [activeTheme, activeAnimation, sendTheme]);
```

**Note:** On envoie le thème à chaque changement d'animation aussi (après un délai) pour que le nouvel iframe reçoive bien le thème courant une fois chargé.

- [ ] **Step 4: Remplacer les composants `MobileFrame` et `DesktopFrame` pour utiliser une seule iframe ref**

Modifier `MobileFrame` et `DesktopFrame` pour accepter `iframeRef` et `iframeUrl` au lieu de `url`:

```typescript
function MobileFrame({
  iframeUrl,
  iframeRef,
  theme,
}: {
  iframeUrl: string;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  theme: string;
}) {
  return (
    <div className="flex justify-center">
      <div className="relative" style={{ /* styles existants */ }}>
        {/* ... boutons et notch existants */}
        <div className="rounded-[32px] overflow-hidden h-[560px] bg-background relative">
          <iframe
            ref={iframeRef}
            src={iframeUrl}
            className="w-full h-full border-none block"
            title={`Démo ${theme}`}
          />
        </div>
      </div>
    </div>
  );
}

// Idem pour DesktopFrame
function DesktopFrame({
  iframeUrl,
  iframeRef,
  theme,
}: {
  iframeUrl: string;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  theme: string;
}) {
  // ... displayUrl construit depuis iframeUrl
  const displayUrl = `thestudio.wedding/invitation/${iframeUrl.split("/invitation/")[1]}`;
  return (
    <div>
      {/* ... browser chrome existant */}
      <div className="rounded-b-[6px] overflow-hidden h-[480px] bg-background relative border border-[#3a3a3c]">
        <iframe
          ref={iframeRef}
          src={iframeUrl}
          className="w-full h-full border-none block"
          title={`Démo ${theme}`}
        />
      </div>
      {/* ... stand existant */}
    </div>
  );
}
```

- [ ] **Step 5: Mettre à jour le render principal**

```typescript
// Dans le render de ProductDemoViewer, remplacer :
{device === "mobile" ? (
  <MobileFrame url={demo.url} couple={demo.couple} theme={THEME_LABELS[activeTheme]} />
) : (
  <DesktopFrame url={demo.url} couple={demo.couple} theme={THEME_LABELS[activeTheme]} />
)}

// Par :
{device === "mobile" ? (
  <MobileFrame iframeUrl={iframeUrl} iframeRef={iframeRef} theme={THEME_LABELS[activeTheme]} />
) : (
  <DesktopFrame iframeUrl={iframeUrl} iframeRef={iframeRef} theme={THEME_LABELS[activeTheme]} />
)}
```

- [ ] **Step 6: Mettre à jour le lien "Ouvrir en plein écran"**

```typescript
// Toujours disponible maintenant (pas de null check)
<div className="flex justify-center mt-5">
  <a
    href={`/fr/invitation/${DEMO_CODES[activeAnimation]}`}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-primary/30 text-primary text-sm font-medium bg-card hover:bg-primary/5 transition-colors shadow-sm"
  >
    {t("openFullscreen")}
    <ExternalLink className="w-3.5 h-3.5" />
  </a>
</div>
```

- [ ] **Step 7: Supprimer `DemoEntry`, `DEMO_URLS`, `Placeholder`**

Ces constructs ne sont plus nécessaires. Les supprimer du fichier.

- [ ] **Step 8: Tester end-to-end**

```bash
npm run dev:landing
# Ouvrir http://localhost:3002/fr
# Naviguer jusqu'à la section ProductDemo
# 1. Vérifier que l'iframe charge /invitation/demo-envelope?demo=true
# 2. Changer de thème → vérifier que la classe CSS change sans reload (pas de flash)
# 3. Changer d'animation → vérifier que l'iframe recharge + InvitationIntro rejoue
# 4. Changer de device → vérifier que l'iframe reste chargée (pas de reload)
# 5. Thème boho → vérifier que le hero passe en image sequence
# 6. Cliquer "Ouvrir en plein écran" → vérifie que ça ouvre sans ?demo=true
```

- [ ] **Step 9: Commit**

```bash
git add landing/src/components/landing/product-demo-viewer.tsx
git commit -m "feat: wire ProductDemoViewer with real demo weddingCodes and postMessage theme switching"
```

---

## Chunk 5: Polissage + edge cases

### Task 10: Loading state de l'iframe dans le viewer

**Files:**
- Modify: `landing/src/components/landing/product-demo-viewer.tsx`

**Contexte:** Quand l'iframe charge (au mount ou changement d'animation), il faut un skeleton/overlay pour éviter le flash blanc.

- [ ] **Step 1: Ajouter state `iframeLoading` et handler `onLoad`**

```typescript
const [iframeLoading, setIframeLoading] = useState(true);

// Reset loading à chaque changement d'animation
useEffect(() => {
  setIframeLoading(true);
}, [activeAnimation]);
```

- [ ] **Step 2: Ajouter overlay de chargement par-dessus l'iframe**

Dans `MobileFrame` et `DesktopFrame`, ajouter un prop `loading` et un overlay :

```typescript
// Dans le container de l'iframe :
<div className="rounded-[32px] overflow-hidden h-[560px] bg-background relative">
  {loading && (
    <div className="absolute inset-0 bg-background z-10 flex items-center justify-center">
      <div className="w-8 h-8 border border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  )}
  <iframe
    ref={iframeRef}
    src={iframeUrl}
    className="w-full h-full border-none block"
    title={`Démo ${theme}`}
    onLoad={() => setIframeLoading(false)} // à passer depuis le parent
  />
</div>
```

- [ ] **Step 3: Commit**

```bash
git add landing/src/components/landing/product-demo-viewer.tsx
git commit -m "feat: add loading overlay to demo iframe while invitation page loads"
```

---

### Task 11: Lint + vérification finale

- [ ] **Step 1: Lancer le lint**

```bash
cd landing && npm run lint
```

Expected: no errors.

- [ ] **Step 2: Vérifier TypeScript**

```bash
cd landing && npx tsc --noEmit
```

Expected: no type errors.

- [ ] **Step 3: Build de vérification**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie && npm run build:landing
```

Expected: build succeeds.

- [ ] **Step 4: Commit final**

```bash
git add -A
git commit -m "chore: final lint and type check for demo viewer live preview"
```

---

## Récapitulatif des fichiers touchés

| Fichier | Action |
|---|---|
| `supabase/migrations/20260315100000_demo_weddings.sql` | Créer |
| `landing/src/app/[locale]/invitation/[weddingCode]/page.tsx` | Modifier |
| `landing/src/components/invitation/InvitationPageClient.tsx` | Modifier |
| `landing/src/components/invitation/InvitationDemoContext.tsx` | Créer |
| `landing/src/components/invitation/HeroBackground.tsx` | Créer |
| `landing/src/components/invitation/InvitationHero.tsx` | Créer |
| `landing/src/components/invitation/RsvpModule.tsx` | Modifier |
| `landing/src/components/invitation/ModuleRenderer.tsx` | Modifier |
| `landing/src/components/landing/product-demo-viewer.tsx` | Modifier |
