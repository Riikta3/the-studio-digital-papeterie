# Themed Invitation Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chaque thème d'invitation (`theme-minimalist`, `theme-floral`, `theme-boho`, `theme-royal`, `theme-modern`) a ses propres composants React complets. Le `ModuleRenderer` charge les composants du bon thème selon `sites.theme_id` en base de données.

**Architecture:** Les composants actuels dans `invitation/` sont déplacés dans `themes/theme-minimalist/` — c'est le thème par défaut actuel. Les 4 autres thèmes sont créés from scratch dans leurs propres dossiers. `ModuleRenderer` reçoit `themeId` et charge via un registre `THEME_MODULE_COMPONENTS[themeId][moduleId]`. Un `ThemedInvitationLayout` RSC orchestre Hero + Footer + Modules du bon thème.

**Tech Stack:** Next.js App Router, React Server Components, Supabase, Framer Motion, Tailwind CSS, TypeScript.

**IDs thèmes** (alignés avec `studio/theme/page.tsx`) : `theme-minimalist`, `theme-floral`, `theme-boho`, `theme-royal`, `theme-modern`

---

## File Structure

```
landing/src/components/invitation/
  themes/
    theme-minimalist/               ← composants actuels déplacés + adaptés
      CountdownModule.tsx
      RsvpModule.tsx
      GalleryModule.tsx
      MapModule.tsx
      TimelineModule.tsx
      DressCodeModule.tsx
      GiftListModule.tsx
      GuestbookModule.tsx
      AccommodationModule.tsx
      TransportModule.tsx
      MenuModule.tsx
      PlaylistModule.tsx
      FaqModule.tsx
      IntroVideoModule.tsx
      VideoGuestbookModule.tsx
      InvitationHero.tsx
      InvitationFooter.tsx
      Divider.tsx
      index.ts
    theme-floral/                   ← nouveaux composants (romantique, nature, serif)
      [même liste]
    theme-boho/                     ← nouveaux composants (chaleureux, terreux, organique)
      [même liste]
    theme-royal/                    ← nouveaux composants (majestueux, bleu nuit, gold)
      [même liste]
    theme-modern/                   ← nouveaux composants (audacieux, rose vif, bold)
      [même liste]
  module-registry.ts                ← THEME_MODULE_COMPONENTS + ModuleProps + getModuleComponent()
  ThemedInvitationLayout.tsx        ← RSC: sélectionne Hero + Footer + ModuleRenderer par thème
  ModuleRenderer.tsx                ← modifié: accepte themeId, utilise le registre
  InvitationPageClient.tsx          ← modifié: passe themeId + animationId
  InvitationIntro.tsx               ← modifié: accepte videoSrc (placeholder pour assets vidéo)
  PlaylistContext.tsx               ← inchangé (reste à la racine, partagé)
  GuestCodeGate.tsx                 ← inchangé
  ScrollToTop.tsx                   ← inchangé
  ScrollToModules.tsx               ← inchangé
  ModulesWrapper.tsx                ← inchangé

landing/src/app/[locale]/invitation/[weddingCode]/page.tsx
  ← modifié: utilise ThemedInvitationLayout, passe themeId

supabase/migrations/
  20260326120000_add_animation_id_to_sites.sql

landing/src/actions/create-wedding.ts
  ← modifié: sauvegarde animation_id
```

---

## Task 1: Créer le type partagé `ModuleProps` et le registre vide

**Files:**
- Create: `landing/src/components/invitation/module-registry.ts`

- [ ] **Step 1: Créer `module-registry.ts` avec le type et le registre vide**

```typescript
// landing/src/components/invitation/module-registry.ts
import type React from "react";

// Interface partagée par TOUS les composants de modules, tous thèmes confondus.
// Chaque composant peut ignorer les props dont il n'a pas besoin.
export interface ModuleProps {
  weddingId: string;
  weddingDate?: string | null;
  extras?: Record<string, any> | null;
  config?: Record<string, any> | null;
  partner1?: string;
  partner2?: string;
  isDemo?: boolean;
}

export type ThemeModuleRegistry = Record<
  string,
  Record<string, React.ComponentType<ModuleProps>>
>;

// Sera complété en Task 6 une fois tous les composants créés
export const THEME_MODULE_COMPONENTS: ThemeModuleRegistry = {};

export const DEFAULT_THEME = "theme-minimalist";

export function getModuleComponent(
  themeId: string,
  moduleId: string
): React.ComponentType<ModuleProps> | null {
  const themeMap =
    THEME_MODULE_COMPONENTS[themeId] ??
    THEME_MODULE_COMPONENTS[DEFAULT_THEME];
  return themeMap?.[moduleId] ?? null;
}
```

- [ ] **Step 2: Commit**

```bash
git add landing/src/components/invitation/module-registry.ts
git commit -m "feat(invitation): add ModuleProps type and empty theme registry"
```

---

## Task 2: Déplacer les composants actuels dans `themes/theme-minimalist/`

Les composants actuels dans `invitation/` constituent le thème **minimalist** (épuré, sans-serif, espaces généreux). On les déplace dans leur dossier thème.

**Files:**
- Create: `landing/src/components/invitation/themes/theme-minimalist/` (dossier)
- Move: tous les modules + Hero + Footer + Divider

- [ ] **Step 1: Créer le dossier et déplacer les fichiers**

