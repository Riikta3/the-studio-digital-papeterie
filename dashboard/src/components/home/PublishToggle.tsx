"use client";

import { setSitePublished } from "@/actions/site-publication-actions";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

/**
 * The invitation's on-air switch.
 *
 * Writes `sites.status`, which is what decides whether the invitation answers
 * at its public slug. Deliberately not `day_of_settings.enabled`: that governs
 * the Jour J guest page, and the two shared one column until migration
 * 20260912110000 — so switching the Jour J module off after the wedding used
 * to take the couple's invitation down with it.
 *
 * A client island inside two Server Components (the home card and the settings
 * section), so both screens show the same control backed by the same action.
 */
export function PublishToggle({
  initialPublished,
  /** Rendered under the switch on screens that have no surrounding copy. */
  withHint = false,
}: {
  initialPublished: boolean;
  withHint?: boolean;
}) {
  const t = useTranslations("SitePublication");
  const [published, setPublished] = useState(initialPublished);
  const [pending, setPending] = useState(false);

  // Optimistic, like every other toggle in the dashboard: flip now, put it
  // back if the server refuses. This one changes who can reach the page, so a
  // failure has to be visible rather than swallowed.
  const toggle = async () => {
    if (pending) return;
    const previous = published;
    const next = !previous;

    setPublished(next);
    setPending(true);
    const res = await setSitePublished(next);
    setPending(false);

    if (!res.success) {
      setPublished(previous);
      toast.error(res.error || t("save_failed"));
      return;
    }

    toast.success(next ? t("now_online") : t("now_offline"));
  };

  return (
    <label className='flex min-h-14 cursor-pointer items-start justify-between gap-4'>
      <span>
        <span className='block text-sm font-medium text-studio-violet'>
          {t("toggle_label")}
        </span>
        <span className='mt-0.5 block text-xs text-studio-violet/60'>
          {withHint
            ? published
              ? t("hint_online")
              : t("hint_offline")
            : published
              ? t("status_online")
              : t("status_offline")}
        </span>
      </span>
      <input
        type='checkbox'
        checked={published}
        onChange={toggle}
        disabled={pending}
        aria-label={t("toggle_label")}
        className='mt-1 h-5 w-5 shrink-0 accent-[#4B3F72] disabled:opacity-50'
      />
    </label>
  );
}
