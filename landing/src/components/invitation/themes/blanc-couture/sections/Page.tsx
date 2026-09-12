import type { ReactNode } from "react";

/**
 * The `.page` wrapper every section of the source is built on.
 *
 * Kept as a component rather than inlined because the source repeats its exact
 * markup eleven times, and the CSS depends on all of it: `.light-pass` draws
 * the sweeping highlight, `.content.reveal` is what the scroll observer
 * watches, and `.page-monogram` is the gold monogram pinned to every section's
 * foot.
 *
 * `side` replaces the source's `.page:nth-of-type(even)` selector, which chose
 * the direction the eyebrow slides in from. Position-based selectors break the
 * moment a wedding omits a module — the sections after the gap all flip — so
 * the alternation is computed in `BlancCoutureRoot` and passed down instead.
 */
export function Page({
  className = "",
  children,
  side = "left",
  id,
  monogram,
  couple,
}: {
  className?: string;
  children: ReactNode;
  side?: "left" | "right";
  id?: string;
  /** Falls back to these initials when the couple set no monogram. */
  couple?: { partner1: string; partner2: string };
  /**
   * The couple's monogram, for the mark at the foot of the section. Passed
   * down rather than defaulted: the fallback used to be the demo couple's
   * initials, printed on every wedding that set none of its own.
   */
  monogram?: string;
}) {
  return (
    <section id={id} className={`page ${className}`} data-side={side}>
      <div className="light-pass" />
      <div className="content reveal">{children}</div>
      <Monogram text={monogram} couple={couple} />
    </section>
  );
}

/**
 * The small gold monogram repeated at the foot of every page.
 *
 * Renders nothing when there are no initials to print. It used to fall back to
 * the demo couple's `"V & G"`, so a wedding that set no monogram stamped
 * Victoria and Gabriel's letters on every section; an empty " & " would be no
 * better, so the element is dropped instead.
 */
export function Monogram({
  text,
  couple,
}: {
  text?: string;
  couple?: { partner1: string; partner2: string };
}) {
  const [first, second] = splitMonogram(text, couple);

  if (!first && !second) return null;

  return (
    <span className="page-monogram" aria-hidden="true">
      {first} <em>&amp;</em> {second}
    </span>
  );
}

/**
 * "V & G" -> ["V", "G"]. The ampersand is re-emitted as its own `<em>` because
 * the CSS styles it in italic Bodoni against the Italiana letters either side.
 *
 * The fallback used to be the literal `"V & G"` — the demo couple's initials —
 * so a wedding with no monogram set printed Victoria and Gabriel's letters at
 * the foot of every page and on its RSVP confirmation. It now derives the
 * initials from the couple's own names, which is what `InvitationData` says a
 * theme should do ("themes that print a monogram fall back to initials").
 */
export function splitMonogram(
  monogram?: string,
  couple?: { partner1: string; partner2: string },
): [string, string] {
  const source =
    monogram ??
    (couple
      ? `${couple.partner1.trim().charAt(0)} & ${couple.partner2.trim().charAt(0)}`
      : "");

  const parts = source.split("&").map((part) => part.trim());
  return [(parts[0] ?? "").toUpperCase(), (parts[1] ?? "").toUpperCase()];
}
