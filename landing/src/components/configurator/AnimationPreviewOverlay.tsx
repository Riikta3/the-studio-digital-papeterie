"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, Check, Monitor, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Asset path helpers ────────────────────────────────────────────────────────

interface AssetEntry {
  category: string;
  variant: string;
  fileSlug: string; // slug used in actual filenames
}

const ANIMATION_ASSET_MAP: Record<string, AssetEntry> = {
  "door-floral":        { category: "doors",   variant: "floral",     fileSlug: "porte-florale"   },
  "door-royal":         { category: "doors",   variant: "royal",      fileSlug: "porte-royal"     },
  "door-classic":       { category: "doors",   variant: "classic",    fileSlug: "porte-classic"   },
  "door-authentic":     { category: "doors",   variant: "authentic",  fileSlug: "porte-authentic" },
  "door-modern":        { category: "doors",   variant: "modern",     fileSlug: "porte-modern"    },
  "envelope-classic":   { category: "envelop", variant: "classic",    fileSlug: "envelop-classic" },
  "envelope-kraft":     { category: "envelop", variant: "kraft",      fileSlug: "envelop-kraft"   },
  "envelope-luxury":    { category: "envelop", variant: "luxury",     fileSlug: "envelop-luxury"  },
  "envelope-vintage":   { category: "envelop", variant: "vintage",    fileSlug: "envelop-vintage" },
  "curtain-velvet":     { category: "curtain", variant: "velvet",     fileSlug: "rideau-velvet"   },
  "curtain-linen":      { category: "curtain", variant: "linen",      fileSlug: "rideau-linen"    },
  "curtain-silk":       { category: "curtain", variant: "silk",       fileSlug: "rideau-silk"     },
  "book-leather":       { category: "book",    variant: "leather",    fileSlug: "book-leather"    },
  "book-floral":        { category: "book",    variant: "floral",     fileSlug: "book-floral"     },
  "book-modern":        { category: "book",    variant: "modern",     fileSlug: "book-modern"     },
  "floral-roses":       { category: "floral",  variant: "roses",      fileSlug: "floral-roses"    },
  "floral-wildflower":  { category: "floral",  variant: "wildflower", fileSlug: "floral-wildflower" },
  "floral-peony":       { category: "floral",  variant: "peony",      fileSlug: "floral-peony"    },
};

function assetEntry(animationId: string): AssetEntry | null {
  return ANIMATION_ASSET_MAP[animationId] ?? null;
}

/** Returns the static preview image path (PNG) or null if not mapped. */
export function getAnimationPreview(animationId: string): string | null {
  const entry = assetEntry(animationId);
  if (!entry) return null;
  return `/videos/animation/${entry.category}/${entry.variant}/preview/animation-${entry.fileSlug}-preview.png`;
}

/**
 * Returns frame paths for canvas animation (desktop webp).
 * Single-file animated webp → frames.length === 1.
 * Returns frames: [] when no asset exists (triggers placeholder in AnimationCard).
 */
export function getAnimationFrames(animationId: string): { frames: string[]; fps: number } {
  const entry = assetEntry(animationId);
  if (!entry) return { frames: [], fps: 24 };
  return {
    frames: [`/videos/animation/${entry.category}/${entry.variant}/desktop/animation-${entry.fileSlug}-desktop.webp`],
    fps: 24,
  };
}

function getMobileVideo(animationId: string): string | null {
  const entry = assetEntry(animationId);
  if (!entry) return null;
  return `/videos/animation/${entry.category}/${entry.variant}/mobile/animation-${entry.fileSlug}-mobile.mp4`;
}

