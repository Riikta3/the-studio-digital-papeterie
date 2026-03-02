"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";

// The array can now vary in length to test the dynamic layout
const MOCK_IMAGES = [
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&q=80&w=800",
];

const getGridContainerClasses = (count: number) => {
  if (count === 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-1 sm:grid-cols-2";
  if (count === 3) return "grid-cols-2 sm:grid-cols-3 sm:grid-rows-2";
  if (count === 4) return "grid-cols-2 sm:grid-cols-2";
  if (count === 5) return "grid-cols-2 sm:grid-cols-4 sm:grid-rows-2";
  return "grid-cols-2 sm:grid-cols-3"; // 6 or more
};

const getLayoutClasses = (count: number, index: number) => {
  if (count === 1) {
    return "col-span-full aspect-video sm:aspect-[2/1]";
  }
  if (count === 2) {
    return "col-span-1 aspect-[4/5] sm:aspect-square";
  }
  if (count === 3) {
    // 1 big on left, 2 smaller on right
    if (index === 0)
      return "col-span-2 sm:col-span-2 sm:row-span-2 aspect-square sm:aspect-auto";
    return "col-span-1 sm:col-span-1 sm:row-span-1 aspect-square";
  }
  if (count === 4) {
    // 2x2 grid
    return "col-span-1 aspect-square";
  }
  if (count === 5) {
    // Bento Box
    if (index === 0)
      return "col-span-2 sm:col-span-2 sm:row-span-2 aspect-[4/5] sm:aspect-auto";
    return "col-span-1 sm:col-span-1 sm:row-span-1 aspect-square";
  }
  // 6 images (or more)
  return "col-span-1 aspect-square";
};

export function GalleryModule({ weddingId }: { weddingId: string }) {
  // Truncate to max 6 images for the grid to keep it elegant
  const images = MOCK_IMAGES.slice(0, 6);
  const count = images.length;

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => setSelectedIndex(index);
  const closeLightbox = () => setSelectedIndex(null);

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + count) % count);
    }
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % count);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") {
        setSelectedIndex((selectedIndex - 1 + count) % count);
      }
      if (e.key === "ArrowRight") {
        setSelectedIndex((selectedIndex + 1) % count);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, count]);

  if (count === 0) return null;

  return (
    <section className='w-full relative'>
      <div className='text-center mb-16 space-y-4 px-4'>
        <h2 className='text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-[#6C7A6E]'>
          Souvenirs
        </h2>
        <h3 className='font-heading text-5xl md:text-6xl italic text-[#333333]'>
          Galerie
        </h3>
      </div>

      <div className='max-w-5xl mx-auto px-4 md:px-8'>
        <div
          className={`grid gap-3 md:gap-4 ${getGridContainerClasses(count)}`}
        >
          {images.map((src, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.98, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: "easeOut" }}
              className={`${getLayoutClasses(count, i)} cursor-pointer relative rounded-[1rem] md:rounded-[1.5rem] overflow-hidden shadow-[0_4px_20px_-5px_rgba(0,0,0,0.06)] group bg-white border border-[#EAEAEA]`}
              onClick={() => openLightbox(i)}
            >
              <div
                className='absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700 ease-out'
                style={{ backgroundImage: `url(${src})` }}
              />
              <div className='absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.05)] pointer-events-none' />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox Overlay */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className='fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-md'
            onClick={closeLightbox}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className='absolute top-6 right-6 md:top-10 md:right-10 w-12 h-12 flex items-center justify-center rounded-full bg-[#F5F7F5] border border-[#EAEAEA] text-[#4B6856] hover:bg-[#EAEAEA] transition-colors z-50'
              aria-label='Fermer la galerie'
            >
              <X className='w-6 h-6' />
            </button>

            {/* Previous Button */}
            {count > 1 && (
              <button
                onClick={prevImage}
                className='absolute left-4 md:left-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/80 border border-[#EAEAEA] shadow-sm text-[#4B6856] hover:bg-white transition-colors z-50 backdrop-blur-sm'
                aria-label='Photo précédente'
              >
                <ChevronLeft className='w-6 h-6' />
              </button>
            )}

            {/* Next Button */}
            {count > 1 && (
              <button
                onClick={nextImage}
                className='absolute right-4 md:right-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/80 border border-[#EAEAEA] shadow-sm text-[#4B6856] hover:bg-white transition-colors z-50 backdrop-blur-sm'
                aria-label='Photo suivante'
              >
                <ChevronRight className='w-6 h-6' />
              </button>
            )}

            {/* Main Image Container */}
            <motion.div
              key={selectedIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className='relative w-full max-w-5xl max-h-[85vh] h-full flex items-center justify-center p-4 md:p-12 pointer-events-none'
            >
              <img
                src={images[selectedIndex]}
                alt={`Photo de mariage ${selectedIndex + 1}`}
                className='max-w-full max-h-full object-contain rounded-lg drop-shadow-2xl pointer-events-auto'
                onClick={(e) => e.stopPropagation()} // Prevent close when clicking the image itself
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
