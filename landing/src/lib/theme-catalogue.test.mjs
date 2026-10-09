import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { THEME_DEMO_TRACKS, findMusicTrack } from "../../../shared/data/music-library.ts";
import { THEMES } from "../components/home/themes.ts";
import { THEME_IDS } from "../components/invitation/themes/theme-ids.ts";

/*
 * One catalogue shows the themes everywhere a couple chooses one: the hero
 * carousel, the phone preview and its row, the « Comment ça marche » cards,
 * the studio's theme step and the checkout summary all read
 * `components/home/themes.ts`. These checks fail when a theme folder is added
 * (and `npm run themes:sync` run) without its entry there or its pictures.
 */

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), "../../public");

test("every theme folder has its entry in the home catalogue, and nothing else does", () => {
  const listed = THEMES.map((theme) => theme.id);
  assert.deepEqual(
    [...listed].sort(),
    [...THEME_IDS].sort(),
    "Add the theme to landing/src/components/home/themes.ts (id, name, image, statusBar).",
  );
  assert.equal(new Set(listed).size, listed.length, "A theme is listed twice.");
});

test("every listed theme has its cover and the hero's scrolling strip", () => {
  for (const theme of THEMES) {
    const folder = join(PUBLIC, "themes", theme.id);
    assert.ok(
      existsSync(join(PUBLIC, theme.image)),
      `${theme.id}: missing ${theme.image} — run \`npm run themes:shoot -w landing\`.`,
    );
    assert.ok(
      existsSync(join(folder, "scroll.webp")),
      `${theme.id}: missing public/themes/${theme.id}/scroll.webp — run \`npm run themes:shoot-scroll -w landing\`.`,
    );
    if ("nightfall" in theme && theme.nightfall) {
      assert.ok(
        existsSync(join(folder, "scroll-night.webp")),
        `${theme.id}: nightfall needs public/themes/${theme.id}/scroll-night.webp.`,
      );
    }
  }
});

test("every theme's demo has its own track, taken from the library", () => {
  for (const id of THEME_IDS) {
    const trackId = THEME_DEMO_TRACKS[id];
    assert.ok(trackId, `${id}: add its demo track to THEME_DEMO_TRACKS in shared/data/music-library.ts.`);
    assert.ok(findMusicTrack(trackId), `${id}: « ${trackId} » is not in MUSIC_LIBRARY.`);
  }
});
