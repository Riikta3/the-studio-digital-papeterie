---
date: 2026-10-02
status: draft
category: feature
---

# Invitation music — the option the checkout already sells

## What was asked

> « la musique dans les invitations vu que c'est une option dans le checkout il
> faut le mettre en place il y aura une musique par défaut je sais pas encore
> laquelle l'utilisateur via le dashboard peut changer et mettre la musique
> qu'il veut ça tournera en boucle le visiteur du faire part peut activer
> désactiver la musique il faut une icon sur le site qui est en sticky et bien
> entendu dans le dashboard il peut activer désactiver la musique »

Decisions taken with the user on 2026-10-02:

| Question | Answer |
|---|---|
| What the `custom-music` option (10 €) unlocks | everything: no option → no music at all; option → the default track plays until the couple picks another |
| Can it be bought after the checkout | no, checkout only |
| Where the couple's music comes from | the studio's library (which holds the default track) **or** a file they upload |
| When the music starts for a guest | on the guest's first tap / click / key press anywhere on the page — amended 2026-10-02: "on by default", it first tries to start on opening (demos and real invitations), the first tap being the fallback when the browser refuses |
| Do the theme demos play it | yes, the default track, to sell the option |
| Architecture | settings columns + entitlement in `resolve_public_slug` + library as code (approach A of three; a `music_tracks` table with an admin screen was rejected as unneeded today, and remains possible later without breaking this) |

## What is wrong today

- **The option is sold and does nothing.** `custom-music` is in the configurator
  (`landing/src/components/studio/options.ts`), priced in
  `shared/lib/pricing.ts` (`EXTRA_PRICES`), invoiced
  (`landing/src/lib/invoice-lines.ts`) and written to `sites.extras` at
  checkout. Nothing reads it: no player, no dashboard screen. Every couple who
  bought it paid 10 € for nothing.
- **No audio exists anywhere.** The theme specs removed the designers' fake
  players on purpose (`2026-10-02-three-themes-design.md`: "no audio exists; it
  promises sound"). belle-rive's stylesheet still carries the designer's
  `.music-toggle`, with no markup using it.

## Decisions

### D1 — Data: three columns on `settings`

New migration `supabase/migrations/20261002150000_invitation_music.sql`:

| Column | Type | Meaning |
|---|---|---|
| `music_enabled` | `boolean not null default true` | the couple's switch in the dashboard |
| `music_track` | `text` | id of the chosen library track; `null` = the library's default |
| `music_upload_path` | `text` | storage path of the couple's file in the `music` bucket; `null` = none |

**One active music at a time.** When `music_upload_path` is set, the upload
plays. Choosing a library track empties the couple's folder in the bucket and
nulls the path; confirming a new upload removes every other object in the
folder. The folder therefore holds at most the file that plays — an upload
interrupted before its confirmation is swept by the next write — and there is
no ambiguity about what plays.

A path, not a URL: the server can delete the old object and check that a path
sits in the couple's own folder. URLs are built at read time (D4).

`music_track` is not checked by the database — the library lives in code
(D3). The dashboard action refuses an unknown id (D7); a read that meets an id
the library no longer has falls back to the default track rather than going
silent.

### D2 — Storage: a public `music` bucket

In the same migration, on the pattern of `videos` and `venue`
(`20260312110000_media_storage.sql`):

- `insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)`
  `values ('music', 'music', true, 15728640, array['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/aac'])`.
- Layout: `library/<file>` for the studio's tracks, `<wedding_id>/<timestamp>-<safe-name>.<ext>`
  for a couple's upload. The original file name survives in the path (slugified,
  60 characters at most) so the dashboard can show it without a fourth column.
- MP3 and M4A/AAC only: the formats every phone, Safari iOS included, plays.
- No `insert`/`delete` policy for `authenticated`: every write goes through a
  server action (D7) that checks the entitlement first, using a signed upload
  URL or the admin client.

### D3 — The library is code

`shared/data/music-library.ts`:

```ts
export type MusicTrack = { id: string; title: string; artist: string; file: string };
export const MUSIC_LIBRARY: readonly MusicTrack[];
export const DEFAULT_MUSIC_TRACK_ID: string;
```

