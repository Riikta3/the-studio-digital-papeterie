"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/utils/supabase/server";
import { APP_MODULES } from "@shared/data/modules";
import { revalidatePath } from "next/cache";

/**
 * Returns enabled modules ordered by site_modules.position.
 * Modules without a site_modules row get their default_order from APP_MODULES.
 */
export async function getOrderedModules() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: wedding } = await supabase
    .from("weddings")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!wedding) return [];

  const { data: site } = await supabase
    .from("sites")
    .select("id, modules")
    .eq("wedding_id", wedding.id)
    .single();
  if (!site) return [];

  const rawIds: string[] = (site.modules as string[]) ?? [];

  // Only keep IDs that exist in APP_MODULES (filter out stale/invalid IDs)
  const validAppIds = new Set(APP_MODULES.map((m) => m.id));
  const enabledIds = rawIds.filter((id) => validAppIds.has(id));

  const { data: siteModules } = await supabase
    .from("site_modules")
    .select("module_id, position")
    .eq("site_id", site.id)
    .in("module_id", enabledIds);

  const positionMap: Record<string, number> = {};
  (siteModules ?? []).forEach(({ module_id, position }) => {
    positionMap[module_id] = position;
  });

  // Modules without a position row yet
  const missingIds = enabledIds.filter((id) => !(id in positionMap));

  // Initialize missing positions in DB so drag & drop works immediately
  if (missingIds.length > 0) {
    const inserts = missingIds.map((moduleId) => ({
      site_id: site.id,
      module_id: moduleId,
      position: APP_MODULES.find((m) => m.id === moduleId)?.defaultOrder ?? 99,
      config: {},
    }));
    // Fire and forget — ignore errors (rows may already exist from a race condition)
    supabaseAdmin
      .from("site_modules")
      .insert(inserts)
      .then(({ error }) => {
        if (error) console.warn("[getOrderedModules] init positions error:", error.message);
      });

    // Populate positionMap optimistically for the current render
    missingIds.forEach((id) => {
      positionMap[id] = APP_MODULES.find((m) => m.id === id)?.defaultOrder ?? 99;
    });
  }

  return enabledIds
    .slice()
    .sort((a, b) => (positionMap[a] ?? 99) - (positionMap[b] ?? 99));
}

/**
 * Persists the new module order by updating site_modules.position for each module.
 * Creates the row if it doesn't exist yet.
 */
export async function updateModulesOrder(orderedIds: string[]) {
  // Filter out any IDs not in APP_MODULES (stale/invalid)
  const validAppIds = new Set(APP_MODULES.map((m) => m.id));
  orderedIds = orderedIds.filter((id) => validAppIds.has(id));

  console.log("[updateModulesOrder] called with:", orderedIds);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  console.log("[updateModulesOrder] user:", user.id);

  const { data: wedding } = await supabase
    .from("weddings")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!wedding) throw new Error("Wedding not found");

  console.log("[updateModulesOrder] wedding:", wedding.id);

  const { data: site } = await supabase
    .from("sites")
    .select("id")
    .eq("wedding_id", wedding.id)
    .single();
  if (!site) throw new Error("Site not found");

  console.log("[updateModulesOrder] site:", site.id);

  // Fetch which rows already exist
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("site_modules")
    .select("module_id, position")
    .eq("site_id", site.id)
    .in("module_id", orderedIds);

  console.log("[updateModulesOrder] existing rows:", existing, "fetchError:", fetchError);

  const existingIds = new Set((existing ?? []).map((r) => r.module_id));
  const toUpdate = orderedIds.filter((id) => existingIds.has(id));
  const toInsert = orderedIds.filter((id) => !existingIds.has(id));

  console.log("[updateModulesOrder] toUpdate:", toUpdate, "toInsert:", toInsert);

  // Update positions for existing rows (preserves config)
  const updates = toUpdate.map((moduleId) =>
    supabaseAdmin
      .from("site_modules")
      .update({ position: orderedIds.indexOf(moduleId) })
      .eq("site_id", site.id)
      .eq("module_id", moduleId)
  );

  // Insert rows for modules that have no row yet (empty config)
  const inserts = toInsert.map((moduleId) => ({
    site_id: site.id,
    module_id: moduleId,
    position: orderedIds.indexOf(moduleId),
    config: {},
  }));

  const [updateResults, insertResult] = await Promise.all([
    Promise.all(updates),
    inserts.length > 0
      ? supabaseAdmin.from("site_modules").insert(inserts)
      : Promise.resolve({ error: null }),
  ]);

  console.log("[updateModulesOrder] update results:", updateResults.map((r) => ({ error: r.error })));
  console.log("[updateModulesOrder] insert result:", insertResult.error);

  const firstUpdateError = updateResults.find((r) => r.error)?.error;
  if (firstUpdateError) throw new Error(firstUpdateError.message);
  if (insertResult.error) throw new Error(insertResult.error.message);

  console.log("[updateModulesOrder] done ✓");

  revalidatePath("/[locale]/modules", "page");
  revalidatePath("/", "layout");
}
