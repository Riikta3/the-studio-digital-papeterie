"use client";

import { updateModuleConfig } from "@/actions/module-config-actions";
import { deleteGalleryImage, saveGalleryConfig, uploadGalleryImage } from "@/actions/gallery-actions";
import { deleteIntroVideo, uploadIntroVideo, uploadVenueImage } from "@/actions/media-upload-actions";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Textarea } from "@shared/components/ui/textarea";
import { cn } from "@shared/lib/utils";
import {
  Bus,
  Car,
  GripVertical,
  ImagePlus,
  Plane,
  Plus,
  Ship,
  Train,
  Trash2,
  X,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  location: string;
  description: string;
}

interface AccommodationOption {
  id: string;
  type: "Hotel" | "House" | "Camping" | "Other";
  name: string;
  distance: string;
  description: string;
  url?: string;
  urlLabel?: string;
}

interface TransportOption {
  id: string;
  iconType: "Train" | "Plane" | "Bus" | "Car" | "Ship";
  title: string;
  description: string;
}

interface MenuSection {
  id: string;
  title: string;
  items: { title: string; description?: string }[];
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

/** Safely extract a string from an unknown config value */
function str(val: unknown, fallback = ""): string {
  return typeof val === "string" ? val : fallback;
}

/** Safely extract an array from an unknown config value */
function arr<T>(val: unknown): T[] {
  return Array.isArray(val) ? (val as T[]) : [];
}

/** Safely extract a typed string union */
function strAs<T extends string>(val: unknown, fallback: T): T {
  return typeof val === "string" ? (val as T) : fallback;
}

function FormActions({
  saving,
  onReset,
}: {
  saving: boolean;
  onReset: () => void;
}) {
  const t = useTranslations("Modules");
  return (
    <div className="flex flex-col sm:flex-row gap-3 pt-2">
      <Button type="submit" disabled={saving} className="w-full sm:w-auto">
        {saving ? t("saving") : t("save")}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onReset}
        className="w-full sm:w-auto text-muted-foreground"
      >
        {t("reset")}
      </Button>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3 mt-8 first:mt-0">
      {title}
    </h3>
  );
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

// ─── Module-specific forms ────────────────────────────────────────────────────

// --- DressCode ---
function DressCodeForm({
  config,
  onSave,
  onPreview,
}: {
  config: Record<string, unknown> | null;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onPreview?: (data: Record<string, unknown>) => void;
}) {
  const DEFAULTS = {
    title: "Dress Code",
    subtitle: "Tenue de Soirée",
    mode: "global" as "global" | "split",
    description: "Pour que la fête soit belle, nous vous invitons à porter une touche de vert sapin ou de doré dans vos tenues.",
    description_men: "",
    description_women: "",
  };
  const t = useTranslations("Modules");
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(str(config?.title, DEFAULTS.title));
  const [subtitle, setSubtitle] = useState(str(config?.subtitle, DEFAULTS.subtitle));
  const [mode, setMode] = useState<"global" | "split">(
    (config?.mode as "global" | "split") ?? DEFAULTS.mode
  );
  const [description, setDescription] = useState(str(config?.description, DEFAULTS.description));
  const [descriptionMen, setDescriptionMen] = useState(str(config?.description_men, DEFAULTS.description_men));
  const [descriptionWomen, setDescriptionWomen] = useState(str(config?.description_women, DEFAULTS.description_women));

  useEffect(() => {
    onPreview?.({ title, subtitle, mode, description, description_men: descriptionMen, description_women: descriptionWomen });
  }, [title, subtitle, mode, description, descriptionMen, descriptionWomen, onPreview]);

  function resetToDefaults() {
    setTitle(DEFAULTS.title);
    setSubtitle(DEFAULTS.subtitle);
    setMode(DEFAULTS.mode);
    setDescription(DEFAULTS.description);
    setDescriptionMen(DEFAULTS.description_men);
    setDescriptionWomen(DEFAULTS.description_women);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ title, subtitle, mode, description, description_men: descriptionMen, description_women: descriptionWomen });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FieldGroup label={t("field_title")}>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </FieldGroup>
      <FieldGroup label={t("field_subtitle")}>
        <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
      </FieldGroup>

      {/* Mode selector */}
      <FieldGroup label={t("dresscode_mode")}>
        <div className="flex gap-2">
          {(["global", "split"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "flex-1 py-2 rounded-xl border text-sm font-medium transition-colors",
                mode === m
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-white border-border text-muted-foreground hover:border-primary/30"
              )}
            >
              {t(m === "global" ? "dresscode_mode_global" : "dresscode_mode_split")}
            </button>
          ))}
        </div>
      </FieldGroup>

      {mode === "global" ? (
        <FieldGroup label={t("field_description")}>
          <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </FieldGroup>
      ) : (
        <div className="space-y-4">
          <div className="bg-studio-creme border border-border/60 rounded-xl p-4 space-y-3 [&_textarea]:bg-white">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t("dresscode_men")}
            </p>
            <Textarea rows={3} value={descriptionMen} onChange={(e) => setDescriptionMen(e.target.value)} placeholder={t("dresscode_men_placeholder")} />
          </div>
          <div className="bg-studio-creme border border-border/60 rounded-xl p-4 space-y-3 [&_textarea]:bg-white">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t("dresscode_women")}
            </p>
            <Textarea rows={3} value={descriptionWomen} onChange={(e) => setDescriptionWomen(e.target.value)} placeholder={t("dresscode_women_placeholder")} />
          </div>
        </div>
      )}

      <FormActions saving={saving} onReset={resetToDefaults} />
    </form>
  );
}

