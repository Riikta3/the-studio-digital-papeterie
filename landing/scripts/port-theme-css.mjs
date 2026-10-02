#!/usr/bin/env node
/**
 * Port a designer's stylesheet into a theme folder, reproducibly.
 *
 *   npm run themes:port-css -w landing -- <config.json>
 *
 * The README's "port" is five hand steps (scope, fonts, assets, checks,
 * decor words) that the three ports of this app each repeated, and one of them
 * — the font substitution — was lost every time the sheet was re-scoped. This
 * runs them as one command from a small config, so a re-port is the same
 * command again.
 *
 *   1. PRE-PROCESS  drop the framework @imports and the comments; move the
 *                   source's `main` rules onto the theme's column class (when
 *                   the design is a centred column), because the scoper would
 *                   otherwise fold `html`, `body` and `main` onto ONE element
 *                   and lose either the backdrop or the column.
 *   2. SCOPE        `scope-theme-css.mjs`, unchanged: every selector under one
 *                   root class, asset URLs rewritten.
 *   2b. KEYFRAMES   `@keyframes` names are global to the document and every
 *                   theme's sheet loads together (the registry imports them
 *                   all), so two themes that name an animation `softRise` or
 *                   `sunPulse` swap each other's. Each name, and each use of
 *                   it, is prefixed with the theme's.
 *   3. FONTS        add the `next/font` variable to every `font` and
 *                   `font-family` that names a configured face.
 *   4. DECOR WORDS  replace each `content:` string that contains letters with
 *                   a custom property the theme's root sets from the couple's
 *                   data. Any such string left unmapped fails the port.
 *   5. VERIFY       nothing outside the scope; no custom property used and never
 *                   defined (the `--font-*` and the decor variables, which are
 *                   set at runtime, excepted); every asset exists. Classes the
 *                   markup never uses are listed for information only.
 *
 * The generated file is never edited by hand. Comments are dropped, so what the
 * designer wrote about the demo wedding cannot leak through them either.
 *
 * Config paths are resolved against the config file's folder.
 *
 * Optional config keys beyond the obvious ones:
 *   - `keyframePrefix`  defaults to the scope without its `theme-`
 *                       (`theme-mare-alta` gives `mare-alta-`). The same prefix
 *                       must start every `@keyframes` that a theme's hand-written
 *                       `responsive.css` declares; `theme-checks.test.mjs`
 *                       enforces it.
 *   - `externalVars`    custom properties the sheet reads but that are set at
 *                       runtime, by an inline `style="--c:…"` in the markup or a
 *                       script's `setProperty` (Cabo Verde: `--c`,
 *                       `--section-shift`, `--section-shift-soft`). Without the
 *                       list they fail the port as "used but never defined".
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import postcss from "postcss";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCOPE_SCRIPT = path.join(HERE, "scope-theme-css.mjs");

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function insideKeyframes(node) {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (parent.type === "atrule" && /keyframes$/i.test(parent.name)) return true;
  }
  return false;
}

/* -- 1. pre-process ----------------------------------------------------- */

export function preprocess(css, { columnClass, dropImports = [] } = {}) {
  const root = postcss.parse(css);

  root.walkComments((comment) => comment.remove());

  root.walkAtRules("import", (rule) => {
    const params = rule.params;
    if (
      /tailwindcss/.test(params) ||
      /fonts\.googleapis\.com/.test(params) ||
      dropImports.some((needle) => params.includes(needle))
    ) {
      rule.remove();
    }
  });

  if (columnClass) {
    root.walkRules((rule) => {
      if (insideKeyframes(rule)) return;
      rule.selectors = rule.selectors.map((selector) =>
        selector.replace(/^main(?![\w-])/, `.${columnClass}`),
      );
    });
  }

  return root.toString();
}

/* -- 2b. keyframes ------------------------------------------------------ */

/**
 * Prefix every `@keyframes` name, and every `animation` that uses it.
 *
 * Already happening between the designers' sheets and the shipped themes:
 * `sunPulse` (Maré Alta / ciao-amore), `softRise` (Maré Alta / Cabo Verde),
 * `giftFloat` (Maré Alta / belle-rive). A keyword (`ease`, `infinite`) is
 * touched only if a keyframe carries that exact name.
 */
