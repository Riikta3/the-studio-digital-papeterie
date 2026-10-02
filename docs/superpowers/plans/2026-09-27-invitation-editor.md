# Invitation Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the nine scattered invitation screens with one full-screen editor at `/invitation`: a tab per section the couple owns, every variable part of the theme editable, and a live preview of their real theme.

**Architecture:** The dashboard holds the whole invitation as a draft and posts it, in database shape, to an iframe on a landing route. The iframe renders it with the same `assembleInvitationPage()` → `toInvitationData()` → theme `Root` chain as the public page. A theme declares its editable words ("slots") in its own folder, and the preview hands them to the editor. One "Enregistrer" button saves every changed part through one validated server action.

**Tech Stack:** Next.js 16 App Router (two apps), React 19, next-intl 4, Supabase (Postgres + RLS), Framer Motion, dnd-kit, Tailwind with `shared/tailwind-preset.js`, node `--test` with `--experimental-strip-types`.

**Spec:** `docs/superpowers/specs/2026-09-27-invitation-editor-design.md`

## Global Constraints

- **Never `git commit` or `git push`** — the user reviews and says when (memory `feedback-no-commit-without-ok`). No step in this plan commits.
- Do not apply migrations to any remote Supabase project. Test on the local stack only (`http://127.0.0.1:54321`).
- Discussion in French, code, comments and docs in English. Comment density and voice must match the surrounding code: explain *why*, name the bug a line prevents.
- A theme is a folder: adding one must not require editing an existing file.
- Theme sections take all content from props. No French literal in theme JSX.
- UI tokens come from `shared/tailwind-preset.js` (`studio-violet`, `studio-creme`, `studio-lavande`, `font-heading`…). Micro-animations with Framer Motion.
- Dashboard strings go in `dashboard/messages/<locale>.json` for all nine locales: fr, en, de, es, pt, it, ar, zh, ja.
- Links a couple types are saved only as `http(s)` URLs.
- Landing dev server runs on :3010, dashboard on :3003.

## Review Focus

1. **A section with no content in the preview.** The couple clears the last hotel: the tab must say the section is hidden because it is empty, not look broken. Pinned in Task 9 (`VisibilityNotice`).
2. **A couple on a theme without slots** (belle-rive, blanc-couture). The editor must list no slot fields and show no error. Pinned in Task 9 (`SlotFields` with an empty slot list).
3. **Every event disabled.** `assembleInvitationPage` returns null and the public page 404s. The preview must explain it instead of going blank. Pinned in Task 6 (preview empty state) and Task 3 (test).
4. **A `javascript:` or schemeless link** (`www.hotel.fr`). The first must be refused on save and dropped on render. The second must be fixed to `https://`. Pinned in Task 1 and Task 7 tests.
5. **A save that half fails** (the venue is written, then the FAQ write errors). The editor must keep the unsaved FAQ draft, show the error on the FAQ tab, and mark the venue as saved. Pinned in Task 7 (`SaveResult` shape) and Task 8 (store merge).

---

## File map

