import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";

import { DemoLinkGuard } from "@/components/invitation/DemoLinkGuard";
import { InvitationMusic } from "@/components/invitation/InvitationMusic";
import { AtelierBar } from "@/components/invitation/atelier/AtelierBar";
import { atelierEnabled, atelierThemes } from "@/components/invitation/atelier/atelier";
import { demoDataFor } from "@/components/invitation/themes/fixtures";
import { getTheme } from "@/components/invitation/themes/registry";
import { demoTrackFor } from "@shared/data/music-library";
import { musicPublicUrl, resolveMusicSource } from "@shared/lib/music";

/**
 * Demo of one invitation theme, rendered inside the phone mockup on the home
 * page (`src/components/home/Preview.tsx`) and linked from the theme carousel.
 *
 * The route is generic: every registered theme gets its demo here, from its own
 * manifest. Adding a theme adds its demo — there is nothing to wire up.
 */

/**
 * Rendered on demand rather than prerendered.
 *
 * `generateStaticParams` looks right here — the theme list is known at build
 * time — but the `[locale]` layout above calls `getMessages()` without passing
 * a locale, so next-intl reads it off the request. That is a dynamic API, and
 * a page that opts into prerendering while its layout reads the request fails
 * at runtime with DYNAMIC_SERVER_USAGE: a 500 in production, invisible in
 * `next dev`.
 *
 * Prerendering these is worth revisiting, but the fix belongs in the layout
 * (`setRequestLocale` + `generateStaticParams` on the locale segment), which
 * changes rendering for every page in the app. Until then this route behaves
 * like every other page here: dynamic, and correct.
 */
export const dynamic = "force-dynamic";

export async function generateViewport(): Promise<Viewport> {
  // The phone's own width, like any page. A fixed `width: 390` with
  // `initialScale: 1` laid narrower phones (360 px Androids, the 375 px
  // iPhone SE) out 390 wide at scale 1, so guests could drag the invitation
  // sideways; every theme now holds down to 320.
  return { width: "device-width", initialScale: 1 };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ themeId: string }>;
}): Promise<Metadata> {
  const { themeId } = await params;
  const theme = getTheme(themeId);

  return {
    title: theme ? `${theme.name} — Aperçu` : "Aperçu — The Studio",
    description: theme?.description,
    // Previews must never be indexed: they are demo content on a real domain.
    robots: { index: false, follow: false },
  };
}

export default async function ThemeDemoPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; themeId: string }>;
  searchParams: Promise<{ fixture?: string; atelier?: string }>;
}) {
  const { locale, themeId } = await params;
  const { fixture, atelier } = await searchParams;
  const theme = getTheme(themeId);

  if (!theme) notFound();

  // `?fixture=minimal|heavy` swaps in a control dataset outside production, to
  // check a theme against data that is not its own demo.
  const { Root, demoData } = theme;
  // Every demo plays its theme's own track (`THEME_DEMO_TRACKS`): a
  // prospect hears the option before buying it. Silent inside the home
  // page's mock-up (see InvitationMusic).
  const music = resolveMusicSource(
    { music_enabled: true, music_track: demoTrackFor(theme.id), music_upload_path: null },
    (path) => musicPublicUrl(process.env.NEXT_PUBLIC_SUPABASE_URL!, path),
  );
  return (
    <>
      {/* First in the DOM, though fixed on screen: a keyboard or screen-reader
          user reaches the mute button before the whole invitation. */}
      {music ? (
        <InvitationMusic
          src={music.src}
          weddingKey={`demo:${theme.id}`}
          accentColor={theme.accentColor}
          themeId={theme.id}
        />
      ) : null}
      <Root data={demoDataFor(demoData, fixture)} />
      {/* Made-up hotels, funds and phone numbers lead nowhere in a demo. */}
      <DemoLinkGuard />
      {/* The studio's workshop switcher (`/invitation/atelier`), never for guests. */}
      {atelier === "1" && atelierEnabled() ? (
        <AtelierBar
          themes={atelierThemes()}
          themeId={theme.id}
          fixture={fixture === "minimal" || fixture === "heavy" ? fixture : "demo"}
          locale={locale}
        />
      ) : null}
    </>
  );
}
