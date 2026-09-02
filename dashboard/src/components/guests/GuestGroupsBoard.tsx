"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  GuestGroup,
  Household,
  InvitationGuest,
} from "@shared/types/invitation";
import { GUEST_GROUPS } from "@shared/types/invitation";
import { cn } from "@shared/lib/utils";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

type Filter = "all" | GuestGroup;

export function GuestGroupsBoard({
  initialGuests,
  households,
}: {
  initialGuests: InvitationGuest[];
  households: Household[];
}) {
  const t = useTranslations("GuestGroups");
  const [guests, setGuests] = useState(initialGuests);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const householdsById = useMemo(
    () => new Map(households.map((h) => [h.id, h])),
    [households],
  );

  const counts = useMemo(() => {
    const base: Record<Filter, number> = {
      all: guests.length,
      family: 0,
      friends: 0,
      colleagues: 0,
      other: 0,
    };
    for (const guest of guests) base[guest.group] += 1;
    return base;
  }, [guests]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return guests.filter((guest) => {
      if (filter !== "all" && guest.group !== filter) return false;
      if (!q) return true;
      const household = householdsById.get(guest.householdId);
      const haystack = `${guest.firstName} ${guest.lastName} ${household?.name ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [guests, filter, query, householdsById]);

  const changeGroup = (guestId: string, group: GuestGroup) => {
    setGuests((prev) =>
      prev.map((g) => (g.id === guestId ? { ...g, group } : g)),
    );
  };

  return (
    <div className='min-h-screen bg-studio-creme p-4 md:p-8 lg:p-12'>
      <div className='mx-auto max-w-5xl'>
        <div>
          <h1 className='font-heading text-h3 text-studio-violet'>{t("title")}</h1>
          <p className='mt-1 text-sm text-studio-violet/70'>
            {t("count", { count: guests.length })}
          </p>
        </div>

        {/* Search */}
        <div className='relative mt-4'>
          <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-studio-violet/40' />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search_placeholder")}
            className='min-h-11 w-full rounded-lg border border-studio-lavande/50 bg-white pl-10 pr-3 text-sm text-studio-violet placeholder:text-studio-violet/40'
          />
        </div>

        {/* Group filter chips, doubling as the per-group count */}
        <div className='mt-4 flex gap-2 overflow-x-auto pb-1'>
          {(["all", ...GUEST_GROUPS] as const).map((key) => (
            <button
              key={key}
              type='button'
              onClick={() => setFilter(key)}
              className={cn(
                "min-h-11 shrink-0 rounded-full px-4 text-sm transition-colors",
                filter === key
                  ? "bg-studio-violet text-white"
                  : "bg-white text-studio-violet",
              )}
            >
              {t(`groups.${key}`)} ({counts[key]})
            </button>
          ))}
        </div>

        {/* Guest list — cards on mobile, table from md: up */}
        <div className='mt-4 space-y-2 md:hidden'>
          {visible.map((guest) => (
            <GuestGroupCard
              key={guest.id}
              guest={guest}
              household={householdsById.get(guest.householdId)}
              onChangeGroup={(group) => changeGroup(guest.id, group)}
            />
          ))}
          {visible.length === 0 && (
            <p className='rounded-xl border border-studio-lavande/40 bg-white p-6 text-center text-sm text-studio-violet/60'>
              {t("no_results")}
            </p>
          )}
        </div>

        <div className='mt-4 hidden overflow-x-auto rounded-xl border border-studio-lavande/40 bg-white md:block'>
          <table className='w-full text-left text-sm'>
            <thead>
              <tr className='border-b border-studio-lavande/30 text-xs uppercase tracking-wide text-studio-violet/50'>
                <th className='px-4 py-3 font-medium'>{t("table.guest")}</th>
                <th className='px-4 py-3 font-medium'>{t("table.household")}</th>
                <th className='px-4 py-3 font-medium'>{t("table.group")}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((guest) => (
                <tr
                  key={guest.id}
                  className='border-b border-studio-lavande/20 last:border-0'
                >
                  <td className='px-4 py-3 text-studio-violet'>
                    {guest.firstName} {guest.lastName}
                    {guest.isChild && (
                      <span className='ml-2 rounded-full bg-studio-beurre px-2 py-0.5 text-xs text-studio-violet/70'>
                        {t("child_badge")}
                      </span>
                    )}
                  </td>
                  <td className='px-4 py-3 text-studio-violet/70'>
                    {householdsById.get(guest.householdId)?.name ?? "—"}
                  </td>
                  <td className='px-4 py-3'>
                    <GroupSelect
                      value={guest.group}
                      onChange={(group) => changeGroup(guest.id, group)}
                      label={t}
                    />
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className='px-4 py-8 text-center text-studio-violet/60'
                  >
                    {t("no_results")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function GroupSelect({
  value,
  onChange,
  label,
}: {
  value: GuestGroup;
  onChange: (group: GuestGroup) => void;
  label: (key: string) => string;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as GuestGroup)}>
      <SelectTrigger className='h-11 min-h-11 w-full min-w-[9rem] bg-studio-creme text-studio-violet md:w-auto'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {GUEST_GROUPS.map((group) => (
          <SelectItem key={group} value={group}>
            {label(`groups.${group}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function GuestGroupCard({
  guest,
  household,
  onChangeGroup,
}: {
  guest: InvitationGuest;
  household: Household | undefined;
  onChangeGroup: (group: GuestGroup) => void;
}) {
  const t = useTranslations("GuestGroups");

  return (
    <div className='rounded-xl border border-studio-lavande/40 bg-white p-4'>
      <div className='flex items-center justify-between gap-2'>
        <div className='min-w-0'>
          <p className='truncate font-medium text-studio-violet'>
            {guest.firstName} {guest.lastName}
            {guest.isChild && (
              <span className='ml-2 rounded-full bg-studio-beurre px-2 py-0.5 text-xs text-studio-violet/70'>
                {t("child_badge")}
              </span>
            )}
          </p>
          <p className='mt-0.5 truncate text-xs text-studio-violet/60'>
            {household?.name ?? "—"}
          </p>
        </div>
      </div>
      <div className='mt-3'>
        <GroupSelect value={guest.group} onChange={onChangeGroup} label={t} />
      </div>
    </div>
  );
}
