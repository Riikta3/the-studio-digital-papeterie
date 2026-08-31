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
import { useTranslations } from "next-intl";
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
  const t = useTranslations("EditGuestDialog");
  const [loading, setLoading] = useState(false);
  const isSubmittingRef = useRef(false);

  const relationTypeOptions: Array<{ value: string; label: string }> = [
    { value: "", label: t("relation_options.unspecified") },
    { value: "partner", label: t("relation_options.partner") },
    { value: "spouse", label: t("relation_options.spouse") },
    { value: "child", label: t("relation_options.child") },
    { value: "parent", label: t("relation_options.parent") },
    { value: "sibling", label: t("relation_options.sibling") },
    { value: "grandparent", label: t("relation_options.grandparent") },
    { value: "grandchild", label: t("relation_options.grandchild") },
    { value: "family", label: t("relation_options.family") },
    { value: "friend", label: t("relation_options.friend") },
    { value: "colleague", label: t("relation_options.colleague") },
    { value: "plus_one", label: t("relation_options.plus_one") },
    { value: "other", label: t("relation_options.other") },
  ];

  const statusOptions = [
    { value: "pending", label: t("status_options.pending") },
    { value: "confirmed", label: t("status_options.confirmed") },
    { value: "declined", label: t("status_options.declined") },
  ];

  const dietaryOptions = [
    { value: "", label: t("dietary_options.none") },
    { value: "vegetarian", label: t("dietary_options.vegetarian") },
    { value: "vegan", label: t("dietary_options.vegan") },
    { value: "gluten_free", label: t("dietary_options.gluten_free") },
    { value: "lactose_free", label: t("dietary_options.lactose_free") },
    { value: "halal", label: t("dietary_options.halal") },
    { value: "kosher", label: t("dietary_options.kosher") },
    { value: "allergies", label: t("dietary_options.allergies") },
    { value: "other", label: t("dietary_options.other") },
  ];

  async function handleSubmit(formData: FormData) {
    if (isSubmittingRef.current || !guest) return;
    isSubmittingRef.current = true;
    setLoading(true);

    try {
      const result = await updateGuest(guest.id, formData);

      if (result.success) {
        toast.success(t("toast_success"));
        onOpenChange(false);
      } else {
        toast.error(result.error || t("toast_error"));
      }
    } catch (error) {
      console.error(error);
      toast.error(t("toast_unexpected_error"));
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
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>
        <form
          action={handleSubmit}
          className='grid gap-4 py-4'
        >
          <div className='grid grid-cols-2 gap-4'>
            <div className='grid gap-2'>
              <Label htmlFor='first_name'>{t("first_name_label")}</Label>
              <Input
                id='first_name'
                name='first_name'
                defaultValue={guest.first_name}
                required
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='last_name'>{t("last_name_label")}</Label>
              <Input
                id='last_name'
                name='last_name'
                defaultValue={guest.last_name}
                required
              />
            </div>
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='email'>{t("email_label")}</Label>
            <Input
              id='email'
              name='email'
              type='email'
              defaultValue={guest.email || ""}
              placeholder={t("email_placeholder")}
            />
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='relation_type'>{t("relation_type_label")}</Label>
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
            <Label htmlFor='status'>{t("status_label")}</Label>
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
                {t("is_child_label")}
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
                {t("is_plus_one_label")}
              </Label>
            </div>
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='dietary_requirements'>{t("dietary_label")}</Label>
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
            <Label htmlFor='dietary_details'>{t("dietary_details_label")}</Label>
            <textarea
              id='dietary_details'
              name='dietary_details'
              defaultValue={guest.dietary_details || ""}
              placeholder={t("dietary_details_placeholder")}
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
              {t("cancel")}
            </Button>
            <Button
              type='submit'
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  {t("saving")}
                </>
              ) : (
                t("save")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
