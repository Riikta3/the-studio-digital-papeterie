"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import {
  type InvitationCopy,
  saveInvitationCopy,
} from "@/actions/invitation-copy-actions";
import { uploadCouplePhoto } from "@/actions/venue-actions";
import { PhotoPicker } from "./PhotoPicker";

const inputClass =
  "min-h-11 w-full rounded-lg border border-studio-lavande/50 bg-white px-3 text-sm text-studio-violet";

const textareaClass =
  "w-full rounded-lg border border-studio-lavande/50 bg-white p-3 text-sm leading-relaxed text-studio-violet";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className='flex flex-col gap-1 border-b border-studio-lavande/30 py-3 last:border-0'>
      <span className='text-sm font-medium text-studio-violet'>{label}</span>
      {children}
      {hint ? (
        <span className='text-xs text-studio-violet/60'>{hint}</span>
      ) : null}
    </label>
  );
}

/**
 * The couple's own words, and their portrait.
 *
 * Saved on an explicit button rather than per-keystroke like the venue form:
 * these are sentences written in one go, and a debounced save would publish
 * half a sentence to a live invitation while it is being typed.
 */
export function NosMotsForm({ initial }: { initial: InvitationCopy }) {
  const t = useTranslations("InvitationCopy");
  const [copy, setCopy] = useState(initial);
  const [saving, setSaving] = useState(false);

  const set = (patch: Partial<InvitationCopy>) =>
    setCopy((prev) => ({ ...prev, ...patch }));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const res = await saveInvitationCopy(copy);
    setSaving(false);
    if (res.success) toast.success(t("saved"));
    else toast.error(res.error || t("save_failed"));
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <section className='rounded-2xl border border-studio-lavande/40 bg-white px-4 shadow-studio-card'>
        <Field label={t("fields.hero_kicker")} hint={t("hints.hero_kicker")}>
          <input
            className={inputClass}
            value={copy.heroKicker}
            onChange={(e) => set({ heroKicker: e.target.value })}
            placeholder={t("placeholders.hero_kicker")}
          />
        </Field>

        <Field label={t("fields.announcement")} hint={t("hints.announcement")}>
          <textarea
            className={textareaClass}
            rows={2}
            value={copy.announcement}
            onChange={(e) => set({ announcement: e.target.value })}
            placeholder={t("placeholders.announcement")}
          />
        </Field>

        <Field label={t("fields.closing_words")} hint={t("hints.closing_words")}>
          <textarea
            className={textareaClass}
            rows={3}
            value={copy.closingWords}
            onChange={(e) => set({ closingWords: e.target.value })}
            placeholder={t("placeholders.closing_words")}
          />
        </Field>
      </section>

      <section className='rounded-2xl border border-studio-lavande/40 bg-white p-4 shadow-studio-card'>
        <span className='text-sm font-medium text-studio-violet'>
          {t("fields.portrait")}
        </span>
        <PhotoPicker
          value={copy.couplePhotoUrl || undefined}
          onChange={(couplePhotoUrl) => set({ couplePhotoUrl: couplePhotoUrl ?? "" })}
          onUpload={async (file) => {
            const formData = new FormData();
            formData.set("file", file);
            return uploadCouplePhoto(formData);
          }}
          aspect='square'
          // Capped: a square picker at the form's full width is a portrait
          // the height of the screen, which dwarfs the fields above it.
          className='mt-1.5 max-w-xs'
        />
        {/* Said plainly, because it is not obvious from the screen: only some
            themes frame a portrait, and a couple who uploads one on a theme
            that does not would otherwise think the upload failed. */}
        <p className='mt-2 text-xs text-studio-violet/60'>{t("hints.portrait")}</p>
      </section>

      <button
        type='submit'
        disabled={saving}
        className='min-h-11 rounded-lg bg-studio-violet px-5 text-sm font-medium text-white disabled:opacity-60'
      >
        {saving ? t("saving") : t("save")}
      </button>
    </form>
  );
}
