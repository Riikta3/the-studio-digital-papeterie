# Configurator UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align all 6 configurator pages with validated mockups — add feature checklists on plan cards (Step 1), use primary-only colors on animation previews (Step 2), add "+5€" badge on extra modules (Step 4), add desktop 3-column layout on options page (Step 5), and add pricing breakdown + desktop 2-col layout on checkout (Step 6).

**Architecture:** All changes are confined to existing `"use client"` page components. No new routes, no API routes, no schema changes. `layout.tsx` untouched.

**Tech Stack:** Next.js App Router, Zustand, Tailwind CSS v3, Framer Motion, Lucide icons, Stripe Elements

---

## File Map

| File | Change |
|------|--------|
| `src/app/[locale]/(configurator)/studio/start/page.tsx` | Add feature checklist rows on plan cards + bold "sous 24h" on Premium |
| `src/app/[locale]/(configurator)/studio/animation/page.tsx` | Remove `BG` constant → use `bg-primary/7` tint on all category previews |
| `src/app/[locale]/(configurator)/studio/modules/page.tsx` | Add "+5€" badge on modules beyond 4th (Essentiel plan only) |
| `src/app/[locale]/(configurator)/studio/options/page.tsx` | Add 3-column desktop grid: `1.1fr 0.5fr 1.4fr` |
| `src/app/[locale]/(configurator)/studio/checkout/page.tsx` | Add pricing breakdown card + desktop 2-col grid (recap left, Stripe right) |

---

## Task 1 — Step 1: Plan card feature checklists

**Files:**
- Modify: `src/app/[locale]/(configurator)/studio/start/page.tsx`

The mockup shows each plan card with a small feature list. Premium highlights "Support prioritaire par email sous 24h" in bold primary. Essentiel shows 3 muted gray feature lines.

- [ ] **Step 1: Add FEATURES constants after `DEFAULT_YEAR`**

```typescript
const PREMIUM_FEATURES = [
  { text: "Modules illimités", highlight: false },
  { text: "Nom de domaine inclus", highlight: false },
  { text: "Support prioritaire par email sous 24h", highlight: true },
];

const ESSENTIAL_FEATURES = [
  { text: "4 modules inclus · +5€/module supplémentaire", highlight: false },
  { text: "Extras à la carte", highlight: false },
  { text: "Support standard", highlight: false },
];
```

- [ ] **Step 2: Replace Premium card subtitle `<p>` with feature `<ul>`**

Replace:
```tsx
<p className="text-[11px] text-muted-foreground font-sans">Modules illimités · Domaine inclus · Support prioritaire</p>
```

With:
```tsx
<ul className="mt-2 flex flex-col gap-0.5">
  {PREMIUM_FEATURES.map((f) => (
    <li key={f.text} className="flex items-start gap-1.5">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-primary mt-0.5 flex-shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
      <span className={cn(
        "text-[11px] font-sans leading-tight",
        f.highlight ? "font-bold text-primary" : "text-muted-foreground"
      )}>{f.text}</span>
    </li>
  ))}
</ul>
```

- [ ] **Step 3: Replace Essentiel card subtitle `<p>` with feature `<ul>`**

Replace:
```tsx
<p className="text-[11px] text-muted-foreground font-sans">4 modules inclus · Extras à la carte · Support standard</p>
```

With:
```tsx
<ul className="mt-2 flex flex-col gap-0.5">
  {ESSENTIAL_FEATURES.map((f) => (
    <li key={f.text} className="flex items-start gap-1.5">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/40 mt-0.5 flex-shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
      <span className="text-[11px] font-sans text-muted-foreground leading-tight">{f.text}</span>
    </li>
  ))}
</ul>
```

- [ ] **Step 4: Verify visually**

```bash
npm run dev:landing
```
Open `http://localhost:3002/fr/studio/start`. Expected: Premium card has 3 feature lines, "sous 24h" in bold primary. Essentiel has 3 muted gray lines.

- [ ] **Step 5: Commit**

```bash
git add landing/src/app/\[locale\]/\(configurator\)/studio/start/page.tsx
git commit -m "feat(configurator): add feature checklist to plan cards on start page"
```

---

## Task 2 — Step 2: Animation previews — primary tint only

**Files:**
- Modify: `src/app/[locale]/(configurator)/studio/animation/page.tsx`

Remove the `BG` constant that maps categories to different pastels. Replace with a uniform `bg-primary/7` tint. The outer `<div>` needs `relative` so its absolutely positioned children (dot overlay and demo button) work correctly.

