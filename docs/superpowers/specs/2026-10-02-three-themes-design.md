---
date: 2026-10-02
status: approved-by-delegation
category: feature
---

# Three new invitation themes — Maré Alta, Château Royal, Cabo Verde

## What was asked

> « Ok ok comme ciao_amore on va créer un nouveau theme analyse ciao amore »
> (then the Maré Alta folder) « va falloir mettre ça en place »
>
> « S'il manque des modules je te laisse les créer […] tu les retrouves un peu
> partout dans checkout ou dashboard »
>
> « très important comme ciao_amore il faut que tout soit variable »
>
> (then the Château and Beach folders) → « Les 3 thèmes, en parallèle »

Answers to the scoping questions, all taken as given:

| Question | Answer |
|---|---|
| Sections with no backend, and fake elements (IBAN, audio player, GPS) | **Contract first**: draw only what the product can honour |
| RSVP fields the product does not store (e-mail, phone, arrival, lodging, per-event attendance, children's ages) | **Only what `submitRsvp` stores** |
| Desktop layout of Maré Alta | **Centred 720px column**, as designed |
| Scope | **The three themes, in parallel** |
| Review | **No review of the spec or the plan**: spec → plan → execution. Stop only for mock-ups of new UI and for the `db push` go-ahead |

The user also asked that nothing be committed until they say so (standing rule).

## The three sources

All three come from the same designer, in `~/Downloads`, with a handoff note each.

| | Maré Alta | Château | Beach |
|---|---|---|---|
| Folder | `Invitation_Mare_Alta_FINAL_Tarik_2026-09-30` | `chateau/dist` | `Invitation_Beach_Paula_Ricardo_FINAL_Tarik_2026-10-02/site` |
| Demo couple | Sienna & Malo, Casa Maré Alta, Comporta, 19 Jun 2027 | Éléonore & Raphaël, Vaux-le-Vicomte, 19–20 Jun 2027 | Paula & Ricardo, Baía das Gatas, São Vicente, 30 Apr 2027 |
| Live reference | `sienna-malo-mare-alta.emiliethestudio.chatgpt.site` | `invitation-chateau-eleonore-raphael.emiliethestudio.chatgpt.site` | `cabo-invitation-mariage.emiliethestudio.chatgpt.site` |
| Stack | Next/React, one client component of 1 100 lines | static HTML, 9 KB, `script.js` 2 KB | static HTML, 12 KB, `app.js` 4 KB |
| CSS | 4 836 lines, **12 stacked rewrite layers**, ~11 % dead rules | 34 KB minified on a few lines, **3 palette layers** | 1 637 lines, **5 palette layers**, roughly a third dead (calendar, postcard, opening doors never reach the markup) |
| Layout | `main` = 720px column on a sage backdrop | full-bleed, desktop-first (hero copy at 6 % / 43 %) | `main` = 680px column, rounded card on desktop |
| Fonts | system stack (Didot, Avenir Next, Georgia) — Apple only | Bodoni Moda, Italiana, Pinyon Script, Jost (Google Fonts link) | system stack (Didot, Times New Roman, Snell Roundhand, Arial) — Apple only |
| Assets | 17 images, 43 MB PNG | 11 files, 4.2 MB (WebP + 2 MP4, one unused) | 52 PNG, 82 MB, ~25 referenced |
| Words baked in CSS `content:` | `"S · M"`, `"CASA MARÉ ALTA · 19 JUIN 2027"` | none | `"SÃO VICENTE · CABO VERDE"` ×3, `"P&R"`, `"N&T"`, `"NOTRE MARIAGE · AU BORD DE L'OCÉAN"` |
| Traps already in the source | global `section:not(.hero)` observer; `href="#…"`; `body`+`main` collapse into one element under `scope-css` | global `.reveal` observer; window scroll listener for the programme | global `.section` observer and parallax; `.section h2` class added by JS |

## Decisions

### D1 — Contract first

A theme renders `InvitationData`; it decides nothing. What the product cannot honour
is **not drawn**. The same rule applies to the three themes.

Dropped from the sources, with the reason:

| Dropped | Source | Why |
|---|---|---|
| Fake audio player (play/pause, "EN ÉCOUTE", progress bar, 4 fixed tracks) | Maré Alta, Beach | no audio exists; it promises sound. The discs/guitar keep turning as decoration |
| IBAN/BIC reveal and the gift progress bar | Maré Alta | no field exists, it is sensitive data, and the bar is invented |
| GPS stamp | Maré Alta | `Venue` has no coordinates → shows `venue.city` and `venue.country` |
| "Ouvrir le guide complet", "Modifier ma réponse" buttons, "modifiable jusqu'au 15 mai" | Maré Alta | lead nowhere / a guest cannot edit a reply here |
| E-mail, phone, arrival, lodging, welcome-dinner and brunch checkboxes, children's ages, "Saturday / Sunday" split | all three RSVPs | `submitRsvp` stores none of it |
| Venue film (France hexagon → château) | Château | an illustration generated for one château; cannot be variable. The arch shows `venue.image` with a slow zoom |
| "Elle / Lui" dress-code notes | Beach | `dressCode` has one `note`; the split is also not inclusive |
| Jar of messages | Maré Alta | no guest feature behind the `guestbook` id — see *Guestbook goes live* |
| Guest photo drop, "Trouve ta place" | Maré Alta | already exist in the **Jour J** guest page → linked, see D5 |

### D2 — Everything is variable

The rule that overrides every other: **nothing of the demo couple survives in a theme.**

- Every value comes from `InvitationData`, or is a **slot** declared in `editor.ts`
  whose default is neutral (no place, no date, no couple's turn of phrase).
- Phrases that contain a date or a place are split: the slot covers the wording, the
  theme appends the formatted value. Slot defaults take no ICU parameters (the editor
  resolves them without any).
- The `demo-data.ts` of each theme may set `texts` to keep the designer's exact
  wording in the showcase ("Deux jours pour se souvenir", "Le soleil se couche à
  21 h 04"). Real weddings get the neutral default until the couple rewrites it.
- Words drawn by the stylesheet (`content:`) are fed through custom properties set
  on the theme root, like `DECOR_WORDS` in `CiaoAmoreRoot.tsx`. The CSS pipeline (D7)
  replaces each such string with its property and **fails** if one containing letters
  is left unmapped; the generated file is regenerated, never edited by hand.
- Images are decoration by default; the couple's photograph replaces them as soon as
  the field exists (`venue.image`, `dressCode.image`, `Stay.image`, `dayTwo.image`,
  `couple.portrait`).
- Counts are never assumed: 1 to 8 programme moments, 0 to 10 lodgings, 0 colours,
  one event or three.

**Enforcement** (both land in Phase 0, before any theme):

1. `landing/src/lib/theme-checks.test.mjs`, run by `npm test`. It fails if any of
   the demo's proper nouns appears outside `demo-data.ts` — in the theme folder, or in
   the theme's `Invitation.<camelId>` namespace of the nine catalogues. It also fails
   when a slot declared in `editor.ts` is read by no section, names a catalogue key
   that does not exist, or sits on a section the editor does not have, and when a
   module the theme `supports` is drawn by no section carrying its id. The word list
   is per theme and lives in the test: the demo couple's names, venue and places. The
   theme's own name stays allowed in `theme.config.ts` ("Maré Alta" the theme is not
   "Casa Maré Alta" the venue).
2. A **control dataset**. `themes/fixtures/other-wedding.ts` exports `minimal` (every
   optional field empty, single day, one event, no images, no monogram, no portrait)
   and `heavy` (many entries, long strings, three events, adults-only). The demo page
   renders them with `?fixture=minimal|heavy` outside production, and `themes:shoot`
   takes the fixture as a fourth argument. Each theme is screenshotted with all three
   datasets.

### D3 — RSVP

Same payload as ciao-amore: presence, first/last name, partner when
`rsvp.allowPartner`, children when `rsvp.allowChildren !== false`, dietary when
`rsvp.dietaryOptions`, message when `rsvp.collectMessage`. With `weddingId` the form
calls `submitRsvp`; without it the form confirms locally and writes nothing. A failure
shows an error and the button has a pending state. The deadline line is derived from
`event.rsvpDeadline`. The submission logic is the shared hook of Phase 0, not a fourth
copy.

### D4 — Layout

- **Maré Alta**: the theme root is the full-width sage backdrop; inside it,
  `.ma-column` is the source's `main` (720px, ivory, shadow, `overflow: hidden`).
- **Cabo Verde**: same, `.cv-column`, 680px; on desktop the column is a rounded card
  with the source's 2rem of body padding applied to the root.
- **Château Royal**: full-bleed. No column.

`scope-css` collapses `html`, `body` and `main` onto one element. For the two column
themes the pipeline renames the source's `main` rules to the column class *before*
scoping, so the backdrop and the column stay two elements.

### D5 — The Jour J is linked, not rebuilt

The Jour J is included for every wedding and is deliberately not a module (spec
2026-09-01 §12). Its guest page `/jourj/[slug]` already offers `ma-table` (seating
finder: RPC `search_guest_table`), `photos` (guest upload and shared gallery, upload
window and moderation) and `menu`. It is switched on by `day_of_settings.enabled`
(off by default).

- `InvitationData` gains an optional `dayOf?: { slug: string; photos: boolean }`,
  present only when the Jour J is enabled; `photos` is true while the upload window
  is open or the gallery is visible. It is filled by `to-invitation-data.ts` from
  `day_of_settings`, which anonymous visitors can read only when `enabled`.
- Maré Alta draws two call-to-action blocks from it ("Trouve ta place", "Vos
  souvenirs"), each linking through the next-intl `Link` to `/jourj/<slug>/ma-table`
  and `/jourj/<slug>/photos`. Without `weddingId` (demo) the buttons are inert.
  Their wording lives in `footer.*` slots because they have no editor tab of their own.
- Known limits, recorded rather than fixed here: the Jour J page is French only and
  unthemed; the invitation's RSVP is not copied into `guests`, so the finder works
  only for guests the couple registered from the dashboard.

### D6 — No new module id

The studio lists every `APP_MODULES` id; a new id needs four hand-synced TypeScript
lists, one row in `public.modules`, and the name catalogues in nine locales — and that
SQL row must be in production **before** the code, otherwise `grant_modules` ignores
the id and the webhook refunds the purchase as `modules_already_owned`. Nothing here
needs a new id: seating and photos are Jour J, and the jar uses the existing
`guestbook` id. Pricing is per plan (four free modules, then 5 € each, counted on
`modules.length`), so nothing is priced either.

### D7 — One CSS pipeline, written once

The three ports repeat the same steps. `landing/scripts/port-theme-css.mjs` (Phase 0)
runs them from a small per-theme JSON config, so a re-scope is reproducible and the
font substitution is no longer lost:

1. **Format** the source (the Château sheet is minified).
2. **Pre-process**: rename `main` rules to the column class (column themes), drop
   `@import tailwindcss`, `tw-animate-css`, shadcn (Maré Alta), and `@font-face`/link
   leftovers.
3. **Scope** with `scope-theme-css.mjs`, mapping asset URLs to `/themes/<id>/…` and
   `.png` to `.webp`.
4. **Post-process**: rewrite font families — including the `font:` shorthand, which
   is what the Château and Maré Alta sheets use — to `var(--font-xx-*), <original>`.
5. **Verify**: zero selectors outside the scope; zero custom properties used but
   never defined (`--font-*` excepted); every `url()` points at a file that exists;
   report the rules whose classes the markup never uses (informational).

The 12 / 5 / 3 stacked layers are scoped **as they are**: cascade order is the look,
and a hand clean-up would change it. Dead rules cost at most 9 KB on Maré Alta.

### D8 — Fonts

- **Château Royal** loads exactly what the designer loads — `Bodoni_Moda`,
  `Italiana`, `Pinyon_Script`, `Jost` — through `next/font`.
- **Maré Alta and Cabo Verde** keep the validated system stack (Didot, Avenir Next,
  Snell Roundhand, Georgia) first, so Apple devices render exactly what was approved,
  and add a `next/font` web face before the generic fallback (`Bodoni Moda` for
  Didot, `Jost` for Avenir Next, `Pinyon Script` for Snell Roundhand, `Cormorant
  Garamond` for Georgia/Times) so Windows and Android stop falling back to Arial.

Variable prefixes: `--font-ma-*`, `--font-cr-*`, `--font-cv-*`.

### D9 — Assets

`cwebp -q 82 -alpha_q 90 -m 6` for every PNG; MP4 and SVG untouched. Only assets the
final markup or stylesheet actually references are copied; the rest stay out (about
half of Cabo Verde's 52 PNG, the unused Château MP4, the jar and photo-background art
of Maré Alta until the jar exists). Each theme's `public/themes/<id>/` gets a
`cover.webp` made by `themes:shoot` from its own demo.

### D10 — Shared groundwork (Phase 0)

New files only, except the two noted. They exist so the three agents do not write the
same code three times.

| File | Role |
|---|---|
| `themes/reveal.tsx` | `Reveal` (client): scoped `IntersectionObserver` adding a configurable class once; everything visible under `prefers-reduced-motion`; `JsFlag` sets `data-js` on the theme root so content stays visible without JavaScript |
| `themes/scroll-to.tsx` | `ScrollToButton`: scoped `scrollIntoView`, honours reduced motion, no `href="#…"` |
| `themes/monogram.ts` | `couple.monogram`, else initials |
| `themes/date-range.ts` | locale-aware range for events spanning several days (`Intl.DateTimeFormat.formatRange`), and the dotted `30 · 04 · 2027` label |
| `themes/use-guest-rsvp.ts`, `themes/use-guest-playlist.ts` | submission, pending and error state, demo guard, Spotify search — extracted from ciao-amore **without editing it** |
| `themes/fixtures/other-wedding.ts` | the `minimal` and `heavy` datasets |
| `landing/scripts/port-theme-css.mjs` | D7 |
| `landing/scripts/theme-messages.mjs` | merges one theme's `Invitation.<camelId>` namespace into the nine catalogues under a lock, idempotent — three agents write the same files |
| `landing/src/lib/theme-checks.test.mjs` | D2: leaks and wiring |
| `landing/scripts/shoot-url.mjs` | screenshot of the designer's live reference, to compare at the same width |
| edit: `landing/src/components/invitation/themes/types.ts` | adds `dayOf` |
| edit: `landing/src/lib/to-invitation-data.ts` and the loader of the public invitation page | read `day_of_settings` (anonymous read is allowed only when `enabled`) and fill `dayOf` |
| edit: `landing/src/app/[locale]/invitation/demo/[themeId]/page.tsx`, `landing/scripts/shoot-theme.mjs` | fixture support |

### D11 — Parallel execution

Phase 0 runs first, alone. Then one agent per theme, **in the same working tree**, each
owning only `themes/<id>/`, `public/themes/<id>/` and its own messages namespace. They
share the dev server on :3010. `themes:sync` regenerates the registry from the folders
on disk, so concurrent runs converge. Nobody commits.

The integration phase, done once by the orchestrator after the three agents report:
`components/home/themes.ts` (one entry per theme), `themes:sync`, `themes:check`,
`npm test`, `tsc`, a production build, the screenshots at every width with all three
datasets, and the Obsidian notes.

## Theme A — Maré Alta (`mare-alta`)

**Manifest.** Name "Maré Alta" — "Broderie sur lin ivoire, pins parasols et glycines :
un mariage dans une villa de l'Atlantique." — accent `#4d5845`, scope `theme-mare-alta`,
fonts `--font-ma-*`, namespace `Invitation.mareAlta`.
`supports`: `countdown`, `timeline`, `dress-code`, `map`, `accommodation`, `transport`,
`menu`, `playlist`, `gift-list`, `rsvp`, `faq`.

**Root.** `<main class="theme-mare-alta …"><div class="ma-column">` … Sections in the
source's order: hero → countdown → map → timeline → dress-code → accommodation →
transport → menu → playlist → gift-list → rsvp → faq → Jour J blocks → footer.

| Section | Variable data | Theme voice (slot) | Notes |
|---|---|---|---|
| hero | names; date and `venue.city · venue.country` in the top line; `couple.monogram`; `copy.announcement` under the date | `hero.eyebrow`, `hero.cta` | foliage lights are an SVG tied to the 1024×1536 artwork; keep `xMidYMid slice` with `object-fit: cover` |
| countdown | `event.startsAt` | `countdown.eyebrow`, `countdown.title` (two lines), `countdown.note` | scratch cards are a client leaf; labels are ICU plurals; `aria-label` carries the value; the "GRATTEZ" text drawn in the canvas comes from the catalogue |
| map | `venue.name`, `venue.address`, `venue.mapsUrl` (else a search URL), `venue.image` over the embroidered scene, `copy.venueIntro`, stamp = city · country; calendar link built from names, `startsAt`, venue | `map.eyebrow` | alt text is generic, never the venue's name from the catalogue |
| timeline | `schedule` day 1 (time, title, description, `icon` → medallion), `copy.scheduleIntro`, extra `events[]` | `timeline.eyebrow`, `timeline.title` (two lines), `timeline.sign` | up to 8 cards; the number badge comes from the index |
| dress-code | `dressCode.title/body/note/image`, `colors` as swatches (replace the tag names) | `dress-code.eyebrow` | |
| accommodation | `stays[]`: name, `distance`, city/address as the detail line, `offer`, `bookingCode`, `url`, `phone`, `image`; `secondary` behind a toggle; `copy.staysIntro`; stamps = country, city, event span | `accommodation.eyebrow`, `accommodation.title` | |
| transport | `venue.access[]`: `mode` = label, first `details` line = title, the rest = text, `link` = whole card; icon cycles plane/car/sun/shell | `transport.eyebrow`, `transport.title`, `transport.intro` | the carpool board link is the couple's own `access[].link`, not the in-page carpool the designer removed |
| menu | `menu.sections` (title = kicker, items = dishes), `menu.note`, `menu.footer` lines | `menu.eyebrow` (venue name + wording), `menu.title` | crest monogram and footer line come from CSS custom properties |
| playlist | guest suggestions through Spotify search, `submitPlaylistSuggestions` | `playlist.eyebrow`, `playlist.title`, `playlist.intro` | discs spin permanently; no player |
| gift-list | `gifts.title/body/url/linkLabel`; renders nothing when `gifts` is absent | `gift-list.eyebrow` | |
| rsvp | D3; aside shows monogram, `copy.rsvpIntro`, deadline, the events' dates and names | `rsvp.title` (two lines) | the wisteria frame is a cover background: check it at 375 px and 1920 px |
| faq | `faq[]` plus `withChildrenPolicyFaq` | `faq.eyebrow`, `faq.title` | accordion per the README (buttons + `grid-template-rows`, `inert`, one open) |
| Jour J | `dayOf` | `footer.tableTitle`, `footer.photosTitle` + bodies | D5 |
| footer | names, date · city, `couple.portrait`, `copy.closing`, `copy.footerNote` | `footer.eyebrow`, `footer.top` | |

**Mock-up gates** (new UI the design lacks): where `events[]` (welcome dinner, brunch)
sit in the programme, and where `couple.portrait` sits in the footer.

**Reveal.** Sections start at `opacity: .01`. Replace the global observer with
`Reveal` (class `in-view`); under reduced motion and without JavaScript everything is
visible.

## Theme B — Château Royal (`chateau-royal`)

**Manifest.** Name "Château Royal" — "Un château de conte au fil d'un jour et d'une
nuit : espresso, ivoire et or discret." — accent `#583b32`, scope `theme-chateau-royal`,
fonts `--font-cr-*`, namespace `Invitation.chateauRoyal`.
`supports`: `timeline`, `menu`, `map`, `dress-code`, `faq`, `transport`, `rsvp`.
Final palette is the third `:root` layer (espresso: `--paper #f8f3e9`, `--gold #b89768`).

Order: hero → letter → venue → programme → menu → brunch → practical → rsvp → footer.

| Section | Variable data | Theme voice (slot) | Notes |
|---|---|---|---|
| hero | names; prelude = date range of the events (else `startsAt`) | none beyond the date | two scenes cross-fade day/night (theme art); windows light up at night |
| letter | `couple.monogram` (else initials) in the top line; date line derived; `copy.announcement` | `hero.letterIntro` ("Ont la joie de vous convier…"), `hero.letterTitle` (two lines) | default title is neutral ("Un mariage / pour se souvenir"); the demo sets `texts` to "Deux jours / pour se souvenir" |
| map | `venue.name · venue.address`, `venue.mapsUrl`, `venue.image` in the arch with a slow zoom | `map.eyebrow`, `map.title` | the place is revealed here and nowhere earlier — the designer's intent |
| timeline | `schedule` day 1; eyebrow derived from the wedding-day event | `timeline.title`, `timeline.intro` | scroll-driven progress bar and runner: one `requestAnimationFrame`-throttled listener scoped to the section; icons from `ScheduleIcon` (ceremony → rings, cocktail → glasses, dinner → table, party → music, none → star) |
| menu | `menu.sections` (title = course label, item title, item description as the small line), `menu.note` | `menu.eyebrow`, `menu.title` | crest = monogram; the three-state cake is decoration that plays while visible and is static under reduced motion |
| brunch | `dayTwo` (`dateLabel`, `title`, `timeLabel`, `body`, `note`, `image` over the banquet art) or the brunch event | `timeline.dayTwoLabel` ("Jour II") | |
| practical | `dressCode` item, `venue.access[]` items (carpool lives in `link`), `faq[]` items — three kinds of ornamented card, each carrying its own `data-editor-section` | `dress-code.eyebrow`, `faq.eyebrow` | |
| rsvp | D3; one presence question (the source's Saturday / Sunday pair cannot be stored) | `rsvp.eyebrow`, `rsvp.title` (two lines) | |
| footer | seal monogram, names, date range, `copy.closing`, `copy.footerNote`, `couple.portrait` | `footer.eyebrow` | portrait placement needs a mock-up |

Not drawn, because the design has no section for it: `countdown`, `accommodation`,
`playlist`, `gift-list`, `gallery`, `intro-video`. They go in *Reste à faire*.

## Theme C — Cabo Verde (`cabo-verde`)

**Manifest.** Name "Cabo Verde" — "Pieds dans le sable, eau turquoise et bateaux
colorés : un mariage tropical au bord de l'océan." — accent `#3aaeb5`, scope
`theme-cabo-verde`, fonts `--font-cv-*`, namespace `Invitation.caboVerde`.
`supports`: `countdown`, `map`, `timeline`, `dress-code`, `accommodation`, `playlist`,
`transport`, `rsvp`. Final look = the last `:root` layers (`--beach-*` over the forest
`--wine`/`--blue` set); the opening-doors overlay, `.postcard`, `.record` and the
calendar block never reach the markup and are ignored.

Order: hero → welcome → countdown → venue → itinerary → dress → stay → playlist →
travel notebook → rsvp → footer.

| Section | Variable data | Theme voice (slot) | Notes |
|---|---|---|---|
| hero | names; dotted date from `startsAt`; `venue.name · venue.city` | `hero.eyebrow`, `hero.cta` | three boats animate (theme art) |
| welcome | `copy.announcement` | `hero.welcomeEyebrow`, `hero.welcomeTitle` (two lines) | |
| countdown | `event.startsAt`; "until" + formatted day-month | `countdown.title` (two lines), `countdown.caption` | flip-digit animation re-triggers on change; three-digit days |
| venue | `venue.image` over the ceremony art, `venue.name` (title), city · country, `copy.venueIntro`, `venue.mapsUrl` | `map.eyebrow` | |
| itinerary | one **tab per enabled event, ordered by date** (label = formatted date), panel = `schedule` entries carrying that `event`; flow chips = event names; a single event hides the tabs | `timeline.eyebrow`, `timeline.title` | entries without `event` fall back by `day` (1 → wedding-day, 2 → brunch) |
| dress | `dressCode.title/body/colors/note` | `dress-code.eyebrow` | 0 to n swatches |
| stay | `stays[]` as in Theme A; `distance` is the badge | `accommodation.eyebrow`, `accommodation.title` | |
| playlist | the couple's `playlist` entries as "opening tracks" (no durations, no play button); guest suggestion through Spotify search and `submitPlaylistSuggestions` | `playlist.eyebrow`, `playlist.title`, `playlist.intro` | the guitar visual and beat rings stay animated as decoration |
| travel notebook | `venue.access[]`, four-column grid becomes n cards | `transport.eyebrow`, `transport.title` | |
| rsvp | D3 | `rsvp.eyebrow`, `rsvp.title` | fireworks art is decoration |
| footer | monogram, `date · city`, `couple.portrait` | `footer.note` | CSS-drawn words (`SÃO VICENTE · CABO VERDE`, `P&R`, the welcome stamp) read custom properties |

The sheet's JS adds `motion-title` to every `.section h2` and a per-section parallax
offset; both move into markup and a scoped client hook, off under reduced motion.
Not drawn: `menu`, `faq`, `gift-list`, `gallery`, `intro-video`.

## Guestbook goes live (separate spec and plan)

The jar of messages is the only designed feature with nothing behind it. It is its own
sub-project, run beside the themes and joined to Maré Alta at the end:

- table `guestbook_messages` (wedding, prompt, message, guest name, `hidden`, created
  at), insert-only public policy with server-side validation and size caps, owner
  read/moderate;
- a server action next to `submitRsvp`, anon client, rate-limited like the others;
- a dashboard screen to read, hide and export, plus the nav entry and sidebar label in
  nine locales; the existing editor form (title, text) becomes live, with the rotating
  questions editable;
- `InvitationData.guestbook` and the mapper case `module-config.ts` currently ignores;
- Maré Alta's jar section, last.

The migration is written and tested locally; it is **not** pushed without the user's
go-ahead.

## Verification (definition of done, per theme)

- `npm test` passes, including the no-leak test; `npx tsc --noEmit -p landing`;
  `npm run themes:check -w landing`; lint on the touched files; a production build.
- Screenshots with `themes:shoot` at 390, 768, 1024, 1440, 1728 and 1920 px, with the
  demo, `minimal` and `heavy` datasets; `scrollW === clientW` everywhere.
- French and German (long strings) at desktop and 375 px, and Arabic where direction
  matters; every screenshot is **looked at**, section by section.
- Compared against the designer's live reference for the demo dataset.
- No console error, no hydration mismatch; the countdown shows a real remaining time.
- `prefers-reduced-motion` honoured; content visible without JavaScript; every input
  has a `name`; no `async` section; nothing imported from `next-intl/server`; every
  section root carries `data-editor-section`; every slot is wired and changes the
  preview; nine locales for every new string, ICU plurals, locale passed to the date
  helpers.
- Editor preview: filling each tab changes its section.

## Risks

| Risk | Mitigation |
|---|---|
| Three agents write the nine catalogues and `themes/registry.ts` | `theme-messages.mjs` under a lock; `themes:sync` converges |
| The working tree already carries a large uncommitted editor and purchase change | agents touch only their own folders; nobody commits; `npm test` is run at integration |
| Layered CSS hides a rule that only matters in the final cascade | scope as is, never reorder; compare against the live reference |
| Font substitution lost on re-scope | it is a pipeline step now |
| `addable-modules.test.mjs` pins ciao-amore's exact list and `theme-supports.test.mjs` needs `themes:sync` | run both at integration |
| Cabo Verde's 82 MB of PNG | copy only referenced files, convert to WebP, report the size |
| Wisteria RSVP frame (Maré Alta) is a `cover` background on a variable-height section | check at 375 and 1920 px; fall back to `contain` plus a continuous ground if it crops |
| The Jour J page is French and unthemed | recorded in *Reste à faire*; not fixed here |

## Out of scope — *Reste à faire*

- Theming and translating the Jour J guest page.
- Gift bank details (IBAN/BIC) and venue coordinates as editor fields.
- Per-event attendance, e-mail, phone, arrival and lodging in the RSVP — a product
  change common to all themes.
- Drawing the modules each design omits (Theme A: gallery, intro video; Theme B:
  countdown, lodging, playlist, gift, gallery, intro video; Theme C: menu, FAQ, gift,
  gallery, intro video), each in its own style, each needing a mock-up.
- A personalised venue film for the Château.
- Refactoring ciao-amore onto the shared hooks.
- Folding the theme catalogues into the theme folders so a theme edits no existing
  file at all.
- `themes/README.md` "Known debt" is stale (`Invitation.belleRive` exists).

## Before implementation

Order: Phase 0 → three agents in parallel → integration; the guestbook runs beside
them. Mock-ups for the new UI elements are shown before they are fixed. No commit, no
`db push`, without an explicit go-ahead. Obsidian notes (`Features/`, `Conventions.md`,
`Architecture/Base de Données.md` for `guestbook_messages`) are written when the work
lands.
