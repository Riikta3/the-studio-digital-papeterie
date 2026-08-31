"use client";

import { ModulePreview } from "@/app/[locale]/modules/[moduleId]/ModulePreview";
import { Button } from "@shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";
import { ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { MODULE_PREVIEW_DEFAULTS } from "./module-preview-defaults";

interface LockedModulePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: string;
  moduleName: string;
  moduleDescription: string;
  onBuy: () => void;
}

export function LockedModulePreviewDialog({
  open,
  onOpenChange,
  moduleId,
  moduleName,
  moduleDescription,
  onBuy,
}: LockedModulePreviewDialogProps) {
  const t = useTranslations("LockedModulePreviewDialog");
  const config = MODULE_PREVIEW_DEFAULTS[moduleId] ?? {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <DialogTitle className="text-base font-semibold">{moduleName}</DialogTitle>
          <p className="text-sm text-muted-foreground mt-0.5">{moduleDescription}</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <ModulePreview moduleId={moduleId} config={config} />
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-between shrink-0 bg-muted/30">
          <div>
            <p className="text-sm font-semibold text-foreground">{t("unlock_module")}</p>
            <p className="text-xs text-muted-foreground">{t("one_time_payment")}</p>
          </div>
          <Button
            onClick={() => {
              onOpenChange(false);
              onBuy();
            }}
            className="gap-2"
          >
            <ShoppingCart size={15} />
            {t("buy_button")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
