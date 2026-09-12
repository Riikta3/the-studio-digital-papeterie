"use client";

import { useLocale, useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";

import { formatFrenchWeekday } from "../../format";
import type { InvitationData } from "../../types";
import type { CarpoolTrip } from "../types";

/**
 * Guest carpooling.
 *
 * TWO DELIBERATE DEPARTURES FROM THE SOURCE:
 *
 * 1. NO API. The source ran a Cloudflare Worker with a D1 database behind
 *    `/api/carpool`, fetched on mount and posted to on submit. None of that is
 *    ported — no drizzle, no `cloudflare:workers`, no fetch. Trips come from
 *    demo data and the form only flips local state, like every other form in
 *    this theme.
 *
 * 2. NO PHONE NUMBERS, ANYWHERE. The source rendered each driver's number into
 *    a `https://wa.me/${t.phone}` link on a page any guest — in practice,
 *    anyone with the URL — could open. `README_TARIK.md` forbids exactly this:
 *    "Ne jamais exposer de numéro de téléphone dans une réponse API accessible
 *    sans contrôle d'accès." `CarpoolTrip` therefore has no `phone` field at
 *    all, so the leak is not merely unrendered — it is unrepresentable. The
 *    button is inert until a real, access-controlled contact flow exists.
 *
 * The form still asks for a phone number because the eventual server action
 * will need one; it is submitted nowhere in this demo.
 */
export function CarpoolSection({
  trips,
  data,
}: {
  trips: CarpoolTrip[];
  /**
   * The wedding itself, for the destination and the default travel date.
   * Both used to be written into the markup — "vers Mauguio" (the demo
   * domaine's town) and a `defaultValue` of 2027-06-30 — so every other
   * wedding advertised the wrong destination and pre-filled a date in someone
   * else's calendar.
   */
  data: InvitationData;
}) {
  const t = useTranslations("Invitation.belleRive.carpool");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  // Where everyone is driving to, and the day most of them will travel.
  const destination = data.venue.city ?? data.venue.name;
  const weddingDay = data.event.startsAt.slice(0, 10);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSent(true);
  }

  return (
    <section className="panel carpool pearled">
      <p className="eyebrow">{t("eyebrow")}</p>
      <h2>
        {t("titleLine1")}
        <br />
        {t("titleLine2")}
      </h2>

      {/* eslint-disable-next-line @next/next/no-img-element -- decorative overhang,
          animated by the theme's CSS. */}
      <img
        className="carpool-journey"
        src="/themes/belle-rive/paris-montpellier-car.webp"
        alt=""
        aria-hidden="true"
        loading="lazy"
      />

      <p className="carpool-intro">{t("intro")}</p>

      <div className="trip-list">
        {trips.length > 0 ? (
          trips.map((trip) => {
            const day = formatFrenchWeekday(trip.travelDate, { locale });
            return (
              <article className="trip" key={trip.id}>
                <div className="trip-top">
                  <div>
                    <h3>
                      {destination
                        ? t("tripTo", { departure: trip.departure, destination })
                        : trip.departure}
                    </h3>
                    <p>
                      <span style={{ textTransform: "capitalize" }}>{day}</span> ·{" "}
                      {trip.travelTime.replace(":", "h")}
                    </p>
                  </div>
                </div>
                <div className="trip-meta">
                  <span>{t("offeredBy", { name: trip.name })}</span>
                  <strong>{t("seats", { count: trip.seats })}</strong>
                </div>
                {trip.returnTrip ? <small>{t("returnTripOffered")}</small> : null}
                <button
                  type="button"
                  className="contact-driver"
                  disabled
                  title={t("contactUnavailable")}
                >
                  {t("contactDriver")}
                </button>
              </article>
            );
          })
        ) : (
          <div className="no-trips">
            <span>◇</span>
            <p>
              {t("emptyLine1")}
              <br />
              {t("emptyLine2")}
            </p>
          </div>
        )}
      </div>

      {sent ? (
        <div className="carpool-success">
          <b>✓</b>
          <p>
            {t("successLine1")}
            <br />
            {t("successLine2")}
          </p>
        </div>
      ) : open ? (
        <form className="carpool-form" onSubmit={handleSubmit}>
          <label>
            {t("firstNameLabel")}
            <input name="name" required placeholder={t("firstNamePlaceholder")} />
          </label>
          <label>
            {t("departureLabel")}
            <input name="departure" required placeholder={t("departurePlaceholder")} />
          </label>
          <div className="carpool-row">
            <label>
              {t("dateLabel")}
              <input
                name="travelDate"
                type="date"
                required
                defaultValue={weddingDay}
              />
            </label>
            <label>
              {t("timeLabel")}
              <input name="travelTime" type="time" required />
            </label>
          </div>
          <label>
            {t("seatsLabel")}
            <select name="seats" defaultValue="1">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((seats) => (
                <option key={seats}>{seats}</option>
              ))}
            </select>
          </label>
          <label>
            {t("phoneLabel")}
            <input name="phone" type="tel" required placeholder={t("phonePlaceholder")} />
          </label>
          <label className="check-line">
            <input name="returnTrip" type="checkbox" /> {t("returnTripCheckbox")}
          </label>
          <label className="check-line consent">
            <input name="consent" type="checkbox" required /> {t("consentCheckbox")}
          </label>
          <button className="submit" type="submit">
            {t("publishTrip")}
          </button>
        </form>
      ) : (
        <button type="button" className="submit carpool-toggle" onClick={() => setOpen(true)}>
          {t("offerTrip")}
        </button>
      )}
    </section>
  );
}
