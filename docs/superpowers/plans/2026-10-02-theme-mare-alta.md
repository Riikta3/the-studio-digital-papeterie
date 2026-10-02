# Maré Alta Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Read `2026-10-02-theme-port-playbook.md` first** — it holds the conventions, code skeletons and verification protocol every step below relies on.

**Goal:** Port the designer's "Maré Alta" invitation — an embroidered garden on linen, sage palette, centred 720px column — into the app as the `mare-alta` theme, fully variable, translated in nine languages, wired to guest submissions and to the editor.

**Architecture:** One theme folder. The designer's stylesheet is scoped as it is by the CSS pipeline (`themes:port-css`), with the source's `main` moved onto a `.ma-column` so the sage backdrop (the theme root) and the 720px column stay two elements. Sections are isomorphic components that keep the designer's markup and replace every literal with `InvitationData`, a catalogue string, or a slot. Seating and guest photos are not rebuilt: two blocks link to the existing Jour J pages through `dayOf`.

**Tech Stack:** Next.js 16, React 19, TypeScript, next-intl 4, lucide-react, `next/font`, the shared groundwork (hooks, `Reveal`, `ScrollToButton`, pipeline, checks).

**Spec:** `docs/superpowers/specs/2026-10-02-three-themes-design.md` (D1–D5, D7–D9, *Theme A*).
**Playbook:** `docs/superpowers/plans/2026-10-02-theme-port-playbook.md`.
**Source (read-only):** `/Users/tarik.klezo/Downloads/Invitation_Mare_Alta_FINAL_Tarik_2026-09-30` — markup `app/page.tsx` (1 100 lines, one client component), CSS `app/globals.css` (4 836 lines, 12 stacked layers; the last `:root` and `body` at lines 3117–3132 give the sage palette), assets `public/`.
**Live reference:** `https://sienna-malo-mare-alta.emiliethestudio.chatgpt.site`.

## Global Constraints

- Folder `landing/src/components/invitation/themes/mare-alta/`; id `mare-alta`; camelCase `mareAlta`; PascalCase `MareAlta`; prefix `ma`; scope class `theme-mare-alta`; catalogue namespace `Invitation.mareAlta`; font variables `--font-ma-display`, `--font-ma-sans`, `--font-ma-serif`; column class `ma-column`; the root element carries `data-theme-root=""`.
- Manifest: name `Maré Alta`; description `Broderie sur lin ivoire, pins parasols et glycines : un mariage dans une villa de l'Atlantique.`; `accentColor` `#4d5845`; `cover` `/themes/mare-alta/cover.webp`.
- `supports` (literal strings, in this order): `"countdown"`, `"timeline"`, `"dress-code"`, `"map"`, `"accommodation"`, `"transport"`, `"menu"`, `"playlist"`, `"gift-list"`, `"rsvp"`, `"faq"`.
- Section order, as designed: hero → countdown → map → timeline → dress-code → accommodation → transport → menu → playlist → gift-list → rsvp → photos block (Jour J) → faq → table block (Jour J) → footer.
- **Designer's constraints to keep** (their handoff note): the embroidered visuals whole, never fragments or crops; the two vinyl discs whole and rotating independently; the hero's twinkling lights only on foliage; the section order; mobile as the reference with the desktop column centred. **Do not reintroduce** curtains, swans, a red background, or the in-page carpool module.
- Dropped, and not to be drawn: audio player (play/pause, "EN ÉCOUTE", progress, the four fixed tracks), IBAN/BIC reveal, gift progress bar, GPS stamp, e-mail and phone fields, welcome-dinner/brunch checkboxes, arrival and lodging fields, children's ages, "modifiable jusqu'au…", "Ouvrir le guide complet", "Modifier ma réponse", the jar of messages, "Trouve ta place" as an in-page finder, the floating nav (hidden by the designer's own final CSS).
- Nothing of the demo wedding (Sienna, Malo, Comporta, Casa Maré Alta, Lisbonne, the hotels, the tracks…) outside `demo-data.ts`; `theme-checks.test.mjs` enforces it for `mare-alta`.
- Playbook §1 applies in full: never commit, own only `THEME`, `landing/public/themes/mare-alta/` and `Invitation.mareAlta`.

## Review Focus

- **Heavy fixture, adults-only, long names** — "Marie-Charlotte & Jean-Baptiste" in the hero at 390px must not break the h1; the RSVP must show no child field when `allowChildren` is false; 12 FAQ entries and 10 hotels must not overflow (Tasks 3, 5, 7).
- **Minimal fixture** — a wedding with only names, a date and a venue name: every section that has nothing to show renders nothing, no empty heading, no `undefined` text, the footer still closes the page (Tasks 3–8).
- **Foliage lights** — the SVG is drawn on a 1024×1536 viewBox with `xMidYMid slice` over an `object-fit: cover` image; at 390px and 1920px the lights must still sit on the trees, not on the sky (Task 3).
- **Scratch cards** — drawn on canvas at 146×112 CSS px: they must work with touch and mouse, show `--` before mount with no hydration warning, and state their value to a screen reader (Task 3).
- **Jour J blocks** — rendered when `dayOf` is present; with no `weddingId` (demo, preview) the buttons are inert, never links; with one, they link to `/jourj/<slug>/ma-table` and `/photos` through the locale-aware `Link` (Task 8).
- **Arabic** — the column is mirrored; the top line, the RSVP aside and the agenda cards must read right-to-left without overlap (Task 10).

---

## Appendix A — French catalogue source (namespace `Invitation.mareAlta`)

One table, referenced by every task. `[slot …]` marks a message the editor offers for rewriting (declared in `editor.ts`). All defaults are neutral: no place, no date, no name. Plurals are ICU. "(ciao)" means: start from the same key family in `Invitation.ciaoAmore` (already translated in the nine catalogues) and adapt only what is in ciao-amore's voice.

| Key | French |
|---|---|
| `hero.imageAlt` | Une villa entièrement brodée sur un lin ivoire |
| `hero.eyebrow` | Nous nous marions *(shown only when `copy.heroKicker` is empty)* |
| `hero.cta` | Découvrir **[slot hero.cta]** |
| `countdown.eyebrow` | Le temps jusqu'à nous **[slot countdown.eyebrow]** |
| `countdown.titleLine1` / `titleLine2` | Rendez-vous / dans… **[slot countdown.title, multiline]** |
| `countdown.note` | Chaque seconde nous rapproche de vous retrouver. **[slot countdown.note]** |
| `countdown.scratch` | GRATTEZ *(drawn on the canvas)* |
| `countdown.unitDays` / `unitHours` / `unitMinutes` / `unitSeconds` | `{count, plural, one {jour} other {jours}}` / `…{heure} other {heures}` / `…{minute} other {minutes}` / `…{seconde} other {secondes}` |
| `countdown.cardLabel` | `{value} {unit} avant le mariage` |
| `map.eyebrow` | Destination **[slot map.eyebrow]** |
| `map.imageAlt` | Une maison blanche entre pins, dunes et mer, brodée sur lin |
| `map.route` / `map.calendar` | Itinéraire / Ajouter |
| `timeline.eyebrow` | Le récit du grand jour **[slot timeline.eyebrow]** |
| `timeline.titleLine1` / `titleLine2` | Du premier regard / à la dernière danse **[slot timeline.title, multiline]** |
| `timeline.sign` | Chaque instant a son rythme **[slot timeline.sign]** |
| `timeline.alsoTitle` | Et aussi *(heading of the extra events, Task 4)* |
| `dressCode.eyebrow` | Dress code **[slot dress-code.eyebrow]** |
| `dressCode.imageAlt` | Inspiration vestimentaire : une robe fluide et un costume d'été |
| `stays.eyebrow` | Dormir tout près **[slot accommodation.eyebrow]** |
| `stays.titleLine1` / `titleLine2` | Posez / les valises **[slot accommodation.title, multiline]** |
| `stays.artAlt` | Une valise brodée, des lunettes de soleil et un foulard prêts pour le voyage |
| `stays.address` / `stays.call` / `stays.more` / `stays.less` / `stays.code` | Voir l'adresse / Appeler / Voir plus d'options / Masquer / Code {code} |
| `transport.eyebrow` | Votre carnet de voyage **[slot transport.eyebrow]** |
| `transport.titleLine1` / `titleLine2` | Pour voyager / l'esprit léger **[slot transport.title, multiline]** |
| `transport.intro` | L'arrivée fait déjà partie de la fête. Voici l'essentiel pour voyager sereinement. **[slot transport.intro]** |
| `transport.open` / `transport.decorLabel` | Ouvrir / Passeport, tampons d'aéroport, étiquette de valise et avion brodés |
| `menu.eyebrow` | Table d'un soir **[slot menu.eyebrow]** |
| `menu.titleLine1` / `titleLine2` | Le menu / du grand jour **[slot menu.title, multiline]** |
| `menu.scatterLabel` | Vaisselle, citron, verre et linge de table brodés |
| `playlist.eyebrow` | Construisons la bande-son ensemble **[slot playlist.eyebrow]** |
| `playlist.titleLine1` / `titleLine2` | Quel morceau / vous fera danser ? **[slot playlist.title, multiline]** |
| `playlist.intro` | Ajoutez le titre que vous voulez absolument entendre pendant la soirée. **[slot playlist.intro]** |
| `playlist.discsLabel` | Deux disques brodés en rotation |
| `playlist.*` (search label, placeholder, loading, no result, error, pick, remove, send, sending, thanks, limit) | (ciao) `Invitation.ciaoAmore.playlist` |
| `gifts.eyebrow` | Le plus beau cadeau, c'est vous **[slot gift-list.eyebrow]** |
| `gifts.cta` | Participer *(link wording when `gifts.linkLabel` is empty)* |
| `rsvp.eyebrow` | Votre réponse **[slot rsvp.eyebrow]** |
| `rsvp.titleLine1` / `titleLine2` | Serez-vous / des nôtres ? **[slot rsvp.title, multiline]** |
| `rsvp.deadlineLabel` | Merci de répondre avant le |
| `rsvp.step1` / `step2` / `step3` | Votre réponse / Avec qui venez-vous ? / Un petit mot |
| `rsvp.attendYes` / `attendNo` | Avec joie, je serai là / Je ne pourrai pas être là |
| `rsvp.thanksEyebrow` / `thanksTitle` / `thanksBody` | Réponse envoyée / C'est bien noté ! / Merci. Votre réponse a rejoint notre carnet d'invités. |
| `rsvp.*` (name label+placeholder, party select, partner name, children count, child field, dietary, message, submit, pending, error) | (ciao) `Invitation.ciaoAmore.rsvp` |
| `faq.eyebrow` | Tout ce qu'il faut savoir **[slot faq.eyebrow]** |
| `faq.title` | Questions fréquentes **[slot faq.title]** *(one message; `Lines` handles a break the couple adds)* |
| `faq.childrenQuestion` / `childrenAdultsOnly` / `childrenWelcome` | (ciao) `Invitation.ciaoAmore.faq` |
| `footer.eyebrow` | On a tellement hâte **[slot footer.eyebrow]** |
| `footer.top` | Revenir en haut |
| `footer.tableEyebrow` | À découvrir le jour J **[slot footer.tableEyebrow]** |
| `footer.tableTitle` | Trouve ta place **[slot footer.tableTitle]** |
| `footer.tableBody` | Scannez le QR code à l'entrée ou cherchez votre prénom : votre table apparaîtra, avec le plan de salle. **[slot footer.tableBody]** |
| `footer.tableCta` / `footer.photosCta` / `footer.photosHint` / `footer.soon` | Ouvrir le plan de table / Partager mes photos / Photos et vidéos, partagées avec les mariés / Disponible le jour J |
| `footer.photosEyebrow` | Après la fête **[slot footer.photosEyebrow]** |
| `footer.photosTitle` | Vos yeux, vos souvenirs **[slot footer.photosTitle]** |
| `footer.photosBody` | Le lendemain, déposez ici vos photos et découvrez la galerie partagée. **[slot footer.photosBody]** |

