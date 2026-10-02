import { Gift } from "lucide-react";
import { useTranslations } from "next-intl";

import { slot } from "../../text";
import type { InvitationData } from "../../types";

import { Section } from "./Section";
import { SectionTitle } from "./SectionTitle";

/**
 * The gift note: the couple's title and words, and a link to the page they
 * published.
 *
 * The designer's section also drew a card with a progress bar and a button that
 * unfolded an IBAN. The product holds neither a bank detail nor a total raised,
 * and a bar nobody fills is a promise; they are not drawn. A couple who wrote
 * nothing has no section.
 */
export function GiftsSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.mareAlta.gifts");
  const gifts = data.gifts;
  if (!gifts || (!gifts.title && !gifts.body && !gifts.url)) return null;

  return (
    <Section id="ma-gift" className="gift night-section" editorSection="gift-list">
      <Gift size={34} />
      <SectionTitle
        eyebrow={slot(data, "gift-list.eyebrow") ?? t("eyebrow")}
        title={gifts.title}
        intro={gifts.body}
      />
      {gifts.url ? (
        <a className="button light-button bank-toggle" href={gifts.url} target="_blank" rel="noreferrer">
          {gifts.linkLabel || t("cta")}
        </a>
      ) : null}
    </Section>
  );
}
