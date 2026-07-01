// landing/src/hooks/use-image-sequence.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseImageSequenceOptions {
  frameCount: number;
  fps?: number;
  /** Must be a stable reference (module-level function or useCallback) */
  getFramePath: (index: number) => string;
  loop?: boolean;
}

export function useImageSequence({
  frameCount,
  fps = 24,
  getFramePath,
  loop = true,
}: UseImageSequenceOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const rafRef = useRef<number | null>(null);
  const currentFrameRef = useRef(0);
  const lastTimeRef = useRef(0);
  const [ready, setReady] = useState(false);

  const drawFrame = useCallback((index: number) => {
    const canvas = canvasRef.current;
    const img = framesRef.current[index];
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const scale = Math.max(
      canvas.width / img.naturalWidth,
      canvas.height / img.naturalHeight,
    );
    const sw = img.naturalWidth * scale;
    const sh = img.naturalHeight * scale;
    const sx = (canvas.width - sw) / 2;
    const sy = (canvas.height - sh) / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, sx, sy, sw, sh);
  }, []);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const startLoop = useCallback(() => {
    stopLoop();
    lastTimeRef.current = 0;
    const interval = 1000 / fps;
    const tick = (now: number) => {
      if (now - lastTimeRef.current >= interval) {
        lastTimeRef.current = now;
        drawFrame(currentFrameRef.current);
        if (loop) {
          currentFrameRef.current = (currentFrameRef.current + 1) % frameCount;
        } else {
          if (currentFrameRef.current < frameCount - 1) {
            currentFrameRef.current += 1;
          } else {
            return; // stop at last frame
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [fps, frameCount, loop, drawFrame, stopLoop]);

  // Debounced resize handler
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      drawFrame(currentFrameRef.current);
    };
    let debounceTimer: ReturnType<typeof setTimeout>;
    const debouncedResize = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(handleResize, 150);
    };
    window.addEventListener("resize", debouncedResize);
    return () => {
      window.removeEventListener("resize", debouncedResize);
      clearTimeout(debounceTimer);
    };
  }, [drawFrame]);

  // Preload + autostart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth || window.innerWidth;
    canvas.height = canvas.offsetHeight || window.innerHeight;

    let cancelled = false;

    // prefers-reduced-motion: show first frame statically
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const img = new Image();
      img.onload = () => {
        if (cancelled) return;
        framesRef.current[0] = img;
        drawFrame(0);
        setReady(true);
      };
      img.src = getFramePath(0);
      return () => {
        cancelled = true;
        stopLoop();
      };
    }

    // Load first frame, then stream the rest
    const firstImg = new Image();
    firstImg.onload = () => {
      if (cancelled) return;
      framesRef.current[0] = firstImg;
      drawFrame(0);
      setReady(true);
      for (let i = 1; i < frameCount; i++) {
        const img = new Image();
        const idx = i;
        img.onload = () => {
          if (cancelled) return;
          framesRef.current[idx] = img;
        };
        img.src = getFramePath(idx);
      }
      startLoop();
    };
    firstImg.src = getFramePath(0);

    return () => {
      cancelled = true;
      stopLoop();
    };
  // getFramePath must be a stable reference — pass module-level functions or useCallback
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameCount, getFramePath]);

  return { canvasRef, ready };
}
