"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type CarouselCard = {
  id: string;
  previewContent: React.ReactNode;  // ce qu'on affiche dans la zone preview
  title: string;
  description: string;
  actionLabel?: string;             // texte du bouton, défaut "Choisir"
  selectedLabel?: string;           // texte quand sélectionné, défaut "✓ Sélectionné"
};

interface ConfiguratorCarouselProps {
  cards: CarouselCard[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  showDots?: boolean;
}

export function ConfiguratorCarousel({
  cards,
  selectedId,
  onSelect,
  showDots = true,
}: ConfiguratorCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "prev" | "next") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector("[data-card]")?.clientWidth ?? 270;
    el.scrollBy({ left: direction === "next" ? cardWidth + 16 : -(cardWidth + 16), behavior: "smooth" });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Carousel + nav buttons */}
      <div className="relative group">
        {/* Prev button */}
        <button
          onClick={() => scroll("prev")}
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-9 h-9 rounded-full bg-background border border-border shadow-md items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
          aria-label="Précédent"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scroll container */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-6 px-4 md:px-6 scrollbar-hide"
        >
          {cards.map((card) => {
            const isSelected = selectedId === card.id;
            return (
              <div
                key={card.id}
                data-card
                className={cn(
                  "flex-none w-[252px] md:w-[290px] snap-start rounded-[22px] overflow-hidden border-2 bg-card transition-all duration-200",
                  isSelected
                    ? "border-primary shadow-[0_0_0_4px_rgba(124,45,62,0.09),0_8px_28px_rgba(124,45,62,0.13)]"
                    : "border-border/50 shadow-sm",
                )}
              >
                {/* Preview area */}
                <div className="relative h-[210px] md:h-[240px] overflow-hidden">
                  {isSelected && (
                    <div className="absolute top-3 left-3 z-10 bg-primary/15 text-primary text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 font-sans border border-primary/20">
                      ✓ Sélectionné
                    </div>
                  )}
                  {card.previewContent}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border/30">
                  <h3 className="font-semibold text-[15px] mb-0.5 text-foreground">{card.title}</h3>
                  <p className="text-muted-foreground text-[11px] mb-3 line-clamp-1 font-sans">{card.description}</p>
                  <button
                    onClick={() => onSelect(card.id)}
                    className={cn(
                      "w-full py-2.5 rounded-full text-[12px] font-bold font-sans border-2 transition-colors",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-primary bg-transparent text-primary hover:bg-primary/5",
                    )}
                  >
                    {isSelected
                      ? (card.selectedLabel ?? "✓ Sélectionné")
                      : (card.actionLabel ?? "Choisir")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Next button */}
        <button
          onClick={() => scroll("next")}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-9 h-9 rounded-full bg-background border border-border shadow-md items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
          aria-label="Suivant"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Dots */}
      {showDots && (
        <div className="flex justify-center gap-1.5 pb-2">
          {cards.map((card) => (
            <div
              key={card.id}
              className={cn(
                "h-[5px] rounded-full transition-all duration-200",
                selectedId === card.id ? "w-4 bg-primary" : "w-[5px] bg-border",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
