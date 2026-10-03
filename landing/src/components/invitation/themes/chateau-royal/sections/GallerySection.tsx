import { useTranslations } from "next-intl";

import { Reveal } from "../../reveal";
import { slot } from "../../text";
import type { InvitationData } from "../../types";
import { roman } from "../roman";

import { TitleLines } from "./TitleLines";

/**
 * The couple's photographs hung as in a château gallery: gilt frames with an
 * ivory mat, hung on one line at eye level — upright and landscape frames in
 * turn, each with its brass plate — wrapping as the wall runs out.
 *
 * Each frame is hung as it comes into view: it swings in from its nail and
 * settles. The photographs keep the couple's order.
 */
export function GallerySection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.chateauRoyal.gallery");
  const images = (data.gallery?.images ?? []).filter((src) => src.trim());
  if (images.length === 0) return null;

  return (
    <section className="cr-gallery" id="cr-galerie" data-editor-section="gallery">
      <Reveal as="div" className="section-heading reveal" revealedClass="visible" threshold={0.12}>
        <span className="section-eyebrow">{slot(data, "gallery.eyebrow") ?? t("eyebrow")}</span>
        <h2>
          <TitleLines text={slot(data, "gallery.title") ?? `${t("titleLine1")}\n${t("titleLine2")}`} />
        </h2>
      </Reveal>

      <ul className="cr-hang">
        {images.map((src, index) => (
          <Reveal
            as="li"
            // Two photographs may be the same file while the couple is still choosing.
            key={`${index}-${src}`}
            className={`cr-frame ${index % 2 === 0 ? "cr-frame-tall" : "cr-frame-wide"}`}
            revealedClass="visible"
            threshold={0.2}
            // Frames side by side on one line are hung one after the other.
            data-col={String(index % 3)}
          >
            <figure>
              <div className="cr-frame-gilt">
                <div className="cr-frame-mat">
                  <span className="cr-frame-photo">
                    {/* eslint-disable-next-line @next/next/no-img-element -- the couple's photograph, cropped by the frame. */}
                    <img src={src} alt={t("imageAlt", { index: index + 1 })} loading="lazy" />
                  </span>
                </div>
              </div>
              <figcaption className="cr-frame-plaque" aria-hidden="true">
                {roman(index + 1)}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
