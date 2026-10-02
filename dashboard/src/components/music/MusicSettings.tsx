"use client";

import { Pause, Play, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useRef, useState } from "react";
import { toast } from "sonner";

import {
  chooseLibraryTrack,
  confirmMusicUpload,
  createMusicUploadUrl,
  setMusicEnabled,
} from "@/actions/music-actions";
import { ToggleField } from "@/components/editor/fields/ToggleField";
import type { MusicSettingsView } from "@/types/music";
import { createClient } from "@/utils/supabase/client";
import {
  MUSIC_BUCKET,
  musicDisplayName,
  musicPublicUrl,
  validateMusicUpload,
} from "@shared/lib/music";

type Included = Extract<MusicSettingsView, { included: true }>;

const UPLOAD_ERROR_KEYS = { type: "error_type", size: "error_size", empty: "error_empty" } as const;

/** The « Musique » screen (docs/superpowers/specs/2026-10-02-invitation-music-design.md, D7). */
export function MusicSettings({ initial }: { initial: MusicSettingsView }) {
  const t = useTranslations("Music");

  if (!initial.included) {
    return (
      <Page title={t("title")}>
        <div className='mt-6 rounded-2xl border border-studio-lavande/40 bg-white p-6 shadow-studio-card'>
          <p className='font-medium text-studio-violet'>{t("not_included_title")}</p>
          <p className='mt-1 text-sm text-studio-violet/70'>{t("not_included_body")}</p>
        </div>
      </Page>
    );
  }

  return <IncludedMusicSettings initial={initial} />;
}

function Page({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className='min-h-screen bg-studio-creme p-4 md:p-8 lg:p-12'>
      <div className='mx-auto max-w-2xl'>
        <h1 className='font-heading text-h3 text-studio-violet'>{title}</h1>
        {children}
      </div>
    </div>
  );
}

const card = "mt-4 rounded-2xl border border-studio-lavande/40 bg-white p-4 shadow-studio-card";
const heading = "text-xs font-medium uppercase tracking-wide text-studio-violet/60";

