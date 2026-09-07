import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";

import { routing } from "@/navigation";

// Every share of this site — and on a wedding product the distribution is
// almost entirely social — used to render as an empty card: the metadata
// declared `openGraph` and `summary_large_image` but never an image.
export const alt = "The Studio Digital Papeterie";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Satori embeds real glyph outlines rather than asking a browser to shape
// text, so it needs a font that actually covers the script. The bundled
// default is Latin-only: Arabic needs contextual substitution (it failed the
// build outright with "substFormat: 3 is not yet supported") and CJK needs
// tens of thousands of ideographs. Each script therefore gets its own Noto
// face, fetched at build time and cached per process.
const NOTO = {
  latin:
    "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans@latest/latin-400-normal.ttf",
  sc: "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-sc@latest/chinese-simplified-400-normal.ttf",
  jp: "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-jp@latest/japanese-400-normal.ttf",
} as const;

/*
 * Arabic is deliberately absent.
 *
 * Shaping it needs GSUB lookupType 5 / substFormat 3, which the Satori build
 * bundled in Next 16.1 rejects outright — with Noto Sans Arabic supplied it
 * still fails the build, so this is the renderer's limit and not a missing
 * font. Rather than ship no card at all for /ar, that locale falls back to
 * the Latin wordmark below: a correct brand card, minus the translated line.
 */
const UNSHAPEABLE = new Set(["ar"]);

const fontCache = new Map<string, Promise<ArrayBuffer>>();

function loadFont(url: string) {
  let pending = fontCache.get(url);
  if (!pending) {
    pending = fetch(url).then((response) => {
      if (!response.ok) {
        throw new Error(`OG font fetch failed: ${url} (${response.status})`);
      }
      return response.arrayBuffer();
    });
    fontCache.set(url, pending);
  }
  return pending;
}

// `slice` alone cut mid-word ("...et toute"). Trim back to the last space so
// the card ends on a whole word, and only add the ellipsis if we actually
// dropped something. CJK has no spaces, so the plain slice stands there.
function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  const kept = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${kept.trimEnd()}…`;
}

function fontUrlFor(locale: string) {
  if (locale === "zh") return NOTO.sc;
  if (locale === "ja") return NOTO.jp;
  return NOTO.latin;
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const shapeable = !UNSHAPEABLE.has(locale);
  const fontData = await loadFont(fontUrlFor(locale));

  // Brand tokens are duplicated as literals on purpose: Satori resolves no
  // Tailwind and no CSS variables, so `shared/tailwind-preset.js` cannot
  // reach this renderer.
  const violet = "#4B3F72";
  const jaune = "#F2E5AA";
  const lavande = "#B7AFD1";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: violet,
          padding: "80px",
          fontFamily: "Noto Sans",
          // Arabic and CJK read right-to-left / need their own centring, and
          // this card is a single centred column either way.
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            color: lavande,
            fontSize: 26,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
          }}
        >
          <div style={{ width: 48, height: 1, background: lavande }} />
          <span>The Studio</span>
          <div style={{ width: 48, height: 1, background: lavande }} />
        </div>

        <div
          style={{
            marginTop: 40,
            color: jaune,
            fontSize: 64,
            lineHeight: 1.15,
            maxWidth: 900,
            display: "flex",
          }}
        >
          {shapeable ? t("ogTitle") : "The Studio Digital Papeterie"}
        </div>

        {shapeable && (
          <div
            style={{
              marginTop: 32,
              color: "#FFFDE8",
              fontSize: 28,
              opacity: 0.85,
              maxWidth: 820,
              lineHeight: 1.4,
              display: "flex",
            }}
          >
            {truncate(t("description"), 120)}
          </div>
        )}
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Noto Sans", data: fontData, style: "normal", weight: 400 }],
    },
  );
}
