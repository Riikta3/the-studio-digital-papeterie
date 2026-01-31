"use client";

import { Link } from "@/navigation";
import { X } from "lucide-react";

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='min-h-screen bg-[#FDFBF7]'>
      {/* Minimalist Header for Wizard */}
      <header className='fixed top-0 left-0 right-0 z-50 py-6 px-6'>
        <div className='max-w-7xl mx-auto flex justify-between items-center'>
          {/* Logo */}
          <div className='flex items-center gap-2'>
            <span className='font-heading text-2xl font-bold tracking-tight text-foreground'>
              The Studio
            </span>
          </div>

          {/* Close / Exit Button */}
          <Link
            href='/'
            className='p-2 rounded-full hover:bg-black/5 transition-colors text-muted-foreground hover:text-foreground'
          >
            <X className='w-6 h-6' />
          </Link>
        </div>
      </header>

      <main className='pt-24 pb-12 px-4 container mx-auto max-w-5xl'>
        {children}
      </main>
    </div>
  );
}