export function scopeKeyframes(css, prefix) {
  const root = postcss.parse(css);
  const names = new Map();

  root.walkAtRules(/^(-webkit-)?keyframes$/i, (rule) => {
    const name = rule.params.trim();
    if (!name.startsWith(prefix)) names.set(name, `${prefix}${name}`);
  });
  root.walkAtRules(/^(-webkit-)?keyframes$/i, (rule) => {
    const name = rule.params.trim();
    if (names.has(name)) rule.params = names.get(name);
  });
  root.walkDecls(/^(-webkit-)?animation(-name)?$/i, (decl) => {
    decl.value = decl.value.replace(
      /(?<![\w-])[A-Za-z_][\w-]*(?![\w-]|\()/g,
      (token) => names.get(token) ?? token,
    );
  });

  return root.toString();
}

/* -- 3. fonts ----------------------------------------------------------- */

export function substituteFonts(css, fonts) {
  const root = postcss.parse(css);

  root.walkDecls(/^font(-family)?$/, (decl) => {
    let value = decl.value;

    for (const { family, variable, position = "after" } of fonts) {
      if (value.includes(`var(${variable})`)) continue;

      // A quoted name, or a bare one standing alone between commas — never
      // "Avenir" inside "Avenir Next".
      const name = escapeRegExp(family);
      const pattern = new RegExp(
        `(['"])${name}\\1|(?<![\\w'"-])${name}(?=\\s*(?:,|$))`,
      );

      value = value.replace(pattern, (match) =>
        position === "before" ? `var(${variable}), ${match}` : `${match}, var(${variable})`,
      );
    }

    decl.value = value;
  });

  return root.toString();
}

/* -- 4. decor words ----------------------------------------------------- */

/** CSS escapes (`\A`, `\201C`) are not words. */
const withoutEscapes = (text) => text.replace(/\\[0-9a-fA-F]{1,6}\s?/g, "");

export function bakeDecorWords(css, decor) {
  const root = postcss.parse(css);
  const unmapped = [];

  root.walkDecls("content", (decl) => {
    const match = decl.value.match(/^(["'])([\s\S]*)\1$/);
    if (!match) return;

    const text = match[2];
    if (!/\p{L}/u.test(withoutEscapes(text))) return;

    const variable = decor[text];
    if (variable) decl.value = `var(${variable})`;
    else unmapped.push(text);
  });

  return { css: root.toString(), unmapped };
}

/* -- 5. verify ---------------------------------------------------------- */

export function verify(css, { scope, publicDir, markup = [], externalVars = [], keyframePrefix }) {
  const root = postcss.parse(css);
  const defined = new Set();
  const used = new Set();
  const outside = [];
  const classes = new Set();
  const assets = new Set();

  root.walkDecls((decl) => {
    if (decl.prop.startsWith("--")) defined.add(decl.prop);
    for (const match of decl.value.matchAll(/var\((--[\w-]+)/g)) used.add(match[1]);
    for (const match of decl.value.matchAll(/url\(\s*(['"]?)([^)'"]+)\1\s*\)/g)) {
      const url = match[2];
      if (url.startsWith("/") && !url.startsWith("//")) assets.add(url.split("?")[0]);
    }
  });

  root.walkRules((rule) => {
    if (insideKeyframes(rule)) return;
    for (const selector of rule.selectors) {
      if (!selector.trim().startsWith(`.${scope}`)) outside.push(selector.trim());
      for (const match of selector.matchAll(/\.([A-Za-z_][\w-]*)/g)) classes.add(match[1]);
    }
  });

  const unscopedKeyframes = [];
  root.walkAtRules(/^(-webkit-)?keyframes$/i, (rule) => {
    const name = rule.params.trim();
    if (keyframePrefix && !name.startsWith(keyframePrefix)) unscopedKeyframes.push(name);
  });

  // `--font-*` come from next/font; `externalVars` are the decor words, which
  // the theme's root sets inline from the couple's data. Neither is in the sheet.
  const undefinedVars = [...used]
    .filter(
      (name) =>
        !defined.has(name) && !name.startsWith("--font-") && !externalVars.includes(name),
    )
    .sort();

  const missingAssets = [...assets]
    .filter((url) => !fs.existsSync(path.join(publicDir, url)))
    .sort();

  const markupText = markup.join("\n");
  const unusedClasses = [...classes]
    .filter((name) => name !== scope && !new RegExp(`(?<![\\w-])${escapeRegExp(name)}(?![\\w-])`).test(markupText))
    .sort();

  return { outside, undefinedVars, missingAssets, unusedClasses, unscopedKeyframes };
}

/* -- the pipeline ------------------------------------------------------- */

export function portThemeCss(config) {
  const {
    source,
    out,
    scope,
    columnClass,
    dropImports = [],
    assets = [],
    fonts = [],
    decor = {},
    externalVars = [],
    publicDir,
    markup = [],
  } = config;

  const work = fs.mkdtempSync(path.join(os.tmpdir(), "port-theme-css-"));
  const staged = path.join(work, "pre.css");
  const scoped = path.join(work, "scoped.css");

  fs.writeFileSync(
    staged,
    preprocess(fs.readFileSync(source, "utf8"), { columnClass, dropImports }),
  );
  execFileSync(process.execPath, [SCOPE_SCRIPT, staged, scoped, scope, ...assets], {
    stdio: ["ignore", "ignore", "pipe"],
  });

  const keyframePrefix = config.keyframePrefix ?? `${scope.replace(/^theme-/, "")}-`;
  let css = substituteFonts(scopeKeyframes(fs.readFileSync(scoped, "utf8"), keyframePrefix), fonts);

  const baked = bakeDecorWords(css, decor);
  if (baked.unmapped.length > 0) {
    throw new Error(
      "Unmapped words drawn by CSS content:\n  " +
        baked.unmapped.map((word) => JSON.stringify(word)).join("\n  ") +
        "\nMap each to a custom property in the config's `decor`, or the demo couple's words ship.",
    );
  }
  css = baked.css;

  const report = verify(css, {
    scope,
    publicDir,
    markup: markup.map((file) => fs.readFileSync(file, "utf8")),
    externalVars: [...externalVars, ...Object.values(decor)],
    keyframePrefix,
  });

  const problems = [];
  if (report.outside.length) problems.push(`selectors outside .${scope}: ${report.outside.join(", ")}`);
  if (report.undefinedVars.length) {
    problems.push(
      `custom properties used but never defined: ${report.undefinedVars.join(", ")}\n` +
        "    (set at runtime by the markup or a script? list them in the config's `externalVars`)",
    );
  }
  if (report.missingAssets.length) problems.push(`assets that do not exist: ${report.missingAssets.join(", ")}`);
  if (report.unscopedKeyframes.length) problems.push(`keyframes with a global name: ${report.unscopedKeyframes.join(", ")}`);
  if (problems.length) throw new Error("Port failed:\n  " + problems.join("\n  "));

  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, css);
  fs.rmSync(work, { recursive: true, force: true });

  return { out, bytes: css.length, report };
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  const [, , configPath] = process.argv;
  if (!configPath) {
    console.error("usage: port-theme-css.mjs <config.json>");
    process.exit(1);
  }

  try {
    const file = path.resolve(configPath);
    const base = path.dirname(file);
    const raw = JSON.parse(fs.readFileSync(file, "utf8"));
    const resolve = (value) => (value ? path.resolve(base, value) : value);

    const { out, bytes, report } = portThemeCss({
      ...raw,
      source: resolve(raw.source),
      out: resolve(raw.out),
      publicDir: resolve(raw.publicDir),
      markup: (raw.markup ?? []).map(resolve),
    });

    console.error(`wrote ${out} (${Math.round(bytes / 1024)} KB)`);
    console.error(`${report.unusedClasses.length} class(es) in the sheet are never used by the markup (informational)`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