---

### Task 1: Assets, fonts and the generated stylesheet

**Files:**
- Create: `landing/public/themes/mare-alta/*.webp` (16 files)
- Create: `landing/src/components/invitation/themes/mare-alta/fonts.ts`
- Create (generated): `landing/src/components/invitation/themes/mare-alta/mare-alta.css`
- Scratch (outside the repo): `$SCRATCH/mare-alta-css.json`, `$SCRATCH/mare-alta-assets.txt`

**Interfaces:**
- Produces: `mareAltaFontVars: string` (from `fonts.ts`); the generated `.theme-mare-alta …` stylesheet; assets at `/themes/mare-alta/<name>.webp`.
- Consumes: the pipeline and helper from the playbook (§3.1–3.3).

- [ ] **Step 1: Convert the assets**

`SRC=/Users/tarik.klezo/Downloads/Invitation_Mare_Alta_FINAL_Tarik_2026-09-30/public`, `DEST=landing/public/themes/mare-alta`. Run the playbook's `referenced-assets.mjs` on `…/app/globals.css` and `…/app/page.tsx`, then convert as in §3.1.

Expected: **17 of 18** files referenced (all but `favicon.svg`, which the app has its own of). **Delete `embroidered-memory-jar-v7` from the list before converting** — the jar is not drawn — leaving these 16, all becoming `.webp`: `couture-objects-v2`, `embroidered-celebration-v5`, `embroidered-destination-v5`, `embroidered-dresscode-v5`, `embroidered-full-vinyls-v8`, `embroidered-hero-no-curtains-v4`, `embroidered-luggage-sunglasses-v9` (already WebP, copied), `embroidered-luggage-tag-sm-v10`, `embroidered-menu-objects-v8`, `embroidered-menu-v6`, `embroidered-photo-background-v8`, `embroidered-playlist-v6`, `embroidered-portuguese-table-v6`, `embroidered-rsvp-frame-v9` (copied), `embroidered-timeline-v3`, `embroidered-travel-atlas-v9` (copied). `embroidered-photo-background-v8` is only referenced by a rule for a section that is not drawn; it is copied anyway because the pipeline refuses a `url()` to a missing file.

Run `du -sh landing/public/themes/mare-alta` (was 43 MB of PNG; expect under 6 MB) and note it for the report.

- [ ] **Step 2: Write the fonts**

Create `landing/src/components/invitation/themes/mare-alta/fonts.ts`:

```ts
import { Bodoni_Moda, Cormorant_Garamond, Jost } from "next/font/google";

/**
 * Fonts for the "Maré Alta" theme.
 *
 * The designer's sheet names system faces: Didot and Avenir Next (Apple only)
 * and Georgia. Apple devices keep exactly what was approved — the pipeline
 * leaves those names first — and these web faces come right after them, so
 * Windows and Android stop falling back to a generic serif and Arial.
 *
 * Apply `mareAltaFontVars` on the theme root, next to `.theme-mare-alta`.
 */

/** Headings, the couple's names, the countdown digits: Didot's stand-in. */
const display = Bodoni_Moda({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ma-display",
});

/** Eyebrows, labels, buttons, form controls: Avenir Next's stand-in. */
const sans = Jost({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-ma-sans",
});

/** Running text and italics: Georgia's stand-in on devices without it. */
const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-ma-serif",
});

export const mareAltaFontVars = [display.variable, sans.variable, serif.variable].join(" ");
```

- [ ] **Step 3: Write the pipeline config and run it**

Create `$SCRATCH/mare-alta-css.json`:

```json
{
  "source": "/Users/tarik.klezo/Downloads/Invitation_Mare_Alta_FINAL_Tarik_2026-09-30/app/globals.css",
  "out": "/Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie/landing/src/components/invitation/themes/mare-alta/mare-alta.css",
  "scope": "theme-mare-alta",
  "columnClass": "ma-column",
  "dropImports": ["tw-animate-css", "shadcn"],
  "assets": [
    "/embroidered-=/themes/mare-alta/embroidered-",
    "/couture-objects=/themes/mare-alta/couture-objects",
    ".png=.webp"
  ],
  "fonts": [
    { "family": "Didot", "variable": "--font-ma-display", "position": "after" },
    { "family": "Avenir Next", "variable": "--font-ma-sans", "position": "after" },
    { "family": "Avenir", "variable": "--font-ma-sans", "position": "after" },
    { "family": "Georgia", "variable": "--font-ma-serif", "position": "after" }
  ],
  "decor": {
    "S · M": "--ma-menu-monogram",
    "CASA MARÉ ALTA · 19 JUIN 2027": "--ma-menu-footer"
  },
  "publicDir": "/Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie/landing/public",
  "markup": ["/Users/tarik.klezo/Downloads/Invitation_Mare_Alta_FINAL_Tarik_2026-09-30/app/page.tsx"]
}
```

Run `mkdir -p landing/src/components/invitation/themes/mare-alta && npm run themes:port-css -w landing -- $SCRATCH/mare-alta-css.json`.

Expected: `wrote …/mare-alta.css (… KB)` and a count of classes the markup never uses (about 22; informational). If it fails, read the message: an `outside` selector, an undefined variable, a missing asset or an unmapped `content:` word. Fix the **config** (add the missing asset to `public/`, map the word) and re-run; never edit the output.

- [ ] **Step 4: Check the output by eye**

```bash
CSS=landing/src/components/invitation/themes/mare-alta/mare-alta.css
grep -c "" $CSS
grep -nE "^(body|html|main)\b" $CSS            # expect nothing: they became the root / the column
grep -n "ma-column" $CSS | head -5             # the 720px column, its shadow, its ivory ground
grep -n "^\.theme-mare-alta *{" $CSS | head -5 # :root and body folded onto the root
grep -n "var(--font-ma-" $CSS | head -5
grep -n "content: *var(--ma-" $CSS             # exactly two lines: the menu crest and footer
grep -c "@import" $CSS                         # expect 0
```

Expected: no bare `body`/`html`/`main`; the `.theme-mare-alta .ma-column` block holds `max-width: 720px` and the ivory background; the last `body { background: #747e6d }` of the designer's cascade lands on `.theme-mare-alta`; both `content: var(--ma-…)` lines are present.

- [ ] **Step 5: Checkpoint**

Run: `npx tsc --noEmit -p landing/tsconfig.json 2>&1 | grep "themes/mare-alta/"` (empty) and `node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs --test landing/src/lib/theme-checks.test.mjs` (the `mare-alta` leak test now scans the generated sheet — expect PASS; the comments naming "Portugal" were stripped). Do not commit.

---

### Task 2: Demo data, manifest and root skeleton

**Files:**
- Create: `…/mare-alta/demo-data.ts`
- Create: `…/mare-alta/theme.config.ts`
- Create: `…/mare-alta/MareAltaRoot.tsx`
- Create: `…/mare-alta/responsive.css` (the safety nets; grows in later tasks)
- Create: `…/mare-alta/editor.ts` (starts with the empty list; each section task appends its slots)
- Create: `…/mare-alta/sections/Section.tsx`, `sections/SectionTitle.tsx`

**Interfaces:**
- Produces:
  - `MARE_ALTA_DEMO: InvitationData`
  - `mareAltaTheme: ThemeManifest`
  - `MareAltaRoot({ data })`
  - `Section({ id?, className, editorSection?, children })` — a `Reveal` section (`revealedClass="in-view"`).
  - `SectionTitle({ eyebrow, title, intro?, rhythm? })` and `RhythmTitle({ text, firstClass?, secondClass? })`.
- Consumes: `Reveal`, `JsFlag`, `monogramOf`, `formatFrenchDate`, `cssString`, `slot`, `Lines`, `demoStartsAt`, `demoDate`.

- [ ] **Step 1: Write `Section.tsx` and `SectionTitle.tsx`**

`sections/Section.tsx`:

```tsx
import type { ReactNode } from "react";

import { Reveal } from "../../reveal";

/**
 * A designer section: the `.paper-section` / `.coral-section` / `.night-section`
 * ground, hidden until seen.
 *
 * The designer's page added `in-view` to every `section:not(.hero)` from one
 * global observer; each section observes itself instead (`Reveal`), so the
 * theme works in the editor's preview next to other components.
 */
export function Section({
  id,
  className,
  editorSection,
  children,
}: {
  id?: string;
  className: string;
  /** An id from `shared/data/invitation-sections.ts`; omit for a block with no tab. */
  editorSection?: string;
  children: ReactNode;
}) {
  return (
    <Reveal
      as="section"
      id={id}
      className={className}
      revealedClass="in-view"
      threshold={0.16}
      data-editor-section={editorSection}
    >
      {children}
    </Reveal>
  );
}
```

