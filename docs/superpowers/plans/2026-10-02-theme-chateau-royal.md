# Château Royal Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Read `2026-10-02-theme-port-playbook.md` first** — it holds the conventions, code skeletons and verification protocol every step below relies on.

**Goal:** Port the designer's château invitation — espresso, ivory and discreet gold, a hero that alternates day and night, a programme timeline that advances as you scroll, a royal menu card with a wedding cake that is nibbled in three states — into the app as the `chateau-royal` theme: fully variable, translated in nine languages, wired to guest submissions and to the editor.

**Architecture:** One theme folder, full-bleed (no centred column). The designer's minified, three-layer stylesheet is scoped as it is by the CSS pipeline. The source's single-purpose script becomes three small client components (timeline, cake scene) plus the shared `Reveal`. The place-reveal film, which is an illustration made for one château, is replaced by the couple's venue photo with a slow zoom. Dress code, travel directions and the FAQ share the designer's "small details" grid.

**Tech Stack:** Next.js 16, React 19, TypeScript, next-intl 4, `next/font` (Bodoni Moda, Pinyon Script, Jost), the shared groundwork.

**Spec:** `docs/superpowers/specs/2026-10-02-three-themes-design.md` (D1–D3, D7–D9, *Theme B*).
**Playbook:** `docs/superpowers/plans/2026-10-02-theme-port-playbook.md`.
**Source (read-only):** `/Users/tarik.klezo/Downloads/chateau/dist` — `index.html` (17 lines, 9 KB), `style.css` (34 KB minified, three `:root` palette layers; the last one — espresso, `--paper #f8f3e9`, `--gold #b89768` — is the look), `script.js`, `assets/`.
**Reference:** the designer's live site is behind a ChatGPT sign-in and cannot be captured. Use the local source instead: `npm run --silent themes:shoot-url -w landing -- file:///Users/tarik.klezo/Downloads/chateau/dist/index.html 1440 $OUT/ref ref` (and 390).

## Global Constraints

- Folder `landing/src/components/invitation/themes/chateau-royal/`; id `chateau-royal`; camelCase `chateauRoyal`; PascalCase `ChateauRoyal`; prefix `cr`; scope class `theme-chateau-royal`; catalogue namespace `Invitation.chateauRoyal`; font variables `--font-cr-display` (Bodoni Moda), `--font-cr-script` (Pinyon Script), `--font-cr-sans` (Jost); the root element carries `data-theme-root=""`; no column class.
- Manifest: name `Château Royal`; description `Un château de conte au fil d'un jour et d'une nuit : espresso, ivoire et or discret.`; `accentColor` `#583b32`; `cover` `/themes/chateau-royal/cover.webp`.
- `supports` (literal strings, in this order): `"timeline"`, `"menu"`, `"map"`, `"dress-code"`, `"faq"`, `"transport"`, `"rsvp"`.
- Section order, as designed: hero → letter → venue (map) → programme (timeline) → menu → brunch (day two, part of `timeline`) → practical grid (dress-code, transport, faq) → rsvp → footer.
- **Designer's constraints to keep** (their handoff note): "Deux jours pour se souvenir" as the showcase's title (via `texts`, see below); the place is revealed only in the third section; the ornaments stay light; the hero alternates day and night and the windows light up at night; the programme advances with the scroll and lights ceremony, cocktail, dinner, dance, ball in turn; the menu card shows the wedding cake nibbled in three transparent states; the brunch card carries the banquet; the conclusion carries the monogram and the names. Espresso/ivory/gold, never champagne pink, no blue ground.
- Dropped, and not to be drawn: the venue film (`chateau-lieu-aerien.mp4`, `chateau-lieu-anime.mp4`, `france-hexagone.webp`, `tools/`), the RSVP's separate Saturday/Sunday questions and "Nombre de personnes" (replaced by the product's presence + companions), the demo-only success text ("Cette invitation est une démonstration"). **Not drawn because the design has no section for them:** `countdown`, `accommodation`, `playlist`, `gift-list`, `gallery`, `intro-video`.
- Nothing of the demo wedding (Éléonore, Raphaël, Vaux-le-Vicomte, Maincy, Meaux, the dishes…) outside `demo-data.ts`; `theme-checks.test.mjs` enforces it for `chateau-royal`.
- Playbook §1 applies in full: never commit, own only `THEME`, `landing/public/themes/chateau-royal/` and `Invitation.chateauRoyal`.

## Review Focus

- **Timeline parity** — the designer's CSS alternates the cards left and right with `:nth-child`, counted among *all* siblings; the three elements before the first moment (`.track`, `.progress`, `.runner`) must stay in place and in that order. With the `heavy` set (eight moments) and the `minimal` set (none: the timeline renders nothing) (Task 4).
- **A long monogram** — "MC · JB" in the 94px menu crest and the 72px footer seal must not overflow; the circles are `white-space: nowrap` (Tasks 5, 7).
- **No film** — the designer hides the venue photo (`display: none`) and shows only the film; with no film the photo must be visible, with and without a `venue.image` (Task 3).
- **Nineteen cards** — the "small details" grid with a dress code, six travel modes and twelve FAQ entries must stay readable in three columns and in one (Task 6).
- **Scroll listeners** — the timeline listens to `scroll` and `resize`; it must remove both on unmount and work inside the editor's iframe, where `window` is the iframe's (Task 4).
- **Reduced motion and no JavaScript** — the timeline fully lit, the cake in its whole state, the hero on its day scene, every `.reveal` visible (Task 9).

---

## Appendix A — French catalogue source (namespace `Invitation.chateauRoyal`)

`[slot …]` marks a message offered for rewriting. All defaults are neutral. "(ciao)" = start from the same key family in `Invitation.ciaoAmore` (already translated in the nine catalogues) and adapt only what is in ciao-amore's voice.

