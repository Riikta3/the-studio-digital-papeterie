"use server";

import { Project } from "@/types/builder";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// Helper to get Supabase Server Client
async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
}

export async function getProject() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Fetch the project associated with the user
  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("wedding_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching project:", error);
    return { error: error.message };
  }

  if (!project) {
    // Auto-create project if it doesn't exist (Self-healing for legacy accounts)
    const initialBuilderState = {
      themeId: "default",
      modules: [],
    };

    const { data: newProject, error: createError } = await supabase
      .from("projects")
      .insert({
        wedding_id: user.id,
        state: initialBuilderState,
        theme_id: "default",
        status: "draft",
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating project:", createError);
      return { error: "Failed to create project" };
    }

    // Use the newly created project
    return {
      project: {
        id: newProject.id,
        userId: newProject.wedding_id,
        meta: {
          title: "My Wedding Website",
          coupleNames: "Couple",
          date: new Date().toISOString(),
          themeId: newProject.theme_id || "default",
        },
        modules: [],
        status: newProject.status,
        paidModules: [],
      },
    };
  }

  // Transform DB shape to App shape if needed
  // DB: state (jsonb), theme_id, status
  // App: Project interface

  const appProject: Project = {
    id: project.id,
    userId: project.wedding_id,
    meta: {
      title: "My Wedding Website", // Could be stored or derived
      coupleNames: "Couple", // Fetch from Profile if needed
      date: new Date().toISOString(), // Fetch from Profile
      themeId: project.theme_id || "default",
    },
    modules: project.state?.modules || [],
    status: project.status,
    paidModules: [], // Need to fetch purchases to populate this
  };

  return { project: appProject };
}

export async function saveProjectState(
  projectId: string,
  state: Record<string, any>,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("projects")
    .update({ state, updated_at: new Date().toISOString() })
    .eq("id", projectId)
    .eq("wedding_id", user.id); // Security check

  if (error) {
    console.error("Error saving project:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getPurchases() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { data: purchases, error } = await supabase
    .from("purchases")
    .select("*")
    .eq("wedding_id", user.id);

  if (error) {
    console.error("Error fetching purchases:", error);
    return { items: [] };
  }

  return { items: purchases };
}
