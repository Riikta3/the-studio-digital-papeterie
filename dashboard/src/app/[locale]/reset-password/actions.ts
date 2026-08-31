"use server";

import { createClient } from "@/utils/supabase/server";
import { getTranslations } from "next-intl/server";

export async function resetPassword(
  prevState: unknown,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const t = await getTranslations("ResetPassword");

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // Validate passwords match
  if (password !== confirmPassword) {
    return { error: t("error_mismatch") };
  }

  // Validate password length
  if (password.length < 6) {
    return { error: t("error_too_short") };
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { error: t("error_generic") };
  }

  return { success: true };
}
