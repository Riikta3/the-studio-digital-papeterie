"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";

const MOCK_IMAGES = [
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1600",
  "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=1600",
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1600",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80&w=1600",
  "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=1600",
  "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&q=80&w=1600",
];

const slideVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    scale: 1.03,
    x: direction > 0 ? 30 : -30,
  }),
  center: {
    opacity: 1,
    scale: 1,
    x: 0,
  },
  exit: (direction: number) => ({
    opacity: 0,
    scale: 0.97,
    x: direction < 0 ? 30 : -30,
  }),
};

export function GalleryModule({
  weddingId,
  config,
}: {
  weddingId: string;
  config?: Record<string, any> | null;
}) {
  const rawImages: string[] =
    config?.images && Array.isArray(config.images) && config.images.length > 0
      ? config.images
      : MOCK_IMAGES;
  const images = rawImages.slice(0, 12);
  const count = images.length;

  const [[current, direction], setCurrent] = useState([0, 0]);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const paginate = (newDirection: number) => {
    setCurrent(([prev]) => [
      ((prev + newDirection) % count + count) % count,
      newDirection,
    ]);
  };

  const goTo = (index: number) => {
    const dir = index > current ? 1 : -1;
    setCurrent([index, dir]);
  };

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
    <section className='w-full'>
      {/* Title */}
      <div className='text-center mb-16 space-y-4 px-4'>
        <h2 className='text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground'>
          Souvenirs
        </h2>
        <h3 className='font-heading text-5xl md:text-6xl italic text-foreground'>
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
        <div className='relative group'>
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
            className='relative w-full aspect-[4/3] md:aspect-[16/9] rounded-[2rem] overflow-hidden bg-card border border-border shadow-2xl cursor-zoom-in'
            onClick={() => setLightboxOpen(true)}
          >
            <AnimatePresence
              initial={false}
              custom={direction}
              mode='sync'
            >
              <motion.div
                key={current}
                custom={direction}
                variants={slideVariants}
                initial='enter'
                animate='center'
                exit='exit'
                transition={{ duration: 0.6, ease: [0.32, 0, 0.67, 0] }}
                className='absolute inset-0'
              >
                <div
                  className='absolute inset-0 bg-cover bg-center'
                  style={{ backgroundImage: `url(${images[current]})` }}
                />
                {/* Subtle vignette */}
                <div className='absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none' />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Arrow — Left */}
          {count > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); paginate(-1); }}
              className='absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white opacity-0 group-hover:opacity-100 hover:bg-white/25 transition-all duration-300'
              aria-label='Photo précédente'
            >
              <ChevronLeft className='w-5 h-5' strokeWidth={1.5} />
            </button>
          )}

          {/* Arrow — Right */}
          {count > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); paginate(1); }}
              className='absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white opacity-0 group-hover:opacity-100 hover:bg-white/25 transition-all duration-300'
              aria-label='Photo suivante'
            >
              <ChevronRight className='w-5 h-5' strokeWidth={1.5} />
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
                    className='absolute inset-0 bg-primary'
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Thumbnail strip */}
        {count > 1 && (
          <div className='flex gap-2 md:gap-3 mt-5 overflow-x-auto pb-1 scrollbar-hide justify-center'>
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`relative shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                  i === current
                    ? "border-primary shadow-md scale-105"
                    : "border-transparent opacity-50 hover:opacity-80 hover:scale-[1.02]"
                }`}
              >
                <div
                  className='absolute inset-0 bg-cover bg-center'
                  style={{ backgroundImage: `url(${src})` }}
                />
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md'
            onClick={() => setLightboxOpen(false)}
          >
            {/* Close */}
            <button
              onClick={() => setLightboxOpen(false)}
              className='absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition-all z-50'
              aria-label='Fermer'
            >
              <X className='w-5 h-5' strokeWidth={1.5} />
            </button>

            {/* Counter */}
            <div className='absolute top-6 left-1/2 -translate-x-1/2 text-white/50 text-xs tracking-[0.25em] font-medium'>
              {pad(current + 1)} / {pad(count)}
            </div>

            {/* Prev */}
            {count > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); paginate(-1); }}
                className='absolute left-4 md:left-8 w-11 h-11 flex items-center justify-center rounded-full border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition-all z-50'
                aria-label='Photo précédente'
              >
                <ChevronLeft className='w-5 h-5' strokeWidth={1.5} />
              </button>
            )}

            {/* Next */}
            {count > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); paginate(1); }}
                className='absolute right-4 md:right-8 w-11 h-11 flex items-center justify-center rounded-full border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition-all z-50'
                aria-label='Photo suivante'
              >
                <ChevronRight className='w-5 h-5' strokeWidth={1.5} />
              </button>
            )}

            {/* Image */}
            <AnimatePresence
              initial={false}
              custom={direction}
              mode='sync'
            >
              <motion.div
                key={current}
                custom={direction}
                variants={slideVariants}
                initial='enter'
                animate='center'
                exit='exit'
                transition={{ duration: 0.5, ease: [0.32, 0, 0.67, 0] }}
                className='relative max-w-5xl w-full max-h-[80vh] flex items-center justify-center px-16 md:px-24 pointer-events-none'
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={images[current]}
                  alt={`Photo de mariage ${current + 1}`}
                  className='max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl pointer-events-auto'
                  onClick={(e) => e.stopPropagation()}
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
