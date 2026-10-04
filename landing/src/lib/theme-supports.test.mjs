import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";

import { FALLBACK_THEME_ID, THEME_MODULES, themeModules } from "../../../shared/data/theme-modules.ts";
import { readSupports } from "./theme-supports.mjs";

test("readSupports reads string literals between comments", () => {
  const source = [
    "export const t = {",
    '  id: "x",',
    "  supports: [",
    '    "countdown",',
    "    // Drawn inside the venue section, as its travel directions.",
    "    \"transport\", /* inline */ 'faq',",
    "  ],",
    "};",
  ].join("\n");
  assert.deepEqual(readSupports(source), ["countdown", "transport", "faq"]);
});

test("readSupports refuses a list it cannot read as literals", () => {
  assert.equal(readSupports('supports: [...BASE, "faq"]'), null);
  assert.equal(readSupports("supports: MODULES"), null);
  assert.equal(readSupports('id: "x"'), null);
});

test("THEME_MODULES matches every theme folder", () => {
  const dir = new URL("../components/invitation/themes/", import.meta.url);
  const folders = readdirSync(dir)
    .filter((entry) => existsSync(new URL(`${entry}/theme.config.ts`, dir)))
    .sort();
  assert.deepEqual(Object.keys(THEME_MODULES).sort(), folders);
  for (const folder of folders) {
    const source = readFileSync(new URL(`${folder}/theme.config.ts`, dir), "utf8");
    assert.deepEqual(THEME_MODULES[folder], readSupports(source), folder);
  }
  assert.equal(FALLBACK_THEME_ID, folders[0]);
});

test("themeModules falls back like the invitation does", () => {
  assert.deepEqual(themeModules("does-not-exist"), THEME_MODULES[FALLBACK_THEME_ID]);
  assert.deepEqual(themeModules(null), THEME_MODULES[FALLBACK_THEME_ID]);
  assert.ok(themeModules("ciao-amore").includes("gallery"));
  assert.ok(!themeModules("ciao-amore").includes("video-guestbook"));
});
