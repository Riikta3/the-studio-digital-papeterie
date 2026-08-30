#!/usr/bin/env node
/**
 * Scope a theme's global CSS under a single root class so several themes can
 * coexist inside the landing app without bleeding into it.
 *
 * Themes arrive as standalone Next.js projects whose stylesheets set `body`,
 * `main`, `h2`, `input`… globally. Imported as-is they would repaint the whole
 * landing and fight every other theme, so each sheet is rewritten to sit under
 * one root class before it enters the app.
 *
 *   npm run themes:scope-css -- <input.css> <output.css> <scope-class> [from=to ...]
 *
 * Example:
 *   npm run themes:scope-css -- ../ciao_amore/source/app/globals.css \
 *     src/components/invitation/themes/ciao-amore/ciao-amore.css \
 *     theme-ciao-amore /dolce/=/themes/ciao-amore/ .png=.webp
 *
 * Transformations, applied per selector:
 *   :root                -> .scope                 (custom properties travel with the theme)
 *   html, body           -> .scope                 (page-level rules become root-level rules)
 *   main                 -> .scope                 (the theme's frame IS the scope element)
 *   *                    -> .scope, .scope *       (keep the reset, confine it)
 *   h2, p, section, ...  -> .scope h2, ...         (bare element selectors get confined)
 *   .foo                 -> .scope .foo
 *   .scope already there -> untouched
 *
 * @keyframes / @font-face bodies are left alone; @media blocks are recursed into.
 */

import fs from "node:fs";

const [, , inputPath, outputPath, scopeClassRaw, ...assetArgs] = process.argv;
if (!inputPath || !outputPath || !scopeClassRaw) {
  console.error("usage: scope-theme-css.mjs <in.css> <out.css> <scope-class> [from=to ...]");
  process.exit(1);
}
const SCOPE = scopeClassRaw.startsWith(".") ? scopeClassRaw : `.${scopeClassRaw}`;

/** Element selectors that mean "the page" and therefore collapse onto the scope root. */
const ROOT_LIKE = new Set([":root", "html", "body", "main", ":host"]);

/**
 * Split a selector list on commas that sit at depth zero, so commas inside
 * :is(...) / :not(...) / [attr="a,b"] don't split the list.
 */
function splitSelectorList(list) {
  const out = [];
  let depth = 0;
  let quote = null;
  let current = "";
  for (const ch of list) {
    if (quote) {
      current += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth--;
    else if (ch === "," && depth === 0) {
      out.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) out.push(current);
  return out;
}

function scopeOneSelector(selector) {
  const sel = selector.trim();
  if (!sel) return sel;

  // Already scoped, or a keyframe step (`from`, `50%`).
  if (sel.startsWith(SCOPE)) return sel;
  if (/^\d+%$/.test(sel) || sel === "from" || sel === "to") return sel;

  // `html.foo` / `body.bar` behave like the root element itself.
  const rootLikeHead = sel.match(/^(:root|html|body|main|:host)\b/);
  if (rootLikeHead) {
    const head = rootLikeHead[1];
    const rest = sel.slice(head.length);
    if (ROOT_LIKE.has(head)) {
      // `body`         -> `.scope`
      // `body .thing`  -> `.scope .thing`
      // `body.is-open` -> `.scope.is-open`
      return rest.trim() === "" ? SCOPE : `${SCOPE}${rest}`;
    }
  }

  // Universal reset: keep it, but confine it to the subtree.
  if (sel === "*") return `${SCOPE}, ${SCOPE} *`;
  if (/^\*[,\s]/.test(sel) || sel.startsWith("*::")) {
    return `${SCOPE} ${sel}`;
  }

  return `${SCOPE} ${sel}`;
}

function scopeSelectorList(list) {
  return splitSelectorList(list)
    .map(scopeOneSelector)
    .join(", ");
}

/**
 * Walk the stylesheet, rewriting selectors at every nesting level. This is a
 * brace-matching walk rather than a full parser: enough for these hand-written
 * theme sheets, and it never reorders or drops a declaration.
 */
function transform(css) {
  let out = "";
  let i = 0;
  let buffer = "";

  while (i < css.length) {
    const ch = css[i];

    // Preserve comments verbatim, but emit them straight out instead of
    // letting them accumulate in the selector buffer: a rule written as
    // `/* a note */ :root{...}` would otherwise reach scopeOneSelector as
    // "/* a note */ :root", match none of its patterns, and slip through
    // unscoped — which is exactly how a `:root` block escaped once.
    if (ch === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2);
      const stop = end === -1 ? css.length : end + 2;
      if (buffer.trim() === "") {
        out += buffer + css.slice(i, stop);
        buffer = "";
      } else {
        // Mid-selector comment (rare): keep it where it was.
        buffer += css.slice(i, stop);
      }
      i = stop;
      continue;
    }

    if (ch === "{") {
      const prelude = buffer.trim();
      buffer = "";

      // Find the matching close brace.
      let depth = 1;
      let j = i + 1;
      let quote = null;
      while (j < css.length && depth > 0) {
        const c = css[j];
        if (quote) {
          if (c === quote && css[j - 1] !== "\\") quote = null;
        } else if (c === '"' || c === "'") quote = c;
        else if (c === "/" && css[j + 1] === "*") {
          const e = css.indexOf("*/", j + 2);
          j = e === -1 ? css.length : e + 1;
        } else if (c === "{") depth++;
        else if (c === "}") depth--;
        j++;
      }
      const body = css.slice(i + 1, j - 1);

      if (/^@(keyframes|-webkit-keyframes|font-face|counter-style|property)/.test(prelude)) {
        // Opaque bodies: never touch the inside.
        out += `${prelude}{${body}}`;
      } else if (/^@(media|supports|layer|container|scope)/.test(prelude)) {
        // Conditional groups: recurse.
        out += `${prelude}{${transform(body)}}`;
      } else if (prelude.startsWith("@")) {
        out += `${prelude}{${body}}`;
      } else {
        out += `${scopeSelectorList(prelude)}{${body}}`;
      }

      i = j;
      continue;
    }

    // At-rules without a body (`@import ...;`, `@charset ...;`).
    if (ch === ";" && buffer.trim().startsWith("@")) {
      out += `${buffer.trim()};\n`;
      buffer = "";
      i++;
      continue;
    }

    buffer += ch;
    i++;
  }

  return out + buffer;
}

let css = fs.readFileSync(inputPath, "utf8");

// Drop the Tailwind import: these themes never use a utility class, and pulling
// Tailwind's own preflight in would defeat the scoping we just did.
css = css.replace(/@import\s+["']tailwindcss["']\s*;?/g, "");

// Google Fonts @import must not survive either — fonts move to next/font.
const fontImports = css.match(/@import\s+url\([^)]*fonts\.googleapis[^)]*\)\s*;?/g) || [];
css = css.replace(/@import\s+url\([^)]*fonts\.googleapis[^)]*\)\s*;?/g, "");

let out = transform(css);

// Rewrite asset paths (e.g. /dolce/ -> /themes/ciao-amore/, .png -> .webp).
for (const pair of assetArgs) {
  const [from, to] = pair.split("=");
  out = out.split(from).join(to);
}

fs.writeFileSync(outputPath, out);

console.error(`scoped ${inputPath} -> ${outputPath} under ${SCOPE}`);
if (fontImports.length) {
  console.error("removed font @imports (move these to next/font):");
  fontImports.forEach((f) => console.error("  " + f.trim()));
}
