"use client";

import { updateGuest } from "@/actions/guest-actions";
import { Guest } from "@/types";
import { Button } from "@shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface EditGuestDialogProps {
  guest: Guest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditGuestDialog({
  guest,
  open,
  onOpenChange,
}: EditGuestDialogProps) {
  const [loading, setLoading] = useState(false);
  const isSubmittingRef = useRef(false);

  const relationTypeOptions: Array<{ value: string; label: string }> = [
    { value: "", label: "Non spécifié" },
    { value: "partner", label: "Conjoint(e)" },
    { value: "spouse", label: "Époux/Épouse" },
    { value: "child", label: "Enfant" },
    { value: "parent", label: "Parent" },
    { value: "sibling", label: "Frère/Sœur" },
    { value: "grandparent", label: "Grand-parent" },
    { value: "grandchild", label: "Petit-enfant" },
    { value: "family", label: "Famille élargie" },
    { value: "friend", label: "Ami(e)" },
    { value: "colleague", label: "Collègue" },
    { value: "plus_one", label: "Accompagnant(e)" },
    { value: "other", label: "Autre" },
  ];

  const statusOptions = [
    { value: "pending", label: "En attente" },
    { value: "confirmed", label: "Confirmé" },
    { value: "declined", label: "Décliné" },
  ];

  const dietaryOptions = [
    { value: "", label: "Aucune restriction" },
    { value: "vegetarian", label: "Végétarien" },
    { value: "vegan", label: "Végétalien" },
    { value: "gluten_free", label: "Sans gluten" },
    { value: "lactose_free", label: "Sans lactose" },
    { value: "halal", label: "Halal" },
    { value: "kosher", label: "Casher" },
    { value: "allergies", label: "Allergies" },
    { value: "other", label: "Autre" },
  ];

  async function handleSubmit(formData: FormData) {
    if (isSubmittingRef.current || !guest) return;
    isSubmittingRef.current = true;
    setLoading(true);

    try {
      const result = await updateGuest(guest.id, formData);

      if (result.success) {
        toast.success("Invité modifié avec succès");
        onOpenChange(false);
      } else {
        toast.error(result.error || "Erreur lors de la modification");
      }
    } catch (error) {
      console.error(error);
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  }

  if (!guest) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className='sm:max-w-[550px] overflow-y-auto max-h-[90vh]'>
        <DialogHeader>
          <DialogTitle>Modifier l&apos;invité</DialogTitle>
          <DialogDescription>
            Modifiez les informations de cet invité
          </DialogDescription>
        </DialogHeader>
        <form
          action={handleSubmit}
          className='grid gap-4 py-4'
        >
          <div className='grid grid-cols-2 gap-4'>
            <div className='grid gap-2'>
              <Label htmlFor='first_name'>Prénom</Label>
              <Input
                id='first_name'
                name='first_name'
                defaultValue={guest.first_name}
                required
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='last_name'>Nom</Label>
              <Input
                id='last_name'
                name='last_name'
                defaultValue={guest.last_name}
                required
              />
            </div>
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              name='email'
              type='email'
              defaultValue={guest.email || ""}
              placeholder='email@exemple.com'
            />
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='relation_type'>Type de relation</Label>
            <select
              id='relation_type'
              name='relation_type'
              defaultValue={guest.relation_type || ""}
              className='w-full h-10 rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring'
            >
              {relationTypeOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='status'>Statut</Label>
            <select
              id='status'
              name='status'
              defaultValue={guest.status}
              className='w-full h-10 rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring'
            >
              {statusOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className='flex gap-6'>
            <div className='flex items-center space-x-2'>
              <input
                type='checkbox'
                id='is_child'
                name='is_child'
                defaultChecked={guest.is_child}
                className='h-4 w-4 rounded border-gray-300'
              />
              <Label
                htmlFor='is_child'
                className='font-normal cursor-pointer'
              >
                Enfant
              </Label>
            </div>
            <div className='flex items-center space-x-2'>
              <input
                type='checkbox'
                id='is_plus_one'
                name='is_plus_one'
                defaultChecked={guest.is_plus_one}
                className='h-4 w-4 rounded border-gray-300'
              />
              <Label
                htmlFor='is_plus_one'
                className='font-normal cursor-pointer'
              >
                Accompagnant(e)
              </Label>
            </div>
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='dietary_requirements'>Régime alimentaire</Label>
            <select
              id='dietary_requirements'
              name='dietary_requirements'
              defaultValue={guest.dietary_requirements || ""}
              className='w-full h-10 rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring'
            >
              {dietaryOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='dietary_details'>Détails supplémentaires</Label>
            <textarea
              id='dietary_details'
              name='dietary_details'
              defaultValue={guest.dietary_details || ""}
              placeholder='Allergies, préférences particulières...'
              rows={3}
              className='w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring'
            />
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type='submit'
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
