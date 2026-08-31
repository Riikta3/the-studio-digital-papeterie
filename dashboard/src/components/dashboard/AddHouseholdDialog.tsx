"use client";

import { createHousehold, updateHousehold } from "@/actions/guest-actions";
import { Guest } from "@/types";
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
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface AddHouseholdDialogProps {
  household?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    status?: string;
    guests: Guest[];
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
  const t = useTranslations("AddHouseholdDialog");
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isSubmittingRef = useRef(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;

  const isEdit = !!household;

  // Initialize guests based on edit mode or default
  const initialGuests = household?.guests?.map((g) => ({
    name: `${g.first_name} ${g.last_name}`.trim(),
    relationType: g.relation_type || "",
  })) || [{ name: "", relationType: "" }];
  if (initialGuests.length === 0)
    initialGuests.push({ name: "", relationType: "" });

  const [guests, setGuests] =
    useState<{ name: string; relationType: string }[]>(initialGuests);

  // Reset state when opening/closing or when household changes
  useEffect(() => {
    if (open) {
      const resetGuests = household?.guests?.map((g) => ({
        name: `${g.first_name} ${g.last_name}`.trim(),
        relationType: g.relation_type || "",
      })) || [{ name: "", relationType: "" }];
      if (resetGuests.length === 0)
        resetGuests.push({ name: "", relationType: "" });
      setGuests(resetGuests);
    }
  }, [open, household]);

  const handleAddGuest = () => {
    setGuests([...guests, { name: "", relationType: "" }]);
  };

  const handleRemoveGuest = (index: number) => {
    const newGuests = [...guests];
    newGuests.splice(index, 1);
    setGuests(newGuests);
  };

  const handleGuestChange = (
    index: number,
    field: "name" | "relationType",
    value: string,
  ) => {
    const newGuests = [...guests];
    newGuests[index][field] = value;
    setGuests(newGuests);
  };

  // Relation type options with French labels
  const relationTypeOptions = [
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

  async function handleSubmit(formData: FormData) {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setLoading(true);
    try {
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
            isEdit ? t("toast_success_edit") : t("toast_success_create"),
          );
        }
        setOpen(false);
        if (!isEdit) setGuests([{ name: "", relationType: "" }]); // Reset only on create
      } else {
        toast.error(result.error || "Erreur inconnue");
      }
    } catch (error) {
      console.error(error);
      toast.error(t("toast_error"));
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
              <Plus className='w-4 h-4 mr-2' /> {t("trigger_btn")}
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className='sm:max-w-[600px] overflow-y-auto max-h-[90vh]'>
        <DialogHeader>
          <DialogTitle>{isEdit ? t("edit_title") : t("add_title")}</DialogTitle>
          <DialogDescription>
            {isEdit ? t("edit_desc") : t("add_desc")}
          </DialogDescription>
        </DialogHeader>
        <form
          action={handleSubmit}
          className='grid gap-4 py-4'
        >
          <div className='grid gap-2'>
            <Label htmlFor='name'>{t("name_label")}</Label>
            <Input
              id='name'
              name='name'
              placeholder={t("name_placeholder")}
              required
              defaultValue={household?.name}
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='email'>{t("email_label")}</Label>
            <Input
              id='email'
              name='email'
              type='email'
              placeholder={t("email_placeholder")}
              defaultValue={household?.email}
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='phone'>{t("phone_label")}</Label>
            <Input
              id='phone'
              name='phone'
              placeholder={t("phone_placeholder")}
              defaultValue={household?.phone}
            />
          </div>

          {/* Status Field - Only show in edit mode */}
          {isEdit && (
            <div className='grid gap-2'>
              <Label htmlFor='status'>Statut du foyer</Label>
              <select
                id='status'
                name='status'
                defaultValue={household?.status || "pending"}
                className='w-full h-10 rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring'
              >
                <option value='pending'>En attente</option>
                <option value='confirmed'>Confirmé</option>
                <option value='declined'>Décliné</option>
                <option value='partial'>Partiel</option>
              </select>
            </div>
          )}

          <div className='grid gap-2'>
            <Label>{t("guests_section")}</Label>
            <div className='space-y-3'>
              {guests.map((guest, index) => (
                <div
                  key={index}
                  className='p-3 bg-studio-lavande/5 rounded-lg border border-studio-lavande/30 space-y-2'
                >
                  <div className='flex gap-2'>
                    <div className='flex-1'>
                      <Input
                        name='guest_names'
                        placeholder={t("guest_placeholder", {
                          index: index + 1,
                        })}
                        value={guest.name}
                        onChange={(e) =>
                          handleGuestChange(index, "name", e.target.value)
                        }
                        required
                        className='bg-white'
                      />
                    </div>
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
                  <div className='grid gap-1.5'>
                    <Label
                      htmlFor={`relation-${index}`}
                      className='text-xs text-muted-foreground'
                    >
                      Type de relation
                    </Label>
                    <select
                      id={`relation-${index}`}
                      name='guest_relations'
                      value={guest.relationType}
                      onChange={(e) =>
                        handleGuestChange(index, "relationType", e.target.value)
                      }
                      className='w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring'
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
              {t("add_guest_btn")}
            </Button>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
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
                  {isEdit ? t("submitting_edit") : t("submitting_create")}
                </>
              ) : isEdit ? (
                t("submit_edit")
              ) : (
                t("submit_create")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
