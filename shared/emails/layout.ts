import { esc } from "./components";
import { ALPHA, BRAND_NAME, CARD_WIDTH, COLORS, FONTS, LOGO } from "./tokens";

/**
 * Every string field below is interpolated as raw HTML: `subtitle` has to
 * carry a link, and escaping only some fields is how a template ends up
 * double-escaping one and not another. Callers pass values through `esc`
 * themselves — the one exception is `preheader`, which is escaped here because
 * it can never be anything but text.
 */
export interface EmailLayoutInput {
  /**
   * The inbox preview line. Clients that show one take it from here rather
   * than from the first words of the body, which are usually the heading
   * repeated.
   */
  preheader: string;
  /**
   * The eyebrow above the header title — small, uppercase, letter-spaced.
   * Optional: the account emails use the brand name, the contact notification
   * uses the message subject.
   */
  eyebrow?: string;
  /** The header title, set in Georgia on the violet band. */
  title: string;
  /** An optional line under the title, e.g. the sender's address. */
  subtitle?: string;
  /** Rows built with the helpers in `./components`. */
  children: string[];
  /** Footer copy, below the hairline. */
  footer?: string;
  /** BCP 47 tag for `lang`. */
  locale?: string;
  /** Set "rtl" for Arabic. */
  dir?: "ltr" | "rtl";
}

/**
 * Strips tags from an already-escaped title so <title> shows text rather than
 * markup. Escaping again here would render `&amp;lt;` in the tab.
 */
function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, "");
}

/**
 * Assembles a complete email document.
 *
 * The shape is fixed across every message we send: a violet header band
 * carrying the monogram and the title, a white card for the content, a cream
 * page behind both. Individual templates vary only in the rows they pass as
 * `children` — which is the whole point of this module, since the four
 * templates it replaced each rebuilt this scaffolding from scratch.
 */
export function renderEmail(input: EmailLayoutInput): string {
  const {
    preheader,
    eyebrow = BRAND_NAME,
    title,
    subtitle,
    children,
    footer,
    locale = "fr",
    dir = "ltr",
  } = input;

  // Padded out so a short preheader cannot pull the first line of the heading
  // into the preview after it. Zero-width non-joiners are invisible in every
  // client and, unlike &nbsp;, do not collapse into visible spaces.
  const preheaderBlock = `<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${esc(
    preheader,
  )}${"&#8204;&nbsp;".repeat(60)}</div>`;

  return `<!doctype html>
<html lang="${esc(locale)}" dir="${dir}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${stripTags(title)}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.creme};-webkit-font-smoothing:antialiased">
  ${preheaderBlock}
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${COLORS.creme};padding:32px 12px">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:${CARD_WIDTH}px;border-collapse:collapse;background:${COLORS.white};border-radius:20px;overflow:hidden">

          <tr>
            <td style="padding:28px 32px;background:${COLORS.violet}">
              <img src="${LOGO.cream}" width="${LOGO.width}" height="${LOGO.height}" alt="${esc(BRAND_NAME)}"
                   style="display:block;border:0;outline:none;text-decoration:none;margin-bottom:16px">
              <p style="margin:0;font:12px/1.4 ${FONTS.sans};letter-spacing:.14em;text-transform:uppercase;color:${COLORS.beurre}${ALPHA.onVioletMuted}">${eyebrow}</p>
              <p style="margin:8px 0 0;font:600 24px/1.3 ${FONTS.display};color:${COLORS.beurre}">${title}</p>
              ${subtitle ? `<p style="margin:6px 0 0;font:14px/1.5 ${FONTS.sans};color:${COLORS.beurre}${ALPHA.onVioletMuted}">${subtitle}</p>` : ""}
            </td>
          </tr>

          ${children.join("\n          ")}

          <tr><td style="height:28px;font-size:0;line-height:0">&nbsp;</td></tr>

          ${
            footer
              ? `<tr>
            <td style="padding:20px 32px 28px;border-top:1px solid ${COLORS.lavande}${ALPHA.hairline}">
              <p style="margin:0;font:12px/1.6 ${FONTS.sans};color:${COLORS.violet}${ALPHA.faint}">${footer}</p>
            </td>
          </tr>`
              : ""
          }

        </table>

        <p style="margin:20px 0 0;font:11px/1.5 ${FONTS.sans};color:${COLORS.violet}${ALPHA.faint}">${esc(BRAND_NAME)}</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
