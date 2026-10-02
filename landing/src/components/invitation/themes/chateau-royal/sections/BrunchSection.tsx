import { useLocale, useTranslations } from "next-intl";

import { formatFrenchWeekday } from "../../format";
import { Reveal } from "../../reveal";
import { cssString, slot } from "../../text";
import type { InvitationData } from "../../types";
import { dayHeading } from "../dates";
import { hasDayTwo, momentsOf } from "../programme";

import { TitleLines } from "./TitleLines";

/**
 * The day after: a card over a banquet table. It is the second day of the
 * `timeline` module, drawn from the day-two block when the couple has one, else
 * from the brunch event itself.
 */
export function BrunchSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.chateauRoyal");
  const locale = useLocale();

  if (!hasDayTwo(data)) return null;

  const dayTwo = data.dayTwo;
  const brunch = data.events?.find((event) => event.kind === "brunch");

  // The mapper hands over the weekday already written — in French, whatever the
  // page's language — unless the couple wrote their own. The first is written
  // again in the page's language; the second is theirs and stays as it is.
  const writtenDate = dayTwo?.dateLabel?.trim();
  const dateLabel =
    writtenDate && writtenDate !== formatFrenchWeekday(brunch?.date, { locale: "fr-FR" })
      ? writtenDate
      : dayHeading(brunch?.date, locale);
  const eyebrow = [dateLabel, slot(data, "timeline.dayTwo") ?? t("programme.dayTwo")]
    .filter(Boolean)
    .join(" · ");

  const title = dayTwo?.title?.trim() || brunch?.name;
  const time = dayTwo?.timeLabel?.trim() || brunch?.time;
  const body = dayTwo?.body?.trim() || brunch?.description;
  const note = dayTwo?.note?.trim();
  const dress = brunch?.dressCode?.trim();
  const dressLabel = slot(data, "timeline.dressLabel") ?? t("programme.dressLabel");
  const moments = momentsOf(data, "brunch");

  return (
    <section className="brunch" id="cr-brunch" data-editor-section="timeline">
      <div
        className="brunch-image"
        role="img"
        aria-label={t("brunch.imageLabel")}
        style={dayTwo?.image ? { backgroundImage: `url(${cssString(dayTwo.image)})` } : undefined}
      />
      <Reveal as="div" className="brunch-card reveal" revealedClass="visible" threshold={0.12}>
        {eyebrow ? <span className="section-eyebrow">{eyebrow}</span> : null}
        <div className="brunch-flourish">❦</div>
        {title ? (
          <h2>
            <TitleLines text={title} />
          </h2>
        ) : null}
        <div className="brunch-line" />
        {time ? <p className="brunch-time">{time}</p> : null}
        {body ? <p className="cr-brunch-body">{body}</p> : null}
        {moments.length > 0 ? (
          <ul className="cr-day-moments">
            {moments.map((entry, index) => (
              <li key={`${index}-${entry.time}-${entry.title}`}>
                <span>{entry.time}</span> {entry.title}
              </li>
            ))}
          </ul>
        ) : null}
        {dress ? (
          <p className="cr-day-moments cr-brunch-dress">
            <b>{dressLabel}</b> {dress}
          </p>
        ) : null}
        {note ? <p className="cr-brunch-note">{note}</p> : null}
      </Reveal>
    </section>
  );
}
