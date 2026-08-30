import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";

import { getTheme } from "@/components/invitation/themes/registry";

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
  // The themes are drawn mobile-first around a ~390-520px frame.
  return { width: 390, initialScale: 1 };
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
}: {
  params: Promise<{ themeId: string }>;
}) {
  const { themeId } = await params;
  const theme = getTheme(themeId);

  if (!theme) notFound();

  const { Root, demoData } = theme;
  return <Root data={demoData} />;
}
