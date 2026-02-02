"use client";

import { motion } from "framer-motion";
import { Check, LucideIcon } from "lucide-react";

export interface ModuleDefinition {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
}

interface ModuleSelectorProps {
  modules: ModuleDefinition[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  freeLimit?: number;
  extraPrice?: number;
}

export function ModuleSelector({
  modules,
  selectedIds,
  onToggle,
  freeLimit = 4,
  extraPrice = 10,
}: ModuleSelectorProps) {
  return (
    <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
      {modules.map((mod) => {
        const Icon = mod.icon;
        const isSelected = selectedIds.includes(mod.id);

        // Calculate dynamic index based on selection order logic?
        // In the original, it relied on global index.
        // Logic: if selected, is it within the first N free items?
        // Since we don't know the selection order here, we can't perfectly replicate "which one is paid" unless we assume 'selectedIds' is ordered by selection time.
        // Simplified Logic for UI: We just mark them as paid if total > limit.

        // Note: To perfectly replicate "isPaid" visualization, we need to know the index of THIS item in the selected list.
        const selectionIndex = selectedIds.indexOf(mod.id);
        const isPaid = isSelected && selectionIndex >= freeLimit;

        return (
          <motion.div
            key={mod.id}
            onClick={() => onToggle(mod.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`relative p-6 pt-8 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-3 text-center group bg-white ${
              isSelected
                ? isPaid
                  ? "border-orange-200 shadow-xl shadow-orange-100/50"
                  : "border-primary/50 shadow-xl shadow-primary/10"
                : "border-transparent shadow-md md:hover:shadow-lg md:hover:border-gray-200"
            }`}
          >
            {/* Status Badge */}
            {isSelected && (
              <div
                className={`absolute top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                  isPaid
                    ? "bg-orange-100 text-orange-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {isPaid ? `+${extraPrice}€` : "Inclus"}
              </div>
            )}

            <div
              className={`p-4 rounded-full transition-colors duration-300 ${
                isSelected
                  ? isPaid
                    ? "bg-orange-50 text-orange-600"
                    : "bg-primary/10 text-primary"
                  : "bg-gray-50 text-gray-400 group-hover:bg-primary/5 group-hover:text-primary"
              }`}
            >
              <Icon className='w-8 h-8' />
            </div>

            <div className='space-y-1'>
              <span
                className={`font-semibold text-lg block ${isSelected ? "text-gray-900" : "text-gray-600"}`}
              >
                {mod.name}
              </span>
              <span className='text-xs text-muted-foreground line-clamp-2 px-2'>
                {mod.description}
              </span>
            </div>

            {/* Checkmark corner */}
            {isSelected && (
              <div
                className={`absolute bottom-3 right-3 w-5 h-5 rounded-full flex items-center justify-center ${
                  isPaid ? "bg-orange-500" : "bg-primary"
                }`}
              >
                <Check className='w-3 h-3 text-white' />
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
