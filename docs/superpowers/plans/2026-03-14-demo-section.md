# Demo Section Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new "ProductDemo" section to the landing page, inserted between Hero and HowItWorks, composed of two parts: (1) a narrative 5-step explanation, (2) an interactive demo viewer with theme selector, mobile/desktop device toggle, and iframe embedding of real hosted invitations.

**Architecture:** Two sub-components in `landing/src/components/landing/` — `ProductDemoSteps` (static, server component) and `ProductDemoViewer` (interactive, client component). Both are imported into a parent `ProductDemo` wrapper that is inserted into `page.tsx`. Translations live in all 9 locale JSON files. Demo URLs are driven by a typed config array in the component — no env vars needed until real demos exist.

**Tech Stack:** Next.js App Router, next-intl 4.x, Tailwind CSS, Framer Motion, TypeScript

---

## Chunk 1: Files & Translations

### Task 1: Add translation keys — French

**Files:**
- Modify: `landing/messages/fr.json`

- [ ] **Step 1: Add `ProductDemo` keys to `fr.json`**

Insert after the existing `"DemoSection"` block:

```json
"ProductDemo": {
  "eyebrow": "Découvrez l'expérience",
  "titleLine1": "À quoi ressemble",
  "titleLine2": "une invitation digitale ?",
  "subtitle": "Une invitation interactive à envoyer en un lien. Élégante, personnalisable et instantanée.",
  "createButton": "Créer mon invitation",
  "step1Title": "L'enveloppe qui s'ouvre",
  "step1Desc": "Une animation d'ouverture unique — enveloppe, rideaux, portes. Le premier frisson avant même de lire un mot.",
  "step2Title": "L'invitation révélée",
  "step2Desc": "Votre site dans votre thème personnalisé. Noms, date, lieu — tout votre style, en un regard.",
  "step3Title": "Programme & infos",
  "step3Desc": "Cérémonie, cocktail, dîner — lisible en un scroll, modifiable à tout moment.",
  "step4Title": "Galerie & playlist",
  "step4Desc": "Photos, vidéos, musique — vos invités vivent l'ambiance avant même d'arriver.",
  "step5Title": "RSVP en ligne",
  "step5Desc": "Présence, accompagnants, régimes — tout dans votre tableau de bord en temps réel.",
  "demosEyebrow": "Exemples réels",
  "demosTitleLine1": "Voyez le produit",
  "demosTitleLine2": "en direct",
  "demosSub": "Choisissez un thème et explorez une vraie invitation — comme la vivrait l'un de vos invités.",
  "openFullscreen": "Ouvrir en plein écran",
  "deviceMobile": "Mobile",
  "deviceDesktop": "Desktop"
}
```

- [ ] **Step 2: Add same keys to all other locale files**

Files to update: `en.json`, `de.json`, `es.json`, `pt.json`, `it.json`, `ar.json`, `zh.json`, `ja.json`

For `en.json`:
```json
"ProductDemo": {
  "eyebrow": "Discover the experience",
  "titleLine1": "What does a digital",
  "titleLine2": "invitation look like?",
  "subtitle": "An interactive invitation sent in a single link. Elegant, customizable and instant.",
  "createButton": "Create my invitation",
  "step1Title": "The envelope opens",
  "step1Desc": "A unique opening animation — envelope, curtains, doors. The first thrill before reading a single word.",
  "step2Title": "The invitation revealed",
  "step2Desc": "Your site in your custom theme. Names, date, venue — your entire style at a glance.",
  "step3Title": "Schedule & info",
  "step3Desc": "Ceremony, cocktail, dinner — readable in one scroll, editable at any time.",
  "step4Title": "Gallery & playlist",
  "step4Desc": "Photos, videos, music — your guests feel the atmosphere before they even arrive.",
  "step5Title": "Online RSVP",
  "step5Desc": "Attendance, plus-ones, dietary needs — all in your dashboard in real time.",
  "demosEyebrow": "Real examples",
  "demosTitleLine1": "See the product",
  "demosTitleLine2": "live",
  "demosSub": "Choose a theme and explore a real invitation — exactly as your guests would experience it.",
  "openFullscreen": "Open full screen",
  "deviceMobile": "Mobile",
  "deviceDesktop": "Desktop"
}
```