- [ ] **Step 1: Delete the `BG` constant**

Remove these 8 lines entirely:
```typescript
const BG: Record<string, string> = {
  envelope: "#f5ede6",
  door: "#ece8f0",
  curtain: "#e8eff5",
  book: "#e8f0ec",
  floral: "#f5e8ec",
};
```

- [ ] **Step 2: Replace `previewContent` with primary tint version**

Replace the entire `previewContent: (...)` block inside the `cards` mapping with:

```tsx
previewContent: (
  <div className="relative h-full flex items-center justify-center bg-primary/7">
    <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:18px_18px]" />
    <span className="relative z-10 opacity-20 scale-[2.5] text-foreground">
      {currentCategory.icon}
    </span>
    <button
      onClick={(e) => {
        e.stopPropagation();
        setShowDemo(true);
      }}
      className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap text-[11px] font-bold text-primary px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-primary/20 shadow-sm font-sans"
    >
      ▶ Voir la démo
    </button>
  </div>
),
```

Note: `relative` is required on the outer `<div>` — the dot-grid `absolute inset-0` and demo `button absolute bottom-3` both position against this ancestor.

- [ ] **Step 3: Verify visually**

Open `http://localhost:3002/fr/studio/animation`. Switch between category pills.
Expected: All previews use the same soft pink tint. Dot grid and "Voir la démo" button render correctly in all categories.

- [ ] **Step 4: Commit**

```bash
git add landing/src/app/\[locale\]/\(configurator\)/studio/animation/page.tsx
git commit -m "feat(configurator): use uniform primary tint for all animation previews"
```

---

## Task 3 — Step 4: Module "+5€" badge on extra modules

**Files:**
- Modify: `src/app/[locale]/(configurator)/studio/modules/page.tsx`

When plan is `"experience"` and the user has selected more than 4 modules, each module at `selectedIndex >= 4` in the selection order shows a "+5€" badge. This replaces only the **contents** of the `<div className="flex flex-col gap-2 max-w-lg mx-auto w-full px-4">` container — that outer `<div>` stays intact.

- [ ] **Step 1: Replace the `MODULES.map(...)` expression**

Replace the existing `{MODULES.map((mod) => { ... })}` expression (keeping the surrounding `<div className="flex flex-col gap-2 max-w-lg mx-auto w-full px-4">` unchanged) with:

```tsx
{MODULES.map((mod) => {
  const isSelected = modules.includes(mod.id);
  const selectedIndex = modules.indexOf(mod.id);
  const isExtra = plan === "experience" && isSelected && selectedIndex >= 4;
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
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
        isSelected ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold">{mod.label}</p>
        <p className="text-xs text-muted-foreground font-sans mt-0.5 line-clamp-1">{mod.desc}</p>
      </div>
      {isExtra && (
        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full font-sans flex-shrink-0">
          +5€
        </span>
      )}
      <div className={cn(
        "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
        isSelected ? "border-primary/40 bg-primary/15" : "border-border"
      )}>
        {isSelected && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
    </button>
  );
})}
```

- [ ] **Step 2: Verify visually**

Open `http://localhost:3002/fr/studio/modules` with Essentiel plan.
Select 5+ modules → 5th+ should show "+5€" pill between desc and checkmark.
Switch to Premium plan → no "+5€" badges appear regardless of selection count.

- [ ] **Step 3: Commit**

```bash
git add landing/src/app/\[locale\]/\(configurator\)/studio/modules/page.tsx
git commit -m "feat(configurator): show +5€ badge on extra modules for Essentiel plan"
```

---

## Task 4 — Step 5: Options page desktop 3-column layout

**Files:**
- Modify: `src/app/[locale]/(configurator)/studio/options/page.tsx`

On desktop (≥ `md`), the 3 sections (Languages, Preferences/Adults Only, Extras) display in a 3-column grid with proportions `1.1fr 0.5fr 1.4fr`. Use Tailwind arbitrary value syntax — valid in Tailwind v3.

- [ ] **Step 1: Replace the sections container class**

Replace:
```tsx
<div className="flex flex-col gap-5 max-w-lg mx-auto w-full px-4">
```

With:
```tsx
<div className="flex flex-col gap-5 max-w-lg mx-auto w-full px-4 md:[display:grid] md:gap-8 md:items-start md:max-w-4xl md:mx-auto md:px-8 md:[grid-template-columns:1.1fr_0.5fr_1.4fr]">
```

This is a single-element change. Mobile layout is unchanged (`flex flex-col`). On `md+` the display switches to grid with the 3-column ratio. `md:max-w-4xl md:mx-auto` override the mobile `max-w-lg mx-auto`.

