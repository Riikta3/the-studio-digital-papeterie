# Porting an invitation theme

How a theme gets from a standalone project into this app. Written after doing
it three times (`ciao-amore`, `blanc-couture`, `belle-rive`); everything in the
Traps section is a bug that actually shipped and had to be found by looking at
a screenshot.

The architecture is built for dozens of themes. **Adding one must not require
editing an existing file** — if you find yourself doing that, the design is
wrong, not your theme.

---

## What a theme is

A folder. Nothing else.

```
themes/
  types.ts        InvitationData + ThemeManifest — the shared contract
  registry.ts     GENERATED from the folders (npm run themes:sync)
  format.ts       French date helpers ("1er juin", never "1 juin")
  demo-date.ts    rolling demo dates
  text.tsx        slot() / <Lines> — reading the couple's rewritten words
  video.ts        YouTube / Vimeo embed URLs, rebuilt from the video id
  <theme-id>/
    theme.config.ts    the manifest the rest of the app reads
    editor.ts          the words the couple may rewrite ("slots")
    fonts.ts           next/font, variables prefixed --font-<xx>-*
    demo-data.ts       InvitationData for the showcase
    <theme-id>.css     GENERATED: the source stylesheet, scoped
    responsive.css     hand-written: the desktop layer
    <Theme>Root.tsx    composes the sections, gates them on modules
    sections/          one component per section, driven by props
```

Everything else is derived:

| Surface | Comes from |
|---|---|
| `/invitation/demo/<id>` | the manifest — the route is generic |
| Home carousel + phone mockup | `components/home/themes.ts` (one line per theme) |
| A real wedding's invitation | `sites.theme_id` → `resolveTheme()` |
| The dashboard editor's live preview | `/invitation/apercu`, fed the couple's draft |

---

## The tooling

```bash
npm run themes:scope-css -- <in.css> <out.css> <scope-class> [from=to ...]
npm run themes:sync              # regenerate registry.ts from the folders
npm run themes:check             # fail if the registry is stale (CI)
npm run themes:shoot -- <id> [width] [outDir]
```

`themes:shoot` writes one PNG per section plus a full-page capture, and prints
`scrollW` vs `clientW`. **Look at the images.** Every layout bug in the Traps
section below was invisible in the CSS and obvious in a screenshot. It needs
the dev server on :3010 and Google Chrome installed.

---

## The port, step by step

### 1. Assets

```bash
mkdir -p landing/public/themes/<id>
cp -R <source>/public/<dir>/* landing/public/themes/<id>/
cd landing/public/themes/<id>
for f in $(find . -name "*.png" -o -name "*.jpg"); do
  cwebp -q 82 -alpha_q 90 -m 6 -quiet "$f" -o "${f%.*}.webp" && rm "$f"
done
```

WebP is not optional: these load inside a marketing iframe. The three ports
went 78 MB → ~5 MB of stills. Grep `page.tsx` **and** the stylesheets before
deleting anything that looks orphaned — several assets are only referenced from
CSS `url()`.

Leave `.mp4` and font files alone; `-q 82` on artwork is visually lossless at
these sizes.

### 2. Scope the CSS

```bash
npm run themes:scope-css -- ../<source>/app/globals.css \
  src/components/invitation/themes/<id>/<id>.css \
  theme-<id> "/<srcdir>/=/themes/<id>/" ".png=.webp"
```

Source themes style `body`, `main`, `h2`, `input` globally. Imported as-is they
repaint the whole landing and fight every other theme — 14 class names collide
between the three ported so far. The script rewrites every selector under one
root class, so `body{...}` becomes `.theme-<id>{...}` and can no longer reach
outside.

If the theme ships several stylesheets, concatenate them **in load order**
first, then scope the result once.

Then verify — do not assume:

```js
// zero selectors outside the scope
const css = require("fs").readFileSync("<id>.css", "utf8");
// (walk rules, assert every selector starts with .theme-<id>)

// zero variables used but never defined
const defined = new Set([...css.matchAll(/(--[a-z-]+)\s*:/g)].map(m => m[1]));
const used = [...new Set([...css.matchAll(/var\((--[a-z-]+)/g)].map(m => m[1]))];
console.log(used.filter(u => !defined.has(u)));  // --font-* are expected
```

### 3. Fonts

Move Google Fonts from the sheet's blocking `@import url(...)` to `next/font`,
with variables prefixed per theme (`--font-ca-*`, `--font-bc-*`, `--font-br-*`).
Then rewrite the families in the generated CSS:

