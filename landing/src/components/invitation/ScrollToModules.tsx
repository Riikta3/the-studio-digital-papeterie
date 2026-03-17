"use client";

import { ChevronDown } from "lucide-react";

export function ScrollToModules() {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
      <div className="animate-bounce cursor-pointer group">
        <button
          onClick={() => document.getElementById("modules")?.scrollIntoView({ behavior: "smooth" })}
          className="flex flex-col items-center gap-3 group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-all duration-300 transform group-hover:scale-105"
        >
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
            <ChevronDown className="w-5 h-5 text-white/90" strokeWidth={1.5} />
          </div>
          <span className="text-[9px] uppercase tracking-[0.4em] text-white font-light opacity-80 select-none">
            Découvrir
          </span>
        </button>
      </div>
    </div>
  );
}
