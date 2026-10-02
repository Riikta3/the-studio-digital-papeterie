# Theme port playbook

Read this, the spec (`docs/superpowers/specs/2026-10-02-three-themes-design.md`) and your theme's plan before writing anything. The three theme plans (`…-theme-mare-alta.md`, `…-theme-chateau-royal.md`, `…-theme-cabo-verde.md`) say *what* to build; this playbook says *how* a theme is built in this repo, with the code every theme shares. `landing/src/components/invitation/themes/README.md` is the history behind it — every trap in it is a bug that shipped.

Throughout, `<id>` is the theme's folder (`mare-alta`), `<camel>` its camelCase form (`mareAlta`), `<Pascal>` (`MareAlta`), `<xx>` its two-letter prefix (`ma`, `cr`, `cv`), and `THEME` is `landing/src/components/invitation/themes/<id>`.

---

## 0. Preconditions

The groundwork plan (`2026-10-02-themes-groundwork.md`) is done. Check in one command, from the repo root:

```bash
ls landing/src/components/invitation/themes/{monogram.ts,date-range.ts,guest-rsvp-payload.ts,use-guest-rsvp.ts,guest-playlist.ts,use-guest-playlist.ts,reveal.tsx,scroll-to.tsx} \
   landing/src/components/invitation/themes/fixtures/index.ts \
   landing/scripts/{theme-messages.mjs,port-theme-css.mjs,shoot-url.mjs} landing/src/lib/theme-checks.test.mjs
grep -c "dayOf" landing/src/components/invitation/themes/types.ts
```

Every file must exist and the count must be 1 or more. If not, stop and report: do not rebuild the groundwork yourself.

Signatures you rely on (all under `landing/src/components/invitation/themes/`):

| Import | Signature |
|---|---|
| `monogramOf` from `../monogram` | `(couple: InvitationData["couple"], separator?: string) => string` |
| `formatDateRange`, `formatDottedDate`, `weddingSpan`, `heroDates` from `../date-range` | `(start, end, { locale }) => string \| null`, `(iso, { locale }) => string \| null`, `(data) => { start, end } \| null`, `(data, locale) => { dotted, spelled }` — **use `heroDates`, not `copy.dateLabel` / `copy.dateSpelled`**: the mapper hands those over in French whatever the locale, and `heroDates` keeps them only when the couple rewrote them |
| `formatFrenchDate`, `formatFrenchWeekday` from `../format` | `(iso, { locale }) => string \| null` — pass `locale` from `useLocale()` |
| `slot`, `Lines`, `cssString` from `../text` | `slot(data, key) => string \| undefined`; `<Lines text="a\nb" />`; `cssString(value) => string` for CSS `content` |
| `Reveal`, `JsFlag` from `../reveal` | `<Reveal as="section" className revealedClass threshold? data-editor-section …>`; `<JsFlag />` |
| `ScrollToButton` from `../scroll-to` | `<ScrollToButton target="#id" \| "top" className ariaLabel>children</ScrollToButton>` |
| `useGuestRsvp` from `../use-guest-rsvp` | see its header comment: field names `fullName`, `partnerName`, `childName-<i>`, `dietary`, `message`; radios `name="attendance"` calling `setAttending` |
| `useGuestPlaylist` from `../use-guest-playlist` | see its header comment |
| `withChildrenPolicyFaq` from `../faq` | derived children-policy FAQ entry — read `faq.ts` for its exact signature before using it |

---

## 1. Working rules

- **Never commit or push.** The only `git` you run is read-only (`git status`, `git diff`).
- **You own** `THEME` (the whole folder), `landing/public/themes/<id>/` and the `Invitation.<camel>` namespace of the catalogues. Touch nothing else. Other agents are working in the same tree on the other two themes; their folders are not yours, and their half-written files may make `tsc` fail. Filter type errors to your own folder: `npx tsc --noEmit -p landing/tsconfig.json 2>&1 | grep "themes/<id>/"` — an empty output is a pass; report errors outside your folder, do not fix them.
- **Never edit** `ciao-amore`, `belle-rive`, `blanc-couture`, the registry (`themes:sync` regenerates it), `components/home/themes.ts` (the orchestrator does it at integration), `landing/messages/*.json` by hand (use `themes:messages`), or any file the groundwork plan created.
- The dev server runs on `http://localhost:3010`; do not start another. A new theme folder is picked up after `npm run themes:sync -w landing`. If Next shows a stale error after a sync, reload once; if `next dev` itself is wedged, remove `.next/dev/lock` and tell the orchestrator.
- The designer's source is read-only. Work from it; never edit it.
- Everything the user will read is French; code, comments and identifiers are English.
- **Everything is variable** (spec D2). Before you finish a section, read its JSX once more and ask of every string and every image: *is this the demo couple's, the demo venue's, or the designer's turn of phrase?* If yes it is a field of `InvitationData`, a slot, or it goes to `demo-data.ts`.

