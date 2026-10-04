"use client";

import { MessageCircleHeart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import { Lines, slot } from "../../text";
import type { InvitationData } from "../../types";
import { GUESTBOOK_MAX_MESSAGE, GUESTBOOK_MAX_NAME, useGuestGuestbook } from "../../use-guest-guestbook";

import { Section } from "./Section";
import { RhythmTitle, SectionTitle } from "./SectionTitle";

/**
 * "La jarre des mots": the designer's embroidered jar, and beside it the slip
 * of paper a guest writes on and slips in.
 *
 * The designer's page also printed the notes already in the jar under it. The
 * guestbook is private (only the couple reads it, in the dashboard), so that
 * wall is not drawn: a guest sees the jar, their own note and a thank-you.
 *
 * The note's heading is one of the designer's writing prompts ("Une autre
 * question" turns to the next). They are the theme's words, one per line of the
 * `guestbook.prompts` slot, so a couple can write their own; the prompt only
 * helps the guest start, it is not sent with the message.
 *
 * Sent, the note folds and drops into the jar's mouth (`modules.css`) while the
 * thank-you takes its place. Submission, pending and error state, and the demo
 * guard (no `weddingId`, nothing written) are the shared hook's.
 */
export function GuestbookSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.mareAlta.guestbook");
  const guestbook = useGuestGuestbook(data);
  const [promptIndex, setPromptIndex] = useState(0);
  const [length, setLength] = useState(0);
  const ids = useId();

  const prompts = (slot(data, "guestbook.prompts") ?? PROMPT_KEYS.map((key) => t(key)).join("\n"))
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const prompt = prompts.length ? prompts[promptIndex % prompts.length] : null;

  const title = data.guestbook?.title?.trim() || slot(data, "guestbook.title") || `${t("titleLine1")}\n${t("titleLine2")}`;
  const intro = data.guestbook?.body?.trim() || slot(data, "guestbook.intro") || t("intro");

  return (
    <Section id="ma-guestbook" className="guestbook paper-section" editorSection="guestbook">
      <SectionTitle
        rhythm
        eyebrow={slot(data, "guestbook.eyebrow") ?? t("eyebrow")}
        title={<RhythmTitle text={title} />}
        intro={<Lines text={intro} />}
      />

      <div className={`jar-experience${guestbook.sent ? " ma-jar-sent" : ""}`}>
        <div className="ma-jar-art">
          {/* eslint-disable-next-line @next/next/no-img-element -- the theme's own artwork, sized by the stylesheet. */}
          <img src="/themes/mare-alta/embroidered-memory-jar-v7.webp" alt={t("jarAlt")} loading="lazy" />
          {/* The guest's note, folded, dropping into the jar once sent. */}
          {guestbook.sent ? <span className="ma-jar-slip" aria-hidden="true" /> : null}
        </div>

        <div className="jar-note">
          {guestbook.sent ? (
            <div className="ma-jar-thanks" role="status">
              <small>{t("thanksEyebrow")}</small>
              <h3>{guestbook.signedAs ? t("thanksTitleNamed", { name: guestbook.signedAs }) : t("thanksTitle")}</h3>
              <p>{t("thanksBody")}</p>
              <div>
                <button
                  type="button"
                  className="new-question"
                  onClick={() => {
                    guestbook.reset();
                    setLength(0);
                    setPromptIndex((current) => current + 1);
                  }}
                >
                  {t("another")}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={guestbook.handleSubmit}>
              <small>{slot(data, "guestbook.tag") ?? t("tag")}</small>
              {prompt ? <h3 id={`${ids}-prompt`}>{prompt}</h3> : null}

              <label className="ma-sr-only" htmlFor={`${ids}-message`}>
                {t("messageLabel")}
              </label>
              <textarea
                id={`${ids}-message`}
                name="message"
                required
                maxLength={GUESTBOOK_MAX_MESSAGE}
                placeholder={t("messagePlaceholder")}
                aria-describedby={`${prompt ? `${ids}-prompt ` : ""}${ids}-count`}
                onChange={(event) => setLength(event.target.value.length)}
              />
              <p className="ma-jar-count" id={`${ids}-count`} aria-live="polite">
                {t("counter", { count: length, max: GUESTBOOK_MAX_MESSAGE })}
              </p>

              <label className="ma-jar-name">
                {t("nameLabel")}
                <input
                  name="guestName"
                  required
                  maxLength={GUESTBOOK_MAX_NAME}
                  autoComplete="given-name"
                  placeholder={t("namePlaceholder")}
                />
              </label>

              {guestbook.error ? (
                <p className="ma-jar-error" role="alert">
                  {guestbook.error}
                </p>
              ) : null}

              <div>
                {prompts.length > 1 ? (
                  <button
                    type="button"
                    className="new-question"
                    onClick={() => setPromptIndex((current) => current + 1)}
                  >
                    {t("anotherPrompt")}
                  </button>
                ) : null}
                <button className="seal-note" type="submit" disabled={guestbook.pending}>
                  <MessageCircleHeart /> {guestbook.pending ? t("sending") : t("send")}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Section>
  );
}

/** The designer's six prompts, in their order. */
const PROMPT_KEYS = ["prompt1", "prompt2", "prompt3", "prompt4", "prompt5", "prompt6"] as const;
