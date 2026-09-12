"use client";

import { logout } from "@/app/[locale]/login/actions";
import { usePathname } from "@/navigation";
import { NAV_SECTIONS } from "@/components/navigation/nav-config";
import { NavSection } from "@/components/navigation/NavSection";
import { Button } from "@shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@shared/components/ui/dialog";
import { cn } from "@shared/lib/utils";
import { LogOut, Mail, Menu, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Sidebar({
  slug,
  siteLocale,
  isPublished,
}: {
  slug: string | null;
  /**
   * The locale to open the INVITATION in — the couple's own primary language.
   *
   * Deliberately not the `locale` from `useLocale()` just below, which is the
   * language the dashboard itself is displayed in: a couple may run their
   * dashboard in French while their guests' invitation is in English. The link
   * used to be hardcoded to `/fr/`, so a couple who bought English and Spanish
   * was sent to a French page they had not paid for.
   */
  siteLocale?: string | null;
  /**
   * Whether the invitation answers at its public URL (`sites.status`). `null`
   * while it is still being read.
   *
   * Without this the button stayed enabled after a couple unpublished their
   * site, and opening it showed them "Cette adresse ne figure pas sur la liste
   * des invités" — a message meant for a stranger, about their own invitation.
   */
  isPublished?: boolean | null;
}) {
  const t = useTranslations("Sidebar");
  const locale = useLocale();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Openable only once we know there is a slug AND that the site answers.
  // `isPublished` is null while it is still being read, which counts as "not
  // yet" — better a button that enables a moment late than one that opens a
  // 404 on the couple's own invitation.
  const canOpen = Boolean(slug) && isPublished === true;

  // Close sidebar on mobile when navigating
  const handleLinkClick = () => setIsOpen(false);

  const handleLogout = async () => {
    try {
      // Hide UI immediately for smooth transition
      setIsOpen(false);
      await logout();
      // Force full page reload to clear auth state
      window.location.href = `/${locale}/login`;
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <>
      {/* Mobile Header (Sticky) */}
      <div className='md:hidden sticky top-0 z-30 bg-studio-violet/95 backdrop-blur-sm border-b border-white/10 px-4 py-3 flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <Button
            variant='ghost'
            size='icon'
            className='-ml-2 text-white hover:bg-white/10 hover:text-white'
            onClick={() => setIsOpen(true)}
          >
            <Menu className='h-6 w-6' />
          </Button>
          <div className='flex items-center gap-2'>
            <Image
              src='/logo-jaune.svg'
              alt=''
              width={24}
              height={25}
              className='h-6 w-auto'
              priority
            />
            <span className='font-heading text-lg text-white'>
              The Studio
            </span>
          </div>
        </div>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isOpen && (
        <div
          className='fixed inset-0 bg-black/50 z-40 md:hidden'
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-studio-violet shadow-sm z-50 transition-transform duration-300 ease-in-out md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className='flex flex-col h-full p-6'>
          {/* Logo & Close Button */}
          <div className='mb-10 pl-2 flex justify-between items-start'>
            <div className='flex items-center gap-2'>
              <Image
                src='/logo-jaune.svg'
                alt=''
                width={32}
                height={34}
                className='h-8 w-auto'
                priority
              />
              <span className='font-heading text-xl text-white'>
                The Studio
              </span>
            </div>
            <Button
              variant='ghost'
              size='icon'
              className='md:hidden -mt-1 -mr-2 text-white/70 hover:bg-white/10 hover:text-white'
              onClick={() => setIsOpen(false)}
            >
              <X className='h-5 w-5' />
            </Button>
          </div>

          {/* Navigation */}
          <nav className='flex-1 space-y-1 overflow-y-auto'>
            {NAV_SECTIONS.map((section) => (
              <NavSection
                key={section.key}
                section={section}
                pathname={pathname}
                onNavigate={handleLinkClick}
              />
            ))}
          </nav>

          {/* Builder Link */}
          <div className='mb-6'>
            <button
              onClick={() => {
                if (!canOpen) return;
                const isDev = window.location.hostname === "localhost";
                const baseUrl = isDev
                  ? "http://localhost:3010"
                  : process.env.NEXT_PUBLIC_LANDING_URL ||
                    "https://www.thestudiopapeteriedigitale.com";
                window.open(
                  `${baseUrl}/${siteLocale || "fr"}/invitation/${slug}`,
                  "_blank",
                );
              }}
              disabled={!canOpen}
              title={isPublished === false ? t("view_site_unpublished") : undefined}
              className={cn(
                "flex items-center justify-center gap-2 w-full px-3 py-2.5 bg-studio-jaune text-studio-violet rounded-lg text-sm font-medium hover:bg-studio-jaune/90 transition-all shadow-sm whitespace-nowrap",
                !canOpen && "opacity-50 cursor-not-allowed pointer-events-none",
              )}
            >
              <Mail size={16} />
              <span>{t("view_site")}</span>
            </button>
            {/* Said rather than left to a disabled button: a greyed-out control
                with no reason reads as a bug. */}
            {isPublished === false ? (
              <p className='mt-1.5 text-center text-xs text-white/60'>
                {t("view_site_unpublished")}
              </p>
            ) : null}
          </div>

          {/* Footer Actions */}
          <div className='mt-auto border-t border-white/10 pt-6 space-y-2'>
            <div className='mb-2'>
              <LanguageSwitcher variant="dark" />
            </div>

            <Dialog
              open={showLogoutDialog}
              onOpenChange={setShowLogoutDialog}
            >
              <DialogTrigger asChild>
                <Button
                  variant='ghost'
                  className='w-full justify-start text-red-300 hover:bg-red-500/10 hover:text-red-200 gap-3'
                >
                  <LogOut size={18} />
                  {t("logout")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("logout_confirmation.title")}</DialogTitle>
                  <DialogDescription>
                    {t("logout_confirmation.description")}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className='gap-2 sm:gap-0'>
                  <Button
                    variant='outline'
                    onClick={() => setShowLogoutDialog(false)}
                  >
                    {t("logout_confirmation.cancel")}
                  </Button>
                  <Button
                    variant='destructive'
                    onClick={handleLogout}
                    className='bg-red-500 hover:bg-red-600 text-white'
                  >
                    {t("logout_confirmation.confirm")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </aside>
    </>
  );
}
