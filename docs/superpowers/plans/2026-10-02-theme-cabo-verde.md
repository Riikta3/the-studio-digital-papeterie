# Cabo Verde Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Read `2026-10-02-theme-port-playbook.md` first** — it holds the conventions, code skeletons and verification protocol every step below relies on.

**Goal:** Port the designer's beach-wedding invitation — turquoise water, painted boats, a sunset hero, flip-digit countdown, a programme in day tabs, a playlist with a dancing guitarist, a travel notebook, a 680px rounded card on desktop — into the app as the `cabo-verde` theme: fully variable, translated in nine languages, wired to guest submissions and to the editor.

**Architecture:** One theme folder. The designer's layered stylesheet (five palette layers, a third of its rules dead) is scoped as it is by the CSS pipeline, with the source's `main` moved onto a `.cv-column` so the page backdrop (the theme root) and the card stay two elements. The stamp the stylesheet draws on the hero is fed from the couple's data. The sheet's script (reveal, parallax, day tabs, flip digits) becomes small scoped client components. The programme's tabs come from the couple's events.

**Tech Stack:** Next.js 16, React 19, TypeScript, next-intl 4, `next/font` (Bodoni Moda, Pinyon Script), the shared groundwork.

**Spec:** `docs/superpowers/specs/2026-10-02-three-themes-design.md` (D1–D3, D7–D9, *Theme C*).
**Playbook:** `docs/superpowers/plans/2026-10-02-theme-port-playbook.md`.
**Source (read-only):** `/Users/tarik.klezo/Downloads/Invitation_Beach_Paula_Ricardo_FINAL_Tarik_2026-10-02/site` — `index.html` (175 lines), `style.css` (1 637 lines, five `:root` layers; about 724 live rules and 351 that name a class the markup never uses), `app.js` (95 lines), `assets/` (52 PNG, 82 MB, about half referenced).
**Live reference:** `https://cabo-invitation-mariage.emiliethestudio.chatgpt.site`.

## Global Constraints

- Folder `landing/src/components/invitation/themes/cabo-verde/`; id `cabo-verde`; camelCase `caboVerde`; PascalCase `CaboVerde`; prefix `cv`; scope class `theme-cabo-verde`; catalogue namespace `Invitation.caboVerde`; font variables `--font-cv-display` (Bodoni Moda), `--font-cv-script` (Pinyon Script); column class `cv-column`; the root element carries `data-theme-root=""`.
- Manifest: name `Cabo Verde`; description `Pieds dans le sable, eau turquoise et bateaux colorés : un mariage tropical au bord de l'océan.`; `accentColor` `#3aaeb5`; `cover` `/themes/cabo-verde/cover.webp`.
- `supports` (literal strings, in this order): `"countdown"`, `"map"`, `"timeline"`, `"dress-code"`, `"accommodation"`, `"playlist"`, `"transport"`, `"rsvp"`.
- Section order, as designed: hero → welcome → countdown → venue (map) → itinerary (timeline) → dress code → stays → playlist → travel notebook (transport) → rsvp → footer.
- **Layout:** the root is the page backdrop; `.cv-column` is the designer's `main` (max-width 680px, centred; on desktop a rounded card with 2rem of backdrop padding above and below — the designer's `@media (min-width: 681px)` rules).
- Dropped, and not to be drawn: the opening-doors overlay and `body.locked` (the sheet carries them, the markup never did), the calendar block, the postcard, the vinyl record (dead rules), the play buttons and durations of the track list (no audio exists), the free-text song form (replaced by the Spotify search), the "Elle / Lui" dress notes, the separate Prénom / Nom inputs (one `fullName`), the RSVP's partner radio pair stays but feeds `partyMode`. **Not drawn because the design has no section for them:** `menu`, `faq`, `gift-list`, `gallery`, `intro-video`.
- Nothing of the demo wedding (Paula, Ricardo, Baía das Gatas, São Vicente, Mindelo, Laginha, the tracks…) outside `demo-data.ts`; `theme-checks.test.mjs` enforces it for `cabo-verde`.
- Playbook §1 applies in full: never commit, own only `THEME`, `landing/public/themes/cabo-verde/` and `Invitation.caboVerde`.

## Review Focus

- **Words drawn by the stylesheet** — eight `content:` strings, all on `.hero:after` (the live stamp) or on dead `.hero .rule:before`; the live one is `NOTRE MARIAGE · AU BORD DE L'OCÉAN`. None may reach a real wedding; the pipeline fails until each is mapped (Task 1).
- **Tabs from events** — one tab per event, ordered by date; one event hides the tabs and the flow chips; zero events with a schedule still shows the moments; the `heavy` set has three events, `minimal` none (Task 4).
- **Flip digits and hydration** — the three-digit day counter must show placeholders on the server and first client render, then real numbers, with no mismatch warning, and flip when a value changes (Task 3).
- **Reveal and parallax** — `.section.visible` drives titles, eyebrows and rules; the parallax writes `--section-shift` on every section from one scroll listener that is removed on unmount and off under reduced motion (Tasks 2, 9).
- **Heavy assets** — 52 PNG / 82 MB in; only the referenced ones out, as WebP (Task 1).
- **The playlist's idle animation** — if the guitarist only moves under `.playing`, that class must be permanent (Task 6).

---

## Appendix A — French catalogue source (namespace `Invitation.caboVerde`)

`[slot …]` marks a message offered for rewriting. Defaults are neutral. "(ciao)" = start from the same key family in `Invitation.ciaoAmore` and adapt only what is in ciao-amore's voice.

