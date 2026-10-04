"use client";

import { useLocale, useTranslations } from "next-intl";
import { useId, useState } from "react";

import { heroDates } from "../../date-range";
import { slot } from "../../text";
import type { InvitationData } from "../../types";
import { GUESTBOOK_MAX_MESSAGE, GUESTBOOK_MAX_NAME, useGuestGuestbook } from "../../use-guest-guestbook";

import { Art } from "./Art";
import { Section } from "./Section";
import { Title } from "./Title";

/**
 * The guestbook (« livre d'or ») as a postcard the guest writes to the couple:
 * the gift note's airmail card turned round. The message goes on the left, on
 * ruled lines; on the right, a stamp with one of the hero's painted boats, the
 * couple's names on the address lines, and the guest's signature.
 *
 * Private: only the couple read the cards, in their dashboard. The section
 * shows the form, the couple's heading and welcome words, and a thank-you —
 * never another guest's message.
 *
 * Sent, the card is posted: it is dealt back onto the page and the postmark
 * lands on its stamp with the wedding day.
 *
 * With a wedding id the message is saved; without one (the showcase, the
 * editor's preview) the card confirms locally and writes nothing — see
 * `useGuestGuestbook`.
 */
export function GuestbookSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.caboVerde.guestbook");
  const locale = useLocale();
  const book = useGuestGuestbook(data);
  const [length, setLength] = useState(0);
  const countId = useId();

  const title =
    data.guestbook?.title?.trim() || slot(data, "guestbook.title") || `${t("titleLine1")}\n${t("titleLine2")}`;
  const intro = data.guestbook?.body?.trim() || slot(data, "guestbook.intro") || t("intro");
  const date = heroDates(data, locale).dotted;
  const addressee = [data.couple.partner1, data.couple.partner2].filter((name) => name?.trim()).join(" & ");

  const stamp = (
    <span className="cv-stamp">
      <Art className="cv-stamp-art" file="hero-boat-1-v19" />
    </span>
  );

  return (
    <Section id="cv-livre-dor" className="cv-book" editorSection="guestbook">
      <p className="eyebrow">{slot(data, "guestbook.eyebrow") ?? t("eyebrow")}</p>
      <Title text={title} />
      <p className="cv-book-intro">{intro}</p>

      {book.sent ? (
        <div className="cv-book-card cv-book-posted" role="status">
          <div className="cv-book-side" aria-hidden="true">
            {stamp}
            <span className="cv-postmark">{date ? <span>{date}</span> : null}</span>
          </div>
          <div className="cv-book-thanks">
            <h3>{t("thanks", { name: book.signedAs })}</h3>
            <p>{t("thanksBody")}</p>
            <button
              type="button"
              className="cv-book-button"
              onClick={() => {
                setLength(0);
                book.reset();
              }}
            >
              {t("again")}
            </button>
          </div>
        </div>
      ) : (
        <form className="cv-book-card" onSubmit={book.handleSubmit}>
          {/* The address corner: the stamp, and the couple's names on the line. */}
          <div className="cv-book-head" aria-hidden="true">
            <div className="cv-book-side">{stamp}</div>
            {addressee ? <p className="cv-book-to">{addressee}</p> : null}
          </div>

          <div className="cv-book-message">
            <label>
              {t("messageLabel")}
              <textarea
                name="message"
                rows={6}
                maxLength={GUESTBOOK_MAX_MESSAGE}
                required
                placeholder={t("messagePlaceholder")}
                aria-describedby={countId}
                onChange={(event) => setLength(event.target.value.length)}
              />
            </label>
            <span className="cv-book-count" id={countId}>
              {t("count", { count: length, max: GUESTBOOK_MAX_MESSAGE })}
            </span>
          </div>

          {/* The guest signs, and posts it. */}
          <div className="cv-book-sign">
            <label>
              {t("nameLabel")}
              <input name="guestName" autoComplete="given-name" maxLength={GUESTBOOK_MAX_NAME} required />
            </label>

            {book.error ? (
              <p className="cv-book-error" role="alert">
                {book.error}
              </p>
            ) : null}

            <button type="submit" className="cv-book-button" disabled={book.pending}>
              {book.pending ? t("pending") : t("submit")}
            </button>
          </div>
        </form>
      )}
    </Section>
  );
}
