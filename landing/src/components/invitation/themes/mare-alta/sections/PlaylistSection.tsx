"use client";

import { CircleCheck, Music2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { MAX_TRACKS } from "../../guest-playlist";
import { slot } from "../../text";
import type { InvitationData } from "../../types";
import { useGuestPlaylist } from "../../use-guest-playlist";

import { Section } from "./Section";
import { RhythmTitle, SectionTitle } from "./SectionTitle";

/**
 * The guests' playlist: two embroidered records turning, and a field to
 * suggest a song.
 *
 * The designer's page also had an audio player with four fixed tracks and a
 * link out to Spotify. Nothing here can play sound, so none of it is drawn; the
 * guest searches Spotify's catalogue from the field, picks up to three titles
 * and sends them to the couple.
 *
 * The suggestions list opens in the page's flow, under the field, rather than
 * floating over the section: the section clips what overflows it.
 */
export function PlaylistSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.mareAlta.playlist");
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

  return (
    <Section id="ma-playlist" className="playlist paper-section" editorSection="playlist">
      <SectionTitle
        rhythm
        eyebrow={slot(data, "playlist.eyebrow") ?? t("eyebrow")}
        title={<RhythmTitle text={slot(data, "playlist.title") ?? `${t("titleLine1")}\n${t("titleLine2")}`} />}
        intro={data.copy?.playlistIntro ?? slot(data, "playlist.intro") ?? t("intro")}
      />
      {/* The discs turn all the time (the stylesheet), whether or not anything plays. */}
      <div className="record-stage">
        <div className="vinyl-garden" role="img" aria-label={t("discsLabel")}>
          <i className="vinyl sage-vinyl" />
          <i className="vinyl ivory-vinyl" />
          <span className="turntable-arm" />
        </div>
        <div className="music-notes" aria-hidden="true">
          <Music2 />
          <span>♪</span>
          <span>♫</span>
        </div>
      </div>

      {sent ? (
        <div className="song-confirm" role="status">
          <CircleCheck /> {t("thanks")}
        </div>
      ) : (
        <div className="song-suggest">
          <Music2 />
          <input
            ref={inputRef}
            name="suggestion"
            type="text"
            autoComplete="off"
            value={query}
            disabled={pending || full}
            placeholder={full ? t("searchPlaceholderFull", { max: MAX_TRACKS }) : t("searchPlaceholder")}
            aria-label={t("searchLabel")}
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

          {showPanel ? (
            <div className="ma-results">
              {searchState === "loading" ? (
                <p className="ma-note" role="status">
                  {t("resultsLoading")}
                </p>
              ) : searchState === "error" ? (
                <p className="ma-note" role="alert">
                  {t("resultsError")}
                </p>
              ) : results.length === 0 ? (
                <p className="ma-note" role="status">
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
                      className={index === active ? "ma-active" : undefined}
                      onMouseEnter={() => setActive(index)}
                      // A click would blur the field first and close the list before it landed.
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => choose(track)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- remote Spotify CDN art, fixed 44px. */}
                      <img src={track.coverUrl} alt="" aria-hidden="true" loading="lazy" />
                      <span>
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
            <ul className="ma-picked">
              {selected.map((track) => (
                <li key={track.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- remote Spotify CDN art, fixed 44px. */}
                  <img src={track.coverUrl} alt="" aria-hidden="true" loading="lazy" />
                  <span>
                    <strong>{track.title}</strong>
                    <em>{track.artist}</em>
                  </span>
                  <button
                    type="button"
                    disabled={pending}
                    aria-label={t("removeTrack", { title: track.title })}
                    onClick={() => remove(track.id)}
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <p className="ma-status" aria-live="polite">
            {full
              ? t("statusFull", { max: MAX_TRACKS })
              : selected.length === 0
                ? t("statusEmpty", { max: MAX_TRACKS })
                : t("statusCount", { count: selected.length, max: MAX_TRACKS })}
          </p>

          {error ? (
            <p className="ma-error" role="alert">
              {error}
            </p>
          ) : null}

          <button type="button" className="ma-send" disabled={pending || selected.length === 0} onClick={send}>
            {pending ? t("sending") : t("send")}
          </button>
        </div>
      )}
    </Section>
  );
}
