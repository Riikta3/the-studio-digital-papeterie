"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, Eye } from "lucide-react";
import { InvitationPreviewScaled } from "./InvitationPreviewScaled";

interface LivePreviewDrawerProps {
  theme: string; animation: string; modules: string[];
  partner1: string; partner2: string; weddingDate: string; venue: string;
}

const COLLAPSED_H = 64;
const EXPANDED_VH = 0.85;

const THEME_STYLES: Record<string, { bg: string; color: string }> = {
  "theme-floral":      { bg: "linear-gradient(135deg,#fdf6f0,#f0d9cc)", color: "#c97a90" },
  "theme-minimalist":  { bg: "linear-gradient(135deg,#f5f5f5,#e5e5e5)", color: "#555" },
  "theme-boho":        { bg: "linear-gradient(135deg,#fdf0e5,#e8c99a)", color: "#a98467" },
  "theme-royal":       { bg: "linear-gradient(135deg,#eef2ff,#c7d4f5)", color: "#1e3a8a" },
  "theme-modern":      { bg: "linear-gradient(135deg,#fff0f5,#f5c8db)", color: "#be185d" },
};

export function LivePreviewDrawer({ theme, animation, modules, partner1, partner2, weddingDate, venue }: LivePreviewDrawerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const containerWidth = typeof window !== "undefined" ? Math.min(window.innerWidth * 0.88, 360) : 320;
  const displayPartner1 = partner1 || "Sophie";
  const displayPartner2 = partner2 || "Pierre";
  const moduleCount = modules.length;
  const themeName = theme.replace("theme-", "");
  const animationName = animation ? animation.split("-").slice(1).join(" ") || animation : "—";
  const themeStyle = THEME_STYLES[theme] ?? THEME_STYLES["theme-floral"];

  return (
    <>
      <AnimatePresence>
        {isExpanded && (
          <motion.div key="backdrop" className="fixed inset-0 z-[48] bg-black/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsExpanded(false)} />
        )}
      </AnimatePresence>

      <motion.div
        className="fixed bottom-0 left-0 right-0 z-[49] bg-background rounded-t-2xl border-t border-border/60 shadow-[0_-4px_24px_rgba(0,0,0,0.10)]"
        animate={{ height: isExpanded ? `${EXPANDED_VH * 100}vh` : COLLAPSED_H }}
        transition={{ type: "spring", stiffness: 300, damping: 35 }}
        style={{ overflow: "hidden" }}
      >
        <div className="flex justify-center pt-2">
          <div className="w-8 h-1 rounded-full bg-border/60" />
        </div>

        <button className="w-full flex items-center gap-3 px-4 py-2.5" onClick={() => setIsExpanded((v) => !v)}>
          <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-[9px] font-bold font-sans overflow-hidden"
            style={{ background: themeStyle.bg, color: themeStyle.color, fontStyle: "italic" }}>
            {displayPartner1[0]}&{displayPartner2[0]}
          </div>
          <div className="flex-1 text-left">
            <p className="text-[12px] font-bold text-foreground leading-none">{displayPartner1} & {displayPartner2}</p>
            <p className="text-[10px] text-muted-foreground font-sans mt-0.5 capitalize">
              {themeName} · {animationName} · {moduleCount} module{moduleCount !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-bold font-sans px-3 py-1.5 rounded-full flex-shrink-0">
            <Eye className="w-3 h-3" />
            <span>{isExpanded ? "Fermer" : "Voir"}</span>
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div ref={previewRef} key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="flex flex-col items-center overflow-y-auto pb-8"
              style={{ maxHeight: `calc(${EXPANDED_VH * 100}vh - ${COLLAPSED_H}px - 20px)` }}>
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50 font-sans mb-3 mt-2">
                Aperçu en direct
              </p>
              <InvitationPreviewScaled theme={theme} animation={animation} modules={modules}
                partner1={partner1} partner2={partner2} weddingDate={weddingDate} venue={venue}
                isExpanded={isExpanded} containerWidth={containerWidth} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
