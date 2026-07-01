"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function AnimationCard({
  id,
  name,
  desc,
  isSelected,
  previewImg,
  frames,
  fps = 24,
  categoryIcon,
  onSelect,
  onPreview,
}: {
  id: string;
  name: string;
  desc: string;
  isSelected: boolean;
  previewImg: string | null;
  frames: string[];
  fps?: number;
  categoryIcon: React.ReactNode;
  onSelect: () => void;
  onPreview: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const frameRef = useRef<number>(0);
  const [isHovered, setIsHovered] = useState(false);
  const [framesLoaded, setFramesLoaded] = useState(false);
  const isPlaying = useRef(false);

  const hasAnimation = frames.length > 1;

  // Preload frames
  useEffect(() => {
    if (!hasAnimation) return;
    let count = 0;
    imagesRef.current = frames.map((src) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        count++;
        if (count === frames.length) setFramesLoaded(true);
      };
      return img;
    });
  }, [frames.join(","), hasAnimation]);

  // Draw frame
  function drawFrame(index: number) {
    const canvas = canvasRef.current;
    const img = imagesRef.current[index];
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = img.naturalWidth || 800;
    canvas.height = img.naturalHeight || 600;
    ctx.drawImage(img, 0, 0);
  }

  function startAnimation() {
    if (isPlaying.current) return;
    isPlaying.current = true;
    frameRef.current = 0;
    const interval = 1000 / fps;

    const loop = (time: number) => {
      if (!isPlaying.current) return;
      if (time - lastTimeRef.current >= interval) {
        lastTimeRef.current = time;
        drawFrame(frameRef.current);
        frameRef.current++;
        if (frameRef.current >= frames.length) {
          // Loop back
          frameRef.current = 0;
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }

  function stopAnimation() {
    isPlaying.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    frameRef.current = 0;
  }

  useEffect(() => {
    if (!hasAnimation || !framesLoaded) return;
    if (isHovered) {
      startAnimation();
    } else {
      stopAnimation();
    }
    return () => stopAnimation();
  }, [isHovered, framesLoaded, hasAnimation]);

  return (
    <div
      className={cn(
        "rounded-[20px] border-2 bg-card overflow-hidden transition-all duration-200 cursor-pointer",
        isSelected
          ? "border-primary shadow-[0_0_0_4px_rgba(124,45,62,0.08),0_8px_24px_rgba(124,45,62,0.12)]"
          : "border-border/50 shadow-sm hover:border-primary/30",
      )}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Preview area */}
      <div className={cn(
        "relative flex items-center justify-center overflow-hidden",
        previewImg || hasAnimation ? "aspect-[4/5]" : "h-[180px] md:h-[220px] bg-primary/5",
      )}>

        {/* Static preview image (shown when not animating) */}
        {previewImg && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewImg}
            alt={name}
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
              hasAnimation && isHovered && framesLoaded ? "opacity-0" : "opacity-100",
            )}
          />
        )}

        {/* Canvas for animation (shown on hover) */}
        {hasAnimation && (
          <canvas
            ref={canvasRef}
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
              isHovered && framesLoaded ? "opacity-100" : "opacity-0",
            )}
          />
        )}

        {/* Fallback icon when no preview */}
        {!previewImg && !hasAnimation && (
          <>
            <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:18px_18px]" />
            <span className="relative z-10 opacity-15 scale-[2.5] text-foreground">
              {categoryIcon}
            </span>
          </>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onPreview(); }}
          className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap text-[11px] font-bold text-primary px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-primary/20 shadow-sm font-sans"
        >
          ▶ Voir la démo
        </button>
      </div>

      {/* Footer */}
      <div className="p-3.5 border-t border-border/30">
        <h3 className="font-bold text-[14px] mb-0.5">{name}</h3>
        <p className="text-[11px] text-muted-foreground font-sans line-clamp-1 mb-3">{desc}</p>
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          className={cn(
            "w-full py-2.5 rounded-full text-[12px] font-bold font-sans border-2 transition-colors",
            isSelected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-primary bg-transparent text-primary hover:bg-primary/5",
          )}
        >
          {isSelected ? "✓ Sélectionné" : "Choisir"}
        </button>
      </div>
    </div>
  );
}
