"use client";

import { createHousehold } from "@/actions/guest-actions";
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
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function AddHouseholdDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      const result = await createHousehold(formData);
      if (result.success) {
        toast.success("Foyer ajouté avec succès");
        setOpen(false);
      } else {
        toast.error(result.error || "Erreur inconnue");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur technique lors de l'ajout");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button className='bg-primary text-primary-foreground hover:bg-primary/90'>
          <Plus className='w-4 h-4 mr-2' /> Ajouter manuellement
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Ajouter un foyer</DialogTitle>
          <DialogDescription>
            Créez une nouvelle "enveloppe" regroupant un ou plusieurs invités.
          </DialogDescription>
        </DialogHeader>
        <form
          action={handleSubmit}
          className='grid gap-4 py-4'
        >
          <div className='grid gap-2'>
            <Label htmlFor='name'>Nom du foyer / Famille *</Label>
            <Input
              id='name'
              name='name'
              placeholder='Ex: Famille Dupont ou Alice & Bob'
              required
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='email'>Email principal (Optionnel)</Label>
            <Input
              id='email'
              name='email'
              type='email'
              placeholder='Pour envoyer les invitations'
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='phone'>Téléphone (Optionnel)</Label>
            <Input
              id='phone'
              name='phone'
              placeholder='06 12 34 56 78'
            />
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='guest_names'>Noms des invités (Un par ligne)</Label>
            <textarea
              id='guest_names'
              name='guest_names'
              className='flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
              placeholder={"Jean Dupont\nMarie Dupont"}
            />
          </div>

          <DialogFooter>
            <Button
              type='submit'
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Création...
                </>
              ) : (
                "Ajouter le foyer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
