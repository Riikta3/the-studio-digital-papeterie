/**
 * A number in Roman numerals ("I", "IV", "XII"), the way the theme counts its
 * days ("Jour I", "Jour II"): for the brass plates of the gallery and the lines
 * of the dance card. Outside 1–3999 the number is written as it is.
 */
const NUMERALS: ReadonlyArray<readonly [number, string]> = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

export function roman(value: number): string {
  if (!Number.isInteger(value) || value < 1 || value > 3999) return String(value);
  let rest = value;
  let text = "";
  for (const [amount, numeral] of NUMERALS) {
    while (rest >= amount) {
      text += numeral;
      rest -= amount;
    }
  }
  return text;
}
