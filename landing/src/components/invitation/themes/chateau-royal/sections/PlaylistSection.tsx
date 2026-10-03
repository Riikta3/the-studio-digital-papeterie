"use client";

import { useTranslations } from "next-intl";

import { MAX_TRACKS } from "../../guest-playlist";
import { Reveal } from "../../reveal";
import { slot } from "../../text";
import type { InvitationData } from "../../types";
import { useGuestPlaylist } from "../../use-guest-playlist";
import { roman } from "../roman";

import { TitleLines } from "./TitleLines";

/** The designer's music drawing from the programme, here on the dance card's medallion. */
const NOTES =
  "M27 44V16l24-5v28M27 22l24-5M27 44c0 7-16 9-16 2s16-9 16-2zm24-5c0 7-16 9-16 2s16-9 16-2z";

/**
 * The ball's dance card (« carnet de bal »), on the night that falls after the
 * dinner: an ivory card with the double gold rule, its lines numbered like the
 * dances of a ball. The couple's own picks fill the first lines; a guest
 * searches Spotify's catalogue, adds up to three titles on the next ones and
 * sends them.
 *
 * Nothing here plays sound, so no player is drawn. The suggestions open in the
 * card's flow, under the field — the theme root clips what overflows it.
 *
 * With a wedding id the picks are saved; without one (the showcase, the
 * editor's preview) sending confirms locally and writes nothing — see
 * `useGuestPlaylist`.
 */
export function PlaylistSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.chateauRoyal.playlist");
  const {
    query,
    setQuery,
    results,
    searchState,
    active,
    setActive,
    selected,
    sent,
    pending,
    error,
    full,
    showPanel,
    inputRef,
    listId,
    choose,
    remove,
    send,
    handleKeyDown,
  } = useGuestPlaylist(data);

  // A line the couple has not filled in yet has nothing to print.
  const picks = (data.playlist ?? []).filter((pick) => pick.title.trim());
  const intro = data.copy?.playlistIntro?.trim() || slot(data, "playlist.intro") || t("intro");

  return (
    <section className="cr-ball" id="cr-playlist" data-editor-section="playlist">
      <Reveal as="div" className="cr-ball-card reveal" revealedClass="visible" threshold={0.12}>
        <div className="cr-ball-medallion" aria-hidden="true">
          <svg viewBox="0 0 64 64">
            <path d={NOTES} />
          </svg>
        </div>
        <span className="section-eyebrow">{slot(data, "playlist.eyebrow") ?? t("eyebrow")}</span>
        <h2>
          <TitleLines text={slot(data, "playlist.title") ?? `${t("titleLine1")}\n${t("titleLine2")}`} />
        </h2>
        <span className="cr-rule" aria-hidden="true" />
        <p className="cr-ball-intro">{intro}</p>

        {picks.length > 0 ? (
          <>
            <p className="cr-ball-label">{slot(data, "playlist.picks") ?? t("picks")}</p>
            <ol className="cr-ball-lines">
              {picks.map((pick, index) => (
                <li key={`${index}-${pick.title}`}>
                  <span className="cr-ball-no" aria-hidden="true">
                    {roman(index + 1)}
                  </span>
                  <span className="cr-ball-track">
                    <strong>{pick.title}</strong>
                    {pick.artist?.trim() ? <em>{pick.artist}</em> : null}
                  </span>
                </li>
              ))}
            </ol>
          </>
        ) : null}

        {sent ? (
          <p className="cr-ball-thanks" role="status">
            {t("thanks")}
          </p>
        ) : (
          <div className="cr-ball-form">
            <label className="cr-ball-search">
              <span>{t("searchLabel")}</span>
              <input
                ref={inputRef}
                name="suggestion"
                type="text"
                autoComplete="off"
                value={query}
                disabled={pending || full}
                placeholder={full ? t("searchPlaceholderFull", { max: MAX_TRACKS }) : t("searchPlaceholder")}
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={showPanel}
                aria-controls={listId}
                aria-activedescendant={active >= 0 ? `${listId}-opt-${active}` : undefined}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(-1);
                }}
                onKeyDown={handleKeyDown}
              />
            </label>

            {showPanel ? (
              <div className="cr-ball-results">
                {searchState === "loading" ? (
                  <p className="cr-ball-note" role="status">
                    {t("resultsLoading")}
                  </p>
                ) : searchState === "error" ? (
                  <p className="cr-ball-note" role="alert">
                    {t("resultsError")}
                  </p>
                ) : results.length === 0 ? (
                  <p className="cr-ball-note" role="status">
                    {t("resultsEmpty")}
                  </p>
                ) : (
                  <ul id={listId} role="listbox" aria-label={t("searchLabel")}>
                    {results.map((track, index) => (
                      <li
                        key={track.id}
                        id={`${listId}-opt-${index}`}
                        role="option"
                        aria-selected={index === active}
                        className={index === active ? "cr-active" : undefined}
                        onMouseEnter={() => setActive(index)}
                        // A click would blur the field first and close the list before it landed.
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => choose(track)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- remote Spotify CDN art, fixed size. */}
                        <img src={track.coverUrl} alt="" aria-hidden="true" loading="lazy" />
                        <span className="cr-ball-track">
                          <strong>{track.title}</strong>
                          <em>{track.artist}</em>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}

            {selected.length > 0 ? (
              // The guest's lines follow the couple's on the card.
              <ol className="cr-ball-lines cr-ball-yours">
                {selected.map((track, index) => (
                  <li key={track.id}>
                    <span className="cr-ball-no" aria-hidden="true">
                      {roman(picks.length + index + 1)}
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element -- remote Spotify CDN art, fixed size. */}
                    <img src={track.coverUrl} alt="" aria-hidden="true" loading="lazy" />
                    <span className="cr-ball-track">
                      <strong>{track.title}</strong>
                      <em>{track.artist}</em>
                    </span>
                    <button
                      type="button"
                      className="cr-ball-remove"
                      disabled={pending}
                      aria-label={t("removeTrack", { title: track.title })}
                      onClick={() => remove(track.id)}
                    >
                      <span aria-hidden="true">×</span>
                    </button>
                  </li>
                ))}
              </ol>
            ) : null}

            <p className="cr-ball-status" aria-live="polite">
              {full
                ? t("statusFull", { max: MAX_TRACKS })
                : selected.length === 0
                  ? t("statusEmpty", { max: MAX_TRACKS })
                  : t("statusCount", { count: selected.length, max: MAX_TRACKS })}
            </p>

            {error ? (
              <p className="cr-ball-error" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="button"
              className="cr-ball-send"
              disabled={pending || selected.length === 0}
              onClick={send}
            >
              {pending ? t("sending") : t("send")} <span aria-hidden="true">✦</span>
            </button>
          </div>
        )}
      </Reveal>
      {/* The candle-light that rises behind the card once it is seen (a sibling, so it sits under it). */}
      <span className="cr-glow" aria-hidden="true" />
    </section>
  );
}