---

## 2. Anatomy of a theme

```
THEME/
  theme.config.ts       the manifest — the only file the rest of the app reads
  editor.ts             the slots: the theme's own words the couple may rewrite
  fonts.ts              next/font, variables prefixed --font-<xx>-*
  demo-data.ts          InvitationData for the showcase (the only place the demo wedding lives)
  <id>.css              GENERATED by themes:port-css — never edit
  responsive.css        hand-written: visibility safety nets, RTL, small fixes
  <Pascal>Root.tsx      composes the sections, gates them on data.modules
  sections/*.tsx        one component per section, driven by props
public/themes/<id>/     WebP assets, cover.webp (made at integration)
```

### 2.1 Manifest

```ts
import type { ThemeManifest } from "../types";

import { <Pascal>Root } from "./<Pascal>Root";
import { <UPPER>_DEMO } from "./demo-data";
import { <camel>EditorSlots } from "./editor";
import { <camel>FontVars } from "./fonts";

export const <camel>Theme: ThemeManifest = {
  id: "<id>",
  name: "<Name>",
  description: "<one customer-facing line from the plan>",
  // Only modules this theme draws. A module the couple owns but the theme does not
  // list is explained in the editor; do not list one you do not draw.
  supports: [/* literal strings only: readSupports() reads them without evaluating code */],
  accentColor: "<hex from the plan>",
  cover: "/themes/<id>/cover.webp",
  scopeClass: "theme-<id>",
  fontVars: <camel>FontVars,
  demoData: <UPPER>_DEMO,
  Root: <Pascal>Root,
  editorSlots: <camel>EditorSlots,
};
```

`supports` must be literal strings (no spread, no constant): `theme-supports.test.mjs` parses the file as text. After adding the folder run `npm run themes:sync -w landing`, which also regenerates `shared/data/theme-modules.ts`.

### 2.2 Root

```tsx
import { useTranslations } from "next-intl";
import type { CSSProperties } from "react";

import { JsFlag } from "../reveal";
import { cssString, slot } from "../text";
import type { InvitationData, ModuleId } from "../types";

import "./<id>.css";
import "./responsive.css";

import { <camel>FontVars } from "./fonts";
// … sections …

/** Words the stylesheet draws with `content:` — slot key, catalogue key, custom property.
 *  The pipeline maps each to a property (config `decor`); the root sets it from the data. */
// const DECOR_WORDS = [["menu.footer", "decor.menuFooter", "--<xx>-menu-footer"]] as const;

export function <Pascal>Root({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.<camel>");
  const enabled = data.modules;
  const has = (id: ModuleId) => !enabled || enabled.includes(id);

  return (
    // `data-theme-root` is how Reveal, JsFlag and ScrollToButton find their theme.
    // Column themes: this element is the full-width backdrop; the column is inside.
    <main className={`theme-<id> ${<camel>FontVars}`} data-theme-root="" style={/* decor properties */ undefined}>
      <JsFlag />
      {/* column themes: <div className="<xx>-column"> … </div> */}
      {/* <HeroSection data={data} /> … {has("countdown") ? <CountdownSection data={data} /> : null} … */}
    </main>
  );
}
```

Sections are plain function components — **never `async`, nothing from `next-intl/server`** — because the dashboard's editor renders the Root in a client tree. Use `useTranslations`/`useLocale` from `next-intl`. Only components with state, effects or event handlers carry `"use client"`.

