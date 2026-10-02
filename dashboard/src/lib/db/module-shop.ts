import { knownModuleIds } from "@shared/lib/addable-modules";

import { requireWedding } from "@/lib/db/current-wedding";

export type ModuleShop = {
  themeId: string | null;
  planId: string | null;
  owned: string[];
  pending: string[];
};

/** What `/modules` needs to offer modules exactly as the editor's menu does (spec D11). */
export async function getModuleShop(): Promise<ModuleShop> {
  const { supabase, weddingId } = await requireWedding();
  const { data: site } = await supabase
    .from("sites")
    .select("theme_id, plan_id, modules, pending_modules")
    .eq("wedding_id", weddingId)
    .maybeSingle();

  const owned = knownModuleIds((site?.modules as string[] | null) ?? []);
  return {
    themeId: (site?.theme_id as string | null) ?? null,
    planId: (site?.plan_id as string | null) ?? null,
    owned,
    pending: knownModuleIds((site?.pending_modules as string[] | null) ?? []).filter((id) => !owned.includes(id)),
  };
}
