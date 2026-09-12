import { createClient } from "@supabase/supabase-js";
import { getTranslations } from "next-intl/server";
import { Resend } from "resend";

/**
 * The account emails — password reset, sign-in link, address confirmation.
 *
 * Supabase can send these itself, and did. Two reasons it no longer does:
 *
 *   * its shared SMTP is rate limited to a handful of messages per hour, which
 *     is fine for a staging project and not for customers who have just paid;
 *   * its templates are one per type, edited in a dashboard and stored
 *     nowhere in this repo — so they could not be translated, while the rest
 *     of the product speaks nine languages.
 *
 * What does NOT change is who owns the security: `generateLink()` is an admin
 * API that asks Supabase to mint the token and hands back a URL. The token is
 * still generated, scoped and verified by Supabase exactly as before; this
 * module only decides how the message carrying it looks and who delivers it.
 *
 * That does put the link in our own process, so it is never logged, never
 * stored, and never returned to the caller — `sendAuthEmail` answers with a
 * boolean and nothing else.
 */

const FROM = "The Studio <contact@thestudiopapeteriedigitale.com>";

/**
 * Supabase's default lifetime for these links, stated in the email so the
 * couple knows how long they have. Kept in sync by hand with the Auth settings
 * in the Supabase dashboard — there is no API that reports it.
 */
const LINK_VALIDITY_HOURS = 24;

export type AuthEmailKind = "reset" | "magiclink" | "confirm" | "change";

/** Maps our kinds onto the link types Supabase's admin API accepts. */
const LINK_TYPE = {
  reset: "recovery",
  magiclink: "magiclink",
  confirm: "signup",
  change: "email_change_current",
} as const;

/** Where `auth/confirm` should send the couple once the token is verified. */
const LANDING_PATH = {
  reset: "/update-password",
  magiclink: "",
  confirm: "",
  change: "/settings",
} as const;

