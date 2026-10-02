import { notFound, redirect } from "next/navigation";

import { atelierEnabled, atelierThemes } from "@/components/invitation/atelier/atelier";

/**
 * The theme workshop's front door: opens the first theme's demo full page,
 * with the switcher over it (`?atelier=1`, see `AtelierBar`). The invitation is
 * the real page a guest gets; the bar changes the theme, the section, the data
 * and the language.
 *
 * An internal page for the studio. Off in production unless `THEME_ATELIER=1`
 * (the control datasets only exist outside production anyway, see
 * `demoDataFor`). Under `/invitation/` because that prefix stays open in
 * maintenance mode, and a static segment wins over `[slug]`.
 */
export default async function ThemeAtelierPage({ params }: { params: Promise<{ locale: string }> }) {
  if (!atelierEnabled()) notFound();
  const { locale } = await params;
  const [first] = atelierThemes();
  if (!first) notFound();
  redirect(`/${locale}/invitation/demo/${first.id}?atelier=1`);
}