`file` is the object name under `music/library/`. Exactly one track is the
default. Adding a track is a commit plus an upload to the bucket. The list
ships with at least the default track; the user supplies the files (see
*Before production*).

### D4 — The entitlement is decided in the database

`resolve_public_slug` is dropped and recreated (its return table changes),
re-granted to `anon` and `authenticated` exactly as today, with three more
columns:

| Column | Value |
|---|---|
| `music_enabled` | `true` only when `'custom-music' = any(coalesce(s.extras, '{}'))` **and** `coalesce(st.music_enabled, true)` |
| `music_track` | `st.music_track` when `music_enabled`, else `null` |
| `music_upload_path` | `st.music_upload_path` when `music_enabled`, else `null` |

`settings` is writable by the couple's own session, so a couple without the
option could fill these columns by hand; the function is what makes that
inert.

On the landing side, `shared/lib/music.ts` exposes one pure function used by
`toInvitationData` (`landing/src/lib/to-invitation-data.ts`):

```ts
resolveMusicSource(
  row: { music_enabled: boolean; music_track: string | null; music_upload_path: string | null },
  publicUrl: (path: string) => string,
): { src: string } | null
```

Upload path if set, else the chosen track, else the default; an unknown track
id → the default; `music_enabled` false → `null`. The public loader
(`getInvitationPage`) adds `music: { src: string } | null` to
`InvitationPageData`, the way it already adds `dayOf`. The theme-facing
`InvitationData` does not change: no theme reads the music, the page does.

### D5 — The player: one client component outside the themes