`sections/SectionTitle.tsx` — port of `page.tsx:216–234` plus the two-line helper:

```tsx
import type { ReactNode } from "react";

/**
 * Eyebrow, title and intro of a section. `rhythm` sets the title in the
 * designer's alternating faces (a serif line, an italic or sans line).
 */
export function SectionTitle({
  eyebrow,
  title,
  intro,
  rhythm = false,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  intro?: ReactNode;
  rhythm?: boolean;
}) {
  return (
    <div className="section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className={rhythm ? "type-rhythm" : undefined}>{title}</h2>
      {intro ? <p className="section-intro">{intro}</p> : null}
    </div>
  );
}

/**
 * A two-line heading in two faces: the first line gets `firstClass`, the rest
 * `secondClass`. Fed by a slot value or by the catalogue's two lines joined with
 * a line break, so a couple who rewrites it keeps the rhythm.
 */
export function RhythmTitle({
  text,
  firstClass = "title-serif",
  secondClass = "title-italic",
}: {
  text: string;
  firstClass?: string;
  secondClass?: string;
}) {
  const [first, ...rest] = text.split("\n");
  return (
    <>
      <span className={firstClass}>{first}</span>
      {rest.length > 0 ? <span className={secondClass}>{rest.join(" ")}</span> : null}
    </>
  );
}
```

- [ ] **Step 2: Write the demo data**

Create `demo-data.ts`. It is the only file allowed to hold the designer's wedding. Every field a section draws must be filled (playbook §2.5).

```ts
import { demoDate, demoStartsAt } from "../demo-date";
import type { InvitationData } from "../types";

/**
 * The showcase wedding of "Maré Alta": the designer's own, kept whole.
 *
 * This is the only file of the theme that may name the demo couple, the demo
 * venue and the places around it. Real weddings never read it.
 */

const STARTS_AT = demoStartsAt(6, "17:00", "+01:00");
const WEDDING_DAY = demoDate(6);

/** The day before `WEDDING_DAY`, for the welcome dinner. */
function dayBefore(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

/** The day after, for the brunch. */
function dayAfter(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export const MARE_ALTA_DEMO: InvitationData = {
  couple: { partner1: "Sienna", partner2: "Malo", monogram: "S · M" },
  event: { startsAt: STARTS_AT, rsvpDeadline: demoDate(4), timezone: "Europe/Lisbon" },
  venue: {
    name: "Casa Maré Alta",
    city: "Comporta",
    country: "Portugal",
    address: "Estrada da Praia, 7580-680 Comporta, Portugal",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Comporta%20Portugal",
    access: [
      { mode: "Arriver", details: ["Lisbonne", "Aéroport Humberto Delgado, puis 1 h 20 de route."] },
      {
        mode: "Rejoindre",
        details: ["Transfert privé", "Départs groupés vendredi et samedi sur réservation."],
        link: { url: "https://transferts.example.org/sienna-malo", label: "Réserver un transfert" },
      },
      { mode: "Prévoir", details: ["24° en juin", "Du soleil la journée et une étole légère après minuit."] },
      { mode: "Prolonger", details: ["Les pieds dans le sable", "Nos plages, tables et balades préférées autour de Comporta."] },
    ],
  },
  copy: {
    heroKicker: "Nous nous marions",
    venueIntro: "Une maison blanche cachée entre les rizières, les dunes et l'océan.",
    scheduleIntro: "Une journée en cinq chapitres, pensée comme une promenade de la lumière vers les étoiles.",
    staysIntro: "Trois maisons entre pins et sable, toutes desservies par la navette.",
    rsvpIntro: "Nous avons hâte de vivre ce week-end au Portugal avec vous.",
    playlistIntro: "Ajoutez le titre que vous voulez absolument entendre pendant la soirée.",
    closing: "Merci d'être là.",
    footerNote: "Avec tout notre amour",
  },
  schedule: [
    { day: 1, time: "16:45", title: "Le jardin s'éveille", description: "Accueil sous les pins, eau fraîche et premiers embruns", event: "wedding-day" },
    { day: 1, time: "17:00", title: "Nos oui face à l'océan", description: "Une cérémonie entourée de nos familles et de nos amis", icon: "ceremony", event: "wedding-day" },
    { day: 1, time: "18:15", title: "Le jardin en fête", description: "Porto tonic, bouchées atlantiques et musique live", icon: "cocktail", event: "wedding-day" },
    { day: 1, time: "20:30", title: "À la grande table", description: "Un dîner portugais éclairé par cent bougies", icon: "dinner", event: "wedding-day" },
    { day: 1, time: "23:30", title: "Sous les étoiles", description: "Notre première danse, puis la vôtre jusqu'au matin", icon: "party", event: "wedding-day" },
  ],
  events: [
    { kind: "welcome-dinner", name: "Welcome dinner", date: dayBefore(WEDDING_DAY), time: "20:00", address: "Terrasse de la Casa Maré Alta", description: "Une table commune pour se retrouver la veille.", day: 1 },
    { kind: "wedding-day", name: "Le mariage", date: WEDDING_DAY, time: "16:45", day: 1 },
    { kind: "brunch", name: "Brunch", date: dayAfter(WEDDING_DAY), time: "11:30", address: "Jardin de la Casa Maré Alta", description: "Un dernier moment ensemble, au jardin.", dressCode: "Lin et pieds nus", day: 2 },
  ],
  dressCode: {
    title: "Élégance au jardin",
    body: "Habillez-vous pour un dîner d'été portugais : chic, fluide et lumineux.",
    colors: ["#8a9a7b", "#f3ecdd", "#b8a6c9"],
    note: "On aime les volumes fluides, le lin qui vit, les bijoux sculpturaux, les couleurs du jardin et les détails précieux.\n\nOn évite le total look blanc. Pour le reste : venez spectaculaire, mais venez vous-même.",
  },
  stays: [
    { name: "Villa Pinhal", city: "Comporta", address: "Rua dos Pinhais 12", distance: "7 min", bookingCode: "SIENNA", url: "https://villa-pinhal.example.org" },
    { name: "Casa Areia", city: "Carvalhal", address: "Rua da Areia 4", distance: "11 min", offer: "-10 % avant mars", phone: "+351 265 000 111" },
    { name: "Cabana do Sal", city: "Comporta", address: "Caminho do Sal 2", distance: "14 min", offer: "Dernières disponibilités" },
  ],
  menu: {
    sections: [
      { title: "Ouverture", items: [{ title: "Tomate cœur de bœuf, pêche blanche, huile fumée" }] },
      { title: "De l'Atlantique", items: [{ title: "Bar sauvage, riz de Comporta, beurre au citron confit" }] },
      { title: "De l'Alentejo", items: [{ title: "Agneau aux herbes ou courge rôtie, jus au romarin" }] },
      { title: "Le jardin sucré", items: [{ title: "Figue, fleur d'oranger et glace au lait d'amande" }] },
    ],
    note: "Toutes les allergies et préférences sont recueillies dans le RSVP.",
  },
  gifts: {
    title: "Si le cœur vous en dit",
    body: "Pour celles et ceux qui souhaitent participer à notre prochain chapitre, une cagnotte est ouverte pour notre voyage de noces au Japon : Kyoto, Naoshima, Yakushima.",
    url: "https://cagnotte.example.org/sienna-malo",
    linkLabel: "Participer à notre voyage de noces",
  },
  faq: [
    { question: "Les enfants sont-ils invités ?", answer: "Oui. Indiquez simplement leur prénom dans votre RSVP afin que nous préparions leur place et leur repas." },
    { question: "Comment venir depuis Lisbonne ?", answer: "Comporta se trouve à environ 1 h 20 de Lisbonne. Retrouvez les options de transfert et de navette dans notre carnet de voyage." },
    { question: "Y aura-t-il une navette ?", answer: "Une navette fera deux départs depuis le centre de Comporta à 16 h 10 et 16 h 35, puis des retours à 1 h, 2 h 30 et 4 h." },
    { question: "Puis-je modifier mon RSVP ?", answer: "Écrivez-nous avant la date limite et nous mettrons à jour vos réponses, accompagnants ou allergies." },
    { question: "Quel sera le sol sur place ?", answer: "La cérémonie et le dîner se déroulent sur un sol naturel et sablonneux. Les talons larges, sandales et mocassins sont vos meilleurs alliés." },
  ],
  playlist: [
    { title: "O Sol", artist: "Vitor Kley" },
    { title: "Manga", artist: "Mayra Andrade" },
    { title: "Boa Sorte", artist: "Vanessa da Mata" },
    { title: "Sodade", artist: "Cesária Évora" },
  ],
  rsvp: {
    allowPartner: true,
    allowChildren: true,
    dietaryOptions: ["Aucun régime particulier", "Végétarien", "Vegan", "Sans gluten", "Sans lactose"],
    collectMessage: true,
  },
  // The designer's own wording, kept for the showcase. A real wedding gets the
  // neutral catalogue default until the couple rewrites it.
  texts: {
    "countdown.note": "Le soleil se couche à 21 h 04. Soyez là avant lui.",
    "timeline.sign": "L'Atlantique donne le rythme",
    "transport.title": "Quelques jours\nau Portugal",
    "transport.intro": "L'arrivée fait déjà partie de la fête. Voici l'essentiel pour voyager léger jusqu'à Comporta.",
    "menu.eyebrow": "Casa Maré Alta · Table d'un soir",
  },
  // Renders the two Jour J blocks. There is no `weddingId`, so they are inert.
  dayOf: { slug: "demo", photos: true },
};
```

- [ ] **Step 3: Write the manifest and the root**

`theme.config.ts` (playbook §2.1) with the values from *Global Constraints*:

```ts
import type { ThemeManifest } from "../types";

import { MareAltaRoot } from "./MareAltaRoot";
import { MARE_ALTA_DEMO } from "./demo-data";
import { mareAltaEditorSlots } from "./editor";
import { mareAltaFontVars } from "./fonts";

/**
 * Manifest for "Maré Alta" — embroidery on linen, a garden by the Atlantic.
 *
 * The only file the rest of the app reads to know the theme exists.
 */
export const mareAltaTheme: ThemeManifest = {
  id: "mare-alta",
  name: "Maré Alta",
  description: "Broderie sur lin ivoire, pins parasols et glycines : un mariage dans une villa de l'Atlantique.",
  supports: [
    "countdown",
    "timeline",
    "dress-code",
    "map",
    "accommodation",
    "transport",
    "menu",
    "playlist",
    "gift-list",
    "rsvp",
    "faq",
  ],
  accentColor: "#4d5845",
  cover: "/themes/mare-alta/cover.webp",
  scopeClass: "theme-mare-alta",
  fontVars: mareAltaFontVars,
  demoData: MARE_ALTA_DEMO,
  Root: MareAltaRoot,
  editorSlots: mareAltaEditorSlots,
};
```

