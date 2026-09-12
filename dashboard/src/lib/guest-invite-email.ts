import { button, esc, linkFallback, muted, paragraph } from "@shared/emails/components";
import { renderEmail } from "@shared/emails/layout";

/**
 * The invitation a couple sends to one household, carrying the link into the
 * guest area.
 *
 * This replaces a React Email component that was the only thing in the repo
 * rendering mail through JSX, and the only mail that did not look like the
 * rest: black Tailwind defaults against the studio's violet and cream. It is
 * now built from `@shared/emails` like every other message, which also drops
 * the asynchronous `render()` its caller had to await.
 */
export interface GuestInviteEmailInput {
  householdName: string;
  magicLink: string;
}

export function buildGuestInviteEmail(input: GuestInviteEmailInput): string {
  const link = esc(input.magicLink);

  return renderEmail({
    preheader: "Votre accès à l'espace invités du mariage.",
    eyebrow: "Espace invités",
    title: `Bienvenue ${esc(input.householdName)}`,
    children: [
      paragraph(
        "Vous êtes invité·e à accéder à l'espace invités de notre mariage.",
      ),
      paragraph(
        "Cliquez ci-dessous pour confirmer votre présence et retrouver toutes les informations pratiques.",
      ),
      button("Accéder à mon espace", link),
      muted(
        "Ce lien vous est personnel — il ouvre directement votre espace, sans mot de passe.",
      ),
      linkFallback(
        "Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :",
        link,
      ),
    ],
    footer: "Une question ? Répondez simplement à cet email.",
  });
}

/** The plain-text part. Every inbox preview line is generated from it. */
export function buildGuestInviteText(input: GuestInviteEmailInput): string {
  return [
    `Bienvenue ${input.householdName},`,
    "",
    "Vous êtes invité·e à accéder à l'espace invités de notre mariage.",
    "Confirmez votre présence et retrouvez les informations pratiques ici :",
    input.magicLink,
    "",
    "Une question ? Répondez simplement à cet email.",
  ].join("\n");
}