| Key | French |
|---|---|
| `hero.eyebrow` | Nous nous marions *(shown when `copy.heroKicker` is empty)* |
| `hero.stamp` | Notre mariage **[slot hero.stamp]** *(the line drawn by the stylesheet on the hero)* |
| `hero.cta` | Découvrir **[slot hero.cta]** |
| `welcome.eyebrow` | Notre mariage **[slot hero.welcomeEyebrow]** |
| `welcome.titleLine1` / `titleLine2` | Notre plus beau voyage / commence avec vous. **[slot hero.welcomeTitle, multiline]** |
| `welcome.intro` | Tous ceux que nous aimons réunis pour célébrer notre histoire. *(when `copy.announcement` is empty)* |
| `countdown.until` | Jusqu'au **[slot countdown.until]** *(the theme appends the day and month)* |
| `countdown.titleLine1` / `titleLine2` | Le jour J / approche. **[slot countdown.title, multiline]** |
| `countdown.caption` | avant de célébrer notre mariage **[slot countdown.caption]** |
| `countdown.label` | Compte à rebours |
| `countdown.unitDays` / `unitHours` / `unitMinutes` / `unitSeconds` | ICU plurals: jour(s), heure(s), minute(s), seconde(s) |
| `venue.eyebrow` | Le lieu **[slot map.eyebrow]** |
| `venue.route` | Voir sur la carte |
| `itinerary.eyebrow` | Un séjour · une histoire d'amour **[slot timeline.eyebrow]** |
| `itinerary.title` | Le programme **[slot timeline.title]** |
| `itinerary.flowLabel` | Les temps forts du séjour |
| `dress.eyebrow` | Dress code **[slot dress-code.eyebrow]** |
| `dress.paletteLabel` | Palette de couleurs |
| `stay.eyebrow` | Où dormir **[slot accommodation.eyebrow]** |
| `stay.titleLine1` / `titleLine2` | Posez vos valises / pour le week-end **[slot accommodation.title, multiline]** |
| `stay.more` / `stay.less` / `stay.code` / `stay.book` / `stay.call` | Voir plus d'options / Masquer / Code {code} / Voir l'adresse / Appeler |
| `playlist.eyebrow` | La bande-son de notre mariage **[slot playlist.eyebrow]** |
| `playlist.titleLine1` / `titleLine2` | Playlist / participative **[slot playlist.title, multiline]** |
| `playlist.intro` | Ajoutez le titre qui vous fera rejoindre la piste. **[slot playlist.intro]** |
| `playlist.openers` | Pour ouvrir la danse |
| `playlist.*` (search label, placeholder, loading, no result, error, pick, remove, send, sending, thanks, limit) | (ciao) `Invitation.ciaoAmore.playlist` |
| `travel.eyebrow` | Quelques repères **[slot transport.eyebrow]** |
| `travel.title` | Le carnet de voyage **[slot transport.title]** |
| `travel.open` | Ouvrir |
| `rsvp.stamp` | R.S.V.P. *(decoration, kept in every language)* |
| `rsvp.deadline` | `Réponse souhaitée avant le {date}` |
| `rsvp.title` | Vous venez ? **[slot rsvp.title]** |
| `rsvp.nameLabel` / `attendanceLegend` / `attendanceYes` / `attendanceNo` | Prénom et nom / Serez-vous des nôtres ? / Oui, avec joie / Non, à regret |
| `rsvp.partnerLegend` / `partnerYes` / `partnerNo` | Viendrez-vous avec votre conjoint·e ? / Oui / Non |
| `rsvp.thanksTitle` / `thanksBody` | Merci ! / Votre réponse a bien été prise en compte. |
| `rsvp.*` (partner name, children count, child field, dietary, message, submit, pending, error) | (ciao) `Invitation.ciaoAmore.rsvp` |
| `footer.note` | Avec amour |

---

### Task 1: Assets, fonts and the generated stylesheet

**Files:**
- Create: `landing/public/themes/cabo-verde/*.webp` (about 25 files)
- Create: `…/cabo-verde/fonts.ts`
- Create (generated): `…/cabo-verde/cabo-verde.css`
- Scratch: `$SCRATCH/cabo-css.json`, `$SCRATCH/cabo-assets.txt`

**Interfaces:**
- Produces: `caboVerdeFontVars: string`; the generated stylesheet; assets at `/themes/cabo-verde/<name>.webp`; custom properties the root must set: `--cv-place`, `--cv-stamp`, `--cv-monogram`.

- [ ] **Step 1: Convert only what is referenced**

`SRC=…/site/assets`, `DEST=landing/public/themes/cabo-verde`. Run the playbook's `referenced-assets.mjs` over `style.css` and `index.html`, convert the PNGs to WebP, copy anything else (§3.1). Expected: about 25 of 52 files; list the ones left out in your report. Report `du -sh` (was 82 MB; expect under 10 MB).

- [ ] **Step 2: Fonts**

`fonts.ts`:

```ts
import { Bodoni_Moda, Pinyon_Script } from "next/font/google";

/**
 * Fonts for the "Cabo Verde" theme.
 *
 * The designer's sheet names Apple-only faces — Didot / Bodoni 72 for headings and
 * Snell Roundhand for the script — and the cross-platform Times New Roman and
 * Arial for the rest. Apple devices keep exactly what was approved (the pipeline
 * leaves those names first) and these web faces follow them, so Windows and
 * Android no longer fall back to a plain serif for the headings.
 *
 * Apply `caboVerdeFontVars` on the theme root.
 */

/** Headings and the names: Didot's / Bodoni 72's stand-in. */
const display = Bodoni_Moda({
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-cv-display",
});

/** The italic flourishes: Snell Roundhand's stand-in. */
const script = Pinyon_Script({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-cv-script",
});

export const caboVerdeFontVars = [display.variable, script.variable].join(" ");
```

- [ ] **Step 3: Pipeline config and run**

`$SCRATCH/cabo-css.json`:

```json
{
  "source": "/Users/tarik.klezo/Downloads/Invitation_Beach_Paula_Ricardo_FINAL_Tarik_2026-10-02/site/style.css",
  "out": "/Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie/landing/src/components/invitation/themes/cabo-verde/cabo-verde.css",
  "scope": "theme-cabo-verde",
  "columnClass": "cv-column",
  "assets": ["./assets/=/themes/cabo-verde/", ".png=.webp"],
  "fonts": [
    { "family": "Didot", "variable": "--font-cv-display", "position": "after" },
    { "family": "Bodoni 72", "variable": "--font-cv-display", "position": "after" },
    { "family": "Snell Roundhand", "variable": "--font-cv-script", "position": "after" },
    { "family": "Bodoni 72 Italic", "variable": "--font-cv-script", "position": "after" }
  ],
  "decor": {},
  "externalVars": ["--c", "--section-shift", "--section-shift-soft"],
  "publicDir": "/Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie/landing/public",
  "markup": ["/Users/tarik.klezo/Downloads/Invitation_Beach_Paula_Ricardo_FINAL_Tarik_2026-10-02/site/index.html"]
}
```

Run `mkdir -p landing/src/components/invitation/themes/cabo-verde && npm run themes:port-css -w landing -- $SCRATCH/cabo-css.json`.

`externalVars` lists the custom properties the markup or the scripts set at runtime (`--c` on each palette swatch, `--section-shift` and `--section-shift-soft` from the parallax); without it the pipeline rightly reports them as used and never defined.

