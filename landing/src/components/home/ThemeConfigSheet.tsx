"use client";

import { Button } from "@shared/components/ui/button";
import { Switch } from "@shared/components/ui/switch";
import { studioColors } from "@shared/lib/studio-colors";
import { cn } from "@shared/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

const CARD_SHADOW = `0px 22px 53.9px 0px ${studioColors.cardShadow}3D`;

export type ModuleKey =
  | "guestbook"
  | "planning"
  | "menu"
  | "rsvp"
  | "accommodation"
  | "gallery";

const MODULE_KEYS: ModuleKey[] = [
  "guestbook",
  "planning",
  "menu",
  "rsvp",
  "accommodation",
  "gallery",
];

const DEFAULT_MODULES: Record<ModuleKey, boolean> = {
  guestbook: true,
  planning: true,
  menu: false,
  rsvp: true,
  accommodation: false,
  gallery: false,
};

export type OpeningStyle = "envelope" | "door" | "curtains";

const OPENING_STYLES: OpeningStyle[] = ["envelope", "door", "curtains"];

export type ThemeConfig = {
  theme: string;
  modules: Record<ModuleKey, boolean>;
  openingStyle: OpeningStyle;
};

export function ThemeConfigSheet({
  open,
  onClose,
  themeName,
  themeImage,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  themeName: string;
  themeImage: string;
  onSave: (config: ThemeConfig) => void;
}) {
  const t = useTranslations("ThemeConfigSheet");
  const [modules, setModules] =
    useState<Record<ModuleKey, boolean>>(DEFAULT_MODULES);
  const [openingStyle, setOpeningStyle] = useState<OpeningStyle>("envelope");

  // Reset config whenever the sheet is opened for a (possibly new) theme.
  useEffect(() => {
    if (open) {
      setModules(DEFAULT_MODULES);
      setOpeningStyle("envelope");
    }
  }, [open, themeName]);

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  const activeCount = useMemo(
    () => Object.values(modules).filter(Boolean).length,
    [modules],
  );

  const toggleModule = (key: ModuleKey) =>
    setModules((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSave = () => {
    onSave({ theme: themeName, modules, openingStyle });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40"
            aria-hidden="true"
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label={t("ariaLabel", { name: themeName })}
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92vh] flex-col overflow-y-auto scrollbar-thin rounded-t-[32px] bg-studio-beurre"
          >
            <div className="sticky top-0 z-10 flex justify-end px-6 pt-6 md:px-10">
              <button
                type="button"
                onClick={onClose}
                aria-label={t("closeAriaLabel")}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-studio-violet text-studio-jaune shadow-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 md:px-10">
              <div className="relative h-40 w-full mt-4 overflow-hidden rounded-2xl border-2 border-studio-lavande">
                <Image
                  src={themeImage}
                  alt={t("themeAlt", { name: themeName })}
                  fill
                  sizes="480px"
                  className="object-cover"
                />
              </div>
            </div>

            <div className="flex flex-col gap-8 px-6 pb-8 pt-6 md:px-10">
              <div className="text-center">
                <h3 className="font-heading text-h2 text-studio-violet">
                  {t("titlePrefix")} {themeName}
                </h3>
                <p className="mx-auto mt-2 max-w-md font-body text-sm text-studio-violet/70">
                  {t("themeDescription", { name: themeName })}
                </p>
              </div>

              <div
                className="rounded-2xl bg-white p-5"
                style={{ boxShadow: CARD_SHADOW }}
              >
                <p className="font-heading text-h4 text-studio-violet">
                  {t("modulesTitle")}
                </p>
                <ul className="mt-4 flex flex-col gap-4">
                  {MODULE_KEYS.map((key) => (
                    <li
                      key={key}
                      className="flex items-center justify-between"
                    >
                      <span className="font-body text-sm text-studio-violet/80">
                        {t(`modules.${key}`)}
                      </span>
                      <Switch
                        checked={modules[key]}
                        onCheckedChange={() => toggleModule(key)}
                        aria-label={t(`modules.${key}`)}
                      />
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="font-heading text-h4 text-studio-violet">
                  {t("openingStyleTitle")}
                </p>
                <p className="mt-1 font-body text-sm text-studio-violet/70">
                  {t("openingStyleSubtitle")}
                </p>

                <div className="mt-4 flex justify-center gap-6">
                  {OPENING_STYLES.map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setOpeningStyle(style)}
                      className="flex flex-col items-center gap-2"
                    >
                      <span
                        className={cn(
                          "flex h-16 w-16 items-center justify-center rounded-full border-2 bg-gradient-to-br from-[#B97A4E] to-[#8C5A34] font-heading text-sm text-white shadow-inner transition-transform",
                          openingStyle === style
                            ? "scale-105 border-studio-violet"
                            : "border-transparent",
                        )}
                      >
                        D&A
                      </span>
                      <span className="font-body text-xs text-studio-violet/70">
                        {t(`openingStyles.${style}`)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div
                className="rounded-2xl bg-white p-5"
                style={{ boxShadow: CARD_SHADOW }}
              >
                <p className="font-heading text-h4 text-studio-violet">
                  {t("summaryTitle")}
                </p>
                <dl className="mt-4 flex flex-col gap-2 font-body text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-studio-violet/70">
                      {t("summaryModules")}
                    </dt>
                    <dd className="font-semibold text-studio-violet">
                      {activeCount} / {MODULE_KEYS.length}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-studio-violet/70">
                      {t("summaryOpeningStyle")}
                    </dt>
                    <dd className="font-semibold text-studio-violet">
                      {t(`openingStyles.${openingStyle}`)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-studio-violet/70">
                      {t("summaryTheme")}
                    </dt>
                    <dd className="font-semibold text-studio-violet">
                      {themeName}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  variant="studio-violet"
                  size="pill"
                  className="text-studio-jaune"
                  onClick={handleSave}
                >
                  {t("validateButton")} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="studio-outline"
                  size="pill"
                  className="border-studio-violet text-studio-violet hover:bg-studio-violet/10"
                  onClick={handleSave}
                >
                  {t("saveButton")}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
