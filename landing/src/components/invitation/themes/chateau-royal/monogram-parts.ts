/**
 * Splits "E & R" into its two halves and the separator between them, so the
 * crest can set the separator in the script face as the designer's did.
 * A monogram without a recognisable separator is returned as null and printed whole.
 */
export function splitMonogram(
  text: string,
): { left: string; separator: string; right: string } | null {
  const match = text.trim().match(/^(.+?)\s*([&·+])\s*(.+)$/);
  if (!match) return null;
  return { left: match[1]!.trim(), separator: match[2]!, right: match[3]!.trim() };
}
