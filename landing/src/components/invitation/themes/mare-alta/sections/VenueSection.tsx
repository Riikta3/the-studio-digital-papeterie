import { CalendarDays, MapPin, Navigation, Sun } from "lucide-react";
import { useTranslations } from "next-intl";

import { Reveal } from "../../reveal";
import { Lines, slot } from "../../text";
import type { InvitationData } from "../../types";
import { calendarUrl, mapsUrl } from "../calendar-url";

import { Section } from "./Section";
import { SectionTitle } from "./SectionTitle";

/**
 * The place: its name, the embroidered scene (or the couple's own photograph),
 * the address, and the two buttons that take a guest there and into their diary.
 *
 * The designer's stamp on the picture read the demo venue's GPS coordinates. The
 * venue has none in the contract, so it carries the city and the country.
 */
export function VenueSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.mareAlta.map");
  const { venue } = data;

  const stamp = [venue.city, venue.country].filter(Boolean);
  if (!venue.name && !venue.address && !venue.image && stamp.length === 0) return null;

  // Nothing to search for means no route to offer.
  const canRoute = Boolean(venue.mapsUrl || venue.name || venue.address || venue.city);

  return (
    <Section id="ma-map" className="location paper-section" editorSection="map">
      <SectionTitle
        eyebrow={slot(data, "map.eyebrow") ?? t("eyebrow")}
        title={venue.name}
        intro={data.copy?.venueIntro}
      />
      {/* The picture watches itself: its stamp is pressed on once a good part of it is on screen (`modules.css`).
          0.4, not more: on a phone held sideways (852 x 393) the picture is 730px tall, so at most 54% of it is
          ever on screen, and the stamp never came. */}
      <Reveal className="location-window" revealedClass="ma-seen" threshold={0.4}>
        {venue.image ? (
          // The couple's own photograph, cropped to the window by the theme's CSS.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={venue.image} alt={venue.name || t("imageAlt")} loading="lazy" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- decorative scene, sized and cropped by CSS.
          <img src="/themes/mare-alta/embroidered-destination-v5.webp" alt={t("imageAlt")} loading="lazy" />
        )}
        {stamp.length > 0 ? (
          <div className="location-stamp">
            <MapPin size={18} />
            <span>
              {stamp.map((line, index) => (
                <span key={line}>
                  {index > 0 ? <br /> : null}
                  {line}
                </span>
              ))}
            </span>
          </div>
        ) : null}
        <span className="sun-glow">
          <Sun />
        </span>
      </Reveal>
      {venue.address ? (
        <p className="address">
          <Lines text={venue.address} />
        </p>
      ) : null}
      <div className="button-row">
        {canRoute ? (
          <a className="button primary" href={mapsUrl(venue)} target="_blank" rel="noreferrer">
            <Navigation size={16} /> {t("route")}
          </a>
        ) : null}
        <a
          className="button ghost"
          href={calendarUrl(data)}
          target="_blank"
          rel="noreferrer"
          aria-label={t("calendarLabel")}
        >
          <CalendarDays size={16} /> {t("calendar")}
        </a>
      </div>
    </Section>
  );
}
