"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { InvitationIntro } from "./InvitationIntro";

interface InvitationPageClientProps {
  children: React.ReactNode;
  hasIntro?: boolean;
}

export function InvitationPageClient({ children, hasIntro = true }: InvitationPageClientProps) {
  const [introDone, setIntroDone] = useState(!hasIntro);

  // Lock scroll while intro is active
  useEffect(() => {
    if (!hasIntro || introDone) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [introDone, hasIntro]);

  return (
    <>
      <AnimatePresence>
        {hasIntro && !introDone && (
          <InvitationIntro onComplete={() => setIntroDone(true)} />
        )}
      </AnimatePresence>

      {/* Site content fades in from white once intro is done */}
      <motion.div
        initial={hasIntro ? { opacity: 0 } : false}
        animate={{ opacity: introDone ? 1 : 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ pointerEvents: introDone ? "auto" : "none", visibility: introDone ? "visible" : "hidden" }}
      >
        {children}
      </motion.div>
    </>
  );
}
