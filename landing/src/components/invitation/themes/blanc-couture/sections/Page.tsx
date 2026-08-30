import type { ReactNode } from "react";

/**
 * The `.page` wrapper every section of the source is built on.
 *
 * Kept as a component rather than inlined because the source repeats its exact
 * markup eleven times, and the CSS depends on all of it: `.light-pass` draws
 * the sweeping highlight, `.content.reveal` is what the scroll observer
 * watches, and `.page-monogram` is the gold "V & G" pinned to every section's
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
}: {
  className?: string;
  children: ReactNode;
  side?: "left" | "right";
  id?: string;
}) {
  return (
    <section id={id} className={`page ${className}`} data-side={side}>
      <div className="light-pass" />
      <div className="content reveal">{children}</div>
      <Monogram />
    </section>
  );
}

/** The small gold monogram repeated at the foot of every page. */
export function Monogram({ text }: { text?: string }) {
  const [first, second] = splitMonogram(text);
  return (
    <span className="page-monogram" aria-hidden="true">
      {first} <em>&amp;</em> {second}
    </span>
  );
}

/**
 * "V & G" -> ["V", "G"]. The ampersand is re-emitted as its own `<em>` because
 * the CSS styles it in italic Bodoni against the Italiana letters either side.
 */
export function splitMonogram(monogram?: string): [string, string] {
  const parts = (monogram ?? "V & G").split("&").map((part) => part.trim());
  return [parts[0] ?? "", parts[1] ?? ""];
}