**It fails first, on purpose**, listing the `content:` strings that carry letters. Copy each string exactly as printed (double spaces and the typographic apostrophe `’` included) into `decor`:

| String printed | Custom property | Where it ends up |
|---|---|---|
| `SÃO VICENTE  ·  CABO VERDE` (three layers) | `--cv-place` | overridden by the stamp below in the final cascade, but must still be mapped |
| `NOTRE MARIAGE  ·  AU BORD DE L’OCÉAN` | `--cv-stamp` | the live stamp on `.hero:after` |
| `N&T` and `P&R` | `--cv-monogram` | dead selectors (`.hero .rule:before`); mapped to keep the generated file free of words |

Re-run until it writes the file. Then: `grep -n "content: *var(--cv-" cabo-verde.css` shows the mapped rules; `grep -c "@keyframes" cabo-verde.css` and `grep -n "@keyframes" … | head` show names starting `cabo-verde-` (the pipeline prefixes them: the sheet's bare `spin`, `bob`, `tide` and `softRise` would otherwise collide with other themes).

- [ ] **Step 4: Check the output**

```bash
CSS=landing/src/components/invitation/themes/cabo-verde/cabo-verde.css
grep -nE "^(body|html|main)\b" $CSS            # nothing
grep -n "cv-column" $CSS | head -4             # the 680px column, its radius and shadow
grep -n "^\.theme-cabo-verde *{" $CSS | head   # :root layers and body, folded onto the root
grep -n "padding: *2rem 0" $CSS                # the desktop backdrop padding, now on the root
grep -c "var(--font-cv-" $CSS
```

- [ ] **Step 5: Checkpoint**

`tsc` filtered (empty); the leak test for `cabo-verde` (PASS). Do not commit.

---

### Task 2: Demo data, manifest, root, parallax

**Files:**
- Create: `…/cabo-verde/demo-data.ts`, `theme.config.ts`, `CaboVerdeRoot.tsx`, `editor.ts` (empty list, filled section by section), `responsive.css`, `dates.ts`, `maps-url.ts`
- Create: `…/cabo-verde/sections/Section.tsx`, `ParallaxShift.tsx`, `Monogram.tsx`
- Test: `landing/src/lib/cabo-verde-dates.test.mjs`

**Interfaces:**
- Produces:
  - `dayMonth(iso: string | null | undefined, locale: string): string | null` — "30 avril" (French "1er mai").
  - `mapsUrl(venue): string`.
  - `Section({ id?, className, editorSection, children })` — `Reveal` section with `revealedClass="visible"`, `threshold={0.13}`; adds `section … reveal`.
  - `ParallaxShift()` — client leaf, writes `--section-shift` and `--section-shift-soft` on every `.section` of its theme root.
  - `Monogram({ text })` — "P & R" with the separator in `<i>`.
  - `CABO_VERDE_DEMO`, `caboVerdeTheme`, `CaboVerdeRoot`.

- [ ] **Step 1: Failing test, then helpers**

`landing/src/lib/cabo-verde-dates.test.mjs`:

```js
/**
 *   node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs \
 *     --test landing/src/lib/cabo-verde-dates.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";

import { dayMonth } from "../components/invitation/themes/cabo-verde/dates.ts";
import { mapsUrl } from "../components/invitation/themes/cabo-verde/maps-url.ts";

test("a day and month, without weekday or year", () => {
  assert.equal(dayMonth("2027-04-30", "fr-FR"), "30 avril");
  assert.equal(dayMonth("2027-05-01", "fr-FR"), "1er mai");
  assert.equal(dayMonth("2027-04-30", "en-US"), "April 30");
  assert.equal(dayMonth("2027-04-30T16:30:00-01:00", "fr-FR"), "30 avril");
  assert.equal(dayMonth(undefined, "fr-FR"), null);
  assert.equal(dayMonth("later", "fr-FR"), null);
});

test("the maps link is the couple's own, else a search for the place", () => {
  assert.equal(mapsUrl({ name: "X", mapsUrl: "https://maps.example/x" }), "https://maps.example/x");
  const url = new URL(mapsUrl({ name: "Plage", city: "Ville" }));
  assert.equal(url.searchParams.get("query"), "Plage, Ville");
});
```

Run it (FAIL), then create `dates.ts`:

```ts
/** "30 avril" — the day and month as written in an ISO date, in the page's language. */
export function dayMonth(iso: string | null | undefined, locale: string): string | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return null;
  const date = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  const text = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", timeZone: "UTC" }).format(date);
  return locale.toLowerCase().startsWith("fr") ? text.replace(/^1 /, "1er ") : text;
}
```

and `maps-url.ts`:

```ts
import type { InvitationData } from "../types";

/** The couple's own maps link, else a Google Maps search for the place. */
export function mapsUrl(venue: InvitationData["venue"]): string {
  if (venue.mapsUrl) return venue.mapsUrl;
  const query = [venue.name, venue.address ?? venue.city].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?${new URLSearchParams({ api: "1", query })}`;
}
```

Run again — Expected: PASS, 2 tests.

- [ ] **Step 2: The shared pieces of the theme**

`sections/Section.tsx`:

```tsx
import type { ReactNode } from "react";

import { Reveal } from "../../reveal";

/**
 * A designer section: `.section` with the `reveal` class, shown (`visible`) once
 * seen. The designer's script observed every `.reveal` in the document and added
 * a `motion-title` class to every `.section h2`; here each section observes
 * itself and its title carries the class in the markup.
 */
export function Section({
  id,
  className,
  editorSection,
  children,
}: {
  id?: string;
  className: string;
  editorSection?: string;
  children: ReactNode;
}) {
  return (
    <Reveal
      as="section"
      id={id}
      className={`section ${className} reveal`}
      revealedClass="visible"
      threshold={0.13}
      data-editor-section={editorSection}
    >
      {children}
    </Reveal>
  );
}
```

`sections/ParallaxShift.tsx` — the designer's parallax (lines 77–95 of `app.js`), scoped and cleaned:

```tsx
"use client";

import { useEffect, useRef } from "react";

/**
 * Nudges every section a few pixels against the scroll (`--section-shift`, and a
 * softer `--section-shift-soft`) so the painted decorations drift. The designer
 * did it on every `.section` of the document; this does it for its own theme
 * root, from one throttled scroll listener that it removes, and not at all for
 * a reader who asked for no motion.
 */
