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
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface AddHouseholdDialogProps {
  household?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    guests: { first_name: string; last_name: string }[];
  };
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

export function AddHouseholdDialog({
  household,
  trigger,
  open: controlledOpen,
  onOpenChange,
  hideTrigger,
}: AddHouseholdDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;

  const isEdit = !!household;

  // Initialize guests based on edit mode or default
  const initialGuests = household?.guests?.map((g) =>
    `${g.first_name} ${g.last_name}`.trim(),
  ) || [""];
  if (initialGuests.length === 0) initialGuests.push("");

  const [guests, setGuests] = useState<string[]>(initialGuests);

  // Reset state when opening/closing or when household changes
  useEffect(() => {
    if (open) {
      const resetGuests = household?.guests?.map((g) =>
        `${g.first_name} ${g.last_name}`.trim(),
      ) || [""];
      if (resetGuests.length === 0) resetGuests.push("");
      setGuests(resetGuests);
    }
  }, [open, household]);

  const handleAddGuest = () => {
    setGuests([...guests, ""]);
  };

  const handleRemoveGuest = (index: number) => {
    const newGuests = [...guests];
    newGuests.splice(index, 1);
    setGuests(newGuests);
  };

  const handleGuestChange = (index: number, value: string) => {
    const newGuests = [...guests];
    newGuests[index] = value;
    setGuests(newGuests);
  };

  async function handleSubmit(formData: FormData) {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setLoading(true);
    try {
      // Ensure guest values are appended if using manual method, or rely on distinct named inputs
      // Since we use name='guest_names' on multiple inputs, FormData handles it as an array (getAll)
      let result;
      if (isEdit && household) {
        result = await updateHousehold(household.id, formData);
      } else {
        result = await createHousehold(formData);
      }

      if (result.success) {
        if (result.warning) {
          toast.warning(result.warning);
        } else {
          toast.success(
            isEdit ? "Foyer modifié avec succès" : "Foyer ajouté avec succès",
          );
        }
        setOpen(false);
        if (!isEdit) setGuests([""]); // Reset only on create
      } else {
        toast.error(result.error || "Erreur inconnue");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur technique lors de l'enregistrement");
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      {!hideTrigger && (
        <DialogTrigger asChild>
          {trigger ? (
            trigger
          ) : (
            <Button className='bg-primary text-primary-foreground hover:bg-primary/90'>
              <Plus className='w-4 h-4 mr-2' /> Ajouter un foyer
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className='sm:max-w-[425px] overflow-y-auto max-h-[90vh]'>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier le foyer" : "Ajouter un foyer"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifiez les informations du foyer et des invités."
              : 'Créez une nouvelle "enveloppe" regroupant un ou plusieurs invités.'}
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
              defaultValue={household?.name}
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='email'>Email principal (Optionnel)</Label>
            <Input
              id='email'
              name='email'
              type='email'
              placeholder='Pour envoyer les invitations'
              defaultValue={household?.email}
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='phone'>Téléphone (Optionnel)</Label>
            <Input
              id='phone'
              name='phone'
              placeholder='06 12 34 56 78'
              defaultValue={household?.phone}
            />
          </div>

          <div className='grid gap-2'>
            <Label>Invités</Label>
            <div className='space-y-2'>
              {guests.map((guest, index) => (
                <div
                  key={index}
                  className='flex gap-2'
                >
                  <Input
                    name='guest_names'
                    placeholder={`Invité ${index + 1}`}
                    value={guest}
                    onChange={(e) => handleGuestChange(index, e.target.value)}
                    required
                  />
                  {guests.length > 1 && (
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={() => handleRemoveGuest(index)}
                      className='text-red-400 hover:text-red-600 hover:bg-red-50'
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={handleAddGuest}
              className='w-full mt-2 border-dashed'
            >
              <Plus
                size={14}
                className='mr-2'
              />{" "}
              Ajouter un invité
            </Button>
          </div>

          <DialogFooter>
            <Button
              type='submit'
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  {isEdit ? "Modification..." : "Création..."}
                </>
              ) : isEdit ? (
                "Enregistrer"
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
