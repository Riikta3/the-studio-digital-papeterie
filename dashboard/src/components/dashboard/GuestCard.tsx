"use client";

import { deleteHousehold } from "@/actions/guest-actions";
import { Button } from "@shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu";
import { Mail, MessageCircle, MoreHorizontal, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AddHouseholdDialog } from "./AddHouseholdDialog";

interface GuestCardProps {
  id: string;
  name: string; // "Famille Dupont"
  email?: string;
  phone?: string;
  guests?: any[]; // Keep it flexible or define Guest type
  guestCount: number;
  status: "pending" | "confirmed" | "declined" | "partial";
  lastRelance?: string;
}

export function GuestCard({
  id,
  name,
  email,
  phone,
  guests,
  guestCount,
  status,
}: GuestCardProps) {
  const router = useRouter();
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

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleteOpen(false); // Close dialog
    const toastId = toast.loading("Suppression en cours...");

    try {
      const result = await deleteHousehold(id);
      if (result.success) {
        toast.success("Foyer supprimé !", { id: toastId });
        router.refresh(); // Explicit refresh
      } else {
        toast.error(result.error || "Erreur lors de la suppression", {
          id: toastId,
        });
      }
    } catch (error) {
      toast.error("Erreur technique impossible de supprimer", { id: toastId });
    }
  };

  return (
    <>
      {/* Edit Modal */}
      <AddHouseholdDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        household={{
          id,
          name,
          email,
          phone,
          guests: guests || [],
        }}
        hideTrigger={true}
      />

      {/* Delete Confirmation Modal */}
      <DropdownMenu>
        {/* We keep the dropdown here but the trigger is inside the card. Wait, the structure was Dropdown inside card header. I should be careful not to break the layout. */}
      </DropdownMenu>

      {/* I should move the Dialog OUTSIDE the card layout if possible to avoid z-index issues, but here fragment <> is fine. */}

      {/* Hand-rolled Alert Dialog using standard Dialog components */}
      <Dialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce foyer ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Le foyer "{name}" et ses invités
              seront supprimés définitivement.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='gap-2 sm:gap-0'>
            <Button
              variant='outline'
              onClick={() => setIsDeleteOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={handleDelete}
              className='bg-red-600 text-white hover:bg-red-700'
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  className='h-8 w-8 p-0 text-muted-foreground hover:text-foreground focus:ring-0 focus:outline-none focus-visible:ring-0'
                >
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align='end'
                className='bg-white border-gray-100 shadow-lg'
              >
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  className='focus:bg-primary/10 focus:text-primary cursor-pointer'
                  onClick={() => setIsEditOpen(true)}
                >
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem className='focus:bg-primary/10 focus:text-primary cursor-pointer'>
                  Voir les détails
                </DropdownMenuItem>
                <DropdownMenuSeparator className='bg-gray-100' />
                <DropdownMenuItem
                  onClick={() => setIsDeleteOpen(true)}
                  className='text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer'
                >
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div>
            <h3 className='font-heading text-2xl text-foreground mb-1'>
              {name}
            </h3>
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
    </>
  );
}
