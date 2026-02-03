"use client";

import { cn } from "@/lib/utils";
import { useRouter } from "@/navigation";
import { useOrderStore } from "@/stores/use-order-store";
import { Check } from "lucide-react";

// Theme Configuration
const THEMES = [
  {
    id: "theme-floral",
    name: "Floral",
    color: "#D4A373", // Beige/Gold
    font: "Playfair Display",
    bgPreview: "bg-[#FAFAF9]",
    description: "Romantique et intemporel, inspiré par la nature.",
  },
  {
    id: "theme-minimalist",
    name: "Minimalist",
    color: "#27272a", // Zinc-800
    font: "Inter",
    bgPreview: "bg-white",
    description: "L'élégance pure. Less is more.",
  },
  {
    id: "theme-boho",
    name: "Boho",
    color: "#A98467", // Earthy brown
    font: "Cormorant Garamond",
    bgPreview: "bg-[#FDF6F0]",
    description: "Chaleureux, libre et sauvage.",
  },
  {
    id: "theme-royal",
    name: "Royal",
    color: "#1e3a8a", // Deep Blue
    font: "Cinzel",
    bgPreview: "bg-[#F0F4FF]",
    description: "Sophistiqué et majestueux pour un mariage princier.",
  },
  {
    id: "theme-modern",
    name: "Modern",
    color: "#be185d", // Pink-700
    font: "Montserrat",
    bgPreview: "bg-[#FFF0F5]",
    description: "Audacieux, vibrant et contemporain.",
  },
];

export default function ThemePage() {
  const { theme, setTheme } = useOrderStore();
  const router = useRouter();

  const handleSelect = (id: string) => {
    setTheme(id);
    router.push("/create/modules");
  };

  return (
    <div className='flex flex-col gap-8'>
      <div className='text-center space-y-4'>
        <h1 className='font-heading text-4xl font-bold md:text-5xl'>
          L'ambiance de votre{" "}
          <span className='italic text-primary'>Mariage</span>
        </h1>
        <p className='text-muted-foreground text-lg max-w-xl mx-auto'>
          Sélectionnez le style qui vous ressemble. Vous pourrez personnaliser
          les photos et textes plus tard.
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4'>
        {THEMES.map((t) => (
          <div
            key={t.id}
            onClick={() => handleSelect(t.id)}
            className={cn(
              "group relative cursor-pointer overflow-hidden rounded-3xl border-2 transition-all duration-300 hover:shadow-xl",
              theme === t.id
                ? "border-primary ring-2 ring-primary/20 ring-offset-2"
                : "border-border/50 hover:border-primary/50",
            )}
          >
            {/* Visual Preview */}
            <div
              className={cn(
                "h-40 w-full flex items-center justify-center relative overflow-hidden",
                t.bgPreview,
              )}
            >
              {/* Fake UI Elements for Preview */}
              <div className='absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]' />

              <div className='text-center z-10 p-4'>
                <span
                  className='text-2xl font-bold'
                  style={{ color: t.color, fontFamily: t.font }}
                >
                  {t.name}
                </span>
                <div
                  className='mt-2 h-1 w-12 mx-auto rounded-full'
                  style={{ backgroundColor: t.color }}
                />
              </div>

              {theme === t.id && (
                <div className='absolute top-4 right-4 bg-primary text-primary-foreground p-1.5 rounded-full shadow-lg animate-in fade-in zoom-in duration-300'>
                  <Check className='w-4 h-4' />
                </div>
              )}
            </div>

            {/* Info */}
            <div className='p-6 bg-card'>
              <h3 className='font-semibold text-lg mb-1'>{t.name}</h3>
              <p className='text-muted-foreground text-sm line-clamp-2'>
                {t.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
