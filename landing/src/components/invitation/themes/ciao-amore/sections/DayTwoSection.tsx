import type { InvitationData } from "../../types";

/** Day-2 brunch card, over the parasol cut-out. */
export function DayTwoSection({ data }: { data: InvitationData }) {
  const dayTwo = data.dayTwo;
  if (!dayTwo) return null;

  // The source split the title on "&" to italicise the second half; keep that
  // shape when the title follows it, and fall back to a plain title otherwise.
  const [head, ...tail] = (dayTwo.title ?? "").split("&");
  const rest = tail.join("&").trim();

  return (
    <section className="brunch-section">
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
        {dayTwo.note ? <span>{dayTwo.note}</span> : null}
      </div>
    </section>
  );
}
