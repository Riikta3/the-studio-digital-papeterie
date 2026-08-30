import type { InvitationData } from "../../types";

/**
 * Hero — pearl backdrop, couple names, date and place.
 *
 * THE NAMES ARE TEXT, NOT THE SOURCE'S IMAGE.
 *
 * The source rendered them as `<img src="/assets/hero-lettering.png"
 * alt="Émilie & Jordy">` — a bitmap of two specific first names. That makes the
 * theme unsellable: every other couple would either ship the wrong names or
 * need a designer to redraw the file. It also scales badly, cannot be selected
 * or translated, and forces screen readers onto alt text.
 *
 * They are now set in the theme's own calligraphic face (`calligraphy.otf`, the
 * same one `.calligraphy` uses in the closing arch) at the 74px the source's
 * `.hero .calligraphy` rule already specified, in the olive the original
 * lettering was drawn in — `#5c6342`, not the `--ink` brown or the `--gold`
 * used elsewhere. `hero-lettering.webp` stays in `public/themes/belle-rive/` as
 * the visual reference this was matched against, but nothing renders it.
 */
export function HeroSection({ data }: { data: InvitationData }) {
  const { couple, copy, venue } = data;
  const place = [venue.name, venue.city].filter(Boolean).join(" · ");

  return (
    <section className="panel hero">
      <div className="hero-glow" />
      {copy?.announcement ? <p className="eyebrow">{copy.announcement}</p> : null}

      <h1 className="hero-names calligraphy">
        <span>{couple.partner1}</span> <i>&amp;</i> <span>{couple.partner2}</span>
      </h1>

      {copy?.dateLabel ? <p className="date">{copy.dateLabel}</p> : null}
      {place ? <p className="place">{place}</p> : null}

      {/* `#count` is far too generic an id to expose in a shared app — it is
          prefixed here, and this is the only link that targets it. */}
      <a className="scroll" href="#br-count">
        Découvrir
        <br />↓
      </a>
    </section>
  );
}
