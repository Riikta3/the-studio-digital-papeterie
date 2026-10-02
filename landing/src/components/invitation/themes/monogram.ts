import type { InvitationData } from "./types";

/**
 * The couple's monogram: what they wrote on the editor's hero tab, else their
 * initials.
 *
 * `couple.monogram` is absent when the couple wrote none or cleared it (see
 * `types.ts`), and a theme whose design needs one — a seal, a crest — falls
 * back here rather than printing nothing in the middle of an ornament.
 */
export function monogramOf(couple: InvitationData["couple"], separator = " & "): string {
  const written = couple.monogram?.trim();
  if (written) return written;

  return [couple.partner1, couple.partner2]
    .map(initialOf)
    .filter((letter) => letter !== "")
    .join(separator);
}

/** First letter of a name, by code point so an astral character is not split. */
function initialOf(name: string | undefined): string {
  const first = [...(name ?? "").trim()][0];
  return first ? first.toLocaleUpperCase() : "";
}
