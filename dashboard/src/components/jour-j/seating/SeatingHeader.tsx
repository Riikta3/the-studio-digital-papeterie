"use client";

import type { SeatingSummary } from "@shared/lib/seating";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = {
  summary: SeatingSummary;
  query: string;
  onQueryChange: (value: string) => void;
};

export function SeatingHeader({ summary, query, onQueryChange }: Props) {
  const t = useTranslations("Seating");

  return (
    <header className='sticky top-0 z-10 border-b border-studio-lavande/30 bg-white/95 px-4 py-4 backdrop-blur md:px-8'>
      <h1 className='font-heading text-h3 text-studio-violet'>{t("title")}</h1>

      <div className='mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <dl className='flex flex-wrap gap-x-5 gap-y-1 text-sm'>
          <div className='flex gap-1.5'>
            <dt className='text-studio-violet/60'>{t("seated")}</dt>
            <dd className='font-medium text-studio-violet'>{summary.seated}</dd>
          </div>
          <div className='flex gap-1.5'>
            <dt className='text-studio-violet/60'>{t("remaining")}</dt>
            <dd className='font-medium text-studio-violet'>{summary.unseated}</dd>
          </div>
          <div className='flex gap-1.5'>
            <dt className='text-studio-violet/60'>{t("capacity")}</dt>
            <dd className='font-medium text-studio-violet'>
              {summary.totalCapacity}
            </dd>
          </div>
        </dl>

        <label className='relative md:w-72'>
          <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-studio-violet/40' />
          <input
            type='search'
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t("search_placeholder")}
            className='min-h-11 w-full rounded-lg border border-studio-lavande/50 bg-white pl-9 pr-3 text-sm text-studio-violet placeholder:text-studio-violet/40 focus:border-studio-violet focus:outline-none'
          />
        </label>
      </div>
    </header>
  );
}