**shared/** (imported by both apps as `@shared/*`)
- `shared/lib/safe-url.ts` — `safeUrl`, `normaliseUserUrl`
- `shared/data/invitation-texts.ts` — contract text keys, `normaliseTexts`, `splitTexts`
- `shared/data/invitation-sections.ts` — `EDITOR_SECTION_IDS`, `EditorSectionId`
- `shared/types/invitation-rows.ts` — `InvitationRows`: the wire format between editor and preview
- `shared/types/editor-preview.ts` — the postMessage protocol
- `shared/lib/invitation-shared.test.mjs` — tests for the four modules above

**supabase/**
- `supabase/migrations/20260927120000_invitation_editor.sql`

**landing/**
- `src/lib/assemble-invitation-page.ts` (new) — rows → `InvitationPageData`, extracted from `getInvitationPage`
- `src/actions/invitation-page-actions.ts` — fetch → `assembleInvitationPage`
- `src/lib/to-invitation-data.ts` — texts, safe URLs, RSVP options, merged access, icons and photos, hotel address, gift title
- `src/lib/module-config.ts` — read the new config keys
- `src/lib/editor-origins.ts` (new) — dashboard origins allowed to drive the preview
- `src/app/[locale]/invitation/apercu/page.tsx` (new) — the preview route
- `src/components/invitation/editor-preview/EditorPreview.tsx` (new) — message bridge + render
- `src/components/invitation/editor-preview/editor-preview.css` (new) — hover/flash outlines
- `next.config.mjs` — `frame-ancestors` on the preview route
- `src/components/invitation/themes/types.ts` — `texts`, `ThemeEditorSlot`, `editorSlots`
- `src/components/invitation/themes/text.tsx` (new) — `slot()`, `<Lines>`
- `src/components/invitation/themes/ciao-amore/**` — isomorphic sections, anchors, slots, `editor.ts`
- `src/components/invitation/themes/belle-rive/**`, `blanc-couture/**` — isomorphic sections, anchors
- `messages/*.json` — ciao-amore's decorative words

**dashboard/**
- `src/components/editor/types.ts` — `EditorState`, `EditorBootstrap`, `EditorChanges`, `SaveResult`
- `src/components/editor/validate.ts` — pure validators per unit (tested)
- `src/components/editor/diff.ts` — `changedUnits`, `diffList` (tested)
- `src/components/editor/to-preview-rows.ts` — `EditorState` → `InvitationRows` (tested)
- `src/actions/invitation-editor-actions.ts` — `loadInvitationEditor`, `saveInvitationDraft`, `uploadEditorImage`
- `src/components/editor/EditorProvider.tsx` — draft store (context + reducer)
- `src/components/editor/InvitationEditor.tsx` — shell, shortcuts, unload guard
- `src/components/editor/EditorHeader.tsx`, `SectionTabs.tsx`, `PreviewPanel.tsx`
- `src/components/editor/fields/*` — controlled field components
- `src/components/editor/sections/*` — one form per section + `registry.ts`
- `src/app/[locale]/invitation/page.tsx`, `loading.tsx` — the editor route
- old routes → redirects; nav, home card, module cards → the editor

---

### Task 1: Shared contracts

**Files:**
- Create: `shared/lib/safe-url.ts`, `shared/data/invitation-texts.ts`, `shared/data/invitation-sections.ts`, `shared/types/invitation-rows.ts`, `shared/types/editor-preview.ts`
- Test: `shared/lib/invitation-shared.test.mjs` (picked up by the root `npm test` glob `shared/lib/*.test.mjs`)

**Interfaces — Produces:**

```ts
// shared/lib/safe-url.ts
export function safeUrl(value: unknown): string | undefined;          // http(s) only, else undefined
export function normaliseUserUrl(value: unknown): string | undefined; // "www.x.fr" → "https://www.x.fr"; refuses other schemes

// shared/data/invitation-texts.ts
export const CONTRACT_TEXT_KEYS: readonly ["copy.dateLabel","copy.dateSpelled","copy.scheduleIntro","copy.rsvpIntro","copy.rsvpNote","copy.footerNote","couple.monogram","dayTwo.dateLabel","dayTwo.timeLabel","dayTwo.note"];
export type ContractTextKey = (typeof CONTRACT_TEXT_KEYS)[number];
export const TEXT_KEY_PATTERN: RegExp;   // /^[a-z][a-zA-Z-]*\.[a-zA-Z]+$/
export const MAX_TEXT_LENGTH = 600;
export const MAX_TEXT_KEYS = 120;
export function normaliseTexts(value: unknown): Record<string, string>;
export function splitTexts(texts: Record<string, string>): {
  contract: Partial<Record<ContractTextKey, string>>;
  slots: Record<string, string>;
};

// shared/data/invitation-sections.ts
export const EDITOR_SECTION_IDS: readonly ["hero","countdown","intro-video","timeline","dress-code","rsvp","map","accommodation","transport","menu","gallery","gift-list","playlist","guestbook","video-guestbook","faq","footer"];
export type EditorSectionId = (typeof EDITOR_SECTION_IDS)[number];
export function isEditorSectionId(value: unknown): value is EditorSectionId;

// shared/types/invitation-rows.ts — database-shaped, snake_case like the rows themselves
export type InvitationRows = {
  site: { theme_id: string|null; modules: string[]|null; adults_only: boolean|null; languages: string[]|null;
          hero_kicker: string|null; announcement: string|null; closing_words: string|null;
          couple_photo_url: string|null; invitation_texts: unknown };
  names: { first_name: string|null; partner_name: string|null } | null;
  events: Array<{ id: string; key: string; name: string; date: string|null; time: string|null; address: string|null;
                  description: string|null; dress_code: string|null; position: number|null }>;
  schedule: Array<{ id: string; event_id: string; time: string; title: string; description: string|null;
                    position: number|null; icon: string|null; image_url: string|null }>;
  venue: { name: string; address: string|null; city: string|null; maps_url: string|null; waze_url: string|null;
           parking_info: string|null; access_info: string|null; transport_info: string|null; photo_url: string|null } | null;
  accommodations: Array<{ id: string; name: string; city: string|null; distance: string|null; phone: string|null;
                          booking_url: string|null; offer: string|null; photo_url: string|null;
                          address: string|null; secondary: boolean|null }>;
  faq: Array<{ id: string; question: string; answer: string; position: number|null }>;
  moduleConfigs: Array<{ module_id: string; position: number|null; config: unknown }>;
};

// shared/types/editor-preview.ts
export const EDITOR_MESSAGE_SOURCE = "studio-editor";
export type PreviewSlot = { key: string; defaultText: string; multiline: boolean };
export type EditorToPreviewMessage =
  | { source: "studio-editor"; type: "editor:render"; themeId: string|null; rows: InvitationRows }
  | { source: "studio-editor"; type: "editor:focus"; section: string };
export type PreviewToEditorMessage =
  | { source: "studio-editor"; type: "preview:ready" }
  | { source: "studio-editor"; type: "preview:rendered"; themeName: string; sections: string[]; supported: string[]; slots: PreviewSlot[] }
  | { source: "studio-editor"; type: "preview:select"; section: string };
export function isEditorToPreviewMessage(data: unknown): data is EditorToPreviewMessage;
export function isPreviewToEditorMessage(data: unknown): data is PreviewToEditorMessage;
```

- [ ] **Step 1: Write the failing tests** in `shared/lib/invitation-shared.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { safeUrl, normaliseUserUrl } from "./safe-url.ts";
import { normaliseTexts, splitTexts } from "../data/invitation-texts.ts";
import { isEditorSectionId } from "../data/invitation-sections.ts";
import { isEditorToPreviewMessage, isPreviewToEditorMessage } from "../types/editor-preview.ts";

test("safeUrl keeps http(s) and drops every other scheme", () => {
  assert.equal(safeUrl("https://maps.google.com/?q=x"), "https://maps.google.com/?q=x");
  assert.equal(safeUrl(" http://localhost:54321/a.webp "), "http://localhost:54321/a.webp");
  assert.equal(safeUrl("javascript:alert(1)"), undefined);
  assert.equal(safeUrl("data:text/html,x"), undefined);
  assert.equal(safeUrl("www.hotel.fr"), undefined);
  assert.equal(safeUrl(42), undefined);
});

test("normaliseUserUrl fixes a bare domain and refuses a script", () => {
  assert.equal(normaliseUserUrl("www.hotel.fr/chambres"), "https://www.hotel.fr/chambres");
  assert.equal(normaliseUserUrl("JavaScript:alert(1)"), undefined);
  assert.equal(normaliseUserUrl("mailto:a@b.fr"), undefined);
  assert.equal(normaliseUserUrl("pas un lien"), undefined);
  assert.equal(normaliseUserUrl(""), undefined);
});

test("normaliseTexts keeps well-formed keys and trimmed strings only", () => {
  assert.deepEqual(
    normaliseTexts({ "faq.title": "  Bon à savoir ", "copy.footerNote": "", bad: "x", "a.b": 3, "__proto__": "y" }),
    { "faq.title": "Bon à savoir" },
  );
  assert.deepEqual(normaliseTexts(["x"]), {});
  assert.deepEqual(normaliseTexts(null), {});
  assert.equal(normaliseTexts({ "faq.title": "x".repeat(900) })["faq.title"].length, 600);
  assert.equal(normaliseTexts({ "faq.title": "a\r\nb" })["faq.title"], "a\nb");
});

test("splitTexts separates contract copy from theme slots", () => {
  const { contract, slots } = splitTexts({ "copy.footerNote": "Merci", "faq.title": "FAQ", "couple.monogram": "A & E" });
  assert.deepEqual(contract, { "copy.footerNote": "Merci", "couple.monogram": "A & E" });
  assert.deepEqual(slots, { "faq.title": "FAQ" });
});

test("section ids and messages are recognised", () => {
  assert.equal(isEditorSectionId("gift-list"), true);
  assert.equal(isEditorSectionId("gifts"), false);
  assert.equal(isEditorToPreviewMessage({ source: "studio-editor", type: "editor:focus", section: "faq" }), true);
  assert.equal(isEditorToPreviewMessage({ source: "other", type: "editor:focus", section: "faq" }), false);
  assert.equal(isEditorToPreviewMessage({ source: "studio-editor", type: "editor:render", themeId: null }), false);
  assert.equal(isPreviewToEditorMessage({ source: "studio-editor", type: "preview:ready" }), true);
  assert.equal(isPreviewToEditorMessage({ source: "studio-editor", type: "preview:select", section: 3 }), false);
});
```

- [ ] **Step 2: Run to see it fail** — `npm test` → FAIL (modules missing).
- [ ] **Step 3: Implement the five modules** to the interfaces above. `isEditorToPreviewMessage` checks `source`, `type`, and for `editor:render` that `rows` is an object with array `events`/`schedule`/`accommodations`/`faq`/`moduleConfigs` and an object `site`; `isPreviewToEditorMessage` checks every field's type.
- [ ] **Step 4: Run to see it pass** — `npm test` → PASS.

---

### Task 2: Migration, and a local database to test against

**Files:**
- Create: `supabase/migrations/20260927120000_invitation_editor.sql`
- Modify: `shared/types/supabase.ts` (regenerated)

- [ ] **Step 1: Write the migration**:

```sql
-- settings.invitation_texts: the couple's own words for everything a theme prints
alter table public.settings
  add column if not exists invitation_texts jsonb not null default '{}'::jsonb;

do $$ begin
  alter table public.settings
    add constraint settings_invitation_texts_is_object
    check (jsonb_typeof(invitation_texts) = 'object');
exception when duplicate_object then null; end $$;

alter table public.schedule_entries
  add column if not exists icon text,
  add column if not exists image_url text;

do $$ begin
  alter table public.schedule_entries
    add constraint schedule_entries_icon_known
    check (icon is null or icon in ('ceremony','cocktail','dinner','party','brunch'));
exception when duplicate_object then null; end $$;

alter table public.accommodations
  add column if not exists address text,
  add column if not exists secondary boolean not null default false;

drop function if exists public.resolve_public_slug(text);

create function public.resolve_public_slug(p_slug text)
returns table (
  wedding_id uuid, theme_id text, modules text[], adults_only boolean, languages text[],
  hero_kicker text, announcement text, closing_words text, couple_photo_url text,
  invitation_texts jsonb
)
language plpgsql security definer set search_path = public
as $$
begin
  if p_slug is null or length(trim(p_slug)) = 0 then return; end if;
  return query
  select s.wedding_id, s.theme_id, s.modules, coalesce(st.adults_only, false), s.languages,
         st.hero_kicker, st.announcement, st.closing_words, st.couple_photo_url,
         coalesce(st.invitation_texts, '{}'::jsonb)
  from public.sites s
  left join public.settings st on st.wedding_id = s.wedding_id
  where s.slug = trim(p_slug) and s.status = 'published'
  limit 1;
end;
$$;

revoke all on function public.resolve_public_slug(text) from public;
grant execute on function public.resolve_public_slug(text) to anon, authenticated;
```

Keep the header comment in the house style: why a flat map, why `languages` is back (dropped by `20260912140000`), why the icon check exists.

- [ ] **Step 2: Start the local stack** — `open -a Docker`, wait for `docker info`, then `npx supabase start` from the repo root. Expected: API URL `http://127.0.0.1:54321`.
- [ ] **Step 3: Apply** — `npx supabase migration up` (local only). Expected: the new migration listed as applied.
- [ ] **Step 4: Verify the columns and the function** with psql against the local DB:
  `select column_name from information_schema.columns where table_name in ('settings','schedule_entries','accommodations') and column_name in ('invitation_texts','icon','image_url','address','secondary');` → 5 rows.
  `select * from resolve_public_slug('nope');` → 0 rows, no error.
- [ ] **Step 5: Regenerate types** — `npx supabase gen types typescript --local > shared/types/supabase.ts`.

---

### Task 3: Landing data layer — one assembly for the public page and the preview

**Files:**
- Create: `landing/src/lib/assemble-invitation-page.ts`
- Modify: `landing/src/actions/invitation-page-actions.ts`, `landing/src/lib/to-invitation-data.ts`, `landing/src/lib/module-config.ts`
- Create: `scripts/register-ts-aliases.mjs` (resolves `@/`, `@shared/` and extensionless imports for node tests)
- Test: `landing/src/lib/invitation-data.test.mjs`

**Interfaces:**
- Consumes: `InvitationRows`, `normaliseTexts`, `splitTexts`, `safeUrl` (Task 1).
- Produces:

```ts
// assemble-invitation-page.ts
export function assembleInvitationPage(weddingId: string, slug: string, rows: InvitationRows): InvitationPageData | null;
// InvitationPageData gains:
//   texts: Record<string, string>
//   programme[].entries[] gains icon?: string; image?: string
//   accommodations[] gains address?: string; secondary?: boolean
// ModuleContent gains:
//   rsvp: { allowPartner?: boolean; collectMessage?: boolean; dietaryOptions?: string[] }
//   giftList.title?: string
```

`toInvitationData` changes (all covered by tests):
- `couple.monogram` = `texts["couple.monogram"]` ?? initials; `copy.dateLabel`, `copy.dateSpelled` = override ?? derived; `copy.scheduleIntro`, `copy.rsvpIntro`, `copy.footerNote` = override; `copy.rsvpNote` = override ?? legacy label sentence.
- `dayTwo.dateLabel` / `timeLabel` = override ?? derived; `dayTwo.note` = override.
- `texts` = the slot keys only, `undefined` when there are none.
- schedule `icon` = the stored icon if it is one of `SCHEDULE_ICONS`, else `iconForTitle`; `image` = `safeUrl(image)`.
- every `href` and image goes through `safeUrl`.
- `venue.access` = the venue's access rows **followed by** the transport module's modes and carpooling (previously the transport module was dropped whenever the venue had any access text).
- stays carry `address` and `secondary`.
- `gifts.title` from the module; `rsvp.allowPartner` / `collectMessage` default to `true`, `dietaryOptions` from the module (absent → no select, as today).

- [ ] **Step 1: Write the alias loader** `scripts/register-ts-aliases.mjs` using `module.register` with a `resolve` hook: `@/x` → `<app>/src/x` (app taken from the importing file's path: `landing/` or `dashboard/`), `@shared/x` → `shared/x`, and a relative or aliased specifier without an extension → try `.ts`, `.tsx`, `/index.ts`.
- [ ] **Step 2: Write the failing tests** in `landing/src/lib/invitation-data.test.mjs` (run with `node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs --test landing/src/lib/invitation-data.test.mjs`). Build a `baseRows()` fixture (one enabled `wedding-day` event on `2027-06-12` at `"17h00"`, one entry, a venue, a hotel, one FAQ row, no module configs) and assert:

```js
test("no enabled event means no page", () => {
  assert.equal(assembleInvitationPage("w", "s", { ...baseRows(), events: [] }), null);
});
test("contract overrides replace derived copy, slots reach the theme", () => {
  const rows = baseRows();
  rows.site.invitation_texts = { "copy.dateLabel": "12 juin 2027", "couple.monogram": "A · E", "faq.title": "FAQ" };
  const data = toInvitationData(assembleInvitationPage("w", "s", rows));
  assert.equal(data.copy.dateLabel, "12 juin 2027");
  assert.equal(data.couple.monogram, "A · E");
  assert.deepEqual(data.texts, { "faq.title": "FAQ" });
});
test("without overrides the derived labels stay", () => {
  const data = toInvitationData(assembleInvitationPage("w", "s", baseRows()));
  assert.equal(data.copy.dateLabel, "12 · 06 · 2027");
  assert.equal(data.texts, undefined);
});
test("a stored icon wins over the title guess; unknown icons fall back", () => { /* icon "party" on "Cérémonie" → party; icon "rocket" → ceremony */ });
test("unsafe links never reach a theme", () => { /* maps_url "javascript:x" → venue.mapsUrl undefined; booking_url https kept */ });
test("transport modes are added after the venue's own access", () => { /* venue parking_info + transport option → both modes, venue first */ });
test("RSVP options come from the module, defaulting to open", () => { /* no config → allowPartner true, collectMessage true, dietaryOptions undefined; config {allow_partner:false,dietary_options:["Végétarien"]} → false + list */ });
test("hotels carry their address and the more-options flag", () => { /* address, secondary true */ });
test("day two takes its overrides", () => { /* brunch event + dayTwo.note → data.dayTwo.note */ });
```

Write every elided body out in full when implementing — the comment says exactly what it asserts.
- [ ] **Step 3: Run** → FAIL.
- [ ] **Step 4: Extract `assembleInvitationPage`** from `getInvitationPage` (the mapping half, unchanged in behaviour), add the new fields, and make `getInvitationPage` = resolve slug → the seven reads (now selecting `icon, image_url` and `address, secondary`) → build `InvitationRows` → `assembleInvitationPage`. Then apply the `toInvitationData` and `module-config` changes.
- [ ] **Step 5: Run** → PASS. Then `cd landing && npx tsc --noEmit` → clean.

---

### Task 4: ciao-amore — isomorphic, anchored, every word editable

**Files:**
- Modify: `landing/src/components/invitation/themes/types.ts` (add `texts?: Readonly<Record<string, string>>` to `InvitationData`; add `ThemeEditorSlot` and `editorSlots?: readonly ThemeEditorSlot[]` to `ThemeManifest`)
- Create: `landing/src/components/invitation/themes/text.tsx`
- Create: `landing/src/components/invitation/themes/ciao-amore/editor.ts`
- Modify: `ciao-amore/theme.config.ts`, `CiaoAmoreRoot.tsx`, every file in `ciao-amore/sections/`
- Modify: `landing/messages/*.json` (9) — `Invitation.ciaoAmore.schedule.ribbon`, `.stamp`, `Invitation.ciaoAmore.stays.keyTag`

**Interfaces — Produces:**

```ts
// types.ts
export type ThemeEditorSlot = {
  /** `<sectionId>.<role>` — where the couple's version is stored. */
  key: string;
  /** Catalogue keys whose messages, joined by "\n", are the default text. */
  messages: readonly string[];
  /** A title printed on two lines: the value may hold a line break. */
  multiline?: boolean;
};

