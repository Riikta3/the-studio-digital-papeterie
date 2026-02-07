"use client";

import { createClient } from "@/utils/supabase/client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const supabase = createClient();

    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      setIsLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Pages that should never have sidebar (even if authenticated)
  const isAuthPage =
    pathname.includes("/login") ||
    pathname.includes("/register") ||
    pathname.includes("/forgot-password") ||
    pathname.includes("/reset-password");

  const isAlwaysFullScreen =
    pathname.startsWith("/rsvp") || pathname === "/preview" || isAuthPage;

  // Show sidebar only if authenticated and not on full-screen pages
  const showSidebar = isAuthenticated && !isAlwaysFullScreen;

  // Show loading state or hide content during auth check to prevent flash
  if (isLoading) {
    return null; // or a loading spinner if you prefer
  }

  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <div className='min-h-screen bg-[#FDFBF7]'>
      <Sidebar />
      <main className='md:ml-64 min-h-screen transition-all'>{children}</main>
    </div>
  );
}
