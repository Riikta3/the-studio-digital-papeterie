import type { ReactNode } from "react";

/**
 * Eyebrow, title and intro of a section. `rhythm` sets the title in the
 * designer's alternating faces (a serif line, an italic or sans line).
 *
 * Every part but the eyebrow may be missing: a section never prints an empty
 * heading or an empty intro.
 */
export function SectionTitle({
  eyebrow,
  title,
  intro,
  rhythm = false,
}: {
  eyebrow: ReactNode;
  title?: ReactNode;
  intro?: ReactNode;
  rhythm?: boolean;
}) {
  return (
    <div className="section-heading">
      <p className="eyebrow">{eyebrow}</p>
      {title ? <h2 className={rhythm ? "type-rhythm" : undefined}>{title}</h2> : null}
      {intro ? <p className="section-intro">{intro}</p> : null}
    </div>
  );
}

/**
 * A two-line heading in two faces: the first line gets `firstClass`, the rest
 * `secondClass`. Fed by a slot value or by the catalogue's two lines joined with
 * a line break, so a couple who rewrites it keeps the rhythm.
 */
export function RhythmTitle({
  text,
  firstClass = "title-serif",
  secondClass = "title-italic",
}: {
  text: string;
  firstClass?: string;
  secondClass?: string;
}) {
  const [first, ...rest] = text.split("\n");
  return (
    <>
      <span className={firstClass}>{first}</span>
      {rest.length > 0 ? <span className={secondClass}>{rest.join(" ")}</span> : null}
    </>
  );
}
