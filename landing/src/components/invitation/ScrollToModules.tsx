"use client";

import { ChevronDown } from "lucide-react";

export function ScrollToModules() {
  return (
    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10">
      <div className="animate-bounce cursor-pointer">
        <button
          onClick={() => document.getElementById("modules")?.scrollIntoView({ behavior: "smooth" })}
          className="flex flex-col items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <span className="text-[10px] uppercase tracking-widest font-medium">Découvrir</span>
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