The hero and the footer always render. Every other section is gated on `has(...)`. When two modules share one section (the Château's practical grid), gate each group.

### 2.3 Sections

Every section root carries `data-editor-section="<id from shared/data/invitation-sections.ts>"` (`hero`, `footer`, or the module id). The editor scrolls to it, reports which sections exist and opens the tab on a click. `theme-checks.test.mjs` fails on an unknown id and on a supported module no section carries.

```tsx
import { useLocale, useTranslations } from "next-intl";

import { formatFrenchDate } from "../../format";
import { Lines, slot } from "../../text";
import type { InvitationData } from "../../types";

export function FaqSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.<camel>.faq");
  return (
    <section id="<xx>-faq" className="…" data-editor-section="faq">
      <p className="eyebrow">{slot(data, "faq.eyebrow") ?? t("eyebrow")}</p>
      <h2>
        <Lines text={slot(data, "faq.title") ?? `${t("titleLine1")}\n${t("titleLine2")}`} />
      </h2>
      {/* … */}
    </section>
  );
}
```

Rules:

- **Keep the designer's markup and class names exactly** — element order, nesting, `className` — and replace only literals. The generated stylesheet addresses that structure; a "cleaner" tree breaks the look silently. Change structure only where a rule below or the plan says so.
- Prefix every `id` with `<xx>-` (`#count` → `#cv-count`): document ids are global.
- Dates: always `formatFrenchDate` / `formatFrenchWeekday` / the groundwork helpers with `locale` from `useLocale()`. A hard-coded French date or a missing `locale` leaves a translated page in French.
- Images: plain `<img>` with `{/* eslint-disable-next-line @next/next/no-img-element -- decorative, positioned by CSS. */}` as ciao-amore does, `loading="lazy"` except the hero, `alt=""` + `aria-hidden` for decoration, an alt from the catalogue for meaningful art, `data.venue.name` as alt for the couple's own venue photo.
- Links that scroll use `ScrollToButton`, never `href="#…"`. External links get `target="_blank" rel="noreferrer"`. A URL from the data is already passed through `safeUrl` by the mapper.
- Counts and absences: map over arrays whatever their length; render a block only when its data exists; a section that has nothing to say renders nothing (not an empty heading). Check with the `minimal` fixture.
- Accordions (FAQ): buttons + panels, `grid-template-rows: 0fr → 1fr` on a wrapper whose inner element has `overflow:hidden; min-height:0`, `inert` on closed panels (not `hidden`), one open at a time, `aria-expanded`/`aria-controls`, `prefers-reduced-motion` honoured, one column at every width. A native `<details>` cannot animate.
- `aria-live`/`role="alert"` on form errors; a pending state on submit buttons; every input has a `name`.
- Reveal: replace the designer's global observer with `<Reveal as="section" revealedClass="<their class>" className="…">`; never `document.querySelectorAll` in an effect.

### 2.4 Slots

A *slot* is a word the theme prints in its own voice that the couple may rewrite. Declare it in `editor.ts`, read it in the section, and give it a neutral default in the catalogue.

```ts
import type { ThemeEditorSlot } from "../types";

const NS = "Invitation.<camel>";

export const <camel>EditorSlots: readonly ThemeEditorSlot[] = [
  { key: "faq.eyebrow", messages: [`${NS}.faq.eyebrow`] },
  {
    key: "faq.title",
    messages: [`${NS}.faq.titleLine1`, `${NS}.faq.titleLine2`],
    multiline: true,
  },
];
```

- Key = `<sectionId>.<role>` with a real editor section id; reuse the generic roles (`eyebrow`, `title`, `intro`, `cta`, `note`, `tag`).
- A two-line title is two messages (`titleLine1`, `titleLine2`) joined by a line break; set `multiline: true`.
- **Defaults take no ICU parameters** — the editor resolves them with none. A phrase that contains a date or a place is split: the slot is the wording, the section appends the formatted value.
- Defaults are neutral: no place, no date, no couple. The designer's own wording ("Le soleil se couche à 21 h 04") belongs in `demo-data.ts` under `texts`, where the showcase keeps it and real weddings do not inherit it.
- `theme-checks.test.mjs` fails if a declared slot is read by no section, names a missing catalogue key, or sits on a section the editor does not have. Run it after every section.
- Words the stylesheet draws with `content:` become slots too, fed through custom properties set on the root (`DECOR_WORDS`, as in `CiaoAmoreRoot.tsx`); the pipeline's `decor` map points each string at its property.

### 2.5 Demo data

`demo-data.ts` exports an `InvitationData` named `<UPPER>_DEMO`. It may be a beautiful, specific wedding — the designer's — and it is the only place that may be. Rules:

- No `weddingId` (that field alone makes a form write to the database).
- Dates from `../demo-date`: `demoStartsAt(6, "<time>", "<offset>")` for `event.startsAt`, `demoDate(4)` for `event.rsvpDeadline`, `demoDayAfter(6)` for a second day. Derive every label from the same anchor (`demoLabel.dotted/long/weekday`); a hard-coded date strands the countdown at zero the day it passes.
- `modules` unset (render everything the data supports).
- `texts` carries the designer's exact wording for the showcase (see 2.4).
- Fill **every** optional field the theme draws: `couple.monogram`, `couple.portrait` (a real image from `public/themes/<id>/`), `events`, `dayTwo`, hotel `city/phone/offer/bookingCode/image`, `venue.access[].link`, `copy.*`, `dressCode.colors/note/image`, `menu.*`, `gifts`, `faq`, `playlist`. A field the demo leaves empty is a field nobody sees the theme draw.
- `dayOf` only if the theme draws the Jour J blocks.

---

## 3. Build steps shared by every port

### 3.1 Assets

List what the final markup and stylesheet reference, then convert. Create the helper once in your scratch folder:

```bash
SCRATCH=/private/tmp/claude-502/-Users-tarik-klezo-Documents-perso-the-studio-digital-papeterie/577e7b05-963c-4e93-83aa-d46f0296997b/scratchpad
cat > $SCRATCH/referenced-assets.mjs <<'EOF'
// node referenced-assets.mjs <assetsDir> <file…> → asset file names the given files mention
import fs from "node:fs";
const [, , assetsDir, ...files] = process.argv;
const text = files.map((file) => fs.readFileSync(file, "utf8")).join("\n");
const all = fs.readdirSync(assetsDir).filter((name) => !name.startsWith("."));
const used = all.filter((name) => text.includes(name));
console.log(used.join("\n"));
console.error(`${used.length} of ${all.length} assets referenced`);
EOF
```

Then, with `SRC` the designer's asset folder and `DEST=landing/public/themes/<id>`:

```bash
mkdir -p "$DEST"
node $SCRATCH/referenced-assets.mjs "$SRC" <css and markup files> > $SCRATCH/<id>-assets.txt
while read -r f; do
  case "$f" in
    *.png|*.jpg|*.jpeg) cwebp -q 82 -alpha_q 90 -m 6 -quiet "$SRC/$f" -o "$DEST/${f%.*}.webp" ;;
    *) cp "$SRC/$f" "$DEST/$f" ;;
  esac
done < $SCRATCH/<id>-assets.txt
du -sh "$DEST"
```

WebP is not optional: these load inside a marketing iframe. MP4 and SVG are copied untouched. **Copy every file the stylesheet's `url()` mentions, even from dead rules** — the pipeline's check refuses a `url()` to a missing file — plus the `<img src>` of the sections you draw. Report the before/after size.

### 3.2 Fonts

```ts
import { Bodoni_Moda, Jost } from "next/font/google";

/** Section headings. Apple devices keep the designer's Didot; this is the web face after it. */
const display = Bodoni_Moda({ subsets: ["latin"], display: "swap", variable: "--font-<xx>-display" });
const sans = Jost({ subsets: ["latin"], weight: ["300", "400", "500", "600"], display: "swap", variable: "--font-<xx>-sans" });

export const <camel>FontVars = [display.variable, sans.variable].join(" ");
```

Weights and `axes` must cover what the stylesheet requests (look for `font-weight` next to each family). Variable names match the pipeline config's `fonts[].variable`. Arabic, Chinese and Japanese pages fall back to the system for glyphs these Latin subsets lack; check them in the screenshots, do not add subsets.

### 3.3 The stylesheet

Write the pipeline config in your scratch folder (paths below are absolute because the config lives outside the repo):

```json
{
  "source": "<designer's css>",
  "out": "/Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie/landing/src/components/invitation/themes/<id>/<id>.css",
  "scope": "theme-<id>",
  "columnClass": "<xx>-column",
  "dropImports": [],
  "assets": ["<designer url prefix>=/themes/<id>/", ".png=.webp"],
  "fonts": [{ "family": "Didot", "variable": "--font-<xx>-display", "position": "after" }],
  "decor": { "<exact text of a content: string>": "--<xx>-<name>" },
  "publicDir": "/Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie/landing/public",
  "markup": ["<designer's page.tsx or index.html>"]
}
```

Optional config keys: `externalVars` (custom properties the markup or scripts set at runtime, e.g. `--c` on a swatch, which would otherwise be reported as used and never defined) and `keyframePrefix` (default: the scope without `theme-`, plus `-`).

Run `npm run themes:port-css -w landing -- <config.json>`. It fails — on purpose — when a selector escapes the scope, a custom property is used and never defined, an asset is missing, or a `content:` string with letters has no `decor` mapping. Fix the config, never the output. Re-run it whenever the config changes; the output file is disposable.

The pipeline also prefixes every `@keyframes` name (and each `animation` that uses it) with the theme's — names are global to the document and every theme's CSS loads together, so a bare `spin` or `softRise` would swap with another theme's. **Any `@keyframes` you write by hand in `responsive.css` must carry the same prefix** (`<id>-name`, e.g. `mare-alta-reveal`) or `theme-checks` and review will reject it.

The pipeline strips comments and keeps rule order. **Do not reorder, merge or "clean up" rules**: the designer's sheet is layered, and cascade order is the look.

### 3.4 `responsive.css`

Hand-written, imported **after** the generated sheet, every rule under `.theme-<id>`, every rule with a comment saying *why*. It holds only:

1. **Visibility safety nets** the generated sheet cannot know about:

   ```css
   /* Without JavaScript nothing may stay hidden (JsFlag sets data-js on the root). */
   .theme-<id>:not([data-js]) .<revealable> { opacity: 1; transform: none; }

   /* A reader who asked for no motion gets none, and nothing waits for a scroll. */
   @media (prefers-reduced-motion: reduce) {
     .theme-<id> *, .theme-<id> *::before, .theme-<id> *::after {
       animation: none !important;
       transition-duration: 0.01ms !important;
       scroll-behavior: auto !important;
     }
     .theme-<id> .<revealable> { opacity: 1; transform: none; }
   }
   ```

   `.<revealable>` is the designer's hidden-until-seen selector (e.g. `.paper-section`, `.reveal`).
2. **Right-to-left** fixes. Arabic is RTL: physical `left`/`right` offsets, `translateX`, `text-align` and background positions may need a mirrored rule under `[dir="rtl"] .theme-<id> …`. Look at the `ar` screenshots and fix what is wrong, only what is wrong.
3. **Fixes found in screenshots**, in the traps below.

It must not restyle what looks right.

### 3.5 Catalogue

Strings live in `landing/messages/<locale>.json` under `Invitation.<camel>`. You write them in a scratch folder (outside the repo) and merge:

```bash
STAGE=$SCRATCH/messages/<id>      # fr.json en.json de.json es.json pt.json it.json ar.json zh.json ja.json
npm run themes:messages -w landing -- <camel> $STAGE
```

Each file is the *namespace object* (`{ "hero": { "eyebrow": "…" } }`), and the nine must carry exactly the same keys — the script refuses otherwise. It is idempotent and takes a lock, so re-run it after every section. **Add a section's keys in all nine languages in the same task**; never merge French into the other eight "for now".

- Start the functional strings (field labels, placeholders, errors, thank-yous, "Voir plus") from the matching keys of `Invitation.ciaoAmore.rsvp`, `.playlist`, `.stays`, `.faq` in the nine catalogues — they are translated already — and rewrite only what is in ciao-amore's voice.
- Plurals are ICU, never `count > 1 ? "s" : ""`: `"{count, plural, one {# jour} other {# jours}}"`. Arabic has six plural categories (`zero one two few many other`), Chinese and Japanese have `other` only.
- Names and ornaments identical in every language (a monogram glyph) may repeat; everything else is translated. Check with:

  ```bash
  node -e '
  const fs=require("fs"),L=["en","de","es","pt","it","ar","zh","ja"];
  const fr=JSON.parse(fs.readFileSync("landing/messages/fr.json","utf8")).Invitation["<camel>"];
  const leaves=(o,p="")=>Object.entries(o).flatMap(([k,v])=>typeof v==="object"?leaves(v,p+k+"."):[[p+k,v]]);
  for(const l of L){const c=JSON.parse(fs.readFileSync(`landing/messages/${l}.json`,"utf8")).Invitation["<camel>"];
    const same=leaves(fr).filter(([k,v])=>leaves(c).find(([k2,v2])=>k2===k)?.[1]===v && /[a-zà-ÿ]{4,}/i.test(v));
    console.log(l,"identical to French:",same.map(([k])=>k).join(", ")||"none");}'
  ```
  Any key listed is almost certainly untranslated.
- Nothing the designer wrote about the demo wedding goes in the catalogue (the leak test scans it).

---

## 4. Verification protocol

Run from the repo root after each section and again at the end. The dev server must be up.

```bash
npx tsc --noEmit -p landing/tsconfig.json 2>&1 | grep "themes/<id>/"          # empty = pass
(cd landing && npx eslint src/components/invitation/themes/<id>)                # no error
node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs --test landing/src/lib/theme-checks.test.mjs
npm run themes:check -w landing
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3010/fr/invitation/demo/<id>   # 200
```

### 4.1 Screenshots — and look at them

```bash
OUT=/tmp/shots/<id>; mkdir -p $OUT
for w in 390 768 1024 1440 1728 1920; do npm run --silent themes:shoot -w landing -- <id> $w $OUT; done
for fx in minimal heavy; do for w in 390 1440; do npm run --silent themes:shoot -w landing -- <id> $w $OUT $fx; done; done
for loc in de ar; do for w in 390 1440; do SHOOT_LOCALE=$loc npm run --silent themes:shoot -w landing -- <id> $w $OUT; done; done
```

Each run prints `metrics`; **`scrollW` must equal `clientW`** at every width (a difference means something pushes the page sideways). Then open the images — the full-page PNG and the per-section PNGs — with the Read tool and look. Every layout bug in `themes/README.md` was invisible in the CSS and obvious in a screenshot. Compare each width of the demo with the designer's reference (the Château's live site is behind a sign-in: use `file:///Users/tarik.klezo/Downloads/chateau/dist/index.html`). A page taller than 16 384 px is saved in slices — `-full.png`, `-full-2.png`, … — because Chromium folds anything taller (the bottom would repeat the top); look at every slice:

```bash
npm run --silent themes:shoot-url -w landing -- <reference url> 390 $OUT/ref ref
```

Look for, in this order: empty bands beside a section (a `max-width` on the section instead of its content); a heading flush left while its text is centred (`margin: n 0` beating `margin-inline: auto`); decorations pinned with negative offsets drifting into the margins; text overflowing a framed or `contain`-sized background; a button whose colour matches its ground; `vw` type becoming a billboard at 1920; sections stuck at `opacity: 0`; a cream button on a blue ground; two columns that wrap a label into its neighbour. Then the `minimal` set (does every section degrade, is there an empty heading?), the `heavy` set (long names, 10 hotels, 12 FAQ answers, adults-only), `de` (long words) and `ar` (mirrored).

### 4.2 Console

```bash
cat > $SCRATCH/console-check.mjs <<'EOF'
import { chromium } from "playwright";
const [, , url, width = "390"] = process.argv;
const browser = await chromium.launch({ channel: "chrome", executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const page = await browser.newPage({ viewport: { width: Number(width), height: 900 } });
const problems = [];
page.on("console", (m) => { if (["error", "warning"].includes(m.type())) problems.push(`${m.type()}: ${m.text()}`); });
page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(2000);
console.log(problems.length ? problems.join("\n") : "no console errors or warnings");
await browser.close();
EOF
node $SCRATCH/console-check.mjs http://localhost:3010/fr/invitation/demo/<id> 390
node $SCRATCH/console-check.mjs http://localhost:3010/fr/invitation/demo/<id> 1440
```

Expected: nothing about hydration, missing messages (`MISSING_MESSAGE`), keys or failed images. Next's dev-tools notices are not yours; anything naming your files or keys is.

### 4.3 Definition of done

Everything in the spec's *Verification* section, plus: no `href="#…"`, no `document.querySelectorAll` in an effect, no `async` section, no import from `next-intl/server`, every input named, every section root carrying `data-editor-section`, every slot wired (the test), nine locales merged with parity, `responsive.css` commented, nothing of the demo outside `demo-data.ts`.

---

## 5. New UI the design lacks (mock-up gates)

Where the plan says an element has no place in the designer's layout, **build it tentatively in the real theme** at the placement the plan proposes, in the theme's own language, and flag it in your report with screenshots at 390 and 1440. The running page is the clickable mock-up the user reviews; the orchestrator shows it and you may be asked to move it. Do not leave such an element out, and do not invent a second variant.

## 6. Your report

End with a message to the orchestrator containing: the files created (and the only existing files you changed, if any); the output of each command in §4 (trimmed, with the `metrics`); the screenshot folder; the asset sizes before and after; every deviation from the plan and why; the mock-up-gate elements and where they are; anything you could not do. State plainly what you checked and what you did not. Do not say a thing works that you did not run.