// --- RSVP ---
function RsvpForm({
  config,
  onSave,
  onPreview,
}: {
  config: Record<string, unknown> | null;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onPreview?: (data: Record<string, unknown>) => void;
}) {
  const t = useTranslations("Modules");
  const [saving, setSaving] = useState(false);
  const [deadline, setDeadline] = useState<Date | undefined>(() => {
    const raw = str(config?.rsvp_deadline);
    if (!raw) return undefined;
    const d = new Date(raw);
    return isNaN(d.getTime()) ? undefined : d;
  });

  useEffect(() => {
    const formatted = deadline
      ? deadline.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
      : "";
    onPreview?.({ rsvp_deadline: formatted });
  }, [deadline, onPreview]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const formatted = deadline
        ? deadline.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
        : "";
      await onSave({ rsvp_deadline: formatted });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FieldGroup label={t("field_rsvp_deadline")}>
        <DatePicker
          value={deadline}
          onChange={setDeadline}
          placeholder="Choisir une date limite"
        />
      </FieldGroup>
      <FormActions saving={saving} onReset={() => setDeadline(undefined)} />
    </form>
  );
}

// --- Map ---
function MapForm({
  config,
  onSave,
  onPreview,
}: {
  config: Record<string, unknown> | null;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onPreview?: (data: Record<string, unknown>) => void;
}) {
  const MAP_DEFAULTS = {
    name: "Château de Vaux-le-Vicomte",
    address: "Allée Maincy, 77950 Maincy",
    description: "Un chef-d'œuvre du XVIIe siècle niché dans un écrin de verdure, à 55 km au sud-est de Paris. Stationnement gratuit sur place.",
    imageUrl: "",
    imageOrientation: "landscape" as const,
  };
  const t = useTranslations("Modules");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState(str(config?.name, MAP_DEFAULTS.name));
  const [address, setAddress] = useState(str(config?.address, MAP_DEFAULTS.address));
  const [description, setDescription] = useState(str(config?.description, MAP_DEFAULTS.description));
  const [imageUrl, setImageUrl] = useState(str(config?.imageUrl, MAP_DEFAULTS.imageUrl));
  const [imageOrientation, setImageOrientation] = useState<"portrait" | "landscape">(
    strAs<"portrait" | "landscape">(config?.imageOrientation, MAP_DEFAULTS.imageOrientation)
  );
  const venueFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onPreview?.({ name, address, description, imageUrl, imageOrientation });
  }, [name, address, description, imageUrl, imageOrientation, onPreview]);

  async function handleVenueUpload(files: FileList | null) {
    if (!files?.[0]) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", files[0]);
      const { url } = await uploadVenueImage(fd);
      setImageUrl(url);
      toast.success("Photo uploadée");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur upload");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ name, address, description, imageUrl, imageOrientation });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FieldGroup label={t("field_venue_name")}>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Château de Vaux-le-Vicomte" />
      </FieldGroup>
      <FieldGroup label={t("field_address")}>
        <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Allée Maincy, 77950 Maincy" />
      </FieldGroup>
      <FieldGroup label={t("field_description")}>
        <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </FieldGroup>
      <FieldGroup label="Photo du lieu">
        <input ref={venueFileRef} type="file" accept="image/jpeg,image/jpg,image/png" className="hidden" onChange={(e) => handleVenueUpload(e.target.files)} />
        {imageUrl ? (
          <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border bg-muted">
            <Image src={imageUrl} alt="Photo du lieu" fill className="object-cover" sizes="600px" />
            <button type="button" onClick={() => setImageUrl("")} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-500 transition-colors">
              <X size={13} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => venueFileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleVenueUpload(e.dataTransfer.files); }}
            disabled={uploading}
            className="w-full flex flex-col items-center gap-2 py-6 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-colors text-muted-foreground"
          >
            <ImagePlus size={20} />
            <span className="text-xs font-medium">{uploading ? "Upload..." : "Ajouter une photo (JPG/PNG, max 10 Mo)"}</span>
          </button>
        )}
        <p className="text-xs text-muted-foreground">Ou coller une URL directement :</p>
        <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
      </FieldGroup>
      <FieldGroup label={t("field_image_orientation")}>
        <div className="flex gap-3">
          {(["landscape", "portrait"] as const).map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => setImageOrientation(o)}
              className={cn(
                "flex-1 py-2 rounded-lg border text-xs font-bold uppercase tracking-wider transition-colors",
                imageOrientation === o
                  ? "bg-primary/10 border-primary text-primary"
                  : "border-border text-muted-foreground hover:border-primary/30"
              )}
            >
              {t(`orientation_${o}`)}
            </button>
          ))}
        </div>
      </FieldGroup>
      <FormActions
        saving={saving}
        onReset={() => {
          setName(MAP_DEFAULTS.name); setAddress(MAP_DEFAULTS.address);
          setDescription(MAP_DEFAULTS.description); setImageUrl(MAP_DEFAULTS.imageUrl);
          setImageOrientation(MAP_DEFAULTS.imageOrientation);
        }}
      />
    </form>
  );
}

