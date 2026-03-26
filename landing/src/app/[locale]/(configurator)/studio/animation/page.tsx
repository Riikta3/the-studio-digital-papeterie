"use client";

import {
  ConfiguratorCarousel,
  type CarouselCard,
} from "@/components/configurator/ConfiguratorCarousel";
import { StepTransition } from "@/components/configurator/StepTransition";
import { ThemeDemoOverlay } from "@/components/configurator/ThemeDemoOverlay";
import { cn } from "@/lib/utils";
import { useOrderStore } from "@/stores/use-order-store";
import { useState } from "react";

type Variant = { id: string; name: string; desc: string };
type Category = {
  id: string;
  name: string;
  variants: Variant[];
  icon: React.ReactNode;
};

const EnvelopeIcon = () => (
  <svg
    width='18'
    height='18'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z' />
    <polyline points='22,6 12,13 2,6' />
  </svg>
);
const DoorIcon = () => (
  <svg
    width='18'
    height='18'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' />
    <polyline points='9 22 9 12 15 12 15 22' />
  </svg>
);
const CurtainIcon = () => (
  <svg
    width='18'
    height='18'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <line
      x1='12'
      y1='2'
      x2='12'
      y2='22'
    />
    <path d='M2 4c3 4 3 8 0 12' />
    <path d='M22 4c-3 4-3 8 0 12' />
  </svg>
);
const BookIcon = () => (
  <svg
    width='18'
    height='18'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M4 19.5A2.5 2.5 0 0 1 6.5 17H20' />
    <path d='M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z' />
  </svg>
);
const FloralIcon = () => (
  <svg
    width='18'
    height='18'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M12 2a9 9 0 0 1 0 18A9 9 0 0 1 12 2z' />
    <path d='M12 8a3 3 0 0 1 0 8 3 3 0 0 1 0-8z' />
    <line
      x1='12'
      y1='2'
      x2='12'
      y2='6'
    />
    <line
      x1='12'
      y1='18'
      x2='12'
      y2='22'
    />
    <line
      x1='4.22'
      y1='4.22'
      x2='7.05'
      y2='7.05'
    />
    <line
      x1='16.95'
      y1='16.95'
      x2='19.78'
      y2='19.78'
    />
  </svg>
);

const CATEGORIES: Category[] = [
  {
    id: "envelope",
    name: "Enveloppe",
    icon: <EnvelopeIcon />,
    variants: [
      {
        id: "envelope-classic",
        name: "Classique",
        desc: "Ouverture élégante et sobre",
      },
      { id: "envelope-kraft", name: "Kraft", desc: "Texture papier naturel" },
      {
        id: "envelope-luxury",
        name: "Luxe",
        desc: "Fermeture cire, finition premium",
      },
      {
        id: "envelope-vintage",
        name: "Vintage",
        desc: "Style rétro avec cachet de cire",
      },
    ],
  },
  {
    id: "door",
    name: "Porte",
    icon: <DoorIcon />,
    variants: [
      {
        id: "door-royal",
        name: "Royal",
        desc: "Grande porte dorée majestueuse",
      },
      {
        id: "door-classic",
        name: "Classique",
        desc: "Porte en bois sobre et élégante",
      },
      {
        id: "door-authentic",
        name: "Authentique",
        desc: "Porte rustique en bois brut",
      },
      {
        id: "door-modern",
        name: "Moderne",
        desc: "Porte vitrée contemporaine",
      },
      {
        id: "door-japanese",
        name: "Japonaise",
        desc: "Porte coulissante en bois clair",
      },
    ],
  },
  {
    id: "curtain",
    name: "Rideau",
    icon: <CurtainIcon />,
    variants: [
      {
        id: "curtain-velvet",
        name: "Velours",
        desc: "Rideau de velours bordeaux",
      },
      { id: "curtain-linen", name: "Lin", desc: "Tissu naturel aérien" },
      { id: "curtain-silk", name: "Soie", desc: "Reflets soyeux et lumineux" },
    ],
  },
  {
    id: "book",
    name: "Livre",
    icon: <BookIcon />,
    variants: [
      { id: "book-leather", name: "Cuir", desc: "Couverture en cuir gravé" },
      { id: "book-floral", name: "Floral", desc: "Illustrations botaniques" },
      {
        id: "book-modern",
        name: "Moderne",
        desc: "Couverture épurée et graphique",
      },
    ],
  },
  {
    id: "floral",
    name: "Floral",
    icon: <FloralIcon />,
    variants: [
      {
        id: "floral-roses",
        name: "Roses",
        desc: "Pétales de rose qui s'envolent",
      },
      {
        id: "floral-wildflower",
        name: "Champêtre",
        desc: "Fleurs des champs printanières",
      },
      {
        id: "floral-peony",
        name: "Pivoines",
        desc: "Bouquet de pivoines romantiques",
      },
    ],
  },
];

export default function AnimationPage() {
  const { animation, setAnimation, theme } = useOrderStore();
  const [activeCategory, setActiveCategory] = useState("envelope");
  const [showDemo, setShowDemo] = useState(false);

  const currentCategory = CATEGORIES.find((c) => c.id === activeCategory)!;

  const cards: CarouselCard[] = currentCategory.variants.map((v) => ({
    id: v.id,
    title: v.name,
    description: v.desc,
    actionLabel: "Choisir cette animation",
    selectedLabel: "✓ Sélectionné",
    previewContent: (
      <div className="relative h-full flex items-center justify-center bg-primary/7">
        <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:18px_18px]" />
        <span className="relative z-10 opacity-20 scale-[2.5] text-foreground">
          {currentCategory.icon}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowDemo(true);
          }}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap text-[11px] font-bold text-primary px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-primary/20 shadow-sm font-sans"
        >
          ▶ Voir la démo
        </button>
      </div>
    ),
  }));

  return (
    <StepTransition>
      <>
        <div className='flex flex-col gap-4'>
          <div className='text-center space-y-2 px-4 pb-2'>
            <h1 className='font-heading text-3xl font-bold md:text-4xl lg:text-5xl'>
              Animation d&apos;
              <em className='italic text-primary'>ouverture</em>
            </h1>
            <p className='text-muted-foreground text-sm max-w-sm mx-auto'>
              Comment vos invités découvriront votre invitation.
            </p>
          </div>

          {/* Category tabs */}
          <div className='flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-1 justify-center flex-wrap'>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex-none flex items-center gap-1.5 px-4 py-2 rounded-full border-2 text-xs font-bold font-sans transition-all duration-150 whitespace-nowrap",
                  activeCategory === cat.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40",
                )}
              >
                {cat.icon}
                {cat.name}
              </button>
            ))}
          </div>

          <ConfiguratorCarousel
            cards={cards}
            selectedId={animation}
            onSelect={(id) => setAnimation(id)}
          />
        </div>

        {showDemo && (
          <ThemeDemoOverlay
            themeId={theme || "theme-floral"}
            themeName='Aperçu'
            onClose={() => setShowDemo(false)}
            onSelect={() => setShowDemo(false)}
          />
        )}
      </>
    </StepTransition>
  );
}
