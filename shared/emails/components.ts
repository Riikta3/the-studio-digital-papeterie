import { ALPHA, COLORS, FONTS } from "./tokens";

/**
 * The building blocks every email is assembled from.
 *
 * Each returns a string of HTML for one table row of the content card, so a
 * template is a list of these passed to `renderEmail`. Escaping is the
 * caller's job for anything that came from a user — `esc` is exported here so
 * there is one implementation rather than the three this repo used to have.
 */

/** Escapes a value so a name containing `<` cannot break the markup. */
export function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Wraps content in a full-width row of the card, with side padding. */
function row(content: string, padding: string): string {
  return `<tr><td style="padding:${padding}">${content}</td></tr>`;
}

/**
 * The display heading. Georgia, violet, the one serif moment in the body —
 * the header band above it carries the other.
 */
export function heading(text: string): string {
  return row(
    `<h1 style="margin:0;font:600 24px/1.3 ${FONTS.display};color:${COLORS.violet}">${text}</h1>`,
    "28px 32px 0",
  );
}

/** Body copy. */
export function paragraph(text: string): string {
  return row(
    `<p style="margin:0;font:15px/1.65 ${FONTS.sans};color:${COLORS.violet}">${text}</p>`,
    "16px 32px 0",
  );
}

/** Secondary copy — expiry notices, "ignore this if…". */
export function muted(text: string): string {
  return row(
    `<p style="margin:0;font:13px/1.6 ${FONTS.sans};color:${COLORS.violet}${ALPHA.muted}">${text}</p>`,
    "14px 32px 0",
  );
}

/**
 * A small uppercase label, letter-spaced. Used to title a section without
 * spending another serif heading on it.
 */
export function label(text: string): string {
  return row(
    `<p style="margin:0;font:12px/1.4 ${FONTS.sans};letter-spacing:.08em;text-transform:uppercase;color:${COLORS.violet}${ALPHA.muted}">${text}</p>`,
    "24px 32px 0",
  );
}

/**
 * The primary call to action.
 *
 * A pill on a table cell rather than a bare `<a>`: Outlook ignores padding on
 * inline elements, so the shape has to come from a cell it does respect.
 */
export function button(text: string, href: string): string {
  return `<tr><td align="center" style="padding:28px 32px 0">
    <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:separate">
      <tr>
        <td style="border-radius:999px;background:${COLORS.violet}">
          <a href="${href}" style="display:inline-block;padding:14px 32px;font:600 15px/1 ${FONTS.sans};color:${COLORS.beurre};text-decoration:none;border-radius:999px">${text}</a>
        </td>
      </tr>
    </table>
  </td></tr>`;
}

/**
 * The same link again as plain text, for the readers whose client mangles the
 * button. Set in an inset panel so it reads as a footnote rather than as a
 * second call to action, and `word-break` keeps a long token from widening the
 * card. `intro` is a full sentence — that is how the nine translations of it
 * are written.
 */
export function linkFallback(intro: string, href: string): string {
  return row(
    `<div style="padding:14px 16px;background:${COLORS.creme};border-radius:12px">
      <p style="margin:0 0 6px;font:12px/1.5 ${FONTS.sans};color:${COLORS.violet}${ALPHA.faint}">${intro}</p>
      <a href="${href}" style="font:12px/1.6 ${FONTS.sans};color:${COLORS.violet}${ALPHA.muted};word-break:break-all">${href}</a>
    </div>`,
    "24px 32px 0",
  );
}

/**
 * An inset panel on cream, for quoted content — a visitor's message, a
 * summary block. `pre-wrap` preserves the line breaks they typed.
 */
export function panel(content: string): string {
  return row(
    `<div style="padding:16px 18px;background:${COLORS.creme};border-radius:14px;font:15px/1.65 ${FONTS.sans};color:${COLORS.violet};white-space:pre-wrap;word-break:break-word">${content}</div>`,
    "12px 32px 0",
  );
}

/**
 * A label/value pair for a details table. Returns "" for an empty value so
 * callers can list every possible field and let the blanks fall out.
 */
export function infoRow(labelText: string, value: string | undefined): string {
  if (!value) return "";
  const border = `1px solid ${COLORS.lavande}${ALPHA.hairline}`;
  return `<tr>
    <td style="padding:10px 0;border-bottom:${border};font:12px/1.4 ${FONTS.sans};letter-spacing:.08em;text-transform:uppercase;color:${COLORS.violet}${ALPHA.muted};white-space:nowrap;vertical-align:top">${labelText}</td>
    <td style="padding:10px 0 10px 16px;border-bottom:${border};font:15px/1.5 ${FONTS.sans};color:${COLORS.violet};vertical-align:top">${value}</td>
  </tr>`;
}

/** Wraps `infoRow`s into a table. Returns "" when every row was empty. */
export function infoTable(rows: string[]): string {
  const body = rows.join("");
  if (!body) return "";
  return row(
    `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">${body}</table>`,
    "20px 32px 0",
  );
}

/** A hairline rule across the card. */
export function divider(): string {
  return row(
    `<div style="height:1px;background:${COLORS.lavande}${ALPHA.hairline};font-size:0;line-height:0">&nbsp;</div>`,
    "28px 32px 0",
  );
}

/** Vertical breathing room where no element naturally provides it. */
export function spacer(height = 8): string {
  return `<tr><td style="height:${height}px;font-size:0;line-height:0">&nbsp;</td></tr>`;
}