```
font-family:Italiana,serif  →  font-family:var(--font-xx-display),Italiana,serif
```

Count occurrences before and after. **The sheet is one long line, so `grep -c`
counts lines, not matches** — use `grep -o ... | wc -l`.

This substitution is a post-processing step on a generated file. Re-running
`themes:scope-css` wipes it. Redo it, or move it into a script.

### 4. Sections

Format the source first (`npx prettier --parser babel-ts`) — it ships minified
onto very long lines.

- Sections are **isomorphic**: plain function components, never `async`, and
  nothing from `next-intl/server`. Use `useTranslations` / `useLocale` from
  `next-intl`, which work in a Server Component (the public page still renders
  on the server) and in a client tree — the dashboard editor's live preview
  imports the theme's `Root` into a client component and re-renders it as the
  couple types. An `async` section breaks the preview for every couple on the
  theme. Only countdowns, forms, toggles and accordions need `"use client"`.
- Put `data-editor-section="<id>"` on each section's root element, with the id
  from `shared/data/invitation-sections.ts` (the hero is `hero`, the footer
  `footer`, every other section its module id — the day-after block belongs to
  `timeline`). The preview scrolls to it when the couple opens that tab, reports
  which sections are on the page, and lets a click on it open the tab.
- Every value comes from typed props. **Zero content in the JSX.**
- **Draw every field the editor lets a couple fill**, in the section of the tab
  that edits it — the preview scrolls there, so a field printed elsewhere looks
  broken. The ones themes forget: `couple.monogram` (hero tab),
  `couple.portrait` (footer tab), `events` — each event's name, date, time,
  address, description and dress code (programme tab), the brunch's moments
  (`schedule` with `day: 2`), a hotel's `city`, `phone`, `offer` and `image`,
  `copy.rsvpIntro`, and `venue.access[].link` (the carpool board, with the
  couple's wording). `ciao-amore` draws all of them; read it before guessing.
- Use `formatFrenchDate` / `formatFrenchWeekday` from `../../format` for every
  date, so "1er juin" is right everywhere.
- Demo forms keep their local success state — nothing is persisted yet — but put
  `name` on every input so wiring a server action later is just reading FormData.
- Prefix any `id` (`#count` → `#br-count`): document ids are global.

### 5. Demo data

Type it as `InvitationData` and use `demo-date.ts`:

```ts
const STARTS_AT = demoStartsAt(6, "17:00", "+01:00");  // always 6 months out
// rsvpDeadline: demoDate(4), dayTwo: demoDayAfter(6)
// every label derived: demoLabel.dotted / .long / .weekday
```

A hard-coded date strands the showcase countdown at zero the day it passes.
Derive **every** label from `STARTS_AT` — a written-down date drifts out of step
with a rolling one, and the sources were already full of dates contradicting
each other.

These helpers are computed from midnight UTC on purpose: they run on the server
and again in the browser, and a value derived from the exact current time would
differ between the two and trip a hydration mismatch.

### 6. The couple's words ("slots")

Every word the theme prints in its own voice — an eyebrow, a title, a
decorative stamp — must be rewritable by the couple. Declare each one in
`editor.ts`:

```ts
{ key: "faq.title", messages: ["Invitation.<camelId>.faq.titleLine1",
                               "Invitation.<camelId>.faq.titleLine2"], multiline: true }
```

and read it in the section with the catalogue as the fallback:

```tsx
<h2><Lines text={slot(data, "faq.title") ?? `${t("titleLine1")}\n${t("titleLine2")}`} /></h2>
```

Keys are `<sectionId>.<role>`; reuse the generic roles (`eyebrow`, `title`,
`cta`, `tag`…) so a key means the same thing across themes. The editor shows
each slot with the theme's default as its placeholder, resolved by the preview
in the invitation's language — the dashboard knows nothing about any theme.
Words written into the markup (ciao-amore's "Amore ✦ Limoni ✦ Dolce Vita")
move to the catalogue first, so there is a default to fall back to.

### 7. Manifest, register, verify

```ts
export const <camelId>Theme: ThemeManifest = {
  id: "<id>", name: "...", description: "...",
  supports: [...],           // only modules this theme can actually render
  accentColor: "#...", cover: "/themes/<id>/cover.webp",
  scopeClass: "theme-<id>", fontVars: <camelId>FontVars,
  demoData: <ID>_DEMO, Root: <Theme>Root,
  editorSlots: <camelId>EditorSlots,
};
```

```bash
npm run themes:sync
npx tsc --noEmit -p landing/tsconfig.json
npm run themes:shoot -- <id> 1728
```

To list it on the home page, add one entry to `components/home/themes.ts` with a
cover generated from its own demo.

---

## Traps

Each of these shipped at least once.

### `max-width` on a section leaves empty bands

The single most visible bug. Sections keep their background **edge to edge**;
only their *content* is held to a measure.

```css
@media (min-width: 900px) {
  .theme-x .section { padding-inline: clamp(24px, 5vw, 80px); }
  .theme-x { --measure: 1100px; }
  .theme-x .section > * { max-width: var(--measure); margin-inline: auto !important; }
}
```

A background can also stop short without any `max-width`: `background-size:
auto 92%` sizes against the *height*, so on a 900px-tall page the texture is
~470px wide and the section shows pale bands either side. Use `cover` for
seamless textures; keep `contain` only for framed artwork a crop would cut, and
put a `cover` texture underneath it so the ground stays continuous.

### `margin-inline: auto` silently loses

Nearly every heading in a generated sheet carries `margin: <n> 0`. That lateral
`0` beats a shorthand, so the title sits flush left while the copy under it is
centred. `margin-inline: auto !important` is what holds.

Verify by measuring, not by eye: each block's centre must equal the viewport's.

### A `:root` behind a comment escapes scoping

`/* a note */ :root{...}` used to slip through unscoped, so its variables landed
on `<html>` and never reached the theme. Symptoms: buttons with `color:
var(--sun)` rendering black on dark blue, and CSS-drawn icons collapsing to
fragments. Fixed in the script — but always re-run the "used but never defined"
check above.

### Native `<details>` cannot animate

The browser snaps it open. For an animated accordion, render buttons + panels
and transition `grid-template-rows: 0fr → 1fr` on a wrapper whose inner element
has `overflow:hidden; min-height:0`. That is the only way to animate to a height
the content decides without measuring it in JS. Draw the +/× with two
pseudo-elements so it can rotate. Keep one panel open at a time, use `inert` on
closed panels (not `hidden`, which kills the closing transition), and honour
`prefers-reduced-motion`.

FAQ stays **one column at every width**. Two columns leave a tall gap beside
whichever answer is open, and CSS `column-count` reflows on every toggle — it
cut the last question in half.

### Decorations pinned with negative offsets

Sun discs, petals, ribbons are positioned against their section with offsets
tuned for a ~500px column. Full width, the section edge is the viewport, so they
drift into the margins or get sliced by `overflow:hidden`. Anchor them to the
content band instead:

```css
.theme-x { --band: 550px; }               /* half the measure */
.theme-x .sun { right: calc(50% - var(--band) - 90px); }
```

Keep each one on the side the source put it — check before batching.

### Everything else worth knowing

- **Forms**: cap at ~520px and centre. A 1000px text input reads as a bug.
- **Contrast**: any rule setting `background` on something with text must set
  `color` too. A cream button on a blue ground disappears.
- **`vw` type**: source sizes assume a narrow column. `clamp(min, Nvw, max)`, or
  headings become billboards at 1920px.
- **Two columns are not always better**: a hotel list was tried at two columns
  and long names wrapped into their own distance label. It went back to one.
- **Reveal-on-scroll**: a global `document.querySelectorAll` in a `useEffect`
  captures other components' elements in this app. Use a `<Reveal>` component.
- **Media by index**: sources bind videos with `{i === 0 && <video …>}`.
  Reordering the schedule reassigns them. Put the media on the entry.
- **Screenshots and reveals**: jumping straight to the bottom of the page leaves
  `IntersectionObserver` blocks at `opacity:0`, so sections look empty in a
  capture. `themes:shoot` scrolls stepwise for this reason.

---

## Checklist

- [ ] Zero selectors outside `.theme-<id>`
- [ ] Zero CSS variables used but never defined (`--font-*` excepted)
- [ ] `npx tsc --noEmit` passes
- [ ] Demo returns 200; **screenshots reviewed section by section**
- [ ] `scrollW === clientW` at 390 / 768 / 1024 / 1440 / 1728 / 1920
- [ ] Mobile unchanged from the source
- [ ] Countdown shows a real remaining time, no console errors (no hydration mismatch)
- [ ] Every date derived from the rolling demo date
- [ ] Forms capped; every input has a `name`
- [ ] FAQ one column, animated, `prefers-reduced-motion` honoured
- [ ] No section is `async`; nothing imports `next-intl/server`
- [ ] Every section root carries `data-editor-section`
- [ ] Every word in the theme's own voice is a slot in `editor.ts`, and wired
- [ ] `npm run themes:sync` run; production build passes
- [ ] **Listed for sale.** One entry in `landing/src/components/home/themes.ts`
      (`id`, `name`, `image`, `statusBar`), plus `cover.webp`
      (`themes:shoot`) and `scroll.webp` (`themes:shoot-scroll`) in
      `public/themes/<id>/`. That single entry shows the theme in the hero
      carousel, the phone preview and its row, the « Comment ça marche »
      cards, the studio's theme step and the checkout summary;
      `src/lib/theme-catalogue.test.mjs` (`npm test`) fails until it is there.
- [ ] **Its demo music.** One line in `THEME_DEMO_TRACKS`
      (`shared/data/music-library.ts`) naming a library track; the same test
      fails without it.

### Then: wiring it up

The list above gets a theme rendering. It does NOT make it usable by a real
wedding — that is a second pass, and `ciao-amore` is the only theme that has
had it:

- [ ] **Zero content in the JSX.** A section that takes no props is by
      definition hardcoded. Real leaks found this way: "vers Mauguio", "sur la
      Riviera", "À proximité de la Villa", a `"V & G"` monogram default, and
      the demo couple's photograph rendered on every wedding.
- [ ] **Forms persist.** `data.weddingId` present → call `submitRsvp` /
      `submitPlaylistSuggestions`; absent → confirm locally and write nothing.
      Two themes shipped saying "votre réponse a bien été enregistrée" while
      dropping every reply.
- [ ] **Failures are visible.** An error message and a pending state, or a
      guest believes they answered when they did not.
- [ ] **Nine locales.** Strings to `Invitation.<camelId>` in
      `landing/messages/*.json`; ICU plurals, never `count > 1 ? "s" : ""`;
      pass `locale` to the date helpers or a translated page still prints
      French dates.
- [ ] **Icons** use `ScheduleIcon` — the moment, not the drawing.
- [ ] **Every editor field changes the preview.** Fill each tab of the editor
      and watch its section: a field that changes nothing is a field the theme
      forgot (see "Sections" above for the usual ones).

Full checklist, with the reasoning and the traps behind each line:
`The Studio Digital Papeterie/Features/Checklist nouveau thème.md`.

How the October 2026 ports were done — the `themes:port-css` pipeline, the
shared guest-form hooks, `themes:messages`, `?fixture=minimal|heavy`, the
screenshot protocol — is in
`docs/superpowers/plans/2026-10-02-theme-port-playbook.md`.

---

## Known debt

- **Only `ciao-amore` is fully wired.** `belle-rive` and `blanc-couture` render
  and persist their RSVPs and work in the editor's preview, but neither declares
  slots yet (their catalogue words cannot be rewritten). `belle-rive` is
  translated (`Invitation.belleRive`, nine locales); `blanc-couture` is still
  French-only. `venue.access` — the couple's travel directions — is still
  rendered by neither. Nor are `events`, a hotel's phone and photo, or
  `copy.rsvpIntro` (`blanc-couture` does draw the portrait and the monogram).
  They need the second pass described above before they are sold.
- **Modules a theme does not draw.** `ciao-amore`, `mare-alta`, `chateau-royal`
  and `cabo-verde` draw all thirteen modules with guest-facing content; each
  keeps the sections its designer never drew in a hand-written `modules.css`,
  in the theme's own grammar. `belle-rive` and `blanc-couture` still drop some.
  The guestbooks have no guest-facing feature anywhere yet. A theme that drops
  a module the couple bought shows an explanation in the editor's tab.

- **`belle-rive` ships 38 MB of video.** Six uncompressed `.mp4` autoplaying in a
  marketing iframe. Compressing them trades visual quality against load time, so
  it was left as an explicit decision rather than made silently.
- **Font substitution is a post-processing step** on generated CSS and is lost on
  re-scope. `themes:port-css` now does it (and the rest of the port) from a
  config; a theme ported by hand with `themes:scope-css` still needs it redone.
- **`npm run lint` is broken repo-wide** (ESLint 9 without a flat config),
  unrelated to theming. `tsc --noEmit` is the gate that works.
- **`mediterranean-classy` predates this architecture** and still lives at
  `components/invitation/theme-mediterranean-classy/` with its own route. It
  should be migrated into `themes/` when someone touches it.
