/**
 * Screenshot a theme demo at a given width, one image per section.
 *
 *   npm run themes:shoot -- <themeId> [width] [outDir] [fixture]
 *   SHOOT_LOCALE=de npm run themes:shoot -- ciao-amore 1440 /tmp/shots heavy
 *
 * Themes are ported from standalone mobile-first projects, so the only way to
 * know a section actually composes at a desktop width is to look at it. This
 * writes one PNG per top-level section plus a full-page capture, and reports
 * `scrollW` vs `clientW` — if they differ, something is pushing the page
 * sideways.
 *
 * Requires the dev server on :3010 and Google Chrome installed.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const [, , themeId, widthArg = "1440", outDir = "/tmp/shots", fixture] = process.argv;
// SHOOT_LOCALE=de|ar|… renders the demo in another language; files are tagged.
const locale = process.env.SHOOT_LOCALE ?? "fr";
const tag = [themeId, fixture, locale === "fr" ? null : locale].filter(Boolean).join("-");

if (!themeId) {
  console.error("usage: shoot-theme.mjs <themeId> [width] [outDir] [fixture]");
  process.exit(1);
}
const width = Number(widthArg);

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  channel: "chrome",
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const page = await browser.newPage({ viewport: { width, height: 900 } });

await page.goto(`http://localhost:3010/${locale}/invitation/demo/${themeId}${fixture ? `?fixture=${fixture}` : ""}`, {
  waitUntil: "networkidle",
  timeout: 60000,
});

// The dev overlay would otherwise sit in the corner of every capture.
await page.addStyleTag({
  content: "nextjs-portal,[data-nextjs-toast]{display:none!important}",
});

// Walk down the page a viewport at a time so every reveal-on-scroll block
// crosses the IntersectionObserver threshold. Jumping straight to the bottom
// skips most of them, and they stay at `opacity: 0` — whole sections then
// photograph as blank, which looks like a layout bug and is not one.
const viewportH = page.viewportSize()?.height ?? 900;
const pageH = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < pageH; y += Math.floor(viewportH * 0.8)) {
  await page.evaluate((top) => window.scrollTo(0, top), y);
  await page.waitForTimeout(220);
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(600);

// Chromium wraps a full-page capture taller than 16 384 px: the bottom of the
// image repeats the top of the page (a `heavy` dataset easily gets there). A
// tall page is therefore captured in slices — `-full.png`, then `-full-2.png`,
// … — and a normal one in a single file, as before.
const MAX_FULL = 16000;
const SLICE = 8000;
const height = await page.evaluate(() => document.documentElement.scrollHeight);
const slices = height > MAX_FULL ? Math.ceil(height / SLICE) : 1;
const parts = [];
for (let i = 0; i < slices; i += 1) {
  const path = `${outDir}/${tag}-${width}-full${i === 0 ? "" : `-${i + 1}`}.png`;
  await page.screenshot(
    slices === 1
      ? { path, fullPage: true }
      : { path, fullPage: true, clip: { x: 0, y: i * SLICE, width, height: Math.min(SLICE, height - i * SLICE) } },
  );
  parts.push(path);
}
const full = parts[0];

// One shot per top-level section, so each component can be judged on its own.
const sections = await page.$$("main > *, main > div > *");
const shots = [];
for (const [i, el] of sections.entries()) {
  const box = await el.boundingBox();
  if (!box || box.height < 40) continue;
  const cls = (await el.getAttribute("class")) || (await el.evaluate((n) => n.tagName.toLowerCase()));
  const name = cls.split(/\s+/).slice(0, 2).join("_").replace(/[^\w-]/g, "") || `sec${i}`;
  const path = `${outDir}/${tag}-${width}-${String(i).padStart(2, "0")}-${name}.png`;
  try {
    await el.screenshot({ path });
    shots.push({ path, name, height: Math.round(box.height) });
  } catch {
    /* element detached or zero-sized; skip */
  }
}

const metrics = await page.evaluate(() => ({
  scrollW: document.documentElement.scrollWidth,
  clientW: document.documentElement.clientWidth,
  bodyH: document.body.scrollHeight,
}));

console.log(JSON.stringify({ full, ...(parts.length > 1 ? { parts } : {}), shots, metrics }, null, 1));
await browser.close();
