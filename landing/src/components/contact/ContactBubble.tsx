"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Mail, MessageCircle, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Link, usePathname } from "@/navigation";

const SUPPORT_EMAIL = "contact@thestudiopapeteriedigitale.com";

/**
 * WhatsApp's own glyph, inlined.
 *
 * Lucide has no WhatsApp icon — it ships no brand marks — and the generic
 * `MessageCircle` used at first read as "chat", not as WhatsApp, so nobody
 * recognised the row for what it was. Brand glyphs are the one case where a
 * recognisable shape beats a consistent icon set: the point of the row is
 * that a couple spots WhatsApp instantly.
 */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.347-.347.52-.52.174-.174.232-.298.347-.497.116-.198.058-.371-.019-.52-.077-.148-.66-1.59-.904-2.178-.238-.573-.48-.494-.66-.503-.171-.008-.367-.01-.563-.01-.196 0-.514.074-.783.372-.27.297-1.03 1.007-1.03 2.454 0 1.446 1.054 2.844 1.2 3.041.148.198 2.075 3.166 5.026 4.44.702.303 1.25.484 1.677.62.706.224 1.348.193 1.856.117.567-.085 1.34-.548 1.53-1.077.19-.53.19-.984.133-1.08-.058-.096-.213-.153-.51-.302zM12.05 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.981.999-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.002-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 016.988 2.898 9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.886 9.885zM20.52 3.449A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.548 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.684 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.52 3.45z" />
    </svg>
  );
}

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

  // WhatsApp is offered on touch devices only.
  //
  // On a phone, wa.me opens the app and the conversation is one tap away. On a
  // desktop without WhatsApp installed it redirects to web.whatsapp.com, which
  // demands a QR code the visitor has to scan with a phone they may not have
  // to hand — a dead end reached by clicking something that looked like a way
  // to talk to us. Two working options beat three with a trap in one.
  //
  // Detected after mount, never during render: `window` does not exist on the
  // server, and reading it in the render pass would make the server and client
  // markup disagree. Starting false means the row appears on a phone rather
  // than flickering away on a desktop.
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    // `any-pointer: coarse` rather than a user-agent sniff or a width query: it
    // asks the real question ("is there a finger available?"), so it holds for
    // a tablet, a touch laptop, and a narrow desktop window alike.
    setIsTouch(window.matchMedia("(any-pointer: coarse)").matches);
  }, []);

  const showWhatsApp = Boolean(whatsapp) && isTouch;

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

                {showWhatsApp && (
                  <a
                    href={`https://wa.me/${whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors hover:bg-studio-beurre"
                  >
                    <WhatsAppIcon className="h-4 w-4 shrink-0 text-[#25D366]" />
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
