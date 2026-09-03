"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assignHousehold, updateGuestGroup } from "@/actions/guest-groups-actions";
import type { GroupsGuest, GroupsHousehold } from "@/lib/db/projections";
import type { GuestGroup } from "@shared/types/invitation";
import { GUEST_GROUPS } from "@shared/types/invitation";
import { cn } from "@shared/lib/utils";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type Filter = "all" | GuestGroup;

export function GuestGroupsBoard({
  initialGuests,
  households,
}: {
  initialGuests: GroupsGuest[];
  households: GroupsHousehold[];
}) {
  const t = useTranslations("GuestGroups");
  const [guests, setGuests] = useState(initialGuests);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  /**
   * Who is in each household, as a short "Clara, Léa" line.
   *
   * Household names are not unique — the same "Famille Lefèvre" can legitimately
   * appear a dozen times, and a picker showing thirteen identical rows cannot be
   * used. The members are what actually tell them apart. Computed here from the
   * guests already in props: no extra query, and nothing new crosses to the
   * client.
   */
  const membersByHousehold = useMemo(() => {
    const map = new Map<string, string>();
    const buckets = new Map<string, string[]>();
    for (const g of guests) {
      const list = buckets.get(g.householdId);
      if (list) list.push(g.firstName);
      else buckets.set(g.householdId, [g.firstName]);
    }
    for (const [id, names] of buckets) {
      map.set(
        id,
        names.length > 3
          ? `${names.slice(0, 3).join(", ")}…`
          : names.join(", "),
      );
    }
    return map;
  }, [guests]);

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

  // Both selects below are a one-shot deliberate choice (not a text field),
  // so each gets its own confirmation.
  const changeGroup = async (guestId: string, group: GuestGroup) => {
    const previous = guests;
    setGuests((prev) =>
      prev.map((g) => (g.id === guestId ? { ...g, group } : g)),
    );
    const res = await updateGuestGroup(guestId, group);
    if (!res.success) {
      setGuests(previous);
      toast.error(res.error);
      return;
    }
    toast.success(t("group_updated"));
  };

  const changeHousehold = async (guestId: string, householdId: string) => {
    const previous = guests;
    setGuests((prev) =>
      prev.map((g) => (g.id === guestId ? { ...g, householdId } : g)),
    );
    const res = await assignHousehold(guestId, householdId);
    if (!res.success) {
      setGuests(previous);
      toast.error(res.error);
      return;
    }
    toast.success(t("household_updated"));
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
                  <td className='px-4 py-3'>
                    <HouseholdSelect
                      value={guest.householdId}
                      households={households}
                      membersById={membersByHousehold}
                      onChange={(id) => changeHousehold(guest.id, id)}
                    />
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

/**
 * Moves a guest to another household. Households group people who receive one
 * invitation and answer together, so a guest sitting in the wrong one gets the
 * wrong invitation — this is the control that fixes it.
 *
 * Same shape as `GroupSelect` below rather than a dialog: the couple is
 * scanning a list and correcting as they read, and a modal per row would make
 * that unbearable.
 */
function HouseholdSelect({
  value,
  households,
  membersById,
  onChange,
}: {
  value: string;
  households: GroupsHousehold[];
  membersById: Map<string, string>;
  onChange: (householdId: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className='h-11 min-h-11 w-full min-w-[9rem] bg-studio-creme text-left text-studio-violet md:w-auto'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {households.map((household) => {
          const members = membersById.get(household.id);
          return (
            <SelectItem key={household.id} value={household.id}>
              {household.name}
              {members && (
                <span className='ml-2 text-xs text-studio-violet/50'>
                  {members}
                </span>
              )}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
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
  guest: GroupsGuest;
  household: GroupsHousehold | undefined;
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
