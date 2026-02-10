"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getSettings() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("wedding_id", user.id)
    .single();

  if (error) {
    // Code PGRST116: JSON object requested, multiple (or no) rows returned
    if (error.code === "PGRST116") {
      console.log("No settings found for user, creating default settings...");
      const { data: newSettings, error: insertError } = await supabase
        .from("settings")
        .insert([{ wedding_id: user.id }])
        .select()
        .single();

      if (insertError) {
        console.error("Error creating default settings:", insertError);
        return null;
      }
      return newSettings;
    }

    console.error("Error fetching settings:", error);
    return null;
  }

  return data;
}

export async function getProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get profile data
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return {
    ...profile,
    email: user.email, // Email comes from auth.users
  };
}

export async function updateSettings(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non authentifié" };
  }

  const wedding_code = formData.get("wedding_code");

  const { error } = await supabase
    .from("settings")
    .update({ wedding_code })
    .eq("wedding_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non authentifié" };
  }

  const firstName = formData.get("firstName") as string;
  const partnerName = formData.get("partnerName") as string;

  // Update public.profiles
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: firstName,
      partner_name: partnerName,
    })
    .eq("id", user.id);

  if (error) {
    return { success: false, error: "Erreur lors de la mise à jour du profil" };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function updateEmail(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;

  const { error } = await supabase.auth.updateUser({ email });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    message: "Un email de confirmation a été envoyé à la nouvelle adresse.",
  };
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (password !== confirmPassword) {
    return { success: false, error: "Les mots de passe ne correspondent pas" };
  }

  if (password.length < 6) {
    return {
      success: false,
      error: "Le mot de passe doit faire au moins 6 caractères",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, message: "Mot de passe mis à jour avec succès" };
}

export async function deleteAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non authentifié" };
  }

  // Use Admin Client to delete user from Auth (which cascades to DB via our migration)
  const adminClient = await import("@supabase/supabase-js").then(
    ({ createClient }) =>
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      ),
  );

  const { error } = await adminClient.auth.admin.deleteUser(user.id);

  if (error) {
    console.error("Delete account error:", error);
    return { success: false, error: "Erreur lors de la suppression du compte" };
  }

  // Sign out
  await supabase.auth.signOut();

  redirect("/");
}