// text.tsx
export function slot(data: InvitationData, key: string): string | undefined;
export function Lines({ text }: { text: string }): ReactElement; // "\n" → <br />
```

ciao-amore slots (`editor.ts`):

| key | messages (under `Invitation.ciaoAmore.`) | multiline |
|---|---|---|
| `hero.cta` | `hero.discoverCta` | |
| `countdown.eyebrow` | `countdown.eyebrow` | |
| `countdown.title` | `countdown.titleLine1`, `countdown.titleLine2` | ✓ |
| `timeline.ribbon` | `schedule.ribbon` ("Amore · Limoni · Dolce Vita") | |
| `timeline.stamp` | `schedule.stamp` ("ITALIA") | |
| `timeline.introEyebrow` | `schedule.introEyebrow` | |
| `timeline.introTitle` | `schedule.introTitle` | |
| `timeline.dayOneEyebrow` | `schedule.dayOneEyebrow` | |
| `timeline.dayOneTitle` | `schedule.dayOneTitle` | |
| `dress-code.eyebrow` | `dressCode.eyebrow` | |
| `map.eyebrow` | `venue.eyebrow` | |
| `accommodation.title` | `stays.title` | |
| `accommodation.tag` | `stays.keyTag` ("CAMERA 01") | |
| `playlist.eyebrow` | `playlist.eyebrow` | |
| `playlist.title` | `playlist.titleLine1`, `playlist.titleLine2` | ✓ |
| `faq.eyebrow` | `faq.eyebrow` | |
| `faq.title` | `faq.titleLine1`, `faq.titleLine2` | ✓ |
| `rsvp.title` | `rsvp.titleLine1`, `rsvp.titleLine2` | ✓ |

- [ ] **Step 1:** Convert the five async sections (`HeroSection`, `ScheduleSection`, `VenueSection`, `DressCodeSection`, `FooterSection`): `export async function` → `export function`, `await getTranslations(ns)` → `useTranslations(ns)` (from `next-intl`), `await getLocale()` → `useLocale()`.
- [ ] **Step 2:** Put `data-editor-section="<id>"` on each section's root element: hero `hero`, countdown `countdown`, ribbon + arch + timeline + brunch card `timeline`, dress `dress-code`, venue `map`, stays `accommodation`, playlist `playlist`, faq `faq`, rsvp `rsvp`, footer `footer`. The ribbon, arch and timeline are siblings: all three carry `timeline`, and the preview reports each id once.
- [ ] **Step 3:** Wire every slot: `slot(data, key) ?? t(...)`, and multi-line titles through `<Lines>`. The ribbon splits the value on `·` and `,` into the `<span>`s with `<i>✦</i>` between them. The stamp keeps its year line. The hotel key keeps its city line and replaces `CAMERA 01`. Add the three new messages to all nine locale files: the Italian words are identical in every locale, and `keyTag` is "CAMERA 01" everywhere.
- [ ] **Step 4:** `editor.ts` exports `ciaoAmoreEditorSlots` per the table. The manifest sets `editorSlots: ciaoAmoreEditorSlots`.
- [ ] **Step 5: Verify** — `cd landing && npx tsc --noEmit` clean. `npm run themes:check` clean. With the dev server on :3010, `/fr/invitation/demo/ciao-amore` renders identically to before (`npm run themes:shoot -- ciao-amore 390`, then compare by eye with the previous capture).

---

### Task 5: belle-rive and blanc-couture — isomorphic and anchored

**Files:**
- Modify: `belle-rive/sections/{ActivitiesSection,DressCodeSection,GiftsSection,HeroSection,ProgramSection,VenueSection,StaysSection}.tsx` (async → hooks), every section root in both themes (anchors)

Anchor ids — belle-rive: hero `hero`, countdown `countdown`, venue `map`, program + activities `timeline`, dress `dress-code`, stays `accommodation`, playlist `playlist`, carpool `transport`, faq `faq`, rsvp `rsvp`, gifts `gift-list`, finale `footer`. blanc-couture: hero `hero`, save `countdown`, venue + access `map`, programme `timeline`, dress `dress-code`, stays `accommodation`, carpool `transport`, playlist `playlist`, faq `faq`, rsvp `rsvp`, footer `footer`.

- [ ] **Step 1:** Convert the seven async belle-rive sections exactly as in Task 4 Step 1.
- [ ] **Step 2:** Add the anchors.
- [ ] **Step 3: Verify** — `npx tsc --noEmit` clean. Both demos render as before (`themes:shoot` at 390, compared by eye).

---

### Task 6: The preview route

**Files:**
- Create: `landing/src/lib/editor-origins.ts`, `landing/src/app/[locale]/invitation/apercu/page.tsx`, `landing/src/components/invitation/editor-preview/EditorPreview.tsx`, `landing/src/components/invitation/editor-preview/editor-preview.css`
- Modify: `landing/next.config.mjs`

**Interfaces:**
- Consumes: protocol + rows (Task 1), `assembleInvitationPage` (Task 3), manifests with `editorSlots` (Task 4).
- Produces: `editorOrigins(): string[]` — the exact origins allowed (`NEXT_PUBLIC_DASHBOARD_URL`'s origin, `http://localhost:3003`, and each entry of the optional comma-separated `EDITOR_ALLOWED_ORIGINS`).

