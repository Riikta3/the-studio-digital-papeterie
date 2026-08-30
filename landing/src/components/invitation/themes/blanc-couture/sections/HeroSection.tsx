import type { InvitationData } from "../../types";

import { Page } from "./Page";

/**
 * Hero — the couple's names in gold over the embossed paper.
 *
 * The names sit in three separate elements because the CSS makes `h1` a
 * flex column and styles the ampersand's `<em>` on its own; collapsing them
 * into one string loses the stacked layout.
 */
export function HeroSection({ data, side }: { data: InvitationData; side: "left" | "right" }) {
  const { couple, copy, venue } = data;

  return (
    <Page className="hero hero-paper" side={side}>
      {copy?.heroKicker ? <p className="eyebrow">{copy.heroKicker}</p> : null}
      <h1>
        <span>{couple.partner1}</span>
        <em>&amp;</em>
        <span>{couple.partner2}</span>
      </h1>
      {copy?.announcement ? <p className="marry">{copy.announcement}</p> : null}
      <div className="fine-rule" />
      {copy?.dateLabel ? <p className="date">{copy.dateLabel}</p> : null}
      <p className="place">
        {venue.name}
        {venue.city ? (
          <>
            <br />
            {venue.city}
          </>
        ) : null}
      </p>
    </Page>
  );
}
