"use client";

import { useTranslations } from "next-intl";

import { MAX_TRACKS } from "../../guest-playlist";
import { slot } from "../../text";
import type { InvitationData } from "../../types";
import { useGuestPlaylist } from "../../use-guest-playlist";

import { Art } from "./Art";
import { Section } from "./Section";
import { Title } from "./Title";

/**
 * Playlist — the couple's opening tracks, a guitarist on the sand, and a search
 * for the guest's own suggestion.
 *
 * The designer's page played nothing and took a free-text "title / artist" form
 * that added a row to the list in the page. Here the opening tracks are only
 * listed (no player: there is no audio), and the guest searches Spotify, picks
 * up to three titles and sends them to the couple — `useGuestPlaylist` does the
 * search, the keyboard and the submission (nothing is written without a
 * `weddingId`, so the showcase stays out of the database). The results open in
 * the page's flow, under the field: the section clips what overflows it, so a
 * floating panel would be cut.
 */
export function PlaylistSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.caboVerde.playlist");
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

  const tracks = data.playlist ?? [];
  const opened = showPanel && searchState === "done" && results.length > 0;
  const note =
    showPanel && searchState === "loading"
      ? { text: t("loading"), role: "status" as const }
      : showPanel && searchState === "error"
        ? { text: t("error"), role: "alert" as const }
        : showPanel && searchState === "done" && results.length === 0
          ? { text: t("empty"), role: "status" as const }
          : null;

  return (
    <Section id="cv-playlist" className="playlist decorated" editorSection="playlist">
      <p className="eyebrow">{slot(data, "playlist.eyebrow") ?? t("eyebrow")}</p>

      <div className={tracks.length > 0 ? "playlist-intro" : "playlist-intro cv-no-count"}>
        {tracks.length > 0 ? <span>{`01 — ${String(tracks.length).padStart(2, "0")}`}</span> : null}
        <Title text={slot(data, "playlist.title") ?? `${t("titleLine1")}\n${t("titleLine2")}`} />
        <p>{data.copy?.playlistIntro ?? slot(data, "playlist.intro") ?? t("intro")}</p>
      </div>

      {/* A painted guitarist: decoration, as the discs of the other themes. */}
      <div className="wedding-music-visual" aria-hidden="true">
        <Art className="music-beach-guitar" file="beach-wedding-guitar-v24" />
      </div>

      {tracks.length > 0 ? (
        <>
          <h3 className="cv-openers">{t("openers")}</h3>
          <div className="track-list">
            {tracks.map((track, index) => (
              <div key={`${index}-${track.title}`}>
                <span className="play" aria-hidden="true">
                  ♪
                </span>
                <span>
                  <b>{track.title}</b>
                  <small>{track.artist}</small>
                </span>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {sent ? null : (
        <div className="song-form cv-suggest">
          <label htmlFor={`${listId}-input`}>{t("searchLabel")}</label>
          <input
            id={`${listId}-input`}
            ref={inputRef}
            name="suggestion"
            type="text"
            autoComplete="off"
            placeholder={full ? t("searchPlaceholderFull", { max: MAX_TRACKS }) : t("searchPlaceholder")}
            value={query}
            disabled={pending || full}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(-1);
            }}
            onKeyDown={handleKeyDown}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={opened}
            aria-controls={listId}
            aria-activedescendant={opened && active >= 0 ? `${listId}-opt-${active}` : undefined}
          />

          {note ? (
            <p className="cv-results-note" role={note.role}>
              {note.text}
            </p>
          ) : null}
          <ul id={listId} role="listbox" className="cv-results" hidden={!opened} aria-label={t("searchLabel")}>
            {results.map((track, index) => (
              <li
                key={track.id}
                id={`${listId}-opt-${index}`}
                role="option"
                aria-selected={index === active}
                className={index === active ? "cv-result cv-result-active" : "cv-result"}
                onMouseEnter={() => setActive(index)}
                // Keeps the focus in the field: a click would otherwise blur it first.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(track)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- remote Spotify art, a fixed small square. */}
                <img src={track.coverUrl} alt="" loading="lazy" />
                <span>
                  <strong>{track.title}</strong>
                  <em>{track.artist}</em>
                </span>
              </li>
            ))}
          </ul>

          {selected.length > 0 ? (
            <ul className="cv-picked">
              {selected.map((track) => (
                <li key={track.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- remote Spotify art, a fixed small square. */}
                  <img src={track.coverUrl} alt="" loading="lazy" />
                  <span>
                    <strong>{track.title}</strong>
                    <em>{track.artist}</em>
                  </span>
                  <button
                    type="button"
                    className="cv-remove"
                    onClick={() => remove(track.id)}
                    disabled={pending}
                    aria-label={t("remove", { title: track.title })}
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <p className="cv-status">
            {full
              ? t("statusFull", { max: MAX_TRACKS })
              : selected.length === 0
                ? t("statusEmpty", { max: MAX_TRACKS })
                : t("statusCount", { count: selected.length, max: MAX_TRACKS })}
          </p>

          {error ? (
            <p className="cv-error" role="alert">
              {error}
            </p>
          ) : null}

          <button type="button" onClick={send} disabled={pending || selected.length === 0}>
            {pending ? t("sending") : t("send")}
          </button>
        </div>
      )}

      {/* Always in the page, so that a screen reader hears it fill. */}
      <p className="form-message" role="status">
        {sent ? t("thanks", { count: selected.length }) : null}
      </p>
    </Section>
  );
}