```bash
mkdir -p landing/src/components/invitation/themes/theme-minimalist

# Déplacer tous les composants modules + Hero/Footer/Divider
mv landing/src/components/invitation/CountdownModule.tsx landing/src/components/invitation/themes/theme-minimalist/
mv landing/src/components/invitation/RsvpModule.tsx landing/src/components/invitation/themes/theme-minimalist/
mv landing/src/components/invitation/GalleryModule.tsx landing/src/components/invitation/themes/theme-minimalist/
mv landing/src/components/invitation/MapModule.tsx landing/src/components/invitation/themes/theme-minimalist/
mv landing/src/components/invitation/TimelineModule.tsx landing/src/components/invitation/themes/theme-minimalist/
mv landing/src/components/invitation/DressCodeModule.tsx landing/src/components/invitation/themes/theme-minimalist/
mv landing/src/components/invitation/GiftListModule.tsx landing/src/components/invitation/themes/theme-minimalist/
mv landing/src/components/invitation/GuestbookModule.tsx landing/src/components/invitation/themes/theme-minimalist/
mv landing/src/components/invitation/AccommodationModule.tsx landing/src/components/invitation/themes/theme-minimalist/
mv landing/src/components/invitation/TransportModule.tsx landing/src/components/invitation/themes/theme-minimalist/
mv landing/src/components/invitation/MenuModule.tsx landing/src/components/invitation/themes/theme-minimalist/
mv landing/src/components/invitation/PlaylistModule.tsx landing/src/components/invitation/themes/theme-minimalist/
mv landing/src/components/invitation/FaqModule.tsx landing/src/components/invitation/themes/theme-minimalist/
mv landing/src/components/invitation/IntroVideoModule.tsx landing/src/components/invitation/themes/theme-minimalist/
mv landing/src/components/invitation/VideoGuestbookModule.tsx landing/src/components/invitation/themes/theme-minimalist/
mv landing/src/components/invitation/InvitationHero.tsx landing/src/components/invitation/themes/theme-minimalist/
mv landing/src/components/invitation/InvitationFooter.tsx landing/src/components/invitation/themes/theme-minimalist/
mv landing/src/components/invitation/Divider.tsx landing/src/components/invitation/themes/theme-minimalist/
mv landing/src/components/invitation/GenericInfoModule.tsx landing/src/components/invitation/themes/theme-minimalist/
mv landing/src/components/invitation/HeroBackground.tsx landing/src/components/invitation/themes/theme-minimalist/
mv landing/src/components/invitation/PhotoShareModule.tsx landing/src/components/invitation/themes/theme-minimalist/
```

- [ ] **Step 2: Corriger les imports relatifs dans les fichiers déplacés**

Les fichiers déplacés importent depuis `@/` (alias absolu, OK) ou des chemins relatifs comme `../PlaylistContext`. Après déplacement, ces imports relatifs cassent.

Chercher et corriger :
```bash
grep -r "from \"\.\./" landing/src/components/invitation/themes/theme-minimalist/ --include="*.tsx"
```

Les imports relatifs `../X` doivent devenir `../../X` (ex: `../PlaylistContext` → `../../PlaylistContext`).

- [ ] **Step 3: Créer le barrel `index.ts`**

```typescript
// landing/src/components/invitation/themes/theme-minimalist/index.ts
export { CountdownModule } from "./CountdownModule";
export { RsvpModule } from "./RsvpModule";
export { GalleryModule } from "./GalleryModule";
export { MapModule } from "./MapModule";
export { TimelineModule } from "./TimelineModule";
export { DressCodeModule } from "./DressCodeModule";
export { GiftListModule } from "./GiftListModule";
export { GuestbookModule } from "./GuestbookModule";
export { AccommodationModule } from "./AccommodationModule";
export { TransportModule } from "./TransportModule";
export { MenuModule } from "./MenuModule";
export { PlaylistModule } from "./PlaylistModule";
export { FaqModule } from "./FaqModule";
export { IntroVideoModule } from "./IntroVideoModule";
export { VideoGuestbookModule } from "./VideoGuestbookModule";
export { InvitationHero } from "./InvitationHero";
export { InvitationFooter } from "./InvitationFooter";
export { Divider } from "./Divider";
```

- [ ] **Step 4: Build rapide pour vérifier qu'aucun import n'est cassé**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie
npm run build:landing 2>&1 | grep -E "error|Error" | head -20
```

Corriger toute erreur d'import avant de continuer.

- [ ] **Step 5: Commit**

```bash
git add landing/src/components/invitation/themes/theme-minimalist/
git commit -m "feat(invitation): move existing components into themes/theme-minimalist/"
```

---

## Task 3: Créer les composants `theme-floral`

Design : romantique, nature, typographie serif/italique, palette rose/pêche/crème, décorations florales SVG, animations douces.

**Files:**
- Create: `landing/src/components/invitation/themes/theme-floral/` (dossier complet)

- [ ] **Step 1: Créer `InvitationHero` floral**

```typescript
// landing/src/components/invitation/themes/theme-floral/InvitationHero.tsx
"use client";

import { motion } from "framer-motion";

interface InvitationHeroProps {
  firstName: string;
  partnerName: string;
  weddingDate?: string | null;
}

export function InvitationHero({ firstName, partnerName, weddingDate }: InvitationHeroProps) {
  const formattedDate = weddingDate
    ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" })
        .format(new Date(weddingDate))
    : "";

  return (
    <section className="h-[100svh] flex flex-col items-center justify-center relative overflow-hidden bg-[#fdf6f0]">
      {/* Décoration florale SVG haut-gauche */}
      <svg className="absolute top-0 left-0 w-64 h-64 opacity-20 text-[#c97a90]" viewBox="0 0 200 200" fill="none">
        <circle cx="40" cy="40" r="30" stroke="currentColor" strokeWidth="0.5" />
        <circle cx="80" cy="20" r="20" stroke="currentColor" strokeWidth="0.5" />
        <circle cx="20" cy="80" r="25" stroke="currentColor" strokeWidth="0.5" />
        <path d="M10 100 Q50 60 100 80 Q140 100 180 60" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <path d="M0 150 Q60 120 100 140 Q150 160 200 120" stroke="currentColor" strokeWidth="0.8" fill="none" />
      </svg>
      {/* Décoration florale SVG bas-droite */}
      <svg className="absolute bottom-0 right-0 w-64 h-64 opacity-20 text-[#c97a90] rotate-180" viewBox="0 0 200 200" fill="none">
        <circle cx="40" cy="40" r="30" stroke="currentColor" strokeWidth="0.5" />
        <circle cx="80" cy="20" r="20" stroke="currentColor" strokeWidth="0.5" />
        <circle cx="20" cy="80" r="25" stroke="currentColor" strokeWidth="0.5" />
        <path d="M10 100 Q50 60 100 80 Q140 100 180 60" stroke="currentColor" strokeWidth="0.8" fill="none" />
      </svg>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="flex flex-col items-center text-center px-6 gap-5 relative z-10"
      >
        <p className="text-[10px] uppercase tracking-[0.5em] text-[#c97a90]/70 font-sans">
          Vous êtes cordialement invités au mariage de
        </p>
        <h1
          className="text-5xl sm:text-6xl md:text-7xl leading-tight text-[#5a3040]"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic" }}
        >
          {firstName}
          <span className="block text-[#c97a90]/50 text-3xl sm:text-4xl my-2 not-italic">&</span>
          {partnerName}
        </h1>
        {formattedDate && (
          <p className="text-xs uppercase tracking-[0.3em] text-[#5a3040]/60 font-sans mt-2">
            {formattedDate}
          </p>
        )}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="w-24 h-px bg-[#c97a90]/40 mt-2"
        />
      </motion.div>
    </section>
  );
}
```

- [ ] **Step 2: Créer `Divider` floral**

```typescript
// landing/src/components/invitation/themes/theme-floral/Divider.tsx
export function Divider() {
  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <div className="h-px w-16 bg-[#c97a90]/20" />
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#c97a90]/40">
        <path d="M8 1 C8 1 10 4 8 8 C6 4 8 1 8 1Z" fill="currentColor" />
        <path d="M8 15 C8 15 10 12 8 8 C6 12 8 15 8 15Z" fill="currentColor" />
        <path d="M1 8 C1 8 4 6 8 8 C4 10 1 8 1 8Z" fill="currentColor" />
        <path d="M15 8 C15 8 12 6 8 8 C12 10 15 8 15 8Z" fill="currentColor" />
      </svg>
      <div className="h-px w-16 bg-[#c97a90]/20" />
    </div>
  );
}
```

- [ ] **Step 3: Créer `InvitationFooter` floral**

```typescript
// landing/src/components/invitation/themes/theme-floral/InvitationFooter.tsx

