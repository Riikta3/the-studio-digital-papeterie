"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import { slot } from "../../text";
import type { InvitationData, Stay } from "../../types";

import { Art } from "./Art";
import { Section } from "./Section";
import { Title } from "./Title";

/** A phone number as a `tel:` link: the digits and a leading plus, whatever the couple typed. */
function telHref(phone: string): string | null {
  const dialled = phone.replace(/[^\d+]/g, "");
  return /\d/.test(dialled) ? `tel:${dialled}` : null;
}

/**
 * Stay — numbered rows under a pier, a suitcase waiting at the foot of it.
 *
 * The rows are the designer's (`01  city / name / address  —  distance`); what
 * the couple wrote on a hotel's card beyond that — a booking link, an offer and
 * its code, a phone number, a photograph — is added to the row's text. The ones
 * flagged `secondary` sit behind a "see more options" toggle.
 */
export function StaySection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.caboVerde.stay");
  const uid = useId();
  const [showMore, setShowMore] = useState(false);

  const stays = data.stays ?? [];
  if (stays.length === 0) return null;

  const primary = stays.filter((stay) => !stay.secondary);
  const secondary = stays.filter((stay) => stay.secondary);

  function row(stay: Stay, index: number) {
    // The code is said once: a couple often writes it inside the offer itself
    // ("-15 % with the code XYZ"), and printing it again would double it.
    const code = stay.bookingCode?.trim();
    const codeInOffer = Boolean(code && stay.offer?.toLowerCase().includes(code.toLowerCase()));
    const offer = [stay.offer, code && !codeInOffer ? t("code", { code }) : null].filter(Boolean).join(" · ");
    const tel = stay.phone ? telHref(stay.phone) : null;

    return (
      <article key={`${index}-${stay.name}`}>
        <span>{String(index + 1).padStart(2, "0")}</span>
        <div className={stay.image ? "cv-stay-has-photo" : undefined}>
          {stay.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- the couple's own upload, a small round photo.
            <img className="cv-stay-photo" src={stay.image} alt="" loading="lazy" />
          ) : null}
          {stay.city ? <small>{stay.city}</small> : null}
          <h3>{stay.name}</h3>
          {stay.address ? <p>{stay.address}</p> : null}
          {offer ? <p className="cv-stay-offer">{offer}</p> : null}
          {stay.url || tel ? (
            <p className="cv-stay-links">
              {stay.url ? (
                <a href={stay.url} target="_blank" rel="noreferrer">
                  {t("book")}
                </a>
              ) : null}
              {tel ? (
                <a href={tel} aria-label={`${t("call")} ${stay.phone}`}>
                  {stay.phone}
                </a>
              ) : null}
            </p>
          ) : null}
        </div>
        {stay.distance ? <b>{stay.distance}</b> : null}
      </article>
    );
  }

  return (
    <Section className="stay decorated" editorSection="accommodation">
      <p className="eyebrow cobalt">{slot(data, "accommodation.eyebrow") ?? t("eyebrow")}</p>
      <Title text={slot(data, "accommodation.title") ?? `${t("titleLine1")}\n${t("titleLine2")}`} />
      {data.copy?.staysIntro ? <p className="intro cv-stay-intro">{data.copy.staysIntro}</p> : null}
      <Art className="beach-decor stay-pilotis" file="beach-pilotis-v8" />

      <div className="stay-list" id={`cv-stays-${uid}`}>
        {primary.map((stay, index) => row(stay, index))}
        {showMore ? secondary.map((stay, index) => row(stay, primary.length + index)) : null}
      </div>

      {secondary.length > 0 ? (
        <button
          type="button"
          className="cv-more"
          aria-expanded={showMore}
          aria-controls={`cv-stays-${uid}`}
          onClick={() => setShowMore((open) => !open)}
        >
          {showMore ? t("less") : t("more")}
        </button>
      ) : null}

      <div className="stay-objects" aria-hidden="true">
        <Art className="rolling-luggage-set" file="rolling-luggage-set-v25" />
      </div>
    </Section>
  );
}
