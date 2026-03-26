import { supabaseAdmin } from "@/lib/supabase-admin";
import { getModuleComponent, DEFAULT_THEME } from "./module-registry";
import { Divider as MinimalistDivider } from "./themes/theme-minimalist/Divider";
import { Divider as FloralDivider } from "./themes/theme-floral/Divider";
import { Divider as BohoDivider } from "./themes/theme-boho/Divider";
import { Divider as RoyalDivider } from "./themes/theme-royal/Divider";
import { Divider as ModernDivider } from "./themes/theme-modern/Divider";
import React from "react";

const THEME_DIVIDERS: Record<string, React.ComponentType> = {
  "theme-minimalist": MinimalistDivider,
  "theme-floral": FloralDivider,
  "theme-boho": BohoDivider,
  "theme-royal": RoyalDivider,
  "theme-modern": ModernDivider,
};

export async function ModuleRenderer({
  modules,
  weddingId,
  siteId,
  weddingDate,
  extras,
  partner1,
  partner2,
  isDemo,
  themeId = DEFAULT_THEME,
}: {
  modules: string[];
  weddingId: string;
  siteId: string;
  weddingDate?: string | null;
  extras?: any;
  partner1?: string;
  partner2?: string;
  isDemo?: boolean;
  themeId?: string;
}) {
  if (!modules || modules.length === 0) return null;

  const { data: siteModules } = await supabaseAdmin
    .from("site_modules")
    .select("module_id, config, position")
    .eq("site_id", siteId);

  const configMap: Record<string, Record<string, unknown> | null> = {};
  const positionMap: Record<string, number> = {};
  (siteModules || []).forEach(({ module_id, config, position }) => {
    configMap[module_id] = config ?? null;
    positionMap[module_id] = position;
  });

  const knownModules = modules
    .filter((id) => getModuleComponent(themeId, id) !== null)
    .sort((a, b) => (positionMap[a] ?? 99) - (positionMap[b] ?? 99));

  const DividerComponent = THEME_DIVIDERS[themeId] ?? MinimalistDivider;

  return (
    <div className="flex flex-col w-full">
      {knownModules.map((moduleId, index) => {
        const ModuleComponent = getModuleComponent(themeId, moduleId)!;
        const isLast = index === knownModules.length - 1;
        return (
          <div key={moduleId}>
            <ModuleComponent
              weddingId={weddingId}
              weddingDate={weddingDate}
              extras={extras}
              config={configMap[moduleId] ?? null}
              partner1={partner1}
              partner2={partner2}
              isDemo={isDemo}
            />
            {!isLast && <DividerComponent />}
          </div>
        );
      })}
    </div>
  );
}
