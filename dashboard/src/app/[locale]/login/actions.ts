"use server";

import { createClient } from "@/utils/supabase/server";
import { getTranslations } from "next-intl/server";

export async function login(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const t = await getTranslations("Login");

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: t("error_invalid_credentials") };
  }

  return { success: true };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // Don't redirect here, let the client handle it
}
