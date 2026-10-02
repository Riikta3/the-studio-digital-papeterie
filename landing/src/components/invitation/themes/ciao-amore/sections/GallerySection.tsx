import { useTranslations } from "next-intl";

import { Lines, slot } from "../../text";
import type { InvitationData } from "../../types";

/**
 * The couple's photographs as postcards pinned on the theme's dotted blue
 * ground, each tilted a little, alternately left and right.
 */
export function GallerySection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.ciaoAmore.gallery");
  const images = data.gallery?.images ?? [];
  if (images.length === 0) return null;

  return (
    <section className="ca-gallery-section" data-editor-section="gallery">
      <p className="eyebrow">{slot(data, "gallery.eyebrow") ?? t("eyebrow")}</p>
      <h2>
        <Lines text={slot(data, "gallery.title") ?? t("title")} />
      </h2>

      <ul className="ca-gallery-grid">
        {images.map((src, index) => (
          <li key={`${src}-${index}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- sized by the theme's CSS. */}
            <img src={src} alt={t("imageAlt", { index: index + 1 })} loading="lazy" />
          </li>
        ))}
      </ul>
    </section>
  );
}