interface FooterProps {
  profile: {
    first_name: string;
    partner_name: string;
    wedding_date?: string | null;
  };
}

export function InvitationFooter({ profile }: FooterProps) {
  return (
    <footer className="w-full py-16 text-center bg-[#fdf6f0] border-t border-[#c97a90]/10">
      <p
        className="text-2xl text-[#5a3040]/70"
        style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic" }}
      >
        {profile.first_name} & {profile.partner_name}
      </p>
      <p className="text-[10px] uppercase tracking-[0.3em] text-[#c97a90]/40 mt-3 font-sans">
        Fait avec amour · The Studio Digital
      </p>
    </footer>
  );
}
```

- [ ] **Step 4: Créer `CountdownModule` floral**

Design : chiffres en serif italique, séparateurs floraux, palette rose/crème.

```typescript
// landing/src/components/invitation/themes/theme-floral/CountdownModule.tsx
"use client";

import { motion } from "framer-motion";
import { CalendarPlus, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ModuleProps } from "../../module-registry";

function getDefaultDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 9);
  return d.toISOString();
}

function generateICS(dateStr: string, title: string): string {
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const nd = new Date(d); nd.setDate(nd.getDate() + 1);
  const end = `${nd.getFullYear()}${pad(nd.getMonth() + 1)}${pad(nd.getDate())}`;
  return ["BEGIN:VCALENDAR","VERSION:2.0","BEGIN:VEVENT",
    `DTSTART;VALUE=DATE:${stamp}`,`DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${title}`,"END:VEVENT","END:VCALENDAR"].join("\r\n");
}

