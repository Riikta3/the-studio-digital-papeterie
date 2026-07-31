"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Monitor, Smartphone, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@shared/lib/utils";
import {
  getAnimationDesktopWebp,
  getAnimationMobileVideo,
} from "./animations";

type Device = "desktop" | "mobile";

export function AnimationPreviewOverlay({
  animationId,
  animationName,
  initialDevice = "desktop",
  onClose,
  onSelect,
}: {
  animationId: string;
  animationName: string;
  initialDevice?: Device;
  onClose: () => void;
  onSelect: () => void;
}) {
  const t = useTranslations("StudioAnimation");
  const [device, setDevice] = useState<Device>(initialDevice);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Close on Escape and lock body scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (!mounted) return null;

  const desktopSrc = getAnimationDesktopWebp(animationId);
  const mobileSrc = getAnimationMobileVideo(animationId);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col bg-studio-violet/60 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-5 py-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-studio-violet transition-colors hover:bg-white"
        >
          <X className="h-5 w-5" />
        </button>

        <span className="font-heading text-sm text-white">{animationName}</span>

        <div className="flex items-center gap-1 rounded-full bg-white/90 p-1">
          {(["desktop", "mobile"] as Device[]).map((d) => {
            const Icon = d === "desktop" ? Monitor : Smartphone;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setDevice(d)}
                aria-label={d}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                  device === d
                    ? "bg-studio-violet text-white"
                    : "text-studio-violet/60 hover:text-studio-violet",
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Media */}
      <div
        className="flex flex-1 items-center justify-center overflow-hidden px-5 pb-5"
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={device}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "overflow-hidden rounded-2xl bg-white shadow-2xl",
              device === "mobile"
                ? "aspect-[9/16] h-full max-h-full"
                : "aspect-video w-full max-w-4xl",
            )}
          >
            {device === "mobile" && mobileSrc ? (
              <video
                src={mobileSrc}
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-cover"
              />
            ) : desktopSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={desktopSrc}
                alt={animationName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-studio-card-bg">
                <span className="font-body text-sm text-studio-violet/50">
                  {t("comingSoon")}
                </span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Select */}
      <div className="px-5 pb-8" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onSelect}
          className="mx-auto flex w-full max-w-sm items-center justify-center gap-2 rounded-full bg-studio-violet px-6 py-3.5 font-body text-sm font-semibold text-white transition-transform active:scale-95"
        >
          <Check className="h-4 w-4" />
          {animationName}
        </button>
      </div>
    </motion.div>,
    document.body,
  );
}
