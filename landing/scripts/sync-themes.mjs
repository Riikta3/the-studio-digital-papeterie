#!/usr/bin/env node
/**
 * Regenerate the theme registry from the folders on disk.
 *
 *   npm run themes:sync            # rewrite registry.ts
 *   npm run themes:sync -- --check # fail if it is out of date (for CI)
 *
 * Every folder under `src/components/invitation/themes/` that holds a
 * `theme.config.ts` is a theme. The exported manifest is expected to be named
 * `<camelCaseFolder>Theme` — `ciao-amore` -> `ciaoAmoreTheme`.
 *
 * This exists because a bundler cannot discover modules at runtime: the import
 * list has to be static. Rather than asking every contributor to remember to
 * edit a central file, the list is derived from the folders.
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const THEMES_DIR = join(here, "..", "src", "components", "invitation", "themes");
const REGISTRY = join(THEMES_DIR, "registry.ts");

const START = "// ─── THEME IMPORTS — generated, do not edit by hand ───────────────────────────";
const END = "// ─── END GENERATED ───────────────────────────────────────────────────────────";

function camel(folder) {
  return folder.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
}

function discover() {
  return readdirSync(THEMES_DIR)
    .filter((entry) => {
      const path = join(THEMES_DIR, entry);
      if (!statSync(path).isDirectory()) return false;
      try {
        statSync(join(path, "theme.config.ts"));
        return true;
      } catch {
        return false;
      }
    })
    .sort();
}

const folders = discover();
if (folders.length === 0) {
  console.error("No theme folders found under", THEMES_DIR);
  process.exit(1);
}

const imports = folders
  .map((folder) => `import { ${camel(folder)}Theme } from "./${folder}/theme.config";`)
  .join("\n");

const list = folders.map((folder) => `${camel(folder)}Theme`).join(", ");

const block = [
  START,
  "// Run `npm run themes:sync` (landing/scripts/sync-themes.mjs) after adding or",
  "// removing a theme folder. A bundler cannot discover modules at runtime, so the",
  "// import list has to be static; the script keeps it in step with the folders.",
  imports,
  "",
  `const MANIFESTS: ThemeManifest[] = [${list}];`,
  END,
].join("\n");

const current = readFileSync(REGISTRY, "utf8");
const startAt = current.indexOf(START);
const endAt = current.indexOf(END);

if (startAt === -1 || endAt === -1) {
  console.error(`Could not find the generated block markers in ${REGISTRY}`);
  process.exit(1);
}

const next = current.slice(0, startAt) + block + current.slice(endAt + END.length);

if (process.argv.includes("--check")) {
  if (next !== current) {
    console.error("Theme registry is out of date. Run: npm run themes:sync");
    process.exit(1);
  }
  console.log(`Theme registry is up to date (${folders.length} themes).`);
} else if (next === current) {
  console.log(`Theme registry already up to date (${folders.length} themes).`);
} else {
  writeFileSync(REGISTRY, next);
  console.log(`Theme registry updated: ${folders.join(", ")}`);
}
