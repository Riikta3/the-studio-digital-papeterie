import { useTranslations } from "next-intl";

import { Reveal } from "../../reveal";
import { slot } from "../../text";
import type { InvitationData } from "../../types";

import { TitleLines } from "./TitleLines";

/**
 * The place, revealed here and nowhere earlier — the designer's intent.
 *
 * The designer's arch held a film made for one château; here it holds the
 * couple's own photograph, with a slow zoom. Without a photograph the arch stays
 * as an empty frame over the ivory ground. The venue always has a name, so the
 * section always renders.
 */
export function VenueSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.chateauRoyal.venue");
  const { venue } = data;

  const where = [venue.name, venue.address].filter(Boolean).join(" · ");
  const mapsUrl =
    venue.mapsUrl ??
    `https://www.google.com/maps/search/?${new URLSearchParams({
      api: "1",
      query: [venue.name, venue.address ?? venue.city].filter(Boolean).join(", "),
    })}`;
  const intro = data.copy?.venueIntro?.trim();

  return (
    <section className="venue" id="cr-lieu" data-editor-section="map">
      <Reveal as="div" className="venue-head reveal" revealedClass="visible" threshold={0.12}>
        <div className="section-eyebrow">{slot(data, "map.eyebrow") ?? t("eyebrow")}</div>
        <h2>
          <TitleLines
            inline
            text={slot(data, "map.title") ?? `${t("titleLine1")}\n${t("titleLine2")}`}
          />
        </h2>
        <p>{where}</p>
        {/* The map tab's description. */}
        {intro ? <p className="cr-venue-intro">{intro}</p> : null}
        <a href={mapsUrl} target="_blank" rel="noreferrer">
          {t("route")} <span aria-hidden="true">↗</span>
        </a>
      </Reveal>
      {venue.image ? (
        <div className="venue-arch">
          {/* eslint-disable-next-line @next/next/no-img-element -- the couple's own photograph, framed by CSS. */}
          <img className="venue-still" src={venue.image} alt={venue.name} loading="lazy" />
        </div>
      ) : (
        <div className="venue-arch" role="img" aria-label={t("archLabel")} />
      )}
    </section>
  );
}
