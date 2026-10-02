/**
 * Merging one theme's messages into the nine catalogues, under a lock.
 *
 *   node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs \
 *     --test landing/src/lib/theme-messages.test.mjs
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  LOCALES,
  assertParity,
  keyPaths,
  mergeNamespace,
  runMerge,
} from "../../scripts/theme-messages.mjs";

const SCRIPT = fileURLToPath(new URL("../../scripts/theme-messages.mjs", import.meta.url));

function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "theme-messages-"));
}

function writeCatalogues(dir) {
  for (const locale of LOCALES) {
    const catalog = { Hero: { title: locale }, Invitation: { ciaoAmore: { keep: locale } } };
    fs.writeFileSync(path.join(dir, `${locale}.json`), JSON.stringify(catalog, null, 2) + "\n");
  }
}

function writeNamespace(dir, namespace, { skip } = {}) {
  fs.mkdirSync(dir, { recursive: true });
  for (const locale of LOCALES) {
    if (locale === skip) continue;
    fs.writeFileSync(path.join(dir, `${locale}.json`), JSON.stringify(namespace(locale), null, 2));
  }
}

const read = (dir, locale) => JSON.parse(fs.readFileSync(path.join(dir, `${locale}.json`), "utf8"));

test("keyPaths lists every leaf with its dotted path", () => {
  assert.deepEqual(keyPaths({ a: "x", b: { c: "y", d: { e: "z" } } }).sort(), ["a", "b.c", "b.d.e"]);
});

test("mergeNamespace replaces one namespace and touches nothing else", () => {
  const catalog = { Hero: { t: 1 }, Invitation: { ciaoAmore: { a: 1 }, other: { b: 2 } } };
  const merged = mergeNamespace(catalog, "mareAlta", { x: "y" });
  assert.deepEqual(merged.Invitation.mareAlta, { x: "y" });
  assert.deepEqual(merged.Invitation.ciaoAmore, { a: 1 });
  assert.deepEqual(merged.Hero, { t: 1 });
  assert.deepEqual(mergeNamespace(merged, "mareAlta", { x: "z" }).Invitation.mareAlta, { x: "z" });
  assert.deepEqual(catalog.Invitation.mareAlta, undefined, "the input is not mutated");
});

test("parity: the nine locales must carry exactly French's keys", () => {
  const ok = Object.fromEntries(LOCALES.map((locale) => [locale, { a: "1", b: { c: "2" } }]));
  assert.doesNotThrow(() => assertParity(ok));

  const missing = { ...ok, de: { a: "1" } };
  assert.throws(() => assertParity(missing), /de.*b\.c/s);

  const extra = { ...ok, ja: { a: "1", b: { c: "2" }, z: "3" } };
  assert.throws(() => assertParity(extra), /ja.*z/s);
});

test("runMerge writes all nine catalogues, is idempotent, and keeps the file format", () => {
  const messagesDir = tmp();
  const dir = path.join(tmp(), "staging");
  writeCatalogues(messagesDir);
  writeNamespace(dir, (locale) => ({ hero: { cta: `cta-${locale}` } }));

  runMerge({ camelId: "mareAlta", dir, messagesDir });
  const once = fs.readFileSync(path.join(messagesDir, "fr.json"), "utf8");
  assert.ok(once.endsWith("}\n"));
  assert.equal(read(messagesDir, "de").Invitation.mareAlta.hero.cta, "cta-de");
  assert.equal(read(messagesDir, "de").Invitation.ciaoAmore.keep, "de");

  runMerge({ camelId: "mareAlta", dir, messagesDir });
  assert.equal(fs.readFileSync(path.join(messagesDir, "fr.json"), "utf8"), once);
});

test("runMerge refuses a missing locale and the existing themes' namespaces", () => {
  const messagesDir = tmp();
  writeCatalogues(messagesDir);

  const incomplete = path.join(tmp(), "incomplete");
  writeNamespace(incomplete, () => ({ a: "1" }), { skip: "ar" });
  assert.throws(() => runMerge({ camelId: "caboVerde", dir: incomplete, messagesDir }), /ar\.json/);

  const complete = path.join(tmp(), "complete");
  writeNamespace(complete, () => ({ a: "1" }));
  for (const protectedId of ["ciaoAmore", "belleRive", "editorPreview"]) {
    assert.throws(() => runMerge({ camelId: protectedId, dir: complete, messagesDir }), /protected/i);
  }
  assert.equal(read(messagesDir, "fr").Invitation.caboVerde, undefined, "nothing was written");
});

test("two processes merging at once both land, in valid JSON", async () => {
  const messagesDir = tmp();
  writeCatalogues(messagesDir);
  const stagingA = path.join(tmp(), "a");
  const stagingB = path.join(tmp(), "b");
  writeNamespace(stagingA, (locale) => ({ who: `a-${locale}` }));
  writeNamespace(stagingB, (locale) => ({ who: `b-${locale}` }));

  const run = (camelId, dir) =>
    new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [SCRIPT, camelId, dir], {
        env: { ...process.env, THEME_MESSAGES_DIR: messagesDir },
        stdio: "pipe",
      });
      let stderr = "";
      child.stderr.on("data", (chunk) => (stderr += chunk));
      child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(stderr))));
    });

  await Promise.all([run("mareAlta", stagingA), run("chateauRoyal", stagingB)]);

  for (const locale of LOCALES) {
    const catalog = read(messagesDir, locale);
    assert.equal(catalog.Invitation.mareAlta.who, `a-${locale}`);
    assert.equal(catalog.Invitation.chateauRoyal.who, `b-${locale}`);
  }
});