Behaviour of `EditorPreview` (client):
1. On mount, listen to `message`. Post `{ source, type: "preview:ready" }` to `window.parent`, target `*`, because the message carries nothing.
2. Ignore any message whose `event.origin` is not in the allowed list, or that fails `isEditorToPreviewMessage`. Remember the origin of the last accepted message, and post every reply there.
3. `editor:render`: keep `{ themeId, rows }`. Render `getTheme(themeId) ?? THEMES[0]`. Build `page = assembleInvitationPage("preview", "preview", rows)`. When it is null, show a centred message in the studio style: "Activez au moins un événement dans Programme pour afficher votre faire-part". Otherwise render `<Root data={{ ...toInvitationData(page), weddingId: undefined }} />`.
4. After each render (effect on the data), collect the unique `data-editor-section` values in DOM order. Resolve each `editorSlots` default with the root `useTranslations()`, joining messages with `"\n"`. Post `preview:rendered` with `themeName`, `sections`, `supported: ["hero", ...theme.supports, "footer"]` and `slots`.
5. `editor:focus`: `scrollIntoView({ behavior: "smooth", block: "start" })` on the first matching element. Set `data-editor-flash` on every matching element for 1.2 s.
6. Hover: on pointer over, mark the closest `[data-editor-section]` with `data-editor-hover`. Click in capture phase, when the target is not inside `a, button, input, select, textarea, label, summary, [role=button]`: post `preview:select`.
7. `prefers-reduced-motion`: scroll with `behavior: "auto"`.

