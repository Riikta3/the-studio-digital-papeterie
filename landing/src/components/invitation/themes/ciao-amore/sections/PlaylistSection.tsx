"use client";

import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { submitPlaylistSuggestions } from "@/actions/invitation-submissions";
import type { InvitationData } from "../../types";

/**
 * Participative playlist, backed by Spotify search.
 *
 * Two modes, decided by `data.weddingId` (see `themes/types.ts`):
 *   - with an id  → the chosen track is persisted into `playlist_suggestions`;
 *   - without one → demo. `choose()` returns before calling the action, so the
 *                   public showcase writes nothing.
 *
 * ── One step, not two ───────────────────────────────────────────────────────
 * Picking a row IS the submission. There is no confirm button: with a search
 * that returns real tracks, "Ajouter à la playlist" was a second click that
 * could only restate the choice the first one had already made. `choose()` is
 * therefore both the selection handler and the submit path — which is why the
 * demo guard lives inside it rather than in a form handler.
 *
 * ── What the demo *does* still do ────────────────────────────────────────────
 * Searching is not writing. `/api/spotify/search` is a read-only lookup, so it
 * runs in both modes on purpose: the demo is the showcase, and a visitor has to
 * be able to try the field for it to sell anything. The demo/real split lives
 * strictly on the submit path — the early `return` below — and nowhere else.
 *
 * ── Why search replaced the free-text field ─────────────────────────────────
 * The field used to take "Titre — Artiste" in one string and split it on a dash
 * here, which guessed wrong on every title containing one ("Can't Take My Eyes
 * Off You - Remastered"). Picking a real track removes the guess: the id, the
 * exact title, the artist and the cover art all come from Spotify, and the
 * dashboard's status map — which keys by track id — gets a stable id it can
 * actually key on rather than one minted server-side per submission.
 *
 * ── Why `data.playlist` is not rendered here ────────────────────────────────
 * This section used to print the couple's existing suggestions under the form.
 * It no longer does: the section asks the guest for a track, and listing what
 * has already been chosen answered a question nobody was asking at that point
 * in the page.
 *
 * `data.playlist` stays in the contract (`themes/types.ts`) and in the demo
 * data on purpose — it is legitimate content and another theme may well render
 * it. Only THIS theme's presentation drops it.
 */

/** Matches the payload `/api/spotify/search` returns. */
type SpotifyResult = {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  uri: string;
  spotifyUrl: string | null;
};

/** A guest may propose up to three titles in one submission. */
const MAX_TRACKS = 3;

/** Spotify's own minimum; below it the route answers an empty list anyway. */
const MIN_QUERY = 2;
/** Long enough to feel instant, long enough not to fire on every keystroke. */
const DEBOUNCE_MS = 350;

type SearchState = "idle" | "loading" | "done" | "error";