export function CountdownModule({ weddingDate, partner1, partner2 }: ModuleProps) {
  const target = weddingDate || getDefaultDate();
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const calRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const calc = () => {
      const diff = +new Date(target) - Date.now();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return {
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff / 3600000) % 24),
        minutes: Math.floor((diff / 60000) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
    };
    setTime(calc());
    const t = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(t);
  }, [target]);

  useEffect(() => {
    if (!calOpen) return;
    const handler = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setCalOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [calOpen]);

  if (!mounted) return null;

  const pad = (n: number) => String(n).padStart(2, "0");
  const formattedDate = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  }).format(new Date(target));

  const title = `Mariage de ${partner1 || "Sophie"} & ${partner2 || "Pierre"}`;
  const nd = new Date(target); nd.setDate(nd.getDate() + 1);
  const toStamp = (d: Date) => `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${toStamp(new Date(target))}/${toStamp(nd)}`;

  return (
    <section className="w-full py-16 bg-[#fdf6f0]">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="max-w-2xl mx-auto flex flex-col items-center text-center px-4 gap-8"
      >
        <p className="text-[10px] uppercase tracking-[0.4em] text-[#c97a90]/60 font-sans">
          Le grand jour approche
        </p>

        <div className="flex items-start gap-8 sm:gap-12">
          {[
            { v: time.days, l: "Jours" },
            { v: time.hours, l: "Heures" },
            { v: time.minutes, l: "Minutes" },
            { v: time.seconds, l: "Secondes" },
          ].map((block, i) => (
            <div key={block.l} className="flex flex-col items-center gap-2">
              <motion.span
                key={block.v}
                initial={{ opacity: 0.6, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="text-5xl sm:text-6xl text-[#5a3040] tabular-nums"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic" }}
              >
                {pad(block.v)}
              </motion.span>
              <span className="text-[9px] uppercase tracking-[0.25em] text-[#c97a90]/50 font-sans">
                {block.l}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 w-full max-w-xs">
          <div className="flex-1 h-px bg-[#c97a90]/20" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#5a3040]/50 font-sans whitespace-nowrap">
            {formattedDate}
          </span>
          <div className="flex-1 h-px bg-[#c97a90]/20" />
        </div>

        <div ref={calRef} className="relative">
          <button
            onClick={() => setCalOpen(v => !v)}
            className="flex items-center gap-2 px-6 py-3 rounded-full border border-[#c97a90]/30 text-[#5a3040] text-[11px] uppercase tracking-[0.2em] font-sans hover:bg-[#c97a90]/5 transition-colors"
          >
            <CalendarPlus className="w-3.5 h-3.5 text-[#c97a90]" />
            Ajouter à mon agenda
            <ChevronDown className={`w-3 h-3 text-[#c97a90]/50 transition-transform ${calOpen ? "rotate-180" : ""}`} />
          </button>
          {calOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 bg-white border border-[#c97a90]/20 rounded-2xl shadow-xl overflow-hidden z-50"
            >
              <button onClick={() => { window.open(googleUrl, "_blank"); setCalOpen(false); }}
                className="w-full px-4 py-3 text-left text-sm text-[#5a3040] hover:bg-[#fdf6f0] transition-colors border-b border-[#c97a90]/10">
                Google Calendar
              </button>
              <button onClick={() => {
                const blob = new Blob([generateICS(target, title)], { type: "text/calendar" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a"); a.href = url; a.download = "mariage.ics";
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                URL.revokeObjectURL(url); setCalOpen(false);
              }} className="w-full px-4 py-3 text-left text-sm text-[#5a3040] hover:bg-[#fdf6f0] transition-colors">
                Apple / Outlook (.ics)
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </section>
  );
}
```

- [ ] **Step 5: Créer les modules restants de `theme-floral` (RsvpModule + autres)**

Pour chaque module, créer le fichier avec le design floral (palette `#fdf6f0` / `#c97a90` / `#5a3040`, serif italique, décorations florales SVG légères). Les modules moins visuels (Map, Transport, Accommodation, FAQ, Menu, GiftList, DressCode, GalleryModule, Guestbook, Timeline, IntroVideo, VideoGuestbook, Playlist) doivent respecter la palette et la typographie florale mais peuvent avoir une structure similaire au minimalist.

Créer `RsvpModule.tsx` :

```typescript
// landing/src/components/invitation/themes/theme-floral/RsvpModule.tsx
"use client";

import { submitRsvp } from "@/actions/submit-rsvp";
import { DIETARY_OPTIONS_FR } from "@shared/data/dietary-options";
import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useState } from "react";
import type { ModuleProps } from "../../module-registry";

export function RsvpModule({ weddingId, isDemo = false }: ModuleProps) {
  const [form, setForm] = useState({
    firstName: "", lastName: "",
    attendance: "" as "yes" | "no" | "",
    guests: "0", dietary: "", message: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemo) return;
    setStatus("submitting");
    await submitRsvp({
      weddingId,
      firstName: form.firstName,
      lastName: form.lastName,
      attendance: form.attendance === "yes",
      guestCount: form.attendance === "yes" ? parseInt(form.guests) || 0 : 0,
      dietary: form.dietary,
      message: form.message,
    });
    setStatus("success");
  };

  const inputClass = "w-full bg-transparent border-b border-[#c97a90]/20 py-3 text-sm text-[#5a3040] placeholder:text-[#5a3040]/30 focus:outline-none focus:border-[#c97a90]/50 transition-colors font-sans";

  return (
    <section className="w-full py-16 bg-[#fdf6f0]">
      <div className="max-w-md mx-auto px-4">
        <p className="text-[10px] uppercase tracking-[0.4em] text-[#c97a90]/60 font-sans mb-2 text-center">
          Votre réponse
        </p>
        <h2
          className="text-3xl text-center text-[#5a3040] mb-10"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic" }}
        >
          Serez-vous des nôtres ?
        </h2>

        <AnimatePresence mode="wait">
          {status === "success" ? (
            <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center flex flex-col items-center gap-4">
              <Heart className="w-8 h-8 text-[#c97a90]" fill="currentColor" />
              <p className="text-[#5a3040] font-sans text-sm">Merci pour votre réponse.</p>
            </motion.div>
          ) : (
            <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4">
                <input className={inputClass} placeholder="Prénom" value={form.firstName}
                  onChange={e => setForm({ ...form, firstName: e.target.value })} required />
                <input className={inputClass} placeholder="Nom" value={form.lastName}
                  onChange={e => setForm({ ...form, lastName: e.target.value })} required />
              </div>

              <div className="flex gap-6">
                {[{ val: "yes", label: "Avec joie ✓" }, { val: "no", label: "Dans mon cœur" }].map(({ val, label }) => (
                  <label key={val} className="flex items-center gap-2 text-sm text-[#5a3040]/70 font-sans cursor-pointer">
                    <input type="radio" name="attendance" value={val}
                      checked={form.attendance === val}
                      onChange={() => setForm({ ...form, attendance: val as "yes" | "no" })}
                      className="accent-[#c97a90]" />
                    {label}
                  </label>
                ))}
              </div>

              {form.attendance === "yes" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  className="flex flex-col gap-5">
                  <select className={inputClass} value={form.guests}
                    onChange={e => setForm({ ...form, guests: e.target.value })}>
                    {[0,1,2,3,4].map(n => (
                      <option key={n} value={n}>
                        {n === 0 ? "Venu(e) seul(e)" : `+${n} accompagnant${n > 1 ? "s" : ""}`}
                      </option>
                    ))}
                  </select>
                  <select className={inputClass} value={form.dietary}
                    onChange={e => setForm({ ...form, dietary: e.target.value })}>
                    <option value="">Régime alimentaire (optionnel)</option>
                    {DIETARY_OPTIONS_FR.map((o: any) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </motion.div>
              )}

              <textarea className={`${inputClass} resize-none`} rows={3}
                placeholder="Un message pour les mariés (optionnel)"
                value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />

              <button type="submit" disabled={status === "submitting" || !form.attendance}
                className="self-center px-8 py-3 rounded-full border border-[#c97a90]/40 text-[#5a3040] text-[11px] uppercase tracking-[0.3em] font-sans hover:bg-[#c97a90]/10 disabled:opacity-30 transition-colors mt-2">
                {status === "submitting" ? "Envoi en cours..." : "Envoyer ma réponse"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
```

Pour les modules restants (GalleryModule, MapModule, TimelineModule, DressCodeModule, GiftListModule, GuestbookModule, AccommodationModule, TransportModule, MenuModule, PlaylistModule, FaqModule, IntroVideoModule, VideoGuestbookModule), créer chaque fichier en adaptant le design existant (depuis theme-minimalist) avec la palette florale : remplacer les couleurs Tailwind CSS vars (`text-foreground`, `bg-background`, etc.) par les couleurs hardcodées florale (`text-[#5a3040]`, `bg-[#fdf6f0]`, `border-[#c97a90]/20`).

- [ ] **Step 6: Créer le barrel `index.ts` pour `theme-floral`**

```typescript
// landing/src/components/invitation/themes/theme-floral/index.ts
export { CountdownModule } from "./CountdownModule";
export { RsvpModule } from "./RsvpModule";
export { GalleryModule } from "./GalleryModule";
export { MapModule } from "./MapModule";
export { TimelineModule } from "./TimelineModule";
export { DressCodeModule } from "./DressCodeModule";
export { GiftListModule } from "./GiftListModule";
export { GuestbookModule } from "./GuestbookModule";
export { AccommodationModule } from "./AccommodationModule";
export { TransportModule } from "./TransportModule";
export { MenuModule } from "./MenuModule";
export { PlaylistModule } from "./PlaylistModule";
export { FaqModule } from "./FaqModule";
export { IntroVideoModule } from "./IntroVideoModule";
export { VideoGuestbookModule } from "./VideoGuestbookModule";
export { InvitationHero } from "./InvitationHero";
export { InvitationFooter } from "./InvitationFooter";
export { Divider } from "./Divider";
```

- [ ] **Step 7: Commit**

```bash
git add landing/src/components/invitation/themes/theme-floral/
git commit -m "feat(invitation): add theme-floral components (romantic, serif, rose palette)"
```

---

## Task 4: Créer les composants `theme-boho`

Design : chaleureux, terreux, organique. Palette sable/terracotta (`#a98467` / `#fdf0e5` / `#e8c99a`). Typo Georgia serif, style "free spirit", décorations naturelles (feuilles, branches).

**Files:**
- Create: `landing/src/components/invitation/themes/theme-boho/` (dossier complet)

Même structure que theme-floral. Palette :
- Background: `#fdf0e5`
- Accent: `#a98467`
- Text: `#4a3728`
- Borders: `#a98467/20`
- Font heading: `Georgia, serif` + italic

- [ ] **Step 1: Créer `InvitationHero` boho**

```typescript
// landing/src/components/invitation/themes/theme-boho/InvitationHero.tsx
"use client";

import { motion } from "framer-motion";

interface InvitationHeroProps {
  firstName: string;
  partnerName: string;
  weddingDate?: string | null;
}

export function InvitationHero({ firstName, partnerName, weddingDate }: InvitationHeroProps) {
  const formattedDate = weddingDate
    ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" })
        .format(new Date(weddingDate))
    : "";

  return (
    <section className="h-[100svh] flex flex-col items-center justify-center relative overflow-hidden bg-[#fdf0e5]">
      {/* Décoration branche SVG */}
      <svg className="absolute top-0 right-0 w-72 h-72 opacity-10 text-[#a98467]" viewBox="0 0 200 200" fill="none">
        <path d="M180 10 Q120 60 100 100 Q80 140 20 180" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M160 20 Q140 40 130 60" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <path d="M140 40 Q160 50 170 70" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <circle cx="130" cy="60" r="4" fill="currentColor" opacity="0.4" />
        <circle cx="100" cy="100" r="5" fill="currentColor" opacity="0.3" />
        <circle cx="70" cy="130" r="3" fill="currentColor" opacity="0.4" />
      </svg>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="flex flex-col items-center text-center px-6 gap-5 relative z-10"
      >
        <p className="text-[10px] uppercase tracking-[0.45em] text-[#a98467]/60 font-sans">
          Rejoignez-nous pour célébrer
        </p>
        <h1 className="text-5xl sm:text-6xl md:text-7xl leading-tight text-[#4a3728]"
          style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}>
          {firstName}
          <span className="block text-[#a98467]/40 text-2xl my-3 not-italic font-sans tracking-[0.3em]">
            ✦ & ✦
          </span>
          {partnerName}
        </h1>
        {formattedDate && (
          <p className="text-xs uppercase tracking-[0.35em] text-[#4a3728]/50 font-sans mt-2">
            {formattedDate}
          </p>
        )}
        <div className="flex items-center gap-3 mt-3">
          <div className="h-px w-12 bg-[#a98467]/30" />
          <div className="w-2 h-2 rounded-full bg-[#a98467]/40" />
          <div className="h-px w-12 bg-[#a98467]/30" />
        </div>
      </motion.div>
    </section>
  );
}
```

- [ ] **Step 2: Créer `Divider`, `InvitationFooter`, `CountdownModule`, `RsvpModule` boho**

Même logique que theme-floral mais avec la palette boho. Créer chacun en adaptant les couleurs.

`Divider` boho :
```typescript
// landing/src/components/invitation/themes/theme-boho/Divider.tsx
export function Divider() {
  return (
    <div className="flex items-center justify-center gap-4 py-8">
      <div className="h-px w-12 bg-[#a98467]/25" />
      <span className="text-[#a98467]/40 text-xs">✦</span>
      <div className="h-px w-12 bg-[#a98467]/25" />
    </div>
  );
}
```

`InvitationFooter` boho :
```typescript
// landing/src/components/invitation/themes/theme-boho/InvitationFooter.tsx
interface FooterProps {
  profile: { first_name: string; partner_name: string; wedding_date?: string | null };
}
export function InvitationFooter({ profile }: FooterProps) {
  return (
    <footer className="w-full py-16 text-center bg-[#fdf0e5] border-t border-[#a98467]/10">
      <p className="text-2xl text-[#4a3728]/60"
        style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}>
        {profile.first_name} & {profile.partner_name}
      </p>
      <p className="text-[10px] uppercase tracking-[0.3em] text-[#a98467]/40 mt-3 font-sans">
        Fait avec soin · The Studio Digital
      </p>
    </footer>
  );
}
```

Pour `CountdownModule` et `RsvpModule` boho : mêmes composants que theme-floral mais remplacer toutes les occurrences de `#fdf6f0` → `#fdf0e5`, `#c97a90` → `#a98467`, `#5a3040` → `#4a3728`.

Répéter pour les modules restants.

- [ ] **Step 3: Créer le barrel `index.ts` et les modules restants**

Même structure que theme-floral — créer chaque module avec la palette boho.

- [ ] **Step 4: Commit**

```bash
git add landing/src/components/invitation/themes/theme-boho/
git commit -m "feat(invitation): add theme-boho components (warm, earthy, organic palette)"
```

---

## Task 5: Créer les composants `theme-royal` et `theme-modern`

### `theme-royal`
Design : majestueux, bleu nuit, gold. Palette `#1e3a8a` (bleu) / `#eef2ff` (fond) / `#c4a23a` (gold). Typo Georgia serif, décors géométriques royaux.

### `theme-modern`
Design : audacieux, rose vif, bold. Palette `#be185d` (rose) / `#fff0f5` (fond) / `#1a1a2e` (texte). Typo Montserrat/system-ui bold, très graphique, pas de décorations organiques.

**Files:**
- Create: `landing/src/components/invitation/themes/theme-royal/` (dossier complet)
- Create: `landing/src/components/invitation/themes/theme-modern/` (dossier complet)

- [ ] **Step 1: Créer `InvitationHero` royal**

```typescript
// landing/src/components/invitation/themes/theme-royal/InvitationHero.tsx
"use client";

import { motion } from "framer-motion";

interface InvitationHeroProps {
  firstName: string;
  partnerName: string;
  weddingDate?: string | null;
}

export function InvitationHero({ firstName, partnerName, weddingDate }: InvitationHeroProps) {
  const formattedDate = weddingDate
    ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" })
        .format(new Date(weddingDate))
    : "";

  return (
    <section className="h-[100svh] flex flex-col items-center justify-center relative overflow-hidden bg-[#eef2ff]">
      {/* Bordure dorée décorative */}
      <div className="absolute inset-8 border border-[#c4a23a]/20 pointer-events-none" />
      <div className="absolute inset-10 border border-[#c4a23a]/10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="flex flex-col items-center text-center px-6 gap-5 relative z-10"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="h-px w-8 bg-[#c4a23a]/40" />
          <span className="text-[#c4a23a]/60 text-xs">✦</span>
          <div className="h-px w-8 bg-[#c4a23a]/40" />
        </div>
        <p className="text-[9px] uppercase tracking-[0.6em] text-[#1e3a8a]/50 font-sans">
          Vous êtes cordialement invités
        </p>
        <h1 className="text-5xl sm:text-6xl md:text-7xl leading-tight text-[#1e3a8a]"
          style={{ fontFamily: "Georgia, serif" }}>
          {firstName}
          <span className="block text-[#c4a23a]/60 text-xl my-3 tracking-[0.5em] font-sans font-light">
            &amp;
          </span>
          {partnerName}
        </h1>
        {formattedDate && (
          <p className="text-[10px] uppercase tracking-[0.4em] text-[#1e3a8a]/40 font-sans mt-1">
            {formattedDate}
          </p>
        )}
        <div className="flex items-center gap-3 mt-3">
          <div className="h-px w-16 bg-[#c4a23a]/30" />
          <span className="text-[#c4a23a]/50 text-xs">✦</span>
          <div className="h-px w-16 bg-[#c4a23a]/30" />
        </div>
      </motion.div>
    </section>
  );
}
```

- [ ] **Step 2: Créer `InvitationHero` modern**

```typescript
// landing/src/components/invitation/themes/theme-modern/InvitationHero.tsx
"use client";

import { motion } from "framer-motion";

interface InvitationHeroProps {
  firstName: string;
  partnerName: string;
  weddingDate?: string | null;
}

export function InvitationHero({ firstName, partnerName, weddingDate }: InvitationHeroProps) {
  const formattedDate = weddingDate
    ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" })
        .format(new Date(weddingDate))
    : "";

  return (
    <section className="h-[100svh] flex flex-col items-center justify-center relative overflow-hidden bg-[#fff0f5]">
      {/* Cercle décoratif bold */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full border-2 border-[#be185d]/10 pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full border border-[#be185d]/8 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center text-center px-6 gap-4 relative z-10"
      >
        <p className="text-[9px] uppercase tracking-[0.6em] text-[#be185d]/50 font-sans font-bold">
          Mariage
        </p>
        <h1 className="text-6xl sm:text-7xl md:text-8xl leading-none text-[#1a1a2e] font-black"
          style={{ fontFamily: "'Montserrat', system-ui, sans-serif", letterSpacing: "-0.02em" }}>
          {firstName}
        </h1>
        <div className="w-12 h-1 bg-[#be185d] rounded-full" />
        <h1 className="text-6xl sm:text-7xl md:text-8xl leading-none text-[#1a1a2e] font-black"
          style={{ fontFamily: "'Montserrat', system-ui, sans-serif", letterSpacing: "-0.02em" }}>
          {partnerName}
        </h1>
        {formattedDate && (
          <p className="text-xs uppercase tracking-[0.4em] text-[#1a1a2e]/40 font-sans font-bold mt-4">
            {formattedDate}
          </p>
        )}
      </motion.div>
    </section>
  );
}
```

- [ ] **Step 3: Créer tous les composants restants pour royal et modern**

Pour `theme-royal` — palette : `bg-[#eef2ff]`, accent `#c4a23a` (gold), texte `#1e3a8a`, borders `#c4a23a/20`.
Pour `theme-modern` — palette : `bg-[#fff0f5]`, accent `#be185d`, texte `#1a1a2e`, borders `#be185d/20`.

Créer `Divider`, `InvitationFooter`, `CountdownModule`, `RsvpModule` + tous les modules pour chaque thème.

- [ ] **Step 4: Créer les barrels `index.ts`**

```typescript
// landing/src/components/invitation/themes/theme-royal/index.ts
// (même liste d'exports que theme-floral)
export { CountdownModule } from "./CountdownModule";
// ... etc
```

```typescript
// landing/src/components/invitation/themes/theme-modern/index.ts
export { CountdownModule } from "./CountdownModule";
// ... etc
```

- [ ] **Step 5: Commit**

```bash
git add landing/src/components/invitation/themes/theme-royal/
git add landing/src/components/invitation/themes/theme-modern/
git commit -m "feat(invitation): add theme-royal and theme-modern components"
```

---

## Task 6: Compléter le registre `module-registry.ts`

**Files:**
- Modify: `landing/src/components/invitation/module-registry.ts`

- [ ] **Step 1: Remplir le registre avec les 5 thèmes**

```typescript
// landing/src/components/invitation/module-registry.ts
import type React from "react";

export interface ModuleProps {
  weddingId: string;
  weddingDate?: string | null;
  extras?: Record<string, any> | null;
  config?: Record<string, any> | null;
  partner1?: string;
  partner2?: string;
  isDemo?: boolean;
}

export type ThemeModuleRegistry = Record<
  string,
  Record<string, React.ComponentType<ModuleProps>>
>;

import * as Minimalist from "./themes/theme-minimalist";
import * as Floral from "./themes/theme-floral";
import * as Boho from "./themes/theme-boho";
import * as Royal from "./themes/theme-royal";
import * as Modern from "./themes/theme-modern";

const buildMap = (theme: any): Record<string, React.ComponentType<ModuleProps>> => ({
  countdown: theme.CountdownModule,
  rsvp: theme.RsvpModule,
  gallery: theme.GalleryModule,
  map: theme.MapModule,
  timeline: theme.TimelineModule,
  "dress-code": theme.DressCodeModule,
  "gift-list": theme.GiftListModule,
  guestbook: theme.GuestbookModule,
  accommodation: theme.AccommodationModule,
  transport: theme.TransportModule,
  menu: theme.MenuModule,
  playlist: theme.PlaylistModule,
  faq: theme.FaqModule,
  "intro-video": theme.IntroVideoModule,
  "video-guestbook": theme.VideoGuestbookModule,
});

export const THEME_MODULE_COMPONENTS: ThemeModuleRegistry = {
  "theme-minimalist": buildMap(Minimalist),
  "theme-floral": buildMap(Floral),
  "theme-boho": buildMap(Boho),
  "theme-royal": buildMap(Royal),
  "theme-modern": buildMap(Modern),
};

export const DEFAULT_THEME = "theme-minimalist";

export function getModuleComponent(
  themeId: string,
  moduleId: string
): React.ComponentType<ModuleProps> | null {
  const themeMap =
    THEME_MODULE_COMPONENTS[themeId] ??
    THEME_MODULE_COMPONENTS[DEFAULT_THEME];
  return themeMap?.[moduleId] ?? null;
}
```

- [ ] **Step 2: Commit**

```bash
git add landing/src/components/invitation/module-registry.ts
git commit -m "feat(invitation): complete THEME_MODULE_COMPONENTS registry with all 5 themes"
```

---

## Task 7: Modifier `ModuleRenderer` pour utiliser le registre

**Files:**
- Modify: `landing/src/components/invitation/ModuleRenderer.tsx`

- [ ] **Step 1: Réécrire `ModuleRenderer`**

```typescript
// landing/src/components/invitation/ModuleRenderer.tsx
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getModuleComponent, DEFAULT_THEME } from "./module-registry";
import { Divider as MinimalistDivider } from "./themes/theme-minimalist/Divider";
import { Divider as FloralDivider } from "./themes/theme-floral/Divider";
import { Divider as BohoDivider } from "./themes/theme-boho/Divider";
import { Divider as RoyalDivider } from "./themes/theme-royal/Divider";
import { Divider as ModernDivider } from "./themes/theme-modern/Divider";

const THEME_DIVIDERS: Record<string, React.ComponentType> = {
  "theme-minimalist": MinimalistDivider,
  "theme-floral": FloralDivider,
  "theme-boho": BohoDivider,
  "theme-royal": RoyalDivider,
  "theme-modern": ModernDivider,
};

export async function ModuleRenderer({
  modules,
  weddingId,
  siteId,
  weddingDate,
  extras,
  partner1,
  partner2,
  isDemo,
  themeId = DEFAULT_THEME,
}: {
  modules: string[];
  weddingId: string;
  siteId: string;
  weddingDate?: string | null;
  extras?: any;
  partner1?: string;
  partner2?: string;
  isDemo?: boolean;
  themeId?: string;
}) {
  if (!modules || modules.length === 0) return null;

  const { data: siteModules } = await supabaseAdmin
    .from("site_modules")
    .select("module_id, config, position")
    .eq("site_id", siteId);

  const configMap: Record<string, Record<string, unknown> | null> = {};
  const positionMap: Record<string, number> = {};
  (siteModules || []).forEach(({ module_id, config, position }) => {
    configMap[module_id] = config ?? null;
    positionMap[module_id] = position;
  });

  const knownModules = modules
    .filter((id) => getModuleComponent(themeId, id) !== null)
    .sort((a, b) => (positionMap[a] ?? 99) - (positionMap[b] ?? 99));

  const DividerComponent = THEME_DIVIDERS[themeId] ?? MinimalistDivider;

  return (
    <div className="flex flex-col w-full">
      {knownModules.map((moduleId, index) => {
        const ModuleComponent = getModuleComponent(themeId, moduleId)!;
        const isLast = index === knownModules.length - 1;
        return (
          <div key={moduleId}>
            <ModuleComponent
              weddingId={weddingId}
              weddingDate={weddingDate}
              extras={extras}
              config={configMap[moduleId] ?? null}
              partner1={partner1}
              partner2={partner2}
              isDemo={isDemo}
            />
            {!isLast && <DividerComponent />}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add landing/src/components/invitation/ModuleRenderer.tsx
git commit -m "feat(invitation): ModuleRenderer selects components from theme registry"
```

---

## Task 8: Créer `ThemedInvitationLayout`

**Files:**
- Create: `landing/src/components/invitation/ThemedInvitationLayout.tsx`

- [ ] **Step 1: Créer le composant**

```typescript
// landing/src/components/invitation/ThemedInvitationLayout.tsx
import { InvitationHero as MinimalistHero } from "./themes/theme-minimalist/InvitationHero";
import { InvitationHero as FloralHero } from "./themes/theme-floral/InvitationHero";
import { InvitationHero as BohoHero } from "./themes/theme-boho/InvitationHero";
import { InvitationHero as RoyalHero } from "./themes/theme-royal/InvitationHero";
import { InvitationHero as ModernHero } from "./themes/theme-modern/InvitationHero";
import { InvitationFooter as MinimalistFooter } from "./themes/theme-minimalist/InvitationFooter";
import { InvitationFooter as FloralFooter } from "./themes/theme-floral/InvitationFooter";
import { InvitationFooter as BohoFooter } from "./themes/theme-boho/InvitationFooter";
import { InvitationFooter as RoyalFooter } from "./themes/theme-royal/InvitationFooter";
import { InvitationFooter as ModernFooter } from "./themes/theme-modern/InvitationFooter";
import { ModuleRenderer } from "./ModuleRenderer";
import { ModulesWrapper } from "./ModulesWrapper";
import { ScrollToTop } from "./ScrollToTop";

const HEROES: Record<string, React.ComponentType<any>> = {
  "theme-minimalist": MinimalistHero,
  "theme-floral": FloralHero,
  "theme-boho": BohoHero,
  "theme-royal": RoyalHero,
  "theme-modern": ModernHero,
};

const FOOTERS: Record<string, React.ComponentType<any>> = {
  "theme-minimalist": MinimalistFooter,
  "theme-floral": FloralFooter,
  "theme-boho": BohoFooter,
  "theme-royal": RoyalFooter,
  "theme-modern": ModernFooter,
};

interface ThemedInvitationLayoutProps {
  themeId: string;
  firstName: string;
  partnerName: string;
  weddingDate?: string | null;
  profile: { first_name: string; partner_name: string; wedding_date?: string | null };
  modules: string[];
  weddingId: string;
  siteId: string;
  extras?: any;
  isDemo?: boolean;
}

export async function ThemedInvitationLayout({
  themeId,
  firstName,
  partnerName,
  weddingDate,
  profile,
  modules,
  weddingId,
  siteId,
  extras,
  isDemo,
}: ThemedInvitationLayoutProps) {
  const Hero = HEROES[themeId] ?? MinimalistHero;
  const Footer = FOOTERS[themeId] ?? MinimalistFooter;

  return (
    <div className="font-sans">
      <Hero firstName={firstName} partnerName={partnerName} weddingDate={weddingDate} />
      <ModulesWrapper>
        <main id="modules" className="max-w-4xl mx-auto py-20 px-4 relative z-10">
          <ModuleRenderer
            modules={modules}
            weddingId={weddingId}
            siteId={siteId}
            weddingDate={weddingDate}
            extras={extras}
            partner1={firstName}
            partner2={partnerName}
            isDemo={isDemo}
            themeId={themeId}
          />
        </main>
      </ModulesWrapper>
      <Footer profile={profile} />
      <ScrollToTop />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add landing/src/components/invitation/ThemedInvitationLayout.tsx
git commit -m "feat(invitation): add ThemedInvitationLayout RSC"
```

---

## Task 9: Mettre à jour `invitation/[weddingCode]/page.tsx`

**Files:**
- Modify: `landing/src/app/[locale]/invitation/[weddingCode]/page.tsx`

- [ ] **Step 1: Remplacer le JSX par `ThemedInvitationLayout`**

Dans `page.tsx`, remplacer le bloc :
```tsx
<div className="bg-background text-foreground font-sans">
  <InvitationHero ... />
  <ModulesWrapper>
    <main ...>
      <ModuleRenderer ... />
    </main>
  </ModulesWrapper>
  <InvitationFooter ... />
  <ScrollToTop />
</div>
```

Par :
```tsx
<ThemedInvitationLayout
  themeId={siteConfig.theme_id ?? "theme-minimalist"}
  firstName={profile.first_name}
  partnerName={profile.partner_name || ""}
  weddingDate={profile.wedding_date}
  profile={profile}
  modules={siteConfig.modules}
  weddingId={weddingId}
  siteId={siteConfig.id}
  extras={siteConfig.extras}
  isDemo={isDemo}
/>
```

- [ ] **Step 2: Mettre à jour les imports dans `page.tsx`**

Supprimer les imports de `InvitationHero`, `InvitationFooter`, `ModuleRenderer`, `ModulesWrapper`, `ScrollToTop`.

Ajouter :
```tsx
import { ThemedInvitationLayout } from "@/components/invitation/ThemedInvitationLayout";
```

- [ ] **Step 3: Commit**

```bash
git add landing/src/app/[locale]/invitation/[weddingCode]/page.tsx
git commit -m "feat(invitation): use ThemedInvitationLayout in invitation page"
```

---

## Task 10: Migration DB — `animation_id` dans `sites` + wire complet

**Files:**
- Create: `supabase/migrations/20260326120000_add_animation_id_to_sites.sql`
- Modify: `landing/src/actions/create-wedding.ts`
- Modify: `landing/src/app/[locale]/invitation/[weddingCode]/page.tsx`
- Modify: `landing/src/components/invitation/InvitationIntro.tsx` (placeholder vidéo)

- [ ] **Step 1: Créer la migration**

```sql
-- supabase/migrations/20260326120000_add_animation_id_to_sites.sql
ALTER TABLE sites ADD COLUMN IF NOT EXISTS animation_id TEXT DEFAULT 'envelope-classic';
```

- [ ] **Step 2: Appliquer et regénérer les types**

```bash
npx supabase migration up
npx supabase gen types typescript --local > shared/types/supabase.ts
```

- [ ] **Step 3: Modifier `CreateWeddingData` dans `create-wedding.ts`**

Ajouter `animationId?: string` dans l'interface et l'insérer dans la query `sites` :
```typescript
// Dans l'interface :
animationId?: string;

// Dans l'INSERT sites, ajouter :
animation_id: data.animationId || "envelope-classic",
```

- [ ] **Step 4: Trouver le checkout et passer `animationId`**

```bash
grep -r "createWedding(" landing/src --include="*.tsx" -l
```

Ouvrir le fichier et ajouter `animationId: store.animation` dans l'appel.

- [ ] **Step 5: Récupérer `animation_id` dans `page.tsx`**

Modifier la query `sites` pour inclure `animation_id` :
```typescript
.select("id, theme_id, animation_id, modules, plan_id, extras, languages, is_demo")
```

Passer `animationId={siteConfig.animation_id ?? undefined}` à `InvitationPageClient`.

- [ ] **Step 6: Préparer `InvitationPageClient` pour `animationId`**

Ajouter le prop dans l'interface :
```typescript
animationId?: string;
// TODO: Map animationId → videoSrc when video assets are available
// const ANIMATION_VIDEOS: Record<string, string> = {}
```

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations/20260326120000_add_animation_id_to_sites.sql
git add shared/types/supabase.ts
git add landing/src/actions/create-wedding.ts
git add landing/src/app/[locale]/invitation/[weddingCode]/page.tsx
git add landing/src/components/invitation/InvitationPageClient.tsx
git commit -m "feat(db): add animation_id to sites, wire through create-wedding and invitation page"
```

---

## Task 11: Build final et vérification

- [ ] **Step 1: Build complet**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie
npm run build:landing 2>&1 | tail -40
```

Expected: zéro erreur TypeScript, zéro import manquant.

- [ ] **Step 2: Tester une invitation en local**

```bash
npm run dev:landing
```

Ouvrir `http://localhost:3002/fr/invitation/[slug-existant]` — doit afficher `theme-minimalist` (défaut, comportement identique à avant).

- [ ] **Step 3: Tester le changement de thème via DB**

Modifier manuellement `sites.theme_id = 'theme-floral'` pour un mariage de test en Supabase Studio, recharger la page — les composants floral doivent s'afficher.

- [ ] **Step 4: Commit final**

```bash
git add -A
git commit -m "chore(invitation): verify themed components system end-to-end"
```

---

## Architecture finale

```
sites.theme_id = "theme-floral"
      ↓
ThemedInvitationLayout
  ├─ Hero     → theme-floral/InvitationHero
  ├─ Footer   → theme-floral/InvitationFooter
  └─ ModuleRenderer(themeId="theme-floral")
       ├─ "countdown" → theme-floral/CountdownModule
       ├─ "rsvp"      → theme-floral/RsvpModule
       └─ "gallery"   → theme-floral/GalleryModule

sites.theme_id = "theme-minimalist"
      ↓
ThemedInvitationLayout
  ├─ Hero     → theme-minimalist/InvitationHero  (actuels déplacés)
  └─ ModuleRenderer(themeId="theme-minimalist")
       └─ tous les modules → theme-minimalist/

IDs thèmes configurateur → IDs thèmes composants : identiques.
Aucun thème ne partage de composant avec un autre.
```