`editor.ts`:

```ts
import type { ThemeEditorSlot } from "../types";

/**
 * Every word "Maré Alta" prints in its own voice that a couple may rewrite.
 * Each entry names the catalogue messages that supply the default; the sections
 * read `slot(data, key) ?? t(...)` with the same keys. Declaring a slot no
 * section reads offers a field that changes nothing: `theme-checks.test.mjs`
 * fails on it.
 */
const NS = "Invitation.mareAlta";

export const mareAltaEditorSlots: readonly ThemeEditorSlot[] = [
  // Appended section by section, in Tasks 3–8.
];
```

`MareAltaRoot.tsx` — the structure to keep (sections are added to it in Tasks 3–8; until then the column is empty):

```tsx
import { useLocale, useTranslations } from "next-intl";
import type { CSSProperties } from "react";

import { formatFrenchDate } from "../format";
import { JsFlag } from "../reveal";
import { monogramOf } from "../monogram";
import { cssString } from "../text";
import type { InvitationData, ModuleId } from "../types";

import "./mare-alta.css";
import "./responsive.css";

import { mareAltaFontVars } from "./fonts";

/**
 * "Maré Alta" — an embroidered garden on linen.
 *
 * The hero and the footer always render: they carry the couple's names. Every
 * section between them is gated on `data.modules`, so a wedding shows only what
 * it bought. The Jour J blocks are gated on `data.dayOf` instead — the Jour J is
 * not a module.
 *
 * The root is the full-width sage backdrop (the designer's `body`); the column
 * inside it is the designer's `main` (720px, ivory, shadowed). The pipeline kept
 * them apart on purpose — see `themes:port-css`.
 *
 * Two words of the stylesheet are drawn with `content:` (the menu card's crest
 * and its footer line). The pipeline turned them into custom properties; they
 * are set here from the couple's data.
 */
export function MareAltaRoot({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.mareAlta");
  const locale = useLocale();

  const enabled = data.modules;
  const has = (id: ModuleId) => !enabled || enabled.includes(id);

  const day = formatFrenchDate(data.event.startsAt.slice(0, 10), { locale });
  const menuFooter = data.menu?.footer?.length
    ? data.menu.footer.join(" · ")
    : [data.venue.name, day].filter(Boolean).join(" · ");

  const decor = {
    "--ma-menu-monogram": cssString(monogramOf(data.couple, " · ")),
    "--ma-menu-footer": cssString(menuFooter.toLocaleUpperCase(locale)),
  } as CSSProperties;

  void t; // used by the sections added in the next tasks
  void has;

  return (
    <main className={`theme-mare-alta ${mareAltaFontVars}`} data-theme-root="" style={decor}>
      <JsFlag />
      <div className="ma-column">{/* sections: Tasks 3–8 */}</div>
    </main>
  );
}
```

(Remove the two `void` lines as the sections arrive.)

`responsive.css` starts as:

```css
/*
 * Hand-written layer for "Maré Alta", imported after the generated sheet.
 * Every rule sits under .theme-mare-alta and says why it exists.
 */

/* The root is the sage backdrop behind the 720px column; make it at least a screen tall. */
.theme-mare-alta { min-height: 100svh; }
```

- [ ] **Step 4: Register the theme and look at it**

Run `npm run themes:sync -w landing`, then `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3010/fr/invitation/demo/mare-alta`.
Expected: `200` and a blank sage page with an empty ivory column at 390px and 1440px (look at it with `themes:shoot`). A 500 usually means a missing import or a catalogue key read too early.

- [ ] **Step 5: Checkpoint**

Run: `npm run themes:check -w landing`, `npx tsc --noEmit -p landing/tsconfig.json 2>&1 | grep "themes/mare-alta/"` (empty), `node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs --test landing/src/lib/theme-supports.test.mjs landing/src/lib/theme-checks.test.mjs`. Expected: registry current, no type error in your folder, tests pass (the slot-wiring test is skipped or reports the empty list until Task 3 — an empty `editor.ts` makes it fail with "non-empty array"; that is expected until Task 3 and not a defect). Do not commit.

---

### Task 3: Hero and countdown

**Files:**
- Create: `…/mare-alta/sections/HeroSection.tsx`, `sections/PointerLight.tsx`, `sections/CountdownSection.tsx`
- Modify: `…/mare-alta/MareAltaRoot.tsx`, `editor.ts`, `responsive.css`
- Scratch: `$SCRATCH/messages/mare-alta/{fr,en,de,es,pt,it,ar,zh,ja}.json` (created here, extended by every later task)

**Interfaces:**
- Produces: `HeroSection({ data })`, `CountdownSection({ data })`.
- Consumes: `heroDates`, `ScrollToButton`, `Section`, `RhythmTitle`, `slot`, `Lines`.

**Source:** hero `app/page.tsx:332–404`, countdown `106–214` and `406–416`.

- [ ] **Step 1: Port the hero**

`HeroSection` renders the designer's `<section className="hero" id="ma-top" data-editor-section="hero">` with the **same children in the same order**: the `<img>`, `.hero-shade`, the `<svg className="hero-tree-lights">` (copy lines 338–380 verbatim — its 100-odd circle coordinates are theme art tied to the artwork, not content), `.hero-glint`, `.hero-topline`, `.hero-copy`, `.pearl-orbit`, the scroll cue. Replace:

| Source | Becomes |
|---|---|
| `src="/embroidered-hero-no-curtains-v4.png"`, French alt | `src="/themes/mare-alta/embroidered-hero-no-curtains-v4.webp"`, `alt={t("imageAlt")}`, `fetchPriority="high"` (no `loading="lazy"`) |
| `<span>19 · 06 · 2027</span>` | `{heroDates(data, locale).dotted}` |
| `<span>Comporta · Portugal</span>` | `{[venue.city, venue.country].filter(Boolean).join(" · ")}` — omit the span when empty |
| `<p className="eyebrow light">Nous nous marions</p>` | `{data.copy?.heroKicker ?? t("eyebrow")}` |
| `<h1><span>Sienna</span><i>&</i><span>Malo</span></h1>` | `partner1`, `&`, `partner2` from `data.couple` |
| `<p className="hero-date">Samedi 19 juin 2027</p>` | `{heroDates(data, locale).spelled}` |
| (new) | `{data.copy?.announcement ? <p className="ma-announcement">…</p> : null}` after the date |
| (new, **mock-up gate**) | when `couple.monogram` is written, a third child of `.hero-topline`, centred: `<span className="ma-hero-mark" aria-hidden="true">{couple.monogram}</span>` |
| `<a className="scroll-cue" href="#compte-a-rebours">` | `<ScrollToButton target="#ma-countdown" className="scroll-cue"><span>{slot(data,"hero.cta") ?? t("cta")}</span><ArrowDown size={18} /></ScrollToButton>` |
| `onPointerMove={moveLight}` on the section | `<PointerLight />` as the section's last child |

`PointerLight` is a hidden client leaf that attaches `pointermove` to its nearest `section` and sets `--light-x` / `--light-y` exactly as the designer's `moveLight` did (lines 300–310):

```tsx
"use client";

import { useEffect, useRef } from "react";

/**
 * Moves the hero's glint with the pointer. The designer's page did it with an
 * `onPointerMove` on the section itself; a hidden leaf keeps the hero a server
 * component and does the same.
 */
export function PointerLight() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const hero = ref.current?.closest<HTMLElement>("section");
    if (!hero) return;

    const move = (event: PointerEvent) => {
      const rect = hero.getBoundingClientRect();
      hero.style.setProperty("--light-x", `${((event.clientX - rect.left) / rect.width) * 100}%`);
      hero.style.setProperty("--light-y", `${((event.clientY - rect.top) / rect.height) * 100}%`);
    };

    hero.addEventListener("pointermove", move);
    return () => hero.removeEventListener("pointermove", move);
  }, []);

  return <span ref={ref} hidden aria-hidden="true" />;
}
```