export function PlaylistSection({ data }: { data: InvitationData }) {
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SpotifyResult[]>([]);
  const [searchState, setSearchState] = useState<SearchState>("idle");
  /** Index of the arrow-key highlighted option; -1 when none. */
  const [active, setActive] = useState(-1);
  /** The 0–3 tracks the guest has picked, sent together on submit. */
  const [selected, setSelected] = useState<SpotifyResult[]>([]);

  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);

  /**
   * Viewport rect of the panel, in `position:fixed` coordinates.
   *
   * The panel is rendered through a portal onto `document.body` rather than
   * inside the section. `.playlist-section` carries `overflow:hidden` — needed
   * for the vinyl and the spritz, which bleed off its edges — and that clips
   * any descendant that runs past it. Measured before this change: the panel
   * ran 151px past the bottom of the section and those rows were cut off.
   *
   * Bounding it did not solve it either: the section leaves ~109px below the
   * field, less than two rows. Escaping the clipping container is the only fix
   * that holds for the full six results Spotify can return, so the panel is
   * portalled out and positioned against the field's viewport rect.
   */
  const [rect, setRect] = useState<{
    left: number;
    top: number;
    width: number;
    dropUp: boolean;
    maxHeight: number;
  } | null>(null);

  const weddingId = data.weddingId;

  const full = selected.length >= MAX_TRACKS;
  /* French agreement: singular at 0 and 1, plural from 2 up. */
  const plural = selected.length > 1 ? "s" : "";

  const trimmed = query.trim();
  /* No searching once the selection is full or the form has been sent —
     there is nothing left to pick, so the request would be wasted. */
  const isSearching = trimmed.length >= MIN_QUERY && !sent && !full;
  /* Declared here, not next to the JSX: the positioning effect below depends
     on it, and a `const` used before its declaration is a TDZ error. */
  const showPanel = isSearching && searchState !== "idle";

  useEffect(() => {
    if (!isSearching) {
      setResults([]);
      setSearchState("idle");
      return;
    }

    // Cancels the request still in flight when the query moves on, so a slow
    // early response cannot land after a newer one and overwrite it.
    const controller = new AbortController();

    // Debounce: only the last keystroke in a DEBOUNCE_MS window queries.
    const timer = setTimeout(async () => {
      setSearchState("loading");
      try {
        const res = await fetch(
          `/api/spotify/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error(String(res.status));
        const json = (await res.json()) as { results?: SpotifyResult[] };
        setResults(json.results ?? []);
        setSearchState("done");
      } catch (err) {
        // An aborted request is the expected outcome of typing another letter,
        // not a failure: leave the state alone so no error flashes mid-typing.
        if ((err as Error).name === "AbortError") return;
        setResults([]);
        setSearchState("error");
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, isSearching]);

  /**
   * Measures the field and decides which way the panel opens.
   *
   * Prefers below, flips above when the space below the field in the VIEWPORT
   * is too small — the panel is fixed-positioned now, so the viewport is the
   * only constraint that matters; the section's `overflow:hidden` no longer
   * reaches it.
   */
  const place = useCallback(() => {
    const el = fieldRef.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    const GAP = 8;
    /*
     * Four 60px rows, plus the panel's padding and borders on BOTH edges:
     * 240 + (6 × 2) + (2 × 2) = 256.
     *
     * This was 252, which is the same sum with one edge counted once. Four
     * pixels short is enough for `max-height` to bite: the last row was
     * clipped and the gap under it measured 4px against 8px above, so the
     * list looked wrongly padded rather than slightly cut.
     */
    const ROWS = 4;
    const ROW_HEIGHT = 60;
    const PANEL_PADDING = 6;
    const PANEL_BORDER = 2;
    const WANTED =
      ROWS * ROW_HEIGHT + 2 * PANEL_PADDING + 2 * PANEL_BORDER;

    const below = window.innerHeight - r.bottom - GAP - 8;
    const above = r.top - GAP - 8;
    const dropUp = below < Math.min(WANTED, 160) && above > below;
    const maxHeight = Math.max(120, Math.min(WANTED, dropUp ? above : below));

    setRect({
      left: r.left,
      top: dropUp ? r.top - GAP : r.bottom + GAP,
      width: r.width,
      dropUp,
      maxHeight,
    });
  }, []);

  /* Measure before paint so the panel never shows at a stale position. */
  useLayoutEffect(() => {
    if (!showPanel) return;
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [showPanel, place, results.length, searchState]);

  function clearSearch() {
    setQuery("");
    setResults([]);
    setSearchState("idle");
    setActive(-1);
    inputRef.current?.focus();
  }

  /**
   * Choosing a track IS the submission — there is no confirm button any more.
   * A separate "Ajouter à la playlist" step was a second click that could only
   * ever repeat what picking a row already said.
   */
  /**
   * Adds a track to the selection. Picking a row no longer submits: a guest
   * may propose up to MAX_TRACKS titles, so the choice and the sending are two
   * separate steps again.
   */
  function choose(track: SpotifyResult) {
    if (pending) return;

    setResults([]);
    setActive(-1);
    setQuery("");

    if (selected.length >= MAX_TRACKS) return;
    // Spotify can return the same track twice across queries; the dashboard
    // keys statuses by track id, so a duplicate would collide there.
    if (selected.some((t) => t.id === track.id)) return;

    setError(null);
    setSelected((list) => [...list, track]);
    inputRef.current?.focus();
  }

  function remove(id: string) {
    setSelected((list) => list.filter((t) => t.id !== id));
    setError(null);
  }

  /** Sends the 1–3 selected tracks in one submission. */
  async function send() {
    if (pending || !selected.length) return;

    setError(null);

    // Demo: no wedding to attach the suggestions to. Confirm locally, persist
    // nothing. This early return is what keeps the public showcase out of the
    // database — searching is read-only and runs in both modes, but NOTHING
    // below this line may run without a weddingId.
    if (!weddingId) {
      setSent(true);
      return;
    }

    setPending(true);

    const result = await submitPlaylistSuggestions({
      weddingId,
      // The action already accepts an array and bounds it at 20 server-side,
      // so three needs no change there.
      tracks: selected.map((track) => ({
        id: track.id,
        title: track.title,
        artist: track.artist,
        coverUrl: track.coverUrl,
        ...(track.spotifyUrl ? { spotifyUrl: track.spotifyUrl } : {}),
      })),
    });

    setPending(false);

    if (result.ok) setSent(true);
    else setError(result.error);
  }

  /**
   * Keyboard support for the combobox: the arrows move a virtual cursor over
   * the options and Enter takes the active one. Without this the listbox would
   * be mouse-only, which the `role="combobox"` on the input promises it is not.
   */
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // Escape is handled below even with no results — it is what clears the
    // field now that there is no clear button.
    if (!results.length && event.key !== "Escape") return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (event.key === "Enter") {
      // Only intercept Enter when a row is actually highlighted, so the key
      // keeps its default meaning the rest of the time.
      if (active >= 0 && active < results.length) {
        event.preventDefault();
        void choose(results[active]!);
      }
    } else if (event.key === "Escape") {
      // First Escape closes the list, a second clears the field. There is no
      // visible clear affordance any more — a button inside the field was
      // being stretched to full width and repainted by the generated sheet's
      // `.playlist-section button` CTA rule, which is what drew the coloured
      // ellipse across the input. Escape is the standard combobox gesture and
      // adds no element that rule can reach.
      if (results.length) {
        setResults([]);
        setActive(-1);
      } else {
        clearSearch();
      }
    }
  }

  return (
    <section className="playlist-section">
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative, positioned by CSS. */}
      <img
        className="decor decor-spritz-playlist"
        src="/themes/ciao-amore/decor/spritz.webp"
        alt=""
        aria-hidden="true"
        loading="lazy"
      />
      <span className="vinyl" aria-hidden="true" />
      <div>
        <p className="eyebrow">La musique de notre week-end</p>
        <h2>
          Playlist
          <br />
          participative
        </h2>
        {data.copy?.playlistIntro ? <p>{data.copy.playlistIntro}</p> : null}

        {sent ? (
          <p className="success">Grazie ! Votre titre a bien été proposé.</p>
        ) : (
          <div className="ca-form">
            <label htmlFor={`${listId}-input`}>Cherchez un titre</label>

            <div className="ca-search">
              <div className="ca-search-field" ref={fieldRef}>
                <span className="ca-search-icon" aria-hidden="true" />
                <input
                  id={`${listId}-input`}
                  ref={inputRef}
                  name="suggestion"
                  type="text"
                  autoComplete="off"
                  placeholder={
                    full ? "3 titres maximum" : "Un titre, un artiste…"
                  }
                  value={query}
                  disabled={pending || full}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setActive(-1);
                    if (error) setError(null);
                  }}
                  onKeyDown={handleKeyDown}
                  role="combobox"
                  aria-expanded={showPanel}
                  aria-controls={`${listId}-results`}
                  aria-autocomplete="list"
                  aria-activedescendant={
                    active >= 0 ? `${listId}-opt-${active}` : undefined
                  }
                />
              </div>

              {/*
                Portalled onto `document.body`, NOT rendered here: this subtree
                sits inside `.playlist-section`, whose `overflow:hidden` clipped
                the panel (151px of rows cut off, measured). The portal escapes
                that container entirely; `rect` positions it against the field.

                `.theme-ciao-amore` is repeated on the portal root because the
                whole stylesheet is scoped under it — outside the theme subtree,
                none of the `.ca-*` rules would match.
              */}
              {showPanel && rect
                ? createPortal(
                    <div
                      className="theme-ciao-amore ca-results-portal"
                      style={{
                        position: "fixed",
                        left: rect.left,
                        width: rect.width,
                        ...(rect.dropUp
                          ? { bottom: window.innerHeight - rect.top }
                          : { top: rect.top }),
                      }}
                    >
                      <div
                        className="ca-results"
                        id={`${listId}-results`}
                        role="listbox"
                        style={{ maxHeight: rect.maxHeight }}
                      >
                        {searchState === "loading" ? (
                          <p className="ca-results-note">Recherche…</p>
                        ) : searchState === "error" ? (
                          <p className="ca-results-note">
                            Recherche indisponible. Réessayez dans un instant.
                          </p>
                        ) : results.length === 0 ? (
                          <p className="ca-results-note">Aucun titre trouvé.</p>
                        ) : (
                          results.map((track, index) => (
                            <button
                              type="button"
                              key={track.id}
                              id={`${listId}-opt-${index}`}
                              className={
                                index === active
                                  ? "ca-result ca-result-active"
                                  : "ca-result"
                              }
                              role="option"
                              aria-selected={index === active}
                              onMouseEnter={() => setActive(index)}
                              /* `onMouseDown` + preventDefault: a click would
                                 otherwise blur the input first, and the panel
                                 would unmount before the click landed. */
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => void choose(track)}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element -- remote Spotify CDN art, fixed 44px. */}
                              <img
                                src={track.coverUrl}
                                alt=""
                                aria-hidden="true"
                                loading="lazy"
                              />
                              <span className="ca-result-text">
                                <strong>{track.title}</strong>
                                <em>{track.artist}</em>
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>,
                    document.body,
                  )
                : null}
            </div>

            {selected.length > 0 ? (
              <ul className="ca-picked-list">
                {selected.map((track) => (
                  <li key={track.id} className="ca-picked">
                    {/* eslint-disable-next-line @next/next/no-img-element -- remote Spotify CDN art, fixed 44px. */}
                    <img src={track.coverUrl} alt="" aria-hidden="true" loading="lazy" />
                    <span className="ca-result-text">
                      <strong>{track.title}</strong>
                      <em>{track.artist}</em>
                    </span>
                    <button
                      type="button"
                      className="ca-remove"
                      onClick={() => remove(track.id)}
                      disabled={pending}
                      aria-label={`Retirer ${track.title}`}
                    >
                      <span aria-hidden="true">×</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            <p className="ca-status">
              {full
                ? `${MAX_TRACKS} titres maximum — retirez-en un pour en proposer un autre.`
                : selected.length === 0
                  ? `Jusqu'à ${MAX_TRACKS} titres`
                  : `${selected.length} titre${plural} choisi${plural} sur ${MAX_TRACKS}`}
            </p>

            {error ? (
              <p className="ca-error" role="alert">
                {error}
              </p>
            ) : null}

            {/*
              No submit button here, by design. The couple's guests do not send
              a playlist on its own: the tracks they pick ride along with the
              RSVP, and confirming attendance is what commits both. A button
              here would offer a second, competing "send" and let a guest
              believe their tracks were recorded when they had not yet replied.

              `send()` is kept and left unwired for that reason — it holds the
              demo guard and the submission shape the RSVP will call. Wiring the
              two sections together is the remaining work; see the note in the
              header above.
            */}
          </div>
        )}
      </div>
    </section>
  );
}
