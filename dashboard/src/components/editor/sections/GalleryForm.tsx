"use client";

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@shared/lib/utils";
import { motion } from "framer-motion";
import { GripVertical, ImagePlus, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { deleteGalleryImage, uploadGalleryImage } from "@/actions/gallery-actions";

import { useEditor } from "../EditorProvider";
import { FieldGroup } from "../fields/FieldGroup";
import { SectionIntro } from "../fields/SectionIntro";
import { SlotFields } from "../fields/SlotFields";
import { uniqueStrings } from "../fields/coerce";
import { FormLayout } from "./shared";

/** The server's cap, and `uploadGalleryImage`'s own checks, repeated to answer before the upload. */
const MAX_IMAGES = 12;
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/jpg", "image/png"];

/**
 * The couple's photos, in the order the invitation shows them.
 *
 * A photo is uploaded the moment it is picked, and only its URL goes into the
 * draft — what "Enregistrer" then writes. Removing one deletes the file from
 * storage only when the saved invitation does not show it (it was uploaded
 * during this visit): a saved photo deleted now would break on the live page
 * until the next save, and for good if the couple chose "Annuler". Those
 * files are left unreferenced instead, as the editor's other photo fields
 * leave theirs.
 */
export function GalleryForm() {
  const t = useTranslations("Editor");
  const { draft, saved, updateModule } = useEditor();
  // Each URL once: they are the grid's sortable ids.
  const images = uniqueStrings(draft.modules.gallery?.images);
  const savedImages = uniqueStrings(saved.modules.gallery?.images);

  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(0);
  const full = images.length + pending >= MAX_IMAGES;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Always from the latest draft: uploads land one by one, possibly after the
  // couple reordered or removed something meanwhile.
  const setImages = (next: (current: string[]) => string[]) =>
    updateModule("gallery", (current) => ({ ...current, images: next(uniqueStrings(current.images)) }));

  const upload = async (files: File[]) => {
    if (files.length === 0) return;

    const valid = files.filter((file) => ACCEPTED.includes(file.type) && file.size <= MAX_BYTES);
    if (files.some((file) => !ACCEPTED.includes(file.type))) {
      toast.error(t("errors.format"), { id: "gallery-format" });
    } else if (valid.length < files.length) {
      toast.error(t("errors.tooBig"), { id: "gallery-size" });
    }

    const room = MAX_IMAGES - images.length - pending;
    if (valid.length > room) toast.error(t("list.full", { max: MAX_IMAGES }), { id: "gallery-full" });
    const batch = valid.slice(0, Math.max(room, 0));
    if (batch.length === 0) return;

    // One at a time, each photo shown as soon as it is stored: server actions
    // run one after the other anyway.
    setPending((count) => count + batch.length);
    for (const file of batch) {
      try {
        const formData = new FormData();
        formData.set("file", file);
        const { url } = await uploadGalleryImage(formData);
        setImages((current) => (current.length < MAX_IMAGES ? [...current, url] : current));
      } catch (error) {
        console.error("[GALLERY_UPLOAD]", error);
        toast.error(t("errors.upload"), { id: "gallery-upload" });
      } finally {
        setPending((count) => count - 1);
      }
    }
  };

  const remove = (url: string) => {
    setImages((current) => current.filter((image) => image !== url));
    if (!savedImages.includes(url)) {
      void deleteGalleryImage(url).catch((error) => console.warn("[GALLERY_DELETE]", error));
    }
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setImages((current) => {
      const from = current.indexOf(String(active.id));
      const to = current.indexOf(String(over.id));
      return from === -1 || to === -1 ? current : arrayMove(current, from, to);
    });
  };

  return (
    <FormLayout>
      <SectionIntro section="gallery" />

      <FieldGroup title={t("groups.gallery")} description={t("hints.gallery")}>
        {images.length === 0 && pending === 0 ? (
          <p className="rounded-xl border border-dashed border-studio-lavande/60 px-4 py-5 text-center text-sm text-studio-violet/55">
            {t("empty.gallery")}
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToParentElement]}
            onDragEnd={onDragEnd}
          >
            <SortableContext items={images} strategy={rectSortingStrategy}>
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {images.map((url, index) => (
                  <SortablePhoto
                    key={url}
                    url={url}
                    label={t("fields.galleryPhoto", { index: index + 1 })}
                    onRemove={() => remove(url)}
                  />
                ))}
                {Array.from({ length: pending }, (_, index) => (
                  <li
                    key={`pending-${index}`}
                    className="flex aspect-square animate-pulse items-center justify-center rounded-xl bg-studio-lavande/20"
                  >
                    <Loader2 className="h-5 w-5 animate-spin text-studio-violet/50" aria-hidden="true" />
                  </li>
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          multiple
          className="hidden"
          aria-label={t("actions.addPhotos")}
          onChange={(event) => {
            // Copied before the reset: clearing the input empties its FileList,
            // and clearing it lets the same photo be picked again.
            const files = Array.from(event.target.files ?? []);
            event.target.value = "";
            void upload(files);
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            void upload(Array.from(event.dataTransfer.files));
          }}
          disabled={full}
          aria-busy={pending > 0}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-studio-lavande/60 text-sm font-medium text-studio-violet/70 transition-colors hover:border-studio-violet/40 hover:bg-studio-card-bg hover:text-studio-violet disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending > 0 ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
          )}
          {full ? t("list.full", { max: MAX_IMAGES }) : t("actions.addPhotos")}
        </button>
      </FieldGroup>

      <SlotFields section="gallery" />
    </FormLayout>
  );
}

/**
 * One photo of the grid: dragged by its handle (or moved with the keyboard
 * from it), so a swipe across the grid still scrolls the page on a phone.
 */
function SortablePhoto({
  url,
  label,
  onRemove,
}: {
  url: string;
  label: string;
  onRemove: () => void;
}) {
  const t = useTranslations("Editor.list");
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: url });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("relative", isDragging && "z-10")}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.18 }}
        className={cn(
          "relative aspect-square overflow-hidden rounded-xl border bg-studio-card-bg",
          isDragging ? "border-studio-violet-clair shadow-studio-card" : "border-studio-lavande/40",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- storage URLs are
            served over http://127.0.0.1 in development, which the dashboard's
            remote image patterns (https *.supabase.co) do not allow. */}
        <img src={url} alt={label} loading="lazy" draggable={false} className="h-full w-full object-cover" />

        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={t("reorder", { label })}
          className="absolute left-1.5 top-1.5 flex h-8 w-8 cursor-grab touch-none items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/70 active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label={t("remove", { label })}
          className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-red-500"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </motion.div>
    </li>
  );
}
