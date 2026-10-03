import { useLocale, useTranslations } from "next-intl";

import { heroDates } from "../../date-range";
import { slot } from "../../text";
import type { InvitationData } from "../../types";

import { Art } from "./Art";
import { Section } from "./Section";
import { Title } from "./Title";

/**
 * Gift list — the couple's note as a postcard sent from the island: airmail
 * edging, the message on the left, a stamp with one of the hero's painted boats
 * and a postmark carrying the wedding day on the right. When the section
 * arrives the card settles and the postmark lands on the stamp; it straightens
 * and lifts under the pointer, as the designer's postcard did.
 *
 * Renders nothing without `data.gifts` — the contract forbids a theme from
 * promising arrangements the couple never wrote — nor when they wrote nothing
 * in it. The postcard's furniture (stamp, postmark, address lines) is
 * decoration and carries no words of its own.
 */
export function GiftsSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.caboVerde.gifts");
  const locale = useLocale();
  const gifts = data.gifts;
  if (!gifts || (!gifts.title?.trim() && !gifts.body?.trim() && !gifts.url)) return null;

  const date = heroDates(data, locale).dotted;

  return (
    <Section className="cv-gifts" editorSection="gift-list">
      <p className="eyebrow">{slot(data, "gift-list.eyebrow") ?? t("eyebrow")}</p>

      <article className="cv-postcard">
        <div className="cv-postcard-message">
          <Title text={gifts.title?.trim() || t("titleFallback")} />
          {gifts.body ? <p className="cv-postcard-body">{gifts.body}</p> : null}
          {gifts.url ? (
            <a className="cv-postcard-link" href={gifts.url} target="_blank" rel="noreferrer">
              {gifts.linkLabel?.trim() || t("linkFallback")}
            </a>
          ) : null}
        </div>

        <div className="cv-postcard-side" aria-hidden="true">
          <span className="cv-stamp">
            <Art className="cv-stamp-art" file="hero-boat-2-v19" />
          </span>
          <span className="cv-postmark">{date ? <span>{date}</span> : null}</span>
          <i className="cv-postcard-line" />
          <i className="cv-postcard-line" />
          <i className="cv-postcard-line" />
        </div>
      </article>
    </Section>
  );
}
