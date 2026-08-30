import type { InvitationData } from "../../types";

/**
 * Dress code, with its palette swatches.
 *
 * The source pinned the four colours in CSS via `.swatches i:nth-child(n)`,
 * which made the palette impossible to change per wedding. They are inline
 * styles here so `dressCode.colors` drives them; the CSS rules still supply
 * the size and shadow, and remain as the fallback when a colour is missing.
 */
export function DressCodeSection({ data }: { data: InvitationData }) {
  const dress = data.dressCode;
  if (!dress) return null;

  return (
    <section className="paper dress-section">
      <p className="eyebrow">Dress code · Jour 2</p>
      <h2>{dress.title}</h2>
      {dress.body ? <p>{dress.body}</p> : null}

      {dress.colors?.length ? (
        <div className="swatches">
          {dress.colors.map((color) => (
            <i key={color} style={{ background: color }} />
          ))}
        </div>
      ) : null}

      {dress.note ? <p>{dress.note}</p> : null}

      {dress.image ? (
        // eslint-disable-next-line @next/next/no-img-element -- sized by the theme's CSS.
        <img src={dress.image} alt={`Tenues ${dress.title}`} loading="lazy" />
      ) : null}
    </section>
  );
}
