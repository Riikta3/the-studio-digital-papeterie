"use client";

import { logout } from "@/app/[locale]/login/actions";
import { Link, usePathname } from "@/navigation";
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
import {
  CreditCard,
  Grid,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import { LanguageSwitcher } from "./LanguageSwitcher";

const navItems = [
  { key: "home", href: "/", icon: Home },
  { key: "guests", href: "/guests", icon: Users },
  { key: "messages", href: "/messages", icon: MessageSquare },
  { key: "seating_plan", href: "/seating-plan", icon: Grid },
  { key: "billing", href: "/billing", icon: CreditCard },
  { key: "settings", href: "/settings", icon: Settings },
];

export function Sidebar({ slug }: { slug: string | null }) {
  const t = useTranslations("Sidebar");
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Close sidebar on mobile when navigating
  const handleLinkClick = () => setIsOpen(false);

  const handleLogout = async () => {
    try {
      // Hide UI immediately for smooth transition
      setIsOpen(false);
      await logout();
      // Force full page reload to clear auth state
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <>
      {/* Mobile Header (Sticky) */}
      <div className='md:hidden sticky top-0 z-30 bg-[#FDFBF7]/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <Button
            variant='ghost'
            size='icon'
            className='-ml-2'
            onClick={() => setIsOpen(true)}
          >
            <Menu className='h-6 w-6' />
          </Button>
          <span className='font-heading text-lg font-bold'>
            <Image
              src='/logo.png'
              alt='The Studio'
              width={300}
              height={90}
              className='h-8 w-auto object-contain'
              priority
            />
          </span>
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
          "fixed top-0 left-0 h-full w-64 bg-white border-r border-border shadow-sm z-50 transition-transform duration-300 ease-in-out md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className='flex flex-col h-full p-6'>
          {/* Logo & Close Button */}
          <div className='mb-10 pl-2 flex justify-between items-start'>
            <div>
              <div className='relative w-40 h-12'>
                <Image
                  src='/logo.png'
                  alt='The Studio'
                  fill
                  className='object-contain object-left'
                  sizes='(max-width: 768px) 100vw, 200px'
                  priority
                />
              </div>
            </div>
            <Button
              variant='ghost'
              size='icon'
              className='md:hidden -mt-1 -mr-2 text-muted-foreground'
              onClick={() => setIsOpen(false)}
            >
              <X className='h-5 w-5' />
            </Button>
          </div>

          {/* Navigation */}
          <nav className='space-y-2 flex-1'>
            {navItems.map((item) => {
              // Match exact path or subpath (for guests/...)
              // Since pathname now includes locale (e.g. /fr/guests), we can't simple compare equal
              // But items.href are root paths e.g. /guests

              const isActive =
                item.href === "/"
                  ? pathname === "/" ||
                    pathname === "/fr" ||
                    pathname === "/en" ||
                    pathname.endsWith("/fr") ||
                    pathname.endsWith("/en")
                  : pathname.includes(item.href);

              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-gray-50 hover:text-foreground",
                  )}
                >
                  <Icon size={20} />
                  {t(item.key)}
                </Link>
              );
            })}
          </nav>

          {/* Builder Link */}
          <div className='mb-6'>
            <button
              onClick={() => {
                if (!slug) return;
                const isDev = window.location.hostname === "localhost";
                const baseUrl = isDev
                  ? "http://localhost:3002"
                  : process.env.NEXT_PUBLIC_DASHBOARD_URL ||
                    "https://the-studio.digital";
                window.open(`${baseUrl}/fr/invitation/${slug}`, "_blank");
              }}
              className={cn(
                "flex items-center justify-center gap-2 w-full px-3 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-all shadow-sm whitespace-nowrap",
                !slug && "opacity-50 cursor-not-allowed pointer-events-none",
              )}
            >
              <Grid size={16} />
              <span>{t("view_site")}</span>
            </button>
          </div>

          {/* Footer Actions */}
          <div className='mt-auto border-t border-border pt-6 space-y-2'>
            <div className='mb-2'>
              <LanguageSwitcher />
            </div>

            <Dialog
              open={showLogoutDialog}
              onOpenChange={setShowLogoutDialog}
            >
              <DialogTrigger asChild>
                <Button
                  variant='ghost'
                  className='w-full justify-start text-red-500 hover:bg-red-50 hover:text-red-600 gap-3'
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