`landing/src/components/invitation/InvitationMusic.tsx`, mounted by
`app/[locale]/invitation/[slug]/page.tsx` (the couple's invitation) and
`app/[locale]/invitation/demo/[themeId]/page.tsx` (every "Voir la démo" link),
next to the theme, never inside it. No theme file is edited, and a future
theme gets the music for free — the themes README's rule that adding a theme
touches no existing file holds.

Props: `{ src: string; weddingKey: string; accentColor: string; themeId: string }`
(`weddingKey` is the wedding id, or `demo:<themeId>` on a demo). Not rendered
when the page has no music.

**Not rendered inside a frame.** The home page shows each demo in a phone
mock-up through an `<iframe>` (`components/home/Preview.tsx`); a tap in it
would otherwise start music on the marketing page. When
`window.self !== window.top`, the component renders nothing. A demo opened on
its own ("Voir la démo") plays.

Behaviour, held in a pure state machine
(`landing/src/lib/invitation-music.ts`) that the component wires to DOM events:

| State | Enters when | Icon |
|---|---|---|
| `idle` | page load, no stored "muted"; or `play()` refused | music note, gently pulsing |
| `playing` | first gesture, or a tap on the icon | animated bars |
| `muted` | the guest taps the icon while playing, or page load with stored "muted" | crossed speaker, still |
| `error` | the audio fails to load or decode | not rendered |

A refused `play()` — on iOS a swipe that scrolls is not an accepted gesture —
returns to `idle`, whose listeners wait for the next real tap.

- `<audio loop preload="none">`: nothing downloads before the music starts, so a
  guest who never hears it never pays 8 MB of mobile data.
- **On by default** (amended 2026-10-02, at the user's request). On mount, once the page is visible, the player tries `play()` straight away (`autostart`). Chrome and Edge allow it after the visitor clicked on the site (« Voir la démo », the guest code); Safari and a link opened directly refuse it, and the refusal leaves the player `idle`, waiting for the first gesture below. A guest who muted this wedding is not autostarted. The home page's mock-up stays silent.
- **First gesture.** Capture-phase listeners for `click`, `touchend` and
  `keydown` on `document`, removed after the first one fires. `scroll` is not
  a gesture browsers accept for audio. `play()` is called inside the handler,
  which is what Safari iOS requires. The volume fades in over about 2 s.
- **A first tap on the icon starts the music** — it is not counted twice
  (first gesture + toggle).
- **The guest's choice is remembered.** Muting writes
  `localStorage["invitation-music:<weddingKey>"] = "muted"`; playing removes
  it. With "muted" stored, there is no first-gesture start. Every storage
  access is wrapped in try/catch: a private window simply forgets.
- **Hidden page.** On `visibilitychange` to hidden, pause; on visible again,
  resume only if the state is `playing`.
- **The gate.** `GuestGate` loads no wedding data by design, so it has no music;
  after the code, the invitation loads and the first-gesture rule applies.
- **Opening overlays.** mare-alta's "Ouvrir" screen is a tap like any other: it
  starts the music.

### D6 — The sticky icon

- Top right — the placement belle-rive's designer chose; ciao-amore's
  scroll-to-top button already holds the bottom right corner. The component's
  default is the viewport corner: `top: calc(18px + env(safe-area-inset-top, 0px))`,
  `right: 18px`. On a phone, where every theme fills the width, that is the
  column's edge. On desktop, a theme whose column is centred may pull it in to
  its column (belle-rive's designer used
  `right: max(15px, calc((100vw - 480px) / 2 + 15px))`) in its own
  `responsive.css`; the desktop screenshots decide which themes need it.
- `z-index: 90`: above the themes' floating navs (50–60), below their opening
  overlays (100), so it appears once an invitation is opened.
- A `<button type="button" aria-pressed>` whose translated `aria-label`
  (« Musique ») stays the same in every state — `aria-pressed` says whether it
  plays, and a label that changed with it would announce the opposite;
  coloured with the theme's `accentColor`; the bars and the pulse stop under
  `prefers-reduced-motion: reduce`.
- Class `invitation-music` and `data-theme="<theme id>"`: a theme may restyle it
  in its hand-written `responsive.css` with
  `.invitation-music[data-theme="<id>"]`. Its scope class cannot be used — the
  icon is rendered beside the theme's `Root`, not inside it. The component does
  not change for it.

### D7 — The dashboard screen

Route `dashboard/src/app/[locale]/musique/page.tsx`, linked as "Musique" in the
*Invitation* section of `components/navigation/nav-config.ts`.

- `NavItemDef` gains an optional `requiresExtra?: string`; the sidebar hides an
  item whose extra the site does not have. The item is
  `{ key: "music", href: "/musique", requiresExtra: "custom-music" }`.
  `DashboardLayout` already passes `slug`, `siteLocale` and `isPublished` to
  `<Sidebar>`; it passes the site's `extras` the same way.
- Without the option, the page (reached by URL) shows « Option non incluse dans
  votre commande » and no controls.

The screen, top to bottom:

1. **« Musique sur le faire-part »** switch → `music_enabled`, saved at once,
   rolled back with an error message on failure. Off: no icon for any guest.
2. **Current track**: title and artist, or the uploaded file's name, with an
   *Écouter* button (a plain `<audio>` in the dashboard).
3. **Bibliothèque**: each track with *Écouter* and *Choisir*; the default one is
   marked « Par défaut ». When an upload exists, *Choisir* first asks: « Votre
   fichier sera supprimé ».
4. **Envoyer votre musique**: MP3 or M4A, 15 Mo max. The uploaded file becomes
   the active track. Under the field: « En envoyant un fichier, vous confirmez
   avoir le droit de le diffuser ».

Server actions, `dashboard/src/actions/music-actions.ts`. Each one resolves the
wedding from the session and refuses unless `sites.extras` contains
`custom-music`:

| Action | Does |
|---|---|
| `setMusicEnabled(enabled)` | writes `music_enabled` |
| `chooseLibraryTrack(trackId)` | refuses an id not in `MUSIC_LIBRARY`; writes `music_track`, nulls `music_upload_path`; then removes every object in `<wedding_id>/` |
| `createMusicUploadUrl(fileName, size, type)` | validates type and size (`validateMusicUpload` in `shared/lib/music.ts`); returns a signed upload URL for `<wedding_id>/<timestamp>-<safe-name>.<ext>` |
| `confirmMusicUpload(path)` | checks the path is in the couple's folder and the object exists; writes `music_upload_path`; then removes every other object in `<wedding_id>/` |

The database row is written before the old objects are removed: a failure in
between leaves an unused file, never a row pointing at a deleted one.

**Why a signed URL rather than a file in a server action.** The dashboard is
deployed on Vercel, which refuses a function request body over 4.5 MB whatever
Next's `bodySizeLimit: "20mb"` says. A song is typically 5–10 MB: it would pass
locally and fail in production. The browser therefore sends the file straight
to Supabase Storage (`uploadToSignedUrl`), between the two actions above.

**Couples who already bought the option** have `custom-music` in
`sites.extras`: they get the default track the day this ships, with nothing to
do.

## Components

| Unit | Responsibility |
|---|---|
| `supabase/migrations/20261002150000_invitation_music.sql` | columns, bucket, new `resolve_public_slug` |
| `shared/types/supabase.ts` | regenerated |
| `shared/data/music-library.ts` | the library and its default |
| `shared/lib/music.ts` | `resolveMusicSource`, `musicDisplayName(path)`, `validateMusicUpload` |
| `landing/src/actions/invitation-page-actions.ts`, `lib/assemble-invitation-page.ts` (type) | carry `music` to the page |
| `landing/src/lib/invitation-music.ts` | the player's state machine |
| `landing/src/components/invitation/InvitationMusic.tsx` | the `<audio>`, the listeners, the icon |
| `landing/src/app/[locale]/invitation/[slug]/page.tsx`, `invitation/demo/[themeId]/page.tsx` | mount it |
| `dashboard/src/actions/music-actions.ts` | the four actions |
| `dashboard/src/app/[locale]/musique/page.tsx` + its client component | the screen |
| `dashboard/src/components/navigation/nav-config.ts`, `components/dashboard/Sidebar.tsx` | the item and `requiresExtra` |
| `landing/messages/*.json`, `dashboard/messages/*.json` | new keys, all 9 locales |

## Error handling

| Case | Result |
|---|---|
| Library file missing from the bucket, or upload unreadable | the icon is not rendered; a `console.warn`; the page is unaffected |
| `play()` rejected (no valid gesture, browser policy) | state stays `idle`; the icon remains the way in |
| Upload too large / wrong type | refused before any transfer, message in the dashboard |
| Upload interrupted between signed URL and confirmation | nothing is written to `settings`; the unreferenced object is removed by the couple's next upload or library choice (D1) |
| Action called without the option | refused with « Option non incluse dans votre commande » |
| Unknown `music_track` in the database | the default track plays |

## Testing

- `shared/lib/music.test.mjs` (already in `npm test`'s `shared/lib/*.test.mjs`):
  source precedence, unknown id → default, `music_enabled` false → `null`,
  display name from a path, upload validation (type, size).
- `landing/src/lib/invitation-music.test.mjs` (in `landing/src/lib/*.test.mjs`):
  first gesture starts once; a first tap on the icon starts, not toggles;
  stored "muted" prevents the start; hidden/visible pauses and resumes only
  from `playing`; error hides.
- `supabase/tests/invitation_music.sql`, local database, one rolled-back
  transaction, on the model of `module_addons.sql`: with the option and the
  switch on, the columns come back; **without the option, nothing comes back
  even with `settings` filled by hand**; switch off → `null`; unpublished site →
  no row.
- Real browser, landing and dashboard running: upload a file, switch to a
  library track, turn the music off and on, open the invitation. Screenshots of
  the six themes at 375 px and desktop, in `fr`, `de` and `ar`, plus one demo.
  `npm run themes:check -w landing` passes.
- **A real iPhone check by the user before production**: Chrome's mobile
  emulation does not enforce Safari iOS's audio rules.

## Out of scope

- Music on the guest-code screen, the Jour J pages and the editor's live
  preview (`/invitation/apercu`).
- Buying the option after the checkout.
- Trimming, a start offset, volume settings, several tracks per invitation.
- A library admin screen or `music_tracks` table.
- `uploadIntroVideo` (100 MB through a server action): very likely broken in
  production by the same Vercel 4.5 MB limit. Reported, not fixed here.

## Before production

1. `supabase db push` of the migration — needs the user's go-ahead — then
   regenerate `shared/types/supabase.ts`.
2. Upload the library files to `music/library/`. The user supplies them:
   the default track and the others, royalty-free with a licence allowing
   public diffusion on the web.
3. Deploy landing and dashboard. A missing library file only hides the icon,
   so this order carries no risk.
4. The user adds a line to the terms (CGU) about files couples upload.
5. Obsidian vault: `Architecture/Base de Données.md` (columns, bucket, RPC) and
   a `Features/Musique` note.
