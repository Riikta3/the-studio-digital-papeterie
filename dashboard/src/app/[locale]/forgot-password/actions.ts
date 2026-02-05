"use server";

import { createClient } from "@/utils/supabase/server";

export async function requestPasswordReset(
  prevState: unknown,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();

  const email = formData.get("email") as string;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
  });

  if (error) {
    return { error: "Une erreur s'est produite. Veuillez réessayer." };
  }

  return { success: true };
}
