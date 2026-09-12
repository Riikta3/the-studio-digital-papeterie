import { Resend } from "resend";

import { button, esc, muted, paragraph } from "@shared/emails/components";
import { renderEmail } from "@shared/emails/layout";

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
 *
 * The markup comes from `@shared/emails`, which every message we send now
 * shares; only the copy below is specific to this one.
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

function buildHtml(input: WelcomeEmailInput): string {
  const couple = [input.firstName, input.partnerName]
    .filter(Boolean)
    .map((name) => esc(name as string))
    .join(" &amp; ");

  return renderEmail({
    preheader:
      "Votre invitation est prête — accédez à votre espace pour la personnaliser.",
    eyebrow: "Votre invitation est prête",
    title: couple ? `Félicitations ${couple}` : "Félicitations",
    children: [
      paragraph(
        "Votre invitation est prête. Cliquez ci-dessous pour accéder à votre espace et commencer à la personnaliser.",
      ),
      button("Accéder à mon espace", esc(input.loginLink)),
      muted(
        "Ce lien vous connecte directement, sans mot de passe. Il est valable une seule fois — si vous en avez besoin d'un nouveau, demandez-en un depuis la page de connexion.",
      ),
    ],
    footer: "Une question ? Répondez simplement à cet email.",
  });
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
