"use client";

import { useState } from "react";
import { useOrderStore } from "@/stores/use-order-store";
import { ConfiguratorCarousel, type CarouselCard } from "@/components/configurator/ConfiguratorCarousel";
import { ThemeDemoOverlay } from "@/components/configurator/ThemeDemoOverlay";

type ThemeConfig = {
  id: string;
  name: string;
  description: string;
  accentColor: string;
  bgGradient: string;
  coupleFont: string;
  coupleWeight?: string;
  coupleLetterSpacing?: string;
  coupleStyle?: "italic" | "normal";
  dateColor?: string;
  placeColor?: string;
  placeFont: string;
  placeStyle?: "italic" | "normal";
  placeExtra?: Record<string, string>;
};

const THEMES: ThemeConfig[] = [
  {
    id: "theme-floral",
    name: "Floral",
    description: "Romantique et intemporel, inspiré par la nature.",
    accentColor: "#c97a90",
    bgGradient: "linear-gradient(160deg, #fdf6f0, #f0d9cc)",
    coupleFont: "'Playfair Display', Georgia, serif",
    placeFont: "Georgia, serif",
    placeStyle: "italic",
  },
  {
    id: "theme-minimalist",
    name: "Minimalist",
    description: "L'élégance pure. Less is more.",
    accentColor: "#27272a",
    bgGradient: "linear-gradient(160deg, #f5f5f5, #e5e5e5)",
    coupleFont: "system-ui, sans-serif",
    coupleWeight: "300",
    coupleLetterSpacing: "0.08em",
    dateColor: "#888",
    placeFont: "system-ui, sans-serif",
    placeColor: "#bbb",
    placeExtra: { textTransform: "uppercase", letterSpacing: "0.12em", fontSize: "10px" },
  },
  {
    id: "theme-boho",
    name: "Boho",
    description: "Chaleureux, libre et sauvage.",
    accentColor: "#a98467",
    bgGradient: "linear-gradient(160deg, #fdf0e5, #e8c99a)",
    coupleFont: "Georgia, serif",
    coupleStyle: "italic",
    placeFont: "Georgia, serif",
    placeStyle: "italic",
    placeColor: "#c4a882",
  },
  {
    id: "theme-royal",
    name: "Royal",
    description: "Sophistiqué et majestueux pour un mariage princier.",
    accentColor: "#1e3a8a",
    bgGradient: "linear-gradient(160deg, #eef2ff, #c7d4f5)",
    coupleFont: "Georgia, serif",
    placeFont: "Georgia, serif",
    placeColor: "#4a68c4",
  },
  {
    id: "theme-modern",
    name: "Modern",
    description: "Audacieux, vibrant et contemporain.",
    accentColor: "#be185d",
    bgGradient: "linear-gradient(160deg, #fff0f5, #f5c8db)",
    coupleFont: "'Montserrat', system-ui, sans-serif",
    coupleWeight: "800",
    placeFont: "'Montserrat', system-ui, sans-serif",
    placeColor: "#e879a8",
    placeExtra: { textTransform: "uppercase", letterSpacing: "0.2em", fontSize: "9px" },
  },
];

function ThemePreview({ t, onDemo }: { t: ThemeConfig; onDemo: () => void }) {
  return (
    <div
      className="relative h-full flex flex-col items-center justify-center gap-2"
      style={{ background: t.bgGradient }}
    >
      <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:18px_18px]" />
      <span
        className="relative z-10 text-[21px] font-bold text-center px-4"
        style={{
          color: t.accentColor,
          fontFamily: t.coupleFont,
          fontWeight: t.coupleWeight ?? "700",
          letterSpacing: t.coupleLetterSpacing,
          fontStyle: t.coupleStyle ?? "normal",
        }}
      >
        Sophie & Pierre
      </span>
      <div className="relative z-10 h-[2px] w-8 rounded-full" style={{ background: t.accentColor }} />
      <span
        className="relative z-10 text-[10px] uppercase tracking-[0.18em] font-sans"
        style={{ color: t.dateColor ?? t.accentColor, opacity: 0.65 }}
      >
        14 Juin 2026
      </span>
      <span
        className="relative z-10 text-[11px]"
        style={{
          color: t.placeColor ?? t.accentColor,
          fontFamily: t.placeFont,
          fontStyle: t.placeStyle ?? "normal",
          opacity: 0.5,
          ...(t.placeExtra ?? {}),
        }}
      >
        Château des Roses
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); onDemo(); }}
        className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap text-[11px] font-bold text-primary px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-primary/20 shadow-sm font-sans"
      >
        ▶ Voir la démo
      </button>
    </div>
  );
}

export default function ThemePage() {
  const { theme, setTheme } = useOrderStore();
  const [demoTheme, setDemoTheme] = useState<ThemeConfig | null>(null);

  const cards: CarouselCard[] = THEMES.map((t) => ({
    id: t.id,
    title: t.name,
    description: t.description,
    actionLabel: "Choisir ce thème",
    selectedLabel: "✓ Sélectionné",
    previewContent: <ThemePreview t={t} onDemo={() => setDemoTheme(t)} />,
  }));

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="text-center space-y-2 px-4">
          <h1 className="font-heading text-3xl font-bold md:text-4xl lg:text-5xl">
            L&apos;ambiance de votre{" "}
            <span className="italic text-primary">Mariage</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Glissez pour explorer. Prévisualisez en plein écran avant de choisir.
          </p>
        </div>

        <ConfiguratorCarousel
          cards={cards}
          selectedId={theme}
          onSelect={(id) => setTheme(id)}
        />
      </div>

      {demoTheme && (
        <ThemeDemoOverlay
          themeId={demoTheme.id}
          themeName={demoTheme.name}
          onClose={() => setDemoTheme(null)}
          onSelect={() => setTheme(demoTheme.id)}
        />
      )}
    </>
  );
}
