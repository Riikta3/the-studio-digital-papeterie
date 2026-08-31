"use client";

import { cn } from "@shared/lib/utils";
import {
  BedDouble,
  Bus,
  Camera,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  Coffee,
  CreditCard,
  ExternalLink,
  Eye,
  Gift,
  Heart,
  Home,
  Hotel,
  MapPin,
  Minus,
  Music,
  Navigation,
  PenTool,
  Plane,
  Play,
  Plus,
  Search,
  Send,
  Shirt,
  Ship,
  Train,
  TentTree,
  Trash2,
  Utensils,
  Video,
  Wine,
  X,
} from "lucide-react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function str(val: unknown, fallback = ""): string {
  return typeof val === "string" ? val : fallback;
}
function arr<T>(val: unknown): T[] {
  return Array.isArray(val) ? (val as T[]) : [];
}

// ─── DressCode Preview ────────────────────────────────────────────────────────

function DressCodePreview({ config }: { config: Record<string, unknown> }) {
  const title = str(config.title, "Dress Code");
  const subtitle = str(config.subtitle, "Tenue de Soirée");
  const mode = str(config.mode, "global");
  const description = str(config.description, "Pour que la fête soit belle, nous vous invitons à porter une touche de vert sapin ou de doré.");
  const descriptionMen = str(config.description_men);
  const descriptionWomen = str(config.description_women);
  const isSplit = mode === "split" && (descriptionMen || descriptionWomen);

  return (
    <div className="text-center">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">{title}</p>
      <h3 className="font-heading text-4xl italic text-foreground mb-8">{subtitle}</h3>
      {isSplit ? (
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          <div className="bg-card rounded-[1.5rem] p-6 border border-border shadow-md flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center text-primary">
              <Shirt className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Homme</p>
            <p className="text-muted-foreground text-xs leading-relaxed font-light">{descriptionMen || "—"}</p>
          </div>
          <div className="bg-card rounded-[1.5rem] p-6 border border-border shadow-md flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center text-primary">
              <Shirt className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Femme</p>
            <p className="text-muted-foreground text-xs leading-relaxed font-light">{descriptionWomen || "—"}</p>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-[2rem] p-8 border border-border shadow-md max-w-sm mx-auto flex flex-col items-center">
          <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center mb-5 text-primary">
            <Shirt className="w-6 h-6 opacity-80" />
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed font-light">{description}</p>
        </div>
      )}
    </div>
  );
}

// ─── RSVP Preview ─────────────────────────────────────────────────────────────

const DIETARY_OPTIONS_FR = [
  "Végétarien", "Végétalien / Vegan", "Sans gluten", "Sans lactose",
  "Sans porc", "Sans fruits de mer", "Sans noix / Allergie noix", "Halal", "Casher", "Autre",
] as const;

