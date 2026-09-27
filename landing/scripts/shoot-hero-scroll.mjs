/**
 * Capture the tall strip each hero card scrolls through.
 *
 *   npm run themes:shoot-scroll            # every theme in the hero
 *   npm run themes:shoot-scroll -- belle-rive
 *
 * The home page hero shows each theme as a card, and the card at the centre
 * slowly scrolls down that theme's invitation. Loading the real invitation in
 * an iframe for that would pull a whole theme's markup, fonts and images into
 * the first screen of the site; a single pre-rendered strip costs one image,
 * fetched only for the card that is actually in front.
 *
 * Captured at phone width (390) because that is the invitation's own layout,
 * and a hero card is portrait. Kept to the top CAP_CSS_PX of the page — cover,
 * countdown, programme — which is what a visitor has time to watch before they
 * swipe, and the full page would exceed WebP's 16383px height limit at 2x.
 *
 * Output, per theme:
 *   public/themes/<id>/scroll.webp — the strip the active card scrolls
 *   public/themes/<id>/cover.webp  — its first screen, exactly
 *
 * The cover is cut from the same capture rather than shot separately. The
 * resting cards show the cover and the centre card swaps to the strip when it
 * starts scrolling; if the two came from different captures — as they did,
 * the old covers predating a change to the demo's date — the card visibly
 * jumps at the moment it comes alive.
 *
 * Requires the dev server on :3010 and Google Chrome installed, like
 * `themes:shoot`.
 */
import { chromium } from "playwright";
import sharp from "sharp";
import { mkdirSync } from "node:fs";

/** Themes shown in the hero — keep in step with src/components/home/themes.ts. */
const HERO_THEMES = ["ciao-amore", "blanc-couture", "belle-rive"];

/** CSS pixels of invitation to keep, from the top. */
const CAP_CSS_PX = 5000;

/**
 * Output width. The active hero card is at most ~320 CSS px wide, so 640 is
 * sharp on a 2x screen without shipping pixels nobody sees.
 */
const OUT_WIDTH = 640;

const only = process.argv[2];
const themes = only ? [only] : HERO_THEMES;

const browser = await chromium.launch({
  channel: "chrome",
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});

for (const id of themes) {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });

  await page.goto(`http://localhost:3010/fr/invitation/demo/${id}`, {
    waitUntil: "networkidle",
    timeout: 90000,
  });

  // Chrome that belongs to the browser session, not to the invitation: the
  // dev overlay, and floating buttons that would sit in the same spot on
  // every frame of the scroll.
  await page.addStyleTag({
    content: [
      "nextjs-portal,[data-nextjs-toast]{display:none!important}",
      ".ca-scrolltop,.music-toggle{display:none!important}",
    ].join(""),
  });

  // Walk down so every reveal-on-scroll block crosses its threshold; jumping
  // to the bottom leaves them at opacity 0 and they photograph as blank.
  const height = Math.min(
    CAP_CSS_PX,
    await page.evaluate(() => document.body.scrollHeight),
  );
  for (let y = 0; y < height + 844; y += 600) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(250);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);

  const png = await page.screenshot({
    fullPage: true,
    clip: { x: 0, y: 0, width: 390, height },
  });

  const dir = `public/themes/${id}`;
  mkdirSync(dir, { recursive: true });
  const out = `${dir}/scroll.webp`;

  const info = await sharp(png)
    .resize({ width: OUT_WIDTH })
    .webp({ quality: 72, effort: 6 })
    .toFile(out);

  // Same 780x1452 frame as before (the card's 290:540 ratio at 2x), so every
  // other reader of `cover.webp` keeps its geometry.
  const coverOut = `${dir}/cover.webp`;
  const cover = await sharp(png)
    .extract({ left: 0, top: 0, width: 780, height: 1452 })
    .webp({ quality: 78, effort: 6 })
    .toFile(coverOut);

  console.log(
    `${id}: ${out} ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)} KB` +
      ` · ${coverOut} ${(cover.size / 1024).toFixed(0)} KB`,
  );

  await page.close();
}

await browser.close();
