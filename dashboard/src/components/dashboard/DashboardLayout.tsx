"use client";

import { createClient } from "@/utils/supabase/client";
import { usePathname } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Sidebar } from "./Sidebar";
import { WelcomePopup } from "./WelcomePopup";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [slug, setSlug] = useState<string | null>(null);

  // Use a ref to prevent multiple concurrent fetchSlug calls for the same user
  const fetchingSlugForRef = useRef<string | null>(null);

  const supabase = createClient();

  const fetchSlug = useCallback(
    async (userId: string) => {
      if (fetchingSlugForRef.current === userId) return;
      fetchingSlugForRef.current = userId;

      console.log("🔍 [fetchSlug] Started for:", userId);
      try {
        // 1. Fetch Wedding
        const { data: wedding, error: wError } = await supabase
          .from("weddings")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        console.log("🔍 [fetchSlug] Wedding query finished:", {
          wedding,
          wError,
        });

        if (wError) {
          console.error("❌ [fetchSlug] Wedding Error:", wError);
          return;
        }

        if (wedding) {
          // 2. Fetch Site Slug
          const { data: site, error: sError } = await supabase
            .from("sites")
            .select("slug")
            .eq("wedding_id", wedding.id)
            .maybeSingle();

          console.log("🔍 [fetchSlug] Site query finished:", { site, sError });

          if (sError) {
            console.error("❌ [fetchSlug] Site Error:", sError);
          }
          if (site?.slug) {
            console.log("✅ [fetchSlug] Slug found:", site.slug);
            setSlug(site.slug);
          } else {
            console.warn(
              "⚠️ [fetchSlug] No slug found for wedding:",
              wedding.id,
            );
          }
        } else {
          console.warn("⚠️ [fetchSlug] No wedding found for user:", userId);
        }
      } catch (err) {
        console.error("💥 [fetchSlug] Unexpected crash:", err);
      } finally {
        fetchingSlugForRef.current = null;
      }
    },
    [supabase],
  );

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      console.log("🚀 [initAuth] Starting check...");
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!mounted) return;

        console.log("🚀 [initAuth] User found:", !!user);
        const authenticated = !!user;
        setIsAuthenticated(authenticated);

        if (authenticated && user) {
          // Trigger fetch but don't await to avoid blocking layout
          fetchSlug(user.id);
        }
      } catch (err) {
        console.error("💥 [initAuth] Failed:", err);
      } finally {
        if (mounted) {
          console.log("🚀 [initAuth] Setting isLoading to false");
          setIsLoading(false);
        }
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("🔔 [authChange] Event:", event);
      if (!mounted) return;

      const authenticated = !!session?.user;
      setIsAuthenticated(authenticated);

      if (authenticated && session?.user) {
        fetchSlug(session.user.id);
      } else {
        setSlug(null);
      }

      console.log("🔔 [authChange] Setting isLoading to false");
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchSlug]);

  // Debug state log
  useEffect(() => {
    console.log("🏥 [Layout State] Active:", {
      isAuthenticated,
      isLoading,
      slug,
      pathname,
    });
  }, [isAuthenticated, isLoading, slug, pathname]);

  const isAuthPage =
    pathname.includes("/login") ||
    pathname.includes("/register") ||
    pathname.includes("/forgot-password") ||
    pathname.includes("/reset-password");

  const isAlwaysFullScreen =
    pathname.startsWith("/rsvp") || pathname === "/preview" || isAuthPage;

  const showSidebar = isAuthenticated && !isAlwaysFullScreen;

  if (isLoading) {
    if (
      !isAuthPage &&
      !pathname.includes("/preview") &&
      !pathname.startsWith("/rsvp")
    ) {
      return (
        <div className='fixed inset-0 z-[100] flex items-center justify-center bg-[#FDFBF7]'>
          <div className='flex flex-col items-center gap-4'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
            <p className='text-xs text-gray-400'>
              Initialisation de votre espace...
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <div className='min-h-screen bg-[#FDFBF7]'>
      <Suspense fallback={null}>
        <WelcomePopup slug={slug || undefined} />
      </Suspense>
      <Sidebar slug={slug} />
      <main className='md:ml-64 min-h-screen transition-all'>{children}</main>
    </div>
  );
}
