/**
 * The CSS pipeline: pre-process, scope, post-process, verify.
 *
 *   node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs \
 *     --test landing/src/lib/port-theme-css.test.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  bakeDecorWords,
  portThemeCss,
  preprocess,
  scopeKeyframes,
  substituteFonts,
  verify,
} from "../../scripts/port-theme-css.mjs";

const squash = (css) => css.replace(/\s+/g, " ").trim();

/* -- preprocess --------------------------------------------------------- */

test("preprocess drops the framework imports and the comments", () => {
  const out = preprocess(
    `@import "tailwindcss"; @import "tw-animate-css"; @import "../vendor/shadcn-4.css";
     @import url("https://fonts.googleapis.com/css2?family=Jost");
     /* a note */ .a{color:red}`,
    { dropImports: ["tw-animate-css", "shadcn"] },
  );
  assert.equal(squash(out), ".a{color:red}");
});

test("preprocess moves the source's main onto the column class, everywhere", () => {
  const out = preprocess(
    `main{width:720px} main > .x{color:red} body{background:#7b8574}
     @media (max-width:600px){main{width:100%}} .main-title{color:blue}`,
    { columnClass: "ma-column" },
  );
  const css = squash(out);
  assert.match(css, /\.ma-column\{width:720px\}/);
  assert.match(css, /\.ma-column > \.x/);
  assert.match(css, /@media \(max-width:600px\)\{\.ma-column\{width:100%\}\}/);
  assert.match(css, /body\{background:#7b8574\}/, "body stays: it becomes the root");
  assert.match(css, /\.main-title/, "a class that merely starts with main is untouched");
});

test("without a column class, main is left for the scoper to fold onto the root", () => {
  assert.match(squash(preprocess("main{overflow:hidden}")), /^main\{overflow:hidden\}$/);
});

/* -- scopeKeyframes ----------------------------------------------------- */

test("keyframes are prefixed with the theme, and so is every use", () => {
  const out = squash(
    scopeKeyframes(
      `@keyframes spin{to{transform:rotate(1turn)}} @-webkit-keyframes spin{to{transform:rotate(1turn)}}
       @keyframes fade{from{opacity:0}}
       .a{animation:spin 2s linear infinite,fade 1s ease} .b{animation-name:fade;animation-duration:var(--d,1s)} .c{animation:none}`,
      "t-",
    ),
  );
  assert.match(out, /@keyframes t-spin/);
  assert.match(out, /@-webkit-keyframes t-spin/);
  assert.match(out, /@keyframes t-fade/);
  assert.match(out, /animation:t-spin 2s linear infinite,t-fade 1s ease/);
  assert.match(out, /animation-name:t-fade/);
  assert.match(out, /animation:none/, "a keyword is left alone");
  assert.match(out, /var\(--d,1s\)/, "a fallback inside var() is left alone");
});

test("scoping keyframes twice changes nothing the second time", () => {
  const once = scopeKeyframes("@keyframes spin{to{opacity:1}} .a{animation:spin 1s}", "t-");
  assert.equal(scopeKeyframes(once, "t-"), once);
});

test("verify reports a keyframe that kept its global name", () => {
  const publicDir = fs.mkdtempSync(path.join(os.tmpdir(), "port-css-public-"));
  const bare = verify("@keyframes spin{to{opacity:1}}", { scope: "theme-t", publicDir, keyframePrefix: "t-" });
  assert.deepEqual(bare.unscopedKeyframes, ["spin"]);
  const scoped = verify("@keyframes t-spin{to{opacity:1}}", { scope: "theme-t", publicDir, keyframePrefix: "t-" });
  assert.deepEqual(scoped.unscopedKeyframes, []);
});

/* -- substituteFonts ---------------------------------------------------- */

const APPLE = [
  { family: "Didot", variable: "--font-ma-display", position: "after" },
  { family: "Avenir Next", variable: "--font-ma-sans", position: "after" },
  { family: "Avenir", variable: "--font-ma-sans", position: "after" },
];

test("an Apple-only face keeps the first place and the web font follows it", () => {
  const out = squash(
    substituteFonts(
      `h1{font:400 clamp(3rem,10vw,5.7rem)/0.95 Didot, "Bodoni MT", Georgia, serif}
       p{font-family:"Avenir Next", Avenir, Arial, sans-serif}`,
      APPLE,
    ),
  );
  assert.match(out, /Didot, var\(--font-ma-display\), "Bodoni MT", Georgia, serif/);
  assert.match(out, /"Avenir Next", var\(--font-ma-sans\), Avenir, Arial, sans-serif/);
});

test("a face the designer loaded from Google Fonts is replaced by the variable first", () => {
  const out = squash(
    substituteFonts(
      `body{font:400 1rem/1.5 Jost,sans-serif} h1{font:400 5rem/.9 'Bodoni Moda',serif} .k{font:1.25rem 'Bodoni Moda'}`,
      [
        { family: "Jost", variable: "--font-cr-sans", position: "before" },
        { family: "Bodoni Moda", variable: "--font-cr-display", position: "before" },
      ],
    ),
  );
  assert.match(out, /1\.5 var\(--font-cr-sans\), Jost,sans-serif/);
  assert.match(out, /\.9 var\(--font-cr-display\), 'Bodoni Moda',serif/);
  assert.match(out, /1\.25rem var\(--font-cr-display\), 'Bodoni Moda'\}/);
});

test("fonts are substituted once, and only whole family names", () => {
  const css = `a{font-family:Didot,serif} b{font-family:"Didot Display",serif} c{font:italic 1em Georgia,serif}`;
  const once = substituteFonts(css, APPLE);
  assert.equal(substituteFonts(once, APPLE), once, "idempotent");
  assert.doesNotMatch(squash(once), /Didot Display", var/);
  assert.match(squash(once), /c\{font:italic 1em Georgia,serif\}/);
});

/* -- bakeDecorWords ----------------------------------------------------- */

test("words drawn by content: become custom properties", () => {
  const { css, unmapped } = bakeDecorWords(
    `.a::before{content:"S · M"} .b::after{content:'CASA  ·  X'} .c::before{content:"★  ★\\A★"} .d::before{content:""} .e::before{content:"\\201C"}`,
    { "S · M": "--ma-menu-monogram", "CASA  ·  X": "--ma-menu-footer" },
  );
  assert.deepEqual(unmapped, []);
  assert.match(css, /content:\s*var\(--ma-menu-monogram\)/);
  assert.match(css, /content:\s*var\(--ma-menu-footer\)/);
  assert.match(css, /content:\s*"★  ★\\A★"/, "a decoration with no letters is left alone");
});

test("a content string with letters and no mapping is reported", () => {
  const { unmapped } = bakeDecorWords(`.a::before{content:"SÃO VICENTE"}`, {});
  assert.deepEqual(unmapped, ["SÃO VICENTE"]);
});

/* -- verify ------------------------------------------------------------- */

test("verify reports selectors outside the scope, undefined variables and missing assets", () => {
  const publicDir = fs.mkdtempSync(path.join(os.tmpdir(), "port-css-public-"));
  fs.mkdirSync(path.join(publicDir, "themes/t"), { recursive: true });
  fs.writeFileSync(path.join(publicDir, "themes/t/there.webp"), "x");

  const report = verify(
    `.theme-t{--gold:#b8}
     .theme-t .a{color:var(--gold);background:url("/themes/t/there.webp")}
     .theme-t .b{color:var(--ghost);background:url(/themes/t/gone.webp);font-family:var(--font-t-sans)}
     .leak{color:red}
     @keyframes spin{from{opacity:0}to{opacity:1}}`,
    { scope: "theme-t", publicDir, markup: ["<div class='a'></div>"] },
  );
  assert.deepEqual(report.outside, [".leak"]);
  assert.deepEqual(report.undefinedVars, ["--ghost"]);
  assert.deepEqual(report.missingAssets, ["/themes/t/gone.webp"]);
  assert.deepEqual(report.unusedClasses, ["b", "leak"]);
});

test("verify does not call a decor variable undefined: the theme's root sets it", () => {
  const css = `.theme-t .a::before{content:var(--t-word)}`;
  const publicDir = fs.mkdtempSync(path.join(os.tmpdir(), "port-css-public-"));
  assert.deepEqual(verify(css, { scope: "theme-t", publicDir }).undefinedVars, ["--t-word"]);
  assert.deepEqual(
    verify(css, { scope: "theme-t", publicDir, externalVars: ["--t-word"] }).undefinedVars,
    [],
  );
});

/* -- the whole pipeline ------------------------------------------------- */

test("portThemeCss turns a designer sheet into a scoped, font-aware, leak-free file", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "port-css-"));
  fs.mkdirSync(path.join(dir, "public/themes/t"), { recursive: true });
  fs.writeFileSync(path.join(dir, "public/themes/t/bg.webp"), "x");
  fs.writeFileSync(
    path.join(dir, "globals.css"),
    `@import "tailwindcss";
     :root{--ivory:#f5f0e7;--gold:#b69961}
     body{margin:0;background:#7b8574}
     main{width:min(100%,720px);margin:auto;background:var(--ivory)}
     h2{font:400 3rem/1 Didot, serif;color:var(--gold)}
     .hero{background:url("/bg.png")}
     .card::before{content:"S · M"}
     @keyframes spin{to{opacity:1}} .card{animation:spin 1s}
     @media (max-width:600px){main{width:100%}}`,
  );
  fs.writeFileSync(path.join(dir, "markup.html"), `<main class="hero card"><h2>x</h2></main>`);

  const result = portThemeCss({
    source: path.join(dir, "globals.css"),
    out: path.join(dir, "t.css"),
    scope: "theme-t",
    columnClass: "t-column",
    assets: ["/bg.png=/themes/t/bg.webp"],
    fonts: [{ family: "Didot", variable: "--font-t-display", position: "after" }],
    decor: { "S · M": "--t-monogram" },
    publicDir: path.join(dir, "public"),
    markup: [path.join(dir, "markup.html")],
  });

  const css = squash(fs.readFileSync(path.join(dir, "t.css"), "utf8"));
  assert.match(css, /\.theme-t\{--ivory:#f5f0e7/);
  assert.match(css, /\.theme-t\{margin:0;background:#7b8574\}/);
  assert.match(css, /\.theme-t \.t-column\{width:min\(100%,720px\)/);
  assert.match(css, /Didot, var\(--font-t-display\), serif/);
  assert.match(css, /\/themes\/t\/bg\.webp/);
  assert.match(css, /content:\s*var\(--t-monogram\)/);
  assert.match(css, /@keyframes t-spin/);
  assert.match(css, /animation:\s*t-spin 1s/);
  assert.doesNotMatch(css, /tailwindcss/);
  assert.deepEqual(result.report.outside, []);
  assert.deepEqual(result.report.unscopedKeyframes, []);
});

test("portThemeCss lets the config name the custom properties set at runtime", () => {
  // Cabo Verde's sheet reads `--c` (an inline `style="--c:#e96b8a"` on each
  // swatch) and `--section-shift` (written by its script): defined nowhere in
  // the sheet, and right to be.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "port-css-"));
  fs.writeFileSync(
    path.join(dir, "globals.css"),
    `.swatch{background:var(--c)} .tile{translate:0 var(--shift,0px)}`,
  );
  const config = {
    source: path.join(dir, "globals.css"),
    out: path.join(dir, "t.css"),
    scope: "theme-t",
    publicDir: dir,
  };

  assert.throws(() => portThemeCss(config), /never defined: --c, --shift[\s\S]*externalVars/);
  const result = portThemeCss({ ...config, externalVars: ["--c", "--shift"] });
  assert.deepEqual(result.report.undefinedVars, []);
  assert.match(fs.readFileSync(path.join(dir, "t.css"), "utf8"), /var\(--c\)/);
});

test("portThemeCss fails loudly on an unmapped word and on a leak", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "port-css-"));
  fs.writeFileSync(path.join(dir, "globals.css"), `.a::before{content:"SÃO VICENTE"}`);
  assert.throws(
    () =>
      portThemeCss({
        source: path.join(dir, "globals.css"),
        out: path.join(dir, "t.css"),
        scope: "theme-t",
        publicDir: dir,
      }),
    /SÃO VICENTE/,
  );
});
