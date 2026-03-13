"use client";

import { deleteRsvpResponse } from "@/actions/rsvp-response-actions";
import { Button } from "@shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@shared/components/ui/dialog";
import { Quote, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface MessageCardProps {
  id: string;
  name: string;
  message: string;
  date: string;
}

export function MessageCard({ id, name, message, date }: MessageCardProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteRsvpResponse(id);
        toast.success("Message supprimé");
        setOpen(false);
      } catch {
        toast.error("Erreur lors de la suppression");
      }
    });
  };

  return (
    <div className="break-inside-avoid bg-white border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-4 group">
      <div className="flex items-start justify-between gap-2">
        <Quote className="w-5 h-5 text-primary/30 shrink-0" />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50">
              <Trash2 size={15} />
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Supprimer ce message ?</DialogTitle>
              <DialogDescription>
                Le message de <strong>{name}</strong> sera définitivement
                supprimé. Cette action est irréversible.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Annuler
              </Button>
              <Button
                onClick={handleDelete}
                disabled={isPending}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                {isPending ? "Suppression..." : "Supprimer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <p className="text-foreground font-light leading-relaxed italic text-sm flex-1">
        {message}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-semibold text-primary uppercase">
            {name.charAt(0)}
          </div>
          <span className="text-sm font-medium text-foreground">{name}</span>
        </div>
        <span className="text-[11px] text-muted-foreground/60">{date}</span>
      </div>
    </div>
  );
}
