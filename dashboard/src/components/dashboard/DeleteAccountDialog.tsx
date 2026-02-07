"use client";

import { deleteAccount } from "@/actions/settings-actions";
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
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

export default function DeleteAccountDialog() {
  const t = useTranslations("Settings.security");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const EXPECTED_TEXT = t("delete_keyword");

  async function handleDelete() {
    if (confirmText !== EXPECTED_TEXT) return;

    setLoading(true);
    try {
      const result = await deleteAccount();
      if (result?.error) {
        toast.error(result.error);
        setLoading(false);
      }
      // If success, user is redirected in action
    } catch {
      toast.error(t("toast_error_tech"));
      setLoading(false);
    }
  }

  return (
    <div className='border border-red-200 bg-red-50 rounded-xl p-6'>
      <h3 className='text-lg font-heading text-red-900 mb-2 flex items-center gap-2'>
        <AlertTriangle className='h-5 w-5' />
        {t("delete_account_box_title")}
      </h3>
      <p className='text-sm text-red-700 mb-4'>{t("delete_account_desc")}</p>

      <Dialog
        open={open}
        onOpenChange={setOpen}
      >
        <DialogTrigger asChild>
          <Button
            variant='destructive'
            className='bg-red-600 hover:bg-red-700 text-white'
          >
            {t("delete_btn")}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='text-red-600 flex items-center gap-2'>
              <Trash2 className='h-5 w-5' />
              {t("delete_dialog_title")}
            </DialogTitle>
            <DialogDescription>{t("delete_dialog_desc")}</DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label className='text-xs font-medium text-muted-foreground'>
                {t("type_to_confirm")}{" "}
                <span className='font-bold text-red-600'>{EXPECTED_TEXT}</span>{" "}
                :
              </Label>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={EXPECTED_TEXT}
                className='border-red-200 focus-visible:ring-red-500'
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              {t("cancel")}
            </Button>
            <Button
              variant='destructive'
              onClick={handleDelete}
              disabled={confirmText !== EXPECTED_TEXT || loading}
              className='bg-red-600 hover:bg-red-700'
            >
              {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              {t("confirm_delete_btn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
