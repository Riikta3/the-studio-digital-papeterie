"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_DESKTOP_PATH = "/videos/desktop/Animation enveloppe personnalisée_";
const DEFAULT_MOBILE_PATH = "/videos/mobile/Mobile Test 2_";
const DEFAULT_DESKTOP_FRAME_COUNT = 34;
const DEFAULT_MOBILE_FRAME_COUNT = 53;
const FPS = 24;
const FADE_START_RATIO = 0.82;

// ─── Preloader ────────────────────────────────────────────────────────────────

function buildPath(basePath: string, index: number): string {
  return `${basePath}${String(index).padStart(3, "0")}.webp`;
}

// Load all frames in background — each resolves independently into the array
function preloadFramesBackground(basePath: string, count: number, store: HTMLImageElement[]) {
  for (let i = 0; i < count; i++) {
    const img = new Image();
    const idx = i;
    img.onload = () => { store[idx] = img; };
    img.src = buildPath(basePath, idx);
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface InvitationIntroProps {
  onComplete: () => void;
  /** Override desktop sequence path prefix (without frame number + extension) */
  desktopPath?: string;
  /** Override mobile sequence path prefix (without frame number + extension) */
  mobilePath?: string;
  /** Override desktop frame count */
  desktopFrameCount?: number;
  /** Override mobile frame count */
  mobileFrameCount?: number;
}

type State = "idle" | "loading" | "playing" | "done";

export function InvitationIntro({
  onComplete,
  desktopPath = DEFAULT_DESKTOP_PATH,
  mobilePath = DEFAULT_MOBILE_PATH,
  desktopFrameCount = DEFAULT_DESKTOP_FRAME_COUNT,
  mobileFrameCount = DEFAULT_MOBILE_FRAME_COUNT,
}: InvitationIntroProps) {
  const [state, setState] = useState<State>("idle");
  const [overlayOpacity, setOverlayOpacity] = useState(0);
  const [firstFrameReady, setFirstFrameReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const rafRef = useRef<number | null>(null);
  const isMobileRef = useRef(false);
  const currentFrameRef = useRef(0);

  // Detect mobile + load first frame immediately for preview
  useEffect(() => {
    isMobileRef.current = window.innerWidth < 768;
    const isMobile = isMobileRef.current;
    const basePath = isMobile ? mobilePath : desktopPath;

    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const img = new Image();
    img.onload = () => {
      framesRef.current[0] = img;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
      const sw = img.naturalWidth * scale;
      const sh = img.naturalHeight * scale;
      ctx.drawImage(img, (canvas.width - sw) / 2, (canvas.height - sh) / 2, sw, sh);
      setFirstFrameReady(true);
    };
    img.src = buildPath(basePath, 0);
  }, [desktopPath, mobilePath]);

  // Resize handler — resize canvas and redraw current frame
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const img = framesRef.current[currentFrameRef.current];
        if (!img) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
        const sw = img.naturalWidth * scale;
        const sh = img.naturalHeight * scale;
        ctx.drawImage(img, (canvas.width - sw) / 2, (canvas.height - sh) / 2, sw, sh);
      }, 100);
    };
    window.addEventListener("resize", handleResize);
    return () => { window.removeEventListener("resize", handleResize); clearTimeout(timeout); };
  }, []);

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

  const runSequence = useCallback(() => {
    const isMobile = isMobileRef.current;
    const totalFrames = isMobile ? mobileFrameCount : desktopFrameCount;
    const frameDuration = 1000 / FPS;
    let frame = 0;
    let lastTime = 0;

    const tick = (now: number) => {
      if (lastTime === 0) lastTime = now;
      const elapsed = now - lastTime;

      if (elapsed >= frameDuration) {
        // If frame not loaded yet, wait (pause timing) until it's ready
        if (!framesRef.current[frame]) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        currentFrameRef.current = frame;
        drawFrame(frame);
        const progress = frame / (totalFrames - 1);
        if (progress >= FADE_START_RATIO) {
          const fadeProgress = (progress - FADE_START_RATIO) / (1 - FADE_START_RATIO);
          setOverlayOpacity(fadeProgress);
        }
        lastTime = now;
        frame++;
      }

      if (frame < totalFrames) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setOverlayOpacity(1);
        setTimeout(onComplete, 400);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [drawFrame, onComplete, mobileFrameCount, desktopFrameCount]);

  const handlePlay = useCallback(async () => {
    if (state !== "idle") return;
    setState("loading");

    const isMobile = isMobileRef.current;
    const basePath = isMobile ? mobilePath : desktopPath;
    const totalCount = isMobile ? mobileFrameCount : desktopFrameCount;

    // Frame 0 already loaded at mount — wait for frames 1–5, load rest in background
    const firstBatch = Array.from({ length: 5 }, (_, i) => i + 1);
    await Promise.all(firstBatch.map(i => new Promise<void>(resolve => {
      if (framesRef.current[i]) { resolve(); return; }
      const img = new Image();
      img.onload = () => { framesRef.current[i] = img; resolve(); };
      img.onerror = () => resolve();
      img.src = buildPath(basePath, i);
    })));
    preloadFramesBackground(basePath, totalCount, framesRef.current);

    // Canvas already sized + frame 0 already drawn at mount — go straight to playing
    drawFrame(0);
    setState("playing");
    runSequence();
  }, [state, drawFrame, runSequence, mobilePath, desktopPath, mobileFrameCount, desktopFrameCount]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {state !== "done" && (
        <motion.div
          key="intro"
          className="fixed inset-0 z-[9999] bg-white"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {/* Canvas — shown immediately once first frame is drawn */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ opacity: firstFrameReady ? 1 : 0 }}
          />

          {/* White overlay: fades out once first frame is ready, fades in again at end of sequence */}
          <motion.div
            className="absolute inset-0 bg-white pointer-events-none"
            initial={{ opacity: 1 }}
            animate={{ opacity: firstFrameReady ? overlayOpacity : 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />

          {/* Clickable overlay — entire screen triggers play */}
          <AnimatePresence>
            {(state === "idle" || state === "loading") && (
              <motion.div
                key="play-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
                className="absolute inset-0 flex flex-col items-center justify-end pb-10 cursor-pointer"
                onClick={handlePlay}
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                <motion.div
                  className="flex flex-col items-center gap-3"
                  initial={{ y: 8 }}
                  animate={{ y: 0 }}
                  exit={{ y: 8 }}
                  transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
                >
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 flex items-center justify-center pointer-events-none overflow-hidden">
                    <AnimatePresence mode="wait" initial={false}>
                      {state === "loading" ? (
                        <motion.div
                          key="spinner"
                          initial={{ opacity: 0, scale: 0.6 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.6 }}
                          transition={{ duration: 0.2 }}
                          className="w-4 h-4 border border-white/60 border-t-white rounded-full animate-spin"
                        />
                      ) : (
                        <motion.div
                          key="play"
                          initial={{ opacity: 0, scale: 0.6 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.6 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Play className="w-4 h-4 text-white ml-0.5 opacity-90" strokeWidth={1.5} fill="currentColor" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    transition={{ delay: 1, duration: 0.6 }}
                    className="text-[9px] uppercase tracking-[0.3em] text-white font-light select-none"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {state === "loading" ? (
                        <motion.span
                          key="loading-label"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.2 }}
                          className="block"
                        >
                          Chargement…
                        </motion.span>
                      ) : (
                        <motion.span
                          key="play-label"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.2 }}
                          className="block"
                        >
                          Lire
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