| Key | French |
|---|---|
| `hero.label` | `Invitation au mariage de {partner1} et {partner2}` |
| `letter.intro` | Ont la joie de vous convier à leur mariage **[slot hero.letterIntro]** |
| `letter.titleLine1` / `titleLine2` | Un mariage / pour se souvenir **[slot hero.letterTitle, multiline]** |
| `venue.eyebrow` | Le lieu **[slot map.eyebrow]** |
| `venue.titleLine1` / `titleLine2` | Un lieu, / notre histoire **[slot map.title, multiline]** |
| `venue.route` | Ouvrir l'itinéraire |
| `venue.archLabel` | Le lieu de la réception |
| `programme.title` | Le grand jour **[slot timeline.title]** |
| `programme.intro` | Une journée, mille instants. **[slot timeline.intro]** |
| `programme.dayOne` | Jour I **[slot timeline.dayOne]** |
| `programme.dayTwo` | Jour II **[slot timeline.dayTwo]** |
| `programme.alsoTitle` | Et aussi *(heading of the extra events, Task 4)* |
| `menu.eyebrow` | Le dîner **[slot menu.eyebrow]** |
| `menu.titleLine1` / `titleLine2` | Le menu / du dîner **[slot menu.title, multiline]** |
| `menu.cakeLabel` | Pièce montée traditionnelle grignotée peu à peu sur ses trois étages |
| `brunch.imageLabel` | Une table de banquet dressée au jardin |
| `practical.eyebrow` | À savoir **[slot faq.eyebrow]** |
| `practical.title` | Les petits détails **[slot faq.title]** |
| `practical.open` | Ouvrir |
| `rsvp.eyebrow` | Votre réponse **[slot rsvp.eyebrow]** |
| `rsvp.titleLine1` / `titleLine2` | Vous serez / des nôtres ? **[slot rsvp.title, multiline]** |
| `rsvp.deadline` | `Merci de répondre avant le {date}.` |
| `rsvp.nameLabel` / `attendanceLabel` / `attendanceChoose` / `attendanceYes` / `attendanceNo` | Prénom et nom / Votre réponse / Choisissez / Je serai là / Je ne pourrai pas venir |
| `rsvp.messageLabel` / `messagePlaceholder` | Allergies, précisions ou petit mot / Facultatif |
| `rsvp.submit` / `rsvp.pending` | Confirmer ma réponse / Envoi… |
| `rsvp.thanks` | Merci ! Votre réponse a bien été prise en compte. |
| `rsvp.*` (party select, partner name, children count, child field, dietary, error) | (ciao) `Invitation.ciaoAmore.rsvp` |
| `faq.childrenQuestion` / `childrenAdultsOnly` / `childrenWelcome` | (ciao) `Invitation.ciaoAmore.faq` |

The slot `faq.*` names the practical grid's eyebrow and title because the grid has no tab of its own and the FAQ is the tab whose words it most resembles.

---

### Task 1: Assets, fonts and the generated stylesheet

**Files:**
- Create: `landing/public/themes/chateau-royal/*.webp` (8 files)
- Create: `…/chateau-royal/fonts.ts`
- Create (generated): `…/chateau-royal/chateau-royal.css`
- Scratch: `$SCRATCH/chateau-css.json`

**Interfaces:**
- Produces: `chateauRoyalFontVars: string`; the generated `.theme-chateau-royal …` stylesheet; assets at `/themes/chateau-royal/<name>.webp`.

- [ ] **Step 1: Copy the assets**

