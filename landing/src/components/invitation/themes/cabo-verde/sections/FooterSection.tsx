import { useLocale, useTranslations } from "next-intl";

import { formatFrenchDate } from "../../format";
import { monogramOf } from "../../monogram";
import type { InvitationData } from "../../types";

import { Monogram } from "./Monogram";

/**
 * Footer — a shoreline, the couple's monogram, the day and the place.
 *
 * The couple's own portrait, when they uploaded one, is a round picture above
 * the monogram (mock-up gate: the designer's footer has none). Nothing stands in
 * for it when there is none.
 */
export function FooterSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.caboVerde.footer");
  const locale = useLocale();
  const { couple, venue, copy } = data;

  // The calendar day written in `startsAt`, not the instant: an instant prints a
  // different day on a server in UTC and in a browser far west of it.
  const day = formatFrenchDate(data.event.startsAt.slice(0, 10), { locale });
  const line = [day, venue.city].filter(Boolean).join(" · ");

  return (
    <footer className="beach-footer" data-editor-section="footer">
      {couple.portrait ? (
        // eslint-disable-next-line @next/next/no-img-element -- the couple's own upload, a small round picture.
        <img className="cv-portrait" src={couple.portrait} alt={`${couple.partner1} & ${couple.partner2}`} loading="lazy" />
      ) : null}
      <Monogram text={monogramOf(couple, " & ")} />
      {line ? <p>{line}</p> : null}
      <small>{copy?.footerNote || t("note")}</small>
      {copy?.closing ? <p className="cv-closing">{copy.closing}</p> : null}
    </footer>
  );
}
