import { useTranslations } from "next-intl";
import type { CSSProperties } from "react";

import { slot } from "../../text";
import type { InvitationData } from "../../types";

import { Section } from "./Section";
import { Title } from "./Title";

/**
 * Dress code — a title in two voices, the couple's palette as a row of swatches.
 *
 * The designer's page also had an "Elle / Lui" pair of cards; `dressCode` holds
 * one note, so they are not drawn. The couple's inspiration photograph, when
 * there is one, sits under the introduction.
 */
export function DressSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.caboVerde.dress");
  const dress = data.dressCode;
  if (!dress) return null;

  return (
    <Section className="dress decorated" editorSection="dress-code">
      <p className="eyebrow">{slot(data, "dress-code.eyebrow") ?? t("eyebrow")}</p>
      {dress.title ? <Title text={dress.title} /> : null}
      {dress.body ? <p className="intro">{dress.body}</p> : null}

      {dress.image ? (
        // eslint-disable-next-line @next/next/no-img-element -- the couple's own upload, sized by the theme's CSS.
        <img className="cv-dress-photo" src={dress.image} alt={t("photoAlt")} loading="lazy" />
      ) : null}

      {dress.colors?.length ? (
        <div className="palette" role="img" aria-label={t("paletteLabel")}>
          {/* By position: the editor adds every new swatch in the same colour. */}
          {dress.colors.map((colour, index) => (
            <i key={`${index}-${colour}`} style={{ "--c": colour } as CSSProperties} />
          ))}
        </div>
      ) : null}

      {dress.note ? <p className="white-note">{dress.note}</p> : null}
    </Section>
  );
}
