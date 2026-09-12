"use server";

import { getLocale, getTranslations } from "next-intl/server";

import { sendAuthEmail } from "@/lib/auth-email";

export async function requestPasswordReset(
  prevState: unknown,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const t = await getTranslations("ForgotPassword");
  const locale = await getLocale();

  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: t("error_generic") };
  }

  /*
   * Through `sendAuthEmail` rather than `supabase.auth.resetPasswordForEmail`.
   *
   * That call pointed its `redirectTo` at `${NEXT_PUBLIC_SITE_URL}/reset-password`,
   * and `NEXT_PUBLIC_SITE_URL` is not defined for this app — the dashboard has
   * NEXT_PUBLIC_DASHBOARD_URL and NEXT_PUBLIC_LANDING_URL. So the link in the
   * email read `undefined/reset-password` and reset was simply broken in
   * production, while the form reported success.
   *
   * The replacement also fixes what the old path could not: Supabase sends one
   * template for every language, and its shared SMTP is rate limited to a
   * handful of messages an hour. Supabase still mints and verifies the token.
   */
  await sendAuthEmail({ kind: "reset", to: email, locale });

  /*
   * Always the same answer, whether or not that address has an account, and
   * regardless of whether the send succeeded. Anything else turns this form
   * into an oracle for "is this person a customer" — which is exactly the
   * defect already recorded against /api/check-email. The failure is in the
   * logs for us, not in the response for a stranger.
   */
  return { success: true };
}
