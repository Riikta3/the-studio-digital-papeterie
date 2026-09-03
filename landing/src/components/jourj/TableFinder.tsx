"use client";

import { searchMyTable, type TableMatch } from "@/actions/guest-page-actions";
import { Loader2, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * "Ma table" — the search a guest runs after scanning the QR code.
 *
 * This component holds NO guest data. It used to import the roster mock and
 * run the search in the browser, which shipped all 140 guests to anyone who
 * scanned the printed code. Every keystroke now goes to `searchMyTable`, a
 * server action that calls the `search_guest_table` security-definer RPC. The
 * browser only ever receives the at most five rows that matched what was
 * typed, with four columns each — no email, no phone, no status, no id.
 *
 * The two-character minimum and the five-row cap are BOTH enforced by the
 * RPC. The client-side checks below exist for feedback ("encore une lettre…")
 * and to save a round trip; they validate nothing, and a hand-crafted call
 * bypassing them would be refused by the database just the same.
 */

/** Long enough that typing a name is one request, short enough to feel live. */
const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

export function TableFinder({ slug }: { slug: string }) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<TableMatch[]>([]);
  const [searching, setSearching] = useState(false);
  /** False until a search has actually come back, so the empty state waits. */
  const [answered, setAnswered] = useState(false);

  // Requests can resolve out of order (a short query is often slower to type
  // than to answer). Only the newest one is allowed to write to state.
  const latestRequest = useRef(0);

  const trimmed = query.trim();
  const tooShort = trimmed.length > 0 && trimmed.length < MIN_QUERY_LENGTH;

  useEffect(() => {
    if (trimmed.length < MIN_QUERY_LENGTH) {
      latestRequest.current += 1;
      setMatches([]);
      setSearching(false);
      setAnswered(false);
      return;
    }

    setSearching(true);
    const requestId = ++latestRequest.current;

    const timer = setTimeout(async () => {
      const results = await searchMyTable(slug, trimmed);
      if (latestRequest.current !== requestId) return;
      setMatches(results);
      setSearching(false);
      setAnswered(true);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [slug, trimmed]);

  return (
    <div>
      <h1 className='font-heading text-2xl text-studio-violet'>Ma table</h1>
      <p className='mt-2 text-sm text-studio-violet/70'>
        Entrez votre prénom ou votre nom.
      </p>

      <label className='relative mt-5 block'>
        <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-studio-violet/40' />
        <input
          type='search'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete='off'
          maxLength={80}
          placeholder='Marie…'
          className='min-h-14 w-full rounded-xl border border-studio-lavande/50 bg-white pl-10 pr-11 text-base text-studio-violet'
        />
        {searching && (
          <Loader2 className='absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-studio-violet/40' />
        )}
      </label>

      {tooShort && (
        <p className='mt-3 text-xs text-studio-violet/50'>Encore une lettre…</p>
      )}

      <ul className='mt-4 space-y-2'>
        {matches.map((m) => (
          <li
            key={`${m.firstName}-${m.lastName}-${m.tableName}`}
            className='rounded-xl border border-studio-lavande/40 bg-white p-5 text-center'
          >
            <p className='text-sm text-studio-violet/70'>
              {m.firstName}, votre table est…
            </p>
            <p className='mt-2 font-heading text-2xl uppercase tracking-wide text-studio-violet'>
              {m.tableName}
            </p>
            {m.seatsLabel && (
              <p className='mt-1 text-xs text-studio-violet/50'>
                {m.seatsLabel}
              </p>
            )}
          </li>
        ))}
      </ul>

      {answered && !searching && matches.length === 0 && (
        <p className='mt-4 text-center text-sm text-studio-violet/60'>
          Aucun résultat. Vérifiez l&apos;orthographe ou demandez aux mariés.
        </p>
      )}
    </div>
  );
}
