"use client";

import { Button } from "@shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu";
import { Mail, MessageCircle, MoreHorizontal, Users } from "lucide-react";

interface GuestCardProps {
  id: string;
  name: string; // "Famille Dupont"
  email?: string;
  phone?: string;
  guestCount: number;
  status: "pending" | "confirmed" | "declined" | "partial";
  lastRelance?: string;
}

export function GuestCard({ name, email, guestCount, status }: GuestCardProps) {
  // Status Colors
  const statusStyles = {
    pending: "bg-orange-50 text-orange-700 border-orange-100",
    confirmed: "bg-green-50 text-green-700 border-green-100",
    declined: "bg-red-50 text-red-700 border-red-100",
    partial: "bg-blue-50 text-blue-700 border-blue-100",
  };

  const statusLabel = {
    pending: "En attente",
    confirmed: "Confirmé",
    declined: "Décliné",
    partial: "Partiel",
  };

  return (
    <div className='group bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col'>
      <div className='p-6 flex-1'>
        <div className='flex justify-between items-start mb-4'>
          <div
            className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border ${statusStyles[status]}`}
          >
            {statusLabel[status]}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                className='h-8 w-8 p-0 text-muted-foreground hover:text-foreground'
              >
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem>Modifier</DropdownMenuItem>
              <DropdownMenuItem>Voir les détails</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className='text-red-600'>
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div>
          <h3 className='font-heading text-2xl text-foreground mb-1'>{name}</h3>
          <div className='flex items-center gap-2 text-muted-foreground text-sm mb-4'>
            <Users className='w-4 h-4' />
            <span>
              {guestCount} invité{guestCount > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className='space-y-2 text-sm text-muted-foreground'>
          {email && (
            <div className='flex items-center gap-2'>
              <Mail className='w-3 h-3 text-muted-foreground/70' />
              <span className='truncate'>{email}</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Footer */}
      <div className='border-t border-border p-4 bg-muted/30 flex gap-2'>
        <Button
          variant='outline'
          size='sm'
          className='flex-1 gap-2 text-muted-foreground border-border hover:bg-card hover:text-foreground group-hover:border-primary/20'
        >
          <MessageCircle className='w-4 h-4' /> Relancer
        </Button>
      </div>
    </div>
  );
}