Add to `responsive.css` (a `<button>` replaces the designer's `<a>`, and the announcement and mark are new):

```css
/* The scroll cue is a <button> here (no hash link, no scroll on refresh); strip the button chrome. */
.theme-mare-alta button.scroll-cue { background: none; border: 0; padding: 0; cursor: pointer; font: inherit; }

/* Optional lines the designer's hero did not have: the couple's announcement and monogram. */
.theme-mare-alta .ma-announcement { max-width: 26rem; margin: 1.1rem auto 0; font: italic 1rem/1.6 Georgia, var(--font-ma-serif), serif; color: var(--wine); }
.theme-mare-alta .ma-hero-mark { align-self: center; letter-spacing: 0.2em; }
```

- [ ] **Step 2: Port the countdown**

`CountdownSection` is a client component (timer + canvas). Port `Countdown` and `ScratchCard` (lines 106–214) with these changes only: the target is `new Date(data.event.startsAt).getTime()`; the labels are catalogue plurals; the canvas text and the `aria-label` come from the catalogue; the placeholder `--` before mount is kept (it is what keeps the server and first client render identical); the canvas effect depends on the scratch label.

```tsx
"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { Lines, slot } from "../../text";
import type { InvitationData } from "../../types";

import { Section } from "./Section";
import { RhythmTitle } from "./SectionTitle";

const UNITS = [
  { key: "days", label: "unitDays" },
  { key: "hours", label: "unitHours" },
  { key: "minutes", label: "unitMinutes" },
  { key: "seconds", label: "unitSeconds" },
] as const;

type Remaining = Record<(typeof UNITS)[number]["key"], number>;

/**
 * Time left until the ceremony. `now` is null until the client has mounted, so
 * the server and the first client render both print the "--" placeholders
 * instead of disagreeing on a timestamp.
 */
function useRemaining(startsAt: string): Remaining | null {
  const target = new Date(startsAt).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (now === null || Number.isNaN(target)) return null;
  const distance = Math.max(0, target - now);
  return {
    days: Math.floor(distance / 86400000),
    hours: Math.floor((distance / 3600000) % 24),
    minutes: Math.floor((distance / 60000) % 60),
    seconds: Math.floor((distance / 1000) % 60),
  };
}

const WIDTH = 146;
const HEIGHT = 112;

/** A metallic card hiding its number until the guest scratches it away. */
function ScratchCard({ value, unit, scratchLabel, ariaLabel }: { value: string; unit: string; scratchLabel: string; ariaLabel: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  // The metal: drawn once per label. Assigning `canvas.width` resets the context,
  // so a redraw (a language switch in the editor's preview) starts clean.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = WIDTH * ratio;
    canvas.height = HEIGHT * ratio;
    canvas.style.width = `${WIDTH}px`;
    canvas.style.height = `${HEIGHT}px`;
    ctx.scale(ratio, ratio);

    const metallic = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    metallic.addColorStop(0, "#f8f4ea");
    metallic.addColorStop(0.28, "#d9e2e7");
    metallic.addColorStop(0.52, "#fffdf7");
    metallic.addColorStop(0.76, "#b9c8d4");
    metallic.addColorStop(1, "#f3eadb");
    ctx.fillStyle = metallic;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    for (let x = 10; x < WIDTH; x += 17) {
      for (let y = 10; y < HEIGHT; y += 17) {
        ctx.beginPath();
        ctx.fillStyle = (x + y) % 34 === 0 ? "#214f82" : "#fffdf9";
        ctx.shadowColor = "#70879a88";
        ctx.shadowBlur = 2;
        ctx.arc(x, y, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#102b4f";
    ctx.textAlign = "center";
    ctx.font = "700 9px Arial";
    ctx.fillText(scratchLabel, WIDTH / 2, HEIGHT / 2 + 4);
  }, [scratchLabel]);

  // Scratching erases the metal under the pointer, in canvas coordinates.
  function scratch(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (WIDTH / rect.width);
    const y = (event.clientY - rect.top) * (HEIGHT / rect.height);
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 17, 0, Math.PI * 2);
    ctx.fill();
  }

  return (
    <div className="scratch-card">
      <div className="scratch-value">
        <span>{value}</span>
        <small>{unit}</small>
      </div>
      <canvas
        ref={canvasRef}
        aria-label={ariaLabel}
        onPointerDown={(event) => {
          drawing.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          scratch(event);
        }}
        onPointerMove={scratch}
        onPointerUp={() => { drawing.current = false; }}
        onPointerCancel={() => { drawing.current = false; }}
      />
    </div>
  );
}

export function CountdownSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.mareAlta.countdown");
  const remaining = useRemaining(data.event.startsAt);

  return (
    <Section id="ma-countdown" className="countdown night-section" editorSection="countdown">
      <p className="eyebrow light">{slot(data, "countdown.eyebrow") ?? t("eyebrow")}</p>
      <h2 className="type-rhythm countdown-title">
        <RhythmTitle text={slot(data, "countdown.title") ?? `${t("titleLine1")}\n${t("titleLine2")}`} />
      </h2>
      <div className="countdown-grid">
        {UNITS.map(({ key, label }) => {
          const count = remaining?.[key] ?? 0;
          const unit = t(label, { count });
          const value = remaining ? String(count).padStart(2, "0") : "--";
          return (
            <ScratchCard
              key={key}
              value={value}
              unit={unit}
              scratchLabel={t("scratch")}
              ariaLabel={remaining ? t("cardLabel", { value, unit }) : unit}
            />
          );
        })}
      </div>
      <p className="countdown-note">{slot(data, "countdown.note") ?? t("note")}</p>
    </Section>
  );
}
```

The canvas drawing is the designer's own (theme art, not content) and is carried over from `page.tsx:139–188` unchanged except for the label, the constants and the redraw dependency. Drop the `Lines` import if you do not use it.

- [ ] **Step 3: Declare the slots and write the strings**

Append to `editor.ts` (inside the array): `hero.cta` → `${NS}.hero.cta`; `countdown.eyebrow`; `countdown.title` (`titleLine1`, `titleLine2`, `multiline: true`); `countdown.note`.

Create the nine staging files for `hero` and `countdown` from Appendix A (French source above; translate to the other eight; `ar` right-to-left text, ICU plurals with the correct categories for `ar`). Merge: `npm run themes:messages -w landing -- mareAlta $SCRATCH/messages/mare-alta`.

- [ ] **Step 4: Render them**

Add to the Root's column, in order: `<HeroSection data={data} />` then `{has("countdown") ? <CountdownSection data={data} /> : null}`; remove the corresponding `void` line.

- [ ] **Step 5: Verify**

Playbook §4 for this section: `curl` 200; `themes:shoot` at 390 and 1440 for the demo, `minimal` and `heavy`; open the PNGs. Check specifically: the lights sit on the trees at 390 and 1920; the names fit at 390 with "Marie-Charlotte / Jean-Baptiste"; the top line's three items do not collide; the scroll cue sits at the bottom; the four cards show `--` on first paint then numbers; scratching erases the metal (use `page.mouse` in a throw-away Playwright script or check by hand in the browser); `console-check.mjs` shows no hydration warning. Compare with the live reference at 390.

- [ ] **Step 6: Checkpoint**

`tsc` filtered (empty), `eslint` on the folder (no error), `theme-checks.test.mjs` (the slot-wiring test for `mare-alta` now passes with four slots, all read). Do not commit.

---

### Task 4: Map (venue) and timeline

**Files:**
- Create: `…/mare-alta/sections/VenueSection.tsx`, `sections/TimelineSection.tsx`, `sections/ScheduleMedallion.tsx`, `calendar-url.ts`
- Modify: `MareAltaRoot.tsx`, `editor.ts`, `responsive.css`
- Test: `landing/src/lib/mare-alta-calendar.test.mjs`

**Interfaces:**
- Produces:
  - `calendarUrl(data: Pick<InvitationData, "couple" | "event" | "venue">): string` — a Google Calendar "add event" link.
  - `mapsUrl(venue: InvitationData["venue"]): string` — `venue.mapsUrl`, else a Google Maps search for name + address.
  - `ScheduleMedallion({ icon?, size? })`, `VenueSection`, `TimelineSection`.
- Consumes: `ScheduleIcon` from `../../types`, `formatFrenchDate`, `formatFrenchWeekday`.

**Source:** venue `page.tsx:418–459`, timeline `461–496`.

- [ ] **Step 1: Write the failing test for the links**

Create `landing/src/lib/mare-alta-calendar.test.mjs`:

```js
/**
 *   node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs \
 *     --test landing/src/lib/mare-alta-calendar.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";

import { calendarUrl, mapsUrl } from "../components/invitation/themes/mare-alta/calendar-url.ts";

const data = {
  couple: { partner1: "Léa", partner2: "Hugo" },
  event: { startsAt: "2027-06-19T17:00:00+01:00" },
  venue: { name: "Domaine des Lilas", address: "12 chemin des Lilas, Annecy" },
};

test("the calendar link carries the names, the instant in UTC and the place", () => {
  const url = new URL(calendarUrl(data));
  assert.equal(url.origin + url.pathname, "https://calendar.google.com/calendar/render");
  assert.equal(url.searchParams.get("action"), "TEMPLATE");
  assert.equal(url.searchParams.get("text"), "Léa & Hugo");
  assert.equal(url.searchParams.get("dates"), "20270619T160000Z/20270620T000000Z");
  assert.equal(url.searchParams.get("location"), "Domaine des Lilas, 12 chemin des Lilas, Annecy");
});

test("without an address the venue's name stands in", () => {
  const url = new URL(calendarUrl({ ...data, venue: { name: "Salle des Fêtes" } }));
  assert.equal(url.searchParams.get("location"), "Salle des Fêtes");
});

test("an unreadable start gives a link without dates, not a broken one", () => {
  const url = new URL(calendarUrl({ ...data, event: { startsAt: "soon" } }));
  assert.equal(url.searchParams.has("dates"), false);
});

test("the maps link is the couple's own, else a search for the place", () => {
  assert.equal(mapsUrl({ name: "X", mapsUrl: "https://maps.example/x" }), "https://maps.example/x");
  const search = new URL(mapsUrl({ name: "Domaine des Lilas", address: "12 chemin des Lilas" }));
  assert.equal(search.searchParams.get("query"), "Domaine des Lilas, 12 chemin des Lilas");
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs --test landing/src/lib/mare-alta-calendar.test.mjs`
Expected: FAIL — cannot find `calendar-url.ts`.

- [ ] **Step 3: Implement the links**

Create `…/mare-alta/calendar-url.ts`:

```ts
import type { InvitationData } from "../types";

/**
 * The wedding as a Google Calendar event, and the venue on Google Maps.
 *
 * Both are built from the couple's data. The designer's links hard-coded the
 * demo wedding's dates and place.
 */

/** A wedding runs late; eight hours covers the ceremony to the small hours. */
const DEFAULT_DURATION_HOURS = 8;

function compact(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function calendarUrl(data: Pick<InvitationData, "couple" | "event" | "venue">): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${data.couple.partner1} & ${data.couple.partner2}`,
    location: [data.venue.name, data.venue.address].filter(Boolean).join(", "),
  });

  const start = new Date(data.event.startsAt);
  if (!Number.isNaN(start.getTime())) {
    const end = new Date(start.getTime() + DEFAULT_DURATION_HOURS * 3_600_000);
    params.set("dates", `${compact(start)}/${compact(end)}`);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function mapsUrl(venue: InvitationData["venue"]): string {
  if (venue.mapsUrl) return venue.mapsUrl;
  const query = [venue.name, venue.address ?? venue.city].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?${new URLSearchParams({ api: "1", query })}`;
}
```

Run the test again — Expected: PASS, 4 tests.

- [ ] **Step 4: Port the venue section**

`VenueSection` renders `<Section id="ma-map" className="location paper-section" editorSection="map">` and the designer's children. Return `null` only if there is nothing to show (it always has `venue.name`, so it renders). Replace:

| Source | Becomes |
|---|---|
| `SectionTitle eyebrow="Destination" title="Casa Maré Alta" intro=…` | eyebrow `slot(data,"map.eyebrow") ?? t("eyebrow")`, title `data.venue.name`, intro `data.copy?.venueIntro` |
| `<img src="/embroidered-destination-v5.png" alt=…>` | `data.venue.image ? <img src={venue.image} alt={venue.name} />` : `<img src="/themes/mare-alta/embroidered-destination-v5.webp" alt={t("imageAlt")} />` |
| `.location-stamp` with `38.3816° N<br/>8.7865° W` | `<MapPin size={18}/><span>{venue.city}<br/>{venue.country}</span>`; omit the stamp when both are empty |
| `.address` text | `venue.address` (omit the paragraph when empty) |
| route button `href` | `mapsUrl(data.venue)` |
| calendar button `href` | `calendarUrl(data)` |

Buttons keep their classes (`button primary`, `button ghost`) and icons.

- [ ] **Step 5: Port the timeline**

`ScheduleMedallion.tsx`:

```tsx
import { Coffee, Heart, Music2, Sparkles, UtensilsCrossed, Wine, type LucideIcon } from "lucide-react";

import type { ScheduleIcon } from "../../types";

/**
 * What a moment is, drawn the designer's way. The contract names the moment
 * (ceremony, cocktail…), never the drawing; an entry that names none gets the
 * heart the designer put on the guests' arrival.
 */
const ICONS: Record<ScheduleIcon, LucideIcon> = {
  ceremony: Sparkles,
  cocktail: Wine,
  dinner: UtensilsCrossed,
  party: Music2,
  brunch: Coffee,
};

export function ScheduleMedallion({ icon, size = 26 }: { icon?: ScheduleIcon; size?: number }) {
  const Icon = icon ? ICONS[icon] : Heart;
  return <Icon size={size} />;
}
```

`TimelineSection` (`Section className="program coral-section" editorSection="timeline"`):

- `SectionTitle rhythm`: eyebrow `slot("timeline.eyebrow") ?? t("eyebrow")`; title `<RhythmTitle text={slot("timeline.title") ?? line1\nline2} />`; intro `data.copy?.scheduleIntro`.
- `.tempo-ribbon` with four `<i />` — decoration, as is.
- **Wedding-day cards**: entries where `(entry.event ?? (entry.day === 2 ? "brunch" : "wedding-day")) === "wedding-day"`, in order, as the designer's `<article className="agenda-card">`: `<span className="agenda-number">{String(index + 1).padStart(2, "0")}</span>`, `<div className="agenda-medallion"><ScheduleMedallion icon={entry.icon} /></div>`, `<time>{entry.time}</time>`, `<h3>{entry.title}</h3>`, `<p>{entry.description}</p>` (omit empty `p`). If there are none, render no `.agenda-grid` at all.
- `.wave-sign`: `<Waves />` + `<span>{slot("timeline.sign") ?? t("sign")}</span>`.
- **Extra events (mock-up gate)** — after the grid, before the wave sign, one compact block per `events[]` entry whose `kind !== "wedding-day"`, headed once by `t("alsoTitle")` as a small eyebrow. Each reuses the card classes: `<article className="agenda-card ma-event">` with the weekday + date (`formatFrenchWeekday`, `locale`) where the number badge was, the event's `name` as `<h3>`, then time, `address`, `description` and `dressCode` as small lines (omit empty ones), and the `schedule` entries carrying that event under it as `<li>` rows (`time — title`). The brunch uses the `dayTwo` fields when present (`dayTwo.title`, `timeLabel`, `body`, `note`, `image`). Style it in `responsive.css` with the card's own tokens; flag it in the report with screenshots.

- [ ] **Step 6: Slots, strings, render**

Append slots: `map.eyebrow`; `timeline.eyebrow`; `timeline.title` (multiline); `timeline.sign`. Add the keys of Appendix A for `map` and `timeline`; translate, merge. Render `has("map") || has("transport") ? <VenueSection /> : null` (the map section also shows when only transport is owned, as in ciao-amore, because the access lines belong with the place — but here the access lines are drawn by the transport section of Task 5, so gate the venue section on `has("map")` alone) then `has("timeline") ? <TimelineSection /> : null`.

- [ ] **Step 7: Verify and checkpoint**

Playbook §4 (all three datasets; the `heavy` set has eight moments, three events and long strings; the `minimal` set has none: the timeline must then render nothing but its heading-less section — **if there is nothing to draw, return `null`**). Compare with the reference. Run the new test and `theme-checks`. Do not commit.

---

### Task 5: Dress code, accommodation, transport

**Files:**
- Create: `…/mare-alta/sections/DressCodeSection.tsx`, `StaysSection.tsx`, `TransportSection.tsx`
- Modify: `MareAltaRoot.tsx`, `editor.ts`, `responsive.css`

**Interfaces:**
- Produces: `DressCodeSection`, `StaysSection` (client: the "more options" toggle), `TransportSection`.
- Consumes: `Section`, `SectionTitle`, `RhythmTitle`, `formatDateRange`, `weddingSpan`.

**Source:** dress code `page.tsx:498–527`, stays `529–585`, travel guide `587–633`.

- [ ] **Step 1: Dress code**

`<Section className="dresscode paper-section" id="ma-dresscode" editorSection="dress-code">`. Render nothing when `data.dressCode` is absent.

| Source | Becomes |
|---|---|
| title / intro | `dressCode.title` / `dressCode.body`; eyebrow `slot("dress-code.eyebrow") ?? t("eyebrow")` |
| `.fashion-stage` image | `dressCode.image ? <img src alt={dressCode.title}>` : `/themes/mare-alta/embroidered-dresscode-v5.webp` with `alt={t("imageAlt")}` |
| `.fashion-tags` (three named pills) | one swatch per `dressCode.colors` entry: `<span style={{ background: colour }} />`; omit the container when there are none |
| `.dress-manifesto` (Shirt icon + two paragraphs) | when `dressCode.note` exists: split it on blank lines; the first paragraph follows `<Shirt />`, the second (if any) follows `<Sparkles />`; extra paragraphs plain |

CSS in `responsive.css` for the swatches: a colour dot has no text, so turn the designer's pill into a circle:

```css
/* The designer's tags named three colours; the couple's palette is any number of CSS colours, drawn as swatches. */
.theme-mare-alta .fashion-tags span { width: 1.7rem; height: 1.7rem; min-width: 0; padding: 0; border-radius: 50%; border: 1px solid var(--line); box-shadow: 0 1px 4px #0002; }
```

- [ ] **Step 2: Accommodation**

`<Section className="stay night-section" id="ma-stays" editorSection="accommodation">`; render nothing when `stays` is empty or absent. Client component for the toggle.

- Title: eyebrow `slot("accommodation.eyebrow")`, `rhythm`, title `<RhythmTitle text={slot("accommodation.title") ?? line1\nline2} firstClass="title-sans" secondClass="title-serif" />`, intro `copy.staysIntro`.
- `<img className="stay-art" src="/themes/mare-alta/embroidered-luggage-sunglasses-v9.webp" alt={t("artAlt")} />`.
- `.travel-stamps`: `<Plane /> {venue.country}`, `<Shell /> {venue.city}`, `<Luggage /> {formatDateRange(span.start, span.end, { locale })}` from `weddingSpan(data)`; render each span only if it has text, and the container only if at least one does.
- `.stay-grid`: the stays with `secondary !== true` as `.stay-card` articles, then a button `t("more")` / `t("less")` revealing the `secondary` ones in the same grid. Card: `<Hotel />`; `<span>{distance}</span>`; `<h3>{name}</h3>`; `<p>{[city, address].filter(Boolean).join(" · ")}</p>`; `<small>` with `offer` and/or `t("code", { code: bookingCode })`; `image` as a top image when present; a phone link `t("call")` when `phone` is set; the action is `<a href={url} target="_blank" rel="noreferrer">{t("address")} <ExternalLink size={14} /></a>` when `url` exists, else a maps search link built from `name + address`, else no action.
- The designer's CSS styles `.stay-card button`; the action here is an `<a>`. Find the final cascade rules (`grep -n "stay-card button" mare-alta.css`) and mirror each declaration block for `.stay-card a` in `responsive.css`, with a comment saying why.

- [ ] **Step 3: Transport (the travel notebook)**

`<Section className="travel-guide paper-section" id="ma-transport" editorSection="transport">`. Render when `data.venue.access?.length` and (`has("transport")` or `has("map")`) — the Root decides; the component returns `null` when `access` is empty.

- Title: `rhythm`, eyebrow `slot("transport.eyebrow")`, title `<RhythmTitle text={slot("transport.title") ?? line1\nline2} />`, intro `slot("transport.intro") ?? t("intro")`.
- `.travel-flight-decor`: the five decorative `<i>`/`<span>` children as is, `aria-label={t("decorLabel")}`.
- `.travel-guide-grid`: for each `access[i]`: `<article>` with an icon cycling `Plane`, `Car`, `Sun`, `Shell` by index; `<span>{mode}</span>`; `<h3>{details[0]}</h3>`; `<p>{details.slice(1).join(" ")}</p>`; when `link` exists, an anchor `<a className="ma-card-link" href={link.url} target="_blank" rel="noreferrer">{link.label ?? t("open")}</a>` inside the card. Omit `<h3>` and `<p>` when the lines are missing.
- No "Ouvrir le guide complet" button.

- [ ] **Step 4: Slots, strings, render**

Slots: `dress-code.eyebrow`; `accommodation.eyebrow`; `accommodation.title` (multiline); `transport.eyebrow`; `transport.title` (multiline); `transport.intro`. Strings: Appendix A `dressCode`, `stays`, `transport` (+ ciao's functional keys where listed). Render in order after the timeline: `has("dress-code")`, `has("accommodation")`, then `data.venue.access?.length && (has("transport") || has("map"))`.

- [ ] **Step 5: Verify and checkpoint**

Playbook §4. Specifically: `heavy` has ten hotels (three secondary) and six access modes — the grids must not overflow at 390; `minimal` has none of the three (nothing rendered); the swatches show with eight colours; a hotel card without `url` and without `address` shows no action. Compare with the reference. Do not commit.

---

### Task 6: Menu, playlist, gift

**Files:**
- Create: `…/mare-alta/sections/MenuSection.tsx`, `PlaylistSection.tsx`, `GiftsSection.tsx`
- Modify: `MareAltaRoot.tsx`, `editor.ts`, `responsive.css`

**Interfaces:**
- Produces: `MenuSection`, `PlaylistSection` (client), `GiftsSection`.
- Consumes: `useGuestPlaylist`, `Section`, `SectionTitle`, `RhythmTitle`.

**Source:** menu `page.tsx:635–691`, playlist `693–788` (only the stage and the suggestion field are kept), gift `790–822`.

- [ ] **Step 1: Menu**

`<Section className="menu coral-section" id="ma-menu" editorSection="menu">`; return `null` when `data.menu` has no section with an item.

- Title: eyebrow `slot("menu.eyebrow") ?? [data.venue.name, t("eyebrow")].filter(Boolean).join(" · ")`; `rhythm`; title `<RhythmTitle text={slot("menu.title") ?? line1\nline2} firstClass="title-sans" secondClass="title-serif" />`.
- `.menu-scatter` with its six `<i className="menu-piece …">` as is; `aria-label={t("scatterLabel")}`.
- `<div className="menu-list restaurant-menu">`: one `<div>` per section: `<span>{two-digit index}</span><p><small>{section.title}</small>…</p>`. For each item: its `title`, and — when it has a `description` — a line break and `<i className="ma-dish-note">{description}</i>`; separate several items of a section with a line break.
- `<p className="chef-note">{menu.note}</p>` when present.
- The crest (`::before`) and the footer line (`::after`) come from the custom properties the Root sets.

```css
/* A dish's description, under its name. */
.theme-mare-alta .ma-dish-note { display: block; margin-top: 0.25rem; font: italic 0.9em/1.5 Georgia, var(--font-ma-serif), serif; color: var(--muted); }
```

- [ ] **Step 2: Playlist**

`<Section className="playlist paper-section" id="ma-playlist" editorSection="playlist">`.

- Title: eyebrow slot, `rhythm`, title slot, intro `data.copy?.playlistIntro ?? slot("playlist.intro") ?? t("intro")`.
- The stage, exactly as the designer's lines 705–716: `.record-stage` > `.vinyl-garden` (two `<i className="vinyl …">`, `.turntable-arm`, `aria-label={t("discsLabel")}`) + `.music-notes`. **Check which rule makes the discs turn** (`grep -n "vinyl" mare-alta.css`): the designer's comment says the records are decorative and keep spinning at rest; if the animation is gated on `.is-playing`, render that class on `.record-stage` permanently.
- **Replace** `.player` and `.song-suggest` (lines 717–787) with the guest search, driven by `useGuestPlaylist(data)`: inside `<div className="song-suggest">`: `<Music2 />`, a `role="combobox"` input (`ref={inputRef}`, `value={query}`, `onChange`, `onKeyDown={handleKeyDown}`, `aria-expanded={showPanel}`, `aria-controls={listId}`, `aria-label` and placeholder from the catalogue), then — in normal flow, below it, so no clipping — a `<ul id={listId} role="listbox" className="ma-results">` of `results` (cover, title, artist; `aria-selected={index === active}`; `onClick={() => choose(result)}`) with the loading / no-result / error lines when `searchState` says so; a `<ul className="ma-picked">` of `selected` with a remove button each; and `<button className="button primary" onClick={send} disabled={pending || selected.length === 0}>` (label pending/send). When `sent`, replace the field with `<div className="song-confirm"><CircleCheck /> {t("thanks")}</div>`; show `error` with `role="alert"`.
- Style the two new lists in `responsive.css` with the section's own tokens (hairline borders `var(--line)`, the same row height as the designer's `.track-list button`); keep them readable at 390.

- [ ] **Step 3: Gift**

`<Section className="gift night-section" id="ma-gift" editorSection="gift-list">`; return `null` when `data.gifts` has no title and no body and no url (the contract: a theme renders nothing when the couple wrote nothing).

`<Gift size={34} />`; `SectionTitle` with eyebrow `slot("gift-list.eyebrow")`, title `gifts.title`, intro `gifts.body`; when `gifts.url`: `<a className="button light-button bank-toggle" href={gifts.url} target="_blank" rel="noreferrer">{gifts.linkLabel ?? t("cta")}</a>`. No card, no progress bar, no IBAN.

- [ ] **Step 4: Slots, strings, render, verify**

Slots: `menu.eyebrow`; `menu.title` (multiline); `playlist.eyebrow`; `playlist.title` (multiline); `playlist.intro`; `gift-list.eyebrow`. Strings: Appendix A `menu`, `playlist`, `gifts` (+ ciao's playlist functional keys). Render after transport: `has("menu")`, `has("playlist")`, `has("gift-list")`. Verify (playbook §4): in the browser type "sodade" in the playlist field — results should list tracks (the search route is read-only and runs in demo); pick one — a chip appears; send — the thank-you appears and **nothing is written** (no `weddingId`). Check the discs turn. Compare with the reference. Do not commit.

---

### Task 7: RSVP and FAQ

**Files:**
- Create: `…/mare-alta/sections/RsvpSection.tsx`, `FaqSection.tsx`
- Modify: `MareAltaRoot.tsx`, `editor.ts`, `responsive.css`

**Interfaces:**
- Produces: `RsvpSection` (client), `FaqSection` (client).
- Consumes: `useGuestRsvp`, `monogramOf`, `withChildrenPolicyFaq`, `formatFrenchDate`, `weddingSpan`.

**Source:** RSVP `page.tsx:824–978`; FAQ `1057–1073`. The accordion model is `ciao-amore/sections/FaqSection.tsx` and its `.ca-faq-*` rules in `ciao-amore/responsive.css` (read them; rewrite under your own `ma-` prefix — do not import from ciao-amore).

- [ ] **Step 1: RSVP**

`<Section className="rsvp paper-section" id="ma-rsvp" editorSection="rsvp">` wrapping the designer's `.rsvp-shell` > `aside.rsvp-intro` + `.rsvp-card`. The form is driven by `const rsvp = useGuestRsvp(data)`.

Aside:

| Source | Becomes |
|---|---|
| `.rsvp-monogram` `S · M` | `monogramOf(data.couple, " · ")` |
| eyebrow "Votre réponse" | `slot("rsvp.eyebrow") ?? t("eyebrow")` |
| `<h2>Serez-vous<br/>des nôtres ?</h2>` | `<Lines text={slot("rsvp.title") ?? line1\nline2} />` |
| `.rsvp-lead` | `data.copy?.rsvpIntro` (omit when empty) |
| `.rsvp-deadline` "Merci de répondre avant le / 15 mai 2027" | `t("deadlineLabel")` + `formatFrenchDate(event.rsvpDeadline, { locale })`; when there is no date but `copy.rsvpNote`, print the note instead; omit when neither |
| `.rsvp-weekend` three dated spans | the `events` that have a date, sorted by date: `<span>{formatted day and month}<small>{event.name}</small></span>`; render the block only when at least two events are dated |

Form (`<form onSubmit={rsvp.handleSubmit}>`), inside `.rsvp-card`; replaced by the thank-you `div.success` when `rsvp.sent` (eyebrow, title, body from the catalogue; **no** "Modifier ma réponse" button):

1. Step `01` "Votre réponse": the two `.choice-grid.attendance-choice` buttons (`type="button"`, `className={selected}`, `aria-pressed`) calling `rsvp.setAttending(true | false)`; a required `fullName` input (label and placeholder from ciao's `rsvp` keys). No e-mail, no phone.
2. Step `02` "Avec qui venez-vous ?" — only when `rsvp.showParty` and (`rsvp.allowPartner` or `rsvp.allowChildren`): if `allowPartner`, a `partyMode` select (solo / with partner, ciao's strings) and, for `partner`, a required `partnerName` input; if `allowChildren`, a `childCount` select (none, 1 … `rsvp.maxChildren`) and one required `childName-<i>` input per child.
3. Step `03` "Un petit mot": `dietary` select (from `data.rsvp.dietaryOptions`) only when the options exist; `message` textarea only when `data.rsvp.collectMessage`. Render the step only if it has at least one field.
4. `rsvp.error` as `<p className="rsvp-error" role="alert">`; the submit button `className="submit"` with the send icon, `disabled={rsvp.attending === null || rsvp.pending}`, label pending/send.

The designer's CSS styles `.rsvp-card label`, `.choice-grid button`, `.contact-grid`, `.rsvp-step`; reuse those classes, and add any new one (`rsvp-error`) in `responsive.css`.

- [ ] **Step 2: FAQ**

`FaqSection`: `const faq = withChildrenPolicyFaq(data, { question: t("childrenQuestion"), adultsOnlyAnswer: t("childrenAdultsOnly"), childrenWelcomeAnswer: t("childrenWelcome") })`; return `null` if empty. `<Section className="faq night-section" id="ma-faq" editorSection="faq">`; title eyebrow `slot("faq.eyebrow")`, title `<Lines text={slot("faq.title") ?? t("title")} />` (an `<h2>` inside `.section-heading`, as `SectionTitle` does).

The list is `.faq-list`, one `.ma-faq-item` per entry (`data-open` when open), a `button.ma-faq-q` (`aria-expanded`, `aria-controls`; the question and a `ChevronDown`), and a region `.ma-faq-a` > `.ma-faq-a-inner` > `<p>` with `inert` when closed; first item open, one open at a time. Copy the structure and the `useId` ids from `ciao-amore/sections/FaqSection.tsx`; write the CSS in `responsive.css`:

```css
/* The designer used native <details>, which cannot animate; this is the same look as a controlled accordion.
   The declarations are the designer's own final ones for `.faq details`, `.faq summary` and its chevron. */
.theme-mare-alta .ma-faq-item { border-top: 1px solid var(--line); margin: 0 0 1.4rem; line-height: 1.65; transition: background 0.35s, padding 0.35s; }
.theme-mare-alta .ma-faq-item[data-open] { padding-inline: 1rem; background: #ffffff0a; }
.theme-mare-alta .ma-faq-q {
  display: flex; width: 100%; padding: 1.25rem 0; align-items: center; justify-content: space-between; gap: 1rem;
  border: 0; background: none; text-align: start; cursor: pointer;
  color: var(--sage-dark); font: 1.08rem Georgia, var(--font-ma-serif), serif;
}
.theme-mare-alta .ma-faq-q svg { flex: none; transition: transform 0.3s; }
.theme-mare-alta .ma-faq-item[data-open] .ma-faq-q svg { transform: rotate(180deg); }
.theme-mare-alta .ma-faq-a { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.35s ease; }
.theme-mare-alta .ma-faq-item[data-open] .ma-faq-a { grid-template-rows: 1fr; }
.theme-mare-alta .ma-faq-a-inner { overflow: hidden; min-height: 0; }
.theme-mare-alta .ma-faq-a p { margin: 0 0 1.4rem; color: var(--muted); line-height: 1.65; }
@media (prefers-reduced-motion: reduce) {
  .theme-mare-alta .ma-faq-item, .theme-mare-alta .ma-faq-a, .theme-mare-alta .ma-faq-q svg { transition: none; }
}
```


- [ ] **Step 3: Slots, strings, render, verify**

Slots: `rsvp.eyebrow`; `rsvp.title` (multiline); `faq.eyebrow`; `faq.title`. Strings: Appendix A `rsvp`, `faq`. Render: `has("rsvp")`, then (Task 8 adds the photos block), `has("faq")`.

The RSVP `key`: as ciao-amore, outside a real invitation re-key the section on the RSVP options (`key={data.weddingId ? "rsvp" : JSON.stringify(data.rsvp ?? {})}`) so changing an option in the editor's preview shows a fresh form.

Verify (playbook §4): the `heavy` fixture is adults-only → no child field even after choosing "Avec joie"; the demo shows partner + children; submitting in demo shows the thank-you and writes nothing; the deadline and the events' dates show; the FAQ opens and closes smoothly and with 12 entries stays one column. Compare with the reference. Check the wisteria frame behind the RSVP at 375 and 1920 (it is a `cover` background: the ornaments must not be cropped away; if they are, add a documented fix in `responsive.css`). Do not commit.

---

### Task 8: Jour J blocks and footer

**Files:**
- Create: `…/mare-alta/sections/DayOfSection.tsx`, `FooterSection.tsx`
- Modify: `MareAltaRoot.tsx`, `editor.ts`, `responsive.css`

**Interfaces:**
- Produces: `PhotosBlock({ data })`, `TableBlock({ data })` (both from `DayOfSection.tsx`), `FooterSection`.
- Consumes: `Link` from `@/navigation`, `ScrollToButton`, `monogramOf`, `heroDates`.

**Source:** photos `page.tsx:980–1008`, "Trouve ta place" `1075–1087`, footer `1089–1096`.

- [ ] **Step 1: The Jour J blocks**

Both render only when `data.dayOf` exists (`PhotosBlock` also requires `dayOf.photos`). The Jour J is not a module and has no editor tab; the blocks carry `data-editor-section="footer"` because their words are `footer.*` slots.

```tsx
import { Camera, Clock3 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/navigation";

import { monogramOf } from "../../monogram";
import { Lines, slot } from "../../text";
import type { InvitationData } from "../../types";

import { Section } from "./Section";
import { SectionTitle } from "./SectionTitle";

/**
 * A real invitation links to the Jour J pages (`/jourj/<slug>/ma-table`,
 * `/photos`). The showcase and the editor's preview have no `weddingId` and no
 * such page, so there the same markup is an inert element, never a link that
 * would 404.
 */
function DayOfLink({ data, path, className, children }: { data: InvitationData; path: string; className: string; children: React.ReactNode }) {
  const t = useTranslations("Invitation.mareAlta.footer");
  if (!data.dayOf) return null;
  if (!data.weddingId) {
    return (
      <span className={className} role="link" aria-disabled="true" title={t("soon")}>
        {children}
      </span>
    );
  }
  return (
    <Link className={className} href={`/jourj/${data.dayOf.slug}/${path}`}>
      {children}
    </Link>
  );
}
```

`PhotosBlock`: `<Section className="photos coral-section" id="ma-photos" editorSection="footer">` — `SectionTitle` with eyebrow/title/intro from `footer.photosEyebrow` / `footer.photosTitle` / `footer.photosBody` slots (catalogue fallbacks), then `<DayOfLink data path="photos" className="upload"><Camera /><strong>{t("photosCta")}</strong><span>{t("photosHint")}</span></DayOfLink>`. Return `null` unless `data.dayOf?.photos`.

`TableBlock`: `<Section className="dayof paper-section" id="ma-table" editorSection="footer">` > `.dayof-card`: `<span className="mini-mark">{monogramOf(data.couple, " · ")}</span>`, `<Clock3 />`, eyebrow `footer.tableEyebrow`, `<h2>` `footer.tableTitle`, `<p>` `footer.tableBody`, then `<DayOfLink data path="ma-table" className="button primary">{t("tableCta")}</DayOfLink>`.

The designer's CSS styles `.upload` as a `label` and `.button` as an `a`; check both render correctly on a `Link`/`span` and add the missing reset in `responsive.css` (`.theme-mare-alta span.button[aria-disabled]` with `cursor: default; opacity: .7`).

- [ ] **Step 2: The footer**

`FooterSection` — always rendered, `<footer data-editor-section="footer">` keeping the designer's tag and children:

| Source | Becomes |
|---|---|
| eyebrow "On a tellement hâte" | `slot("footer.eyebrow") ?? t("eyebrow")` |
| `<h2>Sienna <i>&</i> Malo</h2>` | `partner1 <i>&</i> partner2` |
| `<p>19 juin 2027 · Comporta</p>` | `[heroDates(data, locale).spelled-free long date, venue.city].filter(Boolean).join(" · ")` — use `formatFrenchDate(startsAt.slice(0,10), { locale })` for the long date |
| (new) | `copy.closing` as a paragraph, `copy.footerNote` as a small line, each only when present |
| (new, **mock-up gate**) | `couple.portrait` as a round image above the names: `<img className="ma-portrait" src={portrait} alt="" />`; when absent, nothing |
| `<a href="#accueil">Revenir en haut ↑</a>` | `<ScrollToButton target="top" className="ma-top">{t("top")} ↑</ScrollToButton>` |

`responsive.css`: a `.ma-top` button reset matching the designer's `footer a` style, `.ma-portrait` (circle, 7rem, `object-fit: cover`, hairline border).

- [ ] **Step 3: Slots, strings, render, verify**

Slots: `footer.eyebrow`; `footer.tableEyebrow`; `footer.tableTitle`; `footer.tableBody`; `footer.photosEyebrow`; `footer.photosTitle`; `footer.photosBody`. Strings: Appendix A `footer`. Final Root order after the FAQ: `<PhotosBlock>` goes **before** the FAQ (after the RSVP), `<TableBlock>` after it, then `<FooterSection />`, as in *Global Constraints*.

Verify: in the demo both blocks show and their buttons are inert (hover shows the "Disponible le jour J" title); with `minimal` neither block shows and the footer closes the page; in `heavy` (which has `dayOf`) the blocks show. To test a real link, render the Root in a scratch page or reason from the code: with a `weddingId` the `Link` points to `/jourj/<slug>/ma-table`. Do not commit.

---

### Task 9: The catalogue, completely

**Files:** none new — the staging files in `$SCRATCH/messages/mare-alta/` and the merged catalogues.

- [ ] **Step 1: Parity and untranslated keys**

Run `npm run themes:messages -w landing -- mareAlta $SCRATCH/messages/mare-alta` one last time (it refuses on any key mismatch), then the "identical to French" script of playbook §3.5. Fix every listed key that is not a name or an ornament. Spot-check `ar`, `zh` and `ja` for the plurals (`countdown.unit*`).

- [ ] **Step 2: Every locale renders**

For `de`, `ar`, `ja`: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3010/<locale>/invitation/demo/mare-alta` → 200, and `console-check.mjs` on each shows no `MISSING_MESSAGE`.

- [ ] **Step 3: Checkpoint**

`node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs --test landing/src/lib/theme-checks.test.mjs` — expect all `mare-alta` checks PASS: no demo word in the folder or the nine namespaces, every slot on a real section / in the catalogue / read, every `data-editor-section` real, all eleven supported modules drawn. Do not commit.

---

### Task 10: Safety nets, the verification matrix, the fix loop

**Files:**
- Modify: `…/mare-alta/responsive.css`

- [ ] **Step 1: No-JavaScript and reduced-motion visibility**

List everything the designer hides until seen: `grep -n "in-view" landing/src/components/invitation/themes/mare-alta/mare-alta.css`. For each hidden-by-default selector (the three section grounds, `.program .agenda-card`, `.dresscode .fashion-stage img`, `.menu .menu-list > div`, `.rsvp form …`, and any other the grep shows), add to `responsive.css` the two blocks of playbook §3.4 so that under `.theme-mare-alta:not([data-js])` and under `prefers-reduced-motion: reduce` they are visible and still. Verify: disable JavaScript in Playwright (`javaScriptEnabled: false`) and screenshot — every section visible.

- [ ] **Step 2: The full matrix**

Playbook §4.1 in full: six widths, `minimal` and `heavy` at 390 and 1440, `de` and `ar` at 390 and 1440. `scrollW === clientW` everywhere. **Open every image.** Fix what is wrong in `responsive.css` (never in the generated sheet), re-shoot the width that showed it. Items to look for beyond the playbook list: the top line of the hero with three items at 320–390; the lights on the trees at 390 and 1920; the foliage lights not drifting at 1920 (the column is 720px, the image covers the column, not the viewport); the RSVP aside stacked above the card (the designer's final polish makes the shell one column); the wisteria frame; the discs both visible and turning; the `ma-column` shadow against the sage backdrop on wide screens; Arabic mirroring.

- [ ] **Step 3: Compare with the reference**

`themes:shoot-url` of the live reference at 390, then the same section by section against your own at 390. List every visible difference in the report: intended (the dropped elements, the variable text, the added optional lines) versus unintended; fix the unintended.

- [ ] **Step 4: Console**

`console-check.mjs` at 390 and 1440 for `fr` and `ar`: no hydration warning, no missing message, no failed image.

- [ ] **Step 5: Final run of everything**

```bash
npx tsc --noEmit -p landing/tsconfig.json 2>&1 | grep "themes/mare-alta/"
(cd landing && npx eslint src/components/invitation/themes/mare-alta)
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"
npm run themes:check -w landing
```

Expected: tsc output empty; eslint no error; `fail 0`; registry current.

- [ ] **Step 6: Report**

Send the report described in playbook §6, including: the asset size before/after; the list of differences from the live reference; the three mock-up-gate elements (extra events block, hero monogram, footer portrait) with their screenshots at 390 and 1440; the unused-class count from the pipeline; anything not verified. Do not commit.
