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
  /** Taller for the venue, squarer for an accommodation row. */
  aspect?: "video" | "square";
  className?: string;
};

/**
 * Picks a photo from the device or a drag & drop, and previews it.
 *
 * Mock phase: the file never leaves the browser. It is held as an object URL
 * so the couple can see their own image while validating the screen, and the
 * wiring phase swaps `onChange` for a real upload without touching this
 * component's shape.
 */
export function PhotoPicker({
  value,
  onChange,
  aspect = "video",
  className,
}: Props) {
  const t = useTranslations("PhotoPicker");
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  // Only URLs this component created may be revoked — never one from the data.
  const ownedUrl = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (ownedUrl.current) URL.revokeObjectURL(ownedUrl.current);
    },
    [],
  );

  const accept = (files: FileList | null) => {
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

    if (ownedUrl.current) URL.revokeObjectURL(ownedUrl.current);
    const url = URL.createObjectURL(file);
    ownedUrl.current = url;
    setError(null);
    onChange(url);
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
        onChange={(e) => accept(e.target.files)}
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
          <img src={value} alt='' className='h-full w-full object-cover' />
          <button
            type='button'
            onClick={clear}
            aria-label={t("remove")}
            className='absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-red-500'
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
            accept(e.dataTransfer.files);
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
