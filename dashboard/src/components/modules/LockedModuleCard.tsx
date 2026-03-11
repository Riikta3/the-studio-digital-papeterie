"use client";

import { BuyModuleDialog } from "@/components/modules/BuyModuleDialog";
import { APP_MODULES } from "@shared/data/modules";
import { Lock, ShoppingCart } from "lucide-react";
import { useState } from "react";

interface LockedModuleCardProps {
  id: string;
  name: string;
  description: string;
}

export function LockedModuleCard({ id, name, description }: LockedModuleCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const module = APP_MODULES.find((m) => m.id === id);
  const Icon = module?.icon;

  return (
    <>
      <button
        onClick={() => setDialogOpen(true)}
        className="w-full text-left flex items-center gap-4 p-4 bg-white rounded-xl border border-dashed border-border hover:border-primary/40 hover:shadow-sm hover:opacity-100 opacity-60 transition-all group"
      >
        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-muted-foreground shrink-0 group-hover:bg-secondary group-hover:text-primary transition-colors">
          {Icon && <Icon size={18} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground truncate">{description}</p>
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
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        moduleId={id}
        moduleName={name}
      />
    </>
  );
}
