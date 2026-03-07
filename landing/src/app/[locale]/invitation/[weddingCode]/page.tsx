import { InvitationFooter } from "@/components/invitation/InvitationFooter";
import { ModuleRenderer } from "@/components/invitation/ModuleRenderer";
import { ScrollToTop } from "@/components/invitation/ScrollToTop";
import { ThemeProvider } from "@/components/theme-provider"; // if we need to force a theme
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ChevronDown } from "lucide-react";
import { notFound } from "next/navigation";

export const revalidate = 0;

interface InvitationPageProps {
  params: Promise<{
    locale: string;
    weddingCode: string;
  }>;
}

export default async function InvitationPage({ params }: InvitationPageProps) {
  const { weddingCode } = await params;

  if (!weddingCode) {
    return notFound();
  }

  // Handle URL encoding (e.g. converting %26 back to &)
  const decodedCode = decodeURIComponent(weddingCode);

  console.log("💍 Fetching invitation for code:", decodedCode);

  // 1. Find Wedding ID via Settings (which uniquely holds the wedding_code)
  const { data: settingsData, error: settingsError } = await supabaseAdmin
    .from("settings")
    .select("wedding_id")
    .eq("wedding_code", decodedCode)
    .single();

  if (settingsError || !settingsData) {
    console.error("Wedding code not found:", decodedCode, settingsError);
    return notFound();
  }

  const weddingId = settingsData.wedding_id;

  // 2. Fetch Wedding and Profile (Names, Date)
  const { data: wedding, error: weddingError } = await supabaseAdmin
    .from("weddings")
    .select(
      `
      partner_name,
      wedding_date,
      profiles (
        first_name,
        last_name
      )
    `,
    )
    .eq("id", weddingId)
    .single();

  if (weddingError || !wedding) {
    console.error("Wedding not found:", weddingError);
    return notFound();
  }

  // Normalize data for the UI
  const profile = {
    first_name: (wedding.profiles as any)?.first_name || "",
    last_name: (wedding.profiles as any)?.last_name || "",
    partner_name: wedding.partner_name,
    wedding_date: wedding.wedding_date,
  };

  // 3. Fetch Sites config (Modules, Theme, Extras)
  const { data: siteConfig, error: siteError } = await supabaseAdmin
    .from("sites")
    .select("theme_id, modules, plan_id, extras, languages")
    .eq("wedding_id", weddingId)
    .single();

  if (siteError || !siteConfig) {
    console.error("Site config not found:", siteError);
    return notFound();
  }

  // Define actual Theme class (e.g., 'theme-floral', 'theme-minimalist') mapping
  let themeClass = `theme-${siteConfig.theme_id}`;
  if (siteConfig.theme_id === "modern") themeClass = "theme-minimalist"; // mapping modern to minimalist in globals if needed, let's keep it theme-id
  // Actually, the next-theme ThemeProvider takes care of it natively if we pass the right id.

  return (
    <ThemeProvider
      attribute='class'
      defaultTheme={`theme-${siteConfig.theme_id}`}
      forcedTheme={`theme-${siteConfig.theme_id}`}
      enableSystem={false}
    >
      <div className='min-h-screen bg-background text-foreground font-sans'>
        {/* --- HERO SECTION --- (We will extract this to a component) */}
        <header className='relative h-screen flex items-center justify-center overflow-hidden'>
          {/* Background image could come from extras logic later */}
          <div
            className='absolute inset-0 bg-cover bg-center z-0 scale-105'
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=2000')",
            }}
          />
          <div className='absolute inset-0 bg-black/30 z-0' />{" "}
          {/* Dark overlay for better text readability */}
          <div className='relative z-10 text-center space-y-6 px-4 text-white'>
            <h4 className='uppercase tracking-widest text-sm font-bold text-white/80 mb-4'>
              Nous nous marions
            </h4>
            <h1 className='font-heading text-6xl md:text-8xl italic drop-shadow-lg'>
              {profile.first_name} <span className='text-primary/70'>&</span>{" "}
              {profile.partner_name}
            </h1>
            {profile.wedding_date && (
              <p className='text-xl md:text-2xl font-light mt-4 text-white/90 drop-shadow-md'>
                {new Intl.DateTimeFormat("fr-FR", {
                  dateStyle: "long",
                }).format(new Date(profile.wedding_date))}
              </p>
            )}
          </div>
          {/* Animated Scroll Arrow */}
          <div className='absolute bottom-12 left-1/2 -translate-x-1/2 z-10'>
            <div className='animate-bounce cursor-pointer'>
              <a
                href='#modules'
                className='flex flex-col items-center gap-2 text-white/70 hover:text-white transition-colors'
              >
                <span className='text-[10px] uppercase tracking-widest font-medium'>
                  Découvrir
                </span>
                <ChevronDown className='w-5 h-5' />
              </a>
            </div>
          </div>
        </header>

        {/* --- DYNAMIC MODULES RENDERER --- */}
        <main
          id='modules'
          className='max-w-4xl mx-auto py-20 px-4 relative z-10 scroll-mt-20'
        >
          <ModuleRenderer
            modules={siteConfig.modules}
            weddingId={weddingId}
            weddingDate={profile.wedding_date}
            extras={siteConfig.extras}
          />
        </main>

        {/* --- PREMIUM FOOTER --- */}
        <InvitationFooter profile={profile} />

        {/* --- SCROLL TO TOP FLOATING ACTION BUTTON --- */}
        <ScrollToTop />
      </div>
    </ThemeProvider>
  );
}
