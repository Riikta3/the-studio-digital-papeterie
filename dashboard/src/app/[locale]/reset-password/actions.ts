"use server";

import { createClient } from "@/utils/supabase/server";

export async function resetPassword(
  prevState: unknown,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // Validate passwords match
  if (password !== confirmPassword) {
    return { error: "Les mots de passe ne correspondent pas." };
  }

  // Validate password length
  if (password.length < 6) {
    return { error: "Le mot de passe doit contenir au moins 6 caractères." };
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { error: "Erreur lors de la réinitialisation. Veuillez réessayer." };
  }

  return { success: true };
}