// --- IntroVideo ---
function IntroVideoForm({
  config,
  onSave,
  onPreview,
}: {
  config: Record<string, unknown> | null;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onPreview?: (data: Record<string, unknown>) => void;
}) {
  const VIDEO_DEFAULTS = {
    title: "Notre Histoire",
    subtitle: "Un petit mot pour vous",
    description: "Avant le grand jour, nous tenions à vous adresser ce message...",
    videoUrl: "",
    videoType: "embed" as const,
  };
  const t = useTranslations("Modules");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState(str(config?.title, VIDEO_DEFAULTS.title));
  const [subtitle, setSubtitle] = useState(str(config?.subtitle, VIDEO_DEFAULTS.subtitle));
  const [description, setDescription] = useState(str(config?.description, VIDEO_DEFAULTS.description));
  const [videoType, setVideoType] = useState<"embed" | "upload">(
    strAs<"embed" | "upload">(config?.videoType, VIDEO_DEFAULTS.videoType)
  );
  // Separate state per mode — switching tabs never mixes values
  const [embedUrl, setEmbedUrl] = useState(
    config?.videoType === "upload" ? "" : str(config?.videoUrl, "")
  );
  const [uploadedUrl, setUploadedUrl] = useState(
    config?.videoType === "upload" ? str(config?.videoUrl, "") : ""
  );
  const [uploadedName, setUploadedName] = useState(
    config?.videoType === "upload" ? str(config?.videoName, "") : ""
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const videoFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const videoUrl = videoType === "upload" ? uploadedUrl : embedUrl;
    onPreview?.({ title, subtitle, description, videoUrl, videoType, ...(videoType === "upload" && uploadedName ? { videoName: uploadedName } : {}) });
  }, [title, subtitle, description, videoType, embedUrl, uploadedUrl, uploadedName, onPreview]);

  async function handleVideoUpload(files: FileList | null) {
    if (!files?.[0]) return;
    setUploading(true);
    try {
      const file = files[0];
      const fd = new FormData();
      fd.append("file", file);
      const { url } = await uploadIntroVideo(fd);
      setUploadedUrl(url);
      setUploadedName(file.name);
      setVideoType("upload");
      // Auto-save immediately so the URL is persisted even without clicking "Enregistrer"
      await onSave({ title, subtitle, description, videoUrl: url, videoType: "upload", videoName: file.name });
      toast.success("Vidéo uploadée et enregistrée");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur upload");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      // Si on sauvegarde en mode embed et qu'une vidéo uploadée existe → la supprimer du bucket
      if (videoType === "embed" && uploadedUrl) {
        try { await deleteIntroVideo(uploadedUrl); } catch {}
        setUploadedUrl("");
        setUploadedName("");
      }
      // Si on sauvegarde en mode upload et qu'un lien embed existe → le vider
      if (videoType === "upload" && embedUrl) {
        setEmbedUrl("");
      }
      const videoUrl = videoType === "upload" ? uploadedUrl : embedUrl;
      await onSave({ title, subtitle, description, videoUrl, videoType, ...(videoType === "upload" && uploadedName ? { videoName: uploadedName } : {}) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FieldGroup label={t("field_title")}>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </FieldGroup>
      <FieldGroup label={t("field_subtitle")}>
        <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
      </FieldGroup>
      <FieldGroup label={t("field_description")}>
        <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      </FieldGroup>

      <FieldGroup label="Source vidéo">
        <div className="flex gap-3 mb-3">
          {(["embed", "upload"] as const).map((vt) => (
            <button
              key={vt}
              type="button"
              onClick={() => setVideoType(vt)}
              className={cn(
                "flex-1 py-2 rounded-lg border text-xs font-bold uppercase tracking-wider transition-colors",
                videoType === vt
                  ? "bg-primary/10 border-primary text-primary"
                  : "border-border text-muted-foreground hover:border-primary/30"
              )}
            >
              {vt === "embed" ? "Lien YouTube / Vimeo" : "Uploader un fichier"}
            </button>
          ))}
        </div>

        {videoType === "embed" ? (
          <>
            <Input
              value={embedUrl}
              onChange={(e) => setEmbedUrl(e.target.value)}
              placeholder="https://youtu.be/... ou https://www.youtube.com/watch?v=..."
            />
            <p className="text-xs text-muted-foreground">Coller un lien YouTube ou Vimeo</p>
          </>
        ) : (
          <>
            <input ref={videoFileRef} type="file" accept="video/mp4,video/quicktime,video/webm" className="hidden" onChange={(e) => handleVideoUpload(e.target.files)} />
            {uploadedUrl ? (
              <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl border border-border">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <ImagePlus size={14} className="text-primary" />
                </div>
                <p className="text-xs text-foreground flex-1 truncate">{uploadedName || uploadedUrl.split("/").pop()}</p>
                <button type="button" onClick={() => setConfirmDelete(true)} className="text-muted-foreground hover:text-red-500 transition-colors shrink-0">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => videoFileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleVideoUpload(e.dataTransfer.files); }}
                disabled={uploading}
                className="w-full flex flex-col items-center gap-2 py-6 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-colors text-muted-foreground"
              >
                <ImagePlus size={20} />
                <span className="text-xs font-medium">{uploading ? "Upload en cours..." : "Uploader une vidéo (MP4, MOV, WebM — max 100 Mo)"}</span>
              </button>
            )}
          </>
        )}
      </FieldGroup>

      <FormActions
        saving={saving}
        onReset={() => {
          setTitle(VIDEO_DEFAULTS.title); setSubtitle(VIDEO_DEFAULTS.subtitle);
          setDescription(VIDEO_DEFAULTS.description);
          setEmbedUrl(""); setUploadedUrl(""); setUploadedName("");
          setVideoType(VIDEO_DEFAULTS.videoType);
        }}
      />

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <p className="font-semibold text-foreground text-sm">Supprimer cette vidéo ?</p>
            <p className="text-xs text-muted-foreground">Cette action est irréversible — la vidéo sera effacée et vos invités ne pourront plus la visionner.</p>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setConfirmDelete(false)} className="flex-1 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-secondary transition-colors">
                Annuler
              </button>
              <button type="button" onClick={async () => {
                setConfirmDelete(false);
                try { await deleteIntroVideo(uploadedUrl); } catch {}
                setUploadedUrl(""); setUploadedName("");
              }} className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

// --- GiftList ---
function GiftListForm({
  config,
  onSave,
  onPreview,
}: {
  config: Record<string, unknown> | null;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onPreview?: (data: Record<string, unknown>) => void;
}) {
  const t = useTranslations("Modules");
  const [saving, setSaving] = useState(false);
  const [description, setDescription] = useState(
    str(config?.description, "Votre présence à nos côtés est le plus beau des cadeaux. Si vous souhaitez toutefois nous accompagner dans nos futurs projets ou notre voyage de noces, vous trouverez ci-dessous les options pour participer.")
  );
  const [giftListUrl, setGiftListUrl] = useState(str(config?.gift_list_url));
  const [giftListLabel, setGiftListLabel] = useState(str(config?.gift_list_label, "Contribuer à notre projet"));

  useEffect(() => {
    onPreview?.({ description, gift_list_url: giftListUrl, gift_list_label: giftListLabel });
  }, [description, giftListUrl, giftListLabel, onPreview]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ description, gift_list_url: giftListUrl, gift_list_label: giftListLabel });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FieldGroup label={t("field_description")}>
        <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
      </FieldGroup>
      <FieldGroup label={t("field_gift_url")}>
        <Input value={giftListUrl} onChange={(e) => setGiftListUrl(e.target.value)} placeholder="https://millemercismariage.com/..." />
      </FieldGroup>
      <FieldGroup label={t("field_gift_label")}>
        <Input value={giftListLabel} onChange={(e) => setGiftListLabel(e.target.value)} placeholder="Contribuer à notre projet" />
      </FieldGroup>
      <FormActions
        saving={saving}
        onReset={() => {
          setDescription("Votre présence à nos côtés est le plus beau des cadeaux.");
          setGiftListUrl(""); setGiftListLabel("Contribuer à notre projet");
        }}
      />
    </form>
  );
}

