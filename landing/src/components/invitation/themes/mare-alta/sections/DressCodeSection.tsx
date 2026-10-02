import { Shirt, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { Lines, slot } from "../../text";
import type { InvitationData } from "../../types";

import { Section } from "./Section";
import { SectionTitle } from "./SectionTitle";

/**
 * The dress code: the couple's title and words, their palette as swatches over
 * the picture, and the note under it.
 *
 * The designer named three colours ("Sauge", "Ivoire", "Lilas") and wrote two
 * paragraphs for the note. A palette is any number of CSS colours here, and the
 * note is whatever the couple wrote: its first paragraph follows the shirt, the
 * second the sparkle, any more run on below. Nothing to say, nothing drawn.
 */
export function DressCodeSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.mareAlta.dressCode");
  const dress = data.dressCode;
  if (!dress) return null;

  const colors = dress.colors ?? [];
  const paragraphs = (dress.note ?? "")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (!dress.title && !dress.body && !dress.image && colors.length === 0 && paragraphs.length === 0) return null;

  const [first, second, ...more] = paragraphs;

  return (
    <Section id="ma-dresscode" className="dresscode paper-section" editorSection="dress-code">
      <SectionTitle
        eyebrow={slot(data, "dress-code.eyebrow") ?? t("eyebrow")}
        title={dress.title}
        intro={dress.body}
      />
      <div className="fashion-stage">
        {dress.image ? (
          // The couple's own picture, cropped to the stage by the theme's CSS.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dress.image} alt={dress.title || t("imageAlt")} loading="lazy" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- decorative scene, sized and cropped by CSS.
          <img src="/themes/mare-alta/embroidered-dresscode-v5.webp" alt={t("imageAlt")} loading="lazy" />
        )}
        {colors.length > 0 ? (
          <div className="fashion-tags" aria-hidden="true">
            {colors.map((color, index) => (
              <span key={`${index}-${color}`} style={{ background: color }} />
            ))}
          </div>
        ) : null}
      </div>
      {first ? (
        <div className="dress-manifesto">
          <Shirt />
          <p>
            <Lines text={first} />
          </p>
          {second ? (
            <>
              <Sparkles />
              <p>
                <Lines text={second} />
              </p>
            </>
          ) : null}
          {more.map((paragraph, index) => (
            <p className="ma-dress-more" key={`${index}-${paragraph.slice(0, 12)}`}>
              <Lines text={paragraph} />
            </p>
          ))}
        </div>
      ) : null}
    </Section>
  );
}