function IncludedMusicSettings({ initial }: { initial: Included }) {
  const t = useTranslations("Music");
  const [enabled, setEnabled] = useState(initial.enabled);
  const [trackId, setTrackId] = useState(initial.trackId);
  const [upload, setUpload] = useState(initial.upload);
  const [confirmingTrack, setConfirmingTrack] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [listening, setListening] = useState<string | null>(null);
  const previewRef = useRef<HTMLAudioElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const libraryTrack =
    initial.library.find((track) => track.id === trackId) ?? initial.library[0];
  const current = upload
    ? { title: upload.name, subtitle: t("your_file"), url: upload.url }
    : { title: libraryTrack.title, subtitle: libraryTrack.artist, url: libraryTrack.url };

  const toggleListen = (url: string) => {
    const audio = previewRef.current;
    if (!audio) return;
    if (listening === url) {
      audio.pause();
      setListening(null);
      return;
    }
    audio.src = url;
    audio.play().then(
      () => setListening(url),
      () => {
        setListening(null);
        toast.error(t("listen_failed"));
      },
    );
  };

  const onToggle = async (next: boolean) => {
    const previous = enabled;
    setEnabled(next);
    const res = await setMusicEnabled(next);
    if (!res.success) {
      setEnabled(previous);
      toast.error(res.error ?? t("save_failed"));
    }
  };

  const choose = async (id: string) => {
    // Choosing a library track deletes the couple's file: ask first.
    if (upload && confirmingTrack !== id) {
      setConfirmingTrack(id);
      return;
    }
    setConfirmingTrack(null);
    const previous = { trackId, upload };
    setTrackId(id);
    setUpload(null);
    const res = await chooseLibraryTrack(id);
    if (!res.success) {
      setTrackId(previous.trackId);
      setUpload(previous.upload);
      toast.error(res.error ?? t("save_failed"));
      return;
    }
    toast.success(t("saved"));
  };

  const onFile = async (file: File | undefined) => {
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;

    const check = validateMusicUpload(file);
    if (!check.ok) {
      toast.error(t(UPLOAD_ERROR_KEYS[check.reason]));
      return;
    }

    setUploading(true);
    try {
      const ticket = await createMusicUploadUrl({ name: file.name, size: file.size });
      if (!ticket.success) {
        toast.error(ticket.error);
        return;
      }
      // Straight to Storage: the file never goes through our server (D7).
      // Re-typed from its extension: storage-js sends a File with its own
      // `file.type` and ignores `contentType`, so a browser that says ""
      // or `audio/mp3` would be refused by the bucket, and `audio/x-m4a`
      // stored as such.
      const typed = new File([file], file.name, { type: ticket.contentType });
      const { error } = await createClient()
        .storage.from(MUSIC_BUCKET)
        .uploadToSignedUrl(ticket.path, ticket.token, typed, { contentType: ticket.contentType });
      if (error) {
        toast.error(t("save_failed"));
        return;
      }
      const res = await confirmMusicUpload(ticket.path);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      setUpload({
        name: musicDisplayName(ticket.path),
        url: musicPublicUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", ticket.path),
      });
      toast.success(t("saved"));
    } finally {
      setUploading(false);
    }
  };

  const listenLabel = (url: string) => (listening === url ? t("pause") : t("listen"));

  return (
    <Page title={t("title")}>
      <p className='mt-2 text-sm leading-relaxed text-studio-violet/70'>{t("intro")}</p>
      <audio ref={previewRef} onEnded={() => setListening(null)} hidden />

      <section className={`${card} mt-6`}>
        <ToggleField
          label={t("enabled_label")}
          description={t("enabled_hint")}
          checked={enabled}
          onChange={(next) => void onToggle(next)}
        />
      </section>

      <section className={card}>
        <h2 className={heading}>{t("current_label")}</h2>
        <div className='mt-3'>
          <TrackRow
            title={current.title}
            subtitle={current.subtitle}
            playing={listening === current.url}
            listenLabel={listenLabel(current.url)}
            onListen={() => toggleListen(current.url)}
          />
        </div>
      </section>

      <section className={card}>
        <h2 className={heading}>{t("library_title")}</h2>
        <ul className='mt-1 divide-y divide-studio-lavande/30'>
          {initial.library.map((track) => {
            const selected = !upload && track.id === trackId;
            return (
              <li key={track.id} className='py-3'>
                <TrackRow
                  title={track.title}
                  subtitle={track.artist}
                  badge={track.isDefault ? t("default_badge") : undefined}
                  playing={listening === track.url}
                  listenLabel={listenLabel(track.url)}
                  onListen={() => toggleListen(track.url)}
                >
                  {selected ? (
                    <span className='text-xs font-medium text-studio-violet/60'>{t("chosen")}</span>
                  ) : (
                    <button
                      type='button'
                      onClick={() => void choose(track.id)}
                      className='min-h-11 rounded-lg border border-studio-lavande/60 px-3 text-sm text-studio-violet hover:bg-studio-lavande/10'
                    >
                      {t("choose")}
                    </button>
                  )}
                </TrackRow>
                {confirmingTrack === track.id ? (
                  <div
                    role='alert'
                    className='mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-studio-lavande/10 p-3 text-sm text-studio-violet'
                  >
                    <span className='min-w-0 flex-1'>{t("replace_confirm")}</span>
                    <button
                      type='button'
                      onClick={() => void choose(track.id)}
                      className='min-h-11 rounded-lg bg-studio-violet px-3 text-white'
                    >
                      {t("confirm")}
                    </button>
                    <button
                      type='button'
                      onClick={() => setConfirmingTrack(null)}
                      className='min-h-11 rounded-lg px-3'
                    >
                      {t("cancel")}
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      <section className={card}>
        <h2 className={heading}>{t("upload_title")}</h2>
        <p className='mt-1 text-xs text-studio-violet/60'>{t("upload_hint")}</p>
        <input
          ref={fileRef}
          id='music-upload'
          type='file'
          accept='.mp3,.m4a,.aac,audio/mpeg,audio/mp4,audio/aac'
          className='sr-only'
          disabled={uploading}
          onChange={(event) => void onFile(event.target.files?.[0])}
        />
        <label
          htmlFor='music-upload'
          aria-disabled={uploading}
          className='mt-3 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-studio-violet px-4 text-sm text-white aria-disabled:cursor-wait aria-disabled:opacity-60'
        >
          <Upload size={16} aria-hidden='true' />
          {uploading ? t("uploading") : t("upload_cta")}
        </label>
        <p className='mt-3 text-xs text-studio-violet/60'>{t("rights_notice")}</p>
      </section>
    </Page>
  );
}

function TrackRow({
  title,
  subtitle,
  badge,
  playing,
  listenLabel,
  onListen,
  children,
}: {
  title: string;
  subtitle: string;
  badge?: string;
  playing: boolean;
  listenLabel: string;
  onListen: () => void;
  children?: ReactNode;
}) {
  return (
    <div className='flex items-center gap-3'>
      <button
        type='button'
        onClick={onListen}
        aria-label={`${listenLabel} — ${title}`}
        className='grid h-11 w-11 shrink-0 place-items-center rounded-full border border-studio-lavande/60 text-studio-violet hover:bg-studio-lavande/10'
      >
        {playing ? <Pause size={16} aria-hidden='true' /> : <Play size={16} aria-hidden='true' />}
      </button>
      <div className='min-w-0 flex-1'>
        <p className='truncate text-sm font-medium text-studio-violet'>{title}</p>
        {/* The badge sits under the title, not after it: on a phone a long
            title truncated it away. */}
        <p className='flex min-w-0 items-center gap-2 text-xs text-studio-violet/60'>
          <span className='truncate'>{subtitle}</span>
          {badge ? (
            <span className='shrink-0 rounded-full bg-studio-lavande/20 px-2 py-0.5 text-[11px] text-studio-violet'>
              {badge}
            </span>
          ) : null}
        </p>
      </div>
      {children}
    </div>
  );
}