- [ ] **Step 2: Verify visually**

Open `http://localhost:3002/fr/studio/options` at desktop width (≥768px).
Expected: Languages ~35%, Adults Only (narrow) ~17%, Extras ~45%.
At mobile width: unchanged single column.

- [ ] **Step 3: Commit**

```bash
git add landing/src/app/\[locale\]/\(configurator\)/studio/options/page.tsx
git commit -m "feat(configurator): add 3-column desktop layout to options page"
```

---

## Task 5 — Step 6: Checkout pricing breakdown + desktop 2-col layout

**Files:**
- Modify: `src/app/[locale]/(configurator)/studio/checkout/page.tsx`

Two changes:
1. Replace the existing `RecapRow "Offre"` with a dedicated pricing breakdown card showing each line item (plan base + module surcharge + languages + extras) with individual prices.
2. On desktop, restructure into 2 columns: recap/pricing/preview/total on the left, Stripe form on the right.

The `<ThemeDemoOverlay>` at the bottom of the component must remain **outside** the grid container, at the `<>` fragment level — do not move it inside a column.

The `isPaymentSuccess` early return block is untouched.

### Complete replacement for the `return (...)` of `CheckoutPage` (non-provisioning branch):

- [ ] **Step 1: Replace the checkout return JSX**

Replace the entire `return (` block (from line 206 to the closing `</StepTransition>`) with:

```tsx
return (
  <StepTransition>
  <>
    {/* Title — full width above grid */}
    <div className="text-center space-y-2 pb-2 max-w-lg mx-auto px-4 md:max-w-4xl">
      <h1 className="font-heading text-3xl font-bold md:text-4xl">
        Votre commande est <span className="italic text-primary">prête</span>
      </h1>
      <p className="text-muted-foreground text-sm font-sans">
        Vérifiez vos choix et finalisez votre site d&apos;invitation.
      </p>
    </div>

    {/* 2-col grid on desktop */}
    <div className="flex flex-col gap-5 max-w-lg mx-auto px-4 md:max-w-4xl md:grid md:grid-cols-2 md:gap-10 md:items-start">

      {/* ── LEFT COL: recap + pricing + preview + total ── */}
      <div className="flex flex-col gap-4">

        {/* Recap */}
        <div className="bg-card border-2 border-border/60 rounded-2xl overflow-hidden">
          <RecapRow
            label="Les mariés"
            value={`${weddingInfo.partner1 || "—"} & ${weddingInfo.partner2 || "—"} · ${weddingInfo.day || "—"} ${weddingInfo.month || ""} ${weddingInfo.year || ""}`}
            href="/studio/start"
          />
          <RecapRow label="Animation & Thème" value={`${animation || "—"} · ${THEME_NAMES[theme] || "—"}`} href="/studio/animation" />
          <RecapRow label="Modules" href="/studio/modules">
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
            <RecapRow label="Options" href="/studio/options">
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

        {/* Pricing breakdown */}
        {plan && (
          <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
              <span className="text-sm font-bold">Pack {plan === "premium" ? "Premium" : "Essentiel"}</span>
              <span className="text-sm font-bold">{plan === "premium" ? "575" : "175"}€</span>
            </div>
            {plan === "experience" && modules.length > 4 && (
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                <span className="text-sm text-muted-foreground font-sans">
                  {modules.length - 4} module{modules.length - 4 > 1 ? "s" : ""} supplémentaire{modules.length - 4 > 1 ? "s" : ""}
                </span>
                <span className="text-sm font-semibold text-muted-foreground font-sans">+{(modules.length - 4) * 5}€</span>
              </div>
            )}
            {languages.map((l) => (
              <div key={l} className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                <span className="text-sm text-muted-foreground font-sans">Langue : {l.toUpperCase()}</span>
                <span className="text-sm font-semibold text-muted-foreground font-sans">+15€</span>
              </div>
            ))}
            {extras.map((e) => (
              <div key={e} className="flex items-center justify-between px-4 py-3 border-b border-border/40 last:border-b-0">
                <span className="text-sm text-muted-foreground font-sans">{EXTRA_NAMES[e] ?? e}</span>
                <span className="text-sm font-semibold text-muted-foreground font-sans">+{EXTRA_PRICES[e] ?? 0}€</span>
              </div>
            ))}
          </div>
        )}

        {/* Preview button */}
        <button
          onClick={() => setShowPreview(true)}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-primary text-primary font-bold text-sm font-sans hover:bg-primary/5 transition-colors"
        >
          <Eye className="w-4 h-4" />
          Voir l&apos;aperçu de mon site
        </button>

        {/* Total */}
        <div className="flex items-center justify-between px-5 py-4 bg-card border-2 border-border rounded-2xl">
          <div>
            <p className="text-sm font-semibold font-sans">Total à régler</p>
            <p className="text-[10px] text-muted-foreground font-sans">Paiement unique · Accès à vie</p>
          </div>
          <span className="font-heading text-3xl font-bold text-primary">{totalPrice}€</span>
        </div>

        {/* Guarantees — desktop only */}
        <div className="hidden md:flex flex-col gap-2">
          {[
            "Paiement unique — sans abonnement",
            "Accès immédiat après confirmation",
            "Support par email sous 24h",
          ].map((g) => (
            <div key={g} className="flex items-center gap-2 text-xs text-muted-foreground font-sans">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary flex-shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
              {g}
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT COL: Stripe payment ── */}
      <div className="flex flex-col gap-5">
        <h2 className="hidden md:block font-heading text-xl font-bold">Paiement sécurisé</h2>

        {/* Separator — mobile only */}
        <div className="flex items-center gap-3 md:hidden">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 font-sans">Paiement sécurisé</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Stripe Elements */}
        {fetchError ? (
          <div className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3">
            <p className="text-sm text-red-500 font-sans">{fetchError}</p>
          </div>
        ) : !clientSecret ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground font-sans animate-pulse">Initialisation du paiement sécurisé...</p>
          </div>
        ) : (
          <Elements
            stripe={stripePromise}
            options={{ clientSecret, appearance: { theme: "stripe" } }}
          >
            <StripePaymentForm totalPrice={totalPrice} onSuccess={() => {}} />
          </Elements>
        )}

        <p className="text-center text-[10px] text-muted-foreground/50 font-sans leading-relaxed">
          En validant, vous acceptez nos CGV et notre politique de confidentialité.<br />
          Paiement unique · Sans abonnement
        </p>
      </div>

    </div>

    {/* Preview overlay — outside grid, at fragment level */}
    {showPreview && (
      <ThemeDemoOverlay
        themeId={theme}
        themeName={THEME_NAMES[theme] ?? "Floral"}
        onClose={() => setShowPreview(false)}
        onSelect={() => setShowPreview(false)}
      />
    )}
  </>
  </StepTransition>
);
```

