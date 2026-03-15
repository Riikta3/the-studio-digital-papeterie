"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface HeroBackgroundProps {
  /** Number of frames in the sequence (0 = no sequence, show fallback) */
  frames: number;
  /** Base path of the sequence without index or extension. Ex: "/videos/demo/themes/test/Bohemian Bird Video_" */
  sequencePath: string | null;
  /** Fallback photo URL when no sequence available */
  fallbackUrl?: string;
  /** If true, plays in infinite slow loop (demo ambiance mode). If false, plays once. */
  loop?: boolean;
}

const DEFAULT_FALLBACK =
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=2000";

/** Duration between frames in ms for loop mode (~12fps for smooth cinematic effect) */
const LOOP_FRAME_DURATION = 80;

function getFrameSrc(basePath: string, index: number): string {
  return `${basePath}${String(index).padStart(3, "0")}.webp`;
}

export function HeroBackground({
  frames,
  sequencePath,
  fallbackUrl = DEFAULT_FALLBACK,
  loop = false,
}: HeroBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const rafRef = useRef<number | null>(null);
  const [ready, setReady] = useState(false);

  const drawFrame = useCallback((index: number) => {
    const canvas = canvasRef.current;
    const img = framesRef.current[index];
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: cw, height: ch } = canvas;
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const sw = img.naturalWidth * scale;
    const sh = img.naturalHeight * scale;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, (cw - sw) / 2, (ch - sh) / 2, sw, sh);
  }, []);

  useEffect(() => {
    if (!sequencePath || frames === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth || window.innerWidth;
    canvas.height = canvas.offsetHeight || window.innerHeight;

    let loaded = 0;
    let loopStarted = false;

    function startLoop() {
      if (loopStarted) return;
      loopStarted = true;
      let currentFrame = 0;
      let lastTime = 0;

      const tick = (now: number) => {
        if (lastTime === 0) lastTime = now;
        if (now - lastTime >= LOOP_FRAME_DURATION) {
          if (framesRef.current[currentFrame]) {
            drawFrame(currentFrame);
          }
          lastTime = now;
          currentFrame = (currentFrame + 1) % frames;
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    }

    for (let i = 0; i < frames; i++) {
      const img = new Image();
      const idx = i;
      img.onload = () => {
        framesRef.current[idx] = img;
        loaded++;
        if (loaded === 1) {
          drawFrame(0);
          setReady(true);
        }
        if (loaded === frames && loop) {
          startLoop();
        }
      };
      img.onerror = () => {
        loaded++;
      };
      img.src = getFrameSrc(sequencePath, i);
    }

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      framesRef.current = [];
    };
  }, [sequencePath, frames, loop, drawFrame]);

  // Fallback: static image
  if (!sequencePath || frames === 0) {
    return (
      <div
        className="absolute inset-0 bg-cover bg-center z-0 scale-105"
        style={{ backgroundImage: `url('${fallbackUrl}')` }}
      />
    );
  }

  return (
    <>
      {/* Fallback visible until canvas is ready */}
      {!ready && (
        <div
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{ backgroundImage: `url('${fallbackUrl}')` }}
        />
      )}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{ opacity: ready ? 1 : 0, transition: "opacity 0.3s ease" }}
      />
    </>
  );
}