// --- Playlist ---
function PlaylistForm({
  config,
  onSave,
  onPreview,
}: {
  config: Record<string, unknown> | null;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onPreview?: (data: Record<string, unknown>) => void;
}) {
  const t = useTranslations("Modules");
  const [saving, setSaving] = useState(false);
  const [description, setDescription] = useState(
    str(config?.description, "Aidez le DJ à préparer la soirée parfaite ! Recherchez et proposez jusqu'à 3 titres qui vous feront danser jusqu'au bout de la nuit.")
  );

  useEffect(() => {
    onPreview?.({ description });
  }, [description, onPreview]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ description });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FieldGroup label={t("field_description")}>
        <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
      </FieldGroup>
      <FormActions
        saving={saving}
        onReset={() => setDescription("Aidez le DJ à préparer la soirée parfaite ! Recherchez et proposez jusqu'à 3 titres qui vous feront danser jusqu'au bout de la nuit.")}
      />
    </form>
  );
}

// --- Timeline ---
const TIMELINE_DEFAULTS: TimelineEvent[] = [
  { id: "tl-1", time: "15:00", title: "Cérémonie Civile", location: "Mairie du 8e, Paris", description: "Merci d'arriver 15 min en avance." },
  { id: "tl-2", time: "17:30", title: "Vin d'Honneur", location: "Jardins du Château", description: "Profitez de la terrasse et des jardins." },
  { id: "tl-3", time: "20:00", title: "Dîner & Soirée", location: "Grande Salle du Château", description: "Le bal s'ouvre avec la première danse des mariés." },
];

