import { useTranslations } from "next-intl";

import { slot } from "../../text";
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
  const t = useTranslations("Invitation.ciaoAmore.dressCode");
  const dress = data.dressCode;
  if (!dress) return null;

  return (
    <section className="paper dress-section" data-editor-section="dress-code">
      {/* The catalogue's "Dress code · Jour 2" was the showcase's: most
          weddings have no second day, which is why it is a slot. */}
      <p className="eyebrow">{slot(data, "dress-code.eyebrow") ?? t("eyebrow")}</p>
      <h2>{dress.title}</h2>
      {dress.body ? <p>{dress.body}</p> : null}

      {dress.colors?.length ? (
        <div className="swatches">
          {/* By position: the editor adds every new swatch in the same
              colour, and two equal keys would drop one from the page. */}
          {dress.colors.map((color, index) => (
            <i key={`${index}-${color}`} style={{ background: color }} />
          ))}
        </div>
      ) : null}

      {dress.note ? <p>{dress.note}</p> : null}

      {dress.image ? (
        // eslint-disable-next-line @next/next/no-img-element -- sized by the theme's CSS.
        <img src={dress.image} alt={t("imageAlt", { title: dress.title })} loading="lazy" />
      ) : null}
    </section>
  );
}