function RsvpPreview({ config }: { config: Record<string, unknown> }) {
  const deadline = str(config.rsvp_deadline, "14 Novembre 2026");
  const [formData, setFormData] = useState({
    firstName: "", lastName: "",
    attendance: "" as "yes" | "no" | "",
    guests: "0", dietary: "", message: "",
  });

  return (
    <div className="text-center max-w-2xl mx-auto">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">Votre Présence</p>
      <h3 className="font-heading text-4xl italic text-foreground mb-8">R.S.V.P</h3>

      <div className="bg-card rounded-[2.5rem] p-8 border border-border shadow-xl text-left">
        <p className="text-muted-foreground text-sm leading-relaxed font-light mb-10 text-center max-w-md mx-auto">
          Nous serions honorés de vous compter parmi nous. Merci de confirmer votre présence avant le {deadline}.
        </p>

        <div className="space-y-8">
          {/* Prénom & Nom */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground ml-4">Prénom</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Jean"
                className="w-full bg-transparent border border-border/70 text-foreground placeholder:text-muted-foreground/40 rounded-full py-3.5 px-6 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/70 transition-all font-light text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground ml-4">Nom</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Dupont"
                className="w-full bg-transparent border border-border/70 text-foreground placeholder:text-muted-foreground/40 rounded-full py-3.5 px-6 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/70 transition-all font-light text-sm"
              />
            </div>
          </div>

          {/* Présence */}
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground ml-4">Confirmez-vous votre présence ?</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, attendance: "yes" })}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300",
                  formData.attendance === "yes" ? "bg-secondary border-primary shadow-sm" : "bg-card border-border hover:border-primary/30"
                )}
              >
                <div className={cn("w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0", formData.attendance === "yes" ? "bg-primary border-primary" : "border-border")}>
                  {formData.attendance === "yes" && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className={cn("text-sm tracking-wide", formData.attendance === "yes" ? "text-foreground font-medium" : "text-muted-foreground")}>
                  Oui, avec plaisir !
                </span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, attendance: "no" })}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300",
                  formData.attendance === "no" ? "bg-[#FFF9F9] border-[#D6A1A1] shadow-sm" : "bg-card border-border hover:border-primary/30"
                )}
              >
                <div className={cn("w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0", formData.attendance === "no" ? "bg-[#D6A1A1] border-[#D6A1A1]" : "border-border")}>
                  {formData.attendance === "no" && <X className="w-3 h-3 text-white" />}
                </div>
                <span className={cn("text-sm tracking-wide", formData.attendance === "no" ? "text-foreground font-medium" : "text-muted-foreground")}>
                  Non, avec regrets
                </span>
              </button>
            </div>
          </div>

          {/* Champs conditionnels si présent */}
          <AnimatePresence>
            {formData.attendance === "yes" && (
              <motion.div
                key="extra"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground ml-4">Nombre d'accompagnants</label>
                  <input
                    type="number" min={0}
                    value={formData.guests}
                    onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                    className="w-full bg-transparent border border-border/70 text-foreground rounded-full py-3.5 px-6 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-light text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground ml-4">Régime alimentaire & Allergies</label>
                  <div className="flex flex-wrap gap-2">
                    {DIETARY_OPTIONS_FR.map((opt) => {
                      const selected = formData.dietary.split(",").map((v) => v.trim()).includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            const current = formData.dietary.split(",").map((v) => v.trim()).filter(Boolean);
                            const next = selected ? current.filter((v) => v !== opt) : [...current, opt];
                            setFormData({ ...formData, dietary: next.join(", ") });
                          }}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-all duration-200",
                            selected ? "bg-primary/10 border-primary/50 text-primary font-medium" : "bg-transparent border-border/60 text-muted-foreground hover:border-primary/40"
                          )}
                        >
                          {selected && <Check className="w-3 h-3" />}
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Message */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground ml-4">Petit mot pour les mariés</label>
            <textarea
              rows={3}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Laissez-nous un message..."
              className="w-full bg-transparent border border-border/70 text-foreground placeholder:text-muted-foreground/40 rounded-3xl py-3.5 px-6 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/70 transition-all font-light resize-none text-sm"
            />
          </div>

          {/* Bouton */}
          <button
            type="button"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-full font-bold text-[10px] uppercase tracking-[0.3em] transition-all shadow-xl shadow-primary/10 flex items-center justify-center gap-2"
          >
            <span>Confirmer ma réponse</span>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Map Preview ──────────────────────────────────────────────────────────────

function MapPreview({ config }: { config: Record<string, unknown> }) {
  const name = str(config.name, "Château de Vaux-le-Vicomte");
  const address = str(config.address, "Allée Maincy, 77950 Maincy");
  const description = str(config.description);
  const imageUrl = str(config.imageUrl);
  const imageOrientation = str(config.imageOrientation, "landscape");
  const isPortrait = imageUrl && imageOrientation === "portrait";

  const MOCK_IMAGE = "https://images.unsplash.com/photo-1519225421980-715cb0215aed?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80";
  const displayImage = imageUrl || MOCK_IMAGE;
  const displayIsPortrait = displayImage && imageOrientation === "portrait";

  return (
    <div>
      <div className="text-center mb-10 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-primary">Lieu de Réception</h2>
        <h3 className="font-heading text-4xl italic">Accès</h3>
      </div>
      <div className={cn(
        "relative overflow-hidden bg-card/60 rounded-[3rem] border border-primary/10 flex flex-col",
        displayIsPortrait ? "flex-row" : ""
      )}>
        {/* Image portrait — côté gauche */}
        {displayIsPortrait && (
          <div className="relative w-2/5 shrink-0" style={{ minHeight: "200px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={displayImage} alt={name} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/20" />
          </div>
        )}

        {/* Image landscape — bandeau haut */}
        {!displayIsPortrait && (
          <div className="relative w-full h-48 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={displayImage} alt={name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent" />
          </div>
        )}

        {/* Contenu */}
        <div className={cn(
          "w-full p-8 flex flex-col gap-8 justify-between",
          displayIsPortrait ? "flex-1" : "md:flex-row items-center"
        )}>
          {/* Adresse */}
          <div className="space-y-5 flex-1">
            <h4 className="font-heading text-3xl text-foreground/90 leading-tight">{name}</h4>
            {description && (
              <p className="text-muted-foreground font-light text-sm leading-relaxed">{description}</p>
            )}
            <div className="pt-6 border-t border-primary/10">
              <p className="font-bold text-[10px] tracking-[0.2em] uppercase text-primary/70 flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-primary" />
                Adresse du domaine
              </p>
              <div className="text-foreground/90 text-sm leading-relaxed pl-6">
                {address.split(",").map((line, ix) => (
                  <span key={ix} className="block">{line.trim()}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Carte + bouton */}
          <div className="flex flex-col gap-4 w-full md:w-[280px] shrink-0">
            <div className="w-full h-36 rounded-3xl overflow-hidden border border-primary/20 shadow-sm bg-muted/30 relative">
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                className="absolute inset-0"
              />
            </div>
            <div className="w-full rounded-[2rem] border border-primary/30 flex items-center justify-center gap-3 py-3 px-5 text-xs font-bold uppercase tracking-widest text-foreground/90">
              <Navigation className="w-4 h-4 text-primary/80" />
              <span>Ouvrir dans Google Maps</span>
              <ExternalLink className="w-3 h-3 text-muted-foreground ml-1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── IntroVideo Preview ───────────────────────────────────────────────────────


function IntroVideoPreview({ config }: { config: Record<string, unknown> }) {
  const title = str(config.title, "Notre Histoire");
  const subtitle = str(config.subtitle, "Un petit mot pour vous");
  const description = str(config.description, "Avant le grand jour, nous tenions à vous adresser ce message...");
  const rawVideoUrl = str(config.videoUrl);
  const videoType = str(config.videoType, "embed");
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Reset cover quand l'URL change (nouveau fichier uploadé)
  const prevUrlRef = useRef(rawVideoUrl);
  useEffect(() => {
    if (prevUrlRef.current !== rawVideoUrl) {
      prevUrlRef.current = rawVideoUrl;
      setIsPlaying(false);
      setVideoError(false);
    }
  }, [rawVideoUrl]);

  // Copie exacte de la logique du landing
  const normalizeVideoUrl = (url: string): string => {
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
    const watchMatch = url.match(/youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
    return url;
  };

  const isUpload =
    videoType === "upload" ||
    /\.(mp4|webm|mov)(\?|$)/i.test(rawVideoUrl) ||
    rawVideoUrl.includes("/storage/v1/object/");

  const videoUrl = isUpload ? rawVideoUrl : normalizeVideoUrl(rawVideoUrl);

  if (!rawVideoUrl) return (
    <div className="text-center max-w-4xl mx-auto px-4">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">{title}</p>
      <h3 className="font-heading text-4xl italic text-foreground mb-4">{subtitle}</h3>
      <p className="text-muted-foreground text-sm max-w-2xl mx-auto leading-relaxed font-light mb-12">{description}</p>
      <div className="relative w-full max-w-3xl mx-auto aspect-video rounded-[2rem] overflow-hidden border border-border shadow-xl bg-secondary group">
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-card">
          <div className="absolute inset-0 opacity-[0.2]" style={{ backgroundImage: `linear-gradient(45deg, transparent 40%, rgba(108,122,110,0.1) 40%, rgba(108,122,110,0.1) 41%, transparent 41%), linear-gradient(-45deg, transparent 60%, rgba(108,122,110,0.1) 60%, rgba(108,122,110,0.1) 61%, transparent 61%)`, backgroundSize: "60px 60px" }} />
          <div className="relative z-10 w-20 h-20 bg-card/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm border border-border">
            <Play className="w-8 h-8 text-primary ml-1 opacity-80" strokeWidth={1} />
          </div>
          <span className="relative z-10 mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-70">Aucune vidéo configurée</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="text-center max-w-4xl mx-auto px-4">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">{title}</p>
      <h3 className="font-heading text-4xl italic text-foreground mb-4">{subtitle}</h3>
      <p className="text-muted-foreground text-sm max-w-2xl mx-auto leading-relaxed font-light mb-12">{description}</p>

      <div className="relative w-full max-w-3xl mx-auto aspect-video rounded-[2rem] overflow-hidden border border-border shadow-xl bg-secondary group">
        {!isPlaying ? (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer bg-card"
            onClick={() => setIsPlaying(true)}
          >
            <div
              className="absolute inset-0 opacity-[0.2]"
              style={{
                backgroundImage: `linear-gradient(45deg, transparent 40%, rgba(108,122,110,0.1) 40%, rgba(108,122,110,0.1) 41%, transparent 41%),
                                linear-gradient(-45deg, transparent 60%, rgba(108,122,110,0.1) 60%, rgba(108,122,110,0.1) 61%, transparent 61%)`,
                backgroundSize: "60px 60px",
                backgroundPosition: "center",
              }}
            />
            <div className="relative z-10 w-20 h-20 bg-card/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm border border-border group-hover:scale-110 transition-transform duration-500 ease-out">
              <Play className="w-8 h-8 text-primary ml-1 opacity-80" strokeWidth={1} />
            </div>
            <span className="relative z-10 mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-70">
              Lancer la vidéo
            </span>
          </div>
        ) : (
          <div className="absolute inset-0 bg-black">
            {isUpload ? (
              videoError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card px-6 text-center">
                  <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-1">
                    <Play className="w-6 h-6 text-primary/40 ml-1" strokeWidth={1} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Vidéo indisponible</p>
                  <p className="text-[11px] text-muted-foreground/70 font-light">La vidéo ne peut pas être chargée.<br/>Essayez de la télécharger à nouveau.</p>
                </div>
              ) : (
                <video
                  key={videoUrl}
                  src={videoUrl}
                  autoPlay
                  controls
                  controlsList="nodownload"
                  playsInline
                  className="absolute inset-0 w-full h-full object-contain"
                  onError={() => setVideoError(true)}
                />
              )
            ) : (
              <iframe
                src={videoUrl.includes("?") ? `${videoUrl}&autoplay=1` : `${videoUrl}?autoplay=1`}
                title="Vidéo des mariés"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── GiftList Preview ─────────────────────────────────────────────────────────

function GiftListPreview({ config }: { config: Record<string, unknown> }) {
  const description = str(config.description, "Votre présence à nos côtés est le plus beau des cadeaux.");
  const giftUrl = str(config.gift_list_url, "#");
  const giftLabel = str(config.gift_list_label, "Contribuer à notre projet");

  return (
    <div className="text-center">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">Cadeaux</p>
      <h3 className="font-heading text-4xl italic text-foreground mb-6">Liste de Mariage</h3>
      <div className="bg-card border border-border rounded-[2rem] p-8 max-w-xs mx-auto">
        <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center mx-auto mb-5 text-primary">
          <Gift className="w-6 h-6 opacity-90" />
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed font-light mb-6">{description}</p>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 rounded-2xl border border-border hover:border-primary transition-colors">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-primary">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs font-bold uppercase tracking-widest">Cagnotte en ligne</p>
              <p className="text-xs text-muted-foreground font-light">{giftLabel}</p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40" />
          </div>
          <div className="flex items-center gap-3 p-4 rounded-2xl border border-dashed border-border bg-muted/30">
            <div className="w-10 h-10 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground">
              <Heart className="w-4 h-4 opacity-60" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs font-bold uppercase tracking-widest">Urne sur place</p>
              <p className="text-xs text-muted-foreground font-light">Une urne sera disponible le jour J.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Playlist Preview ─────────────────────────────────────────────────────────

interface PlaylistTrack {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
}

function PlaylistPreview({ config }: { config: Record<string, unknown> }) {
  const title = str(config.title, "Musique");
  const subtitle = str(config.subtitle, "Playlist Collaborative");
  const description = str(config.description, "Aidez le DJ à préparer la soirée parfaite ! Recherchez et proposez jusqu'à 3 titres qui vous feront danser jusqu'au bout de la nuit.");

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<PlaylistTrack[]>([]);
  const [addedTracks, setAddedTracks] = useState<Map<string, PlaylistTrack>>(new Map());

  useEffect(() => {
    const controller = new AbortController();
    if (searchQuery.trim().length > 1) {
      setIsSearching(true);
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(searchQuery)}`, { signal: controller.signal });
          if (!res.ok) throw new Error();
          const json = await res.json();
          setResults(json.results || []);
        } catch (e: unknown) {
          if (e instanceof Error && e.name !== "AbortError") setResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 500);
      return () => { clearTimeout(timer); controller.abort(); };
    } else {
      setResults([]);
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleAdd = (track: PlaylistTrack) => {
    setAddedTracks((prev) => {
      if (prev.size >= 3) return prev;
      const next = new Map(prev);
      next.set(track.id, track);
      return next;
    });
  };

  const handleRemove = (id: string) => {
    setAddedTracks((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  };

  return (
    <div className="text-center max-w-2xl mx-auto">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">{title}</p>
      <h3 className="font-heading text-4xl italic text-foreground mb-8">{subtitle}</h3>

      <div className="bg-card rounded-[2rem] p-8 border border-border shadow-xl flex flex-col items-center">
        <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center mb-6 text-primary shrink-0">
          <Music className="w-6 h-6 opacity-80" />
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed font-light mb-8">{description}</p>

        {/* Search */}
        <div className="w-full relative">
          <div className="relative flex items-center">
            <Search className="absolute left-5 w-4 h-4 text-muted-foreground opacity-60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un titre, un artiste..."
              className="w-full bg-card border border-border text-foreground placeholder:text-muted-foreground/50 rounded-full py-3.5 pl-12 pr-6 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/60 transition-all font-light shadow-sm hover:border-primary/30 disabled:bg-secondary disabled:cursor-not-allowed disabled:opacity-70 text-sm"
            />
            {isSearching && (
              <div className="absolute right-5 top-1/2 -translate-y-1/2 flex gap-1">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            )}
          </div>

          {/* Results */}
          {results.length > 0 && !isSearching && (
            <div className="w-full mt-4 bg-muted/50 rounded-2xl border border-border overflow-hidden">
              <ul className="divide-y divide-border">
                {results.map((track) => {
                  const isAdded = addedTracks.has(track.id);
                  return (
                    <li key={track.id} className="flex items-center gap-3 p-3 hover:bg-secondary transition-colors">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={track.coverUrl} alt={track.title} className="w-10 h-10 rounded-lg object-cover shadow-sm shrink-0" />
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-semibold text-foreground truncate text-sm">{track.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                      </div>
                      <button
                        onClick={() => isAdded ? handleRemove(track.id) : handleAdd(track)}
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0",
                          isAdded
                            ? "bg-primary text-primary-foreground"
                            : "bg-card border border-border text-primary hover:border-primary/30 hover:bg-secondary"
                        )}
                      >
                        {isAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4 opacity-70" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Added tracks */}
        {addedTracks.size > 0 && (
          <div className="w-full mt-8">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground mb-4 text-left pl-2">
              Titres proposés ({addedTracks.size}/3)
            </p>
            <div className="flex flex-col gap-2">
              {Array.from(addedTracks.values()).map((track) => (
                <div key={track.id} className="flex items-center gap-3 bg-muted border border-border p-3 rounded-2xl hover:bg-card hover:border-primary/30 transition-all">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={track.coverUrl} alt={track.title} className="w-10 h-10 rounded-lg object-cover shadow-sm shrink-0" />
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{track.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                  </div>
                  <button
                    onClick={() => handleRemove(track.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-red-100 hover:text-red-500 transition-all bg-secondary shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Timeline Preview ─────────────────────────────────────────────────────────

interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  location: string;
  description: string;
}

function TimelinePreview({ config }: { config: Record<string, unknown> }) {
  const events = arr<TimelineEvent>(config.events).length > 0
    ? arr<TimelineEvent>(config.events)
    : [
        { id: "1", time: "15:00", title: "Cérémonie Civile", location: "Mairie du 8e, Paris", description: "Merci d'arriver 15 min en avance." },
        { id: "2", time: "17:30", title: "Vin d'Honneur", location: "Jardins du Château", description: "Cocktails et petits fours dans les jardins." },
        { id: "3", time: "20:00", title: "Dîner & Soirée", location: "Grande Salle du Château", description: "Le bal s'ouvre avec la première danse." },
      ];

  return (
    <div>
      <div className="text-center mb-10 space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Programme</p>
        <h3 className="font-heading text-4xl italic text-foreground">Le Jour J</h3>
      </div>
      <div className="relative max-w-sm mx-auto">
        {/* Ligne verticale — même position que le vrai module mobile */}
        <div className="absolute left-[3rem] top-4 bottom-4 w-px bg-primary/20 z-0" />
        <div className="space-y-12">
          {events.map((event) => (
            <div key={event.id} className="relative flex items-center">
              {/* Badge heure centré sur la ligne */}
              <div className="absolute left-0 flex items-center justify-center z-10 w-24 bg-studio-creme py-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary border border-border bg-card px-4 py-1.5 rounded-full shadow-[0_2px_10px_-3px_rgba(0,0,0,0.04)]">
                  {event.time}
                </span>
              </div>
              {/* Card */}
              <div className="w-full pl-28">
                <div className="bg-card border border-border shadow-xl p-6 rounded-[2rem]">
                  <h4 className="font-heading text-2xl text-foreground mb-2">{event.title}</h4>
                  {event.description && (
                    <p className="text-muted-foreground font-light text-[13px] leading-relaxed mb-3">{event.description}</p>
                  )}
                  {event.location && (
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-primary/50 shrink-0 mt-0.5" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground leading-tight">{event.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Accommodation Preview ────────────────────────────────────────────────────

interface AccomOption {
  id: string;
  type: "Hotel" | "House" | "Camping" | "Other";
  name: string;
  distance: string;
  description: string;
  url?: string;
  urlLabel?: string;
}

function AccomIcon({ type }: { type: string }) {
  switch (type) {
    case "Hotel": return <Hotel className="w-5 h-5" />;
    case "House": return <Home className="w-5 h-5" />;
    case "Camping": return <TentTree className="w-5 h-5" />;
    default: return <BedDouble className="w-5 h-5" />;
  }
}

function AccommodationPreview({ config }: { config: Record<string, unknown> }) {
  const title = str(config.title, "Logements");
  const subtitle = str(config.subtitle, "Où dormir ?");
  const description = str(config.description, "Pour profiter pleinement de la fête en toute sérénité, voici nos suggestions d'hébergements à proximité du domaine.");
  const options = arr<AccomOption>(config.options).length > 0
    ? arr<AccomOption>(config.options)
    : [
        { id: "1", type: "Hotel" as const, name: "Ibis Melun", distance: "À 15 minutes du domaine", description: "Hôtel confortable idéalement situé à Melun, avec navette disponible sur demande pour rejoindre le château.", url: "https://all.accor.com", urlLabel: "Réserver une chambre" },
        { id: "2", type: "House" as const, name: "Gîte de Maincy", distance: "À 5 minutes (village voisin)", description: "Idéal pour les familles ou groupes d'amis. Gîte spacieux avec 4 chambres au cœur du village de Maincy.", url: "https://airbnb.com", urlLabel: "Voir sur Airbnb" },
        { id: "3", type: "Hotel" as const, name: "Hôtel de la Brie", distance: "À 20 minutes", description: "Nous avons pré-réservé quelques chambres pour nos invités. Contactez-nous rapidement pour bloquer la vôtre." },
      ];

  return (
    <div>
      <div className="text-center mb-16 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{title}</h2>
        <h3 className="font-heading text-4xl italic text-foreground">{subtitle}</h3>
        <p className="text-muted-foreground text-sm max-w-2xl mx-auto leading-relaxed font-light">{description}</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {options.map((opt, index) => (
          <div
            key={opt.id}
            className="bg-card rounded-[2rem] p-8 border border-border shadow-xl flex flex-col h-full group hover:border-primary/30 transition-colors"
          >
            <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center mb-6 text-primary">
              <AccomIcon type={opt.type} />
            </div>
            <h4 className="font-heading text-3xl text-foreground mb-3 leading-tight">{opt.name}</h4>
            <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
              <MapPin className="w-3.5 h-3.5 opacity-70" /> {opt.distance}
            </div>
            <p className="text-muted-foreground text-[14px] leading-relaxed font-light mb-8 flex-grow">{opt.description}</p>
            {opt.url && (
              <div className="pt-2 mt-auto">
                <a
                  href={opt.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full rounded-full h-auto py-3.5 px-4 flex items-center justify-center gap-2 whitespace-normal text-center text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] border border-border bg-card text-muted-foreground hover:bg-muted hover:text-primary hover:border-primary/30 transition-all"
                >
                  <span>{opt.urlLabel || "VOIR SUR LE SITE"}</span>
                  <ExternalLink className="w-3 h-3 opacity-60 flex-shrink-0" />
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Transport Preview ────────────────────────────────────────────────────────

interface TransportOption {
  id: string;
  iconType: "Train" | "Plane" | "Bus" | "Car" | "Ship";
  title: string;
  description: string;
}

function TransportIcon({ type }: { type: string }) {
  switch (type) {
    case "Train": return <Train className="w-5 h-5 text-primary" strokeWidth={1.5} />;
    case "Plane": return <Plane className="w-5 h-5 text-primary" strokeWidth={1.5} />;
    case "Bus": return <Bus className="w-5 h-5 text-primary" strokeWidth={1.5} />;
    case "Car": return <Car className="w-5 h-5 text-primary" strokeWidth={1.5} />;
    case "Ship": return <Ship className="w-5 h-5 text-primary" strokeWidth={1.5} />;
    default: return <Car className="w-5 h-5 text-primary" strokeWidth={1.5} />;
  }
}

function TransportPreview({ config }: { config: Record<string, unknown> }) {
  const options = arr<TransportOption>(config.options).length > 0
    ? arr<TransportOption>(config.options)
    : [
        { id: "1", iconType: "Train" as const, title: "En Train", description: "Gare de Lyon → Melun en 35 min (Transilien R), puis taxi ou navette jusqu'au château (10 min)." },
        { id: "2", iconType: "Car" as const, title: "En Voiture", description: "Depuis Paris : A6 direction Lyon, sortie Melun/Vaux-le-Vicomte. Parking gratuit et surveillé sur place." },
        { id: "3", iconType: "Bus" as const, title: "Navettes Prévues", description: "Des navettes privées feront l'aller-retour depuis Paris 8e et les hôtels partenaires." },
      ];
  const carpoolUrl = str(config.carpoolUrl);
  const carpoolLabel = str(config.carpoolLinkLabel, "Accéder au tableau");
  const carpoolDesc = str(config.carpoolDescription);

  return (
    <div>
      <div className="text-center mb-10 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Logistique</h2>
        <h3 className="font-heading text-4xl italic text-foreground">Votre Trajet</h3>
      </div>

      <div className="grid md:grid-cols-12 gap-6 max-w-5xl mx-auto">
        {/* Options transport */}
        {options.length > 0 && (
          <div className={cn("flex flex-col gap-4", carpoolUrl ? "md:col-span-7" : "col-span-12")}>
            {options.map((opt) => (
              <div
                key={opt.id}
                className="flex flex-col sm:flex-row gap-6 items-start sm:items-center bg-card p-8 rounded-[2rem] border border-border shadow-xl hover:border-primary/30 transition-colors duration-300"
              >
                <div className="w-14 h-14 bg-muted/40 rounded-full flex items-center justify-center shrink-0 border border-primary/10">
                  <TransportIcon type={opt.iconType} />
                </div>
                <div className="flex flex-col justify-center">
                  <h4 className="font-heading text-2xl text-foreground mb-2">{opt.title}</h4>
                  <p className="text-muted-foreground font-light text-sm leading-relaxed">{opt.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bloc covoiturage */}
        {carpoolUrl && (
          <div className={cn(
            "relative overflow-hidden bg-secondary rounded-[2.5rem] border border-border shadow-lg flex flex-col items-center text-center p-10",
            options.length > 0 ? "md:col-span-5" : "col-span-12 max-w-md mx-auto w-full"
          )}>
            {/* Motif décoratif */}
            <div
              className="absolute inset-0 opacity-[0.15] pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(45deg, transparent 40%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.1) 41%, transparent 41%),
                                linear-gradient(-45deg, transparent 60%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.1) 61%, transparent 61%),
                                linear-gradient(0deg, transparent 70%, rgba(0,0,0,0.1) 70%, rgba(0,0,0,0.1) 71%, transparent 71%)`,
                backgroundSize: "300px 300px",
                backgroundPosition: "center",
              }}
            />
            <div className="relative z-10 w-full flex flex-col items-center h-full">
              <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center shadow-sm border border-border mb-8">
                <Car className="w-6 h-6 text-primary" strokeWidth={1.5} />
              </div>
              <h4 className="font-heading text-3xl text-foreground mb-5">Covoiturage</h4>
              <p className="text-muted-foreground font-light text-sm leading-relaxed mb-8 max-w-[260px]">
                {carpoolDesc}
              </p>
              <div className="w-full flex justify-center mt-auto">
                <a
                  href={carpoolUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full py-3 px-7 text-[10px] font-bold uppercase tracking-[0.15em] border border-border bg-card text-muted-foreground hover:bg-muted hover:text-primary hover:border-primary/30 transition-all flex items-center gap-2 shadow-sm"
                >
                  <span>{carpoolLabel}</span>
                  <ExternalLink className="w-3 h-3 opacity-60 shrink-0" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Menu Preview ─────────────────────────────────────────────────────────────

interface MenuSection {
  id: string;
  title: string;
  items: { title: string; description?: string }[];
}

function MenuPreview({ config }: { config: Record<string, unknown> }) {
  const sections = arr<MenuSection>(config.sections).length > 0
    ? arr<MenuSection>(config.sections)
    : [
        { id: "1", title: "Pour commencer", items: [{ title: "Velouté de butternut", description: "Éclats de châtaignes et huile de truffe" }] },
        { id: "2", title: "Le Plat", items: [{ title: "Filet de bœuf Wellington" }] },
        { id: "3", title: "La Note Sucrée", items: [{ title: "Pièce montée traditionnelle" }] },
      ];
  const dietaryNote = str(config.dietaryNote);
  const footer = arr<string>(config.footer).length > 0 ? arr<string>(config.footer) : ["Vins & Champagne inclus", "Café & Thé"];

  return (
    <div>
      <div className="text-center mb-8 space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Gastronomie</p>
        <h3 className="font-heading text-4xl italic text-foreground">Le Menu</h3>
      </div>
      <div className="relative max-w-2xl mx-auto">
        {/* Cadre décoratif extérieur */}
        <div className="absolute inset-0 bg-white border border-primary/20 rounded-t-full rounded-b-[4rem] shadow-sm" />
        {/* Cadre décoratif intérieur */}
        <div className="absolute inset-4 border border-primary/10 rounded-t-full rounded-b-[3.5rem] pointer-events-none" />
        {/* Contenu par-dessus les cadres */}
        <div className="relative px-8 py-20 text-center">
          <Utensils className="w-10 h-10 text-primary mx-auto mb-16 opacity-70 stroke-[1.5]" />
          <div className="space-y-16">
            {sections.map((section) => (
              <div key={section.id} className="group">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/70 mb-6 flex items-center justify-center gap-4">
                  <span className="w-8 h-[1px] bg-primary/20" />
                  {section.title}
                  <span className="w-8 h-[1px] bg-primary/20" />
                </h4>
                <div className="space-y-8">
                  {section.items.map((item, i) => (
                    <div key={i}>
                      <p className="font-heading text-3xl text-foreground/90 leading-tight px-4 mb-2">{item.title}</p>
                      {item.description && <p className="italic text-muted-foreground font-light text-base max-w-sm mx-auto">{item.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {footer.length > 0 && (
            <div className="mt-20 pt-8 border-t border-border/40 flex items-center justify-center gap-6 text-xs tracking-widest uppercase text-muted-foreground/80 font-semibold">
              {footer.map((note, i) => (
                <div key={i} className="flex items-center gap-2">
                  {i === 0 ? <Wine className="w-4 h-4 text-primary/70" /> : <Coffee className="w-4 h-4 text-primary/70" />}
                  <span>{note}</span>
                </div>
              ))}
            </div>
          )}
          {dietaryNote && (
            <div className="mt-20 mx-auto max-w-lg p-8 bg-card/40 rounded-2xl border border-primary/10 shadow-sm">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/80 mb-4">Note du Chef / Régimes Spéciaux</h4>
              <p className="text-sm font-light text-muted-foreground/90 italic leading-relaxed">{dietaryNote}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── FAQ Preview ──────────────────────────────────────────────────────────────

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

function FaqPreview({ config }: { config: Record<string, unknown> }) {
  const questions = arr<FaqItem>(config.questions).length > 0
    ? arr<FaqItem>(config.questions)
    : [
        { id: "1", question: "La cérémonie se déroulera-t-elle en extérieur ?", answer: "Le vin d'honneur et le dîner se dérouleront dans les jardins du château." },
        { id: "2", question: "Les enfants sont-ils les bienvenus ?", answer: "Oui ! Un espace kids avec baby-sitter sera disponible pendant le dîner." },
      ];
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div>
      <div className="text-center mb-8">
        <h3 className="font-heading text-4xl text-foreground">
          Questions <span className="italic text-primary opacity-80">Fréquentes</span>
        </h3>
      </div>
      <div className="space-y-3">
        {questions.map((faq, index) => (
          <div key={faq.id} className="bg-card rounded-[1.25rem] border border-border overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="flex w-full items-center justify-between p-5 text-left hover:bg-muted transition-colors"
            >
              <span className="font-heading text-lg text-foreground pr-4 leading-snug">{faq.question}</span>
              <div className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all",
                openIndex === index ? "bg-primary border-primary text-primary-foreground" : "border-primary/30 text-primary"
              )}>
                {openIndex === index ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3 opacity-70" />}
              </div>
            </button>
            <AnimatePresence>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <div className="px-5 pb-5">
                    <div className="h-px w-full bg-border mb-4" />
                    <p className="text-muted-foreground text-sm leading-relaxed font-light">{faq.answer}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Gallery Preview ──────────────────────────────────────────────────────────

const MOCK_GALLERY = [
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1600",
  "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=1600",
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1600",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80&w=1600",
  "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=1600",
  "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&q=80&w=1600",
];

const carouselVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

const lightboxSlideVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

function GalleryPreview({ config }: { config: Record<string, unknown> }) {
  const rawImages = arr<string>(config.images);
  const images = (rawImages.length > 0 ? rawImages : MOCK_GALLERY).slice(0, 12);
  const isMock = rawImages.length === 0;
  const count = images.length;

  const [[current, direction], setCurrent] = useState([0, 0]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const paginate = (newDirection: number) => {
    setCurrent(([prev]) => [(((prev + newDirection) % count) + count) % count, newDirection]);
  };

  const goTo = (index: number) => {
    setCurrent([index, index > current ? 1 : -1]);
  };

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) paginate(diff > 0 ? 1 : -1);
    touchStartX.current = null;
  };

  useEffect(() => {
    if (count <= 1 || paused || lightboxOpen) return;
    const interval = setInterval(() => paginate(1), 4000);
    return () => clearInterval(interval);
  }, [count, paused, lightboxOpen, current]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") paginate(-1);
      if (e.key === "ArrowRight") paginate(1);
      if (e.key === "Escape") setLightboxOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [count]);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div>
      <div className="text-center mb-10 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Souvenirs</h2>
        <h3 className="font-heading text-4xl italic text-foreground">Galerie</h3>
        {isMock && <p className="text-xs text-muted-foreground/60">Photos de démonstration</p>}
      </div>

      <div
        className="relative group"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Counter */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1">
          <span className="text-white font-bold text-xs tracking-[0.2em]">{pad(current + 1)}</span>
          <span className="text-white/40 text-xs">/</span>
          <span className="text-white/50 text-xs tracking-[0.15em]">{pad(count)}</span>
        </div>

        {/* Main image */}
        <div
          className="relative w-full aspect-[4/3] rounded-[2rem] overflow-hidden bg-card border border-border shadow-2xl cursor-zoom-in"
          onClick={() => setLightboxOpen(true)}
        >
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              variants={carouselVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${images[current]})` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Arrows */}
        {count > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); paginate(-1); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white opacity-0 group-hover:opacity-100 hover:bg-white/25 transition-all duration-300"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); paginate(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white opacity-0 group-hover:opacity-100 hover:bg-white/25 transition-all duration-300"
            >
              <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </>
        )}
      </div>

      {/* Line indicators */}
      {count > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="relative h-[2px] rounded-full overflow-hidden transition-all duration-300"
              style={{ width: i === current ? 32 : 16 }}
            >
              <span className="absolute inset-0 bg-border" />
              {i === current && (
                <motion.span layoutId="gallery-indicator" className="absolute inset-0 bg-primary" transition={{ duration: 0.3 }} />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Thumbnails */}
      {count > 1 && (
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 justify-center">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={cn(
                "relative shrink-0 w-14 h-14 rounded-xl overflow-hidden transition-all duration-300",
                i === current ? "ring-2 ring-primary ring-offset-2 shadow-md scale-105" : "opacity-50 hover:opacity-80"
              )}
            >
              <div className="absolute inset-0 bg-cover bg-top" style={{ backgroundImage: `url(${src})` }} />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/92 backdrop-blur-md"
            onClick={() => setLightboxOpen(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900/70 text-white hover:bg-zinc-900 transition-all z-50"
            >
              <X className="w-5 h-5" strokeWidth={2} />
            </button>
            <div className="absolute top-6 left-1/2 -translate-x-1/2 text-white text-xs tracking-[0.25em] font-medium select-none bg-zinc-900/70 rounded-full px-3 py-1">
              {pad(current + 1)} / {pad(count)}
            </div>
            {count > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); paginate(-1); }}
                  className="absolute left-3 z-50 w-12 h-12 flex items-center justify-center rounded-full bg-zinc-900/70 text-white hover:bg-zinc-900 transition-all"
                >
                  <ChevronLeft className="w-6 h-6" strokeWidth={2} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); paginate(1); }}
                  className="absolute right-3 z-50 w-12 h-12 flex items-center justify-center rounded-full bg-zinc-900/70 text-white hover:bg-zinc-900 transition-all"
                >
                  <ChevronRight className="w-6 h-6" strokeWidth={2} />
                </button>
              </>
            )}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={current}
                  custom={direction}
                  variants={lightboxSlideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="absolute flex items-center justify-center w-full h-full px-20"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={images[current]}
                    alt={`Photo ${current + 1}`}
                    className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl select-none"
                    draggable={false}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
            {count > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-50">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); goTo(i); }}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-300",
                      i === current ? "bg-white scale-125" : "bg-white/40 hover:bg-white/70"
                    )}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

// ─── Guestbook Preview ────────────────────────────────────────────────────────

function GuestbookPreview() {
  return (
    <div className="text-center">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">
        Livre d'Or
      </p>
      <h3 className="font-heading text-4xl italic text-foreground mb-8">Un mot doux</h3>

      <div className="bg-card rounded-[2rem] p-8 border border-border shadow-xl">
        <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6 text-primary opacity-80">
          <PenTool className="w-6 h-6" />
        </div>

        <p className="text-muted-foreground text-sm leading-relaxed font-light mb-8 max-w-xs mx-auto">
          Laissez une petite trace de votre passage. Vos messages seront gardés précieusement et transmis uniquement aux mariés.
        </p>

        <div className="space-y-4 text-left">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground ml-4">Votre Nom</label>
            <div className="w-full bg-muted/50 border border-border rounded-full py-3 px-6 text-sm text-muted-foreground/40 font-light">
              Comment devons-nous vous appeler ?
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground ml-4">Votre Message</label>
            <div className="w-full bg-muted/50 border border-border rounded-[1.25rem] py-4 px-6 text-sm text-muted-foreground/40 font-light h-24">
              Écrivez votre mot doux ici...
            </div>
          </div>
          <div className="w-full bg-primary/80 text-primary-foreground py-4 rounded-full font-bold text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-2">
            Envoyer mon message
            <Send className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── VideoGuestbook Preview ───────────────────────────────────────────────────

function VideoGuestbookPreview() {
  return (
    <div className="text-center">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">
        Souvenir Inoubliable
      </p>
      <h3 className="font-heading text-4xl text-foreground mb-8">
        Livre d'Or <span className="italic text-primary opacity-80">Vidéo</span>
      </h3>

      <div className="bg-card rounded-[2rem] p-8 border border-border shadow-xl">
        <div className="space-y-6">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto text-primary">
            <Camera className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-xs mx-auto">
            <p className="text-muted-foreground text-sm leading-relaxed font-light">
              Laissez-nous un petit mot, une anecdote ou vos vœux directement en vidéo.
            </p>
            <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-muted-foreground/50">
              Capture directe ou upload (Max 50Mo)
            </p>
          </div>

          <div className="relative aspect-[9/16] max-w-[160px] mx-auto rounded-[1.5rem] overflow-hidden border-4 border-muted bg-muted flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground/30">
              <Video className="w-10 h-10" />
              <span className="text-[10px] uppercase tracking-widest font-bold">Vidéo</span>
            </div>
          </div>

          <div className="w-full bg-primary/80 text-primary-foreground py-4 rounded-full font-bold text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-2">
            Cliquer pour Enregistrer
          </div>
        </div>

        <p className="mt-8 text-[10px] text-muted-foreground/40 italic">
          Votre vidéo sera envoyée en privé uniquement aux futurs mariés.
        </p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ModulePreviewProps {
  moduleId: string;
  config: Record<string, unknown>;
}

export function ModulePreview({ moduleId, config }: ModulePreviewProps) {
  const t = useTranslations("Modules");

  function renderContent() {
    switch (moduleId) {
      case "dress-code": return <DressCodePreview config={config} />;
      case "rsvp": return <RsvpPreview config={config} />;
      case "map": return <MapPreview config={config} />;
      case "intro-video": return <IntroVideoPreview config={config} />;
      case "gift-list": return <GiftListPreview config={config} />;
      case "playlist": return <PlaylistPreview config={config} />;
      case "timeline": return <TimelinePreview config={config} />;
      case "accommodation": return <AccommodationPreview config={config} />;
      case "transport": return <TransportPreview config={config} />;
      case "menu": return <MenuPreview config={config} />;
      case "faq": return <FaqPreview config={config} />;
      case "gallery": return <GalleryPreview config={config} />;
      case "guestbook": return <GuestbookPreview />;
      case "video-guestbook": return <VideoGuestbookPreview />;
      default: return null;
    }
  }

  const content = renderContent();
  if (!content) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4 px-1">
        <Eye size={14} className="text-muted-foreground" />
        <span className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
          {t("live_preview")}
        </span>
      </div>
      <div className="flex-1 theme-floral bg-background rounded-2xl border border-border overflow-y-auto">
        <div className="py-10 px-5 w-full [&>div]:w-full">
          {content}
        </div>
      </div>
    </div>
  );
}