function TimelineForm({
  config,
  onSave,
  onPreview,
}: {
  config: Record<string, unknown> | null;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onPreview?: (data: Record<string, unknown>) => void;
}) {
  const t = useTranslations("Modules");
  const [saving, setSaving] = useState(false);
  const [events, setEvents] = useState<TimelineEvent[]>(() => {
    const raw = arr<TimelineEvent>(config?.events);
    return raw.length > 0 ? raw : TIMELINE_DEFAULTS;
  });

  useEffect(() => {
    onPreview?.({ events });
  }, [events, onPreview]);

  function addEvent() {
    setEvents([...events, { id: genId(), time: "", title: "", location: "", description: "" }]);
  }

  function removeEvent(id: string) {
    setEvents(events.filter((e) => e.id !== id));
  }

  function updateEvent(id: string, field: keyof TimelineEvent, value: string) {
    setEvents(events.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ events: events.map((ev, i) => ({ ...ev, order_index: i + 1 })) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {events.map((event, idx) => (
          <div key={event.id} className="bg-studio-creme border border-border/60 rounded-xl p-4 space-y-3 [&_input]:bg-white [&_textarea]:bg-white">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t("event")} {idx + 1}
              </span>
              {events.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEvent(event.id)}
                  className="text-muted-foreground hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label={t("field_time")}>
                <Input
                  value={event.time}
                  onChange={(e) => updateEvent(event.id, "time", e.target.value)}
                  placeholder="15:00"
                />
              </FieldGroup>
              <FieldGroup label={t("field_event_title")}>
                <Input
                  value={event.title}
                  onChange={(e) => updateEvent(event.id, "title", e.target.value)}
                  placeholder="Cérémonie Civile"
                />
              </FieldGroup>
            </div>
            <FieldGroup label={t("field_location")}>
              <Input
                value={event.location}
                onChange={(e) => updateEvent(event.id, "location", e.target.value)}
                placeholder="Mairie du 8e, Paris"
              />
            </FieldGroup>
            <FieldGroup label={t("field_description")}>
              <Input
                value={event.description}
                onChange={(e) => updateEvent(event.id, "description", e.target.value)}
                placeholder="Merci d'arriver 15 min en avance"
              />
            </FieldGroup>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addEvent}
        className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
      >
        <Plus size={16} />
        {t("add_event")}
      </button>
      <FormActions
        saving={saving}
        onReset={() => setEvents(TIMELINE_DEFAULTS)}
      />
    </form>
  );
}

// --- Accommodation ---
const ACCOMMODATION_DEFAULTS = {
  title: "Logements",
  subtitle: "Où dormir ?",
  description: "Pour profiter pleinement de la fête en toute sérénité, voici nos suggestions d'hébergements à proximité du domaine.",
  options: [
    { id: "1", type: "Hotel" as const, name: "Ibis Melun", distance: "À 15 minutes du domaine", description: "Hôtel confortable idéalement situé à Melun, avec navette disponible sur demande pour rejoindre le château.", url: "https://all.accor.com", urlLabel: "Réserver une chambre" },
    { id: "2", type: "House" as const, name: "Gîte de Maincy", distance: "À 5 minutes (village voisin)", description: "Idéal pour les familles ou groupes d'amis. Gîte spacieux avec 4 chambres au cœur du village de Maincy.", url: "https://airbnb.com", urlLabel: "Voir sur Airbnb" },
    { id: "3", type: "Hotel" as const, name: "Hôtel de la Brie", distance: "À 20 minutes", description: "Nous avons pré-réservé quelques chambres pour nos invités. Contactez-nous rapidement pour bloquer la vôtre." },
  ],
};

function AccommodationForm({
  config,
  onSave,
  onPreview,
}: {
  config: Record<string, unknown> | null;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onPreview?: (data: Record<string, unknown>) => void;
}) {
  const t = useTranslations("Modules");
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(str(config?.title, ACCOMMODATION_DEFAULTS.title));
  const [subtitle, setSubtitle] = useState(str(config?.subtitle, ACCOMMODATION_DEFAULTS.subtitle));
  const [description, setDescription] = useState(str(config?.description, ACCOMMODATION_DEFAULTS.description));
  const [options, setOptions] = useState<AccommodationOption[]>(() => {
    const raw = arr<AccommodationOption>(config?.options);
    return raw.length > 0 ? raw : ACCOMMODATION_DEFAULTS.options;
  });

  useEffect(() => {
    onPreview?.({ title, subtitle, description, options });
  }, [title, subtitle, description, options, onPreview]);

  function addOption() {
    setOptions([
      ...options,
      { id: genId(), type: "Hotel", name: "", distance: "", description: "", url: "", urlLabel: "" },
    ]);
  }

  function removeOption(id: string) {
    setOptions(options.filter((o) => o.id !== id));
  }

  function updateOption(id: string, field: keyof AccommodationOption, value: string) {
    setOptions(options.map((o) => (o.id === id ? { ...o, [field]: value } : o)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ title, subtitle, description, options });
    } finally {
      setSaving(false);
    }
  }

  const ACCOM_TYPES = ["Hotel", "House", "Camping", "Other"] as const;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup label={t("field_title")}>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </FieldGroup>
        <FieldGroup label={t("field_subtitle")}>
          <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        </FieldGroup>
      </div>
      <FieldGroup label={t("field_description")}>
        <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      </FieldGroup>

      <SectionHeader title={t("accommodation_options")} />
      <div className="space-y-4">
        {options.map((opt, idx) => (
          <div key={opt.id} className="bg-studio-creme border border-border/60 rounded-xl p-4 space-y-3 [&_input]:bg-white [&_textarea]:bg-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t("accommodation")} {idx + 1}
              </span>
              <button
                type="button"
                onClick={() => removeOption(opt.id)}
                className="text-muted-foreground hover:text-red-500 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <FieldGroup label={t("field_type")}>
              <div className="flex flex-wrap gap-2">
                {ACCOM_TYPES.map((at) => (
                  <button
                    key={at}
                    type="button"
                    onClick={() => updateOption(opt.id, "type", at)}
                    className={cn(
                      "px-3 py-1 rounded-full border text-xs font-bold transition-colors",
                      opt.type === at
                        ? "bg-primary/10 border-primary text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30"
                    )}
                  >
                    {t(`accom_type_${at.toLowerCase()}`)}
                  </button>
                ))}
              </div>
            </FieldGroup>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FieldGroup label={t("field_name")}>
                <Input value={opt.name} onChange={(e) => updateOption(opt.id, "name", e.target.value)} placeholder="Ibis Melun" />
              </FieldGroup>
              <FieldGroup label={t("field_distance")}>
                <Input value={opt.distance} onChange={(e) => updateOption(opt.id, "distance", e.target.value)} placeholder="À 15 min du domaine" />
              </FieldGroup>
            </div>
            <FieldGroup label={t("field_description")}>
              <Textarea rows={2} value={opt.description} onChange={(e) => updateOption(opt.id, "description", e.target.value)} />
            </FieldGroup>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FieldGroup label={t("field_url")}>
                <Input value={opt.url ?? ""} onChange={(e) => updateOption(opt.id, "url", e.target.value)} placeholder="https://..." />
              </FieldGroup>
              <FieldGroup label={t("field_url_label")}>
                <Input value={opt.urlLabel ?? ""} onChange={(e) => updateOption(opt.id, "urlLabel", e.target.value)} placeholder="Réserver une chambre" />
              </FieldGroup>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addOption}
        className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
      >
        <Plus size={16} />
        {t("add_accommodation")}
      </button>
      <FormActions
        saving={saving}
        onReset={() => {
          setTitle(ACCOMMODATION_DEFAULTS.title); setSubtitle(ACCOMMODATION_DEFAULTS.subtitle);
          setDescription(ACCOMMODATION_DEFAULTS.description); setOptions(ACCOMMODATION_DEFAULTS.options);
        }}
      />
    </form>
  );
}

// --- Transport ---
const TRANSPORT_ICONS: Record<string, React.ReactNode> = {
  Train: <Train size={14} />,
  Plane: <Plane size={14} />,
  Bus: <Bus size={14} />,
  Car: <Car size={14} />,
  Ship: <Ship size={14} />,
};

const TRANSPORT_DEFAULTS = {
  options: [
    { id: "trans-1", iconType: "Train" as const, title: "En Train", description: "Gare de Lyon → Melun en 35 min (Transilien R), puis taxi ou navette jusqu'au château (10 min)." },
    { id: "trans-2", iconType: "Car" as const, title: "En Voiture", description: "Depuis Paris : A6 direction Lyon, sortie Melun/Vaux-le-Vicomte. Parking gratuit et surveillé sur place." },
    { id: "trans-3", iconType: "Bus" as const, title: "Navettes Prévues", description: "Des navettes privées feront l'aller-retour depuis Paris 8e et les hôtels partenaires à 2h00, 3h30 et 5h00 du matin." },
  ],
  carpoolUrl: "https://togetzer.com/",
  carpoolLinkLabel: "Accéder au tableau",
  carpoolDescription: "Pour limiter notre empreinte écologique et faciliter les trajets, nous avons mis en place un tableau de covoiturage. N'hésitez pas à proposer ou chercher une place !",
};

function TransportForm({
  config,
  onSave,
  onPreview,
}: {
  config: Record<string, unknown> | null;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onPreview?: (data: Record<string, unknown>) => void;
}) {
  const t = useTranslations("Modules");
  const [saving, setSaving] = useState(false);
  const [options, setOptions] = useState<TransportOption[]>(() => {
    const raw = arr<TransportOption>(config?.options);
    return raw.length > 0 ? raw : TRANSPORT_DEFAULTS.options;
  });
  const [carpoolEnabled, setCarpoolEnabled] = useState(!!config?.carpoolUrl);
  const [carpoolUrl, setCarpoolUrl] = useState(str(config?.carpoolUrl, TRANSPORT_DEFAULTS.carpoolUrl));
  const [carpoolLinkLabel, setCarpoolLinkLabel] = useState(str(config?.carpoolLinkLabel, TRANSPORT_DEFAULTS.carpoolLinkLabel));
  const [carpoolDescription, setCarpoolDescription] = useState(str(config?.carpoolDescription, TRANSPORT_DEFAULTS.carpoolDescription));

  useEffect(() => {
    onPreview?.({ options, carpoolUrl: carpoolEnabled ? carpoolUrl : "", carpoolLinkLabel, carpoolDescription });
  }, [options, carpoolEnabled, carpoolUrl, carpoolLinkLabel, carpoolDescription, onPreview]);

  function addOption() {
    setOptions([...options, { id: genId(), iconType: "Car", title: "", description: "" }]);
  }

  function removeOption(id: string) {
    setOptions(options.filter((o) => o.id !== id));
  }

  function updateOption(id: string, field: keyof TransportOption, value: string) {
    setOptions(options.map((o) => (o.id === id ? { ...o, [field]: value } : o)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ options, carpoolUrl: carpoolEnabled ? carpoolUrl : "", carpoolLinkLabel, carpoolDescription });
    } finally {
      setSaving(false);
    }
  }

  const TRANSPORT_TYPES = ["Train", "Plane", "Bus", "Car", "Ship"] as const;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <SectionHeader title={t("transport_options")} />
      <div className="space-y-4">
        {options.map((opt, idx) => (
          <div key={opt.id} className="bg-studio-creme border border-border/60 rounded-xl p-4 space-y-3 [&_input]:bg-white [&_textarea]:bg-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t("transport")} {idx + 1}
              </span>
              <button
                type="button"
                onClick={() => removeOption(opt.id)}
                className="text-muted-foreground hover:text-red-500 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <FieldGroup label={t("field_icon")}>
              <div className="flex flex-wrap gap-2">
                {TRANSPORT_TYPES.map((tt) => (
                  <button
                    key={tt}
                    type="button"
                    onClick={() => updateOption(opt.id, "iconType", tt)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-colors",
                      opt.iconType === tt
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-white border-border text-muted-foreground hover:border-primary/30"
                    )}
                  >
                    {TRANSPORT_ICONS[tt]}
                    {t(`transport_type_${tt.toLowerCase()}`)}
                  </button>
                ))}
              </div>
            </FieldGroup>
            <FieldGroup label={t("field_event_title")}>
              <Input value={opt.title} onChange={(e) => updateOption(opt.id, "title", e.target.value)} placeholder="En Train" />
            </FieldGroup>
            <FieldGroup label={t("field_description")}>
              <Textarea rows={2} value={opt.description} onChange={(e) => updateOption(opt.id, "description", e.target.value)} />
            </FieldGroup>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addOption}
        className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
      >
        <Plus size={16} />
        {t("add_transport")}
      </button>

      <div className="flex items-center justify-between py-2">
        <SectionHeader title={t("carpool_section")} />
        <button
          type="button"
          onClick={() => setCarpoolEnabled(!carpoolEnabled)}
          className={cn(
            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
            carpoolEnabled ? "bg-primary" : "bg-muted-foreground/30"
          )}
        >
          <span className={cn(
            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200",
            carpoolEnabled ? "translate-x-4" : "translate-x-0"
          )} />
        </button>
      </div>
      {carpoolEnabled && (
        <div className="space-y-4">
          <FieldGroup label={t("field_carpool_url")}>
            <Input value={carpoolUrl} onChange={(e) => setCarpoolUrl(e.target.value)} placeholder="https://togetzer.com/..." />
          </FieldGroup>
          <FieldGroup label={t("field_carpool_label")}>
            <Input value={carpoolLinkLabel} onChange={(e) => setCarpoolLinkLabel(e.target.value)} placeholder="Accéder au tableau" />
          </FieldGroup>
          <FieldGroup label={t("field_carpool_description")}>
            <Textarea rows={2} value={carpoolDescription} onChange={(e) => setCarpoolDescription(e.target.value)} />
          </FieldGroup>
        </div>
      )}
      <FormActions
        saving={saving}
        onReset={() => {
          setOptions(TRANSPORT_DEFAULTS.options);
          setCarpoolEnabled(false);
          setCarpoolUrl(TRANSPORT_DEFAULTS.carpoolUrl);
          setCarpoolLinkLabel(TRANSPORT_DEFAULTS.carpoolLinkLabel);
          setCarpoolDescription(TRANSPORT_DEFAULTS.carpoolDescription);
        }}
      />
    </form>
  );
}

// --- Menu ---
const MENU_DEFAULTS = {
  sections: [
    { id: "sec-1", title: "Pour commencer", items: [{ title: "Velouté de butternut au lait de coco", description: "Éclats de châtaignes et huile de truffe" }] },
    { id: "sec-2", title: "Le Plat", items: [{ title: "Filet de bœuf Wellington", description: "Jus corsé au vin rouge, accompagné de sa mousseline de pommes de terre truffée et petits légumes glacés" }] },
    { id: "sec-3", title: "La Note Sucrée", items: [{ title: "Pièce montée traditionnelle" }, { title: "Farandole de mignardises" }] },
  ],
  dietaryNote: "Toutes nos viandes sont d'origine certifiée. En cas d'allergies, d'intolérances ou de régime spécifique (végétarien, halal, sans gluten), merci de le préciser lors de votre RSVP.",
  footer: ["Vins & Champagne inclus", "Café & Thé"],
};

function MenuForm({
  config,
  onSave,
  onPreview,
}: {
  config: Record<string, unknown> | null;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onPreview?: (data: Record<string, unknown>) => void;
}) {
  const t = useTranslations("Modules");
  const [saving, setSaving] = useState(false);
  const [sections, setSections] = useState<MenuSection[]>(() => {
    const raw = arr<MenuSection>(config?.sections);
    return raw.length > 0 ? raw : MENU_DEFAULTS.sections;
  });
  const [dietaryNote, setDietaryNote] = useState(str(config?.dietaryNote, MENU_DEFAULTS.dietaryNote));
  const [footer, setFooter] = useState<string[]>(() => {
    const raw = arr<string>(config?.footer);
    return raw.length > 0 ? raw : MENU_DEFAULTS.footer;
  });

  useEffect(() => {
    onPreview?.({ sections, dietaryNote, footer });
  }, [sections, dietaryNote, footer, onPreview]);

  function addSection() {
    setSections([...sections, { id: genId(), title: "", items: [{ title: "" }] }]);
  }

  function removeSection(id: string) {
    setSections(sections.filter((s) => s.id !== id));
  }

  function updateSection(id: string, title: string) {
    setSections(sections.map((s) => (s.id === id ? { ...s, title } : s)));
  }

  function addItem(sectionId: string) {
    setSections(
      sections.map((s) =>
        s.id === sectionId ? { ...s, items: [...s.items, { title: "", description: "" }] } : s
      )
    );
  }

  function removeItem(sectionId: string, itemIdx: number) {
    setSections(
      sections.map((s) =>
        s.id === sectionId ? { ...s, items: s.items.filter((_, i) => i !== itemIdx) } : s
      )
    );
  }

  function updateItem(
    sectionId: string,
    itemIdx: number,
    field: "title" | "description",
    value: string
  ) {
    setSections(
      sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              items: s.items.map((it, i) => (i === itemIdx ? { ...it, [field]: value } : it)),
            }
          : s
      )
    );
  }

  function updateFooterItem(idx: number, value: string) {
    setFooter(footer.map((f, i) => (i === idx ? value : f)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ sections, dietaryNote, footer });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <SectionHeader title={t("menu_sections")} />
      <div className="space-y-4">
        {sections.map((section, sIdx) => (
          <div key={section.id} className="bg-white border border-border rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <FieldGroup label={`${t("section")} ${sIdx + 1}`}>
                <Input
                  value={section.title}
                  onChange={(e) => updateSection(section.id, e.target.value)}
                  placeholder="Pour commencer"
                  className="mt-0"
                />
              </FieldGroup>
              {sections.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSection(section.id)}
                  className="text-muted-foreground hover:text-red-500 transition-colors ml-3 mt-5 shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <div className="space-y-2 pl-2 border-l-2 border-border">
              {section.items.map((item, iIdx) => (
                <div key={iIdx} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-1">
                    <Input
                      value={item.title}
                      onChange={(e) => updateItem(section.id, iIdx, "title", e.target.value)}
                      placeholder={t("menu_item_title_placeholder")}
                      className="text-sm"
                    />
                    <Input
                      value={item.description ?? ""}
                      onChange={(e) => updateItem(section.id, iIdx, "description", e.target.value)}
                      placeholder={t("menu_item_desc_placeholder")}
                      className="text-sm text-muted-foreground"
                    />
                  </div>
                  {section.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(section.id, iIdx)}
                      className="text-muted-foreground hover:text-red-500 transition-colors mt-2.5 shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addItem(section.id)}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
              >
                <Plus size={12} />
                {t("add_menu_item")}
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addSection}
        className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
      >
        <Plus size={16} />
        {t("add_section")}
      </button>

      <SectionHeader title={t("menu_footer")} />
      <div className="space-y-2">
        {footer.map((f, i) => (
          <Input
            key={i}
            value={f}
            onChange={(e) => updateFooterItem(i, e.target.value)}
            placeholder={t("menu_footer_placeholder")}
          />
        ))}
      </div>

      <FieldGroup label={t("field_dietary_note")}>
        <Textarea rows={3} value={dietaryNote} onChange={(e) => setDietaryNote(e.target.value)} />
      </FieldGroup>
      <FormActions
        saving={saving}
        onReset={() => {
          setSections(MENU_DEFAULTS.sections);
          setDietaryNote(MENU_DEFAULTS.dietaryNote);
          setFooter(MENU_DEFAULTS.footer);
        }}
      />
    </form>
  );
}

// --- FAQ ---
const FAQ_DEFAULTS = {
  title: "FAQ",
  subtitle: "Infos Pratiques",
  description: "Vous avez des questions ? Nous avons les réponses !",
  questions: [
    { id: "faq-1", question: "La cérémonie se déroulera-t-elle en extérieur ?", answer: "La cérémonie religieuse aura lieu dans la chapelle du château. Le vin d'honneur se tiendra dans les jardins (en cas de pluie, une tente est prévue)." },
    { id: "faq-2", question: "Les enfants sont-ils les bienvenus ?", answer: "Nous adorons vos enfants ! Les enfants de moins de 12 ans sont les bienvenus. Un espace kids avec baby-sitter sera disponible pendant le dîner." },
    { id: "faq-3", question: "Y a-t-il un parking sur place ?", answer: "Oui, un parking gratuit et surveillé est disponible sur le domaine. Comptez 10 min à pied depuis le parking jusqu'à la salle." },
  ],
};

function FaqForm({
  config,
  onSave,
  onPreview,
}: {
  config: Record<string, unknown> | null;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onPreview?: (data: Record<string, unknown>) => void;
}) {
  const t = useTranslations("Modules");
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(str(config?.title, FAQ_DEFAULTS.title));
  const [subtitle, setSubtitle] = useState(str(config?.subtitle, FAQ_DEFAULTS.subtitle));
  const [description, setDescription] = useState(str(config?.description, FAQ_DEFAULTS.description));
  const [questions, setQuestions] = useState<FaqItem[]>(() => {
    const raw = arr<FaqItem>(config?.questions);
    return raw.length > 0 ? raw : FAQ_DEFAULTS.questions;
  });

  useEffect(() => {
    onPreview?.({ title, subtitle, description, questions });
  }, [title, subtitle, description, questions, onPreview]);

  function addQuestion() {
    setQuestions([...questions, { id: genId(), question: "", answer: "" }]);
  }

  function removeQuestion(id: string) {
    setQuestions(questions.filter((q) => q.id !== id));
  }

  function updateQuestion(id: string, field: "question" | "answer", value: string) {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, [field]: value } : q)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ title, subtitle, description, questions });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup label={t("field_title")}>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </FieldGroup>
        <FieldGroup label={t("field_subtitle")}>
          <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        </FieldGroup>
      </div>
      <FieldGroup label={t("field_description")}>
        <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      </FieldGroup>

      <SectionHeader title={t("faq_questions")} />
      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-studio-creme border border-border/60 rounded-xl p-4 space-y-3 [&_input]:bg-white [&_textarea]:bg-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t("question")} {idx + 1}
              </span>
              <button
                type="button"
                onClick={() => removeQuestion(q.id)}
                className="text-muted-foreground hover:text-red-500 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <FieldGroup label={t("field_question")}>
              <Input value={q.question} onChange={(e) => updateQuestion(q.id, "question", e.target.value)} placeholder="La cérémonie se déroulera-t-elle en extérieur ?" />
            </FieldGroup>
            <FieldGroup label={t("field_answer")}>
              <Textarea rows={2} value={q.answer} onChange={(e) => updateQuestion(q.id, "answer", e.target.value)} />
            </FieldGroup>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addQuestion}
        className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
      >
        <Plus size={16} />
        {t("add_question")}
      </button>
      <FormActions
        saving={saving}
        onReset={() => {
          setTitle(FAQ_DEFAULTS.title); setSubtitle(FAQ_DEFAULTS.subtitle);
          setDescription(FAQ_DEFAULTS.description); setQuestions(FAQ_DEFAULTS.questions);
        }}
      />
    </form>
  );
}

