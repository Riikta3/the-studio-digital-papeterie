"use client";

import { Button } from "@shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";
import { useTranslations } from "next-intl";

type Props = {
  open: boolean;
  question: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function DeleteFaqDialog({ open, question, onOpenChange, onConfirm }: Props) {
  const t = useTranslations("InvitationFaq");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='text-studio-violet'>{t("delete_dialog.title")}</DialogTitle>
          <DialogDescription>
            {t("delete_dialog.description", { question: question || t("untitled") })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            {t("delete_dialog.cancel")}
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className='bg-red-500 hover:bg-red-600 text-white'
          >
            {t("delete_dialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
