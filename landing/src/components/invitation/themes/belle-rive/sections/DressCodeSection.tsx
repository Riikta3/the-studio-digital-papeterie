import type { InvitationData } from "../../types";
import { Reveal } from "../Reveal";

/**
 * Dress code and its palette.
 *
 * The source pinned the three colours in CSS via `.palette span:nth-child(n)`
 * and wrote the labels into the markup, so changing the palette meant editing
 * the stylesheet. The swatch colour is an inline style driven by
 * `dressCode.colors`; the CSS rules still supply size, border and typography.
 */
const PALETTE_LABELS = ["Blanc", "Écru", "Beige"];

export function DressCodeSection({ data }: { data: InvitationData }) {
  const dress = data.dressCode;
  if (!dress) return null;

  return (
    <section className="panel dresscode dresscode-clean">
      <Reveal>
        <p className="eyebrow">Dress code · Jour 2</p>
        <h2>{dress.title}</h2>
        {dress.body ? <p>{dress.body}</p> : null}
      </Reveal>

      {dress.colors?.length ? (
        <Reveal delay={70} className="palette">
          {dress.colors.map((color, index) => (
            <span key={color} style={{ background: color }}>
              {PALETTE_LABELS[index] ?? ""}
            </span>
          ))}
        </Reveal>
      ) : null}

      {dress.image ? (
        <Reveal delay={140}>
          {/* eslint-disable-next-line @next/next/no-img-element -- masked and
              over-sized by the theme's CSS. */}
          <img
            className="dress-people"
            src={dress.image}
            alt={`Inspiration de tenues ${dress.title}`}
            loading="lazy"
          />
        </Reveal>
      ) : null}

      <Reveal delay={210}>
        <p>Lin, matières naturelles et tenues estivales sont les bienvenus.</p>
        {dress.note ? <p className="note">{dress.note}</p> : null}
      </Reveal>

      {/* eslint-disable-next-line @next/next/no-img-element -- decorative, floats
          on its own keyframe animation. */}
      <img
        className="swim-accessories"
        src="/themes/belle-rive/swim-accessories-v2.webp"
        alt=""
        aria-hidden="true"
        loading="lazy"
      />
    </section>
  );
}
