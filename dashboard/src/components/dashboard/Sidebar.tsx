"use client";

import { logout } from "@/app/[locale]/login/actions";
import { Link, usePathname } from "@/navigation";
import { Button } from "@shared/components/ui/button";
import { cn } from "@shared/lib/utils";
import {
  CreditCard,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

const navItems = [
  { key: "home", href: "/", icon: Home },
  { key: "guests", href: "/guests", icon: Users },
  { key: "messages", href: "/messages", icon: MessageSquare },
  { key: "billing", href: "/billing", icon: CreditCard },
  { key: "settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const t = useTranslations("Sidebar");
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

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
      {/* Mobile Trigger */}
      <div className='md:hidden fixed top-4 left-4 z-50'>
        <Button
          variant='outline'
          size='icon'
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X /> : <Menu />}
        </Button>
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
          "fixed top-0 left-0 h-full w-64 bg-white border-r border-border shadow-sm z-40 transition-transform duration-300 ease-in-out md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className='flex flex-col h-full p-6'>
          {/* Logo */}
          <div className='mb-10 pl-2'>
            <h1 className='font-heading text-2xl font-bold tracking-tight'>
              The Studio
            </h1>
            <p className='text-xs text-muted-foreground uppercase tracking-widest mt-1'>
              Digital Suite
            </p>
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

          {/* Footer Actions */}
          <div className='mt-auto border-t border-border pt-6 space-y-2'>
            <Link
              href='/rsvp'
              target='_blank'
            >
              <Button
                variant='ghost'
                className='w-full justify-start text-muted-foreground hover:text-primary gap-3'
              >
                <Home size={18} />
                {t("view_site")}
              </Button>
            </Link>
            <Button
              variant='ghost'
              onClick={handleLogout}
              className='w-full justify-start text-red-500 hover:bg-red-50 hover:text-red-600 gap-3'
            >
              <LogOut size={18} />
              {t("logout")}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
