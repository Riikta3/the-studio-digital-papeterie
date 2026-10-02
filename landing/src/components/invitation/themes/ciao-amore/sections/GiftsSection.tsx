import { useTranslations } from "next-intl";

import { slot } from "../../text";
import type { InvitationData } from "../../types";

/**
 * The gift note, in a card with the theme's double border and two lemons at
 * opposite corners, like the day-after card.
 *
 * Renders nothing without `data.gifts`: the contract forbids a theme from
 * promising arrangements the couple never wrote.
 */
export function GiftsSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.ciaoAmore.gifts");
  const gifts = data.gifts;
  if (!gifts) return null;

  return (
    <section className="paper ca-gifts-section" data-editor-section="gift-list">
      <div className="ca-gifts-card">
        <p className="eyebrow">{slot(data, "gift-list.eyebrow") ?? t("eyebrow")}</p>
        <h2>{gifts.title ?? t("titleFallback")}</h2>
        {gifts.body ? <p className="ca-gifts-body">{gifts.body}</p> : null}
        {gifts.url ? (
          <a href={gifts.url} target="_blank" rel="noreferrer" className="ca-gifts-link">
            {gifts.linkLabel ?? t("linkFallback")}
          </a>
        ) : null}
      </div>
    </section>
  );
}
