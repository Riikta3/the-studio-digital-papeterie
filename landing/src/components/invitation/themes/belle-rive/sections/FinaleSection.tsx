import type { InvitationData } from "../../types";

/** Closing arch: thanks, the couple in calligraphy, the date and the place. */
export function FinaleSection({ data }: { data: InvitationData }) {
  const { couple, copy, venue } = data;

  return (
    <section className="panel finale pearl-panel">
      <div className="arch">
        {copy?.closing ? <p className="eyebrow">{copy.closing}</p> : null}
        <h2 className="calligraphy">
          <span>{couple.partner1}</span> <i>&amp;</i> <span>{couple.partner2}</span>
        </h2>
        {copy?.dateLabel ? <p>{copy.dateLabel}</p> : null}
        <p className="place">{venue.name}</p>
      </div>
    </section>
  );
}
