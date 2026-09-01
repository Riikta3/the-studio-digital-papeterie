"use client";

import { JOUR_J_MOCK } from "@shared/data/jour-j-mock";
import { Camera } from "lucide-react";
import { useState } from "react";

export function PhotoUpload() {
  const [pending, setPending] = useState<string[]>([]);
  const { galleryVisibleToGuests, media } = {
    galleryVisibleToGuests: JOUR_J_MOCK.settings.galleryVisibleToGuests,
    media: JOUR_J_MOCK.media,
  };

  const visible = media.filter((m) => !m.hidden).slice(0, 30);

  return (
    <div>
      <h1 className='text-center font-heading text-2xl text-studio-violet'>
        Nos photos
      </h1>
      <p className='mt-2 text-center text-sm text-studio-violet/70'>
        Partagez vos photos et vidéos, sans créer de compte.
      </p>

      <label className='mt-6 flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-xl bg-studio-violet text-sm font-medium text-white'>
        <Camera className='h-4 w-4' />
        Ajouter mes photos
        <input
          type='file'
          accept='image/*,video/*'
          multiple
          capture='environment'
          className='hidden'
          onChange={(e) => {
            // Mock: names only. Step 2 compresses and uploads to storage.
            const names = Array.from(e.target.files ?? []).map((f) => f.name);
            setPending((prev) => [...prev, ...names]);
          }}
        />
      </label>

      {pending.length > 0 && (
        <p className='mt-3 text-center text-xs text-studio-violet/60'>
          {pending.length} fichier(s) prêt(s) à être envoyés — l&apos;envoi
          réel arrive avec le branchement.
        </p>
      )}

      {galleryVisibleToGuests ? (
        <div className='mt-8 grid grid-cols-3 gap-1.5'>
          {visible.map((item) => (
            /* eslint-disable-next-line @next/next/no-img-element -- remote
               guest uploads; moves to Supabase storage in step 2. */
            <img
              key={item.id}
              src={item.thumbUrl}
              alt=''
              loading='lazy'
              className='aspect-square w-full rounded-md object-cover'
            />
          ))}
        </div>
      ) : (
        <p className='mt-8 text-center text-xs text-studio-violet/50'>
          Les mariés ont choisi de garder la galerie privée. Vos photos leur
          parviennent bien.
        </p>
      )}
    </div>
  );
}
