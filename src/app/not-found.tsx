"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { MailX, Sparkles } from "lucide-react";
import Link from "next/link";

export default function RootNotFound() {
  return (
    <ThemeProvider
      attribute='class'
      defaultTheme='theme-floral'
      enableSystem={false}
      themes={[
        "theme-floral",
        "theme-minimalist",
        "theme-boho",
        "theme-royal",
        "theme-modern",
      ]}
    >
      <main className='container flex min-h-screen flex-col items-center justify-center gap-8 py-16 text-center mx-auto relative overflow-hidden'>
        {/* Background Decor */}
        <div className='absolute inset-0 pointer-events-none'>
          <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]' />
        </div>

        <div className='relative z-10 flex flex-col items-center gap-6 max-w-lg'>
          {/* Icon */}
          <div className='relative'>
            <div className='w-24 h-24 rounded-full bg-background border border-primary/20 flex items-center justify-center shadow-lg mb-4 relative z-10'>
              <MailX
                className='w-10 h-10 text-primary'
                strokeWidth={1.5}
              />
            </div>
            <Sparkles className='absolute -top-2 -right-2 w-8 h-8 text-primary/40 animate-pulse' />
          </div>

          <h1 className='text-5xl md:text-6xl font-serif text-foreground text-center'>
            Oups...{" "}
            <span className='italic text-primary block mt-2 text-4xl md:text-5xl'>
              Fausse Route ?
            </span>
          </h1>

          <p className='text-muted-foreground text-lg leading-relaxed text-center px-4'>
            Cette page a dû s'éclipser discrètement{" "}
            <br className='hidden md:block' />
            pendant le discours du témoin.
          </p>

          <Link
            href='/fr'
            className='mt-6 rounded-full bg-primary px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2'
          >
            Retourner à l'accueil
          </Link>
        </div>
      </main>
    </ThemeProvider>
  );
}
