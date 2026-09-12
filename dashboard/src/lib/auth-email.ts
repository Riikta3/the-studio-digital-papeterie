import { createClient } from "@supabase/supabase-js";
import { getTranslations } from "next-intl/server";
import { Resend } from "resend";

import {
  button,
  esc,
  linkFallback,
  muted,
  paragraph,
} from "@shared/emails/components";
import { renderEmail } from "@shared/emails/layout";

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

/**
 * `change_current` and `change_new` are the two halves of one address change:
 * Supabase confirms it from the old inbox *and* the new one, so a stolen
 * session cannot move the account somewhere the real owner cannot reach. Both
 * must be sent — see `secure_email_change_enabled` in supabase/config.toml for
 * why a local run misleadingly completes after just the first.
 */
export type AuthEmailKind =
  | "reset"
  | "magiclink"
  | "confirm"
  | "change_current"
  | "change_new";

/** Maps our kinds onto the link types Supabase's admin API accepts. */
const LINK_TYPE = {
  reset: "recovery",
  magiclink: "magiclink",
  confirm: "signup",
  change_current: "email_change_current",
  change_new: "email_change_new",
} as const;

/** Where `auth/confirm` should send the couple once the token is verified. */
const LANDING_PATH = {
  reset: "/update-password",
  magiclink: "",
  confirm: "",
  change_current: "/settings",
  change_new: "/settings",
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
  /**
   * The address being moved to. Required by both halves of a change: Supabase
   * mints the token against it, and `change_new` is delivered there.
   */
  newEmail?: string;
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

/** Translation-key prefix for each kind; the key names predate the kind names. */
const COPY_PREFIX = {
  reset: "reset",
  magiclink: "magic",
  confirm: "confirm",
  change_current: "change_current",
  change_new: "change_new",
} as const;

async function getCopy(
  kind: AuthEmailKind,
  locale: string,
  newEmail?: string,
): Promise<Copy> {
  const t = await getTranslations({ locale, namespace: "AuthEmails" });
  const prefix = COPY_PREFIX[kind];

  return {
    brand: t("brand"),
    subject: t(`${prefix}_subject`),
    heading: t(`${prefix}_heading`),
    // Only `change_current_body` takes a placeholder; next-intl ignores values
    // a message does not reference.
    body: t(`${prefix}_body`, { newEmail: newEmail ?? "" }),
    cta: t(`${prefix}_cta`),
    expires: t("expires", { hours: LINK_VALIDITY_HOURS }),
    ignore: t("ignore"),
    fallback: t("fallback"),
    footer: t("footer"),
  };
}

/**
 * `dir` follows the locale so Arabic renders right to left; everything else
 * about the shape comes from `@shared/emails`, shared with every other message
 * we send.
 */
function buildHtml(copy: Copy, link: string, locale: string): string {
  const safeLink = esc(link);

  return renderEmail({
    preheader: copy.subject,
    eyebrow: copy.brand,
    title: esc(copy.heading),
    children: [
      paragraph(esc(copy.body)),
      button(esc(copy.cta), safeLink),
      muted(esc(copy.expires)),
      muted(esc(copy.ignore)),
      linkFallback(esc(copy.fallback), safeLink),
    ],
    footer: esc(copy.footer),
    locale,
    dir: locale === "ar" ? "rtl" : "ltr",
  });
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
      ...((input.kind === "change_current" || input.kind === "change_new") &&
      input.newEmail
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

    const copy = await getCopy(input.kind, input.locale, input.newEmail);
    const resend = new Resend(apiKey);

    /*
     * `change_new` is the half addressed to the inbox being moved TO; every
     * other kind goes to the account's current address. Sending it to
     * `input.to` instead would put both links in the old mailbox and defeat
     * the point of confirming from both.
     */
    const recipient =
      input.kind === "change_new" && input.newEmail
        ? input.newEmail
        : input.to;

    await resend.emails.send({
      from: FROM,
      to: recipient,
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
