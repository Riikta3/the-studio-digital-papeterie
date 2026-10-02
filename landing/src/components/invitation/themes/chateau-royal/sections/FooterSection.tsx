import { useLocale } from "next-intl";

import { formatDateRange, weddingSpan } from "../../date-range";
import { monogramOf } from "../../monogram";
import type { InvitationData } from "../../types";
import { splitMonogram } from "../monogram-parts";

/**
 * The closing signature, pressed into espresso velvet: the seal with the
 * monogram, the names, the dates, and — when the couple wrote them — their
 * closing words and their small note. Always rendered: it carries the names.
 */
export function FooterSection({ data }: { data: InvitationData }) {
  const locale = useLocale();
  const { partner1, partner2, portrait } = data.couple;

  const monogram = monogramOf(data.couple, " & ");
  const parts = splitMonogram(monogram);
  const span = weddingSpan(data);
  const dates = span ? formatDateRange(span.start, span.end, { locale }) : null;
  const closing = data.copy?.closing?.trim();
  const note = data.copy?.footerNote?.trim();

  return (
    <footer className="royal-signoff" data-editor-section="footer">
      <div className="signoff-border">
        {/* The footer tab's photograph of the couple, above the seal. */}
        {portrait ? (
          // eslint-disable-next-line @next/next/no-img-element -- the couple's own photograph, cropped by CSS.
          <img className="cr-portrait" src={portrait} alt="" loading="lazy" />
        ) : null}
        {monogram ? (
          <div
            className="signoff-seal"
            aria-hidden="true"
            data-long={monogram.length > 5 ? "" : undefined}
          >
            {parts ? (
              <>
                {parts.left}
                <span>{parts.separator}</span>
                {parts.right}
              </>
            ) : (
              monogram
            )}
          </div>
        ) : null}
        <div className="signoff-ornament" aria-hidden="true">
          <i />
          <span>❦</span>
          <i />
        </div>
        <div className="signoff-names">
          <span>{partner1}</span>
          <em>&amp;</em>
          <span>{partner2}</span>
        </div>
        {dates ? <p>{dates}</p> : null}
        {closing ? <p className="cr-closing">{closing}</p> : null}
        {note ? <p className="cr-footnote">{note}</p> : null}
        <div className="signoff-ornament signoff-bottom" aria-hidden="true">
          <i />
          <span>✧</span>
          <i />
        </div>
      </div>
    </footer>
  );
}