function getDesktopWebp(animationId: string): string | null {
  const entry = assetEntry(animationId);
  if (!entry) return null;
  return `/videos/animation/${entry.category}/${entry.variant}/desktop/animation-${entry.fileSlug}-desktop.webp`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export interface AnimationPreviewOverlayProps {
  animationId: string;
  animationName: string;
  initialDevice?: "mobile" | "desktop";
  onClose: () => void;
  onSelect: () => void;
}

export function AnimationPreviewOverlay({
  animationId,
  animationName,
  initialDevice = "desktop",
  onClose,
  onSelect,
}: AnimationPreviewOverlayProps) {
  const [device, setDevice] = useState<"mobile" | "desktop">(initialDevice);

  const mobileVideo = getMobileVideo(animationId);
  const desktopWebp = getDesktopWebp(animationId);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleSelect = () => {
    onSelect();
    onClose();
  };

  return (
    <>
      {/* ── MOBILE : Bottom Sheet ──────────────────────────────────────────── */}
      <div className="md:hidden fixed inset-0 z-[9999]">
        {/* Scrim */}
        <motion.div
          className="absolute inset-0 bg-foreground/30 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Sheet */}
        <motion.div
          className="absolute bottom-0 inset-x-0 bg-card rounded-t-[24px] overflow-hidden shadow-[0_-8px_32px_rgba(0,0,0,0.08)]"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-9 h-1 rounded-full bg-border" />
          </div>

          {/* Header */}
          <div className="flex items-center px-4 py-2 gap-3">
            <span className="flex-1 text-[15px] font-bold truncate">{animationName}</span>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
              aria-label="Fermer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Device pills */}
          <div className="flex gap-2 px-4 pb-3">
            <button
              onClick={() => setDevice("mobile")}
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-[12px] font-semibold transition-all",
                device === "mobile"
                  ? "bg-foreground border-foreground text-background"
                  : "bg-card border-border text-muted-foreground",
              )}
            >
              <Smartphone className="w-3 h-3" />
              Mobile
            </button>
            <button
              onClick={() => setDevice("desktop")}
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-[12px] font-semibold transition-all",
                device === "desktop"
                  ? "bg-foreground border-foreground text-background"
                  : "bg-card border-border text-muted-foreground",
              )}
            >
              <Monitor className="w-3.5 h-3.5" />
              Desktop
            </button>
          </div>

          {/* Preview area */}
          <div className="mx-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={device}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className={cn(
                  "w-full rounded-xl bg-muted overflow-hidden flex items-center justify-center",
                  device === "mobile" ? "aspect-[9/14]" : "aspect-[16/9]",
                )}
              >
                {device === "mobile" && mobileVideo ? (
                  <video
                    key={mobileVideo}
                    src={mobileVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : device === "desktop" && desktopWebp ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={desktopWebp}
                    alt={animationName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 opacity-30">
                    <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center">
                      <svg className="w-4 h-4 text-foreground" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5,3 19,12 5,21" />
                      </svg>
                    </div>
                    <span className="text-[10px] text-muted-foreground">Bientôt disponible</span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex gap-2 px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-5 py-3 rounded-full border border-border text-[13px] font-bold text-muted-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
              Retour
            </button>
            <button
              onClick={handleSelect}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-full bg-primary text-primary-foreground text-[13px] font-bold"
            >
              <Check className="w-4 h-4" />
              Choisir cette animation
            </button>
          </div>
        </motion.div>
      </div>

      {/* ── DESKTOP : Modal centrée ────────────────────────────────────────── */}
      <div className="hidden md:flex fixed inset-0 z-[9999] items-center justify-center p-8">
        {/* Scrim */}
        <motion.div
          className="absolute inset-0 bg-foreground/20 backdrop-blur-[3px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="relative bg-card rounded-[20px] border border-border shadow-[0_24px_64px_rgba(0,0,0,0.12)] overflow-hidden w-full max-w-3xl"
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border/60">
            <span className="flex-1 text-[16px] font-bold">{animationName}</span>

            {/* Device toggle */}
            <div className="flex bg-muted rounded-[10px] p-[3px] gap-0.5">
              <button
                onClick={() => setDevice("desktop")}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] text-[12px] font-semibold transition-all",
                  device === "desktop"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground",
                )}
              >
                <Monitor className="w-3.5 h-3.5" />
                Desktop
              </button>
              <button
                onClick={() => setDevice("mobile")}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] text-[12px] font-semibold transition-all",
                  device === "mobile"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground",
                )}
              >
                <Smartphone className="w-3 h-3" />
                Mobile
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-border transition-colors"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Video zone */}
          <AnimatePresence mode="wait">
            <motion.div
              key={device}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "w-full bg-muted flex items-center justify-center overflow-hidden",
                device === "desktop" ? "aspect-[16/9]" : "",
              )}
              style={device === "mobile" ? { height: 480 } : undefined}
            >
              {device === "mobile" && mobileVideo ? (
                <video
                  key={mobileVideo}
                  src={mobileVideo}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="h-full w-auto object-cover rounded"
                  style={{ aspectRatio: "9/16" }}
                />
              ) : device === "desktop" && desktopWebp ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={desktopWebp}
                  alt={animationName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 opacity-30">
                  <div className="w-12 h-12 rounded-full bg-foreground/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-foreground" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5,3 19,12 5,21" />
                    </svg>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Bientôt disponible</span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Footer */}
          <div className="flex items-center gap-3 px-5 py-4 border-t border-border/60">
            <span className="flex-1 text-[13px] text-muted-foreground">
              Animation : <strong className="text-foreground font-bold">{animationName}</strong>
            </span>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-border text-[13px] font-bold text-muted-foreground hover:border-foreground/30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Retour
            </button>
            <button
              onClick={handleSelect}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-[13px] font-bold"
            >
              <Check className="w-4 h-4" />
              Choisir cette animation
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
