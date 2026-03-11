import { InvitationFooter } from "@/components/invitation/InvitationFooter";
import { InvitationPageClient } from "@/components/invitation/InvitationPageClient";
import { ScrollToModules } from "@/components/invitation/ScrollToModules";
import { ModuleRenderer } from "@/components/invitation/ModuleRenderer";
import { ScrollToTop } from "@/components/invitation/ScrollToTop";
import { supabaseAdmin } from "@/lib/supabase-admin";
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

  // 1. Find Wedding ID via Site Slug or Settings Code
  // Try slug first (friendly URL)
  const { data: siteBySlug } = await supabaseAdmin
    .from("sites")
    .select("wedding_id")
    .eq("slug", decodedCode)
    .single();

  let weddingId = siteBySlug?.wedding_id;

  if (!weddingId) {
    // Try wedding_code in settings (fallback/legacy)
    const { data: settingsByCode } = await supabaseAdmin
      .from("settings")
      .select("wedding_id")
      .eq("wedding_code", decodedCode)
      .single();

    weddingId = settingsByCode?.wedding_id;
  }

  if (!weddingId) {
    console.error("Wedding not found for code/slug:", decodedCode);
    return notFound();
  }

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
    .select("id, theme_id, modules, plan_id, extras, languages")
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
    <InvitationPageClient hasIntro>
    <div
      className={`${themeClass} min-h-screen bg-background text-foreground font-sans`}
    >
      {/* --- HERO SECTION --- (We will extract this to a component) */}
      <header className='relative h-[100svh] flex items-center justify-center overflow-hidden'>
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
        <ScrollToModules />
      </header>

      {/* --- DYNAMIC MODULES RENDERER --- */}
      <main
        id='modules'
        className='max-w-4xl mx-auto py-20 px-4 relative z-10'
      >
        <ModuleRenderer
          modules={siteConfig.modules}
          weddingId={weddingId}
          siteId={siteConfig.id}
          weddingDate={profile.wedding_date}
          extras={siteConfig.extras}
          partner1={profile.first_name}
          partner2={profile.partner_name || ""}
        />
      </main>

      {/* --- PREMIUM FOOTER --- */}
      <InvitationFooter profile={profile} />

      {/* --- SCROLL TO TOP FLOATING ACTION BUTTON --- */}
      <ScrollToTop />
    </div>
    </InvitationPageClient>
  );
}
