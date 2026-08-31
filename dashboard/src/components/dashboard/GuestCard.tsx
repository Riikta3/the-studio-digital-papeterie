"use client";

import { Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

interface GuestCardProps {
  id: string;
  name: string; // "Famille Dupont"
  email?: string;
  phone?: string;
  guests?: any[]; // Keep it flexible or define Guest type
  guestCount: number;
  status: "pending" | "confirmed" | "declined" | "partial";
  lastRelance?: string;
  onEditGuest?: (guest: any) => void;
}

export function GuestCard({
  id,
  name,
  email,
  phone,
  guests = [],
  guestCount,
  status,
  onEditGuest,
}: GuestCardProps) {
  const t = useTranslations("GuestCard");
  const router = useRouter();

  // ... (existing statusStyles and getStatusLabel)

  // ... (existing state and handlers)

  return (
    <>
      {/* ... (existing dialogs) ... */}

      <div className='group bg-card rounded-2xl border border-studio-lavande/40 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col'>
        <div className='p-6 flex-1'>
          <div className='flex justify-between items-start mb-4'>
            {/* ... (existing header) ... */}
          </div>

          <div>
            <h3 className='font-heading text-2xl text-studio-violet mb-1'>
              {name}
            </h3>
            {/* Display individual guests */}
            <div className='flex flex-wrap gap-2 mt-3 mb-4'>
              {guests.map((guest: any) => (
                <button
                  key={guest.id}
                  onClick={() => onEditGuest?.(guest)}
                  className='flex items-center gap-1.5 bg-studio-lavande/10 hover:bg-primary/10 px-3 py-1.5 rounded-lg text-sm transition-all border border-transparent hover:border-primary/20'
                >
                  <Users className='w-3 h-3 text-muted-foreground' />
                  <span className='text-studio-violet/70 font-medium'>
                    {guest.first_name}
                  </span>
                  {onEditGuest && (
                    <div className='ml-1 w-1.5 h-1.5 rounded-full bg-primary/40' />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ... (existing contact info) ... */}
        </div>

        {/* ... (existing footer) ... */}
      </div>
    </>
  );
}
