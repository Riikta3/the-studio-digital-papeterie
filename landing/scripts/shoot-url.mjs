/**
 * Screenshot any URL at a given width, scrolling it first so reveal-on-scroll
 * blocks appear. For comparing a ported theme with the designer's live
 * reference (the URL in the handoff note).
 *
 *   npm run themes:shoot-url -w landing -- https://example.com 390 /tmp/ref ref
 *
 * A page taller than 16 000 px is written as several files (`parts` in the
 * output), because Chromium cannot capture more than 16 384 px in one image.
 *
 * A live reference can sit behind a login (the Château one asks for a ChatGPT
 * account); the designer's own folder works as well, as a `file://` URL:
 *   npm run themes:shoot-url -w landing -- file:///path/to/dist/index.html 1440 /tmp/ref chateau
 *
 * Requires Google Chrome installed (same as `themes:shoot`).
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const [, , url, widthArg = "390", outDir = "/tmp/shots", tag = "reference"] = process.argv;

if (!url) {
  console.error("usage: shoot-url.mjs <url> [width] [outDir] [tag]");
  process.exit(1);
}
const width = Number(widthArg);
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  channel: "chrome",
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const page = await browser.newPage({ viewport: { width, height: 900 } });
await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });

// Same stepwise walk as `shoot-theme.mjs`: jumping to the bottom leaves
// IntersectionObserver blocks at opacity 0 and sections photograph blank.
const viewportH = page.viewportSize()?.height ?? 900;
const pageH = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < pageH; y += Math.floor(viewportH * 0.8)) {
  await page.evaluate((top) => window.scrollTo(0, top), y);
  await page.waitForTimeout(260);
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(800);

// Chromium wraps a full-page capture taller than 16 384 px: the bottom of the
// image repeats the top of the page. A tall page is therefore captured in
// slices — `<tag>-<width>-full.png`, then `-full-2.png`, … — and a normal one
// in a single file, as before.
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

const metrics = await page.evaluate(() => ({
  scrollW: document.documentElement.scrollWidth,
  clientW: document.documentElement.clientWidth,
  bodyH: document.body.scrollHeight,
}));

console.log(JSON.stringify({ full, ...(parts.length > 1 ? { parts } : {}), metrics }, null, 1));
await browser.close();