`page.tsx`: `metadata = { title: "Aperçu", robots: { index: false, follow: false } }`. It renders `<EditorPreview allowedOrigins={editorOrigins()} />`. `next.config.mjs` adds `headers()` for `/:locale/invitation/apercu` with `Content-Security-Policy: frame-ancestors 'self' <origins>`.

- [ ] **Step 1: Implement** the four files and the header.
- [ ] **Step 2: Verify by hand** — open `http://localhost:3010/fr/invitation/apercu` directly: it shows the "waiting for the editor" state. `curl -sI` shows the `frame-ancestors` header. From the browser console on a page at `http://localhost:3003`, an iframe of it receives a render message and draws the theme (checked end to end in Task 13).

---

### Task 7: Dashboard data — load, validate, save

**Files:**
- Create: `dashboard/src/components/editor/types.ts`, `dashboard/src/components/editor/validate.ts`, `dashboard/src/components/editor/diff.ts`, `dashboard/src/components/editor/to-preview-rows.ts`, `dashboard/src/actions/invitation-editor-actions.ts`
- Test: `dashboard/src/components/editor/editor.test.mjs`

**Interfaces — Produces:**

```ts
// types.ts
export type EditorEvent = { id: string; key: EventKey; name: string; date: string; time: string; address: string;
                            description: string; dressCode: string; enabled: boolean };
export type EditorScheduleEntry = { id: string; eventId: string; time: string; title: string; description: string;
                                    icon: ScheduleIconKey | ""; imageUrl: string };
export type EditorVenue = { name: string; address: string; city: string; mapsUrl: string; wazeUrl: string;
                            parkingInfo: string; accessInfo: string; transportInfo: string; photoUrl: string };
export type EditorAccommodation = { id: string; name: string; city: string; distance: string; address: string;
                                    phone: string; bookingUrl: string; offer: string; photoUrl: string; secondary: boolean };
export type EditorFaqEntry = { id: string; question: string; answer: string; published: boolean };
export type ModuleConfig = Record<string, unknown>;
export type EditorState = {
  names: { partner1: string; partner2: string };
  settings: { heroKicker: string; announcement: string; closingWords: string; couplePhotoUrl: string; adultsOnly: boolean };
  texts: Record<string, string>;
  events: EditorEvent[];              // array order = position
  schedule: EditorScheduleEntry[];    // array order = position within its event
  venue: EditorVenue;
  accommodations: EditorAccommodation[];
  faq: EditorFaqEntry[];
  modules: Record<string, ModuleConfig>;   // owned modules only
};
export type EditorUnit = Exclude<keyof EditorState, "modules"> | `modules.${string}`;
export type EditorChanges = Partial<Omit<EditorState, "modules">> & { modules?: Record<string, ModuleConfig> };
export type EditorMeta = { themeId: string|null; ownedModules: string[]; languages: string[]; slug: string|null;
                           published: boolean; landingUrl: string; legacy: { faq: number } };
export type EditorBootstrap = { state: EditorState; meta: EditorMeta };
export type SaveResult =
  | { ok: true; state: EditorState }
  | { ok: false; state: EditorState; errors: Partial<Record<EditorUnit, string>> };
export const NEW_ID_PREFIX = "new_";   // client-made ids; the server replaces them

// validate.ts — pure; each returns the cleaned value or throws EditorValidationError(message in French)
export class EditorValidationError extends Error {}
export function cleanNames(v: unknown): EditorState["names"];
export function cleanSettings(v: unknown): EditorState["settings"];
export function cleanTexts(v: unknown): Record<string, string>;          // normaliseTexts
export function cleanEvents(v: unknown): EditorEvent[];
export function cleanSchedule(v: unknown, eventIds: Set<string>): EditorScheduleEntry[];
export function cleanVenue(v: unknown): EditorVenue;
export function cleanAccommodations(v: unknown): EditorAccommodation[];
export function cleanFaq(v: unknown): EditorFaqEntry[];
export function cleanModuleConfig(moduleId: string, v: unknown, previous: ModuleConfig): ModuleConfig;

// diff.ts
export function changedUnits(saved: EditorState, draft: EditorState): EditorChanges;
export function diffList<T extends { id: string }>(before: T[], after: T[]): {
  inserted: T[]; updated: T[]; deletedIds: string[]; order: string[];
};

// to-preview-rows.ts
export function toPreviewRows(state: EditorState, meta: EditorMeta): InvitationRows;

// invitation-editor-actions.ts ("use server")
export async function loadInvitationEditor(): Promise<EditorBootstrap>;
export async function saveInvitationDraft(changes: EditorChanges): Promise<SaveResult>;
export async function uploadEditorImage(formData: FormData):
  Promise<{ success: true; url: string } | { success: false; error: string }>;   // formData.folder ∈ EDITOR_IMAGE_FOLDERS
```