`SRC=/Users/tarik.klezo/Downloads/chateau/dist/assets`, `DEST=landing/public/themes/chateau-royal`. All are already WebP: copy, do not re-encode. Exactly these eight: `chateau-day.webp`, `chateau.webp` (the night scene), `banquet.webp`, `alliances-voile.webp`, `piece-montee.webp`, `piece-montee-premiere-bouchee.webp`, `piece-montee-trois-bouchees.webp`, `chateau-aerien.webp` (the demo's venue photo — an illustration, kept as the showcase's `venue.image`). **Not copied:** the two MP4, `france-hexagone.webp` (the film's poster), `tools/`. Report `du -sh` (about 2.3 MB).

- [ ] **Step 2: Fonts**

Create `fonts.ts`:

```ts
import { Bodoni_Moda, Jost, Pinyon_Script } from "next/font/google";

/**
 * Fonts for the "Château Royal" theme.
 *
 * The designer loaded these three from a Google Fonts `<link>`; `next/font`
 * serves them under a hashed family name that only the CSS variable reaches,
 * which is why the pipeline puts the variable *first* in every `font` that
 * names one of them. (The handoff note lists Italiana too; the stylesheet never
 * uses it, so it is not loaded.)
 *
 * Apply `chateauRoyalFontVars` on the theme root.
 */

/** Titles, names, times, the dishes: the designer's Bodoni Moda, roman and italic. */
const display = Bodoni_Moda({
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-cr-display",
});

/** The ampersand and the italic flourishes. */
const script = Pinyon_Script({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-cr-script",
});

/** Eyebrows, times, labels and form controls. */
const sans = Jost({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-cr-sans",
});

export const chateauRoyalFontVars = [display.variable, script.variable, sans.variable].join(" ");
```

- [ ] **Step 3: Pipeline config and run**

`$SCRATCH/chateau-css.json`:

```json
{
  "source": "/Users/tarik.klezo/Downloads/chateau/dist/style.css",
  "out": "/Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie/landing/src/components/invitation/themes/chateau-royal/chateau-royal.css",
  "scope": "theme-chateau-royal",
  "assets": ["assets/=/themes/chateau-royal/"],
  "fonts": [
    { "family": "Jost", "variable": "--font-cr-sans", "position": "before" },
    { "family": "Bodoni Moda", "variable": "--font-cr-display", "position": "before" },
    { "family": "Pinyon Script", "variable": "--font-cr-script", "position": "before" }
  ],
  "publicDir": "/Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie/landing/public",
  "markup": ["/Users/tarik.klezo/Downloads/chateau/dist/index.html"]
}
```

Run `mkdir -p landing/src/components/invitation/themes/chateau-royal && npm run themes:port-css -w landing -- $SCRATCH/chateau-css.json`.

Expected: `wrote …/chateau-royal.css`. The sheet is minified on a few lines, so the pipeline's PostCSS re-serialisation (one rule per line) is what makes it readable; keep that. If the run reports a missing asset, you copied the wrong files.

- [ ] **Step 4: Check the output**

```bash
CSS=landing/src/components/invitation/themes/chateau-royal/chateau-royal.css
grep -c "" $CSS
grep -nE "^(body|html|main)\b" $CSS          # nothing
grep -n "^\.theme-chateau-royal *{" $CSS | head   # :root and body folded onto the root — three palette layers, in order
grep -n "var(--font-cr-" $CSS | head -6
grep -c "keyframes" $CSS ; grep -n "@keyframes" $CSS | head -4   # every name starts with "chateau-royal-"
grep -c "venue-film" $CSS
```

Expected: the root receives all three `:root` layers in order (the espresso one last, so it wins); `@keyframes chateau-royal-nightfall` and the like; `var(--font-cr-…)` placed before `Jost` / `'Bodoni Moda'` / `'Pinyon Script'`.

- [ ] **Step 5: Checkpoint**

`tsc` filtered (empty) and the leak test for `chateau-royal` (PASS). Do not commit.

---

### Task 2: Demo data, dates, manifest and root skeleton

**Files:**
- Create: `…/chateau-royal/demo-data.ts`, `theme.config.ts`, `ChateauRoyalRoot.tsx`, `editor.ts` (empty list, filled section by section), `responsive.css`, `dates.ts`, `monogram-parts.ts`
- Create: `…/chateau-royal/sections/Reveal.tsx` (a one-line re-export is not needed — import `Reveal` from `../../reveal`)
- Test: `landing/src/lib/chateau-royal-dates.test.mjs`

**Interfaces:**
- Produces:
  - `dayHeading(iso: string | null | undefined, locale: string): string | null` — "samedi 19 juin" (weekday, day, month; no year; French "1er").
  - `weekdayRange(start: string | null | undefined, end: string | null | undefined, locale: string): string | null` — "samedi 19 – dimanche 20 juin 2027"; one day → "samedi 19 juin 2027".
  - `splitMonogram(text: string): { left: string; separator: string; right: string } | null` — "E & R" → `{ left: "E", separator: "&", right: "R" }`; free text without a separator → `null`.
  - `CHATEAU_ROYAL_DEMO`, `chateauRoyalTheme`, `ChateauRoyalRoot`.

- [ ] **Step 1: Write the failing tests**

Create `landing/src/lib/chateau-royal-dates.test.mjs`:

```js
/**
 *   node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs \
 *     --test landing/src/lib/chateau-royal-dates.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";

import { dayHeading, weekdayRange } from "../components/invitation/themes/chateau-royal/dates.ts";
import { splitMonogram } from "../components/invitation/themes/chateau-royal/monogram-parts.ts";

const plain = (text) => text?.replace(/\s/g, " ");

test("a day heading is the weekday, day and month — no year", () => {
  assert.equal(dayHeading("2027-06-19", "fr-FR"), "samedi 19 juin");
  assert.equal(dayHeading("2027-06-01", "fr-FR"), "mardi 1er juin");
  assert.equal(dayHeading("2027-06-19", "en-US"), "Saturday, June 19");
  assert.equal(dayHeading(undefined, "fr-FR"), null);
  assert.equal(dayHeading("later", "fr-FR"), null);
});

test("a weekday range names both days once", () => {
  assert.equal(plain(weekdayRange("2027-06-19", "2027-06-20", "fr-FR")), "samedi 19 – dimanche 20 juin 2027");
  assert.equal(weekdayRange("2027-06-19", "2027-06-19", "fr-FR"), "samedi 19 juin 2027");
  assert.equal(weekdayRange("2027-06-19", undefined, "fr-FR"), "samedi 19 juin 2027");
  assert.equal(weekdayRange("nope", "2027-06-20", "fr-FR"), null);
});

test("a monogram with a separator is split so the separator can be set apart", () => {
  assert.deepEqual(splitMonogram("E & R"), { left: "E", separator: "&", right: "R" });
  assert.deepEqual(splitMonogram("MC · JB"), { left: "MC", separator: "·", right: "JB" });
  assert.deepEqual(splitMonogram("S+M"), { left: "S", separator: "+", right: "M" });
});

test("free text with no separator stays whole", () => {
  assert.equal(splitMonogram("Maré"), null);
  assert.equal(splitMonogram(""), null);
  assert.equal(splitMonogram("   "), null);
});
```

Run it — Expected: FAIL, modules missing.

- [ ] **Step 2: Implement the helpers**

`dates.ts`:

```ts
/**
 * The two date shapes this theme prints that `date-range.ts` does not have: a
 * day heading without a year ("samedi 19 juin") and a range with weekdays
 * ("samedi 19 – dimanche 20 juin 2027"). Both read the calendar day as written
 * (pinned to UTC), so a server and a browser in different timezones agree.
 */

function utcDay(value: string | null | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}/.test(value)) return null;
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

const isFrench = (locale: string) => locale.toLowerCase().startsWith("fr");

export function dayHeading(iso: string | null | undefined, locale: string): string | null {
  const date = utcDay(iso);
  if (!date) return null;
  const text = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(date);
  return isFrench(locale) ? text.replace(/ 1 /, " 1er ") : text;
}

export function weekdayRange(
  start: string | null | undefined,
  end: string | null | undefined,
  locale: string,
): string | null {
  const from = utcDay(start);
  if (!from) return null;
  const to = utcDay(end);

  const formatter = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const text =
    !to || to.getTime() === from.getTime()
      ? formatter.format(from)
      : from <= to
        ? formatter.formatRange(from, to)
        : formatter.formatRange(to, from);

  return isFrench(locale) ? text.replace(/ 1 /g, " 1er ") : text;
}
```

`monogram-parts.ts`:

```ts
/**
 * Splits "E & R" into its two halves and the separator between them, so the
 * crest can set the separator in the script face as the designer's did.
 * A monogram without a recognisable separator is returned as null and printed whole.
 */
export function splitMonogram(
  text: string,
): { left: string; separator: string; right: string } | null {
  const match = text.trim().match(/^(.+?)\s*([&·+])\s*(.+)$/);
  if (!match) return null;
  return { left: match[1]!.trim(), separator: match[2]!, right: match[3]!.trim() };
}
```

Run the test — Expected: PASS, 4 tests. (If Intl writes the weekday range with a different dash, fix the **assertion's** normalisation, not the helper: the requirement is two weekdays, one month, one year.)

- [ ] **Step 3: Demo data**

`demo-data.ts` — the designer's wedding, with every field the theme draws:

```ts
import { demoDate, demoDayAfter, demoStartsAt } from "../demo-date";
import type { InvitationData } from "../types";

/**
 * The showcase wedding of "Château Royal": the designer's own, kept whole. The
 * only file of the theme that may name the demo couple, the demo venue and the
 * dishes.
 */

const STARTS_AT = demoStartsAt(5, "15:30", "+02:00");
const WEDDING_DAY = demoDate(5);
const DAY_AFTER = demoDayAfter(5);

export const CHATEAU_ROYAL_DEMO: InvitationData = {
  couple: { partner1: "Éléonore", partner2: "Raphaël", monogram: "E & R" },
  event: { startsAt: STARTS_AT, rsvpDeadline: demoDate(3), timezone: "Europe/Paris" },
  venue: {
    name: "Château de Vaux-le-Vicomte",
    city: "Maincy",
    country: "France",
    address: "77950 Maincy",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Ch%C3%A2teau+de+Vaux-le-Vicomte",
    image: "/themes/chateau-royal/chateau-aerien.webp",
    access: [
      {
        mode: "Covoiturage",
        details: ["Une place libre ou un trajet à partager ? Indiquez-le dans les précisions de votre réponse."],
      },
    ],
  },
  copy: { closing: "Merci d'être là, vraiment.", footerNote: "Avec toute notre affection" },
  schedule: [
    { day: 1, time: "15 h 30", title: "La cérémonie", description: "Dans les jardins", icon: "ceremony", event: "wedding-day" },
    { day: 1, time: "17 h 00", title: "Le cocktail", description: "Sur la terrasse", icon: "cocktail", event: "wedding-day" },
    { day: 1, time: "19 h 30", title: "Le dîner", description: "Dans la grande galerie", icon: "dinner", event: "wedding-day" },
    { day: 1, time: "22 h 30", title: "La première danse", description: "Sous les lustres", icon: "party", event: "wedding-day" },
    { day: 1, time: "Jusqu'à l'aube", title: "Le bal", description: "La nuit est à nous", event: "wedding-day" },
  ],
  events: [
    { kind: "wedding-day", name: "Le grand jour", date: WEDDING_DAY, time: "15 h 30", day: 1 },
    { kind: "brunch", name: "Le banquet du lendemain", date: DAY_AFTER, time: "11 h 30", day: 2 },
  ],
  dayTwo: {
    title: "Le banquet\ndu lendemain",
    timeLabel: "À partir de 11 h 30",
    body: "Un dernier moment ensemble, au jardin.",
  },
  dressCode: { title: "Tenue", body: "Tenue de soirée, couleur bienvenue." },
  menu: {
    sections: [
      { title: "Pour commencer", items: [{ title: "Raviole de langoustine", description: "Bisque légère" }] },
      { title: "À suivre", items: [{ title: "Volaille de Bresse", description: "Jus aux morilles, légumes de saison" }] },
      { title: "Pour finir", items: [{ title: "La pièce montée" }] },
    ],
  },
  faq: [{ question: "Pour la soirée", answer: "Prévoyez une petite laine pour les jardins." }],
  rsvp: { allowPartner: true, allowChildren: true, collectMessage: true },
  // The designer's own wording, kept for the showcase. A real wedding gets the
  // neutral catalogue default until the couple rewrites it.
  texts: {
    "hero.letterTitle": "Deux jours\npour se souvenir",
    "map.title": "Un château,\nnotre histoire",
    "menu.title": "Le menu\nroyal",
  },
};
```

- [ ] **Step 4: Manifest, root, editor, responsive base**

`theme.config.ts` — the playbook §2.1 skeleton with: `id: "chateau-royal"`, `name: "Château Royal"`, the description and `accentColor: "#583b32"` from *Global Constraints*, `supports: ["timeline", "menu", "map", "dress-code", "faq", "transport", "rsvp"]`, `scopeClass: "theme-chateau-royal"`, `fontVars: chateauRoyalFontVars`, `demoData: CHATEAU_ROYAL_DEMO`, `Root: ChateauRoyalRoot`, `editorSlots: chateauRoyalEditorSlots`.

`editor.ts`: the playbook §2.4 skeleton with `NS = "Invitation.chateauRoyal"` and an empty list (each section task appends its slots).

`ChateauRoyalRoot.tsx` — the playbook §2.2 skeleton; **no column**:

```tsx
import { useTranslations } from "next-intl";

import { JsFlag } from "../reveal";
import type { InvitationData, ModuleId } from "../types";

import "./chateau-royal.css";
import "./responsive.css";

import { chateauRoyalFontVars } from "./fonts";

/**
 * "Château Royal" — a château at the turn of day and night.
 *
 * The hero, the letter and the footer always render: they carry the couple's
 * names. The sections between them are gated on `data.modules`. The programme
 * and the brunch both belong to the `timeline` module (the brunch is its second
 * day); the "small details" grid gathers three modules and gates each group.
 *
 * Full-bleed: the stylesheet's `html`, `body` and `main` rules all landed on
 * this element.
 */
export function ChateauRoyalRoot({ data }: { data: InvitationData }) {
  const enabled = data.modules;
  const has = (id: ModuleId) => !enabled || enabled.includes(id);
  void data; void has; // used by the sections added in the next tasks

  return (
    <main className={`theme-chateau-royal ${chateauRoyalFontVars}`} data-theme-root="">
      <JsFlag />
      {/* sections: Tasks 3–7 */}
    </main>
  );
}
```

(Remove the placeholder `void` line as sections arrive.)

`responsive.css` starts with the comment header of the Maré Alta plan, adapted to `.theme-chateau-royal`, and no rules.

- [ ] **Step 5: Register and look**

`npm run themes:sync -w landing`, then `curl … /fr/invitation/demo/chateau-royal` → 200 and an empty espresso/ivory page.

- [ ] **Step 6: Checkpoint**

`npm run themes:check -w landing`, `tsc` filtered (empty), the new date test PASS, `theme-supports.test.mjs` PASS. Do not commit.

---

### Task 3: Hero, letter and venue

**Files:**
- Create: `…/chateau-royal/sections/HeroSection.tsx`, `LetterSection.tsx`, `VenueSection.tsx`
- Modify: `ChateauRoyalRoot.tsx`, `editor.ts`, `responsive.css`
- Scratch: `$SCRATCH/messages/chateau-royal/{fr,…,ja}.json`

**Interfaces:**
- Produces: `HeroSection`, `LetterSection`, `VenueSection`.
- Consumes: `Reveal`, `weddingSpan`, `formatDateRange`, `weekdayRange`, `monogramOf`, `slot`, `Lines`.

**Source:** `index.html` lines 2–5 (hero, letter, transition, venue).

- [ ] **Step 1: Hero**

`HeroSection` renders `<section className="hero" aria-label={t("label", { partner1, partner2 })} data-editor-section="hero">` with the designer's children in order: `<div className="scene day" />`, `<div className="scene night" />`, `<div className="hero-shade" />`, then `.hero-copy` > `.hero-prelude` / `.hero-rule` (`<i/>`, the rings `<svg className="hero-rings" viewBox="0 0 64 64" aria-hidden="true"><circle cx="24" cy="36" r="12"/><circle cx="40" cy="36" r="12"/><path d="m24 18 4-6 4 6-4 3z"/></svg>`, `<i/>`) / `.hero-title` (`<span>{partner1}</span><em>&</em><span>{partner2}</span>`).

`.hero-prelude` shows the wedding span: `const span = weddingSpan(data)` → `formatDateRange(span.start, span.end, { locale })`; omit the span when `span` is null.

- [ ] **Step 2: Letter**

`LetterSection` — `<section className="letter" id="cr-invitation" data-editor-section="hero">`: a `Reveal` (`as="div"`, `className="letter-inner reveal"`, `revealedClass="visible"`, `threshold={0.12}`) holding `.letter-top` (`✦ &nbsp; {monogramOf(data.couple, " · ")} &nbsp; ✦`), `.letter-small` (`slot("hero.letterIntro") ?? t("intro")`), the `<h1>` (`<Lines>` of `slot("hero.letterTitle") ?? line1\nline2`, with the **second line in `<em>`**: split on the first line break, render `first<br/><em>rest</em>`), `.letter-divider` (`<span>✣</span>`), `.letter-date` (`weekdayRange(span.start, span.end, locale)`, omitted when null). Then `<img className="marriage-still" src="/themes/chateau-royal/alliances-voile.webp" alt="" loading="lazy" />` and `.letter-corners` with four `<span>✧</span>` (`aria-hidden`). Followed by the transition ornament `<div className="transition transition-one" aria-hidden="true"><span className="transition-rule" /><span className="transition-center">✣</span><span className="transition-rule" /></div>` — emit it from the Root between the letter and the venue.

If `data.copy?.announcement` exists, print it as a `.letter-small`-styled paragraph under the date (the hero tab's field; the demo has none, the `heavy` fixture does).

- [ ] **Step 3: Venue**

`VenueSection`: `<section className="venue" id="cr-lieu" data-editor-section="map">`. Always renders (the venue always has a name).

- `Reveal` `.venue-head.reveal`: `.section-eyebrow` = `slot("map.eyebrow") ?? t("eyebrow")`; `<h2>` = first line, then `<em>` second line from `slot("map.title") ?? line1\nline2` (same split as the letter's); `<p>` = `[venue.name, venue.address].filter(Boolean).join(" · ")`; `<a href={mapsUrl} target="_blank" rel="noopener">{t("route")} <span aria-hidden="true">↗</span></a>` where `mapsUrl = venue.mapsUrl ?? "https://www.google.com/maps/search/?" + new URLSearchParams({ api: "1", query: [venue.name, venue.address ?? venue.city].filter(Boolean).join(", ") })`.
- `.venue-arch`: `venue.image ? <img className="venue-still" src={venue.image} alt={venue.name} loading="lazy" />` : nothing (the arch's border and shadow remain, over the ivory ground).

**The designer hides the photo.** The sheet has `.venue-arch .venue-still { display: none }` and shows the photo only under `prefers-reduced-motion`, because it was the film's fallback. Add to `responsive.css`:

```css
/* The designer's venue film is not ported (it was an illustration made for one château);
   the couple's photo is the whole content of the arch, so it must always show. */
.theme-chateau-royal .venue-arch .venue-still { display: block; }

/* In place of the film's motion: a slow zoom, off for readers who asked for none. */
@keyframes chateau-royal-venue-zoom { from { transform: scale(1); } to { transform: scale(1.06); } }
.theme-chateau-royal .venue-arch .venue-still { animation: chateau-royal-venue-zoom 18s ease-in-out infinite alternate; }
```

(the reduced-motion safety net of Task 9 cancels the animation).

- [ ] **Step 4: Slots, strings, render**

Slots: `hero.letterIntro`; `hero.letterTitle` (multiline); `map.eyebrow`; `map.title` (multiline). Add the `hero`, `letter`, `venue` keys of Appendix A in nine languages and merge. Root: `<HeroSection/>`, `<LetterSection/>`, the transition div, then `has("map") ? <VenueSection/> : null` (the venue section also stands for the place when only `transport` is owned? No — gate on `has("map")` alone; travel directions are drawn in Task 6).

- [ ] **Step 5: Verify**

Playbook §4: all three datasets at 390 and 1440. Look for: the hero copy readable on the day scene (left 6 %, 43 % wide on desktop), the night scene cross-fading (take two shots a few seconds apart; the cycle is 24 s), the long names "Marie-Charlotte / Jean-Baptiste" inside the hero copy at 390; the letter's `<h1>` second line in script; the venue arch with the photo (demo, heavy) and without (minimal) — empty arch looks intentional, not broken. Compare with the reference at 1440. Do not commit.

---

### Task 4: Programme and brunch

**Files:**
- Create: `…/chateau-royal/sections/ProgrammeSection.tsx`, `ProgrammeTimeline.tsx`, `EventIcon.tsx`, `BrunchSection.tsx`
- Modify: `ChateauRoyalRoot.tsx`, `editor.ts`, `responsive.css`

**Interfaces:**
- Produces: `ProgrammeSection`, `BrunchSection`, `EventIcon({ icon })`, `ProgrammeTimeline({ children })` (client).
- Consumes: `dayHeading`, `Reveal`, `ScheduleIcon`.

**Source:** programme `index.html:6–11` and `script.js` (the `update()` function and its listeners); brunch `14`.

- [ ] **Step 1: The icons**

`EventIcon.tsx` — the five line drawings, keyed by the moment they depict. The class on the wrapper (`rings`, `glasses`, `dinner`, `music`, `star`) is what the designer's CSS addresses (the music icon sways when active):

```tsx
import type { ReactNode } from "react";

import type { ScheduleIcon } from "../../types";

const DRAWINGS: Record<string, ReactNode> = {
  rings: (
    <>
      <circle cx="24" cy="35" r="13" />
      <circle cx="40" cy="35" r="13" />
      <path d="m24 17 4-6 4 6-4 3z" />
    </>
  ),
  glasses: <path d="M10 11h18l-2 17c-.6 5-3 7-7 7s-6.4-2-7-7zM19 35v16m-9 2h18M36 11h18l-2 17c-.6 5-3 7-7 7s-6.4-2-7-7zM45 35v16m-9 2h18" />,
  dinner: <path d="M11 40c1-12 10-21 21-21s20 9 21 21zM8 43h48M32 19v-6m-3-2h6M15 50h34" />,
  music: <path d="M27 44V16l24-5v28M27 22l24-5M27 44c0 7-16 9-16 2s16-9 16-2zm24-5c0 7-16 9-16 2s16-9 16-2z" />,
  star: <path d="m32 6 5 19 19 7-19 7-5 19-5-19-19-7 19-7zM11 11l4 4m34 34 4 4" />,
};

/**
 * What a moment is, drawn the designer's way. The contract names the moment —
 * never the drawing: ceremony → rings, cocktail → glasses, dinner and brunch →
 * a laid table, party → music; a moment that names none gets the star the
 * designer put on the ball.
 */
const FOR_MOMENT: Record<ScheduleIcon, string> = {
  ceremony: "rings",
  cocktail: "glasses",
  dinner: "dinner",
  brunch: "dinner",
  party: "music",
};

export function EventIcon({ icon }: { icon?: ScheduleIcon }) {
  const name = icon ? FOR_MOMENT[icon] : "star";
  return (
    <div className={`event-icon ${name}`} aria-hidden="true">
      <svg viewBox="0 0 64 64">{DRAWINGS[name]}</svg>
    </div>
  );
}
```

- [ ] **Step 2: The timeline (client)**

`ProgrammeTimeline.tsx` — the designer's `script.js` for the programme, scoped to its own element and cleaned up:

```tsx
"use client";

import { type ReactNode, useEffect, useRef } from "react";

/**
 * The programme's timeline: a progress line and a runner that follow the scroll,
 * and the moments that light up as the line passes them.
 *
 * The designer's script did this against the document, once, at load. This does
 * it for its own element, removes its listeners, and — for a reader who asked
 * for no motion — simply lights everything.
 *
 * The CSS alternates the moments left and right with `:nth-child`, counted
 * among every sibling: the three elements before the moments (track, progress,
 * runner) are part of the layout and must stay first and in this order.
 */
export function ProgrammeTimeline({ children }: { children: ReactNode }) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const runnerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeline = timelineRef.current;
    const progress = progressRef.current;
    const runner = runnerRef.current;
    if (!timeline || !progress || !runner) return;

    const moments = [...timeline.querySelectorAll<HTMLElement>(".event")];

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      progress.style.height = `${timeline.offsetHeight}px`;
      runner.style.top = `${timeline.offsetHeight}px`;
      moments.forEach((moment) => moment.classList.add("active"));
      return;
    }

    let ticking = false;
    const update = () => {
      const rect = timeline.getBoundingClientRect();
      const marker = Math.max(0, Math.min(timeline.offsetHeight, window.innerHeight * 0.55 - rect.top));
      progress.style.height = `${marker}px`;
      runner.style.top = `${marker}px`;
      moments.forEach((moment) =>
        moment.classList.toggle("active", moment.offsetTop + moment.offsetHeight / 2 < marker + 105),
      );
      ticking = false;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
    };
  }, [children]);

  return (
    <div className="timeline" id="cr-timeline" ref={timelineRef}>
      <div className="track" />
      <div className="progress" ref={progressRef} />
      <div className="runner" ref={runnerRef} aria-hidden="true">✧</div>
      {children}
    </div>
  );
}
```


- [ ] **Step 3: The programme section**

`ProgrammeSection`: return `null` when there are no wedding-day moments *and* no extra events. Otherwise `<section className="programme" id="cr-programme" data-editor-section="timeline">`:

- `Reveal` `.section-heading.reveal`: `.section-eyebrow` = `[dayHeading(weddingDay, locale), slot("timeline.dayOne") ?? t("dayOne")].filter(Boolean).join(" · ")` where `weddingDay` is the `wedding-day` event's `date` (else the day written in `startsAt`); `<h2>` = `slot("timeline.title") ?? t("title")`; `<p>` = `data.copy?.scheduleIntro ?? slot("timeline.intro") ?? t("intro")`.
- `<ProgrammeTimeline>` holding one `<article className="event">` per wedding-day moment — those with `(entry.event ?? (entry.day === 2 ? "brunch" : "wedding-day")) === "wedding-day"` — each `<div className="event-card"><span className="event-time">{time}</span><h3>{title}</h3>{description ? <p>{description}</p> : null}</div><EventIcon icon={entry.icon} />`. When there are no such moments, render no timeline at all.
- **Extra events (mock-up gate).** For each `events[]` entry that is neither `wedding-day` nor `brunch` (a welcome dinner, a party) and any `brunch` event when there is **no** `dayTwo`, render after the timeline a plain card reusing `.practical-item`'s look is wrong (different section); instead add them to the timeline as further `<article className="event">` after the wedding-day moments, with `event-time` = the weekday heading + time, `h3` = the event's name, `p` = its description or address, and its own `schedule` entries listed under it as small lines. The welcome dinner thus comes after the ball in the timeline: if the designer's intent (chronology) matters more, sort the extra events *before* the wedding-day moments when their date is earlier — do that. Flag it in the report with screenshots.

- [ ] **Step 4: The brunch (day two)**

`BrunchSection`: from `dayTwo` when present, else from the `brunch` event, else `null`; gated by `has("timeline")` in the Root. `<section className="brunch" id="cr-brunch" data-editor-section="timeline">`:

- `.brunch-image` (`role="img"`, `aria-label={t("imageLabel")}`); when `dayTwo.image` exists add `style={{ backgroundImage: `url("${dayTwo.image}")` }}`.
- `Reveal` `.brunch-card.reveal`: `.section-eyebrow` = `[dayTwo.dateLabel ?? dayHeading(brunchDate, locale), slot("timeline.dayTwo") ?? t("dayTwo")].filter(Boolean).join(" · ")`; `.brunch-flourish` `❦`; `<h2>` = `dayTwo.title` (else the event's name) split on the first line break into `first<br/><em>rest</em>` (one line → plain); `.brunch-line`; `.brunch-time` = `dayTwo.timeLabel` (else the event's `time`); `<p>` = `dayTwo.body` (else the event's description); `dayTwo.note` as a final small `<p>`. Omit each empty element.
- Between the menu and the brunch the designer has `<div className="nightfold" aria-hidden="true" />`; emit it from the Root.

- [ ] **Step 5: Slots, strings, render, verify**

Slots: `timeline.title`; `timeline.intro`; `timeline.dayOne`; `timeline.dayTwo`. Strings: Appendix A `programme`, `brunch`. Root: `has("timeline") ? <ProgrammeSection/> : null` after the venue; the brunch after the menu (Task 5).

Verify (playbook §4): at 1440 the moments alternate left and right and the line grows while scrolling (take shots at several scroll positions, or drive it with Playwright `page.mouse.wheel`); at 390 the line is at the left (`left: 42px`); `heavy` has eight moments and three events; `minimal` renders nothing (no empty "Le grand jour" heading). Compare with the reference. Do not commit.

---

### Task 5: The royal menu

**Files:**
- Create: `…/chateau-royal/sections/MenuSection.tsx`, `CakeScene.tsx`, `Crest.tsx`
- Modify: `ChateauRoyalRoot.tsx`, `editor.ts`, `responsive.css`

**Interfaces:**
- Produces: `MenuSection`, `CakeScene` (client), `Crest({ text, className })`.
- Consumes: `splitMonogram`, `monogramOf`, `dayHeading`, `Reveal`.

**Source:** `index.html:12–13`, the cake observer in `script.js`.

- [ ] **Step 1: The crest (shared with the footer)**

`Crest.tsx`:

```tsx
import { splitMonogram } from "../monogram-parts";

/**
 * A monogram set the designer's way: the two halves in the display face and the
 * separator in the script face between them. A monogram with no separator is
 * printed whole. The seal and the crest are circles with `white-space: nowrap`,
 * so a long one ("MC · JB") is flagged and set smaller by the stylesheet.
 */
export function Crest({ text }: { text: string }) {
  const parts = splitMonogram(text);
  return (
    <strong data-long={text.length > 5 ? "" : undefined}>
      {parts ? (
        <>
          {parts.left} <i>{parts.separator}</i> {parts.right}
        </>
      ) : (
        text
      )}
    </strong>
  );
}
```

`responsive.css`:

```css
/* The crest and the seal are fixed circles with white-space: nowrap; a longer monogram is set smaller so it stays inside. */
.theme-chateau-royal .menu-crest strong[data-long] { font-size: 0.82rem; letter-spacing: 0.06em; }
.theme-chateau-royal .signoff-seal[data-long] { font-size: 0.8rem; letter-spacing: 0.05em; }
```

- [ ] **Step 2: The cake (client)**

`CakeScene.tsx` — the designer's observer, scoped:

```tsx
"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

/**
 * The wedding cake that is nibbled in three states, drawn as three stacked
 * images whose opacity the stylesheet steps through while `.playing`. It plays
 * only while it is on screen, and not at all for a reader who asked for no
 * motion (then it stays whole).
 */
export function CakeScene() {
  const t = useTranslations("Invitation.chateauRoyal.menu");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = ref.current;
    if (!scene) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => scene.classList.toggle("playing", entry.isIntersecting && !reduced));
      },
      { threshold: 0.35 },
    );
    observer.observe(scene);
    return () => observer.disconnect();
  }, []);

  /* eslint-disable @next/next/no-img-element -- decorative frames, positioned and faded by CSS. */
  return (
    <div className="cake-scene" role="img" aria-label={t("cakeLabel")} ref={ref}>
      <img className="cake-frame cake-whole" src="/themes/chateau-royal/piece-montee.webp" alt="" loading="lazy" />
      <img className="cake-frame cake-first" src="/themes/chateau-royal/piece-montee-premiere-bouchee.webp" alt="" loading="lazy" />
      <img className="cake-frame cake-last" src="/themes/chateau-royal/piece-montee-trois-bouchees.webp" alt="" loading="lazy" />
    </div>
  );
  /* eslint-enable @next/next/no-img-element */
}
```

The cake is decoration that belongs to the theme (it is the menu card's signature); it appears whatever the couple's menu says.

- [ ] **Step 3: The menu section**

Return `null` when `data.menu` has no section with an item. `<section className="royal-menu" id="cr-menu" data-editor-section="menu">` > `.menu-inner` > `Reveal` `.menu-card.reveal` > `.menu-card-inner`:

| Source | Becomes |
|---|---|
| `.menu-crest` (`<span>✦</span><strong>E <i>&</i> R</strong><span>✦</span>`, `aria-hidden`) | `<span>✦</span><Crest text={monogramOf(data.couple, " & ")} /><span>✦</span>` |
| `<span className="section-eyebrow">Le dîner · Samedi 19 juin</span>` | `[slot("menu.eyebrow") ?? t("eyebrow"), dayHeading(weddingDay, locale)].filter(Boolean).join(" · ")` (a couple who rewrites the slot loses the date; accepted) |
| `<h2>Le menu <em>royal</em></h2>` | first line, then `<em>` second line of `slot("menu.title") ?? line1\nline2` |
| `.menu-filigree` | as is |
| one `.menu-course` per course | `<div className="menu-course"><span>{section.title}</span>` then, for each item, `<p>{item.title}{item.description ? <><br/><small>{item.description}</small></> : null}</p></div>` |
| (new) | `menu.note` as `<p className="cr-menu-note">` after the courses, when present |
| `.cake-scene` | `<CakeScene />` |
| `.menu-card-tail` | as is (`❦`, `aria-hidden`) |

`responsive.css`: `.theme-chateau-royal .cr-menu-note` — italic, the course-label colour, centred, a hairline above (use the `.menu-course small` tokens).

- [ ] **Step 4: Slots, strings, render, verify**

Slots: `menu.eyebrow`; `menu.title` (multiline). Strings: Appendix A `menu`. Root: `has("menu") ? <MenuSection/> : null`, then `<div className="nightfold" aria-hidden="true" />`, then `has("timeline") ? <BrunchSection/> : null`.

Verify: the crest holds "E & R" and "MC · JB" (heavy) without overflow; the cake cycles whole → first bite → three bites while on screen (two shots 2–3 s apart); the card's dark espresso interior with cream text; `heavy` has four courses and a note; `minimal` has no menu (nothing). Compare with the reference. Do not commit.

---

### Task 6: The "small details" grid

**Files:**
- Create: `…/chateau-royal/sections/PracticalSection.tsx`
- Modify: `ChateauRoyalRoot.tsx`, `editor.ts`, `responsive.css`

**Interfaces:**
- Produces: `PracticalSection` (client for nothing — a server component).
- Consumes: `withChildrenPolicyFaq`, `Reveal`.

**Source:** `index.html:15`.

- [ ] **Step 1: Build the grid**

One section gathering three modules. `<section className="practical" id="cr-infos">` rendered only if at least one group has content. `Reveal` `.section-heading.reveal` with `.section-eyebrow` = `slot("faq.eyebrow") ?? t("eyebrow")` and `<h2>` = `slot("faq.title") ?? t("title")`. Then `<div className="practical-grid">` of `Reveal` items — `as="div"`, `className="practical-item reveal"`, `revealedClass="visible"`, each carrying **its own** `data-editor-section`:

| Group | Gate | Item |
|---|---|---|
| dress code | `has("dress-code") && data.dressCode` | `data-editor-section="dress-code"`; `h3` = `dressCode.title`; `p` = `dressCode.body` plus, when present, `dressCode.note` as a second paragraph; the colours as a row of small round swatches under the text when `colors` exist |
| travel directions | `has("transport") && venue.access?.length` (also drawn when only `map` is owned, since the access lines belong with the place) | one item per mode, `data-editor-section="transport"`; `h3` = `mode`; `p` = `details.join(" ")`; `link` → a final `<a href target="_blank" rel="noopener">{link.label ?? t("open")}</a>` |
| FAQ | `has("faq")`, entries from `withChildrenPolicyFaq(data, { question: t("childrenQuestion"), adultsOnlyAnswer: t("childrenAdultsOnly"), childrenWelcomeAnswer: t("childrenWelcome") })` | one item per entry, `data-editor-section="faq"`; `h3` = `question`; `p` = `answer` |

Each item opens with `<span className="practical-ornament" aria-hidden="true">` cycling `["✦", "⌖", "☽", "❦", "✧", "❧"]` by the item's overall index. Order: dress code, travel modes, FAQ.

`responsive.css`: swatches (`.cr-swatches span { width: 1.1rem; height: 1.1rem; border-radius: 50%; border: 1px solid #b49a7e }`), and — if the `heavy` set shows the designer's three-column `repeat(3, 1fr)` stretching one very long answer into a tall card beside short ones — `align-items: start` on `.practical-grid`.

- [ ] **Step 2: Slots, strings, render, verify**

Slots: `faq.eyebrow`; `faq.title`. Strings: Appendix A `practical`, `faq`. Root: after the brunch, `<PracticalSection data={data} />` (the component decides; do not gate it in the Root, since three modules feed it). `theme-checks` will require each supported module of this section (`dress-code`, `transport`, `faq`) to be drawn by an element carrying its id: they are, on the items.

Verify: the demo shows three items (dress code, one travel mode, one FAQ); `heavy` shows 1 + 6 + 12 = 19 items in three columns at 1440 and one at 390; `minimal` shows nothing. Compare with the reference. Do not commit.

---

### Task 7: RSVP and footer

**Files:**
- Create: `…/chateau-royal/sections/RsvpSection.tsx`, `FooterSection.tsx`
- Modify: `ChateauRoyalRoot.tsx`, `editor.ts`, `responsive.css`

**Interfaces:**
- Produces: `RsvpSection` (client), `FooterSection`.
- Consumes: `useGuestRsvp`, `Crest`, `monogramOf`, `weddingSpan`, `formatDateRange`, `formatFrenchDate`.

**Source:** `index.html:16–17`.

- [ ] **Step 1: RSVP**

`<section className="rsvp" id="cr-rsvp" data-editor-section="rsvp">` > `.rsvp-frame` (the designer's bordered card). Driven by `const rsvp = useGuestRsvp(data)`.

- `.section-eyebrow` = `slot("rsvp.eyebrow") ?? t("eyebrow")`; `<h2>` = first line, then `<em>` second line of `slot("rsvp.title") ?? line1\nline2`; `<p>` = the deadline: `t("deadline", { date: formatFrenchDate(event.rsvpDeadline, { locale }) })` when a deadline exists, else `data.copy?.rsvpNote`; `data.copy?.rsvpIntro` as a further paragraph.
- Replaced by `<div className="success" role="status">{t("thanks")}</div>` when `rsvp.sent`. The designer's `.success { display: none }` is switched on by script; here the element only exists once sent, so add `.theme-chateau-royal .success { display: block }` to `responsive.css`.
- The form (`<form onSubmit={rsvp.handleSubmit}>`), in the designer's `label` + `input`/`select` markup so `.rsvp label`, `.rsvp input, .rsvp select` apply:
  1. `fullName` (required, `autoComplete="name"`).
  2. Presence — **one** select replacing the designer's Saturday/Sunday pair: `<select name="attendance" required onChange={(e) => rsvp.setAttending(e.target.value === "yes" ? true : e.target.value === "no" ? false : null)}>` with options `""` (disabled, "Choisissez"), `yes`, `no`. The hook's `setAttending` accepts a boolean; to return to "no answer" the select simply keeps its chosen value — do not offer an empty option after a choice.
  3. When `rsvp.showParty`: if `rsvp.allowPartner`, a `partyMode` select (solo / with partner) and a required `partnerName` input for `partner`; if `rsvp.allowChildren`, a `childCount` select (none … `rsvp.maxChildren`) and one required `childName-<i>` input per child. Strings from ciao's `rsvp` keys.
  4. `dietary` select when `data.rsvp.dietaryOptions` exist; `message` input when `data.rsvp.collectMessage` (label `t("messageLabel")`, placeholder `t("messagePlaceholder")`).
  5. `rsvp.error` as `<p role="alert">`; the submit `<button type="submit" disabled={rsvp.pending}>` with the label (pending / `t("submit")`) and the designer's `<span aria-hidden="true">✦</span>`.
- Re-key the section outside a real invitation (`key={data.weddingId ? "rsvp" : JSON.stringify(data.rsvp ?? {})}`) as ciao-amore does, so changing an option in the editor's preview shows a fresh form.

- [ ] **Step 2: Footer**

`<footer className="royal-signoff" data-editor-section="footer">` > `.signoff-border`, the designer's children in order, with:

| Source | Becomes |
|---|---|
| `.signoff-seal` `E <span>&</span> R` (circle, `aria-hidden`) | `<div className="signoff-seal" aria-hidden="true" data-long={…}>` containing the monogram split like the crest: left, `<span>{separator}</span>`, right — or the whole text |
| `.signoff-ornament` (top) | as is |
| `.signoff-names` | `<span>{partner1}</span><em>&</em><span>{partner2}</span>` |
| `<p>19 & 20 juin 2027</p>` | `formatDateRange(span.start, span.end, { locale })` |
| (new) | `copy.closing` as a paragraph and `copy.footerNote` as a small line, each only when present |
| (new, **mock-up gate**) | `couple.portrait` as a round image above the seal: `<img className="cr-portrait" src={portrait} alt="" />`; nothing when absent |
| `.signoff-ornament signoff-bottom` | as is |

`responsive.css`: `.cr-portrait` (circle, 7rem, `object-fit: cover`, a 1px gold border `var(--gold)`), and the closing paragraph styled with the footer's own cream-on-espresso tokens.

- [ ] **Step 3: Slots, strings, render, verify**

Slots: `rsvp.eyebrow`; `rsvp.title` (multiline). Strings: Appendix A `rsvp`. Root: `has("rsvp") ? <RsvpSection data={data} /> : null`, then `<FooterSection data={data} />`.

Verify: the demo form shows presence, then — after "Je serai là" — partner and children; `heavy` (adults-only) shows no child field; sending in the demo shows the thank-you and writes nothing; `minimal` still ends with the footer. Compare with the reference. Do not commit.

---

### Task 8: The catalogue, completely

**Files:** none new.

- [ ] **Step 1: Parity and untranslated keys**

`npm run themes:messages -w landing -- chateauRoyal $SCRATCH/messages/chateau-royal` once more (it refuses on any mismatch), then the "identical to French" script of playbook §3.5. Fix every key it lists that is not a name or an ornament. Spot-check `ar`, `zh`, `ja`.

- [ ] **Step 2: Every locale renders**

For `de`, `ar`, `ja`: the demo returns 200, and `console-check.mjs` shows no `MISSING_MESSAGE`.

- [ ] **Step 3: Checkpoint**

`theme-checks.test.mjs` — all `chateau-royal` checks PASS: no demo word in the folder or the nine namespaces, 14 slots declared / read / in the catalogue, every `data-editor-section` real, all seven supported modules drawn, hand-written keyframes prefixed. Do not commit.

---

### Task 9: Safety nets, the verification matrix, the fix loop

**Files:**
- Modify: `…/chateau-royal/responsive.css`

- [ ] **Step 1: No JavaScript, reduced motion**

Hidden until seen in this sheet: every `.reveal`, `.event-card` and `.event-icon` (opacity and stroke dash), the cake frames (`opacity: 0` except the whole one). Add the two blocks of playbook §3.4 for them under `.theme-chateau-royal:not([data-js])` and `prefers-reduced-motion: reduce`: `.reveal { opacity: 1; transform: none }`, `.event-card, .event-icon { opacity: 1; transform: none }`, `.event-icon svg { stroke-dashoffset: 0 }`. The hero stays on its day scene (the night layer is `opacity: 0` at rest; the blanket `animation: none` leaves it so). Verify with JavaScript disabled in Playwright and with `reducedMotion: "reduce"`.

- [ ] **Step 2: The full matrix**

Playbook §4.1 in full. `scrollW === clientW` at all six widths. **Open every image.** Fix in `responsive.css`, never in the generated sheet. In particular: the hero copy's contrast on the day and night scenes at 390 (the designer's own handoff asks to check it); the 760px breakpoint where the timeline switches from centred to left; the 94px/72px circles with the long monogram; the practical grid's three-to-one column switch; the menu card's rounded top on `de` (long words in the course labels); `ar` mirroring of the timeline (the alternation is left/right by `nth-child`: in RTL the cards should still alternate and the line stay centred — fix with a `[dir="rtl"]` rule only if it overlaps).

- [ ] **Step 3: Compare with the reference**

`themes:shoot-url` of the local source (`file:///Users/tarik.klezo/Downloads/chateau/dist/index.html`) at 1440 and 390, side by side with yours. List each visible difference: intended (the film replaced by the photo, the variable text, the single presence question) or unintended (fix).

- [ ] **Step 4: Console and final run**

`console-check.mjs` at 390 and 1440 for `fr` and `ar`: no hydration warning, no missing message, no failed image. Then:

```bash
npx tsc --noEmit -p landing/tsconfig.json 2>&1 | grep "themes/chateau-royal/"
(cd landing && npx eslint src/components/invitation/themes/chateau-royal)
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"
npm run themes:check -w landing
```

Expected: tsc output empty; eslint no error; `fail 0`; registry current.

- [ ] **Step 5: Report**

The playbook §6 report, including: the asset size; the list of differences from the live reference; the mock-up-gate elements (the extra events in the timeline, the footer portrait, the venue arch without a photo) with screenshots at 390 and 1440; the coverage gap (countdown, accommodation, playlist, gift, gallery, intro video are not drawn); anything not verified. Do not commit.
