"use client";

import { StepTransition } from "@/components/configurator/StepTransition";
import {
  AnimationPreviewOverlay,
  getAnimationPreview,
  getAnimationFrames,
} from "@/components/configurator/AnimationPreviewOverlay";
import { cn } from "@/lib/utils";
import { useOrderStore } from "@/stores/use-order-store";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Check } from "lucide-react";

type Variant = { id: string; name: string; desc: string };
type Category = {
  id: string;
  name: string;
  emoji: string;
  variants: Variant[];
};

const CATEGORIES: Category[] = [
  {
    id: "envelope",
    name: "Enveloppe",
    emoji: "✉️",
    variants: [
      { id: "envelope-classic", name: "Classique", desc: "Ouverture élégante et sobre" },
      { id: "envelope-kraft", name: "Kraft", desc: "Texture papier naturel" },
      { id: "envelope-luxury", name: "Luxe", desc: "Fermeture cire, finition premium" },
      { id: "envelope-vintage", name: "Vintage", desc: "Style rétro avec cachet de cire" },
    ],
  },
  {
    id: "door",
    name: "Porte",
    emoji: "🚪",
    variants: [
      { id: "door-royal", name: "Royal", desc: "Grande porte dorée majestueuse" },
      { id: "door-floral", name: "Floral", desc: "Porte ornée de fleurs printanières" },
      { id: "door-classic", name: "Classique", desc: "Porte en bois sobre et élégante" },
      { id: "door-authentic", name: "Authentique", desc: "Porte rustique en bois brut" },
      { id: "door-modern", name: "Moderne", desc: "Porte vitrée contemporaine" },
    ],
  },
  {
    id: "curtain",
    name: "Rideau",
    emoji: "🎭",
    variants: [
      { id: "curtain-velvet", name: "Velours", desc: "Rideau de velours bordeaux" },
      { id: "curtain-linen", name: "Lin", desc: "Tissu naturel aérien" },
      { id: "curtain-silk", name: "Soie", desc: "Reflets soyeux et lumineux" },
    ],
  },
  {
    id: "book",
    name: "Livre",
    emoji: "📖",
    variants: [
      { id: "book-leather", name: "Cuir", desc: "Couverture en cuir gravé" },
      { id: "book-floral", name: "Floral", desc: "Illustrations botaniques" },
      { id: "book-modern", name: "Moderne", desc: "Couverture épurée et graphique" },
    ],
  },
  {
    id: "floral",
    name: "Floral",
    emoji: "🌸",
    variants: [
      { id: "floral-roses", name: "Roses", desc: "Pétales de rose qui s'envolent" },
      { id: "floral-wildflower", name: "Champêtre", desc: "Fleurs des champs printanières" },
      { id: "floral-peony", name: "Pivoines", desc: "Bouquet de pivoines romantiques" },
    ],
  },
];

export default function AnimationPage() {
  const { animation, setAnimation } = useOrderStore();
  const [activeCategory, setActiveCategory] = useState("envelope");
  const [previewVariant, setPreviewVariant] = useState<Variant | null>(null);

  const currentCategory = CATEGORIES.find((c) => c.id === activeCategory)!;

  const defaultDevice =
    typeof window !== "undefined" && window.innerWidth < 768 ? "mobile" : "desktop";

  return (
    <StepTransition>
      <>
        {/* ── Hero title ── */}
        <div className="text-center space-y-2 px-4 pb-6 pt-2">
          <p className="text-[11px] font-sans font-semibold uppercase tracking-[0.2em] text-primary/60">
            Étape 2 sur 6
          </p>
          <h1 className="font-heading text-4xl font-bold md:text-5xl">
            Animation d&apos;<em className="italic text-primary">ouverture</em>
          </h1>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
            La première chose que verront vos invités.
          </p>
        </div>

        {/* ── Category pills ── */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "flex-none flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium font-sans transition-all duration-200 whitespace-nowrap border",
                activeCategory === cat.id
                  ? "bg-foreground text-background border-foreground shadow-sm"
                  : "bg-background text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground",
              )}
            >
              <span className="text-base leading-none">{cat.emoji}</span>
              {cat.name}
            </button>
          ))}
        </div>

        {/* ── Variant grid ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="grid grid-cols-2 gap-3 px-4 max-w-2xl mx-auto w-full"
          >
            {currentCategory.variants.map((v) => {
              const { frames, fps } = getAnimationFrames(v.id);
              const previewImg = getAnimationPreview(v.id);
              const isSelected = animation === v.id;
              const hasPreview = !!previewImg || frames.length > 0;

              return (
                <motion.div
                  key={v.id}
                  layout
                  className={cn(
                    "group relative rounded-2xl border overflow-hidden cursor-pointer transition-all duration-200",
                    isSelected
                      ? "border-primary shadow-[0_0_0_2px_hsl(var(--primary)/0.15),0_4px_20px_hsl(var(--primary)/0.1)]"
                      : "border-border/60 hover:border-border shadow-sm hover:shadow-md",
                  )}
                  onClick={() => setAnimation(v.id)}
                >
                  {/* Preview image */}
                  <div className="relative aspect-[3/4] bg-muted overflow-hidden">
                    {previewImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewImg}
                        alt={v.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary/5 to-primary/10">
                        <span className="text-4xl opacity-30">{currentCategory.emoji}</span>
                        <span className="text-[11px] text-muted-foreground font-sans">Bientôt</span>
                      </div>
                    )}

                    {/* Selected badge */}
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-md">
                        <Check className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={2.5} />
                      </div>
                    )}

                    {/* Preview button (only if has media) */}
                    {hasPreview && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewVariant(v);
                        }}
                        className="absolute bottom-0 inset-x-0 flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-t from-black/60 via-black/30 to-transparent text-white text-[11px] font-semibold font-sans opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Voir la démo
                      </button>
                    )}
                  </div>

                  {/* Footer */}
                  <div className={cn(
                    "px-3.5 py-3 border-t transition-colors duration-200",
                    isSelected ? "border-primary/20 bg-primary/[0.03]" : "border-border/40 bg-card",
                  )}>
                    <p className={cn(
                      "font-heading text-[15px] font-bold leading-none mb-0.5",
                      isSelected ? "text-primary" : "text-foreground",
                    )}>
                      {v.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-sans line-clamp-1">
                      {v.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* ── preview overlay ── */}
        <AnimatePresence>
          {previewVariant && (
            <AnimationPreviewOverlay
              animationId={previewVariant.id}
              animationName={`${currentCategory.name} — ${previewVariant.name}`}
              initialDevice={defaultDevice}
              onClose={() => setPreviewVariant(null)}
              onSelect={() => {
                setAnimation(previewVariant.id);
                setPreviewVariant(null);
              }}
            />
          )}
        </AnimatePresence>
      </>
    </StepTransition>
  );
}
