import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { THEMES } from "@/components/home/themes";
import { ThemeAtelier } from "@/components/invitation/atelier/ThemeAtelier";
import { THEME_IDS } from "@/components/invitation/themes/theme-ids";

/**
 * The theme workshop: every theme and every section of it, on one screen.
 *
 * An internal page for the studio, not for couples. Pick a theme, a dataset
 * (the demo, an almost empty wedding, a crowded one), a language and a section,
 * and look at it at phone, tablet and desktop width — side by side if wanted —
 * or at the same section across every theme. It frames the public demo route,
 * so what it shows is exactly what a guest gets.
 *
 * Off in production unless `THEME_ATELIER=1` (the control datasets only exist
 * outside production anyway, see `demoDataFor`). French only, on purpose:
 * nobody but the studio opens it. Under `/invitation/` because that prefix
 * stays open in maintenance mode, and a static segment wins over `[slug]`.
 */
export const metadata: Metadata = {
  title: "Atelier des thèmes",
  robots: { index: false, follow: false },
};

export default function ThemeAtelierPage() {
  if (process.env.NODE_ENV === "production" && process.env.THEME_ATELIER !== "1") notFound();

  // The home page's order first, then any registered theme it does not list.
  const listed = new Set<string>(THEMES.map((theme) => theme.id));
  const themes = [
    ...THEMES.map((theme) => ({ id: theme.id, name: theme.name })),
    ...THEME_IDS.filter((id) => !listed.has(id)).map((id) => ({ id, name: id })),
  ];

  return <ThemeAtelier themes={themes} />;
}
