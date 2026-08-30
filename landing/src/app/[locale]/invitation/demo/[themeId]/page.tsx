import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";

import { getTheme, themeIds } from "@/components/invitation/themes/registry";

/**
 * Static demo of one invitation theme, rendered inside the phone mockup on the
 * home page (`src/components/home/Preview.tsx`) and linked from the theme
 * carousel.
 *
 * The route is generic: every registered theme gets its demo here, from its own
 * manifest. Adding a theme adds its demo — there is nothing to wire up.
 */

export function generateStaticParams() {
  return themeIds().map((themeId) => ({ themeId }));
}

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
