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
            <span aria-hidden="true" />
            {/*
              The "&" is wrapped so the *glyph* can be nudged and scaled
              without moving the jewel around it. Parisienne is a cursive: its
              ampersand sits high in the typographic box with a tail that drops
              to the right, so a box that is mathematically centred on the disc
              still reads as low and right by several pixels. `.jewel-amp`
              itself carries the disc (`:after`) and the rays (`> span`), which
              are correctly placed and correctly sized — only the ink moves.
              See `responsive.css`.

              Deliberately NOT a <b>: the generated sheet carries
              `.hero-names b { animation:none!important; transform:none }` for
              the reveal, and a <b> here inherits it — the nudge silently
              resolved to `matrix(1,0,0,1,0,0)`.
            */}
            <em className="jewel-amp-glyph">&amp;</em>
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
