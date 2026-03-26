import { InvitationPageClient } from "@/components/invitation/InvitationPageClient";
import { ThemedInvitationLayout } from "@/components/invitation/ThemedInvitationLayout";
import { GuestCodeGate } from "@/components/invitation/GuestCodeGate";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { notFound } from "next/navigation";
import type { Viewport } from "next";

export const revalidate = 0;

interface InvitationPageProps {
  params: Promise<{
    locale: string;
    weddingCode: string;
  }>;
  searchParams: Promise<{ demo?: string; device?: string }>;
}

export async function generateViewport({ searchParams }: InvitationPageProps): Promise<Viewport> {
  const { device } = await searchParams;
  if (device === "desktop") {
    return { width: 1024, initialScale: 1 };
  }
  if (device === "mobile") {
    return { width: 390, initialScale: 1 };
  }
  return { width: "device-width", initialScale: 1 };
}

export default async function InvitationPage({ params, searchParams }: InvitationPageProps) {
  const { weddingCode } = await params;
  const { demo } = await searchParams;

  if (!weddingCode) {
    return notFound();
  }

  // Handle URL encoding (e.g. converting %26 back to &)
  const decodedCode = decodeURIComponent(weddingCode);

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

  // 3. Fetch guest code from settings
  const { data: settingsData } = await supabaseAdmin
    .from("settings")
    .select("guest_code")
    .eq("wedding_id", weddingId)
    .single();

  const guestCode = settingsData?.guest_code ?? null;

  // 4. Fetch Sites config (Modules, Theme, Extras)
  const { data: siteConfig, error: siteError } = await supabaseAdmin
    .from("sites")
    .select("id, theme_id, animation_id, modules, plan_id, extras, languages, is_demo")
    .eq("wedding_id", weddingId)
    .single();

  if (siteError || !siteConfig) {
    console.error("Site config not found:", siteError);
    return notFound();
  }

  const isDemo = demo === "true" && siteConfig.is_demo === true;

  const partnerNames = `${profile.first_name} & ${profile.partner_name}`;
  const invitationContent = (
    <InvitationPageClient hasIntro isDemo={isDemo} initialTheme={siteConfig.theme_id} animationId={siteConfig.animation_id ?? undefined} weddingSlug={weddingCode}>
    <ThemedInvitationLayout
      themeId={siteConfig.theme_id ?? "theme-minimalist"}
      firstName={profile.first_name}
      partnerName={profile.partner_name || ""}
      weddingDate={profile.wedding_date}
      profile={profile}
      modules={siteConfig.modules}
      weddingId={weddingId}
      siteId={siteConfig.id}
      extras={siteConfig.extras}
      isDemo={isDemo}
    />
    </InvitationPageClient>
  );

  if (guestCode && !isDemo) {
    return (
      <GuestCodeGate weddingCode={guestCode} partnerNames={partnerNames}>
        {invitationContent}
      </GuestCodeGate>
    );
  }

  return invitationContent;
}
