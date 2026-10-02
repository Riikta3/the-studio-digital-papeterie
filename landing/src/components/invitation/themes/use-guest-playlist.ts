"use client";

import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";

import { submitPlaylistSuggestions } from "@/actions/invitation-submissions";

import {
  DEBOUNCE_MS,
  MAX_TRACKS,
  type SpotifyResult,
  addTrack,
  isSearchable,
  removeTrack,
  toPlaylistSubmission,
} from "./guest-playlist";
import type { InvitationData } from "./types";

export type SearchState = "idle" | "loading" | "done" | "error";

/**
 * Search, selection and submission of a theme's participative playlist.
 *
 * Two modes, decided by `data.weddingId`: with an id the picks are persisted
 * (`playlist_suggestions`); without one — the showcase, the editor's preview —
 * `send()` confirms locally and writes nothing. Searching is read-only
 * (`/api/spotify/search`), so it runs in both modes on purpose: a visitor has
 * to be able to try the field for the demo to sell anything.
 *
 * The theme draws the combobox. This hook owns the data and the keyboard; it
 * does NOT position a floating panel (ciao-amore portals one out of an
 * `overflow:hidden` section) — a theme that needs that measures its own field.
 *
 * Wire `inputRef` and `listId` to the input (`aria-controls`), call
 * `handleKeyDown` from its `onKeyDown`, render `results` when `showPanel`,
 * call `choose(result)` on a pick and `send()` from the submit button.
 */
export function useGuestPlaylist(data: InvitationData) {
  const weddingId = data.weddingId;
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SpotifyResult[]>([]);
  const [searchState, setSearchState] = useState<SearchState>("idle");
  /** Index of the arrow-key highlighted option; -1 when none. */
  const [active, setActive] = useState(-1);
  const [selected, setSelected] = useState<readonly SpotifyResult[]>([]);

  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = query.trim();
  const full = selected.length >= MAX_TRACKS;
  const isSearching = isSearchable(query, { sent, full });
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
        const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(String(response.status));
        const json = (await response.json()) as { results?: SpotifyResult[] };
        setResults(json.results ?? []);
        setSearchState("done");
      } catch (caught) {
        // An aborted request is the expected outcome of typing another letter,
        // not a failure: leave the state alone so no error flashes mid-typing.
        if ((caught as Error).name === "AbortError") return;
        setResults([]);
        setSearchState("error");
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, isSearching]);

  function clearSearch() {
    setQuery("");
    setResults([]);
    setSearchState("idle");
    setActive(-1);
    inputRef.current?.focus();
  }

  /** Adds a pick. Choosing does not submit: sending is a separate step. */
  function choose(track: SpotifyResult) {
    if (pending) return;
    setResults([]);
    setActive(-1);
    setQuery("");

    const next = addTrack(selected, track);
    if (next === selected) return;
    setError(null);
    setSelected(next);
    inputRef.current?.focus();
  }

  function remove(id: string) {
    setSelected((list) => removeTrack(list, id));
    setError(null);
  }

  /** Sends the 1–3 selected tracks in one submission. */
  async function send() {
    if (pending || selected.length === 0) return;
    setError(null);

    // Demo: no wedding to attach the suggestions to. Confirm locally, persist
    // nothing. This early return is what keeps the showcase out of the
    // database — NOTHING below this line may run without a weddingId.
    if (!weddingId) {
      setSent(true);
      return;
    }

    setPending(true);
    const result = await submitPlaylistSuggestions(toPlaylistSubmission(weddingId, selected));
    setPending(false);

    if (result.ok) setSent(true);
    else setError(result.error);
  }

  /**
   * Keyboard support for the combobox: the arrows move a virtual cursor over
   * the options and Enter takes the active one. Escape closes the list, then
   * clears the field. Without this the listbox would be mouse-only, which
   * `role="combobox"` on the input promises it is not.
   */
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (results.length === 0 && event.key !== "Escape") return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index <= 0 ? results.length - 1 : index - 1));
    } else if (event.key === "Enter") {
      // Only intercept Enter when a row is highlighted, so the key keeps its
      // default meaning the rest of the time.
      if (active >= 0 && active < results.length) {
        event.preventDefault();
        choose(results[active]!);
      }
    } else if (event.key === "Escape") {
      if (results.length > 0) {
        setResults([]);
        setActive(-1);
      } else {
        clearSearch();
      }
    }
  }

  return {
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
    isSearching,
    showPanel,
    inputRef,
    listId,
    choose,
    remove,
    send,
    handleKeyDown,
    clearSearch,
  };
}
