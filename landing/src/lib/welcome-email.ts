import { Resend } from "resend";

/**
 * The "your site is ready" email, carrying the couple's sign-in link.
 *
 * Nothing sent this before. `generateLink()` is an admin API — it *returns* a
 * magic link, it does not deliver one — and the checkout page simply redirected
 * the browser to it. That works right up until it doesn't: a closed tab, a
 * blocked redirect, a customer paying on a phone that sleeps, and the couple
 * has paid with no way back into an account they cannot even sign into by
 * password (the flow is passwordless by design).
 *
 * It matters more now that the Stripe webhook can provision an order the
 * browser never finished: without this email that customer is never told their
 * site exists at all.
 *
 * Failure here is logged, never thrown. The wedding is already created and
 * paid for — losing it because Resend had a bad day would be the worse
 * outcome, and the same reasoning the contact form documents.
 */

const FROM = "The Studio <contact@thestudiopapeteriedigitale.com>";

export interface WelcomeEmailInput {
  to: string;
  /** First name of whoever bought, for the greeting. */
  firstName?: string;
  partnerName?: string;
  /** The Supabase magic link. Single-use, and expires. */
  loginLink: string;
}

/** Escapes interpolated values so a name with `<` cannot break the markup. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHtml(input: WelcomeEmailInput): string {
  const couple = [input.firstName, input.partnerName]
    .filter(Boolean)
    .map((name) => escapeHtml(name as string))
    .join(" & ");

  const greeting = couple ? `Félicitations ${couple},` : "Félicitations,";

  // Inline styles and a table layout: email clients strip <style> blocks and
  // have no flexbox worth relying on.
  return `<!doctype html>
<html lang="fr">
<body style="margin:0;padding:0;background:#FDFBF7;font-family:Helvetica,Arial,sans-serif;color:#4B3F72;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FDFBF7;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;padding:40px 32px;">
          <tr>
            <td style="font-size:22px;font-weight:bold;padding-bottom:24px;">
              The Studio Digital Papeterie
            </td>
          </tr>
          <tr>
            <td style="font-size:18px;font-weight:bold;padding-bottom:12px;">
              ${greeting}
            </td>
          </tr>
          <tr>
            <td style="font-size:15px;line-height:1.6;padding-bottom:24px;color:#4B3F72;">
              Votre invitation est prête. Cliquez ci-dessous pour accéder à votre
              espace et commencer à la personnaliser.
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <a href="${escapeHtml(input.loginLink)}"
                 style="display:inline-block;background:#4B3F72;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:999px;font-size:15px;font-weight:bold;">
                Accéder à mon espace
              </a>
            </td>
          </tr>
          <tr>
            <td style="font-size:13px;line-height:1.6;color:#8b83a3;padding-bottom:16px;">
              Ce lien vous connecte directement, sans mot de passe. Il est
              valable une seule fois — si vous en avez besoin d'un nouveau,
              demandez-en un depuis la page de connexion.
            </td>
          </tr>
          <tr>
            <td style="font-size:12px;line-height:1.6;color:#8b83a3;border-top:1px solid #eceaf2;padding-top:16px;">
              Une question ? Répondez simplement à cet email.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendWelcomeEmail(
  input: WelcomeEmailInput,
): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // Loud, because the couple has no other way in: the redirect is the only
    // remaining path, and it has already failed if the webhook sent this.
    console.error(
      "[WELCOME_EMAIL] RESEND_API_KEY is unset — the couple received no sign-in link.",
    );
    return { sent: false };
  }

  try {
    const resend = new Resend(apiKey);

    await resend.emails.send({
      from: FROM,
      to: input.to,
      subject: "Votre invitation est prête ✨",
      html: buildHtml(input),
      // Some clients render this instead, and every inbox preview line is
      // generated from it.
      text: [
        "Votre invitation est prête.",
        "",
        "Accédez à votre espace :",
        input.loginLink,
        "",
        "Ce lien vous connecte sans mot de passe et n'est valable qu'une fois.",
        "Une question ? Répondez simplement à cet email.",
      ].join("\n"),
    });

    console.log(`📧 Welcome email sent to ${input.to}`);
    return { sent: true };
  } catch (err) {
    console.error("[WELCOME_EMAIL] send failed", err);
    return { sent: false };
  }
}
