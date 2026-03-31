"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { InvitationPreviewScaled } from "./InvitationPreviewScaled";

interface LivePreviewSidebarProps {
  theme: string; animation: string; modules: string[];
  partner1: string; partner2: string; weddingDate: string; venue: string;
}

const SIDEBAR_OPEN_WIDTH = 280;
const SIDEBAR_CLOSED_WIDTH = 44;
const PREVIEW_CONTAINER_WIDTH = SIDEBAR_OPEN_WIDTH - 24;

export function LivePreviewSidebar({ theme, animation, modules, partner1, partner2, weddingDate, venue }: LivePreviewSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const displayPartner1 = partner1 || "Sophie";
  const displayPartner2 = partner2 || "Pierre";

  return (
    <motion.div
      className="fixed top-14 right-0 bottom-20 z-40 flex flex-col bg-background border-l border-border/40 shadow-[-4px_0_20px_rgba(0,0,0,0.06)]"
      animate={{ width: isOpen ? SIDEBAR_OPEN_WIDTH : SIDEBAR_CLOSED_WIDTH }}
      transition={{ type: "spring", stiffness: 320, damping: 36 }}
      style={{ overflow: "hidden" }}
    >
      <button onClick={() => setIsOpen((v) => !v)}
        className="flex-shrink-0 h-14 flex items-center justify-center gap-2 border-b border-border/40 hover:bg-muted/40 transition-colors"
        title={isOpen ? "Masquer l'aperçu" : "Voir le rendu"}>
        {isOpen ? (
          <>
            <EyeOff className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <motion.span key="label-open" initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
              className="text-[11px] font-bold text-muted-foreground font-sans whitespace-nowrap">
              Masquer l&apos;aperçu
            </motion.span>
          </>
        ) : (
          <Eye className="w-4 h-4 text-primary flex-shrink-0" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div key="sidebar-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15, delay: 0.1 }}
            className="flex-1 overflow-y-auto flex flex-col items-center py-4 px-3 gap-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50 font-sans self-start">
              Aperçu en direct
            </p>
            <p className="text-[11px] font-semibold text-foreground font-heading self-start italic">
              {displayPartner1} & {displayPartner2}
            </p>
            <InvitationPreviewScaled theme={theme} animation={animation} modules={modules}
              partner1={partner1} partner2={partner2} weddingDate={weddingDate} venue={venue}
              isExpanded={isOpen} containerWidth={PREVIEW_CONTAINER_WIDTH} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
