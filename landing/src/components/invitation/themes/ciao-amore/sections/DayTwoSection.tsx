import { useTranslations } from "next-intl";

import { slot } from "../../text";
import type { InvitationData } from "../../types";
import { iconClass } from "./ScheduleSection";

/**
 * Day-2 brunch card, over the parasol cut-out.
 *
 * Everything the couple wrote on the brunch event's card in the editor lands
 * here — its address, what to wear and its own moments too (time, icon,
 * title, words, photo), which the day-1 timeline leaves out (`day: 2`) and
 * nothing else printed.
 */
export function DayTwoSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.ciaoAmore.schedule");
  const dayTwo = data.dayTwo;
  if (!dayTwo) return null;

  const brunch = data.events?.find((event) => event.kind === "brunch");
  const moments = (data.schedule ?? []).filter((entry) => entry.day === 2);
  const dressLabel = slot(data, "timeline.dressLabel") ?? t("dressLabel");

  // The source split the title on "&" to italicise the second half; keep that
  // shape when the title follows it, and fall back to a plain title otherwise.
  const [head, ...tail] = (dayTwo.title ?? "").split("&");
  const rest = tail.join("&").trim();

  return (
    // Part of the programme in the editor: the day after is the brunch event
    // of the "Programme" tab, so it answers to the same section id.
    <section className="brunch-section" data-editor-section="timeline">
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative cut-out
          positioned by the theme's CSS. */}
      <img
        className="decor decor-parasol"
        src="/themes/ciao-amore/decor/parasol-transat.webp"
        alt=""
        aria-hidden="true"
        loading="lazy"
      />
      <div className="brunch-card">
        {dayTwo.dateLabel ? <p className="eyebrow">{dayTwo.dateLabel}</p> : null}
        {dayTwo.title ? (
          <h2>
            {head.trim()}
            {rest ? (
              <>
                <br />
                <em>&amp; {rest}</em>
              </>
            ) : null}
          </h2>
        ) : null}
        {dayTwo.timeLabel ? <strong>{dayTwo.timeLabel}</strong> : null}
        {dayTwo.body ? <p>{dayTwo.body}</p> : null}
        {brunch?.address ? <p className="ca-event-where">{brunch.address}</p> : null}
        {moments.length > 0 ? (
          <ul className="ca-brunch-moments">
            {moments.map((entry, index) => (
              <li key={`${index}-${entry.time}-${entry.title}`}>
                <time>{entry.time}</time>
                <div className={iconClass(entry)} aria-hidden="true">
                  <i />
                </div>
                <div>
                  <b>{entry.title}</b>
                  {entry.description ? <small>{entry.description}</small> : null}
                  {entry.image ? (
                    // Sized and cropped by the theme's CSS, like the day-1 photos.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={entry.image} alt={entry.title} loading="lazy" />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : null}
        {brunch?.dressCode ? (
          <p className="ca-event-dress">
            <b>{dressLabel}</b> {brunch.dressCode}
          </p>
        ) : null}
        {dayTwo.note ? <span>{dayTwo.note}</span> : null}
      </div>
    </section>
  );
}
