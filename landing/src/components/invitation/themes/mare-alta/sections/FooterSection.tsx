import { useLocale, useTranslations } from "next-intl";

import { formatFrenchDate } from "../../format";
import { ScrollToButton } from "../../scroll-to";
import { Lines, slot } from "../../text";
import type { InvitationData } from "../../types";

/**
 * The page's last word: the couple's names over the embroidered still life, the
 * day and the place, and a way back to the top.
 *
 * Always drawn — it carries the names, so an invitation closes with it whatever
 * the wedding bought. What the couple wrote for it is printed when they wrote
 * it: their closing words, a line of small print, their photograph.
 */
export function FooterSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.mareAlta.footer");
  const locale = useLocale();

  const day = formatFrenchDate(data.event.startsAt.slice(0, 10), { locale });
  const line = [day, data.venue.city].filter(Boolean).join(" · ");

  return (
    <footer data-editor-section="footer">
      {data.couple.portrait ? (
        // The couple's own photograph, a round frame above their names.
        // eslint-disable-next-line @next/next/no-img-element
        <img className="ma-portrait" src={data.couple.portrait} alt="" loading="lazy" />
      ) : null}
      <p className="eyebrow light">{slot(data, "footer.eyebrow") ?? t("eyebrow")}</p>
      <h2>
        {data.couple.partner1} <i>&amp;</i> {data.couple.partner2}
      </h2>
      {line ? <p>{line}</p> : null}
      {data.copy?.closing ? (
        <p className="ma-closing">
          <Lines text={data.copy.closing} />
        </p>
      ) : null}
      {data.copy?.footerNote ? (
        <p className="ma-footer-note">
          <Lines text={data.copy.footerNote} />
        </p>
      ) : null}
      <ScrollToButton target="top" className="ma-top">
        {t("top")} ↑
      </ScrollToButton>
    </footer>
  );
}