export interface AuthEmailInput {
  kind: AuthEmailKind;
  to: string;
  /** Locale the couple is using, so the email matches the app. */
  locale: string;
  /**
   * Only for `confirm` and `change`, where Supabase needs the password or the
   * new address to mint the link.
   */
  password?: string;
  newEmail?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Admin client, built per call rather than at module scope.
 *
 * `createClient(undefined!, undefined!)` throws, which would take down every
 * server action that transitively imports this file — the mistake
 * `lib/email.ts` documents having made. Returning null lets the caller report
 * a failed send instead of failing the whole request.
 */
function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

interface Copy {
  brand: string;
  subject: string;
  heading: string;
  body: string;
  cta: string;
  expires: string;
  ignore: string;
  fallback: string;
  footer: string;
}

async function getCopy(kind: AuthEmailKind, locale: string): Promise<Copy> {
  const t = await getTranslations({ locale, namespace: "AuthEmails" });

  return {
    brand: t("brand"),
    subject: t(`${kind === "magiclink" ? "magic" : kind}_subject`),
    heading: t(`${kind === "magiclink" ? "magic" : kind}_heading`),
    body: t(`${kind === "magiclink" ? "magic" : kind}_body`),
    cta: t(`${kind === "magiclink" ? "magic" : kind}_cta`),
    expires: t("expires", { hours: LINK_VALIDITY_HOURS }),
    ignore: t("ignore"),
    fallback: t("fallback"),
    footer: t("footer"),
  };
}

/**
 * Table layout and inline styles, mirroring `landing/src/lib/welcome-email.ts`:
 * mail clients strip `<style>` blocks and have no flexbox worth relying on.
 *
 * `dir` follows the locale so Arabic renders right to left.
 */
function buildHtml(copy: Copy, link: string, locale: string): string {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const safeLink = escapeHtml(link);

  return `<!doctype html>
<html lang="${escapeHtml(locale)}" dir="${dir}">
<body style="margin:0;padding:0;background:#FDFBF7;font-family:Helvetica,Arial,sans-serif;color:#4B3F72;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FDFBF7;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;padding:40px 32px;">
          <tr>
            <td style="font-size:22px;font-weight:bold;padding-bottom:24px;">
              ${escapeHtml(copy.brand)}
            </td>
          </tr>
          <tr>
            <td style="font-size:18px;font-weight:bold;padding-bottom:12px;">
              ${escapeHtml(copy.heading)}
            </td>
          </tr>
          <tr>
            <td style="font-size:15px;line-height:1.6;padding-bottom:24px;color:#4B3F72;">
              ${escapeHtml(copy.body)}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <a href="${safeLink}"
                 style="display:inline-block;background:#4B3F72;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:999px;font-size:15px;font-weight:bold;">
                ${escapeHtml(copy.cta)}
              </a>
            </td>
          </tr>
          <tr>
            <td style="font-size:13px;line-height:1.6;color:#8b83a3;padding-bottom:8px;">
              ${escapeHtml(copy.expires)}
            </td>
          </tr>
          <tr>
            <td style="font-size:13px;line-height:1.6;color:#8b83a3;padding-bottom:16px;">
              ${escapeHtml(copy.ignore)}
            </td>
          </tr>
          <tr>
            <td style="font-size:12px;line-height:1.6;color:#8b83a3;padding-bottom:16px;word-break:break-all;">
              ${escapeHtml(copy.fallback)}<br>
              <a href="${safeLink}" style="color:#8b83a3;">${safeLink}</a>
            </td>
          </tr>
          <tr>
            <td style="font-size:12px;line-height:1.6;color:#8b83a3;border-top:1px solid #eceaf2;padding-top:16px;">
              ${escapeHtml(copy.footer)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildText(copy: Copy, link: string): string {
  return [
    copy.heading,
    "",
    copy.body,
    "",
    link,
    "",
    copy.expires,
    copy.ignore,
    "",
    copy.footer,
  ].join("\n");
}

/**
 * Mints the link for this kind of email and delivers it through Resend.
 *
 * Returns `{ sent }` and never the link itself. Callers must not branch on
 * *why* it failed either: telling an anonymous caller that an address has no
 * account turns the password-reset form into an account oracle, which is the
 * same reason `resetPasswordForEmail` answers the same way for every address.
 */
export async function sendAuthEmail(
  input: AuthEmailInput,
): Promise<{ sent: boolean }> {
  const admin = getAdmin();
  if (!admin) {
    console.error("[AUTH_EMAIL] Supabase admin credentials are unset.");
    return { sent: false };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error(
      `[AUTH_EMAIL] RESEND_API_KEY is unset — no ${input.kind} email was delivered.`,
    );
    return { sent: false };
  }

  const dashboardUrl =
    process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3003";

  // Through `auth/confirm`, which verifies the token and sets the session
  // cookies before forwarding — the same route the checkout's magic link uses.
  const next = `/${input.locale}${LANDING_PATH[input.kind]}`;
  const redirectTo = `${dashboardUrl}/auth/confirm?next=${encodeURIComponent(next)}`;

  try {
    const { data, error } = await admin.auth.admin.generateLink({
      type: LINK_TYPE[input.kind],
      email: input.to,
      // `signup` is the only type that requires a password; the others reject
      // the field outright.
      ...(input.kind === "confirm" && input.password
        ? { password: input.password }
        : {}),
      ...(input.kind === "change" && input.newEmail
        ? { newEmail: input.newEmail }
        : {}),
      options: { redirectTo },
    } as Parameters<typeof admin.auth.admin.generateLink>[0]);

    const link = data?.properties?.action_link;

    if (error || !link) {
      // Logged without the address, so a mailbox that does not exist leaves no
      // trace tying it to a failed lookup.
      console.error(`[AUTH_EMAIL] link generation failed (${input.kind})`);
      return { sent: false };
    }

    const copy = await getCopy(input.kind, input.locale);
    const resend = new Resend(apiKey);

    await resend.emails.send({
      from: FROM,
      to: input.to,
      subject: copy.subject,
      html: buildHtml(copy, link, input.locale),
      text: buildText(copy, link),
    });

    console.log(`📧 ${input.kind} email sent`);
    return { sent: true };
  } catch (err) {
    console.error(`[AUTH_EMAIL] send failed (${input.kind})`, err);
    return { sent: false };
  }
}
