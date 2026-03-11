"use client";

import { updateModuleConfig } from "@/actions/module-config-actions";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Textarea } from "@shared/components/ui/textarea";
import { cn } from "@shared/lib/utils";
import {
  Bus,
  Car,
  Plane,
  Plus,
  Ship,
  Train,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
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
}: {
  config: Record<string, unknown> | null;
  onSave: (data: Record<string, unknown>) => Promise<void>;
}) {
  const DEFAULTS = {
    title: "Dress Code",
    subtitle: "Tenue de Soirée",
    description: "Pour que la fête soit belle, nous vous invitons à porter une touche de vert sapin ou de doré dans vos tenues.",
  };
  const t = useTranslations("Modules");
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(str(config?.title, DEFAULTS.title));
  const [subtitle, setSubtitle] = useState(str(config?.subtitle, DEFAULTS.subtitle));
  const [description, setDescription] = useState(str(config?.description, DEFAULTS.description));

  function resetToDefaults() {
    setTitle(DEFAULTS.title);
    setSubtitle(DEFAULTS.subtitle);
    setDescription(DEFAULTS.description);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ title, subtitle, description });
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
        <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
      </FieldGroup>
      <FormActions saving={saving} onReset={resetToDefaults} />
    </form>
  );
}

// --- RSVP ---
function RsvpForm({
  config,
  onSave,
}: {
  config: Record<string, unknown> | null;
  onSave: (data: Record<string, unknown>) => Promise<void>;
}) {
  const t = useTranslations("Modules");
  const [saving, setSaving] = useState(false);
  const [deadline, setDeadline] = useState(str(config?.rsvp_deadline));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ rsvp_deadline: deadline });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FieldGroup label={t("field_rsvp_deadline")}>
        <Input
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          placeholder="ex: 14 Novembre 2026"
        />
        <p className="text-xs text-muted-foreground">{t("field_rsvp_deadline_hint")}</p>
      </FieldGroup>
      <FormActions saving={saving} onReset={() => setDeadline("")} />
    </form>
  );
}

// --- Map ---
function MapForm({
  config,
  onSave,
}: {
  config: Record<string, unknown> | null;
  onSave: (data: Record<string, unknown>) => Promise<void>;
}) {
  const t = useTranslations("Modules");
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(str(config?.name));
  const [address, setAddress] = useState(str(config?.address));
  const [description, setDescription] = useState(str(config?.description));
  const [imageUrl, setImageUrl] = useState(str(config?.imageUrl));
  const [imageOrientation, setImageOrientation] = useState<"portrait" | "landscape">(
    strAs<"portrait" | "landscape">(config?.imageOrientation, "landscape")
  );

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
      <FieldGroup label={t("field_image_url")}>
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
          setName(""); setAddress(""); setDescription(""); setImageUrl(""); setImageOrientation("landscape");
        }}
      />
    </form>
  );
}

// --- IntroVideo ---
function IntroVideoForm({
  config,
  onSave,
}: {
  config: Record<string, unknown> | null;
  onSave: (data: Record<string, unknown>) => Promise<void>;
}) {
  const t = useTranslations("Modules");
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(str(config?.title, "Notre Histoire"));
  const [subtitle, setSubtitle] = useState(str(config?.subtitle, "Un petit mot pour vous"));
  const [description, setDescription] = useState(str(config?.description));
  const [videoUrl, setVideoUrl] = useState(str(config?.videoUrl));
  const [videoType, setVideoType] = useState<"embed" | "upload">(
    strAs<"embed" | "upload">(config?.videoType, "embed")
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ title, subtitle, description, videoUrl, videoType });
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
      <FieldGroup label={t("field_video_type")}>
        <div className="flex gap-3">
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
              {t(`video_type_${vt}`)}
            </button>
          ))}
        </div>
      </FieldGroup>
      <FieldGroup label={t("field_video_url")}>
        <Input
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder={videoType === "embed" ? "https://www.youtube.com/embed/..." : "https://...mp4"}
        />
        <p className="text-xs text-muted-foreground">{t(`video_url_hint_${videoType}`)}</p>
      </FieldGroup>
      <FormActions
        saving={saving}
        onReset={() => {
          setTitle("Notre Histoire"); setSubtitle("Un petit mot pour vous");
          setDescription(""); setVideoUrl(""); setVideoType("embed");
        }}
      />
    </form>
  );
}

