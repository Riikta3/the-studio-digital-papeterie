import { useTranslations } from "next-intl";

import { monogramOf } from "../../monogram";
import { Reveal } from "../../reveal";
import { slot } from "../../text";
import type { InvitationData } from "../../types";
import { splitMonogram } from "../monogram-parts";

/**
 * The gift note, as a sealed letter: an ivory card with the double gold rule of
 * the day-after card, an envelope flap, and the couple's monogram pressed into
 * a wax seal at its tip — pressed the moment the letter comes into view.
 *
 * Renders nothing without `data.gifts`: a theme must never promise
 * arrangements the couple did not write.
 */
export function GiftsSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.chateauRoyal.gifts");
  const gifts = data.gifts;
  if (!gifts) return null;

  const title = gifts.title?.trim() || t("titleFallback");
  const body = gifts.body?.trim();
  const monogram = monogramOf(data.couple, " & ");
  const parts = splitMonogram(monogram);

  return (
    <section className="cr-gifts" id="cr-cadeaux" data-editor-section="gift-list">
      <Reveal as="div" className="cr-gift-card reveal" revealedClass="visible" threshold={0.2}>
        <span className="cr-gift-flap" aria-hidden="true" />
        {monogram ? (
          <span className="cr-gift-seal" aria-hidden="true" data-long={monogram.length > 5 ? "" : undefined}>
            {parts ? (
              <>
                {parts.left}
                <i>{parts.separator}</i>
                {parts.right}
              </>
            ) : (
              monogram
            )}
          </span>
        ) : null}
        <span className="section-eyebrow">{slot(data, "gift-list.eyebrow") ?? t("eyebrow")}</span>
        <h2>{title}</h2>
        <span className="cr-rule" aria-hidden="true" />
        {body ? <p>{body}</p> : null}
        {gifts.url ? (
          <a className="cr-gift-link" href={gifts.url} target="_blank" rel="noreferrer">
            {gifts.linkLabel?.trim() || t("linkFallback")} <span aria-hidden="true">↗</span>
          </a>
        ) : null}
      </Reveal>
    </section>
  );
}
