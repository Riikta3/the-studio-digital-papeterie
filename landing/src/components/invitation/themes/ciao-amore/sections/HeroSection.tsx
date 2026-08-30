import type { InvitationData } from "../../types";

/**
 * Hero — the arched panel over the coffret backdrop.
 *
 * The decorative sun, wave and lemons are DOM elements rather than background
 * images: `ciao-amore.css` draws them entirely in CSS, so they must stay in the
 * markup for the theme to look right.
 */
export function HeroSection({ data }: { data: InvitationData }) {
  const { couple, copy, venue } = data;
  const place = [venue.name, venue.city].filter(Boolean).join(" · ");

  return (
    <section className="hero-direct">
      <div className="sun-disc" />
      <div className="blue-wave" />
      <div className="lemon lemon-one">
        <i />
      </div>
      <div className="lemon lemon-two">
        <i />
      </div>
      <div className="lemon lemon-three">
        <i />
      </div>
      <div className="hero-panel">
        {copy?.heroKicker ? <span>{copy.heroKicker}</span> : null}
        {copy?.announcement ? <p>{copy.announcement}</p> : null}
        <h1 className="hero-names">
          <b>{couple.partner1}</b>
          <i className="jewel-amp">
            <span aria-hidden="true" /> &
          </i>
          <b>{couple.partner2}</b>
        </h1>
        {copy?.dateLabel ? <strong>{copy.dateLabel}</strong> : null}
        {place ? <small>{place}</small> : null}
        <a href="#ca-compte">Découvrir</a>
      </div>
    </section>
  );
}
