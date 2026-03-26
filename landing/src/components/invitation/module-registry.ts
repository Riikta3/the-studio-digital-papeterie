// landing/src/components/invitation/module-registry.ts
import type React from "react";

// Interface partagée par TOUS les composants de modules, tous thèmes confondus.
// Chaque composant peut ignorer les props dont il n'a pas besoin.
export interface ModuleProps {
  weddingId: string;
  weddingDate?: string | null;
  extras?: Record<string, any> | null;
  config?: Record<string, any> | null;
  partner1?: string;
  partner2?: string;
  isDemo?: boolean;
}

export type ThemeModuleRegistry = Record<
  string,
  Record<string, React.ComponentType<ModuleProps>>
>;

// Sera complété en Task 6 une fois tous les composants créés
export const THEME_MODULE_COMPONENTS: ThemeModuleRegistry = {};

export const DEFAULT_THEME = "theme-minimalist";

export function getModuleComponent(
  themeId: string,
  moduleId: string
): React.ComponentType<ModuleProps> | null {
  const themeMap =
    THEME_MODULE_COMPONENTS[themeId] ??
    THEME_MODULE_COMPONENTS[DEFAULT_THEME];
  return themeMap?.[moduleId] ?? null;
}
