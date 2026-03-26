"use client";

import { AnimatePresence, motion, useInView } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const MOCK_IMAGES = [
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

const lightboxVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

export function GalleryModule({
  weddingId,
  config,
  isDemo = false,
}: {
  weddingId: string;
  config?: Record<string, any> | null;
  isDemo?: boolean;
}) {
  const rawImages: string[] =
    config?.images && Array.isArray(config.images) && config.images.length > 0
      ? config.images
      : MOCK_IMAGES;
  const images = rawImages.slice(0, 12);
  const count = images.length;

  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { margin: "-20%" });

  const [[current, direction], setCurrent] = useState([0, 0]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [paused, setPaused] = useState(false);

  // Swipe tracking for lightbox
  const touchStartX = useRef<number | null>(null);

  const paginate = (newDirection: number) => {
    setCurrent(([prev]) => [
      (((prev + newDirection) % count) + count) % count,
      newDirection,
    ]);
  };

  const goTo = (index: number) => {
    const dir = index > current ? 1 : -1;
    setCurrent([index, dir]);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) paginate(diff > 0 ? 1 : -1);
    touchStartX.current = null;
  };

  // Autoplay — démarre uniquement quand la galerie est visible, pause au hover ou lightbox
  useEffect(() => {
    if (count <= 1 || paused || lightboxOpen || !isInView) return;
    const interval = setInterval(() => paginate(1), 4000);
    return () => clearInterval(interval);
  }, [count, paused, lightboxOpen, isInView, current]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") paginate(-1);
      if (e.key === "ArrowRight") paginate(1);
      if (e.key === "Escape") setLightboxOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [count]);

  if (count === 0) return null;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <section
      ref={sectionRef}
      className='w-full'
    >
      {/* Title */}
      <div className='text-center mb-16 space-y-4 px-4'>
        <h2 className='text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-[#1a1a2e]/60'>
          Souvenirs
        </h2>
        <h3 className='font-heading text-5xl md:text-6xl italic text-[#1a1a2e]'>
          Galerie
        </h3>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className='max-w-5xl mx-auto px-4'
      >
        {/* Main Carousel Frame */}
        <div
          className='relative group'
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Counter */}
          <div className='absolute top-5 right-5 z-20 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm rounded-full px-4 py-1.5'>
            <span className='text-white font-bold text-xs tracking-[0.2em]'>
              {pad(current + 1)}
            </span>
            <span className='text-white/40 text-xs'>/</span>
            <span className='text-white/50 text-xs tracking-[0.15em]'>
              {pad(count)}
            </span>
          </div>

          {/* Main Image */}
          <div
            className={`relative w-full aspect-[4/3] md:aspect-[16/9] rounded-[2rem] overflow-hidden bg-white border border-[#be185d]/20 shadow-2xl ${isDemo ? "cursor-default" : "cursor-zoom-in"}`}
            onClick={() => !isDemo && setLightboxOpen(true)}
          >
            <AnimatePresence initial={false} custom={direction} mode='popLayout'>
              <motion.div
                key={current}
                custom={direction}
                variants={carouselVariants}
                initial='enter'
                animate='center'
                exit='exit'
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className='absolute inset-0'
              >
                <div
                  className='absolute inset-0 bg-cover bg-center'
                  style={{ backgroundImage: `url(${images[current]})` }}
                />
                <div className='absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none' />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Arrow — Left */}
          {count > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                paginate(-1);
              }}
              className='absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white opacity-0 group-hover:opacity-100 hover:bg-white/25 transition-all duration-300'
              aria-label='Photo précédente'
            >
              <ChevronLeft
                className='w-5 h-5'
                strokeWidth={1.5}
              />
            </button>
          )}

          {/* Arrow — Right */}
          {count > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                paginate(1);
              }}
              className='absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white opacity-0 group-hover:opacity-100 hover:bg-white/25 transition-all duration-300'
              aria-label='Photo suivante'
            >
              <ChevronRight
                className='w-5 h-5'
                strokeWidth={1.5}
              />
            </button>
          )}
        </div>

        {/* Line indicators */}
        {count > 1 && (
          <div className='flex items-center justify-center gap-1.5 mt-6'>
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Photo ${i + 1}`}
                className='relative h-[2px] rounded-full overflow-hidden transition-all duration-300'
                style={{ width: i === current ? 32 : 16 }}
              >
                <span className='absolute inset-0 bg-border' />
                {i === current && (
                  <motion.span
                    layoutId='indicator'
                    className='absolute inset-0 bg-[#be185d]'
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Thumbnail strip */}
        {count > 1 && (
          <div className='flex gap-2 md:gap-3 mt-6 overflow-x-auto pb-2 pt-1 scrollbar-hide justify-center'>
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`relative shrink-0 w-14 h-14 md:w-16 md:h-16 mt-1 rounded-xl overflow-hidden transition-all duration-300 ${
                  i === current
                    ? "ring-2 ring-[#be185d] ring-offset-2 shadow-md scale-105"
                    : "opacity-50 hover:opacity-80 hover:scale-[1.02]"
                }`}
              >
                <div
                  className='absolute inset-0 bg-cover bg-top'
                  style={{ backgroundImage: `url(${src})` }}
                />
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Lightbox — portalisé sur document.body (désactivé en mode démo) */}
      {!isDemo && lightboxOpen &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className='fixed inset-0 z-[99999] flex items-center justify-center bg-black/92 backdrop-blur-md'
              onClick={() => setLightboxOpen(false)}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {/* Close */}
              <button
                onClick={() => setLightboxOpen(false)}
                className='absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900/70 text-white hover:bg-zinc-900 transition-all z-50'
                aria-label='Fermer'
              >
                <X className='w-5 h-5' strokeWidth={2} />
              </button>

              {/* Counter */}
              <div className='absolute top-6 left-1/2 -translate-x-1/2 text-white text-xs tracking-[0.25em] font-medium select-none bg-zinc-900/70 rounded-full px-3 py-1'>
                {pad(current + 1)} / {pad(count)}
              </div>

              {/* Prev */}
              {count > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); paginate(-1); }}
                  className='absolute left-3 md:left-6 z-50 w-12 h-12 flex items-center justify-center rounded-full bg-zinc-900/70 text-white hover:bg-zinc-900 transition-all'
                  aria-label='Photo précédente'
                >
                  <ChevronLeft className='w-6 h-6' strokeWidth={2} />
                </button>
              )}

              {/* Next */}
              {count > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); paginate(1); }}
                  className='absolute right-3 md:right-6 z-50 w-12 h-12 flex items-center justify-center rounded-full bg-zinc-900/70 text-white hover:bg-zinc-900 transition-all'
                  aria-label='Photo suivante'
                >
                  <ChevronRight className='w-6 h-6' strokeWidth={2} />
                </button>
              )}

              {/* Image — sliding container (pointer-events-none pour laisser passer les clics aux boutons) */}
              <div className='absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none'>
                <AnimatePresence initial={false} custom={direction} mode='popLayout'>
                  <motion.div
                    key={current}
                    custom={direction}
                    variants={lightboxVariants}
                    initial='enter'
                    animate='center'
                    exit='exit'
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    className='absolute flex items-center justify-center w-full h-full px-16 md:px-24'
                  >
                    <img
                      src={images[current]}
                      alt={`Photo de mariage ${current + 1}`}
                      className='max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl select-none'
                      draggable={false}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Dot indicators */}
              {count > 1 && (
                <div className='absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-50'>
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); goTo(i); }}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${i === current ? "bg-zinc-900/70 scale-125" : "bg-zinc-900/40 hover:bg-zinc-900/70"}`}
                      aria-label={`Photo ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}
    </section>
  );
}
