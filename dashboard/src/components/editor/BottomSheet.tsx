"use client";

import { AnimatePresence, motion } from "framer-motion";
import { type ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

import { useIsClient } from "./use-media-query";

/**
 * A sheet that rises from the bottom of a phone screen: the section summary,
 * the module menu. Closed by Escape, by a tap on the dimmed editor, or by the
 * choice made inside it.
 *
 * In a portal: the editor's header has a backdrop-blur, which makes it the
 * containing block of anything fixed inside it — a sheet rendered there was
 * pinned under the header instead of the bottom of the screen.
 */
export function BottomSheet({
  open,
  onClose,
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
}) {
  // `document` exists only in the browser; the sheet is closed while hydrating anyway.
  const isClient = useIsClient();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!isClient) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end bg-studio-violet/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className="w-full rounded-t-3xl bg-white shadow-studio-card"
            initial={{ y: 48 }}
            animate={{ y: 0 }}
            exit={{ y: 48 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
