"use client";

import { ArrowUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const SHOW_AFTER_PX = 600;

// CSS transitions rather than framer-motion: this is an opacity + translate
// fade on a single button, and it was one of the imports keeping the whole
// animation bundle in the homepage's eager entry graph.
export function ScrollToTop() {
  const t = useTranslations("ScrollToTop");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label={t("ariaLabel")}
      // `visibility` rather than unmounting, so the exit transition can play;
      // it also keeps the button out of the tab order while hidden.
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`fixed bottom-6 right-6 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-studio-jaune text-studio-violet shadow-lg transition-[opacity,transform,visibility] duration-200 hover:scale-105 md:bottom-8 md:right-8 ${
        visible
          ? "visible translate-y-0 opacity-100"
          : "invisible translate-y-4 opacity-0"
      }`}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
