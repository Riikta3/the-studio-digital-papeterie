"use client";

import {
  ANIMATION_SEQUENCES,
  THEME_HERO_ASSETS,
  type AnimationKey,
  type ThemeKey,
} from "@/components/landing/product-demo-viewer";
import { useLocale } from "next-intl";
import { useEffect, useRef, useState } from "react";

const THEME_KEY_MAP: Record<string, ThemeKey> = {
  "theme-floral": "floral",
  "theme-minimalist": "minimalist",
  "theme-boho": "boho",
  "theme-royal": "royal",
  "theme-travel": "travel",
};

const DEFAULT_ANIMATION: AnimationKey = "envelope";
const DEMO_CODE = "demo-envelope";

interface ThemeDemoOverlayProps {
  themeId: string;
  themeName: string;
  onClose: () => void;
  onSelect: () => void;
}

export function ThemeDemoOverlay({
  themeId,
  themeName,
  onClose,
  onSelect,
}: ThemeDemoOverlayProps) {
  const locale = useLocale();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);

  const themeKey = THEME_KEY_MAP[themeId] ?? "floral";
  const iframeSrc = `/${locale}/invitation/${DEMO_CODE}?demo=true&device=mobile`;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const sendTheme = () => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage(
      {
        type: "SET_THEME",
        theme: themeKey,
        device: "mobile",
        heroAsset: THEME_HERO_ASSETS[themeKey],
        animationSequence: ANIMATION_SEQUENCES[DEFAULT_ANIMATION],
      },
      window.location.origin,
    );
  };

  const handleLoad = () => {
    setLoading(false);
    setTimeout(sendTheme, 100);
  };

  return (
    <div className='fixed inset-0 z-[9999] flex flex-col bg-background'>
      {/* Top bar */}
      <div className='flex items-center justify-between px-4 h-[52px] border-b border-border/40 bg-background/90 backdrop-blur-md flex-shrink-0'>
        <button
          onClick={onClose}
          className='flex items-center gap-1.5 text-sm font-bold text-primary font-sans'
        >
          ‹ Retour
        </button>
        <span className='text-sm font-bold text-foreground font-sans truncate px-2'>
          Prévisualisation — {themeName}
        </span>
        <div className='w-16' />
      </div>

      {/* Iframe */}
      <div className='flex-1 relative overflow-hidden'>
        {loading && (
          <div className='absolute inset-0 flex items-center justify-center bg-background z-10'>
            <div className='w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin' />
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          className='w-full h-full border-none block'
          title={`Démo ${themeName}`}
          onLoad={handleLoad}
        />
      </div>

      {/* Bottom bar */}
      <div className='flex gap-3 px-4 py-3 bg-background/90 backdrop-blur-md flex-shrink-0'>
        <button
          onClick={onClose}
          className='px-5 py-3 rounded-full border border-border text-sm text-muted-foreground font-sans'
        >
          Retour
        </button>
        <button
          onClick={() => {
            onSelect();
            onClose();
          }}
          className='flex-1 py-3 rounded-full bg-primary text-primary-foreground text-sm font-bold font-sans'
        >
          ✓ Choisir ce thème
        </button>
      </div>
    </div>
  );
}
