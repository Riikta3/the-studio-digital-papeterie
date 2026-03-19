// landing/src/app/[locale]/(configurator)/create/extras/page.tsx
"use client";

import { cn } from "@/lib/utils";
import { StepTransition } from "@/components/configurator/StepTransition";
import { useOrderStore } from "@/stores/use-order-store";
import { Music, Palette, Video, Globe, Ban } from "lucide-react";

const EXTRAS = [
  {
    id: "custom-music",
    icon: Music,
    name: "Musique personnalisée",
    desc: "Ajoutez votre chanson préférée à l'ambiance de votre site.",
    price: 10,
  },
  {
    id: "custom-illustration",
    icon: Palette,
    name: "Illustration sur mesure",
    desc: "Un portrait illustré de vous deux réalisé par nos artistes.",
    price: 45,
  },
  {
    id: "animated-video",
    icon: Video,
    name: "Vidéo animée",
    desc: "Intro vidéo animée pour accueillir vos invités avec style.",
    price: 55,
  },
  {
    id: "custom-domain",
    icon: Globe,
    name: "Domaine personnalisé",
    desc: "sophie-et-pierre.fr au lieu du lien générique.",
    price: 65,
  },
];

export default function ExtrasPage() {
  const { adultsOnly, setAdultsOnly, extras, toggleExtra } = useOrderStore();

  return (
    <StepTransition>
    <div className="flex flex-col gap-4">
      <div className="text-center space-y-2 px-4 pb-2">
        <h1 className="font-heading text-3xl font-bold md:text-4xl lg:text-5xl">
          Options <span className="italic text-primary">supplémentaires</span>
        </h1>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto font-sans">
          Personnalisez encore plus votre expérience.
        </p>
      </div>

      <div className="flex flex-col gap-4 max-w-lg mx-auto w-full px-4">
        {/* Adults Only toggle */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-sans mb-2">
            Préférences
          </p>
          <button
            onClick={() => setAdultsOnly(!adultsOnly)}
            className={cn(
              "w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-150 text-left",
              adultsOnly ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30",
            )}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                adultsOnly ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              <Ban className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">Mariage Adults Only</p>
              <p className="text-xs text-muted-foreground font-sans mt-0.5">
                Indique poliment que les enfants ne sont pas conviés.
              </p>
            </div>
            {/* Pill switch */}
            <div
              className={cn(
                "w-11 h-6 rounded-full relative flex-shrink-0 transition-colors duration-200",
                adultsOnly ? "bg-primary" : "bg-muted",
              )}
            >
              <div
                className={cn(
                  "absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200",
                  adultsOnly ? "left-6" : "left-1",
                )}
              />
            </div>
          </button>
          {adultsOnly && (
            <p className="mt-2 px-4 py-3 rounded-xl bg-muted/40 text-xs text-muted-foreground font-sans italic leading-relaxed">
              &ldquo;Bien que nous adorions vos enfants, ce mariage sera une célébration entre adultes uniquement.&rdquo;
            </p>
          )}
        </div>

        {/* Premium options grid */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-sans mb-2">
            Options premium
          </p>
          <div className="grid grid-cols-2 gap-3">
            {EXTRAS.map((ex) => {
              const isSelected = extras.includes(ex.id);
              const Icon = ex.icon;
              return (
                <button
                  key={ex.id}
                  onClick={() => toggleExtra(ex.id)}
                  className={cn(
                    "text-left p-4 rounded-2xl border-2 flex flex-col gap-3 transition-all duration-150 relative",
                    isSelected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30",
                  )}
                >
                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center transition-colors",
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold leading-tight">{ex.name}</p>
                    <p className="text-[10px] text-muted-foreground font-sans mt-1 line-clamp-2 leading-relaxed">{ex.desc}</p>
                  </div>
                  <p className="text-sm font-bold text-primary font-sans mt-auto">+{ex.price}€</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
    </StepTransition>
  );
}
