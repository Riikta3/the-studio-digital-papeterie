"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import { monogramOf } from "../../monogram";
import { Reveal } from "../../reveal";
import { slot } from "../../text";
import type { InvitationData } from "../../types";
import { GUESTBOOK_MAX_MESSAGE, GUESTBOOK_MAX_NAME, useGuestGuestbook } from "../../use-guest-guestbook";
import { splitMonogram } from "../monogram-parts";

import { TitleLines } from "./TitleLines";

/**
 * The guestbook (« livre d'or »), as the château's own: an ivory page laid in
 * an espresso binding tooled with a gold rule, a silk ribbon marking it. The
 * guest signs their first name and writes on the page's ruled lines.
 *
 * Private: only the couple read the words, in their dashboard. The page shows
 * the form, the couple's heading and welcome words, and a thank-you — never
 * another guest's message.
 *
 * Sent, the words are sealed: the couple's monogram is pressed into espresso
 * wax on the page (the gift note's seal, and the closing page's).
 *
 * With a wedding id the message is saved; without one (the showcase, the
 * editor's preview) the page confirms locally and writes nothing — see
 * `useGuestGuestbook`.
 */
export function GuestbookSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.chateauRoyal.guestbook");
  const book = useGuestGuestbook(data);
  const [length, setLength] = useState(0);
  const countId = useId();

  const title =
    data.guestbook?.title?.trim() || slot(data, "guestbook.title") || `${t("titleLine1")}\n${t("titleLine2")}`;
  const intro = data.guestbook?.body?.trim() || slot(data, "guestbook.intro") || t("intro");
  const monogram = monogramOf(data.couple, " & ");
  const parts = splitMonogram(monogram);

  return (
    <section className="cr-book" id="cr-livre-dor" data-editor-section="guestbook">
      <Reveal as="div" className="cr-book-cover reveal" revealedClass="visible" threshold={0.15}>
        <span className="cr-book-ribbon" aria-hidden="true" />
        <div className="cr-book-page">
          <span className="section-eyebrow">{slot(data, "guestbook.eyebrow") ?? t("eyebrow")}</span>
          <h2>
            <TitleLines text={title} />
          </h2>
          <span className="cr-rule" aria-hidden="true" />
          <p className="cr-book-intro">{intro}</p>

          {book.sent ? (
            <div className="cr-book-sealed" role="status">
              {monogram ? (
                <span className="cr-book-seal" aria-hidden="true" data-long={monogram.length > 5 ? "" : undefined}>
                  {parts ? (
                    <>
                      {parts.left}
                      <i>{parts.separator}</i>
                      {parts.right}
                    </>
                  ) : (
                    monogram
                  )}
                </span>
              ) : (
                <span className="cr-book-seal" aria-hidden="true">
                  ✣
                </span>
              )}
              <p className="cr-book-thanks">{t("thanks", { name: book.signedAs })}</p>
              <p className="cr-book-thanks-body">{t("thanksBody")}</p>
              <button
                type="button"
                className="cr-book-again"
                onClick={() => {
                  setLength(0);
                  book.reset();
                }}
              >
                {t("again")} <span aria-hidden="true">✦</span>
              </button>
            </div>
          ) : (
            <form className="cr-book-form" onSubmit={book.handleSubmit}>
              <label>
                {t("nameLabel")}
                <input name="guestName" autoComplete="given-name" maxLength={GUESTBOOK_MAX_NAME} required />
              </label>
              <label>
                {t("messageLabel")}
                <textarea
                  name="message"
                  rows={5}
                  maxLength={GUESTBOOK_MAX_MESSAGE}
                  required
                  aria-describedby={countId}
                  onChange={(event) => setLength(event.target.value.length)}
                />
              </label>
              <span className="cr-book-count" id={countId}>
                {t("count", { count: length, max: GUESTBOOK_MAX_MESSAGE })}
              </span>

              {book.error ? (
                <p className="cr-book-error" role="alert">
                  {book.error}
                </p>
              ) : null}

              <button type="submit" className="cr-book-send" disabled={book.pending}>
                {book.pending ? t("pending") : t("submit")} <span aria-hidden="true">✦</span>
              </button>
            </form>
          )}
        </div>
      </Reveal>
    </section>
  );
}
