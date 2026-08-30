import { formatFrenchDate } from "../../format";
import type { InvitationData } from "../../types";

/** Closing block: thanks, the couple, the date and the studio credit. */
export function FooterSection({ data }: { data: InvitationData }) {
  const { couple, copy, venue, event } = data;

  const dateLabel = formatFrenchDate(event.startsAt, { timeZone: event.timezone });
  const place = [venue.name, venue.city].filter(Boolean).join(", ");

  return (
    <footer>
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
