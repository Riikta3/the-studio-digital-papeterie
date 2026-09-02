"use client";

import { searchSeatedGuests } from "@shared/lib/seating";
import { JOUR_J_MOCK } from "@shared/data/jour-j-mock";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

export function TableFinder() {
  const [query, setQuery] = useState("");
  const { tables, guests } = JOUR_J_MOCK;

  const matches = useMemo(
    () => searchSeatedGuests(tables, guests, query),
    [tables, guests, query],
  );

  const tooShort = query.trim().length > 0 && query.trim().length < 2;

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
          placeholder='Marie…'
          className='min-h-14 w-full rounded-xl border border-studio-lavande/50 bg-white pl-10 pr-4 text-base text-studio-violet'
        />
      </label>

      {tooShort && (
        <p className='mt-3 text-xs text-studio-violet/50'>
          Encore une lettre…
        </p>
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
              <p className='mt-1 text-xs text-studio-violet/50'>{m.seatsLabel}</p>
            )}
          </li>
        ))}
      </ul>

      {query.trim().length >= 2 && matches.length === 0 && (
        <p className='mt-4 text-center text-sm text-studio-violet/60'>
          Aucun résultat. Vérifiez l&apos;orthographe ou demandez aux mariés.
        </p>
      )}
    </div>
  );
}
