"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  DietaryFlag,
  Household,
  InvitationGuest,
  MealChoice,
} from "@shared/types/invitation";
import { DIETARY_FLAGS, MEAL_CHOICES } from "@shared/types/invitation";
import { cn } from "@shared/lib/utils";
import { AlertTriangle, Info, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

type Filter = "all" | MealChoice;

export function GuestMealsBoard({
  initialGuests,
  households,
}: {
  initialGuests: InvitationGuest[];
  households: Household[];
}) {
  const t = useTranslations("GuestMeals");
  const [guests, setGuests] = useState(initialGuests);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const householdsById = useMemo(
    () => new Map(households.map((h) => [h.id, h])),
    [households],
  );

  const confirmed = useMemo(
    () => guests.filter((g) => g.status === "confirmed"),
    [guests],
  );

  const mealCounts = useMemo(() => {
    const base: Record<MealChoice, number> = {
      standard: 0,
      vegetarian: 0,
      vegan: 0,
      child: 0,
    };
    for (const guest of confirmed) base[guest.meal] += 1;
    return base;
  }, [confirmed]);

  const dietaryCounts = useMemo(() => {
    const base = Object.fromEntries(
      DIETARY_FLAGS.map((f) => [f, 0]),
    ) as Record<DietaryFlag, number>;
    for (const guest of confirmed) {
      for (const flag of guest.dietaryFlags) base[flag] += 1;
    }
    return base;
  }, [confirmed]);

  const allergyCount = useMemo(
    () => confirmed.filter((g) => g.allergies?.trim()).length,
    [confirmed],
  );

  const filterCounts = useMemo(() => {
    const base: Record<Filter, number> = {
      all: guests.length,
      standard: 0,
      vegetarian: 0,
      vegan: 0,
      child: 0,
    };
    for (const guest of guests) base[guest.meal] += 1;
    return base;
  }, [guests]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return guests.filter((guest) => {
      if (filter !== "all" && guest.meal !== filter) return false;
      if (!q) return true;
      const household = householdsById.get(guest.householdId);
      const haystack =
        `${guest.firstName} ${guest.lastName} ${household?.name ?? ""} ${guest.allergies ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [guests, filter, query, householdsById]);

  const changeMeal = (guestId: string, meal: MealChoice) => {
    setGuests((prev) =>
      prev.map((g) => (g.id === guestId ? { ...g, meal } : g)),
    );
  };

  const toggleFlag = (guestId: string, flag: DietaryFlag) => {
    setGuests((prev) =>
      prev.map((g) => {
        if (g.id !== guestId) return g;
        const has = g.dietaryFlags.includes(flag);
        return {
          ...g,
          dietaryFlags: has
            ? g.dietaryFlags.filter((f) => f !== flag)
            : [...g.dietaryFlags, flag],
        };
      }),
    );
  };

  const changeAllergies = (guestId: string, allergies: string) => {
    setGuests((prev) =>
      prev.map((g) => (g.id === guestId ? { ...g, allergies } : g)),
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

        {/* Headline totals — confirmed guests only, and said so explicitly */}
        <div className='mt-4 rounded-xl border border-studio-lavande/40 bg-white p-4'>
          <div className='flex items-start gap-2 text-xs text-studio-violet/70'>
            <Info className='mt-0.5 h-4 w-4 shrink-0 text-studio-violet/50' />
            <p>{t("confirmed_only_notice", { count: confirmed.length })}</p>
          </div>

          <div className='mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4'>
            {MEAL_CHOICES.map((meal) => (
              <div
                key={meal}
                className='rounded-lg bg-studio-creme px-3 py-3 text-center'
              >
                <p className='font-heading text-xl text-studio-violet'>
                  {mealCounts[meal]}
                </p>
                <p className='mt-0.5 text-xs text-studio-violet/60'>
                  {t(`meals.${meal}`)}
                </p>
              </div>
            ))}
          </div>

          <div className='mt-4'>
            <p className='text-xs font-medium uppercase tracking-wide text-studio-violet/50'>
              {t("dietary_totals_title")}
            </p>
            <div className='mt-2 flex flex-wrap gap-2'>
              {DIETARY_FLAGS.map((flag) => (
                <span
                  key={flag}
                  className='rounded-full bg-studio-lavande/20 px-3 py-1.5 text-xs text-studio-violet'
                >
                  {t(`dietary.${flag}`)} ({dietaryCounts[flag]})
                </span>
              ))}
            </div>
          </div>

          {allergyCount > 0 && (
            <div className='mt-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700'>
              <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0' />
              <p>{t("allergy_notice", { count: allergyCount })}</p>
            </div>
          )}
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

        {/* Meal filter chips */}
        <div className='mt-4 flex gap-2 overflow-x-auto pb-1'>
          {(["all", ...MEAL_CHOICES] as const).map((key) => (
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
              {t(`meals.${key}`)} ({filterCounts[key]})
            </button>
          ))}
        </div>

        {/* Guest list — cards on mobile, table from md: up */}
        <div className='mt-4 space-y-3 md:hidden'>
          {visible.map((guest) => (
            <GuestMealCard
              key={guest.id}
              guest={guest}
              household={householdsById.get(guest.householdId)}
              onChangeMeal={(meal) => changeMeal(guest.id, meal)}
              onToggleFlag={(flag) => toggleFlag(guest.id, flag)}
              onChangeAllergies={(v) => changeAllergies(guest.id, v)}
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
                <th className='px-4 py-3 font-medium'>{t("table.meal")}</th>
                <th className='px-4 py-3 font-medium'>{t("table.dietary")}</th>
                <th className='px-4 py-3 font-medium'>{t("table.allergies")}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((guest) => (
                <tr
                  key={guest.id}
                  className='border-b border-studio-lavande/20 align-top last:border-0'
                >
                  <td className='px-4 py-3 text-studio-violet'>
                    {guest.firstName} {guest.lastName}
                    <p className='mt-0.5 text-xs text-studio-violet/50'>
                      {householdsById.get(guest.householdId)?.name ?? "—"}
                    </p>
                  </td>
                  <td className='px-4 py-3'>
                    <MealSelect
                      value={guest.meal}
                      onChange={(meal) => changeMeal(guest.id, meal)}
                      label={t}
                    />
                  </td>
                  <td className='px-4 py-3'>
                    <DietaryFlagPicker
                      selected={guest.dietaryFlags}
                      onToggle={(flag) => toggleFlag(guest.id, flag)}
                      label={t}
                    />
                  </td>
                  <td className='px-4 py-3'>
                    <AllergyInput
                      value={guest.allergies ?? ""}
                      onChange={(v) => changeAllergies(guest.id, v)}
                      placeholder={t("allergies_placeholder")}
                    />
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
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

function MealSelect({
  value,
  onChange,
  label,
}: {
  value: MealChoice;
  onChange: (meal: MealChoice) => void;
  label: (key: string) => string;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as MealChoice)}>
      <SelectTrigger className='h-11 min-h-11 w-full min-w-[9rem] bg-studio-creme text-studio-violet md:w-auto'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {MEAL_CHOICES.map((meal) => (
          <SelectItem key={meal} value={meal}>
            {label(`meals.${meal}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function DietaryFlagPicker({
  selected,
  onToggle,
  label,
}: {
  selected: DietaryFlag[];
  onToggle: (flag: DietaryFlag) => void;
  label: (key: string) => string;
}) {
  return (
    <div className='flex flex-wrap gap-1.5'>
      {DIETARY_FLAGS.map((flag) => {
        const active = selected.includes(flag);
        return (
          <button
            key={flag}
            type='button'
            onClick={() => onToggle(flag)}
            className={cn(
              "min-h-8 rounded-full px-2.5 text-xs transition-colors",
              active
                ? "bg-studio-violet text-white"
                : "bg-studio-creme text-studio-violet/70",
            )}
          >
            {label(`dietary.${flag}`)}
          </button>
        );
      })}
    </div>
  );
}

function AllergyInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className='flex min-w-[10rem] items-start gap-1.5'>
      {value.trim() && (
        <AlertTriangle className='mt-2.5 h-3.5 w-3.5 shrink-0 text-red-500' />
      )}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "min-h-11 w-full rounded-lg border px-3 text-sm text-studio-violet placeholder:text-studio-violet/40",
          value.trim()
            ? "border-red-300 bg-red-50"
            : "border-studio-lavande/50 bg-white",
        )}
      />
    </div>
  );
}

function GuestMealCard({
  guest,
  household,
  onChangeMeal,
  onToggleFlag,
  onChangeAllergies,
}: {
  guest: InvitationGuest;
  household: Household | undefined;
  onChangeMeal: (meal: MealChoice) => void;
  onToggleFlag: (flag: DietaryFlag) => void;
  onChangeAllergies: (value: string) => void;
}) {
  const t = useTranslations("GuestMeals");

  return (
    <div className='rounded-xl border border-studio-lavande/40 bg-white p-4'>
      <div>
        <p className='truncate font-medium text-studio-violet'>
          {guest.firstName} {guest.lastName}
        </p>
        <p className='mt-0.5 truncate text-xs text-studio-violet/60'>
          {household?.name ?? "—"}
        </p>
      </div>

      <div className='mt-3'>
        <MealSelect value={guest.meal} onChange={onChangeMeal} label={t} />
      </div>

      <div className='mt-3'>
        <p className='text-xs font-medium text-studio-violet/50'>
          {t("table.dietary")}
        </p>
        <div className='mt-1.5'>
          <DietaryFlagPicker
            selected={guest.dietaryFlags}
            onToggle={onToggleFlag}
            label={t}
          />
        </div>
      </div>

      <div className='mt-3'>
        <p className='text-xs font-medium text-studio-violet/50'>
          {t("table.allergies")}
        </p>
        <div className='mt-1.5'>
          <AllergyInput
            value={guest.allergies ?? ""}
            onChange={onChangeAllergies}
            placeholder={t("allergies_placeholder")}
          />
        </div>
      </div>
    </div>
  );
}
