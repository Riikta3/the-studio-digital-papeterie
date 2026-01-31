"use client";

import { Link, useRouter } from "@/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function DesignPage() {
  const t = useTranslations("Dashboard");
  const router = useRouter();

  const themes = [
    {
      id: "floral",
      name: "Le Champêtre",
      description: "Douceur et nature, idéal pour un mariage bohème.",
      image: "/images/landing/theme-floral.png",
    },
    {
      id: "modern",
      name: "Le Minimaliste",
      description: "Épure et typographie, pour les mariages urbains.",
      image: "/images/landing/theme-modern.png",
    },
    {
      id: "romantic",
      name: "Le Romantique",
      description: "Raffinement et classiques intemporels.",
      image: "/images/landing/theme-boho.png",
    },
  ];

  const colors = [
    { name: "Sauge", value: "bg-[#7C9082]" },
    { name: "Terracotta", value: "bg-[#BC6C52]" },
    { name: "Bleu Nuit", value: "bg-[#1B2A41]" },
    { name: "Sable", value: "bg-[#DDD0C8]" },
    { name: "Rose Poudré", value: "bg-[#E6C2BF]" },
  ];

  const [selectedTheme, setSelectedTheme] = useState("floral");
  const [selectedColor, setSelectedColor] = useState("Sauge");

  return (
    <div className='container mx-auto px-6 py-8'>
      {/* Header */}
      <div className='flex items-center gap-4 mb-8'>
        <Link
          href='/dashboard'
          className='p-2 hover:bg-black/5 rounded-full transition-colors'
        >
          <ArrowLeft className='w-5 h-5' />
        </Link>
        <div>
          <h1 className='font-heading text-3xl text-primary italic'>
            Design du site
          </h1>
          <p className='text-muted-foreground'>
            Personnalisez l'apparence de votre faire-part.
          </p>
        </div>
      </div>

      <div className='grid lg:grid-cols-3 gap-12'>
        {/* Settings Column */}
        <div className='lg:col-span-1 space-y-10'>
          {/* Theme Selection */}
          <section>
            <h2 className='font-bold uppercase tracking-widest text-sm text-muted-foreground mb-4'>
              Thème
            </h2>
            <div className='space-y-4'>
              {themes.map((theme) => (
                <div
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-4 ${
                    selectedTheme === theme.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-transparent bg-white hover:bg-gray-50"
                  }`}
                >
                  <div
                    className='w-16 h-16 rounded-lg bg-cover bg-center shrink-0'
                    style={{ backgroundImage: `url(${theme.image})` }}
                  />
                  <div>
                    <h3
                      className={`font-heading text-lg ${selectedTheme === theme.id ? "text-primary" : "text-gray-700"}`}
                    >
                      {theme.name}
                    </h3>
                    <p className='text-xs text-muted-foreground line-clamp-2'>
                      {theme.description}
                    </p>
                  </div>
                  {selectedTheme === theme.id && (
                    <Check className='w-5 h-5 text-primary ml-auto' />
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Color Palette */}
          <section>
            <h2 className='font-bold uppercase tracking-widest text-sm text-muted-foreground mb-4'>
              Palette de couleurs
            </h2>
            <div className='flex flex-wrap gap-3'>
              {colors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(color.name)}
                  className={`w-12 h-12 rounded-full ${color.value} shadow-sm transition-transform hover:scale-110 relative flex items-center justify-center`}
                  title={color.name}
                >
                  {selectedColor === color.name && (
                    <Check className='w-6 h-6 text-white drop-shadow-md' />
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Save Button */}
          <button className='w-full py-4 bg-primary text-white rounded-full font-semibold shadow-lg hover:brightness-110 active:scale-95 transition-all'>
            Enregistrer les modifications
          </button>
        </div>

        {/* Preview Column (Sticky) */}
        <div className='lg:col-span-2 hidden lg:block'>
          <div className='sticky top-24'>
            <div className='bg-white rounded-[32px] shadow-2xl border-8 border-gray-900 overflow-hidden aspect-[16/10] relative'>
              {/* Fake Browser Header */}
              <div className='h-8 bg-gray-100 border-b border-gray-200 flex items-center px-4 gap-2'>
                <div className='w-3 h-3 bg-red-400 rounded-full' />
                <div className='w-3 h-3 bg-yellow-400 rounded-full' />
                <div className='w-3 h-3 bg-green-400 rounded-full' />
              </div>

              {/* Preview Content (Dynamic based on selection) */}
              <div className='w-full h-full relative group'>
                <div
                  className='absolute inset-0 bg-cover bg-center transition-all duration-500'
                  style={{
                    backgroundImage: `url(${themes.find((t) => t.id === selectedTheme)?.image})`,
                  }}
                />
                {/* Overlay to simulate site content mock */}
                <div className='absolute inset-0 bg-black/5 flex flex-col items-center justify-center text-center p-12'>
                  <div className='bg-white/90 backdrop-blur-sm p-12 rounded-lg shadow-xl max-w-lg w-full'>
                    <h1 className='font-heading text-5xl text-gray-900 mb-4 italic'>
                      Sarah & Michael
                    </h1>
                    <p className='font-body text-gray-600 uppercase tracking-widest text-sm'>
                      26 Octobre 2024
                    </p>
                    <div
                      className={`mt-8 px-6 py-2 rounded-full text-white text-sm font-medium inline-block shadow-sm ${colors.find((c) => c.name === selectedColor)?.value || "bg-primary"}`}
                    >
                      Réserver
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className='text-center text-sm text-muted-foreground mt-6 flex items-center justify-center gap-2'>
              <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse' />
              Aperçu en direct
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
