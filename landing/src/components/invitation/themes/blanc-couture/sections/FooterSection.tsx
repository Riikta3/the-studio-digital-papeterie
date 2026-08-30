import type { InvitationData } from "../../types";

import { splitMonogram } from "./Page";

/**
 * Closing page: the framed portrait, the monogram and the final details.
 *
 * This is a `<footer>` rather than a `Page`, matching the source — it carries
 * `.page` for the styling but not the `.program-glow` or the trailing
 * monogram, since it already prints a large one of its own.
 */
export function FooterSection({ data }: { data: InvitationData }) {
  const { couple, copy, venue } = data;
  const [first, second] = splitMonogram(couple.monogram);
  const closingLines = (copy?.closing ?? "").split("\n").filter(Boolean);

  return (
    <footer className="page closing-page soft-floral-paper" data-side="left">
      <div className="light-pass" />
      <div className="content reveal">
        {/* eslint-disable-next-line @next/next/no-img-element -- sized in vw by
            the theme's CSS; next/image's wrapper fights that layout. */}
        <img
          className="closing-portrait"
          src="/themes/blanc-couture/framed-couple.webp"
          alt={`Portrait encadré de ${couple.partner1} et ${couple.partner2}`}
          loading="lazy"
        />
        <p className="monogram">
          {first} <em>&amp;</em> {second}
        </p>
        {closingLines.length > 0 ? (
          <p className="closing-line">
            {closingLines.map((line, index) => (
              <span key={line}>
                {index > 0 ? <br /> : null}
                {line}
              </span>
            ))}
          </p>
        ) : null}
        {copy?.dateLabel ? <p className="closing-detail">{copy.dateLabel}</p> : null}
        {venue.city ? <p className="closing-detail">{venue.city}</p> : null}
      </div>
    </footer>
  );
}
