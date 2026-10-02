#!/usr/bin/env node
/**
 * Merge one theme's messages into the nine landing catalogues.
 *
 *   npm run themes:messages -w landing -- <camelId> <dir>
 *
 * `<dir>` holds `fr.json … ja.json`, each the *namespace object* of the theme —
 * the content that belongs under `Invitation.<camelId>` — not a whole
 * catalogue. Keep it outside the repo (a scratch folder): the catalogues are the
 * source of truth once merged.
 *
 * Why a script: three themes are ported at once and each adds ~100 strings to
 * the same nine files. A read-modify-write by hand loses an update whenever two
 * overlap. The merge takes a lock, replaces only `Invitation.<camelId>`, checks
 * that the nine languages carry exactly the same keys, and re-running it with
 * the same input changes nothing.
 *
 * Files are written as `JSON.stringify(obj, null, 2) + "\n"`, which reproduces
 * the committed catalogues byte for byte, so a merge produces no stray diff.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const LOCALES = ["fr", "en", "de", "es", "pt", "it", "ar", "zh", "ja"];

/** Namespaces a merge must never overwrite: the shipped themes and the editor. */
export const PROTECTED = ["ciaoAmore", "belleRive", "editorPreview"];

const DEFAULT_MESSAGES_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "messages",
);

/** Every leaf of an object as a dotted path: `hero.cta`, `rsvp.titleLine1`… */
export function keyPaths(value, prefix = "") {
  if (value === null || typeof value !== "object") return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

/** The catalogue with `Invitation.<camelId>` replaced. Pure: nothing mutates. */
export function mergeNamespace(catalog, camelId, namespace) {
  return {
    ...catalog,
    Invitation: { ...catalog.Invitation, [camelId]: namespace },
  };
}

/** Throws unless every locale has exactly French's keys. */
export function assertParity(namespaces) {
  const reference = new Set(keyPaths(namespaces.fr));
  const problems = [];

  for (const locale of LOCALES) {
    const keys = new Set(keyPaths(namespaces[locale]));
    const missing = [...reference].filter((key) => !keys.has(key));
    const extra = [...keys].filter((key) => !reference.has(key));
    if (missing.length) problems.push(`${locale} lacks: ${missing.join(", ")}`);
    if (extra.length) problems.push(`${locale} has keys French lacks: ${extra.join(", ")}`);
  }

  if (problems.length) throw new Error(`Catalogues out of step:\n  ${problems.join("\n  ")}`);
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/** Runs `work` while holding a directory lock; a lock older than a minute is stale. */
function withLock(messagesDir, work) {
  const lock = path.join(messagesDir, ".merge.lock");
  const deadline = Date.now() + 30_000;

  for (;;) {
    try {
      fs.mkdirSync(lock);
      break;
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      try {
        if (Date.now() - fs.statSync(lock).mtimeMs > 60_000) fs.rmSync(lock, { recursive: true });
      } catch {
        /* released between the two calls: try again */
      }
      if (Date.now() > deadline) throw new Error(`Timed out waiting for ${lock}`);
      sleep(100);
    }
  }

  try {
    return work();
  } finally {
    fs.rmSync(lock, { recursive: true, force: true });
  }
}

export function runMerge({ camelId, dir, messagesDir = DEFAULT_MESSAGES_DIR }) {
  if (!/^[a-z][A-Za-z0-9]*$/.test(camelId)) throw new Error(`"${camelId}" is not a camelCase id`);
  if (PROTECTED.includes(camelId)) throw new Error(`"${camelId}" is a protected namespace`);

  const namespaces = {};
  for (const locale of LOCALES) {
    const file = path.join(dir, `${locale}.json`);
    if (!fs.existsSync(file)) throw new Error(`Missing ${file}`);
    namespaces[locale] = JSON.parse(fs.readFileSync(file, "utf8"));
  }
  assertParity(namespaces);

  withLock(messagesDir, () => {
    // Read everything before writing anything, so a bad catalogue aborts the
    // merge with all nine files untouched.
    const catalogs = Object.fromEntries(
      LOCALES.map((locale) => [
        locale,
        JSON.parse(fs.readFileSync(path.join(messagesDir, `${locale}.json`), "utf8")),
      ]),
    );
    for (const locale of LOCALES) {
      const merged = mergeNamespace(catalogs[locale], camelId, namespaces[locale]);
      fs.writeFileSync(
        path.join(messagesDir, `${locale}.json`),
        JSON.stringify(merged, null, 2) + "\n",
      );
    }
  });

  return { camelId, keys: keyPaths(namespaces.fr).length };
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  const [, , camelId, dir] = process.argv;
  if (!camelId || !dir) {
    console.error("usage: theme-messages.mjs <camelId> <dir with fr.json … ja.json>");
    process.exit(1);
  }
  try {
    const { keys } = runMerge({
      camelId,
      dir: path.resolve(dir),
      // Lets a test aim the merge at a scratch folder; unset in real use.
      messagesDir: process.env.THEME_MESSAGES_DIR || DEFAULT_MESSAGES_DIR,
    });
    console.error(`merged Invitation.${camelId}: ${keys} keys × ${LOCALES.length} locales`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
