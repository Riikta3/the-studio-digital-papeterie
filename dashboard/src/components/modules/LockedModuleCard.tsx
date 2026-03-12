"use client";

import {
  BuyModuleDialog,
  ModuleRedirectReturnHandler,
  type PendingActivation,
} from "@/components/modules/BuyModuleDialog";
import { LockedModulePreviewDialog } from "@/components/modules/LockedModulePreviewDialog";
import { MODULE_PREVIEW_DEFAULTS } from "@/components/modules/module-preview-defaults";
import { APP_MODULES } from "@shared/data/modules";
import { Eye, Lock, ShoppingCart } from "lucide-react";
import { useState } from "react";

interface LockedModuleCardProps {
  id: string;
  name: string;
  description: string;
}

interface LockedModulesListProps {
  modules: LockedModuleCardProps[];
}

/**
 * Renders the full list of locked modules with a single redirect handler.
 * The redirect handler is mounted once to avoid the bug where each dialog
 * independently detects the Stripe redirect and the last one wins.
 */
export function LockedModulesList({ modules }: LockedModulesListProps) {
  const [openDialogId, setOpenDialogId] = useState<string | null>(null);
  const [previewModuleId, setPreviewModuleId] = useState<string | null>(null);
  const [pendingActivation, setPendingActivation] = useState<PendingActivation | null>(null);

  const handlePendingActivation = (data: PendingActivation) => {
    setPendingActivation(data);
    setOpenDialogId(data.moduleId);
  };

  const previewModule = previewModuleId
    ? modules.find((m) => m.id === previewModuleId)
    : null;

  return (
    <>
      {/* Single redirect handler for PayPal/Klarna returns — mounted once */}
      <ModuleRedirectReturnHandler onPendingActivation={handlePendingActivation} />

      {modules.map((mod) => {
        const appModule = APP_MODULES.find((m) => m.id === mod.id);
        const Icon = appModule?.icon;
        const isPending = pendingActivation?.moduleId === mod.id;
        const hasPreview = mod.id in MODULE_PREVIEW_DEFAULTS;

        return (
          <div key={mod.id}>
            <div className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-dashed border-border hover:border-primary/40 hover:shadow-sm hover:opacity-100 opacity-60 transition-all group">
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-muted-foreground shrink-0 group-hover:bg-secondary group-hover:text-primary transition-colors">
                {Icon && <Icon size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">{mod.name}</p>
                <p className="text-xs text-muted-foreground truncate">{mod.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {hasPreview && (
                  <button
                    onClick={() => setPreviewModuleId(mod.id)}
                    className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-all px-2 py-1 rounded-md hover:bg-secondary"
                  >
                    <Eye size={13} />
                    Aperçu
                  </button>
                )}
                <button
                  onClick={() => setOpenDialogId(mod.id)}
                  className="flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-all px-2 py-1 rounded-md bg-primary/10 hover:bg-primary/20"
                >
                  <ShoppingCart size={13} />
                  10 €
                </button>
                <Lock size={14} className="text-muted-foreground group-hover:hidden" />
              </div>
            </div>

            <BuyModuleDialog
              open={openDialogId === mod.id}
              onOpenChange={(open) => {
                setOpenDialogId(open ? mod.id : null);
                if (!open && isPending) setPendingActivation(null);
              }}
              moduleId={mod.id}
              moduleName={mod.name}
              pendingActivation={isPending ? pendingActivation : null}
              onClearPending={() => setPendingActivation(null)}
            />
          </div>
        );
      })}

      {previewModule && (
        <LockedModulePreviewDialog
          open={!!previewModuleId}
          onOpenChange={(open) => !open && setPreviewModuleId(null)}
          moduleId={previewModule.id}
          moduleName={previewModule.name}
          moduleDescription={previewModule.description}
          onBuy={() => setOpenDialogId(previewModule.id)}
        />
      )}
    </>
  );
}
