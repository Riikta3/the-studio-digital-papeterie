import { useLocale } from "next-intl";

import { formatFrenchDate } from "../../format";
import type { InvitationData } from "../../types";

/**
 * Closing block: the couple's portrait, their thanks, their names, the date
 * and the studio credit. No portrait, no frame: the theme never stands a stock
 * photograph in for the couple.
 */
export function FooterSection({ data }: { data: InvitationData }) {
  const { couple, copy, venue, event } = data;

  const locale = useLocale();
  const dateLabel = formatFrenchDate(event.startsAt, {
    timeZone: event.timezone,
    locale,
  });
  const place = [venue.name, venue.city].filter(Boolean).join(", ");

  return (
    <footer data-editor-section="footer">
      {couple.portrait ? (
        // The couple's own upload at any size; the theme's CSS crops it into
        // the medallion.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="ca-footer-portrait"
          src={couple.portrait}
          alt={`${couple.partner1} & ${couple.partner2}`}
          loading="lazy"
        />
      ) : null}
      {copy?.closing ? <p>{copy.closing}</p> : null}
      <h2>
        {couple.partner1} <i>&amp;</i> {couple.partner2}
      </h2>
      <span>
        {dateLabel}
        {place ? ` · ${place}` : ""}
      </span>
      {copy?.footerNote ? <small>{copy.footerNote}</small> : null}
    </footer>
  );
}
