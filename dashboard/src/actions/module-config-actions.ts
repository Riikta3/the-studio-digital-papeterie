"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateModuleConfig({
  moduleId,
  config,
}: {
  moduleId: string;
  config: Record<string, unknown>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Get wedding → site
  const { data: wedding } = await supabase
    .from("weddings")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!wedding) throw new Error("Wedding not found");

  const { data: site } = await supabase
    .from("sites")
    .select("id")
    .eq("wedding_id", wedding.id)
    .single();

  if (!site) throw new Error("Site not found");

  // Check if the row exists first
  const { data: existing, error: fetchError } = await supabase
    .from("site_modules")
    .select("id, position")
    .eq("site_id", site.id)
    .eq("module_id", moduleId)
    .maybeSingle();

  if (!existing) {
    // Row doesn't exist — insert with position from modules table default
    const { error: insertError } = await supabase
      .from("site_modules")
      .insert({ site_id: site.id, module_id: moduleId, config, position: 0 });
    if (insertError) throw new Error(insertError.message);
  } else {
    const { error: updateError } = await supabase
      .from("site_modules")
      .update({ config })
      .eq("id", existing.id);
    if (updateError) throw new Error(updateError.message);
  }

  for (const locale of ["fr", "en", "de", "es", "pt", "it", "ar", "zh", "ja"]) {
    revalidatePath(`/${locale}/modules`);
    revalidatePath(`/${locale}/modules/${moduleId}`);
  }

  // Also revalidate the invitation page on landing (all slugs)
  revalidatePath("/", "layout");
}

export async function getModuleConfig(moduleId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: wedding } = await supabase
    .from("weddings")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!wedding) return null;

  const { data: site } = await supabase
    .from("sites")
    .select("id, modules")
    .eq("wedding_id", wedding.id)
    .single();

  if (!site) return null;

  const { data: siteModule } = await supabase
    .from("site_modules")
    .select("config")
    .eq("site_id", site.id)
    .eq("module_id", moduleId)
    .single();

  return {
    config: siteModule?.config ?? null,
    enabledModules: (site.modules as string[]) ?? [],
  };
}

export async function getEnabledModules() {
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
    .select("modules")
    .eq("wedding_id", wedding.id)
    .single();

  return (site?.modules as string[]) ?? [];
}
