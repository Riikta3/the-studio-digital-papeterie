"use client";

import type { GuestMedia } from "@shared/types/jour-j";
import { Download, Eye, EyeOff, Play, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

type Props = {
  media: GuestMedia;
  onToggleHidden: () => void;
  onDelete: () => void;
};

export function MediaTile({ media, onToggleHidden, onDelete }: Props) {
  const t = useTranslations("DayOfPhotos");
  const locale = useLocale();

  const uploadedAt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(media.uploadedAt));

  return (
    <figure className='group relative aspect-square overflow-hidden rounded-lg bg-studio-beige'>
      {/* eslint-disable-next-line @next/next/no-img-element -- these are
          short-lived signed URLs from Supabase storage, not a static asset
          next/image could cache or optimize. */}
      <img
        src={media.thumbUrl}
        alt=''
        loading='lazy'
        className={`h-full w-full object-cover ${media.hidden ? "opacity-40" : ""}`}
      />

      {media.kind === "video" && (
        <span className='absolute left-2 top-2 rounded-full bg-black/50 p-1'>
          <Play className='h-3 w-3 text-white' />
        </span>
      )}

      {media.hidden && (
        <span className='absolute right-2 top-2 rounded-full bg-black/50 p-1'>
          <EyeOff className='h-3 w-3 text-white' />
        </span>
      )}

      {/* Always visible on touch: there is no hover on a phone. */}
      <figcaption className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100'>
        <p className='truncate text-[10px] leading-tight text-white/90'>
          {media.uploaderName ?? t("anonymous")}
        </p>
        <p className='text-[10px] leading-tight text-white/70'>{uploadedAt}</p>

        <div className='mt-1 flex items-center justify-end gap-0.5'>
          {/* `download` is ignored cross-origin: on Supabase's signed storage
              URL this link still navigates instead of saving directly, same
              browser limitation as before — a real "save" needs fetching the
              blob client-side, out of scope here. */}
          <a
            href={media.url}
            download
            aria-label={t("download")}
            className='flex h-9 w-9 items-center justify-center'
          >
            <Download className='h-4 w-4 text-white' />
          </a>
          <button
            type='button'
            onClick={onToggleHidden}
            aria-label={media.hidden ? t("show") : t("hide")}
            className='flex h-9 w-9 items-center justify-center'
          >
            {media.hidden ? (
              <Eye className='h-4 w-4 text-white' />
            ) : (
              <EyeOff className='h-4 w-4 text-white' />
            )}
          </button>
          <button
            type='button'
            onClick={onDelete}
            aria-label={t("delete")}
            className='flex h-9 w-9 items-center justify-center'
          >
            <Trash2 className='h-4 w-4 text-white' />
          </button>
        </div>
      </figcaption>
    </figure>
  );
}
