"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import { Reveal } from "../../reveal";
import { Lines, slot } from "../../text";
import type { InvitationData } from "../../types";
import { GUESTBOOK_MAX_MESSAGE, GUESTBOOK_MAX_NAME, useGuestGuestbook } from "../../use-guest-guestbook";

/**
 * The guestbook: a cobalt band edged in sun, like the playlist and the film,
 * and on it a cream card with two lemons at its corners (the gift card's)
 * where a guest writes the couple a word.
 *
 * Private: only the couple reads the messages, in the dashboard. The page
 * shows the form, the couple's heading and welcome words, and a thank-you —
 * never what other guests wrote.
 *
 * The card wears the RSVP card's classes (`rsvp-card`, `rsvp-field`,
 * `rsvp-submit`, `rsvp-error`), so its fields are the RSVP's to the pixel;
 * `ca-guestbook-card` only changes its shadow for the cobalt ground. Sent, a
 * lemon stamp is pressed onto the card above the thank-you (`modules.css`).
 * Submission, pending and error state, and the demo guard (no `weddingId`,
 * nothing written) are the shared hook's.
 */
export function GuestbookSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.ciaoAmore.guestbook");
  const guestbook = useGuestGuestbook(data);
  const [length, setLength] = useState(0);
  const ids = useId();

  const title = data.guestbook?.title?.trim() || slot(data, "guestbook.title") || `${t("titleLine1")}\n${t("titleLine2")}`;
  const intro = data.guestbook?.body?.trim() || slot(data, "guestbook.intro") || t("intro");

  return (
    <Reveal as="section" className="ca-guestbook-section" revealedClass="ca-seen" data-editor-section="guestbook">
      <div className="ca-guestbook-head">
        <p className="eyebrow">{slot(data, "guestbook.eyebrow") ?? t("eyebrow")}</p>
        <h2>
          <Lines text={title} />
        </h2>
        <p className="ca-guestbook-intro">
          <Lines text={intro} />
        </p>
      </div>

      <div className={`rsvp-card ca-guestbook-card${guestbook.sent ? " ca-guestbook-sent" : ""}`}>
        {guestbook.sent ? (
          <div className="thanks ca-guestbook-thanks" role="status">
            {/* A lemon pressed onto the card like a postmark. */}
            <i className="ca-guestbook-stamp" aria-hidden="true" />
            <h3>{guestbook.signedAs ? t("thanksTitleNamed", { name: guestbook.signedAs }) : t("thanksTitle")}</h3>
            <p>{t("thanksBody")}</p>
            <button
              type="button"
              className="ca-guestbook-again"
              onClick={() => {
                guestbook.reset();
                setLength(0);
              }}
            >
              {t("another")}
            </button>
          </div>
        ) : (
          <form onSubmit={guestbook.handleSubmit}>
            <label>
              {t("nameLabel")}
              <span className="rsvp-field">
                <input
                  required
                  name="guestName"
                  maxLength={GUESTBOOK_MAX_NAME}
                  autoComplete="given-name"
                  placeholder={t("namePlaceholder")}
                />
              </span>
            </label>

            <label>
              {t("messageLabel")}
              <span className="rsvp-field rsvp-field-area">
                <textarea
                  required
                  name="message"
                  maxLength={GUESTBOOK_MAX_MESSAGE}
                  placeholder={t("messagePlaceholder")}
                  aria-describedby={`${ids}-count`}
                  onChange={(event) => setLength(event.target.value.length)}
                />
              </span>
            </label>
            {/* Outside the label, so it is not read as part of the field's name. */}
            <p className="ca-guestbook-count" id={`${ids}-count`} aria-live="polite">
              {t("counter", { count: length, max: GUESTBOOK_MAX_MESSAGE })}
            </p>

            {guestbook.error ? (
              <p className="rsvp-error" role="alert">
                {guestbook.error}
              </p>
            ) : null}

            <button className="rsvp-submit" type="submit" disabled={guestbook.pending}>
              {guestbook.pending ? t("submitPending") : t("submit")}
            </button>
          </form>
        )}
      </div>
    </Reveal>
  );
}
