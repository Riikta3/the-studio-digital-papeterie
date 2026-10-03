import { useTranslations } from "next-intl";
import type { CSSProperties } from "react";

import { slot } from "../../text";
import type { InvitationData } from "../../types";

import { Section } from "./Section";
import { Title } from "./Title";

/**
 * Gallery — the couple's photographs as instant prints taped into a travel
 * album, each a little askew, over the gold linework of the theme's
 * stationery. On arrival the prints are laid down one after the other; a
 * print straightens and lifts under the pointer.
 *
 * Every photograph is the couple's, in their order and whatever their number;
 * none is drawn without them.
 */
export function GallerySection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.caboVerde.gallery");
  const images = (data.gallery?.images ?? []).filter(Boolean);
  if (images.length === 0) return null;

  return (
    <Section className="cv-gallery" editorSection="gallery">
      <p className="eyebrow">{slot(data, "gallery.eyebrow") ?? t("eyebrow")}</p>
      <Title text={slot(data, "gallery.title") ?? `${t("titleLine1")}\n${t("titleLine2")}`} />

      <ul className="cv-album">
        {images.map((src, index) => (
          // By position: a couple may upload the same picture twice.
          <li key={`${index}-${src}`} style={{ "--i": index } as CSSProperties}>
            <figure className="cv-print">
              {/* eslint-disable-next-line @next/next/no-img-element -- the couple's own upload, cropped by the theme's CSS. */}
              <img src={src} alt={t("imageAlt", { index: index + 1 })} loading="lazy" />
            </figure>
          </li>
        ))}
      </ul>
    </Section>
  );
}
