/**
 * Colour codes as the dress-code palette stores them: `#rrggbb`, lowercase.
 * The save accepts more (`validate.ts`, `CSS_COLOR`), but the picker only
 * ever writes this one form.
 */

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** A code the couple typed — with or without its #, short or long — or null when it is not one. */
export function parseHexColor(input: string): string | null {
  const match = HEX.exec(input.trim());
  if (!match) return null;
  const digits = match[1].toLowerCase();
  const long = digits.length === 3 ? [...digits].map((digit) => digit + digit).join("") : digits;
  return `#${long}`;
}

/** The palette once a colour is validated: in place of swatch `slot`, or added at the end. */
export function withColor(colors: readonly string[], slot: number | "new", color: string): string[] {
  return slot === "new" ? [...colors, color] : colors.map((current, index) => (index === slot ? color : current));
}