Validation rules: names 1–60 chars, required. Free text ≤ 2 000 chars, titles ≤ 160. Dates `YYYY-MM-DD` or empty. Times ≤ 20 chars. Event `key` must be in `EVENT_KEYS`. Icons must be in the five `SCHEDULE_ICONS`, or empty. Every URL goes through `normaliseUserUrl`: a typed URL that cannot be normalised throws "Le lien « … » n'est pas une adresse web valide.". Colours use the CSS colour pattern from `landing/src/lib/module-config.ts`, at most 6. Lists are capped: events 8, moments 40, hotels 30, FAQ 40, transport modes 10, menu sections 12 × 30 dishes, gallery 12, dietary options 15.

`cleanModuleConfig` accepts only the keys the editor writes for that module and **merges them onto `previous`**, so legacy keys it does not own survive:

| module | keys |
|---|---|
| `dress-code` | `title`, `subtitle`, `mode`, `description`, `description_men`, `description_women`, `colors`, `imageUrl`, `note` |
| `rsvp` | `rsvp_deadline_iso`, `rsvp_deadline` (French label derived from the ISO day), `allow_partner`, `collect_message`, `dietary_options` |
| `map` | `description` |
| `intro-video` | `title`, `subtitle`, `description`, `videoUrl`, `videoType` |
| `gift-list` | `title`, `description`, `gift_list_url`, `gift_list_label` |
| `playlist`, `accommodation` | `description` |
| `transport` | `options[{ id, iconType, title, description }]`, `carpoolUrl`, `carpoolLinkLabel`, `carpoolDescription` |
| `menu` | `sections[{ id, title, items[{ title, description }] }]`, `dietaryNote`, `footer[]` |
| `gallery` | `images[]` |
| `guestbook`, `video-guestbook` | `title`, `description` |
| `faq` | `questions` (only ever set to `[]` by the legacy "reprendre" action) |
| `countdown`, `timeline` | nothing — throws if sent |