// --- Gallery ---
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const MAX_IMAGES = 12;

function GalleryForm({
  config,
}: {
  config: Record<string, unknown> | null;
  onSave: (data: Record<string, unknown>) => Promise<void>;
}) {
  const [images, setImages] = useState<string[]>(() => arr<string>(config?.images));
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_IMAGES} photos`);
      return;
    }

    const toUpload = Array.from(files).slice(0, remaining);
    const invalid = toUpload.filter((f) => !ALLOWED_TYPES.includes(f.type) || f.size > MAX_FILE_SIZE);
    if (invalid.length > 0) {
      toast.error("Certains fichiers sont invalides (JPG/PNG, max 5 Mo)");
      return;
    }

    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of toUpload) {
        const fd = new FormData();
        fd.append("file", file);
        const { url } = await uploadGalleryImage(fd);
        urls.push(url);
      }
      const updated = [...images, ...urls];
      setImages(updated);
      await saveGalleryConfig(updated);
      toast.success(`${urls.length} photo${urls.length > 1 ? "s" : ""} ajoutée${urls.length > 1 ? "s" : ""}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur upload");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(url: string) {
    setSaving(true);
    try {
      await deleteGalleryImage(url);
      const updated = images.filter((u) => u !== url);
      setImages(updated);
      await saveGalleryConfig(updated);
      toast.success("Photo supprimée");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur suppression");
    } finally {
      setSaving(false);
    }
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = images.indexOf(active.id as string);
    const newIndex = images.indexOf(over.id as string);
    const updated = arrayMove(images, oldIndex, newIndex);
    setImages(updated);
    await saveGalleryConfig(updated);
  }

  return (
    <div className="space-y-6">
      {/* Upload zone */}
      <div
        className={cn(
          "border-2 border-dashed border-border rounded-xl p-8 text-center transition-colors cursor-pointer hover:border-primary/40 hover:bg-primary/5",
          images.length >= MAX_IMAGES && "opacity-50 cursor-not-allowed pointer-events-none"
        )}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
            <ImagePlus size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {uploading ? "Upload en cours..." : "Glisser des photos ou cliquer pour parcourir"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JPG, JPEG, PNG — max 5 Mo par photo — {images.length}/{MAX_IMAGES} photos
            </p>
          </div>
        </div>
      </div>

      {/* Photo grid with drag & drop */}
      {images.length > 0 && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <GripVertical size={12} className="shrink-0" />
          Glissez les photos pour modifier leur ordre d&apos;affichage.
        </p>
      )}
      {images.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={images} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {images.map((url, idx) => (
                <SortableGalleryItem
                  key={url}
                  url={url}
                  idx={idx}
                  onDelete={handleDelete}
                  saving={saving}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {images.length === 0 && (
        <p className="text-xs text-muted-foreground text-center">Aucune photo ajoutée — les photos de démonstration s&apos;afficheront sur le site.</p>
      )}
    </div>
  );
}

function SortableGalleryItem({
  url,
  idx,
  onDelete,
  saving,
}: {
  url: string;
  idx: number;
  onDelete: (url: string) => void;
  saving: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: url });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group aspect-square rounded-xl overflow-hidden border border-border bg-muted"
    >
      <Image
        src={url}
        alt={`Photo ${idx + 1}`}
        fill
        className="object-cover"
        sizes="150px"
      />
      {/* Drag handle overlay */}
      <div
        {...attributes}
        {...listeners}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors pointer-events-none" />
      <button
        type="button"
        onClick={() => onDelete(url)}
        disabled={saving}
        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 z-10"
      >
        <X size={12} />
      </button>
    </div>
  );
}

// ─── Main dispatcher ──────────────────────────────────────────────────────────

export function ModuleConfigForm({
  moduleId,
  initialConfig,
  onPreview,
}: {
  moduleId: string;
  initialConfig: Record<string, unknown> | null;
  onPreview?: (data: Record<string, unknown>) => void;
}) {
  const t = useTranslations("Modules");

  async function handleSave(data: Record<string, unknown>) {
    await updateModuleConfig({ moduleId, config: data });
    toast.success(t("saved"));
  }

  const props = { config: initialConfig, onSave: handleSave, onPreview };

  switch (moduleId) {
    case "dress-code":
      return <DressCodeForm {...props} />;
    case "rsvp":
      return <RsvpForm {...props} />;
    case "map":
      return <MapForm {...props} />;
    case "intro-video":
      return <IntroVideoForm {...props} />;
    case "gift-list":
      return <GiftListForm {...props} />;
    case "playlist":
      return <PlaylistForm {...props} />;
    case "timeline":
      return <TimelineForm {...props} />;
    case "accommodation":
      return <AccommodationForm {...props} />;
    case "transport":
      return <TransportForm {...props} />;
    case "menu":
      return <MenuForm {...props} />;
    case "faq":
      return <FaqForm {...props} />;
    case "gallery":
      return <GalleryForm {...props} />;
    default:
      return (
        <p className="text-sm text-muted-foreground">{t("no_config_needed")}</p>
      );
  }
}
