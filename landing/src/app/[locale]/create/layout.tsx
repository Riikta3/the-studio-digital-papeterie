"use client";

import { Link } from "@/navigation";
import { X } from "lucide-react";
import Image from "next/image";

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='min-h-screen bg-[#FDFBF7]'>
      {/* Minimalist Header for Wizard */}
      <header className='fixed top-0 left-0 right-0 z-50 py-4 px-6 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm'>
        <div className='max-w-7xl mx-auto flex justify-between items-center'>
          {/* Logo */}
          <Link
            href='/'
            className='flex items-center hover:opacity-80 transition-opacity'
          >
            <Image
              src='/images/logo-the-studio-digital-papeterie.svg'
              alt='The Studio Digital Papeterie'
              width={200}
              height={60}
              className='object-contain h-12 w-auto'
              priority
            />
          </Link>

          {/* Close / Exit Button */}
          <Link
            href='/'
            className='group flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-100/50 hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all'
          >
            <span className='text-xs font-bold uppercase tracking-wider text-gray-600 group-hover:text-gray-900'>
              Quitter
            </span>
            <div className='bg-white p-1 rounded-full shadow-sm group-hover:scale-110 transition-transform'>
              <X className='w-3 h-3 text-gray-900' />
            </div>
          </Link>
        </div>
      </header>

      <main className='pt-24 pb-12 px-4 container mx-auto max-w-5xl'>
        {children}
      </main>
    </div>
  );
}
