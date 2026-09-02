"use client";

import { Button } from "@shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";
import type { GuestMedia } from "@shared/types/jour-j";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { MediaTile } from "./MediaTile";

type Filter = "all" | "photo" | "video" | "hidden";

export function MediaGrid({ initialMedia }: { initialMedia: GuestMedia[] }) {
  const t = useTranslations("DayOfPhotos");
  const [media, setMedia] = useState(initialMedia);
  const [filter, setFilter] = useState<Filter>("all");
  const [deleteTarget, setDeleteTarget] = useState<GuestMedia | null>(null);

  const visible = useMemo(() => {
    if (filter === "hidden") return media.filter((m) => m.hidden);
    if (filter === "all") return media;
    return media.filter((m) => m.kind === filter);
  }, [media, filter]);

  const counts = useMemo(
    () => ({
      all: media.length,
      photo: media.filter((m) => m.kind === "photo").length,
      video: media.filter((m) => m.kind === "video").length,
      hidden: media.filter((m) => m.hidden).length,
    }),
    [media],
  );

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setMedia((prev) => prev.filter((m) => m.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <div className='min-h-screen bg-studio-creme p-4 md:p-8 lg:p-12'>
      <div className='mx-auto max-w-5xl'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='font-heading text-h3 text-studio-violet'>{t("title")}</h1>
            <p className='mt-1 text-sm text-studio-violet/70'>
              {t("count", { count: media.length })}
            </p>
          </div>
          <button
            type='button'
            onClick={() => toast.info(t("zip_pending"))}
            className='flex min-h-12 items-center justify-center gap-2 rounded-lg bg-studio-violet px-4 text-sm font-medium text-white'
          >
            <Download className='h-4 w-4' />
            {t("download_all")}
          </button>
        </div>

        <div className='mt-4 flex gap-2 overflow-x-auto pb-1'>
          {(["all", "photo", "video", "hidden"] as const).map((key) => (
            <button
              key={key}
              type='button'
              onClick={() => setFilter(key)}
              className={`min-h-11 shrink-0 rounded-full px-4 text-sm transition-colors ${
                filter === key
                  ? "bg-studio-violet text-white"
                  : "bg-white text-studio-violet"
              }`}
            >
              {t(`filters.${key}`)} ({counts[key]})
            </button>
          ))}
        </div>

        <div className='mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4'>
          {visible.map((item) => (
            <MediaTile
              key={item.id}
              media={item}
              onToggleHidden={() =>
                setMedia((prev) =>
                  prev.map((m) =>
                    m.id === item.id ? { ...m, hidden: !m.hidden } : m,
                  ),
                )
              }
              onDelete={() => setDeleteTarget(item)}
            />
          ))}
        </div>
      </div>

      {/* Delete confirmation: guest media is irreplaceable, and tile actions
          are always visible on touch, so a stray tap must not delete outright. */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("delete_dialog.title")}</DialogTitle>
            <DialogDescription>{t("delete_dialog.description")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className='gap-2 sm:gap-0'>
            <Button
              variant='outline'
              className='min-h-12'
              onClick={() => setDeleteTarget(null)}
            >
              {t("delete_dialog.cancel")}
            </Button>
            <Button
              className='min-h-12 bg-red-500 text-white hover:bg-red-600'
              onClick={confirmDelete}
            >
              {t("delete_dialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
