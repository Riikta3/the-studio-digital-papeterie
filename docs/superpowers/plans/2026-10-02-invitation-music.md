# Invitation Music Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the `custom-music` option the checkout already sells actually play: a looping track on the couple's invitation (library default, another library track, or their own upload), a sticky mute/unmute icon for guests, and a dashboard screen to switch it on/off and pick the track.

**Architecture:** Three columns on `settings` and a public `music` bucket; `resolve_public_slug` only hands the music to guests when `sites.extras` contains `custom-music`. The library is a code list in `shared/data`. One client component, mounted by the invitation and demo routes beside the theme (no theme edited), drives an `<audio loop>` through a pure state machine. The dashboard gets a `/musique` screen whose uploads go browser → Supabase Storage through a signed URL.

**Tech Stack:** Next.js 16 (App Router), React, next-intl 4 (9 locales), Supabase (Postgres, Storage, supabase-js), Tailwind, lucide-react, node:test with `--experimental-strip-types`.

**Spec:** `docs/superpowers/specs/2026-10-02-invitation-music-design.md` — read it before Task 1. Decisions D1–D7 are referenced below.

## Global Constraints

- Discussion with the user in French; code, comments and commit messages in English; user-facing strings returned by server actions in French (repo convention, `.superpowers/sdd/2026-09-02-branchement-dashboard-supabase/action-conventions.md`).
- Every new message key goes into all 9 locale files of its app (`fr en de es pt it ar zh ja`), translated — never French pasted into the others.
- No file under `landing/src/components/invitation/themes/` is edited (themes README: adding a theme must not require editing an existing file).
- Never run `supabase db push` and never write to the remote project. **`dashboard/.env.local` points at the production Supabase project** (`pftvcpxwbprmphhgwvxc`): the dashboard is only ever started with the local overrides given in Task 6, and nothing in this plan edits any `.env*` file.
- Never commit or push unless the user said so for this run (CLAUDE.md). The working tree holds a large amount of the user's uncommitted work (126 files, including files this plan edits: `dashboard/messages/*.json`, `nav-config.ts`, `package.json`, `shared/types/supabase.ts`). Do not `git checkout`, `git stash` or `git restore` anything.
- Migration file: `supabase/migrations/20261002150000_invitation_music.sql` (`20261002120000` is already taken by `custom_domains`).
- Bucket `music`: public, `file_size_limit` 15728640, `allowed_mime_types` `{audio/mpeg,audio/mp4,audio/x-m4a,audio/aac}`.
- Option id `custom-music`; nav item `{ key: "music", href: "/musique", requiresExtra: "custom-music" }`.
- Every dashboard query carries an explicit `.eq("wedding_id", weddingId)` (house rule, even under RLS).
- Every `localStorage` access is wrapped in try/catch.
- Local Supabase: API `http://127.0.0.1:54321`, DB `postgresql://postgres:postgres@127.0.0.1:54322/postgres`. Keys come from `npx supabase status -o env`.

## Review Focus

1. **A guest's first touch is a swipe (iOS).** Safari refuses `play()` after a scroll gesture; the player must fall back to waiting and start on the next real tap, not die silently. → Task 3 test « a refused play() … goes back to idle, and the next tap starts it ».
2. **A rapid double tap on the icon.** The first `play()` promise rejects (interrupted by `pause()`) after the second tap restarted the music; that stale rejection must not flip a playing state back to idle. → Task 4: play token in the component + browser check step.
3. **Guest storage that throws** (Safari private mode, blocked site data). The player must work and simply forget the choice. → Task 3 test « a storage that throws … ».
4. **The browser reports no MIME type, or `audio/x-m4a`, or the file is `CHANSON.MP3`.** The extension decides; such files are accepted with the right Content-Type. → Task 2 test « validateMusicUpload trusts the extension … ».
5. **The demo inside the home page's phone mock-up** (an `<iframe>`). A tap there must not start music on the marketing page. → Task 4 browser check step.

---

### Task 1: Database — columns, bucket, entitlement in `resolve_public_slug`

**Files:**
- Create: `supabase/migrations/20261002150000_invitation_music.sql`
- Create: `supabase/tests/invitation_music.sql`
- Modify (regenerate): `shared/types/supabase.ts`

**Interfaces:**
- Produces: `settings.music_enabled boolean not null default true`, `settings.music_track text`, `settings.music_upload_path text`; bucket `music`; `resolve_public_slug(text)` returning its 10 existing columns plus `music_enabled boolean`, `music_track text`, `music_upload_path text` (both text columns `null` unless the site owns `custom-music` and the switch is on).

- [ ] **Step 1: Write the failing SQL test**

Create `supabase/tests/invitation_music.sql`:

```sql
-- Checks for 20261002150000_invitation_music.sql. LOCAL database only:
--   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
--     -v ON_ERROR_STOP=1 -f supabase/tests/invitation_music.sql
-- Everything runs in one transaction that is rolled back: nothing stays behind.
begin;

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-8000-00000000d001', 'music-paid@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-00000000d002', 'music-unpaid@example.test', 'authenticated', 'authenticated');
insert into public.profiles (id) values
  ('00000000-0000-4000-8000-00000000d001'),
  ('00000000-0000-4000-8000-00000000d002')
on conflict (id) do nothing;
insert into public.weddings (id, user_id) values
  ('00000000-0000-4000-8000-00000000e001', '00000000-0000-4000-8000-00000000d001'),
  ('00000000-0000-4000-8000-00000000e002', '00000000-0000-4000-8000-00000000d002');
insert into public.sites (id, wedding_id, slug, plan_id, theme_id, modules, extras, status) values
  ('00000000-0000-4000-8000-00000000f001', '00000000-0000-4000-8000-00000000e001',
   'music-check-paid', 'signature', 'ciao-amore', '{}', array['custom-music'], 'published'),
  ('00000000-0000-4000-8000-00000000f002', '00000000-0000-4000-8000-00000000e002',
   'music-check-unpaid', 'signature', 'ciao-amore', '{}', '{}', 'published');
-- Both couples filled the music columns. Only one of them paid for it.
insert into public.settings (wedding_id, music_track, music_upload_path) values
  ('00000000-0000-4000-8000-00000000e001', 'studio-default',
   '00000000-0000-4000-8000-00000000e001/1-notre-chanson.mp3'),
  ('00000000-0000-4000-8000-00000000e002', 'studio-default',
   '00000000-0000-4000-8000-00000000e002/1-notre-chanson.mp3')
on conflict (wedding_id) do update
  set music_track = excluded.music_track,
      music_upload_path = excluded.music_upload_path;

do $$
declare
  r record;
begin
  -- Paid, switch on (the column default): the couple's choice comes back.
  select * into r from public.resolve_public_slug('music-check-paid');
  assert r.music_enabled, 'paid site: music_enabled should be true';
  assert r.music_track = 'studio-default', format('paid site: music_track = %s', r.music_track);
  assert r.music_upload_path = '00000000-0000-4000-8000-00000000e001/1-notre-chanson.mp3',
    format('paid site: music_upload_path = %s', r.music_upload_path);

  -- Not paid, settings filled by hand: the invitation resolves, the music does not.
  select * into r from public.resolve_public_slug('music-check-unpaid');
  assert r.wedding_id is not null, 'unpaid site must still resolve';
  assert not r.music_enabled, 'unpaid site: music_enabled should be false';
  assert r.music_track is null and r.music_upload_path is null,
    'unpaid site leaked the music columns';

  -- Paid, switched off by the couple: nothing.
  update public.settings set music_enabled = false
   where wedding_id = '00000000-0000-4000-8000-00000000e001';
  select * into r from public.resolve_public_slug('music-check-paid');
  assert not r.music_enabled and r.music_track is null and r.music_upload_path is null,
    'switched-off site leaked the music columns';

  -- Unpublished: no row at all.
  update public.settings set music_enabled = true
   where wedding_id = '00000000-0000-4000-8000-00000000e001';
  update public.sites set status = 'draft'
   where id = '00000000-0000-4000-8000-00000000f001';
  perform 1 from public.resolve_public_slug('music-check-paid');
  assert not found, 'an unpublished site must not resolve';

  -- The bucket exists, public, with its limits.
  perform 1 from storage.buckets
   where id = 'music' and public and file_size_limit = 15728640
     and allowed_mime_types @> array['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/aac'];
  assert found, 'music bucket missing or misconfigured';

  -- Guests still reach the function.
  assert has_function_privilege('anon', 'public.resolve_public_slug(text)', 'execute'),
    'anon lost execute on resolve_public_slug';
end;
$$;

rollback;
```

- [ ] **Step 2: Run it to verify it fails**

Run: `psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v ON_ERROR_STOP=1 -f supabase/tests/invitation_music.sql`
Expected: FAIL with `column "music_track" of relation "settings" does not exist`.

If the connection is refused, start the local stack first: `npx supabase start` (from the repo root).

- [ ] **Step 3: Write the migration**

Create `supabase/migrations/20261002150000_invitation_music.sql`:

```sql
-- Invitation music: the `custom-music` option the checkout has always sold.
-- docs/superpowers/specs/2026-10-02-invitation-music-design.md (D1, D2, D4).

-- 1. The couple's choice ------------------------------------------------------
alter table public.settings
  add column if not exists music_enabled boolean not null default true,
  add column if not exists music_track text,
  add column if not exists music_upload_path text;

comment on column public.settings.music_enabled is
  'The couple''s switch for their invitation music. Meaningful only when the '
  'site owns the `custom-music` extra: resolve_public_slug ignores it otherwise.';
comment on column public.settings.music_track is
  'Id of the chosen track in shared/data/music-library.ts; null = the library '
  'default. Not checked here, the library lives in code: an id it no longer '
  'has falls back to the default when read.';
comment on column public.settings.music_upload_path is
  'Object name of the couple''s own file in the `music` bucket '
  '(<wedding_id>/<timestamp>-<name>.<ext>); null = none. When set, it plays '
  'instead of music_track.';

-- 2. The files ----------------------------------------------------------------
-- Public like `videos` and `venue`: an invitation is public to whoever holds
-- its link. No storage policy for `authenticated`: every write goes through a
-- dashboard server action that checks the option first (a signed upload URL,
-- or the service role).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'music',
  'music',
  true,
  15728640, -- 15 MB
  array['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/aac']
)
on conflict (id) do nothing;

-- 3. Guests get the music only when it was paid for ---------------------------
-- `settings` is writable by the couple's own session, so a couple without the
-- option could fill the columns above by hand. This function is what makes
-- that inert. Dropped and recreated: its return table changes.
drop function if exists public.resolve_public_slug(text);

create function public.resolve_public_slug(p_slug text)
returns table (
  wedding_id uuid,
  theme_id text,
  modules text[],
  adults_only boolean,
  languages text[],
  hero_kicker text,
  announcement text,
  closing_words text,
  couple_photo_url text,
  invitation_texts jsonb,
  music_enabled boolean,
  music_track text,
  music_upload_path text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_slug is null or length(trim(p_slug)) = 0 then
    return;
  end if;

  return query
  select
    s.wedding_id,
    s.theme_id,
    s.modules,
    coalesce(st.adults_only, false),
    s.languages,
    st.hero_kicker,
    st.announcement,
    st.closing_words,
    st.couple_photo_url,
    coalesce(st.invitation_texts, '{}'::jsonb),
    m.on_air,
    case when m.on_air then st.music_track end,
    case when m.on_air then st.music_upload_path end
  from public.sites s
  left join public.settings st
    on st.wedding_id = s.wedding_id
  cross join lateral (
    select ('custom-music' = any(coalesce(s.extras, '{}'::text[])))
       and coalesce(st.music_enabled, true) as on_air
  ) m
  where s.slug = trim(p_slug)
    and s.status = 'published'
  limit 1;
end;
$$;

comment on function public.resolve_public_slug(text) is
  'Resolves a public slug to the configuration a theme needs for a PUBLISHED '
  'site: identity, modules, languages, every word the couple wrote, and its '
  'music — the music only when the site owns the `custom-music` extra and the '
  'couple left it on. Replaces a broad anon select on `sites`, which leaked '
  'every column and let anyone list every published slug. Returns one row at a '
  'time and cannot be enumerated. Gated on sites.status, NOT on the Jour J module.';

revoke all on function public.resolve_public_slug(text) from public;
grant execute on function public.resolve_public_slug(text) to anon, authenticated;
```

- [ ] **Step 4: Apply it locally and run the test**

Run: `npx supabase migration up` (repo root; local database only)
Expected: `Applying migration 20261002150000_invitation_music.sql...` and no error.

Run: `psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v ON_ERROR_STOP=1 -f supabase/tests/invitation_music.sql`
Expected: `BEGIN`, the inserts, `DO`, `ROLLBACK` — no `ERROR`, no assertion failure.

- [ ] **Step 5: Regenerate the types without losing anything**