- [ ] **Step 2: Add `EXTRA_NAMES` constant above `CheckoutPage`**

The pricing breakdown uses `EXTRA_NAMES` to display human-readable labels. Add this constant below `THEME_NAMES` (around line 23):

```typescript
const EXTRA_NAMES: Record<string, string> = {
  "custom-music": "Musique personnalisée",
  "custom-illustration": "Illustration sur mesure",
  "animated-video": "Vidéo animée",
  "custom-domain": "Domaine personnalisé",
};
```

Note: `EXTRA_PRICES` is already imported from the store (`use-order-store.ts` exports it). Import it:
```typescript
import { selectTotalPrice, useOrderStore, EXTRA_PRICES } from "@/stores/use-order-store";
```

Wait — `EXTRA_PRICES` is not currently exported from the store. Add `export` to the existing constant in `use-order-store.ts`:

```typescript
// BEFORE (line 44 in use-order-store.ts)
const EXTRA_PRICES: Record<string, number> = {

// AFTER
export const EXTRA_PRICES: Record<string, number> = {
```

Then in `checkout/page.tsx` import it:
```typescript
import { selectTotalPrice, useOrderStore, EXTRA_PRICES } from "@/stores/use-order-store";
```

- [ ] **Step 3: Verify visually**

Mobile (`http://localhost:3002/fr/studio/checkout`): single column, title → recap → pricing breakdown → preview button → total → separator → Stripe form.
Desktop (≥768px): title centered above, then 2-column layout.
Expected: "Voir l'aperçu de mon site" button above total on both breakpoints. ThemeDemoOverlay opens correctly.

- [ ] **Step 4: Commit**

```bash
git add landing/src/app/\[locale\]/\(configurator\)/studio/checkout/page.tsx
git add landing/src/stores/use-order-store.ts
git commit -m "feat(configurator): add pricing breakdown and desktop 2-col layout to checkout"
```

---

## Final Verification

- [ ] **Build check**

```bash
cd landing && npm run build
```
Expected: No TypeScript errors.

- [ ] **Lint check**

```bash
cd landing && npm run lint
```
Expected: No new lint errors.
