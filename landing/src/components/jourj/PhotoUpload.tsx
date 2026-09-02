"use client";

import {
  uploadGuestMedia,
  type GuestPageMedia,
} from "@/actions/guest-page-actions";
import { Camera, Loader2 } from "lucide-react";
import { useState } from "react";

/**
 * "Nos photos" — the guest side of the shared gallery.
 *
 * This component receives `media` already filtered: the server page reads
 * `guest_media` with `hidden = false`, so a photo the couple hid never
 * travels here at all. The dashboard deliberately fetches hidden rows (a
 * screen that cannot see what it hid cannot unhide it); this is the guest
 * side, where the opposite is true.
 *
 * The upload window is enforced by the database — the anon insert policies on
 * `guest_media` and on `storage.objects` both require
 * `uploads_open_until > now()`. `uploadsOpen` below only decides which copy
 * to show, so a window that closes mid-party fails cleanly at the database
 * with the French message the action returns rather than a raw policy error.
 */
export function PhotoUpload({
  slug,
  galleryVisibleToGuests,
  uploadsOpen,
  media,
}: {
  slug: string;
  galleryVisibleToGuests: boolean;
  uploadsOpen: boolean;
  media: GuestPageMedia[];
}) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<
    { kind: "ok" | "error"; text: string } | null
  >(null);

  const onFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    // Clearing the input lets a guest re-pick the same file after a failure;
    // otherwise `change` never fires again for an identical selection.
    event.target.value = "";
    if (files.length === 0) return;

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    for (const file of files) formData.append("files", file);

    const result = await uploadGuestMedia(slug, formData);
    setUploading(false);

    if (!result.success) {
      setMessage({ kind: "error", text: result.error });
      return;
    }

    setMessage({
      kind: "ok",
      text: `Merci ! ${result.uploaded} fichier(s) envoyé(s) aux mariés.`,
    });
  };

  return (
    <div>
      <h1 className='text-center font-heading text-2xl text-studio-violet'>
        Nos photos
      </h1>
      <p className='mt-2 text-center text-sm text-studio-violet/70'>
        Partagez vos photos et vidéos, sans créer de compte.
      </p>

      {uploadsOpen ? (
        <label
          className={`mt-6 flex min-h-14 items-center justify-center gap-2 rounded-xl bg-studio-violet text-sm font-medium text-white ${
            uploading ? "cursor-wait opacity-70" : "cursor-pointer"
          }`}
        >
          {uploading ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <Camera className='h-4 w-4' />
          )}
          {uploading ? "Envoi en cours…" : "Ajouter mes photos"}
          <input
            type='file'
            accept='image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm'
            multiple
            capture='environment'
            disabled={uploading}
            className='hidden'
            onChange={onFiles}
          />
        </label>
      ) : (
        <p className='mt-6 rounded-xl border border-studio-lavande/40 bg-white p-4 text-center text-sm text-studio-violet/70'>
          Les envois sont clos. Merci d&apos;avoir partagé cette journée !
        </p>
      )}

      {message && (
        <p
          className={`mt-3 text-center text-xs ${
            message.kind === "error"
              ? "text-red-600"
              : "text-studio-violet/60"
          }`}
        >
          {message.text}
        </p>
      )}

      {galleryVisibleToGuests ? (
        media.length > 0 ? (
          <div className='mt-8 grid grid-cols-3 gap-1.5'>
            {media.map((item) =>
              item.kind === "video" ? (
                <video
                  key={item.id}
                  src={item.url}
                  playsInline
                  controls
                  preload='metadata'
                  className='aspect-square w-full rounded-md bg-black object-cover'
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element -- guest
                   uploads live in the public `guest-media` bucket; their
                   dimensions are unknown and next/image would need every
                   storage host allowlisted for no gain on a 3-column grid. */
                <img
                  key={item.id}
                  src={item.thumbUrl}
                  alt=''
                  loading='lazy'
                  className='aspect-square w-full rounded-md object-cover'
                />
              ),
            )}
          </div>
        ) : (
          <p className='mt-8 text-center text-xs text-studio-violet/50'>
            Personne n&apos;a encore partagé de photo. Soyez les premiers !
          </p>
        )
      ) : (
        <p className='mt-8 text-center text-xs text-studio-violet/50'>
          Les mariés ont choisi de garder la galerie privée. Vos photos leur
          parviennent bien.
        </p>
      )}
    </div>
  );
}