For all other locales (de, es, pt, it, ar, zh, ja) — copy the French keys verbatim for now (they will be translated later):
```json
"ProductDemo": { ...same as fr.json... }
```

- [ ] **Step 3: Commit**
```bash
git add landing/messages/
git commit -m "feat: add ProductDemo translation keys to all locales"
```

---

## Chunk 2: Steps Sub-Component

### Task 2: Create `ProductDemoSteps` (Server Component)

**Files:**
- Create: `landing/src/components/landing/product-demo-steps.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { ArrowRight } from "lucide-react";

const STEPS = [
  { emoji: "✉️", titleKey: "step1Title", descKey: "step1Desc" },
  { emoji: "💌", titleKey: "step2Title", descKey: "step2Desc" },
  { emoji: "📋", titleKey: "step3Title", descKey: "step3Desc" },
  { emoji: "🖼️", titleKey: "step4Title", descKey: "step4Desc" },
  { emoji: "💬", titleKey: "step5Title", descKey: "step5Desc" },
] as const;

export function ProductDemoSteps() {
  const t = useTranslations("ProductDemo");

  return (
    <div className="flex flex-col md:flex-row gap-12 md:gap-20 items-start max-w-4xl mx-auto">
      {/* Left — sticky header */}
      <div className="flex-1 md:sticky md:top-24">
        <p className="text-xs uppercase tracking-[0.3em] text-primary font-medium mb-3">
          {t("eyebrow")}
        </p>
        <h2 className="font-heading text-4xl md:text-5xl font-medium text-foreground leading-tight mb-4">
          {t("titleLine1")}{" "}
          <span className="italic text-primary">{t("titleLine2")}</span>
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-8 max-w-xs">
          {t("subtitle")}
        </p>
        <Link
          href="/create"
          className="inline-flex items-center gap-3 rounded-full bg-primary px-8 py-3.5 font-heading text-base font-semibold italic text-primary-foreground shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
        >
          {t("createButton")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Right — steps list */}
      <div className="flex-1 flex flex-col">
        {STEPS.map(({ emoji, titleKey, descKey }, i) => (
          <div key={i} className="flex gap-4 px-3 py-4 relative">
            {/* Vertical connector */}
            {i < STEPS.length - 1 && (
              <div className="absolute left-[22px] top-14 bottom-[-8px] w-px bg-gradient-to-b from-border to-transparent" />
            )}
            {/* Icon */}
            <div className="w-9 h-9 rounded-full border border-border bg-background flex items-center justify-center text-base flex-shrink-0 relative z-10 shadow-sm">
              {emoji}
            </div>
            {/* Text */}
            <div className="pt-1">
              <h3 className="font-heading text-lg font-semibold text-foreground mb-1">
                {t(titleKey)}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(descKey)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**
```bash
git add landing/src/components/landing/product-demo-steps.tsx
git commit -m "feat: add ProductDemoSteps server component"
```

---

## Chunk 3: Demo Viewer Sub-Component

### Task 3: Create `ProductDemoViewer` (Client Component)

**Files:**
- Create: `landing/src/components/landing/product-demo-viewer.tsx`

This is the interactive half: theme selector, device toggle, iframe/placeholder display.

- [ ] **Step 1: Create the demo config type and data**

```tsx
"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Monitor, Smartphone, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

type DemoTheme = {
  key: string;
  labelKey: string;        // translation key e.g. "themeFloral" — reuses Catalogue translations
  couple: string;          // displayed couple name
  dotStyle: string;        // inline CSS gradient for the dot
  url: string | null;      // null = not yet live, shows placeholder
};

