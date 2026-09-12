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
  const [first, second] = splitMonogram(couple.monogram, couple);
  const closingLines = (copy?.closing ?? "").split("\n").filter(Boolean);

  return (
    <footer className="page closing-page soft-floral-paper" data-side="left">
      <div className="light-pass" />
      <div className="content reveal">
        {/* Only the couple's own photograph. This used to be the demo
            couple's portrait, hardcoded, with an alt text built from whichever
            names the invitation carried — so every other wedding framed two
            strangers and captioned them with its own. The frame and the floral
            paper carry the page on their own when there is no photo. */}
        {couple.portrait ? (
          // eslint-disable-next-line @next/next/no-img-element -- sized in vw by
          // the theme's CSS; next/image's wrapper fights that layout.
          <img
            className="closing-portrait"
            src={couple.portrait}
            alt={`Portrait encadré de ${couple.partner1} et ${couple.partner2}`}
            loading="lazy"
          />
        ) : null}
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
