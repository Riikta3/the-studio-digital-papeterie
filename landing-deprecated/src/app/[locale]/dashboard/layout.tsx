"use client";

import { Link } from "@/navigation";
import { Calendar, LogOut } from "lucide-react";
import { useTranslations } from "next-intl";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("Dashboard"); // Ensure this namespace exists or use Common

  return (
    <div className='min-h-screen bg-[#FDFBF7]'>
      {/* Shared Top Navigation */}
      <nav className='border-b border-border/40 bg-white/50 backdrop-blur-sm sticky top-0 z-50'>
        <div className='container mx-auto px-6 h-16 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Link
              href='/dashboard'
              className='font-heading text-xl font-bold tracking-tight hover:opacity-80 transition-opacity'
            >
              The Studio.
            </Link>
            <span className='text-muted-foreground/30'>|</span>
            <span className='text-sm font-medium text-muted-foreground'>
              Espace Mariés
            </span>
          </div>
          <div className='flex items-center gap-4'>
            <div className='hidden md:flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-full text-xs font-medium text-primary'>
              <Calendar className='w-3 h-3' />
              j-145
            </div>
            <Link
              href='/'
              className='p-2 hover:bg-black/5 rounded-full transition-colors text-muted-foreground'
            >
              <LogOut className='w-4 h-4' />
            </Link>
          </div>
        </div>
      </nav>

      <main>{children}</main>
    </div>
  );
}