`saveInvitationDraft` writes, in this order, only the units present in `changes`, each in its own `try`:
1. `names` → `profiles` (the user's own row). `settings` + `texts` → one `settings` update.
2. `events` then `schedule`. Events are diffed; new ids are mapped to real ids, and those ids are rewritten inside the schedule before it is diffed. Deleting an event cascades to its moments.
3. `venue` → upsert on `wedding_id`. `accommodations`, `faq` → diff (insert, update, delete, then positions).
4. `modules.<id>` → only for ids in `sites.modules`; update `site_modules.config`, or insert the row at `APP_MODULES` default order.

It then reloads the full state with the loader and returns `{ ok, state, errors }`. `loadInvitationEditor` reads everything once (profile, settings, site, events, schedule, venue, hotels, FAQ, `site_modules`) and never throws for a missing optional row.

- [ ] **Step 1: Write the failing tests** in `editor.test.mjs` (run with the alias loader):

```js
test("changedUnits reports only what differs, module by module", () => {
  const saved = fixtureState(); const draft = structuredClone(saved);
  draft.faq[0].answer = "Oui"; draft.modules["gift-list"] = { title: "Merci" };
  assert.deepEqual(Object.keys(changedUnits(saved, draft)).sort(), ["faq", "modules"]);
  assert.deepEqual(Object.keys(changedUnits(saved, draft).modules), ["gift-list"]);
});
test("diffList sorts rows into inserts, updates, deletes and order", () => {
  const r = diffList([{id:"a",v:1},{id:"b",v:1}], [{id:"b",v:2},{id:"new_1",v:0}]);
  assert.deepEqual(r.inserted.map(x=>x.id), ["new_1"]);
  assert.deepEqual(r.updated.map(x=>x.id), ["b"]);
  assert.deepEqual(r.deletedIds, ["a"]);
  assert.deepEqual(r.order, ["b","new_1"]);
});
test("cleanVenue fixes a bare domain and refuses a script link", () => {
  assert.equal(cleanVenue({ ...emptyVenue(), mapsUrl: "maps.google.com/?q=x" }).mapsUrl, "https://maps.google.com/?q=x");
  assert.throws(() => cleanVenue({ ...emptyVenue(), wazeUrl: "javascript:alert(1)" }), EditorValidationError);
});
test("cleanSchedule refuses a moment pointing at another wedding's event", () => {
  assert.throws(() => cleanSchedule([{ ...entry(), eventId: "x" }], new Set(["e1"])), EditorValidationError);
});
test("cleanModuleConfig keeps legacy keys it does not own", () => {
  const out = cleanModuleConfig("map", { description: "Au bout de l'allée" }, { name: "Ancien", description: "x" });
  assert.deepEqual(out, { name: "Ancien", description: "Au bout de l'allée" });
});
test("cleanModuleConfig derives the RSVP label from the ISO day", () => {
  assert.equal(cleanModuleConfig("rsvp", { rsvp_deadline_iso: "2027-04-01" }, {}).rsvp_deadline, "1er avril 2027");
});
test("toPreviewRows hides disabled events, unpublished questions and positions rows", () => { /* one disabled event, one unpublished faq → absent; positions 1..n */ });
test("names are required", () => { assert.throws(() => cleanNames({ partner1: " ", partner2: "Léo" }), EditorValidationError); });
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** `types.ts`, `validate.ts`, `diff.ts`, `to-preview-rows.ts`. **Step 4: Run** → PASS.
- [ ] **Step 5: Implement the server actions** on top. `uploadEditorImage` reuses the `venue` bucket rules from `venue-actions.ts` (JPEG/PNG/WebP, 8 MB), with the folder taken from an allowlist: `venue`, `accommodations`, `couple`, `dress-code`, `schedule`, `gifts`. Intro video and gallery keep their existing upload actions. `npx tsc --noEmit` in `dashboard` → clean.

---

### Task 8: The editor shell — draft store, header, tabs, preview bridge

**Files:**
- Create: `dashboard/src/components/editor/EditorProvider.tsx`, `InvitationEditor.tsx`, `EditorHeader.tsx`, `SectionTabs.tsx`, `PreviewPanel.tsx`, `sections/registry.ts`
- Create: `dashboard/src/app/[locale]/invitation/page.tsx`, `loading.tsx`
- Modify: `dashboard/src/components/dashboard/DashboardLayout.tsx` (no sidebar on `/invitation`), `dashboard/next.config.ts` (landing origin in `frame-src`)

**Interfaces — Produces** (every section form consumes these):

```ts
// EditorProvider.tsx
export function EditorProvider(props: { bootstrap: EditorBootstrap; initialSection: EditorSectionId; children: ReactNode }): ReactElement;
export function useEditor(): {
  draft: EditorState; saved: EditorState; meta: EditorMeta;
  isDirty: boolean; dirtySections: ReadonlySet<EditorSectionId>;
  status: "idle" | "saving"; errors: Partial<Record<EditorUnit, string>>;
  activeSection: EditorSectionId; setActiveSection(id: EditorSectionId): void;
  preview: { ready: boolean; themeName: string | null; sections: string[]; supported: string[]; slots: PreviewSlot[] };
  setPreviewInfo(info: Omit<PreviewToEditorMessage & { type: "preview:rendered" }, "source" | "type">): void;
  update<K extends keyof EditorState>(unit: K, next: EditorState[K] | ((prev: EditorState[K]) => EditorState[K])): void;
  updateModule(moduleId: string, next: ModuleConfig | ((prev: ModuleConfig) => ModuleConfig)): void;
  setText(key: string, value: string): void;   // empty → key removed
  save(): Promise<void>; discard(): void;
  sections: EditorSectionId[];                  // tabs, in preview order
};
export function newId(): string;                // `${NEW_ID_PREFIX}${crypto.randomUUID()}`
```

- `update*` marks `activeSection` dirty. `save()` sends `changedUnits(saved, draft)`. On `ok`, it sets `saved = draft = state`, clears the dirty sections and toasts success. On a partial failure, `saved = state`, the draft keeps the failed units, `errors` is set and an error toast is shown (Review Focus 5).
- Tab order: hero first, footer last. Owned modules in between, sorted by their index in `preview.sections`; those absent from the preview follow, in `APP_MODULES` default order.
- `PreviewPanel` owns the iframe (`${meta.landingUrl}/${previewLocale}/invitation/apercu`). It accepts messages only from that origin. On `preview:ready` it sends a render; on each draft change it sends one throttled 120 ms after the last; on `activeSection` change it sends `editor:focus`; on `preview:select` it calls `setActiveSection`. Device toggle: phone (390 wide, framed) or desktop (1280 wide, scaled to fit). Below `lg` the panel is a full-screen sheet opened by a floating "Aperçu" button; the iframe stays mounted.
- `EditorHeader` row 1: back to `/` (asks first when dirty), "Mon faire-part" + theme name, a language select when `meta.languages.length > 1`, the device toggle, a live save status (`aria-live="polite"`), Annuler, Enregistrer (disabled when clean or saving; ⌘/Ctrl+S), and "Voir" (opens the public URL, disabled when unpublished). Row 2: `SectionTabs`.
- `SectionTabs`: `role="tablist"`, arrow keys, horizontal scroll with edge fades and chevrons, active underline animated with `layoutId`. Badges: unsaved (amber dot), error (red dot), not visible (EyeOff). The last item, "+ Ajouter un module", links to `/modules`.
- The selected section lives in `?section=` and is updated with `window.history.replaceState`.
- `InvitationEditor` renders the provider, header, the active section's form (from `registry.ts`, falling back to a "section inconnue" guard), the preview panel, and a `beforeunload` guard while dirty.

- [ ] **Step 1: Implement**, with the section registry pointing at placeholder forms that render the section title (replaced in Tasks 9–11).
- [ ] **Step 2: Verify** — `npx tsc --noEmit` clean. With both dev servers up (dashboard started with `NEXT_PUBLIC_LANDING_URL=http://localhost:3010`), `/fr/invitation` shows the header and tabs, the preview draws the theme, clicking a tab scrolls the preview, clicking a preview section switches the tab.

---

### Task 9: Field kit and the always-on forms

**Files:**
- Create: `dashboard/src/components/editor/fields/{FieldGroup,TextField,ToggleField,DateField,ImageField,ListEditor,ColorPaletteField,SlotFields,VisibilityNotice,SectionIntro}.tsx`
- Create: `dashboard/src/components/editor/sections/{HeroForm,CountdownForm,FooterForm}.tsx`

**Field kit contract:**
- `TextField({ label, value, onChange, placeholder?, hint?, multiline?, rows?, maxLength?, type? })` — controlled, with a character count once past 80 % of `maxLength`.
- `ToggleField({ label, description?, checked, onChange })` on `@shared/components/ui/switch`.
- `DateField({ label, value /* YYYY-MM-DD */, onChange })` on `@/components/ui/date-picker`.
- `ImageField({ label, value, onChange, folder, aspect? })` = `PhotoPicker` + `uploadEditorImage`.
- `ListEditor<T extends { id: string }>({ items, onChange, renderItem, newItem, addLabel, max?, emptyLabel })` — dnd-kit vertical sort with drag handle, delete with a confirm when the row has content, add button, animated insert/remove (Framer `AnimatePresence`).
- `ColorPaletteField({ value: string[], onChange, max = 6 })` — native colour inputs + hex text.
- `SlotFields({ section })` — the theme's slots for `section` from `preview.slots`, each a `TextField` with its default as placeholder, a line-break-aware textarea when `multiline`, and a reset button when overridden. It renders nothing when the theme has no slot for the section (Review Focus 2), and a two-line skeleton until the preview has reported.
- `VisibilityNotice({ section, emptyHint })` — when the preview has reported and `section` is absent from it: "not drawn by your theme" when the theme does not support it, else the section's `emptyHint` (Review Focus 1).
- `SectionIntro({ section })` — the section name, a one-line description, and the notice.

Forms — every field from the spec's inventory for these tabs:
- `HeroForm`: first names (`names`); kicker, announcement (`settings`); wedding date & ceremony time (the `wedding-day` event, created as a new row if missing); date label (`copy.dateLabel`, placeholder = derived dotted date); monogram (`couple.monogram`, placeholder = initials); venue name & city (`venue`); slots `hero.*`.
- `CountdownForm`: wedding date & time (same binding as hero), `copy.dateSpelled` (placeholder = derived weekday label), slots `countdown.*`.
- `FooterForm`: closing words, footer note (`copy.footerNote`), couple photo (`ImageField` folder `couple`), slots `footer.*`.

- [ ] **Step 1: Implement the kit, then the three forms.**
- [ ] **Step 2: Verify** — typing in the kicker changes the preview hero within ~150 ms. Clearing a slot restores the theme's default text in the preview. Saving and reloading keeps the values. `npx tsc --noEmit` clean.

---

### Task 10: Content forms — programme, venue, hotels, FAQ

**Files:**
- Create: `dashboard/src/components/editor/sections/{TimelineForm,VenueForm,StaysForm,FaqForm}.tsx`

- `TimelineForm`: `copy.scheduleIntro`; slots `timeline.*`; events as cards (name, enabled toggle, date, time, address, description, dress code line; add one of the missing `EVENT_KEYS`; delete with confirm — "les réponses RSVP à cet événement seront supprimées"). Each card holds its moments in a `ListEditor` (time, title, description, icon select with "Automatique" + the five moments, photo `ImageField` folder `schedule`). The `brunch` card adds the day-two overrides `dayTwo.dateLabel`, `dayTwo.timeLabel`, `dayTwo.note`.
- `VenueForm`: name, city, address (multi-line), Maps link, Waze link, photo (folder `venue`), presentation (`modules.map.description`, shown only when `map` is owned), transports / parking / access (multi-line, one line per item), slots `map.*`.
- `StaysForm`: intro (`modules.accommodation.description`), slots `accommodation.*`, hotels in a `ListEditor` (name, city, distance, address, link, offer, phone, photo folder `accommodations`, "dans « plus d'options »" toggle).
- `FaqForm`: slots `faq.*`, questions in a `ListEditor` (question, answer, published toggle); a read-only card for the derived children question with a button that opens the RSVP tab. When `meta.legacy.faq > 0`, a notice with "Reprendre ces questions", which appends them as new rows and sets `modules.faq.questions` to `[]` (both saved on Enregistrer).

- [ ] **Step 1: Implement.** **Step 2: Verify** — add, reorder and delete a moment, a hotel and a question, then save: the rows are persisted in the new order (check with psql), and the preview matched before saving.

---

### Task 11: Module forms — every module sold at checkout

**Files:**
- Create: `dashboard/src/components/editor/sections/{DressCodeForm,RsvpForm,TransportForm,MenuForm,GalleryForm,GiftListForm,IntroVideoForm,PlaylistForm,GuestbookForm}.tsx`

Port the fields and behaviour of the matching `ModuleConfigForm.tsx` sub-forms, as controlled components bound to `updateModule(id, …)` with the keys from Task 7's table:
- `DressCodeForm`: slot `dress-code.eyebrow`; title (`subtitle` key, which the mapper prints as the title); global or split guidance; palette; photo (folder `dress-code`); note.
- `RsvpForm`: slot `rsvp.title`; deadline (`DateField` → `rsvp_deadline_iso`); `copy.rsvpIntro`; toggles for partner, message, and children (`settings.adultsOnly`, inverted); dietary options as a chip editor, prefilled from `@shared/data/dietary-options` when the couple switches it on.
- `TransportForm`: modes (type select with icons, title, directions) + carpooling (link, label, text).
- `MenuForm`: sections with dishes, dietary note, closing lines.
- `GalleryForm`: reuse `uploadGalleryImage` / `deleteGalleryImage`; grid sort; max 12.
- `GiftListForm`: title, text, link, link label.
- `IntroVideoForm`: title, subtitle, text, video as a link (embed) or a file (`uploadIntroVideo`).
- `PlaylistForm`: intro (`modules.playlist.description`), slots `playlist.*`, and a link to `/playlist` to moderate suggestions.
- `GuestbookForm` (both guestbooks, by prop): title, welcome text, and a plain notice that the guest-facing book is not live yet.

- [ ] **Step 1: Implement.** **Step 2: Verify** — for each owned module, edit, save, reload and check the value persisted. For modules ciao-amore does not draw, the eye-off badge and notice show.

---

### Task 12: Retire the old screens

**Files:**
- Modify to redirect: `dashboard/src/app/[locale]/invitation/{nos-mots,evenements,programme,lieu,faq}/page.tsx`, `dashboard/src/app/[locale]/modules/[moduleId]/page.tsx`
- Modify: `dashboard/src/components/navigation/nav-config.ts` (invitation items: `editor` → `/invitation`, `modules` → `/modules`, `playlist` → `/playlist`), `components/home/InvitationPreviewCard.tsx` (edit → `/invitation`), `components/modules/SortableModulesList.tsx` (cards → `/invitation?section=<id>`), and any other link found with `grep -rn "invitation/\(nos-mots\|evenements\|programme\|lieu\|faq\)\|/modules/" dashboard/src`
- Delete once nothing imports them: `modules/[moduleId]/{ModuleConfigForm,ModulePreview,ModuleConfigWithPreview,loading}.tsx`, `components/invitation/*`, `components/invitation-info/*` except `PhotoPicker.tsx`, `invitation-copy-actions.ts` if unused.

Redirect map: nos-mots → `hero`, evenements and programme → `timeline`, lieu → `map`, faq → `faq`, `/modules/<id>` → `<id>`.

- [ ] **Step 1: Redirect, relink, delete.** **Step 2: Verify** — `grep` finds no import of a deleted file. `npx tsc --noEmit` clean. Each old URL lands on the right tab.

---

### Task 13: Words, end-to-end check, docs

**Files:**
- Modify: `dashboard/messages/*.json` (9) — namespace `Editor` + `Sidebar.sections.invitation.items.editor`
- Modify: `landing/src/components/invitation/themes/README.md` (slots, anchors, isomorphic rule), `CLAUDE.md` if a convention changed
- Obsidian vault "The Studio Digital Papeterie": `Features/Éditeur de faire-part.md`, `Architecture/Base de Données.md` (new columns), `Conventions.md` (isomorphic sections, slots)

- [ ] **Step 1: Messages** — write `Editor` in French, then the eight other locales with the same keys (`node` script asserting identical key sets).
- [ ] **Step 2: End to end on the local stack** — seed a wedding (checkout flow on :3010 with Stripe test mode, or insert via SQL), sign in on :3003, and walk every tab: edit, see the preview change, save, reload, open the public invitation and confirm it matches the preview. Take screenshots at 390 / 1024 / 1440 and review them.
- [ ] **Step 3: Gates** — `npm test`, both test files, `npx tsc --noEmit` in both apps, `npm run themes:check`, `npm run build:landing`, `cd dashboard && npm run build`.
- [ ] **Step 4: Docs** — README traps and conventions, vault notes, memory entry for the editor architecture.

---

### Task 14: ciao-amore draws every sold module with guest-facing content

**Files:**
- Modify: `themes/types.ts` — contract gains `introVideo?: { title?: string; subtitle?: string; body?: string; url: string; kind: "embed" | "file" }`, `menu?: { sections: Array<{ title?: string; items: Array<{ title: string; description?: string }> }>; note?: string; footer?: string[] }`, `gallery?: { images: string[] }`
- Modify: `to-invitation-data.ts` (map the module content already read by `readModuleConfigs`)
- Create: `ciao-amore/sections/{IntroVideoSection,GiftsSection,MenuSection,GallerySection}.tsx` + rules in `ciao-amore/responsive.css` under `.theme-ciao-amore`
- Modify: `ciao-amore/theme.config.ts` (`supports` += `intro-video`, `gift-list`, `menu`, `gallery`), `CiaoAmoreRoot.tsx`, `editor.ts` (slots for the four), `landing/messages/*.json`

Each section follows the theme's grammar: a `paper` section, `eyebrow` + `h2` from slots with catalogue defaults, its content, and a `data-editor-section` anchor. It renders nothing when its content is absent. Embeds accept only YouTube and Vimeo URLs, turned into their `/embed/` form. Files play in a `<video controls playsInline preload="metadata">`.

- [ ] **Step 1: Implement.** **Step 2: Verify** — the demo gains nothing, because its demo data has none of the four. With a wedding that owns them, each section renders in the preview and on the public page. Screenshots at 390 and 1440 reviewed; `scrollW === clientW`.
