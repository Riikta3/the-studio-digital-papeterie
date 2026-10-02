import { Fragment } from "react";

import type { InvitationData } from "./types";

/**
 * Reading the words a couple rewrote in the editor.
 *
 * A theme prints two kinds of text: the couple's content (names, programme,
 * FAQ), which always comes from `data`, and its own voice — "Le programme",
 * "Bon à savoir", a stamp reading "ITALIA" — which comes from its catalogue.
 * The editor lets a couple rewrite the second kind too, and those versions
 * arrive in `data.texts`, keyed by the slot names the theme declares in its
 * `editor.ts`.
 *
 * Deliberately not a hook and not client-only: sections render on the server
 * for the public page and in the browser for the editor's live preview, and
 * both must read the same words the same way.
 */

/**
 * A value as a CSS string literal, for words a theme draws with `content:`.
 *
 * Decorative words baked into a stylesheet ("MATRIMONIO IN ITALIA") become
 * editable by reading them from a custom property that the theme's root sets
 * from the couple's text. Backslashes and quotes are escaped so the value can
 * never close the string and add declarations of its own, and a line break
 * becomes CSS's `\A` (the rule needs `white-space: pre` to honour it).
 */
export function cssString(value: string): string {
  const escaped = value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, "\\A ")
    // Any other control character has no business in a decoration.
    .replace(/[\u0000-\u001f\u007f]/g, "");
  return `"${escaped}"`;
}

/** The couple's version of one of the theme's own words, or undefined. */
export function slot(data: InvitationData, key: string): string | undefined {
  const value = data.texts?.[key]?.trim();
  return value ? value : undefined;
}

/**
 * Text set on several lines: each line break becomes a `<br />`.
 *
 * The themes print some titles on two lines ("Serez-vous / des nôtres ?"),
 * which the catalogue stores as two messages and a couple writes as one value
 * with a line break in it. Both go through here, so the markup is the same
 * whichever wrote it.
 */
export function Lines({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, index) => (
        <Fragment key={index}>
          {index > 0 ? <br /> : null}
          {line}
        </Fragment>
      ))}
    </>
  );
}
