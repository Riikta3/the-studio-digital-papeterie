"use client";

import type { DayOfSettings } from "@shared/types/jour-j";
import { useTranslations } from "next-intl";
import { useState } from "react";

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

  const toggle = (key: keyof DayOfSettings) =>
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));

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
              value={settings.uploadsOpenUntil.slice(0, 10)}
              onChange={(e) => {
                const day = e.target.value;
                setSettings((prev) => ({
                  ...prev,
                  // A date input yields "YYYY-MM-DD", which Date parses as UTC midnight.
                  // Uploads stay open *through* the chosen day, so pin the end of it
                  // rather than letting the parse collapse it to the start.
                  uploadsOpenUntil: day ? `${day}T23:59:59.999Z` : prev.uploadsOpenUntil,
                }));
              }}
              className='mt-1 min-h-11 w-full rounded-lg border border-studio-lavande/50 px-3 text-sm text-studio-violet sm:w-56'
            />
          </label>
        </div>
      </div>
    </div>
  );
}