```bash
cp shared/types/supabase.ts "$TMPDIR/supabase.ts.before-music"
npx supabase gen types typescript --local > shared/types/supabase.ts
diff "$TMPDIR/supabase.ts.before-music" shared/types/supabase.ts
```

Expected: the diff only adds `music_enabled`, `music_track`, `music_upload_path` to `settings` (Row, Insert, Update) and to `resolve_public_slug`'s `Returns`. If it removes or changes anything else (the local database is behind the user's types), restore the backup (`cp "$TMPDIR/supabase.ts.before-music" shared/types/supabase.ts`) and add exactly those lines by hand, in the same style as the neighbouring columns.

- [ ] **Step 6: Checkpoint**

Run: `git status --short supabase shared/types`
Expected: the two new SQL files untracked, `shared/types/supabase.ts` modified. Commit only if the user authorised commits (`feat(db): give the invitation music its columns, bucket and paywall`).

---

### Task 2: The library and the pure music helpers

**Files:**
- Create: `shared/data/music-library.ts`
- Create: `shared/lib/music.ts`
- Test: `shared/lib/music.test.mjs` (already matched by `npm test`'s `shared/lib/*.test.mjs`)

**Interfaces:**
- Produces (`@shared/data/music-library`): `type MusicTrack = { id: string; title: string; artist: string; file: string }`, `MUSIC_LIBRARY: readonly MusicTrack[]`, `DEFAULT_MUSIC_TRACK_ID: string`, `findMusicTrack(id: string | null | undefined): MusicTrack | undefined`.
- Produces (`@shared/lib/music`): `MUSIC_OPTION_ID = "custom-music"`, `MUSIC_BUCKET = "music"`, `MAX_MUSIC_BYTES`, `type MusicRow = { music_enabled: boolean | null; music_track: string | null; music_upload_path: string | null }`, `libraryTrackPath(file: string): string`, `musicPublicUrl(supabaseUrl: string, path: string): string`, `resolveMusicSource(row: MusicRow | null | undefined, publicUrl: (path: string) => string): { src: string } | null`, `type MusicUploadCheck`, `validateMusicUpload(file: { name: string; size: number }): MusicUploadCheck`, `musicObjectName(weddingId: string, fileName: string, now: number): string`, `isOwnMusicPath(weddingId: string, path: string): boolean`, `musicDisplayName(path: string): string`.

- [ ] **Step 1: Write the failing test**

Create `shared/lib/music.test.mjs`:

```js
import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_MUSIC_TRACK_ID,
  MUSIC_LIBRARY,
  findMusicTrack,
} from "../data/music-library.ts";
import {
  MAX_MUSIC_BYTES,
  isOwnMusicPath,
  musicDisplayName,
  musicObjectName,
  musicPublicUrl,
  resolveMusicSource,
  validateMusicUpload,
} from "./music.ts";

const url = (path) => `https://cdn.test/${path}`;
const W = "0b6c2f0e-1111-4222-8333-444455556666";

test("the library's default is in the list, and ids are unique", () => {
  assert.ok(findMusicTrack(DEFAULT_MUSIC_TRACK_ID));
  const ids = MUSIC_LIBRARY.map((track) => track.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(findMusicTrack(null), undefined);
  assert.equal(findMusicTrack("no-such-track"), undefined);
});

test("resolveMusicSource plays nothing when the database blanked the row", () => {
  assert.equal(resolveMusicSource(null, url), null);
  assert.equal(
    resolveMusicSource({ music_enabled: false, music_track: "x", music_upload_path: `${W}/1-a.mp3` }, url),
    null,
  );
  assert.equal(
    resolveMusicSource({ music_enabled: null, music_track: null, music_upload_path: null }, url),
    null,
  );
});

test("resolveMusicSource prefers the couple's upload", () => {
  assert.deepEqual(
    resolveMusicSource(
      { music_enabled: true, music_track: DEFAULT_MUSIC_TRACK_ID, music_upload_path: `${W}/1-a.mp3` },
      url,
    ),
    { src: `https://cdn.test/${W}/1-a.mp3` },
  );
});

test("resolveMusicSource falls back to the default track, also for an id the library lost", () => {
  const expected = { src: `https://cdn.test/library/${findMusicTrack(DEFAULT_MUSIC_TRACK_ID).file}` };
  assert.deepEqual(
    resolveMusicSource({ music_enabled: true, music_track: null, music_upload_path: null }, url),
    expected,
  );
  assert.deepEqual(
    resolveMusicSource({ music_enabled: true, music_track: "removed-song", music_upload_path: null }, url),
    expected,
  );
});

test("musicPublicUrl builds Supabase's public object URL, encoding each segment", () => {
  assert.equal(
    musicPublicUrl("http://127.0.0.1:54321/", "library/a b.mp3"),
    "http://127.0.0.1:54321/storage/v1/object/public/music/library/a%20b.mp3",
  );
});

test("validateMusicUpload trusts the extension, not the browser's MIME type", () => {
  assert.deepEqual(validateMusicUpload({ name: "CHANSON.MP3", size: 1000 }), {
    ok: true,
    ext: "mp3",
    contentType: "audio/mpeg",
  });
  assert.deepEqual(validateMusicUpload({ name: "voice memo.m4a", size: 1000 }), {
    ok: true,
    ext: "m4a",
    contentType: "audio/mp4",
  });
  assert.deepEqual(validateMusicUpload({ name: "song.aac", size: 1 }), {
    ok: true,
    ext: "aac",
    contentType: "audio/aac",
  });
});

test("validateMusicUpload refuses other formats, empty files and files over 15 MB", () => {
  assert.deepEqual(validateMusicUpload({ name: "song.wav", size: 1000 }), { ok: false, reason: "type" });
  assert.deepEqual(validateMusicUpload({ name: "song", size: 1000 }), { ok: false, reason: "type" });
  assert.deepEqual(validateMusicUpload({ name: "song.mp3", size: 0 }), { ok: false, reason: "empty" });
  assert.deepEqual(validateMusicUpload({ name: "song.mp3", size: MAX_MUSIC_BYTES + 1 }), {
    ok: false,
    reason: "size",
  });
  assert.equal(validateMusicUpload({ name: "song.mp3", size: MAX_MUSIC_BYTES }).ok, true);
});

test("musicObjectName keeps a readable, safe version of the name in the couple's folder", () => {
  assert.equal(
    musicObjectName(W, "Notre chanson ❤️ (live).MP3", 1700000000000),
    `${W}/1700000000000-notre-chanson-live.mp3`,
  );
  assert.equal(musicObjectName(W, "Écoute-moi.m4a", 1), `${W}/1-ecoute-moi.m4a`);
  assert.equal(musicObjectName(W, "❤️.mp3", 1), `${W}/1-musique.mp3`);
  assert.equal(musicObjectName(W, `${"a".repeat(100)}.mp3`, 1), `${W}/1-${"a".repeat(60)}.mp3`);
});

test("isOwnMusicPath accepts only an upload in this wedding's own folder", () => {
  assert.equal(isOwnMusicPath(W, `${W}/1700000000000-notre-chanson.mp3`), true);
  assert.equal(isOwnMusicPath(W, musicObjectName(W, "Notre chanson ❤️ (live).MP3", 5)), true);
  assert.equal(isOwnMusicPath(W, "other-wedding/1-a.mp3"), false);
  assert.equal(isOwnMusicPath(W, `${W}/../other/1-a.mp3`), false);
  assert.equal(isOwnMusicPath(W, `${W}/sub/1-a.mp3`), false);
  assert.equal(isOwnMusicPath(W, "library/studio-default.mp3"), false);
  assert.equal(isOwnMusicPath(W, `${W}/1-a.wav`), false);
});

test("musicDisplayName drops the folder and the timestamp", () => {
  assert.equal(musicDisplayName(`${W}/1700000000000-notre-chanson.mp3`), "notre-chanson.mp3");
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs --test shared/lib/music.test.mjs`
Expected: FAIL — cannot find module `../data/music-library.ts`.

- [ ] **Step 3: Write the library**

Create `shared/data/music-library.ts`:

```ts
/**
 * The studio's music library: the tracks a couple who bought the
 * `custom-music` option can put on their invitation, and the one that plays
 * until they choose (docs/superpowers/specs/2026-10-02-invitation-music-design.md, D3).
 *
 * Code rather than a table: the list changes rarely, and a change is a commit
 * plus an upload of the file to `library/<file>` in the `music` bucket.
 * Removing a track is safe — a couple who had chosen it falls back to the
 * default (`resolveMusicSource`), never to silence.
 */
export type MusicTrack = {
  /** Stored in `settings.music_track`. Never reuse an id for another song. */
  id: string;
  title: string;
  artist: string;
  /** Object name under `library/` in the `music` bucket. */
  file: string;
};

export const MUSIC_LIBRARY: readonly MusicTrack[] = [
  {
    id: "studio-default",
    title: "Ambiance The Studio",
    artist: "The Studio",
    file: "studio-default.mp3",
  },
];

export const DEFAULT_MUSIC_TRACK_ID = "studio-default";

export function findMusicTrack(id: string | null | undefined): MusicTrack | undefined {
  return id ? MUSIC_LIBRARY.find((track) => track.id === id) : undefined;
}
```

- [ ] **Step 4: Write the helpers**

Create `shared/lib/music.ts`:

```ts
import { DEFAULT_MUSIC_TRACK_ID, findMusicTrack } from "../data/music-library";

/**
 * Everything both apps need to agree on about the invitation music
 * (docs/superpowers/specs/2026-10-02-invitation-music-design.md, D1–D4):
 * which file plays, where files live, and what an upload may be.
 */

/** The checkout extra that unlocks the music (`EXTRA_PRICES` in ./pricing). */
export const MUSIC_OPTION_ID = "custom-music";

export const MUSIC_BUCKET = "music";

/** The bucket's `file_size_limit` (migration 20261002150000). */
export const MAX_MUSIC_BYTES = 15 * 1024 * 1024;

/**
 * Accepted extensions and the Content-Type each one is stored with.
 *
 * The extension decides, not the browser's `file.type`: for the same `.m4a`
 * Chrome says `audio/x-m4a`, Safari `audio/mp4`, and some browsers say
 * nothing at all. MP3 and M4A/AAC are what every phone plays, Safari iOS
 * included.
 */
const CONTENT_TYPES: Record<string, string> = {
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  aac: "audio/aac",
};

/** The three music columns as `resolve_public_slug` returns them. */
export type MusicRow = {
  music_enabled: boolean | null;
  music_track: string | null;
  music_upload_path: string | null;
};

/** Object name of a library track in the bucket. */
export function libraryTrackPath(file: string): string {
  return `library/${file}`;
}

/** Public URL of an object in the `music` bucket — a public bucket, so no signing. */
export function musicPublicUrl(supabaseUrl: string, path: string): string {
  const base = supabaseUrl.replace(/\/+$/, "");
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/${MUSIC_BUCKET}/${encoded}`;
}

/**
 * What an invitation plays.
 *
 * The database already blanked the row (`music_enabled` false, both paths
 * null) when the site does not own the option or the couple switched it off,
 * so this only picks between the couple's upload, their library choice and the
 * default. An id the library no longer has plays the default rather than
 * nothing.
 */
export function resolveMusicSource(
  row: MusicRow | null | undefined,
  publicUrl: (path: string) => string,
): { src: string } | null {
  if (!row?.music_enabled) return null;
  if (row.music_upload_path) return { src: publicUrl(row.music_upload_path) };

  const track = findMusicTrack(row.music_track) ?? findMusicTrack(DEFAULT_MUSIC_TRACK_ID);
  return track ? { src: publicUrl(libraryTrackPath(track.file)) } : null;
}

export type MusicUploadCheck =
  | { ok: true; ext: string; contentType: string }
  | { ok: false; reason: "type" | "size" | "empty" };

/** Whether a file may become a couple's music, checked before any transfer. */
export function validateMusicUpload(file: { name: string; size: number }): MusicUploadCheck {
  const ext = extensionOf(file.name);
  const contentType = ext ? CONTENT_TYPES[ext] : undefined;
  if (!ext || !contentType) return { ok: false, reason: "type" };
  if (file.size <= 0) return { ok: false, reason: "empty" };
  if (file.size > MAX_MUSIC_BYTES) return { ok: false, reason: "size" };
  return { ok: true, ext, contentType };
}

function extensionOf(name: string): string | undefined {
  return /\.([a-z0-9]+)$/i.exec(name.trim())?.[1].toLowerCase();
}

/** "Notre chanson ❤️ (live).MP3" → "notre-chanson-live"; nothing Latin left → "musique". */
function safeBaseName(name: string): string {
  const slug = name
    .trim()
    .replace(/\.[a-z0-9]+$/i, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return slug || "musique";
}

/**
 * Where a couple's upload is stored: their own folder, a timestamp that makes
 * every upload a new object (no CDN serving yesterday's song under today's
 * name), and the original name, so the dashboard can show it back without a
 * column of its own. `fileName` must have passed `validateMusicUpload`.
 */
export function musicObjectName(weddingId: string, fileName: string, now: number): string {
  const ext = extensionOf(fileName) ?? "mp3";
  return `${weddingId}/${now}-${safeBaseName(fileName)}.${ext}`;
}

/** Exactly what `musicObjectName` writes after the folder. */
const OWN_OBJECT = /^\d+-[a-z0-9]+(?:-[a-z0-9]+)*\.(?:mp3|m4a|aac)$/;

/**
 * True when `path` is an upload this wedding's folder could hold — the only
 * kind of path the dashboard may record as a couple's music. Rejects other
 * folders, sub-folders, `..` and library objects.
 */
export function isOwnMusicPath(weddingId: string, path: string): boolean {
  const prefix = `${weddingId}/`;
  return path.startsWith(prefix) && OWN_OBJECT.test(path.slice(prefix.length));
}

/** "<wedding>/1727866000000-notre-chanson.mp3" → "notre-chanson.mp3". */
export function musicDisplayName(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1).replace(/^\d+-/, "");
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs --test shared/lib/music.test.mjs`
Expected: PASS, 10 tests.

Run: `npm test`
Expected: PASS, nothing else broken.

- [ ] **Step 6: Checkpoint**

Commit only if authorised: `git add shared/data/music-library.ts shared/lib/music.ts shared/lib/music.test.mjs` — `feat(music): decide which song an invitation plays and what a couple may upload`.

---

### Task 3: The player's state machine

**Files:**
- Create: `landing/src/lib/invitation-music.ts`
- Test: `landing/src/lib/invitation-music.test.mjs` (already matched by `npm test`'s `landing/src/lib/*.test.mjs`)

**Interfaces:**
- Produces (`@/lib/invitation-music`): `type MusicState = "idle" | "playing" | "muted" | "error"`, `type MusicEvent = "gesture" | "toggle" | "hidden" | "visible" | "rejected" | "failed"`, `type MusicStep = { state: MusicState; command: "play" | "pause" | null; remember: "muted" | "unmuted" | null }`, `initialMusicState(storedMuted: boolean): MusicState`, `nextMusicStep(state: MusicState, event: MusicEvent): MusicStep`, `musicStorageKey(weddingKey: string): string`, `readStoredMuted(storage, key): boolean`, `writeStoredMuted(storage, key, remember): void` where `storage: Pick<Storage, "getItem" | "setItem" | "removeItem"> | null | undefined`.

- [ ] **Step 1: Write the failing test**

Create `landing/src/lib/invitation-music.test.mjs`:

```js
import assert from "node:assert/strict";
import test from "node:test";

import {
  initialMusicState,
  musicStorageKey,
  nextMusicStep,
  readStoredMuted,
  writeStoredMuted,
} from "./invitation-music.ts";

/** Feeds events from a state; returns where it ends and every command issued. */
function run(state, events) {
  const commands = [];
  for (const event of events) {
    const step = nextMusicStep(state, event);
    state = step.state;
    if (step.command) commands.push(step.command);
  }
  return { state, commands };
}

test("a guest who never muted starts idle; one who did starts muted", () => {
  assert.equal(initialMusicState(false), "idle");
  assert.equal(initialMusicState(true), "muted");
});

test("the first gesture starts the music, once", () => {
  assert.deepEqual(run("idle", ["gesture", "gesture"]), { state: "playing", commands: ["play"] });
});

test("a first tap on the icon starts the music rather than toggling it twice", () => {
  assert.deepEqual(nextMusicStep("idle", "toggle"), { state: "playing", command: "play", remember: null });
});

test("tapping the icon while playing mutes and remembers it; tapping again unmutes", () => {
  assert.deepEqual(nextMusicStep("playing", "toggle"), { state: "muted", command: "pause", remember: "muted" });
  assert.deepEqual(nextMusicStep("muted", "toggle"), { state: "playing", command: "play", remember: "unmuted" });
});

test("a muted guest's gestures do not start the music", () => {
  assert.deepEqual(run("muted", ["gesture", "gesture"]), { state: "muted", commands: [] });
});

test("hiding the page pauses and showing it resumes, only if it was playing", () => {
  assert.deepEqual(run("playing", ["hidden", "visible"]), { state: "playing", commands: ["pause", "play"] });
  assert.deepEqual(run("muted", ["hidden", "visible"]), { state: "muted", commands: [] });
  assert.deepEqual(run("idle", ["hidden", "visible"]), { state: "idle", commands: [] });
});

test("a refused play() (a swipe is not a gesture on iOS) goes back to idle, and the next tap starts it", () => {
  assert.deepEqual(run("idle", ["gesture", "rejected", "gesture"]), {
    state: "playing",
    commands: ["play", "play"],
  });
  assert.deepEqual(run("muted", ["rejected"]), { state: "muted", commands: [] });
});

test("a file that cannot play ends in error, and nothing brings it back", () => {
  assert.deepEqual(run("playing", ["failed", "toggle", "gesture", "visible"]), {
    state: "error",
    commands: ["pause"],
  });
});

test("the remembered choice is per wedding", () => {
  assert.equal(musicStorageKey("w-1"), "invitation-music:w-1");
  assert.notEqual(musicStorageKey("w-1"), musicStorageKey("demo:ciao-amore"));
});

test("the stored choice survives a round trip", () => {
  const store = new Map();
  const storage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => void store.set(key, value),
    removeItem: (key) => void store.delete(key),
  };
  writeStoredMuted(storage, "k", "muted");
  assert.equal(readStoredMuted(storage, "k"), true);
  writeStoredMuted(storage, "k", "unmuted");
  assert.equal(readStoredMuted(storage, "k"), false);
});

test("a storage that throws (private window) reads as not muted and forgets silently", () => {
  const throwing = {
    getItem() { throw new Error("SecurityError"); },
    setItem() { throw new Error("QuotaExceededError"); },
    removeItem() { throw new Error("SecurityError"); },
  };
  assert.equal(readStoredMuted(throwing, "k"), false);
  assert.doesNotThrow(() => writeStoredMuted(throwing, "k", "muted"));
  assert.equal(readStoredMuted(null, "k"), false);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs --test landing/src/lib/invitation-music.test.mjs`
Expected: FAIL — cannot find module `./invitation-music.ts`.

- [ ] **Step 3: Write the state machine**

Create `landing/src/lib/invitation-music.ts`:

```ts
/**
 * How the invitation's music behaves, apart from the DOM so it can be tested
 * (docs/superpowers/specs/2026-10-02-invitation-music-design.md, D5).
 *
 * `InvitationMusic.tsx` turns browser events into `MusicEvent`s and carries
 * out the command each step returns. Nothing here touches `window`.
 */

export type MusicState = "idle" | "playing" | "muted" | "error";

export type MusicEvent =
  /** The first tap, click or key press on the page — never one on the icon. */
  | "gesture"
  /** A tap on the icon. */
  | "toggle"
  | "hidden"
  | "visible"
  /** `audio.play()` was refused: no gesture the browser accepts (a swipe on iOS). */
  | "rejected"
  /** The file cannot be loaded or decoded. */
  | "failed";

export type MusicStep = {
  state: MusicState;
  command: "play" | "pause" | null;
  /** What to remember in the guest's browser for this wedding, when it changed. */
  remember: "muted" | "unmuted" | null;
};

/** A guest who muted this wedding on a previous visit is not played to again. */
export function initialMusicState(storedMuted: boolean): MusicState {
  return storedMuted ? "muted" : "idle";
}

export function nextMusicStep(state: MusicState, event: MusicEvent): MusicStep {
  const stay: MusicStep = { state, command: null, remember: null };
  // A file that cannot play stays silent: the component hides the icon.
  if (state === "error") return stay;

  switch (event) {
    case "gesture":
      return state === "idle" ? { state: "playing", command: "play", remember: null } : stay;
    case "toggle":
      // From idle too: the icon is how a guest starts it before any other tap.
      if (state === "playing") return { state: "muted", command: "pause", remember: "muted" };
      return { state: "playing", command: "play", remember: state === "muted" ? "unmuted" : null };
    case "hidden":
      // The state stays "playing": it is what the guest wants once they are back.
      return state === "playing" ? { state, command: "pause", remember: null } : stay;
    case "visible":
      return state === "playing" ? { state, command: "play", remember: null } : stay;
    case "rejected":
      // Back to waiting: the next real tap starts it.
      return state === "playing" ? { state: "idle", command: null, remember: null } : stay;
    case "failed":
      return { state: "error", command: "pause", remember: null };
  }
}

export function musicStorageKey(weddingKey: string): string {
  return `invitation-music:${weddingKey}`;
}

type MusicStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** Whether this guest muted this wedding before. A storage that throws reads as "no". */
export function readStoredMuted(storage: MusicStorage | null | undefined, key: string): boolean {
  try {
    return storage?.getItem(key) === "muted";
  } catch {
    return false;
  }
}

/** Remembers the guest's choice. A storage that throws (private window) forgets it. */
export function writeStoredMuted(
  storage: MusicStorage | null | undefined,
  key: string,
  remember: "muted" | "unmuted",
): void {
  try {
    if (remember === "muted") storage?.setItem(key, "muted");
    else storage?.removeItem(key);
  } catch {
    // The choice lasts for this visit only.
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs --test landing/src/lib/invitation-music.test.mjs`
Expected: PASS, 11 tests. Then `npm test`: PASS.

- [ ] **Step 5: Checkpoint**

Commit only if authorised: `git add landing/src/lib/invitation-music.ts landing/src/lib/invitation-music.test.mjs` — `feat(invitation): decide when the music starts, stops and stays quiet`.

---

### Task 4: The sticky player on the invitation and the demos

**Files:**
- Create: `landing/src/components/invitation/InvitationMusic.tsx`
- Create: `landing/src/components/invitation/invitation-music.css`
- Modify: `landing/src/lib/assemble-invitation-page.ts` (type `InvitationPageData`, after the `dayOf` field)
- Modify: `landing/src/actions/invitation-page-actions.ts` (end of `getInvitationPage`)
- Modify: `landing/src/app/[locale]/invitation/[slug]/page.tsx` (the final render)
- Modify: `landing/src/app/[locale]/invitation/demo/[themeId]/page.tsx` (the final render)
- Modify: `landing/messages/{fr,en,de,es,pt,it,ar,zh,ja}.json` (`Invitation.music.label`)

**Interfaces:**
- Consumes: Task 2 `resolveMusicSource`, `musicPublicUrl`; Task 3 everything.
- Produces: `InvitationPageData.music?: { src: string } | null`; `<InvitationMusic src weddingKey accentColor themeId />`; the DOM hook `button.invitation-music[data-theme="<id>"][data-state="<state>"]`.

- [ ] **Step 1: Carry the music from the database to the page**

In `landing/src/lib/assemble-invitation-page.ts`, inside `export type InvitationPageData = { … }`, after the `dayOf?: { photos: boolean };` field, add:

```ts
  /**
   * The invitation's music, when the site owns the `custom-music` option and
   * the couple left it on. Set by the public loader from `resolve_public_slug`,
   * which blanks it otherwise; the editor's preview never has it, and no theme
   * reads it — the page mounts the player beside the theme.
   */
  music?: { src: string } | null;
```

In `landing/src/actions/invitation-page-actions.ts`, add to the imports:

```ts
import { musicPublicUrl, resolveMusicSource } from "@shared/lib/music";
```

and replace the end of `getInvitationPage`:

```ts
  const dayOf = readDayOf(dayOfRes.data);
  return dayOf ? { ...page, dayOf } : page;
}
```

with:

```ts
  const dayOf = readDayOf(dayOfRes.data);
  // Already blanked by `resolve_public_slug` when the option was not bought or
  // the couple switched it off.
  const music = resolveMusicSource(
    {
      music_enabled: (site.music_enabled as boolean | null) ?? null,
      music_track: (site.music_track as string | null) ?? null,
      music_upload_path: (site.music_upload_path as string | null) ?? null,
    },
    (path) => musicPublicUrl(process.env.NEXT_PUBLIC_SUPABASE_URL!, path),
  );
  return { ...page, ...(dayOf ? { dayOf } : {}), music };
}
```

- [ ] **Step 2: Write the component**

Create `landing/src/components/invitation/InvitationMusic.tsx`:

```tsx
"use client";

import { Music2, VolumeX } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import {
  type MusicEvent,
  type MusicState,
  initialMusicState,
  musicStorageKey,
  nextMusicStep,
  readStoredMuted,
  writeStoredMuted,
} from "@/lib/invitation-music";

import "./invitation-music.css";

/**
 * The invitation's music and its sticky icon
 * (docs/superpowers/specs/2026-10-02-invitation-music-design.md, D5–D6).
 *
 * Mounted by the invitation and demo routes beside the theme, never inside
 * it: no theme knows about it, and a new theme gets it for free. The
 * behaviour lives in `@/lib/invitation-music`; this file only wires the
 * browser to it.
 */
export type InvitationMusicProps = {
  src: string;
  /** The wedding id, or `demo:<themeId>` — keys the guest's remembered choice. */
  weddingKey: string;
  accentColor: string;
  /** Lets a theme restyle the icon: `.invitation-music[data-theme="<id>"]`. */
  themeId: string;
};

/** Events browsers accept as the gesture that unlocks audio. `scroll` is not one. */
const GESTURES = ["click", "touchend", "keydown"] as const;
const TARGET_VOLUME = 0.6;
const FADE_MS = 2000;

const subscribeNever = () => () => {};

export function InvitationMusic(props: InvitationMusicProps) {
  // False on the server and inside a frame — the home page shows each demo in
  // a phone mock-up through an iframe, and a tap there must not start music
  // on the marketing page. True on the invitation itself.
  const canPlay = useSyncExternalStore(
    subscribeNever,
    () => window.self === window.top,
    () => false,
  );
  return canPlay ? <MusicPlayer {...props} /> : null;
}

function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Raises the volume over FADE_MS. iOS ignores `volume` (always 1): no fade there. */
function fadeIn(audio: HTMLAudioElement) {
  const start = performance.now();
  const frame = (now: number) => {
    const progress = Math.min(1, (now - start) / FADE_MS);
    audio.volume = TARGET_VOLUME * progress;
    if (progress < 1 && !audio.paused) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function MusicPlayer({ src, weddingKey, accentColor, themeId }: InvitationMusicProps) {
  const t = useTranslations("Invitation.music");
  const storageKey = musicStorageKey(weddingKey);
  // Lazy: this component only ever renders in the browser (see InvitationMusic).
  const [state, setState] = useState<MusicState>(() =>
    initialMusicState(readStoredMuted(browserStorage(), storageKey)),
  );
  const stateRef = useRef(state);
  const audioRef = useRef<HTMLAudioElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  // Each play() gets a number; only the latest one may report a refusal. A
  // quick double tap otherwise lets the first, interrupted play() knock the
  // second one's "playing" back to "idle".
  const playToken = useRef(0);

  const dispatch = useCallback(
    function dispatch(event: MusicEvent) {
      const step = nextMusicStep(stateRef.current, event);
      stateRef.current = step.state;
      setState(step.state);
      if (step.remember) writeStoredMuted(browserStorage(), storageKey, step.remember);

      const audio = audioRef.current;
      if (!audio) return;
      if (step.command === "pause") audio.pause();
      if (step.command === "play") {
        const token = ++playToken.current;
        audio.volume = 0;
        audio.play().then(
          () => fadeIn(audio),
          () => {
            if (token === playToken.current) dispatch("rejected");
          },
        );
      }
    },
    [storageKey],
  );

  // While idle, the next tap, click or key press anywhere starts the music.
  useEffect(() => {
    if (state !== "idle") return;
    const onGesture = (event: Event) => {
      // The icon dispatches its own toggle; counting its tap here as well
      // would start the music and stop it at once.
      if (event.target instanceof Node && buttonRef.current?.contains(event.target)) return;
      dispatch("gesture");
    };
    for (const type of GESTURES) document.addEventListener(type, onGesture, true);
    return () => {
      for (const type of GESTURES) document.removeEventListener(type, onGesture, true);
    };
  }, [state, dispatch]);

  // A guest who switches tabs or locks the phone is not played to.
  useEffect(() => {
    const onVisibility = () => dispatch(document.hidden ? "hidden" : "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [dispatch]);

  // A file that cannot play leaves no button that does nothing.
  if (state === "error") return null;

  const playing = state === "playing";
  return (
    <>
      <audio
        ref={audioRef}
        src={src}
        loop
        // Nothing downloads before the music starts: a guest who never hears
        // it does not pay for it in mobile data.
        preload='none'
        onError={() => {
          console.warn(`[InvitationMusic] cannot play ${src}`);
          dispatch("failed");
        }}
      />
      <button
        ref={buttonRef}
        type='button'
        className='invitation-music'
        data-theme={themeId}
        data-state={state}
        style={{ "--invitation-music-accent": accentColor } as CSSProperties}
        // One label in every state: aria-pressed says whether it plays, and a
        // label that changed with it would announce the opposite.
        aria-label={t("label")}
        aria-pressed={playing}
        onClick={() => dispatch("toggle")}
      >
        {playing ? (
          <span className='invitation-music__bars' aria-hidden='true'>
            <i />
            <i />
            <i />
          </span>
        ) : state === "muted" ? (
          <VolumeX size={18} aria-hidden='true' />
        ) : (
          <Music2 size={18} aria-hidden='true' />
        )}
      </button>
    </>
  );
}
```

Match the file's quote style to its neighbours if lint says so (some landing files use single quotes in JSX attributes, others double) — run the formatter the repo uses, do not hand-reformat other files.

- [ ] **Step 3: Write the stylesheet**

Create `landing/src/components/invitation/invitation-music.css`:

```css
/*
 * The invitation's music icon (InvitationMusic.tsx).
 *
 * Top right: belle-rive's designer put the music there, and ciao-amore's
 * scroll-to-top button already holds the bottom right corner. z-index 90 sits
 * above the themes' floating navs (50-60) and below their opening overlays
 * (100), so it appears once an invitation is opened.
 *
 * Rendered beside the theme's Root, so no theme rule reaches it by accident;
 * a theme that wants it elsewhere writes `.invitation-music[data-theme="<id>"]`
 * in its own responsive.css.
 */
.invitation-music {
  position: fixed;
  z-index: 90;
  top: calc(18px + env(safe-area-inset-top, 0px));
  right: 18px;
  display: grid;
  place-items: center;
  /* Square, and stated three ways, so nothing inherited can stretch it. */
  width: 44px;
  height: 44px;
  min-width: 44px;
  max-width: 44px;
  flex: none;
  padding: 0;
  border: 1px solid color-mix(in srgb, var(--invitation-music-accent) 45%, transparent);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(8px);
  color: var(--invitation-music-accent);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.invitation-music:focus-visible {
  outline: 2px solid var(--invitation-music-accent);
  outline-offset: 3px;
}

/* Waiting for the first tap: a slow halo says there is sound to be had. */
.invitation-music[data-state="idle"] {
  animation: invitation-music-pulse 2.4s ease-in-out infinite;
}

.invitation-music__bars {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 16px;
}

.invitation-music__bars i {
  width: 3px;
  height: 100%;
  border-radius: 2px;
  background: currentColor;
  transform-origin: bottom;
  animation: invitation-music-bar 0.9s ease-in-out infinite alternate;
}

.invitation-music__bars i:nth-child(2) {
  animation-delay: 0.3s;
}

.invitation-music__bars i:nth-child(3) {
  animation-delay: 0.6s;
}

@keyframes invitation-music-pulse {
  50% {
    box-shadow:
      0 0 0 7px color-mix(in srgb, var(--invitation-music-accent) 18%, transparent),
      0 6px 18px rgba(0, 0, 0, 0.12);
  }
}

@keyframes invitation-music-bar {
  from {
    transform: scaleY(0.3);
  }
  to {
    transform: scaleY(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .invitation-music,
  .invitation-music__bars i {
    animation: none;
  }
}
```

- [ ] **Step 4: Mount it on the invitation**

In `landing/src/app/[locale]/invitation/[slug]/page.tsx`, add the import:

```ts
import { InvitationMusic } from "@/components/invitation/InvitationMusic";
```

and replace:

```tsx
  const { Root } = resolveTheme(page.themeId);

  return <Root data={toInvitationData(page)} />;
}
```

with:

```tsx
  const theme = resolveTheme(page.themeId);
  const { Root } = theme;

  return (
    <>
      <Root data={toInvitationData(page)} />
      {page.music ? (
        <InvitationMusic
          src={page.music.src}
          weddingKey={page.weddingId}
          accentColor={theme.accentColor}
          themeId={theme.id}
        />
      ) : null}
    </>
  );
}
```

Keep the comment block above it unchanged.

- [ ] **Step 5: Mount it on the demos**

In `landing/src/app/[locale]/invitation/demo/[themeId]/page.tsx`, add the imports:

```ts
import { InvitationMusic } from "@/components/invitation/InvitationMusic";
import { musicPublicUrl, resolveMusicSource } from "@shared/lib/music";
```

and replace:

```tsx
  const { Root, demoData } = theme;
  return <Root data={demoDataFor(demoData, fixture)} />;
}
```

with:

```tsx
  const { Root, demoData } = theme;
  // Every demo plays the library's default track: a prospect hears the
  // option before buying it. Silent inside the home page's mock-up (see
  // InvitationMusic).
  const music = resolveMusicSource(
    { music_enabled: true, music_track: null, music_upload_path: null },
    (path) => musicPublicUrl(process.env.NEXT_PUBLIC_SUPABASE_URL!, path),
  );
  return (
    <>
      <Root data={demoDataFor(demoData, fixture)} />
      {music ? (
        <InvitationMusic
          src={music.src}
          weddingKey={`demo:${theme.id}`}
          accentColor={theme.accentColor}
          themeId={theme.id}
        />
      ) : null}
    </>
  );
}
```

- [ ] **Step 6: Add the label in the 9 landing locales**

```bash
cp -R landing/messages "$TMPDIR/landing-messages.before-music"
node -e '
const fs = require("fs");
const labels = { fr: "Musique", en: "Music", de: "Musik", es: "Música", pt: "Música", it: "Musica", ar: "الموسيقى", zh: "音乐", ja: "音楽" };
for (const [locale, label] of Object.entries(labels)) {
  const file = `landing/messages/${locale}.json`;
  const messages = JSON.parse(fs.readFileSync(file, "utf8"));
  messages.Invitation.music = { label };
  fs.writeFileSync(file, JSON.stringify(messages, null, 2) + "\n");
}'
git diff --stat landing/messages
```

Expected: each of the 9 files changes by a handful of lines (the new `music` object and one comma). If any file shows hundreds of changed lines, its formatting differed: restore it from `$TMPDIR/landing-messages.before-music/` and add the key by hand at the end of its `Invitation` object.

- [ ] **Step 7: Lint and type-check the touched files**

Run (from `landing/`): `npx eslint src/components/invitation/InvitationMusic.tsx src/lib/invitation-music.ts src/actions/invitation-page-actions.ts src/lib/assemble-invitation-page.ts "src/app/[locale]/invitation/[slug]/page.tsx" "src/app/[locale]/invitation/demo/[themeId]/page.tsx"`
Expected: no error in these files.

Run (from `landing/`): `npx tsc --noEmit -p . 2>&1 | grep -E "InvitationMusic|invitation-music|invitation-page-actions|assemble-invitation-page|invitation/\[slug\]|demo/\[themeId\]"`
Expected: no output (errors elsewhere predate this work and are not this task's).

- [ ] **Step 8: Put a test track in the local bucket**

```bash
ffmpeg -y -loglevel error -f lavfi -i "sine=frequency=440:duration=30" -ac 2 -b:a 128k "$TMPDIR/studio-default.mp3"
eval "$(npx supabase status -o env | grep -E '^(API_URL|SERVICE_ROLE_KEY)=')"
curl -sS -X POST "$API_URL/storage/v1/object/music/library/studio-default.mp3" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" -H "Content-Type: audio/mpeg" \
  --data-binary @"$TMPDIR/studio-default.mp3"
curl -sI "$API_URL/storage/v1/object/public/music/library/studio-default.mp3" | head -1
```

Expected: a JSON `{"Key":"music/library/studio-default.mp3",…}`, then `HTTP/1.1 200 OK`. Confirm `$API_URL` is `http://127.0.0.1:54321` — never run this against the remote project.

- [ ] **Step 9: Give a local wedding the option**

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -At -c "
  select s.slug, s.theme_id, coalesce(st.wedding_code, '') from sites s
  left join settings st on st.wedding_id = s.wedding_id
  where s.status = 'published' and not coalesce(s.is_demo, false) limit 5;"
```

Pick one slug (note its wedding code — the guest gate may ask for it), then, **local database only**:

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "
  update sites set extras = array_append(coalesce(extras, '{}'), 'custom-music')
  where slug = '<slug>' and not ('custom-music' = any(coalesce(extras, '{}')));"
```

- [ ] **Step 10: Check it in the real browser**

Start landing: `npm run dev:landing` (port 3010; `landing/.env.local` already points at the local Supabase). If it refuses to start after a crash, remove `landing/.next/dev/lock`.

Open `http://localhost:3010/fr/invitation/<slug>` at 375 px wide and check, with screenshots:
1. The icon shows top right, a music note with a slow halo, not covering the theme's own controls.
2. Tap anywhere on the page (not the icon): the tone plays, the icon turns into moving bars, the volume rises over ~2 s (desktop Chrome).
3. Tap the icon: silence, crossed speaker. Reload: still crossed speaker, and tapping the page does **not** start it. Tap the icon: plays again. Reload: tap the page starts it.
4. **Review Focus 2:** double-tap the icon fast, several times. It must end consistent: bars ⇔ sound, crossed speaker ⇔ silence.
5. Switch to another tab and back: the music paused while away, resumes on return.
6. `http://localhost:3010/fr/invitation/demo/<theme-id>` for one theme: icon present, the tone plays on first tap.
7. **Review Focus 5:** `http://localhost:3010/fr` (home page): no icon in the phone mock-up, and tapping inside the mock-up plays nothing.
8. Temporarily rename the local object (`curl -X POST "$API_URL/storage/v1/object/move" -H "Authorization: Bearer $SERVICE_ROLE_KEY" -H "Content-Type: application/json" -d '{"bucketId":"music","sourceKey":"library/studio-default.mp3","destinationKey":"library/moved.mp3"}'`), reload the demo, tap: the icon disappears, a `[InvitationMusic] cannot play` warning in the console, the page is otherwise intact. Move it back (swap `sourceKey`/`destinationKey`).
9. Remove the option from the local wedding (`update sites set extras = array_remove(extras, 'custom-music') where slug = '<slug>';`), reload: no icon. Put it back for the next tasks.

- [ ] **Step 11: Checkpoint**

Commit only if authorised — the files of this task only. Message: `feat(invitation): play the couple's music, with a sticky icon to mute it`.

---

### Task 5: The dashboard menu lists « Musique » only for those who bought it

**Files:**
- Modify: `dashboard/src/components/navigation/nav-config.ts`
- Modify: `dashboard/src/components/dashboard/Sidebar.tsx`
- Modify: `dashboard/src/components/dashboard/DashboardLayout.tsx`
- Modify: `package.json` (root — the `test` script's file list)
- Modify: `dashboard/messages/{fr,en,de,es,pt,it,ar,zh,ja}.json` (`Sidebar.sections.invitation.items.music`)
- Test: `dashboard/src/components/navigation/nav-config.test.mjs`

**Interfaces:**
- Produces: `NavItemDef.requiresExtra?: string`; `visibleNavSections(sections: NavSectionDef[], extras: readonly string[] | null): NavSectionDef[]`; `<Sidebar … extras={string[] | null} />`.

- [ ] **Step 1: Write the failing test**

Create `dashboard/src/components/navigation/nav-config.test.mjs`:

```js
import assert from "node:assert/strict";
import test from "node:test";

import { NAV_SECTIONS, visibleNavSections } from "./nav-config.ts";

const hrefs = (sections) => sections.flatMap((section) => (section.items ?? []).map((item) => item.href));

test("the music screen is listed only for a site that bought the option", () => {
  assert.ok(hrefs(visibleNavSections(NAV_SECTIONS, ["custom-music"])).includes("/musique"));
  assert.ok(!hrefs(visibleNavSections(NAV_SECTIONS, [])).includes("/musique"));
  assert.ok(!hrefs(visibleNavSections(NAV_SECTIONS, ["custom-domain"])).includes("/musique"));
});

test("while the site is still being read, nothing tied to an extra is listed", () => {
  assert.ok(!hrefs(visibleNavSections(NAV_SECTIONS, null)).includes("/musique"));
});

test("items that need no extra are always listed, in their order", () => {
  const withoutMusic = hrefs(NAV_SECTIONS).filter((href) => href !== "/musique");
  assert.deepEqual(hrefs(visibleNavSections(NAV_SECTIONS, [])), withoutMusic);
  assert.equal(visibleNavSections(NAV_SECTIONS, []).length, NAV_SECTIONS.length);
});
```

In the root `package.json`, append ` dashboard/src/components/navigation/*.test.mjs` to the end of the `test` script's file list (after `dashboard/src/lib/db/*.test.mjs`). Change nothing else in that file — it holds uncommitted user changes.

- [ ] **Step 2: Run it to verify it fails**

Run: `node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs --test dashboard/src/components/navigation/nav-config.test.mjs`
Expected: FAIL — `visibleNavSections` is not exported.

- [ ] **Step 3: Implement the filter**

In `dashboard/src/components/navigation/nav-config.ts`:

Replace the `NavItemDef` type with:

```ts
export type NavItemDef = {
  /** i18n key under `Sidebar.sections.<section>.items` */
  key: string;
  href: string;
  /**
   * A checkout extra (`sites.extras`) the site must own for the item to be
   * listed — a screen for an option the couple did not buy is a door to
   * nothing.
   */
  requiresExtra?: string;
};
```

In the `invitation` section's `items`, after `{ key: "playlist", href: "/playlist" },`, add:

```ts
      { key: "music", href: "/musique", requiresExtra: "custom-music" },
```

At the end of the file, add:

```ts
/**
 * The sections as this site sees them: items tied to an extra it did not buy
 * are left out. `extras` is null while the site is still being read, which
 * lists none of them rather than flashing one that then disappears.
 */
export function visibleNavSections(
  sections: NavSectionDef[],
  extras: readonly string[] | null,
): NavSectionDef[] {
  return sections.map((section) =>
    section.items
      ? {
          ...section,
          items: section.items.filter(
            (item) => !item.requiresExtra || (extras ?? []).includes(item.requiresExtra),
          ),
        }
      : section,
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs --test dashboard/src/components/navigation/nav-config.test.mjs`
Expected: PASS, 3 tests. Then `npm test`: PASS (the new glob is included).

If the import fails on `lucide-react` under Node, report it rather than restructuring `nav-config.ts`.

- [ ] **Step 5: Feed the site's extras to the sidebar**

In `dashboard/src/components/dashboard/DashboardLayout.tsx`:

After `const [siteLocale, setSiteLocale] = useState<string | null>(null);`, add:

```ts
  /** `sites.extras` — the options bought at checkout; null while unknown. */
  const [siteExtras, setSiteExtras] = useState<string[] | null>(null);
```

Change the site query's select from `"slug, status, languages"` to `"slug, status, languages, extras"`, and update the comment above it to say `status`, `languages` and `extras` ride along.

After `setSiteLocale(site.languages?.[0] ?? "fr");`, add:

```ts
            setSiteExtras(site.extras ?? []);
```

Change `<Sidebar slug={slug} siteLocale={siteLocale} isPublished={isPublished} />` to:

```tsx
      <Sidebar slug={slug} siteLocale={siteLocale} isPublished={isPublished} extras={siteExtras} />
```

In `dashboard/src/components/dashboard/Sidebar.tsx`:

Change the import `import { NAV_SECTIONS } from "@/components/navigation/nav-config";` to:

```ts
import { NAV_SECTIONS, visibleNavSections } from "@/components/navigation/nav-config";
```

Add `extras,` to the destructured props after `isPublished,`, and to the props type after the `isPublished?: boolean | null;` member:

```ts
  /** `sites.extras`, null while still being read: decides the items an option unlocks. */
  extras?: string[] | null;
```

Change `{NAV_SECTIONS.map((section) => (` to:

```tsx
            {visibleNavSections(NAV_SECTIONS, extras ?? null).map((section) => (
```

- [ ] **Step 6: Add the menu label in the 9 dashboard locales**

```bash
cp -R dashboard/messages "$TMPDIR/dashboard-messages.before-music-nav"
node -e '
const fs = require("fs");
const labels = { fr: "Musique", en: "Music", de: "Musik", es: "Música", pt: "Música", it: "Musica", ar: "الموسيقى", zh: "音乐", ja: "音楽" };
for (const [locale, label] of Object.entries(labels)) {
  const file = `dashboard/messages/${locale}.json`;
  const messages = JSON.parse(fs.readFileSync(file, "utf8"));
  messages.Sidebar.sections.invitation.items.music = label;
  fs.writeFileSync(file, JSON.stringify(messages, null, 2) + "\n");
}'
git diff --stat dashboard/messages
```

These files already carry uncommitted user changes, so `git diff --stat` shows those too. Compare instead with the backup: `diff -r "$TMPDIR/dashboard-messages.before-music-nav" dashboard/messages` — expected: one added `"music": …` line and one comma per file. Anything more: restore that file from the backup and add the key by hand.

- [ ] **Step 7: Lint the touched files**

Run (from `dashboard/`): `npx eslint src/components/navigation/nav-config.ts src/components/dashboard/Sidebar.tsx src/components/dashboard/DashboardLayout.tsx`
Expected: no new error in these files (compare with `git stash`-free judgement: an error on a line you did not touch predates you).

- [ ] **Step 8: Checkpoint**

Commit only if authorised and only once the user's own changes to these files are committed: `feat(dashboard): list the music screen for couples who bought it`.

---

### Task 6: The dashboard « Musique » screen and its actions

**Files:**
- Create: `dashboard/src/types/music.ts`
- Create: `dashboard/src/actions/music-actions.ts`
- Create: `dashboard/src/components/music/MusicSettings.tsx`
- Create: `dashboard/src/app/[locale]/musique/page.tsx`
- Modify: `dashboard/messages/{fr,en,de,es,pt,it,ar,zh,ja}.json` (new `Music` section)

**Interfaces:**
- Consumes: Task 1 columns and bucket; Task 2 `MUSIC_OPTION_ID`, `MUSIC_BUCKET`, `MUSIC_LIBRARY`, `DEFAULT_MUSIC_TRACK_ID`, `findMusicTrack`, `libraryTrackPath`, `musicPublicUrl`, `validateMusicUpload`, `musicObjectName`, `isOwnMusicPath`, `musicDisplayName`; `requireWedding()` from `@/lib/db/current-wedding` (returns `{ supabase, user, weddingId }`); `ActionResult` from `@/types`; `ToggleField` from `@/components/editor/fields/ToggleField`; `createClient` from `@/utils/supabase/client`.
- Produces: `getMusicSettings(): Promise<MusicSettingsView>`, `setMusicEnabled(enabled: boolean): Promise<ActionResult>`, `chooseLibraryTrack(trackId: string): Promise<ActionResult>`, `createMusicUploadUrl(file: { name: string; size: number }): Promise<MusicUploadTicket>`, `confirmMusicUpload(path: string): Promise<ActionResult>`.

- [ ] **Step 1: Write the types**

Create `dashboard/src/types/music.ts`:

```ts
/** What the « Musique » screen shows (docs/superpowers/specs/2026-10-02-invitation-music-design.md, D7). */
export type MusicLibraryItem = {
  id: string;
  title: string;
  artist: string;
  url: string;
  isDefault: boolean;
};

export type MusicSettingsView =
  | { included: false }
  | {
      included: true;
      enabled: boolean;
      /** The library choice; the default when none was made or it was removed. */
      trackId: string;
      /** The couple's own file, which plays instead of `trackId` when set. */
      upload: { name: string; url: string } | null;
      library: MusicLibraryItem[];
    };

export type MusicUploadTicket =
  | { success: true; path: string; token: string; contentType: string }
  | { success: false; error: string };
```

- [ ] **Step 2: Write the actions**

Create `dashboard/src/actions/music-actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";

import { requireWedding } from "@/lib/db/current-wedding";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { ActionResult } from "@/types";
import type { MusicSettingsView, MusicUploadTicket } from "@/types/music";
import {
  DEFAULT_MUSIC_TRACK_ID,
  MUSIC_LIBRARY,
  findMusicTrack,
} from "@shared/data/music-library";
import {
  MUSIC_BUCKET,
  MUSIC_OPTION_ID,
  isOwnMusicPath,
  libraryTrackPath,
  musicDisplayName,
  musicObjectName,
  musicPublicUrl,
  validateMusicUpload,
} from "@shared/lib/music";

/**
 * The couple's invitation music
 * (docs/superpowers/specs/2026-10-02-invitation-music-design.md, D1, D7).
 *
 * Every write checks the `custom-music` option here, on the server, although
 * `resolve_public_slug` already refuses to play anything without it: a
 * screen that only hides its buttons is not a paywall.
 *
 * Storage writes use the service role — the `music` bucket has no policy for
 * couples — and only ever touch the folder named after the session's own
 * wedding.
 */

const LOCALES = ["fr", "en", "de", "es", "pt", "it", "ar", "zh", "ja"] as const;

const NOT_INCLUDED = "Option non incluse dans votre commande";
const SAVE_FAILED = "Erreur lors de l'enregistrement";
const UPLOAD_ERRORS = {
  type: "Format non supporté (MP3 ou M4A uniquement)",
  size: "Le fichier dépasse 15 Mo",
  empty: "Ce fichier est vide",
} as const;

function revalidateMusic() {
  for (const locale of LOCALES) revalidatePath(`/${locale}/musique`);
}

function publicUrl(path: string): string {
  return musicPublicUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", path);
}

/** The session's wedding, its client, and whether its site owns the option. */
async function loadMusicContext() {
  const { supabase, weddingId } = await requireWedding();
  const { data: site, error } = await supabase
    .from("sites")
    .select("extras")
    .eq("wedding_id", weddingId)
    .maybeSingle();
  if (error) throw new Error(error.message);

  return {
    supabase,
    weddingId,
    included: ((site?.extras as string[] | null) ?? []).includes(MUSIC_OPTION_ID),
  };
}

/**
 * For write actions called from the client: a missing session or a missing
 * option becomes the French `{ success: false }` the screen toasts, not a
 * throw (action-conventions.md).
 */
async function musicContextForWrite() {
  let context: Awaited<ReturnType<typeof loadMusicContext>>;
  try {
    context = await loadMusicContext();
  } catch {
    return { failure: { success: false, error: "Vous devez être connecté" } as const };
  }
  if (!context.included) return { failure: { success: false, error: NOT_INCLUDED } as const };
  return { ...context, failure: null };
}

/**
 * Removes every object in the couple's folder except `keep` — the file that
 * plays, if any. Runs after the row is written, so a failure here leaves an
 * unused file, never a row pointing at a deleted one; it is logged, not
 * reported to the couple.
 */
async function sweepMusicFolder(weddingId: string, keep: string | null) {
  const bucket = supabaseAdmin.storage.from(MUSIC_BUCKET);
  const { data: objects, error } = await bucket.list(weddingId, { limit: 100 });
  if (error) {
    console.error("[music] cannot list the couple's folder:", error.message);
    return;
  }
  const stale = (objects ?? [])
    .map((object) => `${weddingId}/${object.name}`)
    .filter((path) => path !== keep);
  if (stale.length === 0) return;

  const { error: removeError } = await bucket.remove(stale);
  if (removeError) console.error("[music] cannot remove old uploads:", removeError.message);
}

/** Read action for the page: throws on a real database error. */
export async function getMusicSettings(): Promise<MusicSettingsView> {
  const { supabase, weddingId, included } = await loadMusicContext();
  if (!included) return { included: false };

  const { data, error } = await supabase
    .from("settings")
    .select("music_enabled, music_track, music_upload_path")
    .eq("wedding_id", weddingId)
    .maybeSingle();
  if (error) throw new Error(error.message);

  const uploadPath = (data?.music_upload_path as string | null) ?? null;
  return {
    included: true,
    enabled: (data?.music_enabled as boolean | null) ?? true,
    trackId: findMusicTrack(data?.music_track as string | null)?.id ?? DEFAULT_MUSIC_TRACK_ID,
    upload: uploadPath
      ? { name: musicDisplayName(uploadPath), url: publicUrl(uploadPath) }
      : null,
    library: MUSIC_LIBRARY.map((track) => ({
      id: track.id,
      title: track.title,
      artist: track.artist,
      url: publicUrl(libraryTrackPath(track.file)),
      isDefault: track.id === DEFAULT_MUSIC_TRACK_ID,
    })),
  };
}

export async function setMusicEnabled(enabled: boolean): Promise<ActionResult> {
  const context = await musicContextForWrite();
  if (context.failure) return context.failure;

  const { error } = await context.supabase
    .from("settings")
    .update({ music_enabled: enabled })
    .eq("wedding_id", context.weddingId);
  if (error) return { success: false, error: SAVE_FAILED };

  revalidateMusic();
  return { success: true };
}

/** Picks a library track; the couple's own file, if any, is deleted. */
export async function chooseLibraryTrack(trackId: string): Promise<ActionResult> {
  const context = await musicContextForWrite();
  if (context.failure) return context.failure;

  const track = findMusicTrack(trackId);
  if (!track) return { success: false, error: "Morceau introuvable" };

  const { error } = await context.supabase
    .from("settings")
    .update({ music_track: track.id, music_upload_path: null })
    .eq("wedding_id", context.weddingId);
  if (error) return { success: false, error: SAVE_FAILED };

  await sweepMusicFolder(context.weddingId, null);
  revalidateMusic();
  return { success: true };
}

/**
 * First half of an upload: a signed URL the browser sends the file to.
 *
 * The file never passes through this server: Vercel refuses a function
 * request body over 4.5 MB whatever `bodySizeLimit` says, and a song is
 * typically 5-10 MB.
 */
export async function createMusicUploadUrl(file: {
  name: string;
  size: number;
}): Promise<MusicUploadTicket> {
  const context = await musicContextForWrite();
  if (context.failure) return context.failure;

  const check = validateMusicUpload(file);
  if (!check.ok) return { success: false, error: UPLOAD_ERRORS[check.reason] };

  const path = musicObjectName(context.weddingId, file.name, Date.now());
  const { data, error } = await supabaseAdmin.storage
    .from(MUSIC_BUCKET)
    .createSignedUploadUrl(path);
  if (error || !data) return { success: false, error: "Erreur lors de l'envoi" };

  return { success: true, path: data.path, token: data.token, contentType: check.contentType };
}

/** Second half: records the uploaded file as the couple's music. */
export async function confirmMusicUpload(path: string): Promise<ActionResult> {
  const context = await musicContextForWrite();
  if (context.failure) return context.failure;

  if (!isOwnMusicPath(context.weddingId, path)) {
    return { success: false, error: "Fichier introuvable" };
  }
  const name = path.slice(context.weddingId.length + 1);
  const { data: objects, error: listError } = await supabaseAdmin.storage
    .from(MUSIC_BUCKET)
    .list(context.weddingId, { search: name });
  if (listError || !(objects ?? []).some((object) => object.name === name)) {
    return { success: false, error: "Fichier introuvable" };
  }

  const { error } = await context.supabase
    .from("settings")
    .update({ music_upload_path: path })
    .eq("wedding_id", context.weddingId);
  if (error) return { success: false, error: SAVE_FAILED };

  await sweepMusicFolder(context.weddingId, path);
  revalidateMusic();
  return { success: true };
}
```

- [ ] **Step 3: Write the screen**

Create `dashboard/src/components/music/MusicSettings.tsx`:

```tsx
"use client";

import { Pause, Play, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useRef, useState } from "react";
import { toast } from "sonner";

import {
  chooseLibraryTrack,
  confirmMusicUpload,
  createMusicUploadUrl,
  setMusicEnabled,
} from "@/actions/music-actions";
import { ToggleField } from "@/components/editor/fields/ToggleField";
import type { MusicSettingsView } from "@/types/music";
import { createClient } from "@/utils/supabase/client";
import {
  MUSIC_BUCKET,
  musicDisplayName,
  musicPublicUrl,
  validateMusicUpload,
} from "@shared/lib/music";

type Included = Extract<MusicSettingsView, { included: true }>;

const UPLOAD_ERROR_KEYS = { type: "error_type", size: "error_size", empty: "error_empty" } as const;

/** The « Musique » screen (docs/superpowers/specs/2026-10-02-invitation-music-design.md, D7). */
export function MusicSettings({ initial }: { initial: MusicSettingsView }) {
  const t = useTranslations("Music");

  if (!initial.included) {
    return (
      <Page title={t("title")}>
        <div className='mt-6 rounded-2xl border border-studio-lavande/40 bg-white p-6 shadow-studio-card'>
          <p className='font-medium text-studio-violet'>{t("not_included_title")}</p>
          <p className='mt-1 text-sm text-studio-violet/70'>{t("not_included_body")}</p>
        </div>
      </Page>
    );
  }

  return <IncludedMusicSettings initial={initial} />;
}

function Page({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className='min-h-screen bg-studio-creme p-4 md:p-8 lg:p-12'>
      <div className='mx-auto max-w-2xl'>
        <h1 className='font-heading text-h3 text-studio-violet'>{title}</h1>
        {children}
      </div>
    </div>
  );
}

const card = "mt-4 rounded-2xl border border-studio-lavande/40 bg-white p-4 shadow-studio-card";
const heading = "text-xs font-medium uppercase tracking-wide text-studio-violet/60";

function IncludedMusicSettings({ initial }: { initial: Included }) {
  const t = useTranslations("Music");
  const [enabled, setEnabled] = useState(initial.enabled);
  const [trackId, setTrackId] = useState(initial.trackId);
  const [upload, setUpload] = useState(initial.upload);
  const [confirmingTrack, setConfirmingTrack] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [listening, setListening] = useState<string | null>(null);
  const previewRef = useRef<HTMLAudioElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const libraryTrack =
    initial.library.find((track) => track.id === trackId) ?? initial.library[0];
  const current = upload
    ? { title: upload.name, subtitle: t("your_file"), url: upload.url }
    : { title: libraryTrack.title, subtitle: libraryTrack.artist, url: libraryTrack.url };

  const toggleListen = (url: string) => {
    const audio = previewRef.current;
    if (!audio) return;
    if (listening === url) {
      audio.pause();
      setListening(null);
      return;
    }
    audio.src = url;
    audio.play().then(
      () => setListening(url),
      () => {
        setListening(null);
        toast.error(t("listen_failed"));
      },
    );
  };

  const onToggle = async (next: boolean) => {
    const previous = enabled;
    setEnabled(next);
    const res = await setMusicEnabled(next);
    if (!res.success) {
      setEnabled(previous);
      toast.error(res.error ?? t("save_failed"));
    }
  };

  const choose = async (id: string) => {
    // Choosing a library track deletes the couple's file: ask first.
    if (upload && confirmingTrack !== id) {
      setConfirmingTrack(id);
      return;
    }
    setConfirmingTrack(null);
    const previous = { trackId, upload };
    setTrackId(id);
    setUpload(null);
    const res = await chooseLibraryTrack(id);
    if (!res.success) {
      setTrackId(previous.trackId);
      setUpload(previous.upload);
      toast.error(res.error ?? t("save_failed"));
      return;
    }
    toast.success(t("saved"));
  };

  const onFile = async (file: File | undefined) => {
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;

    const check = validateMusicUpload(file);
    if (!check.ok) {
      toast.error(t(UPLOAD_ERROR_KEYS[check.reason]));
      return;
    }

    setUploading(true);
    try {
      const ticket = await createMusicUploadUrl({ name: file.name, size: file.size });
      if (!ticket.success) {
        toast.error(ticket.error);
        return;
      }
      // Straight to Storage: the file never goes through our server (D7).
      const { error } = await createClient()
        .storage.from(MUSIC_BUCKET)
        .uploadToSignedUrl(ticket.path, ticket.token, file, { contentType: ticket.contentType });
      if (error) {
        toast.error(t("save_failed"));
        return;
      }
      const res = await confirmMusicUpload(ticket.path);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      setUpload({
        name: musicDisplayName(ticket.path),
        url: musicPublicUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", ticket.path),
      });
      toast.success(t("saved"));
    } finally {
      setUploading(false);
    }
  };

  const listenLabel = (url: string) => (listening === url ? t("pause") : t("listen"));

  return (
    <Page title={t("title")}>
      <p className='mt-2 text-sm leading-relaxed text-studio-violet/70'>{t("intro")}</p>
      <audio ref={previewRef} onEnded={() => setListening(null)} hidden />

      <section className={`${card} mt-6`}>
        <ToggleField
          label={t("enabled_label")}
          description={t("enabled_hint")}
          checked={enabled}
          onChange={(next) => void onToggle(next)}
        />
      </section>

      <section className={card}>
        <h2 className={heading}>{t("current_label")}</h2>
        <div className='mt-3'>
          <TrackRow
            title={current.title}
            subtitle={current.subtitle}
            playing={listening === current.url}
            listenLabel={listenLabel(current.url)}
            onListen={() => toggleListen(current.url)}
          />
        </div>
      </section>

      <section className={card}>
        <h2 className={heading}>{t("library_title")}</h2>
        <ul className='mt-1 divide-y divide-studio-lavande/30'>
          {initial.library.map((track) => {
            const selected = !upload && track.id === trackId;
            return (
              <li key={track.id} className='py-3'>
                <TrackRow
                  title={track.title}
                  subtitle={track.artist}
                  badge={track.isDefault ? t("default_badge") : undefined}
                  playing={listening === track.url}
                  listenLabel={listenLabel(track.url)}
                  onListen={() => toggleListen(track.url)}
                >
                  {selected ? (
                    <span className='text-xs font-medium text-studio-violet/60'>{t("chosen")}</span>
                  ) : (
                    <button
                      type='button'
                      onClick={() => void choose(track.id)}
                      className='min-h-11 rounded-lg border border-studio-lavande/60 px-3 text-sm text-studio-violet hover:bg-studio-lavande/10'
                    >
                      {t("choose")}
                    </button>
                  )}
                </TrackRow>
                {confirmingTrack === track.id ? (
                  <div
                    role='alert'
                    className='mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-studio-lavande/10 p-3 text-sm text-studio-violet'
                  >
                    <span className='min-w-0 flex-1'>{t("replace_confirm")}</span>
                    <button
                      type='button'
                      onClick={() => void choose(track.id)}
                      className='min-h-11 rounded-lg bg-studio-violet px-3 text-white'
                    >
                      {t("confirm")}
                    </button>
                    <button
                      type='button'
                      onClick={() => setConfirmingTrack(null)}
                      className='min-h-11 rounded-lg px-3'
                    >
                      {t("cancel")}
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      <section className={card}>
        <h2 className={heading}>{t("upload_title")}</h2>
        <p className='mt-1 text-xs text-studio-violet/60'>{t("upload_hint")}</p>
        <input
          ref={fileRef}
          id='music-upload'
          type='file'
          accept='.mp3,.m4a,.aac,audio/mpeg,audio/mp4,audio/aac'
          className='sr-only'
          disabled={uploading}
          onChange={(event) => void onFile(event.target.files?.[0])}
        />
        <label
          htmlFor='music-upload'
          aria-disabled={uploading}
          className='mt-3 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-studio-violet px-4 text-sm text-white aria-disabled:cursor-wait aria-disabled:opacity-60'
        >
          <Upload size={16} aria-hidden='true' />
          {uploading ? t("uploading") : t("upload_cta")}
        </label>
        <p className='mt-3 text-xs text-studio-violet/60'>{t("rights_notice")}</p>
      </section>
    </Page>
  );
}

function TrackRow({
  title,
  subtitle,
  badge,
  playing,
  listenLabel,
  onListen,
  children,
}: {
  title: string;
  subtitle: string;
  badge?: string;
  playing: boolean;
  listenLabel: string;
  onListen: () => void;
  children?: ReactNode;
}) {
  return (
    <div className='flex items-center gap-3'>
      <button
        type='button'
        onClick={onListen}
        aria-label={`${listenLabel} — ${title}`}
        className='grid h-11 w-11 shrink-0 place-items-center rounded-full border border-studio-lavande/60 text-studio-violet hover:bg-studio-lavande/10'
      >
        {playing ? <Pause size={16} aria-hidden='true' /> : <Play size={16} aria-hidden='true' />}
      </button>
      <div className='min-w-0 flex-1'>
        <p className='truncate text-sm font-medium text-studio-violet'>
          {title}
          {badge ? (
            <span className='ml-2 rounded-full bg-studio-lavande/20 px-2 py-0.5 text-[11px] font-normal'>
              {badge}
            </span>
          ) : null}
        </p>
        <p className='truncate text-xs text-studio-violet/60'>{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Write the page**

Create `dashboard/src/app/[locale]/musique/page.tsx`:

```tsx
import { getMusicSettings } from "@/actions/music-actions";
import { MusicSettings } from "@/components/music/MusicSettings";

export default async function MusicPage() {
  const settings = await getMusicSettings();
  return <MusicSettings initial={settings} />;
}
```

- [ ] **Step 5: Add the `Music` section in the 9 dashboard locales**

Write this to `$TMPDIR/music-messages.json`:

```json
{
  "fr": {
    "title": "Musique du faire-part",
    "intro": "Une musique accompagne vos invités pendant qu’ils découvrent votre faire-part. Elle démarre dès qu’ils touchent l’écran, et l’icône en haut à droite leur permet de la couper.",
    "not_included_title": "Option non incluse dans votre commande",
    "not_included_body": "La musique sur le faire-part est une option qui se choisit au moment de la commande.",
    "enabled_label": "Musique sur le faire-part",
    "enabled_hint": "Désactivée, l’icône disparaît pour tous vos invités.",
    "current_label": "Morceau actuel",
    "your_file": "Votre fichier",
    "listen": "Écouter",
    "pause": "Pause",
    "listen_failed": "Lecture impossible.",
    "library_title": "Bibliothèque",
    "default_badge": "Par défaut",
    "choose": "Choisir",
    "chosen": "Sélectionné",
    "replace_confirm": "Votre fichier sera supprimé. Continuer ?",
    "confirm": "Confirmer",
    "cancel": "Annuler",
    "upload_title": "Envoyer votre musique",
    "upload_hint": "MP3 ou M4A, 15 Mo maximum.",
    "upload_cta": "Choisir un fichier",
    "uploading": "Envoi en cours…",
    "rights_notice": "En envoyant un fichier, vous confirmez avoir le droit de le diffuser.",
    "error_type": "Format non supporté (MP3 ou M4A uniquement).",
    "error_size": "Le fichier dépasse 15 Mo.",
    "error_empty": "Ce fichier est vide.",
    "saved": "Musique mise à jour",
    "save_failed": "Impossible d’enregistrer. Veuillez réessayer."
  },
  "en": {
    "title": "Invitation music",
    "intro": "Music accompanies your guests while they discover your invitation. It starts as soon as they touch the screen, and the icon at the top right lets them turn it off.",
    "not_included_title": "Option not included in your order",
    "not_included_body": "Music on the invitation is an option chosen when ordering.",
    "enabled_label": "Music on the invitation",
    "enabled_hint": "When off, the icon disappears for all your guests.",
    "current_label": "Current track",
    "your_file": "Your file",
    "listen": "Listen",
    "pause": "Pause",
    "listen_failed": "Playback failed.",
    "library_title": "Library",
    "default_badge": "Default",
    "choose": "Choose",
    "chosen": "Selected",
    "replace_confirm": "Your file will be deleted. Continue?",
    "confirm": "Confirm",
    "cancel": "Cancel",
    "upload_title": "Upload your music",
    "upload_hint": "MP3 or M4A, 15 MB max.",
    "upload_cta": "Choose a file",
    "uploading": "Uploading…",
    "rights_notice": "By uploading a file, you confirm you have the right to play it publicly.",
    "error_type": "Unsupported format (MP3 or M4A only).",
    "error_size": "The file is larger than 15 MB.",
    "error_empty": "This file is empty.",
    "saved": "Music updated",
    "save_failed": "Could not save. Please try again."
  },
  "de": {
    "title": "Musik der Einladung",
    "intro": "Musik begleitet Ihre Gäste, während sie Ihre Einladung entdecken. Sie startet, sobald sie den Bildschirm berühren, und mit dem Symbol oben rechts können sie sie ausschalten.",
    "not_included_title": "Option nicht in Ihrer Bestellung enthalten",
    "not_included_body": "Musik auf der Einladung ist eine Option, die bei der Bestellung gewählt wird.",
    "enabled_label": "Musik auf der Einladung",
    "enabled_hint": "Ausgeschaltet verschwindet das Symbol für alle Ihre Gäste.",
    "current_label": "Aktueller Titel",
    "your_file": "Ihre Datei",
    "listen": "Anhören",
    "pause": "Pause",
    "listen_failed": "Wiedergabe nicht möglich.",
    "library_title": "Bibliothek",
    "default_badge": "Standard",
    "choose": "Auswählen",
    "chosen": "Ausgewählt",
    "replace_confirm": "Ihre Datei wird gelöscht. Fortfahren?",
    "confirm": "Bestätigen",
    "cancel": "Abbrechen",
    "upload_title": "Eigene Musik hochladen",
    "upload_hint": "MP3 oder M4A, maximal 15 MB.",
    "upload_cta": "Datei auswählen",
    "uploading": "Wird hochgeladen…",
    "rights_notice": "Mit dem Hochladen bestätigen Sie, dass Sie die Datei öffentlich abspielen dürfen.",
    "error_type": "Format nicht unterstützt (nur MP3 oder M4A).",
    "error_size": "Die Datei ist größer als 15 MB.",
    "error_empty": "Diese Datei ist leer.",
    "saved": "Musik aktualisiert",
    "save_failed": "Speichern nicht möglich. Bitte versuchen Sie es erneut."
  },
  "es": {
    "title": "Música de la invitación",
    "intro": "Una música acompaña a sus invitados mientras descubren su invitación. Empieza en cuanto tocan la pantalla, y el icono de arriba a la derecha les permite apagarla.",
    "not_included_title": "Opción no incluida en su pedido",
    "not_included_body": "La música en la invitación es una opción que se elige al hacer el pedido.",
    "enabled_label": "Música en la invitación",
    "enabled_hint": "Si la desactiva, el icono desaparece para todos sus invitados.",
    "current_label": "Canción actual",
    "your_file": "Su archivo",
    "listen": "Escuchar",
    "pause": "Pausa",
    "listen_failed": "No se puede reproducir.",
    "library_title": "Biblioteca",
    "default_badge": "Predeterminada",
    "choose": "Elegir",
    "chosen": "Seleccionada",
    "replace_confirm": "Su archivo se eliminará. ¿Continuar?",
    "confirm": "Confirmar",
    "cancel": "Cancelar",
    "upload_title": "Subir su música",
    "upload_hint": "MP3 o M4A, 15 MB como máximo.",
    "upload_cta": "Elegir un archivo",
    "uploading": "Subiendo…",
    "rights_notice": "Al subir un archivo, confirma que tiene derecho a difundirlo.",
    "error_type": "Formato no compatible (solo MP3 o M4A).",
    "error_size": "El archivo supera los 15 MB.",
    "error_empty": "Este archivo está vacío.",
    "saved": "Música actualizada",
    "save_failed": "No se pudo guardar. Inténtelo de nuevo."
  },
  "pt": {
    "title": "Música do convite",
    "intro": "Uma música acompanha seus convidados enquanto descobrem o seu convite. Ela começa assim que tocam na tela, e o ícone no canto superior direito permite desligá-la.",
    "not_included_title": "Opção não incluída no seu pedido",
    "not_included_body": "A música no convite é uma opção escolhida no momento do pedido.",
    "enabled_label": "Música no convite",
    "enabled_hint": "Desativada, o ícone desaparece para todos os seus convidados.",
    "current_label": "Faixa atual",
    "your_file": "Seu arquivo",
    "listen": "Ouvir",
    "pause": "Pausar",
    "listen_failed": "Não foi possível reproduzir.",
    "library_title": "Biblioteca",
    "default_badge": "Padrão",
    "choose": "Escolher",
    "chosen": "Selecionada",
    "replace_confirm": "Seu arquivo será excluído. Continuar?",
    "confirm": "Confirmar",
    "cancel": "Cancelar",
    "upload_title": "Enviar sua música",
    "upload_hint": "MP3 ou M4A, até 15 MB.",
    "upload_cta": "Escolher um arquivo",
    "uploading": "Enviando…",
    "rights_notice": "Ao enviar um arquivo, você confirma que tem o direito de divulgá-lo.",
    "error_type": "Formato não suportado (apenas MP3 ou M4A).",
    "error_size": "O arquivo ultrapassa 15 MB.",
    "error_empty": "Este arquivo está vazio.",
    "saved": "Música atualizada",
    "save_failed": "Não foi possível salvar. Tente novamente."
  },
  "it": {
    "title": "Musica dell’invito",
    "intro": "Una musica accompagna i vostri ospiti mentre scoprono il vostro invito. Parte non appena toccano lo schermo, e l’icona in alto a destra permette di spegnerla.",
    "not_included_title": "Opzione non inclusa nel vostro ordine",
    "not_included_body": "La musica sull’invito è un’opzione da scegliere al momento dell’ordine.",
    "enabled_label": "Musica sull’invito",
    "enabled_hint": "Se disattivata, l’icona scompare per tutti i vostri ospiti.",
    "current_label": "Brano attuale",
    "your_file": "Il vostro file",
    "listen": "Ascolta",
    "pause": "Pausa",
    "listen_failed": "Riproduzione non riuscita.",
    "library_title": "Libreria",
    "default_badge": "Predefinito",
    "choose": "Scegli",
    "chosen": "Selezionato",
    "replace_confirm": "Il vostro file verrà eliminato. Continuare?",
    "confirm": "Conferma",
    "cancel": "Annulla",
    "upload_title": "Caricate la vostra musica",
    "upload_hint": "MP3 o M4A, massimo 15 MB.",
    "upload_cta": "Scegli un file",
    "uploading": "Caricamento in corso…",
    "rights_notice": "Caricando un file, confermate di avere il diritto di diffonderlo.",
    "error_type": "Formato non supportato (solo MP3 o M4A).",
    "error_size": "Il file supera i 15 MB.",
    "error_empty": "Questo file è vuoto.",
    "saved": "Musica aggiornata",
    "save_failed": "Impossibile salvare. Riprovate."
  },
  "ar": {
    "title": "موسيقى الدعوة",
    "intro": "ترافق الموسيقى ضيوفكم أثناء اكتشافهم لدعوتكم. تبدأ بمجرد لمس الشاشة، ويمكنهم إيقافها من الأيقونة في أعلى اليمين.",
    "not_included_title": "هذا الخيار غير مشمول في طلبكم",
    "not_included_body": "الموسيقى في الدعوة خيار يُختار عند الطلب.",
    "enabled_label": "الموسيقى في الدعوة",
    "enabled_hint": "عند إيقافها، تختفي الأيقونة لجميع ضيوفكم.",
    "current_label": "المقطع الحالي",
    "your_file": "ملفكم",
    "listen": "استماع",
    "pause": "إيقاف مؤقت",
    "listen_failed": "تعذر التشغيل.",
    "library_title": "المكتبة",
    "default_badge": "افتراضي",
    "choose": "اختيار",
    "chosen": "محدد",
    "replace_confirm": "سيتم حذف ملفكم. هل تريدون المتابعة؟",
    "confirm": "تأكيد",
    "cancel": "إلغاء",
    "upload_title": "أرسلوا موسيقاكم",
    "upload_hint": "MP3 أو M4A، بحد أقصى 15 ميغابايت.",
    "upload_cta": "اختيار ملف",
    "uploading": "جارٍ الإرسال…",
    "rights_notice": "بإرسال ملف، تؤكدون أن لديكم الحق في بثه.",
    "error_type": "صيغة غير مدعومة (MP3 أو M4A فقط).",
    "error_size": "حجم الملف يتجاوز 15 ميغابايت.",
    "error_empty": "هذا الملف فارغ.",
    "saved": "تم تحديث الموسيقى",
    "save_failed": "تعذر الحفظ. يرجى المحاولة مرة أخرى."
  },
  "zh": {
    "title": "请柬音乐",
    "intro": "宾客浏览您的请柬时，会有音乐相伴。音乐在他们触碰屏幕后开始播放，右上角的图标可将其关闭。",
    "not_included_title": "您的订单未包含此选项",
    "not_included_body": "请柬音乐是下单时选择的附加选项。",
    "enabled_label": "请柬音乐",
    "enabled_hint": "关闭后，所有宾客都将看不到该图标。",
    "current_label": "当前曲目",
    "your_file": "您的文件",
    "listen": "试听",
    "pause": "暂停",
    "listen_failed": "无法播放。",
    "library_title": "曲库",
    "default_badge": "默认",
    "choose": "选择",
    "chosen": "已选择",
    "replace_confirm": "您的文件将被删除。是否继续？",
    "confirm": "确认",
    "cancel": "取消",
    "upload_title": "上传您的音乐",
    "upload_hint": "MP3 或 M4A，最大 15 MB。",
    "upload_cta": "选择文件",
    "uploading": "正在上传…",
    "rights_notice": "上传文件即表示您确认有权公开播放该文件。",
    "error_type": "不支持的格式（仅限 MP3 或 M4A）。",
    "error_size": "文件超过 15 MB。",
    "error_empty": "该文件为空。",
    "saved": "音乐已更新",
    "save_failed": "无法保存，请重试。"
  },
  "ja": {
    "title": "招待状の音楽",
    "intro": "ゲストが招待状をご覧になる間、音楽が流れます。画面に触れると再生が始まり、右上のアイコンで止めることができます。",
    "not_included_title": "このオプションはご注文に含まれていません",
    "not_included_body": "招待状の音楽は、ご注文時に選択するオプションです。",
    "enabled_label": "招待状の音楽",
    "enabled_hint": "オフにすると、すべてのゲストからアイコンが消えます。",
    "current_label": "現在の曲",
    "your_file": "アップロードしたファイル",
    "listen": "試聴",
    "pause": "一時停止",
    "listen_failed": "再生できません。",
    "library_title": "ライブラリ",
    "default_badge": "デフォルト",
    "choose": "選択",
    "chosen": "選択中",
    "replace_confirm": "アップロードしたファイルは削除されます。続けますか？",
    "confirm": "確認",
    "cancel": "キャンセル",
    "upload_title": "音楽をアップロード",
    "upload_hint": "MP3 または M4A、最大 15 MB。",
    "upload_cta": "ファイルを選択",
    "uploading": "アップロード中…",
    "rights_notice": "ファイルをアップロードすることで、公開で再生する権利があることを確認したものとみなされます。",
    "error_type": "対応していない形式です（MP3 または M4A のみ）。",
    "error_size": "ファイルが 15 MB を超えています。",
    "error_empty": "このファイルは空です。",
    "saved": "音楽を更新しました",
    "save_failed": "保存できませんでした。もう一度お試しください。"
  }
}
```

Then:

```bash
cp -R dashboard/messages "$TMPDIR/dashboard-messages.before-music"
node -e '
const fs = require("fs");
const all = JSON.parse(fs.readFileSync(process.env.TMPDIR + "/music-messages.json", "utf8"));
for (const [locale, section] of Object.entries(all)) {
  const file = `dashboard/messages/${locale}.json`;
  const messages = JSON.parse(fs.readFileSync(file, "utf8"));
  if (messages.Music) throw new Error(`${file} already has a Music section`);
  messages.Music = section;
  fs.writeFileSync(file, JSON.stringify(messages, null, 2) + "\n");
}'
diff -r "$TMPDIR/dashboard-messages.before-music" dashboard/messages | head -20
```

Expected: only the new `Music` block is added at the end of each file (plus a comma). Otherwise restore the file from the backup and add the section by hand.

- [ ] **Step 6: Lint and type-check the touched files**

Run (from `dashboard/`): `npx eslint src/actions/music-actions.ts src/components/music/MusicSettings.tsx "src/app/[locale]/musique/page.tsx" src/types/music.ts`
Expected: no error.

Run (from `dashboard/`): `npx tsc --noEmit -p . 2>&1 | grep -E "music"`
Expected: no output.

- [ ] **Step 7: Start the dashboard against the LOCAL database**

`dashboard/.env.local` points at production. Shell variables win over `.env.local` in Next.js, so start it with the local ones:

```bash
eval "$(npx supabase status -o env | grep -E '^(API_URL|ANON_KEY|SERVICE_ROLE_KEY)=')"
NEXT_PUBLIC_SUPABASE_URL="$API_URL" NEXT_PUBLIC_SUPABASE_ANON_KEY="$ANON_KEY" \
  SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY" npm run dev:dashboard
```

Before anything else, open the dashboard and check in the browser's network panel that Supabase requests go to `127.0.0.1:54321`. If one goes to `*.supabase.co`, stop the server and report — do not continue.

- [ ] **Step 8: Sign in as the local test couple**

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -At -c "
  select u.email from auth.users u
  join weddings w on w.user_id = u.id join sites s on s.wedding_id = w.id
  where s.slug = '<slug from Task 4>';"
eval "$(npx supabase status -o env | grep -E '^(API_URL|SERVICE_ROLE_KEY)=' | sed 's/^/export /')"
EMAIL='<that email>' node --input-type=module -e '
import { createClient } from "@supabase/supabase-js";
const admin = createClient(process.env.API_URL, process.env.SERVICE_ROLE_KEY);
const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email: process.env.EMAIL });
if (error) throw error;
console.log(`http://localhost:3003/auth/confirm?token_hash=${data.properties.hashed_token}&type=magiclink&next=/fr/musique`);'
```

Open the printed URL. Run the snippet from the repo root (where `@supabase/supabase-js` resolves); the `export` matters — `node` only sees exported variables.

- [ ] **Step 9: Drive the whole flow in the real browser**

With landing (Task 4) running too:
1. The sidebar's *Invitation* section lists « Musique ». `/fr/musique` shows the switch on, the current track « Ambiance The Studio », the library with « Par défaut ».
2. *Écouter* plays the test tone; *Pause* stops it.
3. Generate a file and upload it: `ffmpeg -y -loglevel error -f lavfi -i "sine=frequency=660:duration=20" -b:a 128k "$TMPDIR/Notre chanson (live).mp3"` → *Choisir un fichier*. Toast « Musique mise à jour »; the current track shows `notre-chanson-live.mp3`. Open the invitation, tap: the 660 Hz tone plays (higher than the library's 440 Hz).
4. Upload a second file: in the local bucket, the couple's folder holds only the new one (`curl -s -X POST "$API_URL/storage/v1/object/list/music" -H "Authorization: Bearer $SERVICE_ROLE_KEY" -H "Content-Type: application/json" -d '{"prefix":"<wedding_id>/"}'`).
5. *Choisir* on the library track: the inline confirmation appears; *Annuler* keeps the file; *Confirmer* switches, and the folder is now empty.
6. Upload a `.wav` (`ffmpeg -y -loglevel error -f lavfi -i "sine=duration=2" "$TMPDIR/x.wav"`): refused with « Format non supporté », nothing transferred.
7. Switch off: the invitation shows no icon after reload. Switch back on.
8. Remove the option locally (`update sites set extras = array_remove(extras, 'custom-music') where slug = '<slug>';`), reload the dashboard: « Musique » disappears from the menu; `/fr/musique` by URL shows « Option non incluse dans votre commande ». Put the option back.
9. Screenshots of `/fr/musique` at 375 px and desktop, and at `/de/musique` and `/ar/musique` (long strings, RTL).

- [ ] **Step 10: Checkpoint**

Commit only if authorised — this task's new files, plus `dashboard/messages/*.json` only once the user's own changes in them are committed: `feat(dashboard): let couples switch their invitation music and choose the song`.

---

### Task 7: The whole-product check

**Files:** none created; screenshots only.

- [ ] **Step 1: Automated checks**

Run: `npm test` — expected PASS.
Run: `npm run themes:check -w landing` — expected PASS (no theme was edited).
Run: `psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v ON_ERROR_STOP=1 -f supabase/tests/invitation_music.sql` — expected no error.

- [ ] **Step 2: Every theme, two widths, three languages**

For each theme id in `landing/src/components/invitation/themes/` (belle-rive, blanc-couture, cabo-verde, chateau-royal, ciao-amore, mare-alta), open `http://localhost:3010/<locale>/invitation/demo/<id>` at 375 px and at 1440 px, in `fr`, `de` and `ar`. Screenshot each with the icon visible (after the theme's opening screen, if it has one). Check:
- the icon never covers a theme control (menus, the ciao-amore scroll-to-top, mare-alta's floating nav);
- on desktop, whether the icon sits far from a centred column. List the themes where it does; for each, propose in the report a `.invitation-music[data-theme="<id>"]` rule for that theme's `responsive.css` — **do not add it**: themes are not edited in this plan, the user decides.

- [ ] **Step 3: Report the iPhone check that only the user can do**

Chrome's mobile emulation does not enforce Safari iOS's audio rules. List for the user, in French, the four things to try on a real iPhone: the first tap starts the music; a swipe followed by a tap starts it; the icon mutes and the choice survives a reload; locking the phone stops it.

---

### Task 8: The vault

**Files:**
- Modify: `The Studio Digital Papeterie/Architecture/Base de Données.md` (append)
- Create: `The Studio Digital Papeterie/Features/Musique du faire-part.md`

- [ ] **Step 1: Database note**

Append to `Architecture/Base de Données.md` with the obsidian CLI described in CLAUDE.md (`obsidian vault="The Studio Digital Papeterie" append path="Architecture/Base de Données.md" content="…"`), or, if the CLI is not installed, by editing the file in `The Studio Digital Papeterie/` directly (it is the vault's folder; it holds uncommitted user edits — append only):

```markdown
## Musique du faire-part (2026-10-02)

- `settings.music_enabled` (bool, défaut true), `settings.music_track` (id de `shared/data/music-library.ts`, null = défaut), `settings.music_upload_path` (objet du bucket `music`, prioritaire sur `music_track`).
- Bucket public `music` : `library/<fichier>` (bibliothèque du studio), `<wedding_id>/<timestamp>-<nom>.<ext>` (fichier du couple). 15 Mo, MP3/M4A/AAC. Aucune policy `authenticated` : écritures par server action uniquement.
- `resolve_public_slug` renvoie `music_enabled`, `music_track`, `music_upload_path`, vides tant que `sites.extras` ne contient pas `custom-music` ou que le couple a coupé la musique. C'est le paywall.
- Migration `20261002150000_invitation_music.sql`. Voir [[Musique du faire-part]].
```

- [ ] **Step 2: Feature note**

Create `Features/Musique du faire-part.md`:

```markdown
---
date: 2026-10-02
status: done
category: feature
---

# Musique du faire-part

Option `custom-music` (10 €, checkout uniquement). Spec : `docs/superpowers/specs/2026-10-02-invitation-music-design.md`.

- **Invités** : la musique démarre au premier tap (les navigateurs bloquent le son sans geste ; un swipe sur iOS ne compte pas, on attend le tap suivant). Icône sticky en haut à droite (`InvitationMusic.tsx`), montée par la page à côté du thème — aucun thème ne la connaît. Le choix « coupé » est mémorisé par mariage dans le navigateur. Pause quand l'onglet est masqué. Muette dans l'iframe du mockup de l'accueil.
- **Démos** : jouent le morceau par défaut, pour vendre l'option.
- **Dashboard** `/musique` : interrupteur, bibliothèque, envoi d'un fichier. L'envoi va du navigateur à Supabase Storage par URL signée — Vercel refuse les corps de requête > 4,5 Mo.
- **Ajouter un morceau** : une entrée dans `shared/data/music-library.ts` + le fichier dans `music/library/`. Retirer un morceau est sans risque (retour au défaut).
- **Thème qui veut déplacer l'icône** : `.invitation-music[data-theme="<id>"]` dans son `responsive.css`.

## Pièges

- `dashboard/.env.local` pointe sur la prod : en local, lancer le dashboard avec les variables Supabase locales en ligne de commande.
- iOS ignore `audio.volume` : pas de fondu sur iPhone.
- `uploadIntroVideo` passe 100 Mo par une server action : même limite Vercel, probablement cassé en prod (hors périmètre).

Liens : [[Base de Données]], [[Conventions]].
```

- [ ] **Step 3: Checkpoint**

Nothing to run. Commit only if authorised.
