"use client";

import { cn } from "@shared/lib/utils";
import { ImagePlus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

/** 8 MB — the same ceiling the module configurator applies to venue photos. */
const MAX_BYTES = 8 * 1024 * 1024;

const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

type Props = {
  /** Current photo: a remote URL from the data, or a blob: URL just picked. */
  value?: string;
  onChange: (photoUrl: string | undefined) => void;
  /**
   * Uploads the picked file and resolves to the public URL Supabase storage
   * gave it. When provided, the picker shows the local blob: preview right
   * away (instant feedback) then swaps it for the real URL once the upload
   * resolves — reverting to the previous value and surfacing an error if it
   * fails. Without it, the picker only ever produces a blob: URL, which does
   * not survive a reload.
   */
  onUpload?: (file: File) => Promise<{ success: true; url: string } | { success: false; error: string }>;
  /** Taller for the venue, squarer for an accommodation row. */
  aspect?: "video" | "square";
  className?: string;
};

/**
 * Picks a photo from the device or a drag & drop, and previews it.
 *
 * Without `onUpload`, the file never leaves the browser: it is held as an
 * object URL so the couple can see their own image while validating the
 * screen. With `onUpload`, the blob: preview is shown immediately and then
 * replaced by the real storage URL once the upload resolves.
 */
export function PhotoPicker({
  value,
  onChange,
  onUpload,
  aspect = "video",
  className,
}: Props) {
  const t = useTranslations("PhotoPicker");
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  // Only URLs this component created may be revoked — never one from the data.
  const ownedUrl = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (ownedUrl.current) URL.revokeObjectURL(ownedUrl.current);
    },
    [],
  );

  const accept = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    if (!ACCEPTED.includes(file.type)) {
      setError(t("error_type"));
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(t("error_size"));
      return;
    }

    const previous = value;
    if (ownedUrl.current) URL.revokeObjectURL(ownedUrl.current);
    const url = URL.createObjectURL(file);
    ownedUrl.current = url;
    setError(null);
    onChange(url);

    if (!onUpload) return;

    setUploading(true);
    const res = await onUpload(file);
    setUploading(false);
    if (res.success) {
      onChange(res.url);
    } else {
      onChange(previous);
      setError(res.error);
    }
  };

  const clear = () => {
    if (ownedUrl.current) {
      URL.revokeObjectURL(ownedUrl.current);
      ownedUrl.current = null;
    }
    setError(null);
    onChange(undefined);
  };

  const ratio = aspect === "square" ? "aspect-square" : "aspect-video";

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type='file'
        accept={ACCEPTED.join(",")}
        className='hidden'
        onChange={(e) => void accept(e.target.files)}
      />

      {value ? (
        <div
          className={cn(
            "relative w-full overflow-hidden rounded-xl border border-studio-lavande/40 bg-studio-beige",
            ratio,
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- the source is
              either a blob: URL from the picker or an arbitrary remote host the
              image config does not allowlist; the wiring phase moves these to
              Supabase storage, where next/image applies. */}
          <img
            src={value}
            alt=''
            className={cn(
              "h-full w-full object-cover transition-opacity",
              uploading && "opacity-60",
            )}
          />
          <button
            type='button'
            onClick={clear}
            disabled={uploading}
            aria-label={t("remove")}
            className='absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-red-500 disabled:pointer-events-none disabled:opacity-50'
          >
            <X className='h-4 w-4' />
          </button>
        </div>
      ) : (
        <button
          type='button'
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void accept(e.dataTransfer.files);
          }}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-studio-lavande/60 py-6 text-studio-violet/60 transition-colors hover:border-studio-violet/40 hover:bg-studio-jaune/10",
            ratio,
          )}
        >
          <ImagePlus className='h-5 w-5' />
          <span className='px-3 text-center text-xs font-medium'>
            {t("hint")}
          </span>
        </button>
      )}

      {error && <p className='mt-1.5 text-xs text-red-600'>{error}</p>}
    </div>
  );
}
