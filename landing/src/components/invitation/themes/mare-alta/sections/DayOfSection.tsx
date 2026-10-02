import { Camera, Clock3 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Link } from "@/navigation";

import { monogramOf } from "../../monogram";
import { slot } from "../../text";
import type { InvitationData } from "../../types";

import { Section } from "./Section";
import { SectionTitle } from "./SectionTitle";

/**
 * A real invitation links to the Jour J pages (`/jourj/<slug>/ma-table`,
 * `/photos`). The showcase and the editor's preview have no `weddingId` and no
 * such page, so there the same markup is an inert element, never a link that
 * would 404.
 */
function DayOfLink({
  data,
  path,
  className,
  children,
}: {
  data: InvitationData;
  path: string;
  className: string;
  children: ReactNode;
}) {
  const t = useTranslations("Invitation.mareAlta.footer");
  if (!data.dayOf) return null;

  if (!data.weddingId) {
    return (
      <span className={className} role="link" aria-disabled="true" title={t("soon")}>
        {children}
      </span>
    );
  }

  return (
    <Link className={className} href={`/jourj/${data.dayOf.slug}/${path}`}>
      {children}
    </Link>
  );
}

/**
 * "After the party": a call to share photos, which opens the Jour J page where
 * guests upload them and see the shared gallery.
 *
 * The Jour J is not a module and has no editor tab; the block belongs to the
 * footer tab because its words are `footer.*` slots. Drawn only while the
 * upload window is open or the gallery is shown (`dayOf.photos`).
 */
export function PhotosBlock({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.mareAlta.footer");
  if (!data.dayOf?.photos) return null;

  return (
    <Section id="ma-photos" className="photos coral-section" editorSection="footer">
      <SectionTitle
        eyebrow={slot(data, "footer.photosEyebrow") ?? t("photosEyebrow")}
        title={slot(data, "footer.photosTitle") ?? t("photosTitle")}
        intro={slot(data, "footer.photosBody") ?? t("photosBody")}
      />
      <DayOfLink data={data} path="photos" className="upload">
        <Camera />
        <strong>{t("photosCta")}</strong>
        <span>{t("photosHint")}</span>
      </DayOfLink>
    </Section>
  );
}

/**
 * "Find your seat": a card pointing guests at the Jour J seating finder, where
 * they look themselves up and see the room's plan. Same rules as the photos
 * block: drawn when the Jour J is on, a link only for a real invitation.
 */
export function TableBlock({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.mareAlta.footer");
  if (!data.dayOf) return null;

  const monogram = monogramOf(data.couple, " · ");

  return (
    <Section id="ma-table" className="dayof paper-section" editorSection="footer">
      <div className="dayof-card">
        {monogram ? <span className="mini-mark">{monogram}</span> : null}
        <Clock3 />
        <p className="eyebrow">{slot(data, "footer.tableEyebrow") ?? t("tableEyebrow")}</p>
        <h2>{slot(data, "footer.tableTitle") ?? t("tableTitle")}</h2>
        <p>{slot(data, "footer.tableBody") ?? t("tableBody")}</p>
        <DayOfLink data={data} path="ma-table" className="button primary">
          {t("tableCta")}
        </DayOfLink>
      </div>
    </Section>
  );
}