// --- GiftList ---
function GiftListForm({
  config,
  onSave,
}: {
  config: Record<string, unknown> | null;
  onSave: (data: Record<string, unknown>) => Promise<void>;
}) {
  const t = useTranslations("Modules");
  const [saving, setSaving] = useState(false);
  const [description, setDescription] = useState(
    str(config?.description, "Votre présence à nos côtés est le plus beau des cadeaux. Si vous souhaitez toutefois nous accompagner dans nos futurs projets ou notre voyage de noces, vous trouverez ci-dessous les options pour participer.")
  );
  const [giftListUrl, setGiftListUrl] = useState(str(config?.gift_list_url));
  const [giftListLabel, setGiftListLabel] = useState(str(config?.gift_list_label, "Contribuer à notre projet"));

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
}: {
  config: Record<string, unknown> | null;
  onSave: (data: Record<string, unknown>) => Promise<void>;
}) {
  const t = useTranslations("Modules");
  const [saving, setSaving] = useState(false);
  const [description, setDescription] = useState(
    str(config?.description, "Aidez le DJ à préparer la soirée parfaite ! Recherchez et proposez jusqu'à 3 titres qui vous feront danser jusqu'au bout de la nuit.")
  );

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
function TimelineForm({
  config,
  onSave,
}: {
  config: Record<string, unknown> | null;
  onSave: (data: Record<string, unknown>) => Promise<void>;
}) {
  const t = useTranslations("Modules");
  const [saving, setSaving] = useState(false);
  const [events, setEvents] = useState<TimelineEvent[]>(() => {
    const raw = arr<TimelineEvent>(config?.events);
    return raw.length > 0
      ? raw
      : [{ id: genId(), time: "15:00", title: "Cérémonie", location: "", description: "" }];
  });

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
          <div key={event.id} className="bg-[#FDFBF7] border border-border/60 rounded-xl p-4 space-y-3 [&_input]:bg-white [&_textarea]:bg-white">
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
        onReset={() => setEvents([{ id: genId(), time: "15:00", title: "Cérémonie", location: "", description: "" }])}
      />
    </form>
  );
}

// --- Accommodation ---
function AccommodationForm({
  config,
  onSave,
}: {
  config: Record<string, unknown> | null;
  onSave: (data: Record<string, unknown>) => Promise<void>;
}) {
  const t = useTranslations("Modules");
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(str(config?.title, "Logements"));
  const [subtitle, setSubtitle] = useState(str(config?.subtitle, "Où dormir ?"));
  const [description, setDescription] = useState(str(config?.description));
  const [options, setOptions] = useState<AccommodationOption[]>(() => arr<AccommodationOption>(config?.options));

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
          <div key={opt.id} className="bg-[#FDFBF7] border border-border/60 rounded-xl p-4 space-y-3 [&_input]:bg-white [&_textarea]:bg-white">
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
        onReset={() => { setTitle("Logements"); setSubtitle("Où dormir ?"); setDescription(""); setOptions([]); }}
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

function TransportForm({
  config,
  onSave,
}: {
  config: Record<string, unknown> | null;
  onSave: (data: Record<string, unknown>) => Promise<void>;
}) {
  const t = useTranslations("Modules");
  const [saving, setSaving] = useState(false);
  const [options, setOptions] = useState<TransportOption[]>(() => arr<TransportOption>(config?.options));
  const [carpoolUrl, setCarpoolUrl] = useState(str(config?.carpoolUrl));
  const [carpoolLinkLabel, setCarpoolLinkLabel] = useState(str(config?.carpoolLinkLabel, "Accéder au tableau"));
  const [carpoolDescription, setCarpoolDescription] = useState(str(config?.carpoolDescription));

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
      await onSave({ options, carpoolUrl, carpoolLinkLabel, carpoolDescription });
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
          <div key={opt.id} className="bg-[#FDFBF7] border border-border/60 rounded-xl p-4 space-y-3 [&_input]:bg-white [&_textarea]:bg-white">
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
                        : "border-border text-muted-foreground hover:border-primary/30"
                    )}
                  >
                    {TRANSPORT_ICONS[tt]}
                    {tt}
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

      <SectionHeader title={t("carpool_section")} />
      <FieldGroup label={t("field_carpool_url")}>
        <Input value={carpoolUrl} onChange={(e) => setCarpoolUrl(e.target.value)} placeholder="https://togetzer.com/..." />
      </FieldGroup>
      <FieldGroup label={t("field_carpool_label")}>
        <Input value={carpoolLinkLabel} onChange={(e) => setCarpoolLinkLabel(e.target.value)} placeholder="Accéder au tableau" />
      </FieldGroup>
      <FieldGroup label={t("field_carpool_description")}>
        <Textarea rows={2} value={carpoolDescription} onChange={(e) => setCarpoolDescription(e.target.value)} />
      </FieldGroup>
      <FormActions
        saving={saving}
        onReset={() => { setOptions([]); setCarpoolUrl(""); setCarpoolLinkLabel("Accéder au tableau"); setCarpoolDescription(""); }}
      />
    </form>
  );
}

