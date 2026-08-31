"use server";

import { createClient } from "@/utils/supabase/server";
import { getTranslations } from "next-intl/server";

export async function requestPasswordReset(
  prevState: unknown,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const t = await getTranslations("ForgotPassword");

  const email = formData.get("email") as string;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
  });

  if (error) {
    return { error: t("error_generic") };
  }

  return { success: true };
}
