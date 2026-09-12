"use client";

import { Button } from "@shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";
import { ExternalLink, PartyPopper } from "lucide-react";
import { useTranslations } from "next-intl";

interface WelcomePopupProps {
  slug?: string;
  /**
   * The locale to open the invitation in — the couple's own primary language,
   * not the dashboard's. This link was hardcoded to `/fr/`, so the very first
   * thing a couple who bought English saw after paying was a French page.
   */
  locale?: string;
  /** `sites.status`. Freshly true here — this popup fires just after checkout —
   *  but the button must not open a 404 if provisioning has not landed yet. */
  isPublished?: boolean | null;
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomePopup({
  slug,
  locale,
  isPublished,
  isOpen,
  onClose,
}: WelcomePopupProps) {
  const t = useTranslations("WelcomePopup");

  // `isPublished` is undefined for callers that do not know yet; only an
  // explicit `false` blocks, so this popup keeps working if the layout has not
  // read the site by the time it opens.
  const canOpen = Boolean(slug) && isPublished !== false;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-md border-none bg-white p-0 overflow-hidden rounded-3xl'>
        <div className='bg-primary/5 p-8 flex flex-col items-center text-center space-y-4'>
          <div className='w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2'>
            <PartyPopper className='w-8 h-8 text-primary' />
          </div>

          <DialogHeader>
            <DialogTitle className='font-heading text-3xl md:text-4xl font-bold text-gray-900'>
              {t("title")}
            </DialogTitle>
            <DialogDescription className='text-lg text-gray-600 max-w-[300px] mx-auto leading-relaxed'>
              {t("description")}
            </DialogDescription>
          </DialogHeader>

          <div className='flex flex-col w-full gap-3 pt-4'>
            <Button
              onClick={() => {
                if (!canOpen) return;
                const isDev = window.location.hostname === "localhost";
                const baseUrl = isDev
                  ? "http://localhost:3010"
                  : process.env.NEXT_PUBLIC_LANDING_URL ||
                    "https://www.thestudiopapeteriedigitale.com";
                window.open(
                  `${baseUrl}/${locale || "fr"}/invitation/${slug}`,
                  "_blank",
                );
              }}
              className='w-full py-6 rounded-2xl bg-primary text-white hover:bg-primary/90 transition-all text-lg font-medium shadow-lg shadow-primary/20 gap-2'
              disabled={!canOpen}
            >
              <ExternalLink className='w-5 h-5' />
              {t("view_site_btn")}
            </Button>

            <Button
              variant='ghost'
              onClick={onClose}
              className='w-full py-6 rounded-2xl text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors text-base'
            >
              {t("start_config_btn")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