// --- Menu ---
function MenuForm({
  config,
  onSave,
}: {
  config: Record<string, unknown> | null;
  onSave: (data: Record<string, unknown>) => Promise<void>;
}) {
  const t = useTranslations("Modules");
  const [saving, setSaving] = useState(false);
  const [sections, setSections] = useState<MenuSection[]>(() => {
    const raw = arr<MenuSection>(config?.sections);
    return raw.length > 0 ? raw : [{ id: genId(), title: "Pour commencer", items: [{ title: "", description: "" }] }];
  });
  const [dietaryNote, setDietaryNote] = useState(str(config?.dietaryNote));
  const [footer, setFooter] = useState<string[]>(() => {
    const raw = arr<string>(config?.footer);
    return raw.length > 0 ? raw : ["Vins & Champagne inclus", "Café & Thé"];
  });

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
          setSections([{ id: genId(), title: "Pour commencer", items: [{ title: "", description: "" }] }]);
          setDietaryNote(""); setFooter(["Vins & Champagne inclus", "Café & Thé"]);
        }}
      />
    </form>
  );
}

// --- FAQ ---
function FaqForm({
  config,
  onSave,
}: {
  config: Record<string, unknown> | null;
  onSave: (data: Record<string, unknown>) => Promise<void>;
}) {
  const t = useTranslations("Modules");
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(str(config?.title, "FAQ"));
  const [subtitle, setSubtitle] = useState(str(config?.subtitle, "Infos Pratiques"));
  const [description, setDescription] = useState(str(config?.description));
  const [questions, setQuestions] = useState<FaqItem[]>(() => arr<FaqItem>(config?.questions));

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
          <div key={q.id} className="bg-[#FDFBF7] border border-border/60 rounded-xl p-4 space-y-3 [&_input]:bg-white [&_textarea]:bg-white">
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
        onReset={() => { setTitle("FAQ"); setSubtitle("Infos Pratiques"); setDescription(""); setQuestions([]); }}
      />
    </form>
  );
}

// ─── Main dispatcher ──────────────────────────────────────────────────────────

export function ModuleConfigForm({
  moduleId,
  initialConfig,
}: {
  moduleId: string;
  initialConfig: Record<string, unknown> | null;
}) {
  const t = useTranslations("Modules");

  async function handleSave(data: Record<string, unknown>) {
    await updateModuleConfig({ moduleId, config: data });
    toast.success(t("saved"));
  }

  const props = { config: initialConfig, onSave: handleSave };

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
    default:
      return (
        <p className="text-sm text-muted-foreground">{t("no_config_needed")}</p>
      );
  }
}