export function ParallaxShift() {
  const marker = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = marker.current?.closest("[data-theme-root]");
    if (!root) return;

    let ticking = false;
    const update = () => {
      root.querySelectorAll<HTMLElement>(".section").forEach((section) => {
        const rect = section.getBoundingClientRect();
        const shift = Math.max(-24, Math.min(24, (window.innerHeight / 2 - rect.top - rect.height / 2) * 0.045));
        section.style.setProperty("--section-shift", `${shift}px`);
        section.style.setProperty("--section-shift-soft", `${shift * 0.45}px`);
      });
      ticking = false;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return <span ref={marker} hidden aria-hidden="true" />;
}
```

`sections/Monogram.tsx`: the same split as the Château's `Crest` — `/^(.+?)\s*([&·+])\s*(.+)$/` → `{left} <i>{separator}</i> {right}`, else the whole text — returning a `<div className="monogram">`.

- [ ] **Step 3: Demo data**

`demo-data.ts` — the designer's wedding. Use `demoStartsAt(5, "16:30", "-01:00")` (Cabo Verde keeps UTC−1; the designer wrote `+01:00`, a small error that moves the countdown by two hours), the day before and the day after the wedding computed in UTC as in Maré Alta's demo data. Content:

- `couple`: `Paula` / `Ricardo`, `monogram: "P & R"`.
- `event`: `rsvpDeadline: demoDate(2)`, `timezone: "Atlantic/Cape_Verde"`.
- `venue`: name `Baía das Gatas`, city `São Vicente`, country `Cabo Verde`, `mapsUrl` the designer's `https://maps.google.com/?q=Baia+das+Gatas+Cabo+Verde`, no `image` (the CSS carries the ceremony art), `access`: four modes — `Arrivée` ["Aéroport Cesária-Évora, São Vicente."], `Monnaie` ["Escudo cap-verdien. L'euro est souvent accepté."], `Climat` ["Chaleur douce et vent marin : prévoyez une étole le soir."], `Cérémonie` ["Prévoyez des chaussures adaptées au sable et une étole pour la soirée."].
- `copy`: `heroKicker: "Nous nous marions"`, `announcement: "Une cérémonie les pieds dans le sable, le bruit des vagues et tous ceux que nous aimons réunis pour célébrer notre histoire."`, `venueIntro: "Une cérémonie pieds nus sur le sable blanc, entre cocotiers, eau turquoise et reliefs volcaniques."`, `playlistIntro: "Trois morceaux ouvrent la danse. Ajoutez celui qui vous fera rejoindre la piste."`, `footerNote: "Avec amour · les pieds dans le sable"`.
- `events`: `welcome-dinner` ("Bienvenue", the day before, 19:30), `wedding-day` ("Le grand jour", 16:30), `brunch` ("Brunch", the day after, 12:00).
- `schedule`: `welcome-dinner`: 19:30 "Bienvenue sur la plage" / "Un premier verre ensemble face à l'océan."; `wedding-day`: 16:30 "Cérémonie" / "Au bord de l'Atlantique, à Baía das Gatas." — wait, **the place name is the demo's**: it lives in `demo-data.ts`, which is allowed — 18:00 "Cocktail au coucher du soleil" / "Verres frais, bouchées délicates et musique live.", 20:30 "Dîner sous les guirlandes" / "De grandes tablées, des fleurs et l'océan pour horizon.", 23:30 "Première danse & fête" / "On ouvre le bal, puis on danse jusqu'au lever du soleil."; `brunch`: 12:00 "Brunch pieds nus" / "Un dernier moment ensemble au bord de l'eau." — each entry with its `event` key and `day`.
- `dressCode`: `title: "Élégance\nles pieds dans le sable"`, `body: "Une allure chic et légère, pensée pour danser face à l'océan. Lin, soie, voile et couleurs tropicales sont les bienvenus."`, `colors: ["#e96b8a", "#ef9f3c", "#e7cf67", "#2d8ca5", "#174f8b", "#7a1232"]`, `note: "Le blanc et l'ivoire sont réservés aux mariés."`.
- `stays` (three): `Mindelo centre` (city `Mindelo`, address "Hôtels de charme au cœur des restaurants et des rues colorées.", distance `20 min`), `Laginha` (city `Laginha`, "Chambres lumineuses à quelques pas du sable et du centre.", `25 min`), `São Pedro` (city `São Pedro`, "Adresses paisibles, lits face à l'Atlantique et réveils au soleil.", `35 min`).
- `playlist`: Best Part / Daniel Caesar feat. H.E.R.; Until I Found You / Stephen Sanchez; Sodade / Cesária Évora.
- `rsvp`: `{ allowPartner: true, allowChildren: true, dietaryOptions: ["Aucun", "Végétarien", "Vegan", "Sans gluten"], collectMessage: true }`.
- `texts` (the designer's wording for the showcase): `"hero.stamp": "Notre mariage · au bord de l'océan"`, `"hero.welcomeEyebrow": "Notre mariage au bord de l'océan"`, `"hero.welcomeTitle": "Notre plus beau voyage\ncommence avec vous."`, `"countdown.caption": "avant de célébrer notre mariage au bord de l'Atlantique"`, `"timeline.eyebrow": "Trois jours · une histoire d'amour"`, `"accommodation.title": "Posez vos valises\nà Mindelo"`.

- [ ] **Step 4: Manifest, root, editor, responsive**

`theme.config.ts`: the playbook skeleton with the values of *Global Constraints*. `editor.ts`: empty list, `NS = "Invitation.caboVerde"`.

`CaboVerdeRoot.tsx`:

```tsx
import { useLocale, useTranslations } from "next-intl";
import type { CSSProperties } from "react";

import { JsFlag } from "../reveal";
import { monogramOf } from "../monogram";
import { cssString, slot } from "../text";
import type { InvitationData, ModuleId } from "../types";

import "./cabo-verde.css";
import "./responsive.css";

import { caboVerdeFontVars } from "./fonts";
import { ParallaxShift } from "./sections/ParallaxShift";

/**
 * "Cabo Verde" — a beach wedding in a painted card.
 *
 * The root is the page backdrop (the designer's `body`); the column inside it is
 * the designer's `main`. Three words of the stylesheet are drawn with `content:`
 * (the stamp on the hero, a place line and a monogram on dead selectors); the
 * pipeline turned them into custom properties, set here from the couple's data.
 */
export function CaboVerdeRoot({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.caboVerde");
  const locale = useLocale();
  const enabled = data.modules;
  const has = (id: ModuleId) => !enabled || enabled.includes(id);

  const place = [data.venue.city, data.venue.country].filter(Boolean).join(" · ");
  const decor = {
    "--cv-place": cssString(place.toLocaleUpperCase(locale)),
    "--cv-stamp": cssString((slot(data, "hero.stamp") ?? t("hero.stamp")).toLocaleUpperCase(locale)),
    "--cv-monogram": cssString(monogramOf(data.couple, "&")),
  } as CSSProperties;

  void has; // used by the sections added in the next tasks

  return (
    <main className={`theme-cabo-verde ${caboVerdeFontVars}`} data-theme-root="" style={decor}>
      <JsFlag />
      <ParallaxShift />
      <div className="cv-column">{/* sections: Tasks 3–7 */}</div>
    </main>
  );
}
```

`responsive.css`: the comment header and `.theme-cabo-verde { min-height: 100svh; }`.

- [ ] **Step 5: Register and check**

`npm run themes:sync -w landing`; `curl … /fr/invitation/demo/cabo-verde` → 200, a turquoise/pale page with an empty card. `themes:check`, `tsc` filtered, the date test and `theme-supports.test.mjs` PASS. Do not commit.

---

### Task 3: Hero, welcome and countdown

**Files:**
- Create: `…/cabo-verde/sections/HeroSection.tsx`, `WelcomeSection.tsx`, `CountdownSection.tsx`
- Modify: `CaboVerdeRoot.tsx`, `editor.ts`, `responsive.css`
- Scratch: `$SCRATCH/messages/cabo-verde/{fr,…,ja}.json`

**Interfaces:**
- Produces: `HeroSection`, `WelcomeSection`, `CountdownSection` (client).
- Consumes: `heroDates`, `ScrollToButton`, `Section`, `dayMonth`.

**Source:** `index.html:14–51`, `app.js:16–35` (countdown) and `1–3` (scroll cue).

- [ ] **Step 1: Hero**

`<section className="hero paper-panel" data-editor-section="hero">` with the designer's children in order: `.hero-bg`, `.hero-sunset`, `.hero-sun`, `.hero-horizon-mask` (all `aria-hidden`, empty), `.hero-copy` (`<p className="eyebrow">{data.copy?.heroKicker ?? t("eyebrow")}</p>`, `<h1><span>{partner1}</span><em>&</em><span>{partner2}</span></h1>`, `<p className="date">{heroDates(data, locale).dotted}</p>`, `<p className="place">{[venue.name, venue.city].filter(Boolean).join(" · ")}</p>`), `.hero-boats` with the three `<img className="hero-boat boat-one|two|three" src="/themes/cabo-verde/hero-boat-N-v19.webp" alt="">`, and `<ScrollToButton target="#cv-welcome" className="scroll-cue" ariaLabel={…}>{slot(data,"hero.cta") ?? t("cta")} <span>↓</span></ScrollToButton>`. The hero is the first view: no `loading="lazy"` on the boats.

The hero's stamp (`.hero:after`) is drawn by the stylesheet from `--cv-stamp`; nothing to render.

- [ ] **Step 2: Welcome**

`<Section id="cv-welcome" className="welcome decorated" editorSection="hero">`: `<p className="eyebrow cobalt">{slot("hero.welcomeEyebrow") ?? t("eyebrow")}</p>`; `<h2 className="motion-title">` first line, `<br/>`, `<em>` second line of `slot("hero.welcomeTitle") ?? line1\nline2`; `<p className="intro">{data.copy?.announcement ?? t("intro")}</p>`; `<img className="welcome-island" src="/themes/cabo-verde/beach-island-v8.webp" alt="" aria-hidden="true">`.

- [ ] **Step 3: Countdown (client)**

`CountdownSection` — port of the markup at lines 40–51 and the timer at `app.js:16–35`:

```tsx
"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { heroDates } from "../../date-range";
import { slot } from "../../text";
import type { InvitationData } from "../../types";

import { dayMonth } from "../dates";
import { Section } from "./Section";

const UNITS = [
  { key: "days", label: "unitDays", digits: 3 },
  { key: "hours", label: "unitHours", digits: 2 },
  { key: "minutes", label: "unitMinutes", digits: 2 },
  { key: "seconds", label: "unitSeconds", digits: 2 },
] as const;

/** Null until mounted, so the server and the first client render both print placeholders. */
function useRemaining(startsAt: string) {
  const target = new Date(startsAt).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (now === null || Number.isNaN(target)) return null;
  const gap = Math.max(0, target - now);
  return {
    days: Math.floor(gap / 86400000),
    hours: Math.floor((gap % 86400000) / 3600000),
    minutes: Math.floor((gap % 3600000) / 60000),
    seconds: Math.floor((gap % 60000) / 1000),
  };
}

export function CountdownSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.caboVerde.countdown");
  const locale = useLocale();
  const remaining = useRemaining(data.event.startsAt);
  const until = dayMonth(data.event.startsAt, locale);
  const [titleFirst = "", ...titleRest] = (slot(data, "countdown.title") ?? `${t("titleLine1")}\n${t("titleLine2")}`).split("\n");

  return (
    <Section className="countdown" editorSection="countdown">
      <div className="count-top">
        <p className="eyebrow">{[slot(data, "countdown.until") ?? t("until"), until].filter(Boolean).join(" ")}</p>
        <span>{heroDates(data, locale).dotted}</span>
      </div>
      <h2 className="motion-title">
        <span className="count-title-line">{titleFirst}</span>
        <em>{titleRest.join(" ")}</em>
      </h2>
      <div className="count-grid" aria-label={t("label")}>
        {UNITS.map(({ key, label, digits }) => {
          const value = remaining ? String(remaining[key]).padStart(digits, "0") : "0".repeat(digits);
          return (
            <div key={key}>
              {/* A new key per value remounts the number, which replays the designer's flip. */}
              <strong key={value} className={remaining ? "digit-flip" : undefined}>{value}</strong>
              <span>{t(label, { count: remaining?.[key] ?? 0 })}</span>
            </div>
          );
        })}
      </div>
      <p className="count-caption">{slot(data, "countdown.caption") ?? t("caption")}</p>
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative, positioned by CSS. */}
      <img className="wedding-rings countdown-rings" src="/themes/cabo-verde/wedding-rings-v22.webp" alt="" aria-hidden="true" />
    </Section>
  );
}
```

The designer sets `.digit-flip` only after the value changes and removes it to re-trigger; remounting via `key` replays the animation, and the pipeline-prefixed `digitFlip` keyframes run on mount. Under reduced motion the sheet turns the animation off.

- [ ] **Step 4: Slots, strings, render**

Slots: `hero.stamp`; `hero.cta`; `hero.welcomeEyebrow`; `hero.welcomeTitle` (multiline); `countdown.until`; `countdown.title` (multiline); `countdown.caption`. Add the `hero`, `welcome`, `countdown` keys of Appendix A in nine languages (ICU plurals; `ar` has six categories), merge. Root column: `<HeroSection/>`, `<WelcomeSection/>`, `has("countdown") ? <CountdownSection/> : null`; remove the `void has`.

- [ ] **Step 5: Verify**

Playbook §4. Look at: the hero stamp reads the demo text (from `texts`) and, with the `minimal` set, the neutral "NOTRE MARIAGE"; the boats animate; the names fit at 390 with "Marie-Charlotte / Jean-Baptiste"; no hydration warning (`console-check.mjs`); the seconds flip every second; the three-digit days. Compare with the reference. Do not commit.

---

### Task 4: Venue and itinerary

**Files:**
- Create: `…/cabo-verde/sections/VenueSection.tsx`, `ItinerarySection.tsx`
- Modify: `CaboVerdeRoot.tsx`, `editor.ts`, `responsive.css`

**Interfaces:**
- Produces: `VenueSection`, `ItinerarySection` (client — the tabs).
- Consumes: `dayMonth`, `mapsUrl`, `Section`.

**Source:** venue `index.html:53–63`; itinerary `65–89`; tabs `app.js:37–43`.

- [ ] **Step 1: Venue**

`<Section className="venue decorated" editorSection="map">`: `.venue-image` — empty `div`, with `style={{ backgroundImage: `url("${venue.image}")` }}` only when `venue.image` exists (the CSS draws the ceremony art by default); `.venue-card`: `<p className="eyebrow cobalt">{slot("map.eyebrow") ?? t("eyebrow")}</p>`, `<h2 className="motion-title">{venue.name}</h2>`, `<p>{[city, country].filter(Boolean).join(", ")}</p>` (omit when empty), `<p className="small">{copy.venueIntro}</p>` (omit when empty), `<a href={mapsUrl(venue)} target="_blank" rel="noopener">{t("route")}</a>`; then `<img className="venue-wedding-flowers" src="/themes/cabo-verde/wedding-flowers-v22.webp" alt="" aria-hidden="true">`.

- [ ] **Step 2: Itinerary**

`ItinerarySection` (`"use client"`, `Section className="itinerary decorated" editorSection="timeline"`). Build the days from `data.events` and `data.schedule`:

```ts
// One day per event, in date order. An event with no moments still gets a tab.
const days = [...(data.events ?? [])]
  .filter((event) => event.date)
  .sort((a, b) => a.date!.localeCompare(b.date!))
  .map((event) => ({
    key: event.kind,
    label: dayMonth(event.date, locale) ?? event.name,
    name: event.name,
    moments: (data.schedule ?? []).filter(
      (entry) => (entry.event ?? (entry.day === 2 ? "brunch" : "wedding-day")) === event.kind,
    ),
  }));
```

- No events with a date but some `schedule`: one day with all the moments and **no tabs, no flow chips**. Nothing at all: return `null`.
- One day: show its moments, no tabs, no flow.
- Several: the designer's markup — `<img className="beach-decor party-lights" src="/themes/cabo-verde/beach-guirlande-v8.webp" alt="" aria-hidden>`; `<p className="eyebrow light">{slot("timeline.eyebrow") ?? t("eyebrow")}</p>`; `<h2 className="motion-title">{slot("timeline.title") ?? t("title")}</h2>`; `<div className="days-tabs" role="tablist">` of `<button type="button" role="tab" aria-selected className={active ? "tab active" : "tab"} id aria-controls>{label}</button>`; one `<div className="day-panel …" role="tabpanel">` per day (`active` for the selected, plus `day-entering` for 700 ms after a switch — a `useState` + `setTimeout` cleared on change/unmount) holding `<article><time>{time}</time><div><h3>{title}</h3><p>{description}</p></div></article>` per moment (omit an empty `<p>`); finally `<div className="program-flow" aria-label={t("flowLabel")}>` with the day `name`s as `<span>`s separated by `<i />`.
- `copy.scheduleIntro`, if present, goes under the title as `<p className="intro">`.
- Arrow-key navigation between tabs (Left/Right/Home/End, `tabIndex` roving) as the WAI-ARIA tabs pattern asks.

- [ ] **Step 3: Slots, strings, render, verify**

Slots: `map.eyebrow`; `timeline.eyebrow`; `timeline.title`. Strings: `venue`, `itinerary`. Root: `has("map") ? <VenueSection/> : null`, `has("timeline") ? <ItinerarySection data={data} /> : null`.

Verify: the demo shows three tabs ("29 avril", "30 avril", "1er mai") and the second holds four moments; switching animates; `minimal` shows neither section's tabs (no events: the itinerary is absent); `heavy` has three events and twelve moments; the tab bar survives `de` and `ar`. Compare with the reference. Do not commit.

---

### Task 5: Dress code and stays

**Files:**
- Create: `…/cabo-verde/sections/DressSection.tsx`, `StaySection.tsx`
- Modify: `CaboVerdeRoot.tsx`, `editor.ts`, `responsive.css`

**Interfaces:**
- Produces: `DressSection`, `StaySection` (client — the "more options" toggle).

**Source:** `index.html:91–115`.

- [ ] **Step 1: Dress code**

Return `null` without `data.dressCode`. `<Section className="dress decorated" editorSection="dress-code">`: `<p className="eyebrow">{slot("dress-code.eyebrow") ?? t("eyebrow")}</p>`; `<h2 className="motion-title">` the first line of `dressCode.title`, `<br/>`, `<em>` the rest; `<p className="intro">{dressCode.body}</p>`; `<div className="palette" aria-label={t("paletteLabel")}>` of `<i style={{ "--c": colour } as CSSProperties} />` (omit the palette when there are no colours); `<p className="white-note">{dressCode.note}</p>` when present. If `dressCode.image` exists, show it as `<img className="cv-dress-photo">` under the intro (style in `responsive.css`: full width of the section's content, rounded like the card). No "Elle / Lui" notes.

- [ ] **Step 2: Stays**

Return `null` without stays. `<Section className="stay decorated" editorSection="accommodation">`: eyebrow (`slot("accommodation.eyebrow")`), `<h2 className="motion-title">` first line, `<br/>`, `<em>` rest of `slot("accommodation.title") ?? line1\nline2`; `<img className="beach-decor stay-pilotis" src="/themes/cabo-verde/beach-pilotis-v8.webp" alt="" aria-hidden="true">`; `copy.staysIntro` as `<p className="intro">` when present; `<div className="stay-list">` — primary stays (`secondary !== true`), then a toggle button (`t("more")` / `t("less")`) revealing the secondary ones. Each `<article>`: `<span>{two-digit index}</span><div><small>{city}</small><h3>{name or <a href>}</h3><p>{address}</p>{offer / code line}{phone link}</div><b>{distance}</b>`; `image`, when set, as a small round photo before the text (`cv-stay-photo`, styled in `responsive.css`). Then `<div className="stay-objects" aria-hidden="true"><img className="rolling-luggage-set" src="/themes/cabo-verde/rolling-luggage-set-v25.webp" alt=""></div>`.

- [ ] **Step 3: Slots, strings, render, verify**

Slots: `dress-code.eyebrow`; `accommodation.eyebrow`; `accommodation.title` (multiline). Strings: `dress`, `stay`. Root: `has("dress-code")`, `has("accommodation")`.

Verify: `heavy` has ten hotels (three secondary) and eight colours; `minimal` has neither; a hotel without `url`/`phone` shows neither link. Compare with the reference. Do not commit.

---

### Task 6: Playlist and travel notebook

**Files:**
- Create: `…/cabo-verde/sections/PlaylistSection.tsx`, `TravelSection.tsx`
- Modify: `CaboVerdeRoot.tsx`, `editor.ts`, `responsive.css`

**Interfaces:**
- Produces: `PlaylistSection` (client), `TravelSection`.
- Consumes: `useGuestPlaylist`.

**Source:** playlist `index.html:117–134`; travel `136–150`.

- [ ] **Step 1: Playlist**

`<Section id="cv-playlist" className="playlist decorated" editorSection="playlist">`:

- `<p className="eyebrow">{slot("playlist.eyebrow") ?? t("eyebrow")}</p>`; `.playlist-intro`: when the couple lists opening tracks, `<span>01 — {NN}</span>` (NN = their count, two digits; omit otherwise), `<h2 className="motion-title">` first line, `<br/>`, `<em>` rest of `slot("playlist.title") ?? line1\nline2`, and `<p>{data.copy?.playlistIntro ?? slot("playlist.intro") ?? t("intro")}</p>`.
- `.wedding-music-visual` (`aria-hidden`) with `<img className="music-beach-guitar" src="/themes/cabo-verde/beach-wedding-guitar-v24.webp" alt="">`. **Check which rule animates it** (`grep -n "wedding-music-visual\|music-rings\|playing" cabo-verde.css`): the designer toggled `.playing` and `.accent-beat` from the play buttons. If the idle motion is gated on `.playing`, render `className="wedding-music-visual playing"` permanently — the guitarist is decoration, like the discs of the other themes; if it needs nothing, leave it.
- `.track-list`: for each `data.playlist` entry, `<div><span className="play" aria-hidden="true">♪</span><span><b>{title}</b><small>{artist}</small></span></div>` — no play button, no duration. A small heading `t("openers")` above when there are tracks; nothing when there are none.
- The guest search, driven by `useGuestPlaylist(data)` and rendered in normal flow (no portal): inside `<div className="song-form cv-suggest">` — a `role="combobox"` input (`ref={inputRef}`, `value={query}`, `onChange`, `onKeyDown={handleKeyDown}`, `aria-expanded`, `aria-controls={listId}`, catalogue label and placeholder); below it `<ul id={listId} role="listbox" className="cv-results">` (cover, title, artist; `aria-selected`; `onClick={() => choose(result)}`) with loading / no-result / error lines; `<ul className="cv-picked">` of `selected` with remove buttons; `<button type="button" onClick={send} disabled={pending || selected.length === 0}>` (send / sending). When `sent`: `<p className="form-message" role="status">{t("thanks")}</p>`; show `error` with `role="alert"`. Style `.cv-results` and `.cv-picked` in `responsive.css` from the section's own tokens (white on blue, hairlines `rgba(255,255,255,.2)`, the track-list row height).

- [ ] **Step 2: Travel notebook**

Render when `venue.access?.length` and (`has("transport")` or `has("map")`): `<Section className="practical decorated" editorSection="transport">`: `.travel-scene` (`aria-hidden`) with the three `<img className="travel-passport|travel-ticket|travel-plane" src="/themes/cabo-verde/travel-passport-v12.webp|travel-boarding-pass-v12.webp|travel-plane-v12.webp" alt="">`; eyebrow `slot("transport.eyebrow")`; `<h2 className="motion-title">{slot("transport.title") ?? t("title")}</h2>`; `<div className="practical-grid">` with one `<article>` per mode: `<span>{two-digit index}</span><h3>{mode}</h3><p>{details.join(" ")}</p>` and, when `link` exists, `<a href target="_blank" rel="noopener">{link.label ?? t("open")}</a>`. The designer's grid is two columns; with an odd or large number of modes check the last row.

- [ ] **Step 3: Slots, strings, render, verify**

Slots: `playlist.eyebrow`; `playlist.title` (multiline); `playlist.intro`; `transport.eyebrow`; `transport.title`. Strings: `playlist`, `travel` (+ ciao's playlist functional keys). Root: `has("playlist")`, then the travel notebook.

Verify: type "sodade" in the playlist field — Spotify results list; pick one (a chip appears); send — the thank-you shows and **nothing is written** (no `weddingId`). The guitarist moves at rest. `heavy` has six modes; `minimal` renders neither section. Compare with the reference. Do not commit.

---

### Task 7: RSVP and footer

**Files:**
- Create: `…/cabo-verde/sections/RsvpSection.tsx`, `FooterSection.tsx`
- Modify: `CaboVerdeRoot.tsx`, `editor.ts`, `responsive.css`

**Interfaces:**
- Produces: `RsvpSection` (client), `FooterSection`.
- Consumes: `useGuestRsvp`, `Monogram`, `dayMonth`, `formatFrenchDate`.

**Source:** `index.html:152–171`.

- [ ] **Step 1: RSVP**

`<Section id="cv-rsvp" className="rsvp decorated" editorSection="rsvp">` driven by `const rsvp = useGuestRsvp(data)`:

- `<div className="rsvp-editorial" aria-hidden="true"><span>{t("stamp")}</span><i /></div>`; `<p className="eyebrow light">{t("deadline", { date: formatFrenchDate(rsvpDeadline, { locale }) })}</p>` (the note `copy.rsvpNote` when there is no date; nothing when neither); `<h2 className="motion-title">{slot("rsvp.title") ?? t("title")}</h2>`; `copy.rsvpIntro` as a paragraph.
- Success: `<div className="rsvp-success show" role="status"><span>✓</span><h3>{t("thanksTitle")}</h3><p>{t("thanksBody")}</p></div>` instead of the form when `rsvp.sent`.
- Form (`onSubmit={rsvp.handleSubmit}`), the designer's markup: a required `fullName` input; the attendance `<fieldset>` with two radios `name="attendance"` (values `yes`/`no`) whose `onChange` calls `rsvp.setAttending`; when `rsvp.showParty`: if `rsvp.allowPartner`, the partner `<fieldset>` with two radios whose `onChange` call `rsvp.setPartyMode("partner" | "solo")` and, for partner, a required `partnerName` input; if `rsvp.allowChildren`, the children `<select name="childCount">` (none … `rsvp.maxChildren`, `onChange` → `rsvp.setChildCount`) and one required `childName-<i>` input per child; `dietary` select only when `data.rsvp.dietaryOptions` exist; `message` textarea only when `data.rsvp.collectMessage`; `rsvp.error` as `<p role="alert">`; `<button type="submit" disabled={rsvp.attending === null || rsvp.pending}>`.
- Re-key outside a real invitation: `key={data.weddingId ? "rsvp" : JSON.stringify(data.rsvp ?? {})}`.

- [ ] **Step 2: Footer**

`<footer className="beach-footer" data-editor-section="footer">`: (**mock-up gate**) `couple.portrait` as `<img className="cv-portrait" alt="">` above the monogram when present; `<Monogram text={monogramOf(data.couple, " & ")} />`; `<p>{[formatFrenchDate(day, { locale }), venue.city].filter(Boolean).join(" · ")}</p>` (`day` = the date written in `startsAt`); `<small>{data.copy?.footerNote ?? t("note")}</small>`; `copy.closing` as a further `<p>` when present. `responsive.css`: `.cv-portrait` — a 7rem circle, `object-fit: cover`, a gold hairline.

- [ ] **Step 3: Slots, strings, render, verify**

Slot: `rsvp.title`. Strings: `rsvp`, `footer`. Root: `has("rsvp")`, then `<FooterSection/>`.

Verify: demo — presence, then partner/children; `heavy` (adults-only) shows no child field; sending in the demo confirms and writes nothing; `minimal` still ends with the footer. Compare with the reference. Do not commit.

---

### Task 8: The catalogue, completely

**Files:** none new.

- [ ] **Step 1: Parity and untranslated keys**

`npm run themes:messages -w landing -- caboVerde $SCRATCH/messages/cabo-verde` once more, then the "identical to French" script of playbook §3.5; fix every key it lists that is not a name or an ornament (`rsvp.stamp` "R.S.V.P." is allowed). Spot-check `ar`, `zh`, `ja`.

- [ ] **Step 2: Every locale renders**

`de`, `ar`, `ja`: 200 and no `MISSING_MESSAGE` in `console-check.mjs`.

- [ ] **Step 3: Checkpoint**

`theme-checks.test.mjs` — all `cabo-verde` checks PASS: no demo word in the folder (the generated sheet included) or the nine namespaces, 20 slots declared / read / in the catalogue, every `data-editor-section` real, all eight supported modules drawn, hand-written keyframes prefixed. Do not commit.

---

### Task 9: Safety nets, the verification matrix, the fix loop

**Files:**
- Modify: `…/cabo-verde/responsive.css`

- [ ] **Step 1: No JavaScript, reduced motion**

Hidden until seen: `.reveal` (and its `.visible` consequences: `.section h2.motion-title`, the eyebrow `clip-path`, `h2:after`). Add the two blocks of playbook §3.4: under `.theme-cabo-verde:not([data-js])` and `prefers-reduced-motion: reduce`, `.reveal { opacity: 1; transform: none }`, `.section h2.motion-title { opacity: 1; transform: none; filter: none }`, `.section > .eyebrow, .section .venue-card > .eyebrow, .section .count-to { clip-path: none }`, `.section h2::after { transform: scaleX(1) }`. Verify with JavaScript disabled and with `reducedMotion: "reduce"`.

- [ ] **Step 2: The full matrix**

Playbook §4.1 in full, six widths, `minimal`/`heavy` at 390 and 1440, `de`/`ar` at 390 and 1440; `scrollW === clientW` everywhere; **open every image**. Specific to this theme: the card's rounded corners and the backdrop padding at ≥ 681px (and none below); the hero copy over the sunset at 390; the countdown's three-digit days at 320; the tabs at 390 with three long labels in `de`; the decorative corners (`.section.decorated::after`, mirrored by `:nth-of-type(even)`) — which assume the section order — not colliding with content when sections are absent (`minimal`); Arabic mirroring of the tabs, the stay rows (`grid-template-columns: 2.2rem 1fr auto`) and the travel grid. Fix in `responsive.css`, never in the generated sheet.

- [ ] **Step 3: Compare with the reference**

`themes:shoot-url` of the live reference at 390 and 1440. List each visible difference: intended (the dropped elements, the variable text, the tabs from events, the guest search) or unintended (fix).

- [ ] **Step 4: Console and final run**

`console-check.mjs` at 390 and 1440 for `fr` and `ar`: no hydration warning, no missing message, no failed image. Then:

```bash
npx tsc --noEmit -p landing/tsconfig.json 2>&1 | grep "themes/cabo-verde/"
(cd landing && npx eslint src/components/invitation/themes/cabo-verde)
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"
npm run themes:check -w landing
```

Expected: tsc output empty; eslint no error; `fail 0`; registry current.

- [ ] **Step 5: Report**

The playbook §6 report, including: the asset size before/after and the files left out; the differences from the live reference; the mock-up-gate elements (the hero/footer portrait, the stay and dress photos) with screenshots at 390 and 1440; the coverage gap (menu, FAQ, gift, gallery, intro video are not drawn); anything not verified. Do not commit.
