"use client";

import { motion } from "framer-motion";

const MOCK_IMAGES = [
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80&w=800",
];

export function GalleryModule({ weddingId }: { weddingId: string }) {
  return (
    <section className='w-full'>
      <div className='text-center mb-16 space-y-4'>
        <h2 className='text-sm font-bold uppercase tracking-widest text-primary'>
          Souvenir
        </h2>
        <h3 className='font-heading text-5xl md:text-6xl italic'>Galerie</h3>
      </div>

      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6'>
        {MOCK_IMAGES.map((src, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className={`relative rounded-3xl overflow-hidden shadow-xl shadow-black/5 ${
              i === 0 || i === 3
                ? "md:col-span-2 md:row-span-2 aspect-square"
                : "aspect-[4/5]"
            }`}
          >
            <div
              className='absolute inset-0 bg-cover bg-center hover:scale-105 transition-transform duration-700'
              style={{ backgroundImage: `url(${src})` }}
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
