"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { domainPrice, domainYearsFor } from "@/lib/pricing";
import { monthsUntil, weddingDateFrom } from "@/lib/wedding-date";
import { useOrderStore } from "@/stores/use-order-store";

/**
 * The custom domain's years and price for this couple's wedding date
 * (docs/superpowers/specs/2026-10-02-custom-domain-design.md, D1 and D3),
 * written back to the store so the running total includes them.
 *
 * The store holds the month as the label the start page rendered, in this
 * locale, so only a page with `StudioStart.months` can read the date back:
 * the options step and the checkout both call this. The server computes the
 * years again before charging; this is what the couple sees until then.
 */
export function useDomainYears() {
  const localisedMonths = useTranslations("StudioStart").raw("months") as string[];
  const day = useOrderStore((s) => s.weddingInfo.day);
  const month = useOrderStore((s) => s.weddingInfo.month);
  const year = useOrderStore((s) => s.weddingInfo.year);
  const storedYears = useOrderStore((s) => s.domain.years);
  const setDomain = useOrderStore((s) => s.setDomain);
  const hasHydrated = useOrderStore((s) => s._hasHydrated);

  // Read once per visit: the page is not left open across midnight often
  // enough to matter, and the server has the last word anyway.
  const [today] = useState(() => new Date());

  const weddingDate = weddingDateFrom({ day, month, year }, localisedMonths);
  const years = domainYearsFor(weddingDate, today);

  useEffect(() => {
    // Not before hydration: the defaults would be written over the basket.
    if (hasHydrated && storedYears !== years) setDomain({ years });
  }, [hasHydrated, storedYears, years, setDomain]);

  return {
    years,
    price: domainPrice(years),
    /** Null when the date is missing or not in the future. */
    monthsUntil: monthsUntil(weddingDate, today),
    /** For the suggestions' `-2027` variant. */
    weddingYear: weddingDate?.slice(0, 4) ?? "",
  };
}
