"use server";

import { getLocale, getTranslations } from "next-intl/server";

import { sendAuthEmail } from "@/lib/auth-email";

/**
 * Emails a fresh sign-in link.
 *
 * The accounts created at checkout are passwordless: `createUser` is called
 * without one, and the couple is expected to arrive through the magic link in
 * their welcome email. That link is single-use and expires, so once it is
 * spent the only route back was "Mot de passe oublié" — a reset for a password
 * that does not exist. The couple could not get into an account they had paid
 * for, and nothing on the login page said how.
 *
 * This is the way back in. It reuses `sendAuthEmail`, which already mints and
 * delivers `magiclink` in all nine languages.
 */
export async function requestMagicLink(
  prevState: unknown,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const t = await getTranslations("Login");
  const locale = await getLocale();

  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: t("magic_link_error") };
  }

  await sendAuthEmail({ kind: "magiclink", to: email, locale });

  /*
   * The same answer whether or not that address has an account, and whether
   * or not the send succeeded — the reasoning `forgot-password/actions.ts`
   * already documents. Anything else turns this form into an oracle for "is
   * this person a customer", which is exactly the defect recorded against
   * /api/check-email. A failure is in our logs, not in a stranger's browser.
   */
  return { success: true };
}