const DEMO_THEMES: DemoTheme[] = [
  {
    key: "floral",
    labelKey: "Floral",
    couple: "Sophie & Thomas",
    dotStyle: "background: linear-gradient(135deg, #c97a90, #8b2040)",
    url: null, // remplacer par "/invitation/demo-floral" quand la démo existe
  },
  {
    key: "royal",
    labelKey: "Royal",
    couple: "Camille & Antoine",
    dotStyle: "background: linear-gradient(135deg, #c9a96e, #2d3a6b)",
    url: null,
  },
  {
    key: "boho",
    labelKey: "Bohème",
    couple: "Léa & Hugo",
    dotStyle: "background: linear-gradient(135deg, #c4a882, #8b5e3c)",
    url: null,
  },
  {
    key: "minimalist",
    labelKey: "Minimaliste",
    couple: "Marie & Julien",
    dotStyle: "background: linear-gradient(135deg, #999, #222)",
    url: null,
  },
  {
    key: "modern",
    labelKey: "Modern",
    couple: "Clara & Maxime",
    dotStyle: "background: linear-gradient(135deg, #b07acc, #4a1570)",
    url: null,
  },
];
```

- [ ] **Step 2: Add MobileFrame sub-component**

```tsx
function MobileFrame({ url, couple, theme }: { url: string | null; couple: string; theme: string }) {
  return (
    <div className="flex justify-center">
      {/* Phone shell */}
      <div
        className="relative"
        style={{
          background: "#1c1c1e",
          borderRadius: 44,
          padding: "14px 12px 20px",
          width: 300,
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,0.06), 0 0 0 1.5px rgba(0,0,0,0.35), 0 32px 80px rgba(0,0,0,0.28)",
        }}
      >
        {/* Side buttons */}
        <div className="absolute left-[-3px] top-[90px] w-[3px] h-8 rounded-l bg-[#2a2a2c] shadow-[0_38px_0_#2a2a2c,0_76px_0_#2a2a2c]" />
        <div className="absolute right-[-3px] top-[120px] w-[3px] h-[60px] rounded-r bg-[#2a2a2c]" />
        {/* Notch */}
        <div className="w-[88px] h-7 bg-[#1c1c1e] rounded-b-[20px] mx-auto relative z-10 flex items-center justify-center gap-1.5 mb-[-6px]">
          <div className="w-2.5 h-2.5 rounded-full bg-[#2a2a2c] border border-[#333]" />
          <div className="w-9 h-1 bg-[#2a2a2c] rounded" />
        </div>
        {/* Screen */}
        <div className="rounded-[32px] overflow-hidden h-[560px] bg-background relative">
          {url ? (
            <iframe src={url} className="w-full h-full border-none block" title={`Démo ${theme}`} />
          ) : (
            <Placeholder couple={couple} theme={theme} />
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add DesktopFrame sub-component**

```tsx
function DesktopFrame({ url, couple, theme }: { url: string | null; couple: string; theme: string }) {
  const displayUrl = url
    ? `thestudio.wedding${url}`
    : `thestudio.wedding/invitation/demo-${theme.toLowerCase()}`;

  return (
    <div>
      {/* Screen outer */}
      <div
        style={{
          background: "#1c1c1e",
          borderRadius: 12,
          padding: 8,
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,0.06), 0 0 0 1.5px rgba(0,0,0,0.4), 0 24px 60px rgba(0,0,0,0.3)",
        }}
      >
        {/* Menu bar */}
        <div className="h-[22px] bg-[#2a2a2c] rounded-t-[6px] flex items-center px-2.5 gap-1.5 mb-px">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          <div className="flex-1 mx-3 bg-[#3a3a3c] rounded h-3.5 flex items-center px-2">
            <span className="text-[8px] text-white/35 font-mono truncate">{displayUrl}</span>
          </div>
        </div>
        {/* Content */}
        <div className="rounded-b-[6px] overflow-hidden h-[480px] bg-background relative border border-[#3a3a3c]">
          {url ? (
            <iframe src={url} className="w-full h-full border-none block" title={`Démo ${theme}`} />
          ) : (
            <Placeholder couple={couple} theme={theme} />
          )}
        </div>
      </div>
      {/* Neck + foot */}
      <div
        className="mx-auto"
        style={{
          width: 120,
          height: 18,
          background: "linear-gradient(180deg, #3a3a3c, #2a2a2c)",
          clipPath: "polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)",
        }}
      />
      <div
        className="mx-auto"
        style={{
          width: 320,
          height: 8,
          background: "linear-gradient(180deg, #3a3a3c, #2a2a2c)",
          borderRadius: "0 0 4px 4px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        }}
      />
    </div>
  );
}
```

- [ ] **Step 4: Add Placeholder sub-component**

```tsx
function Placeholder({ couple, theme }: { couple: string; theme: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-secondary/30 px-8">
      <span className="text-4xl opacity-40">💌</span>
      <p className="font-heading text-xl italic text-foreground text-center">{couple}</p>
      <p className="text-xs text-muted-foreground">Thème {theme} — bientôt disponible</p>
    </div>
  );
}
```

- [ ] **Step 5: Add main `ProductDemoViewer` export**

```tsx
export function ProductDemoViewer() {
  const t = useTranslations("ProductDemo");
  const [activeTheme, setActiveTheme] = useState(0);
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");

  const demo = DEMO_THEMES[activeTheme];

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-10">
        <p className="text-xs uppercase tracking-[0.3em] text-primary font-medium mb-3">
          {t("demosEyebrow")}
        </p>
        <h2 className="font-heading text-4xl md:text-5xl font-medium text-foreground leading-tight">
          {t("demosTitleLine1")}{" "}
          <span className="italic text-primary">{t("demosTitleLine2")}</span>
        </h2>
        <p className="text-muted-foreground mt-3 max-w-lg mx-auto">{t("demosSub")}</p>
      </div>

      {/* Theme selector */}
      <div className="flex gap-2 justify-center flex-wrap mb-7">
        {DEMO_THEMES.map((theme, i) => (
          <button
            key={theme.key}
            onClick={() => setActiveTheme(i)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all",
              i === activeTheme
                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
            )}
          >
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ [theme.dotStyle.startsWith('background') ? 'background' : 'background']: theme.dotStyle.replace('background: ', '') }} />
            {theme.labelKey}
          </button>
        ))}
      </div>

      {/* Device toggle */}
      <div className="flex justify-center mb-7">
        <div className="inline-flex bg-card border border-border rounded-full p-1 gap-0.5 shadow-sm">
          <button
            onClick={() => setDevice("mobile")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all",
              device === "mobile"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Smartphone className="w-3.5 h-3.5" />
            {t("deviceMobile")}
          </button>
          <button
            onClick={() => setDevice("desktop")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all",
              device === "desktop"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Monitor className="w-3.5 h-3.5" />
            {t("deviceDesktop")}
          </button>
        </div>
      </div>

      {/* Device frame */}
      {device === "mobile" ? (
        <MobileFrame url={demo.url} couple={demo.couple} theme={demo.labelKey} />
      ) : (
        <DesktopFrame url={demo.url} couple={demo.couple} theme={demo.labelKey} />
      )}

      {/* Open fullscreen link */}
      {demo.url && (
        <div className="flex justify-center mt-5">
          <a
            href={demo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-primary/30 text-primary text-sm font-medium bg-card hover:bg-primary/5 transition-colors shadow-sm"
          >
            {t("openFullscreen")}
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Commit**
```bash
git add landing/src/components/landing/product-demo-viewer.tsx
git commit -m "feat: add ProductDemoViewer client component"
```

---

## Chunk 4: Parent Wrapper + Page Integration

### Task 4: Create `ProductDemo` wrapper and wire into `page.tsx`

**Files:**
- Create: `landing/src/components/landing/product-demo.tsx`
- Modify: `landing/src/app/[locale]/page.tsx`

- [ ] **Step 1: Create the wrapper component**

```tsx
import { ProductDemoSteps } from "./product-demo-steps";
import { ProductDemoViewer } from "./product-demo-viewer";

export function ProductDemo() {
  return (
    <>
      {/* Part 1 — narrative steps */}
      <section className="py-24 bg-secondary/30" id="demo-steps">
        <div className="container mx-auto px-4">
          <ProductDemoSteps />
        </div>
      </section>

      {/* Part 2 — live demos */}
      <section className="py-24 bg-background border-t border-border" id="demo-viewer">
        <div className="container mx-auto px-4">
          <ProductDemoViewer />
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 2: Insert `ProductDemo` into `page.tsx` between Hero and HowItWorks**

Current order in `landing/src/app/[locale]/page.tsx`:
```tsx
<Hero />
<HowItWorks />
```

New order:
```tsx
<Hero />
<ProductDemo />
<HowItWorks />
```

Add import at top:
```tsx
import { ProductDemo } from "@/components/landing/product-demo";
```

- [ ] **Step 3: Verify dev server compiles without errors**
```bash
cd /path/to/repo && npm run dev:landing
# Open http://localhost:3002 — check Hero → ProductDemo → HowItWorks order
# Check: steps section renders correctly
# Check: theme pills switch active state
# Check: mobile/desktop toggle switches frames
# Check: placeholder shows "bientôt disponible" when url is null
```

- [ ] **Step 4: Commit**
```bash
git add landing/src/components/landing/product-demo.tsx landing/src/app/[locale]/page.tsx
git commit -m "feat: insert ProductDemo section between Hero and HowItWorks"
```

---

## Chunk 5: dotStyle fix + Polish

### Task 5: Fix theme dot inline style (TypeScript-safe)

The `dotStyle` approach in Task 3 Step 5 uses a string — React requires an object. Fix this in `product-demo-viewer.tsx`.

- [ ] **Step 1: Update `DemoTheme` type and data to use object style**

Replace `dotStyle: string` with `dotColors: [string, string]` (two hex colors for the gradient):

```tsx
type DemoTheme = {
  key: string;
  labelKey: string;
  couple: string;
  dotColors: [string, string];
  url: string | null;
};

const DEMO_THEMES: DemoTheme[] = [
  { key: "floral",     labelKey: "Floral",      couple: "Sophie & Thomas",  dotColors: ["#c97a90", "#8b2040"], url: null },
  { key: "royal",      labelKey: "Royal",        couple: "Camille & Antoine", dotColors: ["#c9a96e", "#2d3a6b"], url: null },
  { key: "boho",       labelKey: "Bohème",       couple: "Léa & Hugo",       dotColors: ["#c4a882", "#8b5e3c"], url: null },
  { key: "minimalist", labelKey: "Minimaliste",  couple: "Marie & Julien",   dotColors: ["#999999", "#222222"], url: null },
  { key: "modern",     labelKey: "Modern",       couple: "Clara & Maxime",   dotColors: ["#b07acc", "#4a1570"], url: null },
];
```

- [ ] **Step 2: Update the dot `<span>` in the theme selector**

```tsx
<span
  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
  style={{ background: `linear-gradient(135deg, ${theme.dotColors[0]}, ${theme.dotColors[1]})` }}
/>
```

- [ ] **Step 3: Run lint**
```bash
cd landing && npm run lint
# Expected: no errors
```

- [ ] **Step 4: Commit**
```bash
git add landing/src/components/landing/product-demo-viewer.tsx
git commit -m "fix: use typed dotColors array for theme dot gradient"
```

---

## Activating a demo (future step — when hosted invitations exist)

When a demo invitation is live, update `DEMO_THEMES` in `product-demo-viewer.tsx`:

```tsx
{ key: "floral", ..., url: "/invitation/YOUR_WEDDING_CODE" }
```

The iframe and "Open fullscreen" link will activate automatically. No other changes needed.
