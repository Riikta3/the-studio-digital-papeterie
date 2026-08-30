"use client";

import { type FormEvent, useState } from "react";

import { formatFrenchWeekday } from "../../format";
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
export function CarpoolSection({ trips }: { trips: CarpoolTrip[] }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSent(true);
  }

  return (
    <section className="panel carpool pearled">
      <p className="eyebrow">Covoiturage</p>
      <h2>
        On fait la route
        <br />
        ensemble ?
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

      <p className="carpool-intro">
        Vous venez en voiture et il vous reste une place ? Proposez votre trajet aux autres
        invités.
      </p>

      <div className="trip-list">
        {trips.length > 0 ? (
          trips.map((trip) => {
            const day = formatFrenchWeekday(trip.travelDate);
            return (
              <article className="trip" key={trip.id}>
                <div className="trip-top">
                  <div>
                    <h3>{trip.departure} vers Mauguio</h3>
                    <p>
                      <span style={{ textTransform: "capitalize" }}>{day}</span> ·{" "}
                      {trip.travelTime.replace(":", "h")}
                    </p>
                  </div>
                </div>
                <div className="trip-meta">
                  <span>Proposé par {trip.name}</span>
                  <strong>
                    {trip.seats} place{trip.seats > 1 ? "s" : ""}
                  </strong>
                </div>
                {trip.returnTrip ? <small>Trajet retour également proposé</small> : null}
                <button
                  type="button"
                  className="contact-driver"
                  disabled
                  title="Disponible une fois votre invitation activée"
                >
                  Contacter
                </button>
              </article>
            );
          })
        ) : (
          <div className="no-trips">
            <span>◇</span>
            <p>
              Aucun trajet proposé pour le moment.
              <br />
              Soyez le premier !
            </p>
          </div>
        )}
      </div>

      {sent ? (
        <div className="carpool-success">
          <b>✓</b>
          <p>
            Votre trajet est publié.
            <br />
            Merci de faire la route ensemble !
          </p>
        </div>
      ) : open ? (
        <form className="carpool-form" onSubmit={handleSubmit}>
          <label>
            Prénom
            <input name="name" required placeholder="Votre prénom" />
          </label>
          <label>
            Ville de départ
            <input name="departure" required placeholder="Paris, Lyon, Marseille…" />
          </label>
          <div className="carpool-row">
            <label>
              Date
              <input name="travelDate" type="date" required defaultValue="2027-06-30" />
            </label>
            <label>
              Heure
              <input name="travelTime" type="time" required />
            </label>
          </div>
          <label>
            Places disponibles
            <select name="seats" defaultValue="1">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((seats) => (
                <option key={seats}>{seats}</option>
              ))}
            </select>
          </label>
          <label>
            Téléphone WhatsApp
            <input name="phone" type="tel" required placeholder="06 00 00 00 00" />
          </label>
          <label className="check-line">
            <input name="returnTrip" type="checkbox" /> Je propose aussi le trajet retour
          </label>
          <label className="check-line consent">
            <input name="consent" type="checkbox" required /> J’accepte que mon prénom et mon
            contact soient visibles par les invités.
          </label>
          <button className="submit" type="submit">
            Publier mon trajet
          </button>
        </form>
      ) : (
        <button type="button" className="submit carpool-toggle" onClick={() => setOpen(true)}>
          Je propose un trajet
        </button>
      )}
    </section>
  );
}
