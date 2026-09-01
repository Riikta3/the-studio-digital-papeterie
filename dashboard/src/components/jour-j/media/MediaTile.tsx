"use client";

import type { GuestMedia } from "@shared/types/jour-j";
import { Download, Eye, EyeOff, Play, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = {
  media: GuestMedia;
  onToggleHidden: () => void;
  onDelete: () => void;
};

export function MediaTile({ media, onToggleHidden, onDelete }: Props) {
  const t = useTranslations("DayOfPhotos");

  return (
    <figure className='group relative aspect-square overflow-hidden rounded-lg bg-studio-beige'>
      {/* eslint-disable-next-line @next/next/no-img-element -- guest uploads are
          arbitrary remote URLs; step 2 moves them to Supabase storage. */}
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
      <figcaption className='absolute inset-x-0 bottom-0 flex items-center justify-end gap-0.5 bg-gradient-to-t from-black/70 to-transparent p-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100'>
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
      </figcaption>
    </figure>
  );
}
