"use client";

import {
  BuyModuleDialog,
  ModuleRedirectReturnHandler,
  type PendingActivation,
} from "@/components/modules/BuyModuleDialog";
import { APP_MODULES } from "@shared/data/modules";
import { Lock, ShoppingCart } from "lucide-react";
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
  const [pendingActivation, setPendingActivation] = useState<PendingActivation | null>(null);

  const handlePendingActivation = (data: PendingActivation) => {
    setPendingActivation(data);
    setOpenDialogId(data.moduleId);
  };

  return (
    <>
      {/* Single redirect handler for PayPal/Klarna returns — mounted once */}
      <ModuleRedirectReturnHandler onPendingActivation={handlePendingActivation} />

      {modules.map((mod) => {
        const appModule = APP_MODULES.find((m) => m.id === mod.id);
        const Icon = appModule?.icon;
        const isPending = pendingActivation?.moduleId === mod.id;

        return (
          <div key={mod.id}>
            <button
              onClick={() => setOpenDialogId(mod.id)}
              className="w-full text-left flex items-center gap-4 p-4 bg-white rounded-xl border border-dashed border-border hover:border-primary/40 hover:shadow-sm hover:opacity-100 opacity-60 transition-all group"
            >
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-muted-foreground shrink-0 group-hover:bg-secondary group-hover:text-primary transition-colors">
                {Icon && <Icon size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">{mod.name}</p>
                <p className="text-xs text-muted-foreground truncate">{mod.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  10 €
                </span>
                <Lock size={14} className="text-muted-foreground group-hover:hidden" />
                <ShoppingCart size={14} className="text-primary hidden group-hover:block" />
              </div>
            </button>

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
    </>
  );
}
