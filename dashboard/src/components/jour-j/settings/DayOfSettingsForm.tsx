"use client";

import { updateDayOfSettings } from "@/actions/day-of-settings-actions";
import type { DayOfSettings } from "@shared/types/jour-j";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

/**
 * The last instant of `day` (a "YYYY-MM-DD" from a date input), as an ISO
 * timestamp, in the browser's own timezone.
 *
 * This used to be `${day}T23:59:59.999Z`, which pins the end of the day in
 * UTC, not where the couple lives. In Paris in summer (UTC+2) that keeps
 * uploads open until 01:59 the following night; west of Greenwich it closes
 * them hours before the chosen day is over. Guests uploading photos on the
 * evening of the wedding are exactly the people that difference hits.
 *
 * Building the Date from its parts (rather than parsing the string) is what
 * makes it local: `new Date("2027-06-19")` is UTC midnight, while
 * `new Date(2027, 5, 19)` is local midnight.
 */
function endOfLocalDay(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  if (!y || !m || !d) return day;

  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
}

/**
 * The stored timestamp as the "YYYY-MM-DD" the date input expects, read in the
 * browser's timezone so the field shows the day the couple actually picked.
 *
 * `.slice(0, 10)` on the ISO string would show the UTC day, which is the
 * previous one for any evening timestamp east of Greenwich — the field would
 * display a different date from the one just saved.
 */
function localDayOf(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10);

  const pad = (n: number) => String(n).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function Toggle({
  label, hint, checked, onChange,
}: {
  label: string; hint: string; checked: boolean; onChange: () => void;
}) {
  return (
    <label className='flex min-h-14 cursor-pointer items-start justify-between gap-4 border-b border-studio-lavande/30 py-3 last:border-0'>
      <span>
        <span className='block text-sm font-medium text-studio-violet'>{label}</span>
        <span className='mt-0.5 block text-xs text-studio-violet/60'>{hint}</span>
      </span>
      <input
        type='checkbox'
        checked={checked}
        onChange={onChange}
        className='mt-1 h-5 w-5 shrink-0 accent-[#4B3F72]'
      />
    </label>
  );
}

export function DayOfSettingsForm({
  initialSettings,
}: {
  initialSettings: DayOfSettings;
}) {
  const t = useTranslations("DayOfSettings");
  const [settings, setSettings] = useState(initialSettings);

  // Optimistic write on every gesture (spec §3.4) — the patch sent to the
  // server never includes `qrSlug`: it is derived from `sites.slug`, not
  // stored on `day_of_settings`.
  // Every control here is a discrete on/off toggle or a single date pick —
  // never continuous typing — so each save is worth confirming.
  const save = async (
    patch: Partial<Omit<DayOfSettings, "qrSlug">>,
    previous: DayOfSettings,
  ) => {
    const res = await updateDayOfSettings(patch);
    if (!res.success) {
      setSettings(previous);
      toast.error(res.error || t("save_failed"));
      return;
    }
    toast.success(t("settings_saved"));
  };

  const toggle = (key: keyof Omit<DayOfSettings, "qrSlug">) => {
    const previous = settings;
    const nextValue = !previous[key];
    setSettings((prev) => ({ ...prev, [key]: nextValue }));
    void save({ [key]: nextValue }, previous);
  };

  return (
    <div className='min-h-screen bg-studio-creme p-4 md:p-8 lg:p-12'>
      <div className='mx-auto max-w-2xl'>
        <h1 className='font-heading text-h3 text-studio-violet'>{t("title")}</h1>

        <div className='mt-6 rounded-2xl border border-studio-lavande/40 bg-white px-4 shadow-studio-card'>
          <Toggle
            label={t("enabled_label")}
            hint={t("enabled_hint")}
            checked={settings.enabled}
            onChange={() => toggle("enabled")}
          />
          {/* Sharing and browsing are two separate permissions — §21. */}
          <Toggle
            label={t("gallery_visible_label")}
            hint={t("gallery_visible_hint")}
            checked={settings.galleryVisibleToGuests}
            onChange={() => toggle("galleryVisibleToGuests")}
          />
          <Toggle
            label={t("after_wedding_label")}
            hint={t("after_wedding_hint")}
            checked={settings.afterWeddingMode}
            onChange={() => toggle("afterWeddingMode")}
          />

          <label className='flex min-h-14 flex-col justify-center gap-1 border-t border-studio-lavande/30 py-3'>
            <span className='text-sm font-medium text-studio-violet'>
              {t("uploads_until_label")}
            </span>
            <span className='text-xs text-studio-violet/60'>
              {t("uploads_until_hint")}
            </span>
            <input
              type='date'
              value={localDayOf(settings.uploadsOpenUntil)}
              onChange={(e) => {
                const day = e.target.value;
                const previous = settings;
                const uploadsOpenUntil = day
                  ? endOfLocalDay(day)
                  : previous.uploadsOpenUntil;
                setSettings((prev) => ({ ...prev, uploadsOpenUntil }));
                void save({ uploadsOpenUntil }, previous);
              }}
              className='mt-1 min-h-11 w-full rounded-lg border border-studio-lavande/50 px-3 text-sm text-studio-violet sm:w-56'
            />
          </label>
        </div>
      </div>
    </div>
  );
}
