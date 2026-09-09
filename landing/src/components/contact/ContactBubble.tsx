"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Mail, MessageCircle, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Link, usePathname } from "@/navigation";

const SUPPORT_EMAIL = "contact@thestudiopapeteriedigitale.com";

/**
 * Floating contact bubble: a small panel offering the ways to reach a human,
 * not a chat.
 *
 * Deliberately NOT a chat widget and NOT a duplicate of the contact form.
 *   - A chat promises someone is on the other end right now. One person
 *     answers these messages, asynchronously, so a live-looking widget would
 *     be a lie the first time nobody replied for six hours.
 *   - Re-implementing the ten-field form in a bottom sheet would mean two
 *     places to keep in sync, and the qualification questions (date, venue,
 *     guest count, collection) are exactly what makes a reply useful. A
 *     cramped short version would collect worse leads than the page does.
 *
 * So the panel routes: the form for a real project, email for a quick
 * question, WhatsApp for the couples who live in it.
 *
 * It never opens on its own. Panels that pop up after a delay are the reason
 * people close these bubbles reflexively, and it would jar against the rest
 * of this site.
 */
export function ContactBubble() {
  const t = useTranslations("ContactBubble");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Hidden on /contact: the form is already on screen there, so the bubble
  // would only offer a route to the page the visitor is standing on.
  const onContactPage = pathname === "/contact";

  // Close on Escape, the convention for any dismissible overlay.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Optional: the WhatsApp row only exists once a number is configured, so
  // the panel ships useful with two options and gains the third for free.
  // Digits only — wa.me rejects spaces, "+" and punctuation.
  const whatsapp = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(
    /\D/g,
    "",
  );

  if (onContactPage) return null;

  return (
    <>
      {/* bottom-24, not bottom-6: ScrollToTop already occupies the bottom-end
          corner at `bottom-6 end-6 z-30` on the homepage, and side by side the
          two collided on a narrow phone. Stacked, both stay reachable.
          `end-*` rather than `right-*` so the bubble moves to the left in
          Arabic. z-30 keeps it under MobileMenu's scrim (z-40). */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={t("bubbleAriaLabel")}
        className="fixed bottom-24 end-6 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-studio-violet text-studio-jaune shadow-lg transition-transform hover:scale-105 active:scale-95 md:bottom-28 md:end-8"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? "close" : "open"}
            initial={{ opacity: 0, rotate: -30 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 30 }}
            transition={{ duration: 0.15 }}
            className="flex"
          >
            {open ? (
              <X className="h-5 w-5" />
            ) : (
              <MessageCircle className="h-5 w-5" />
            )}
          </motion.span>
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Scrim on small screens only: the panel covers most of a phone,
                so tapping outside must dismiss it. On desktop the panel is a
                small card and dimming the whole page for it would be heavy
                handed — clicking the bubble again closes it. */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-30 bg-studio-violet/20 md:hidden"
              aria-hidden="true"
            />

            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
              role="dialog"
              aria-modal="false"
              aria-label={t("title")}
              className="fixed bottom-40 end-6 z-30 w-[min(20rem,calc(100vw-3rem))] overflow-hidden rounded-3xl bg-white text-start shadow-[0_18px_48px_rgba(75,63,114,0.18)] md:bottom-44 md:end-8"
            >
              <div className="bg-studio-violet px-5 py-4">
                <p className="font-heading text-lg text-studio-jaune">
                  {t("title")}
                </p>
                <p className="mt-1 font-body text-xs leading-relaxed text-studio-jaune/70">
                  {t("subtitle")}
                </p>
              </div>

              <div className="flex flex-col gap-2 p-4">
                <Link
                  href="/contact"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-studio-beurre px-4 py-3 transition-colors hover:bg-studio-jaune/40"
                >
                  <span className="font-body text-sm font-semibold text-studio-violet">
                    {t("formOption")}
                  </span>
                  {/* rtl:rotate-180 so the arrow points the way the text
                      reads in Arabic. */}
                  <ArrowRight className="h-4 w-4 shrink-0 text-studio-violet rtl:rotate-180" />
                </Link>

                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors hover:bg-studio-beurre"
                >
                  <Mail className="h-4 w-4 shrink-0 text-studio-violet/60" />
                  <span className="font-body text-sm text-studio-violet">
                    {t("emailOption")}
                  </span>
                </a>

                {whatsapp && (
                  <a
                    href={`https://wa.me/${whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors hover:bg-studio-beurre"
                  >
                    <MessageCircle className="h-4 w-4 shrink-0 text-studio-violet/60" />
                    <span className="font-body text-sm text-studio-violet">
                      {t("whatsappOption")}
                    </span>
                  </a>
                )}
              </div>

              <p className="border-t border-studio-violet/10 px-5 py-3 font-body text-xs text-studio-violet/50">
                {t("responseTime")}
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
