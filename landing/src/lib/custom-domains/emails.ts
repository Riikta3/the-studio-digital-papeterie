import { Resend } from "resend";

import { button, esc, infoRow, infoTable, muted, paragraph } from "@shared/emails/components";
import { renderEmail } from "@shared/emails/layout";

import { getDashboardUrl } from "@/lib/urls";

import type { CoupleNotice, Mailer, StudioAlert } from "./advance";

/**
 * The purchase engine's emails
 * (docs/superpowers/specs/2026-10-02-custom-domain-design.md, D5, "Emails").
 *
 * Three to the couple — the domain is live, the name was lost, a reminder to
 * choose one — and one to the studio whenever a row is failed, or needs a
 * hand while it waits (Vercel refusing our token). French only, like the
 * welcome email (translated domain emails are out of scope).
 *
 * Sending never throws: a missing RESEND_API_KEY or a refused send is logged
 * and answered `{ sent: false }`. That matters — the engine then releases the
 * notice it claimed (`active`, `studio_failed`, …), so a later run sends it
 * again. The engine also bounds every send by 10 s (advance.ts, MAIL_TIMEOUT_MS).
 */

/** The welcome email's sender (landing/src/lib/welcome-email.ts). */
const FROM = "The Studio <contact@thestudiopapeteriedigitale.com>";
const STUDIO_FALLBACK = "contact@thestudiopapeteriedigitale.com";
const FOOTER = "Une question ? Répondez simplement à cet email.";

/**
 * The dashboard's locales (dashboard/src/navigation.ts). Not imported:
 * next-intl's navigation module only loads inside Next, and the cron, the
 * tests and the engine's scripts load this file outside it.
 */
const DASHBOARD_LOCALES = new Set(["fr", "en", "de", "es", "pt", "it", "ar", "zh", "ja"]);

/**
 * Where the couple chooses or follows their domain. The dashboard's home for
 * now: Phase 7 of docs/superpowers/plans/2026-10-02-custom-domain.md adds the
 * « Nom de domaine » block, and this link then gains its anchor.
 */
export function dashboardHome(locale: string, origin: string = getDashboardUrl()): string {
  const safe = DASHBOARD_LOCALES.has(locale) ? locale : "fr";
  return `${origin.replace(/\/$/, "")}/${safe}`;
}

export interface BuiltEmail {
  subject: string;
  html: string;
  text: string;
}

function coupleOf(notice: CoupleNotice): string {
  return [notice.contact.firstName, notice.contact.partnerName]
    .filter((name): name is string => Boolean(name?.trim()))
    .map((name) => esc(name.trim()))
    .join(" &amp; ");
}

/** The couple's email for `notice.code`. `dashboardUrl` is `dashboardHome(locale)`. */
export function buildCoupleNoticeEmail(notice: CoupleNotice, dashboardUrl: string): BuiltEmail {
  const couple = coupleOf(notice);
  const name = notice.name ? esc(notice.name) : null;
  const dashboard = esc(dashboardUrl);

  if (notice.code === "active") {
    const shown = name ?? "votre domaine";
    const site = notice.name ? `https://${notice.name}` : dashboardUrl;
    return {
      subject: `Votre domaine ${notice.name ?? "personnalisé"} est en ligne ✨`,
      html: renderEmail({
        preheader: `Votre invitation est désormais accessible sur ${notice.name ?? "votre domaine"}.`,
        eyebrow: "Votre domaine est en ligne",
        title: couple ? `Bonne nouvelle ${couple}` : "Bonne nouvelle",
        children: [
          paragraph(
            `Votre invitation est désormais accessible à l'adresse <strong>${shown}</strong>. Vos invités peuvent l'ouvrir dès maintenant, et la page du jour J les attend sur ${shown}/jourj.`,
          ),
          button("Voir mon invitation", esc(site)),
          muted(
            "Le lien que vous avez déjà partagé continue de fonctionner : rien ne change pour les invités qui l'ont reçu.",
          ),
        ],
        footer: FOOTER,
      }),
      text: [
        `Votre invitation est désormais accessible à l'adresse ${notice.name ?? "de votre domaine"}.`,
        "",
        site,
        "",
        "Le lien que vous avez déjà partagé continue de fonctionner.",
        "",
        FOOTER,
      ].join("\n"),
    };
  }

  if (notice.code === "name_unavailable") {
    const lost = name
      ? `Le nom <strong>${name}</strong> a été pris juste avant que nous puissions l'enregistrer pour vous.`
      : "Le nom que vous aviez choisi a été pris juste avant que nous puissions l'enregistrer pour vous.";
    const free =
      "Votre domaine reste réglé : choisissez simplement un autre nom depuis votre espace, sans aucun frais supplémentaire. Nous nous occupons du reste.";
    return {
      subject: `${notice.name ?? "Votre nom de domaine"} a été pris, choisissez-en un autre`,
      html: renderEmail({
        preheader: "Votre domaine reste réglé : il ne vous reste qu'à choisir un autre nom.",
        eyebrow: "Votre nom de domaine",
        title: "Un autre nom à choisir",
        children: [
          paragraph(lost),
          paragraph(free),
          button("Choisir un autre nom", dashboard),
          muted("En attendant, votre invitation reste accessible par son lien habituel."),
        ],
        footer: FOOTER,
      }),
      text: [
        notice.name
          ? `Le nom ${notice.name} a été pris juste avant que nous puissions l'enregistrer pour vous.`
          : "Le nom que vous aviez choisi a été pris juste avant que nous puissions l'enregistrer pour vous.",
        "",
        free,
        "",
        "Choisir un autre nom :",
        dashboardUrl,
        "",
        FOOTER,
      ].join("\n"),
    };
  }

  const waiting =
    "Votre nom de domaine personnalisé est réglé, mais il n'a pas encore de nom. Choisissez-le depuis votre espace : nous l'enregistrons et le relions à votre invitation en quelques minutes.";
  const spelling = "Vérifiez bien l'orthographe : un nom enregistré ne peut plus être modifié.";
  return {
    subject: "Votre nom de domaine vous attend",
    html: renderEmail({
      preheader: "Il ne reste qu'à choisir le nom : nous nous occupons du reste.",
      eyebrow: "Votre nom de domaine",
      title: couple ? `${couple}, votre nom de domaine vous attend` : "Votre nom de domaine vous attend",
      children: [paragraph(waiting), button("Choisir mon nom de domaine", dashboard), muted(spelling)],
      footer: FOOTER,
    }),
    text: [waiting, "", "Choisir mon nom de domaine :", dashboardUrl, "", spelling, "", FOOTER].join("\n"),
  };
}

/** Why the engine stopped, for a human. Unknown codes are Vercel's own, shown as is. */
const REASON_FR: Record<string, string> = {
  step_keeps_dying: "L'étape a été interrompue trois fois de suite sans rien enregistrer : le processus meurt en la faisant.",
  registrar_not_configured:
    "VERCEL_API_TOKEN, VERCEL_TEAM_ID ou VERCEL_LANDING_PROJECT_ID manque sur le projet landing : aucun appel à Vercel n'a été fait.",
  registrant_missing:
    "Les coordonnées du titulaire sont incomplètes ou invalides (DOMAIN_REGISTRANT_*, COMPANY_*, voir landing/.env.example) : rien n'a été acheté.",
  price_above_ceiling: "Le prix Vercel dépasse le plafond de 15 $ par an : rien n'a été acheté.",
  certificate_timeout: "Le domaine est acheté et rattaché, mais aucun certificat HTTPS n'a répondu en 48 h.",
  name_missing: "La ligne n'a pas de nom alors que son statut en demande un.",
  name_unsupported: "Le nom n'est pas un .com : le studio ne vend rien d'autre, rien n'a été acheté.",
  invalid_years: "Le nombre d'années de la ligne n'est pas une durée vendue par le registre.",
  paid_amount_mismatch:
    "Le montant payé (price_paid_cents) est inférieur au prix du domaine pour ces années : rien n'a été acheté.",
  expected_price_mismatch: "Le prix Vercel a changé entre le devis et l'achat, cinq fois de suite : rien n'a été acheté.",
  buy_unconfirmed:
    "Un appel d'achat n'a jamais reçu de réponse claire, et le domaine n'est pas apparu sur le compte en 24 h : notre commande est peut-être en attente. Vérifiez le tableau de bord Vercel (Domains › commandes) avant toute relance.",
  order_pending_timeout:
    "La commande Vercel est toujours en attente 24 h après l'appel d'achat. Vérifiez-la sur le tableau de bord Vercel.",
  order_id_not_saved:
    "Vercel a accepté la commande, mais son identifiant n'a pas pu être enregistré sur la ligne. Il figure ci-dessous : la ligne vérifiera le compte d'elle-même, mais gardez-le.",
  domain_already_in_account:
    "Le domaine est déjà sur le compte de l'équipe, acheté avant cette commande (ou ajouté sans achat Vercel) : il n'est pas attribué au couple. Vérifiez à qui il appartient.",
  search_unknown: "La recherche Vercel n'a pas su dire si le nom est libre (réponse incomplète), cinq fois de suite.",
  quote_unavailable: "Vercel n'a donné aucun prix pour un nom que sa recherche disait libre, cinq fois de suite.",
  vercel_unauthorized:
    "Vercel refuse nos appels (401 ou 403) : VERCEL_API_TOKEN expiré, révoqué ou sans accès à l'équipe VERCEL_TEAM_ID. Un 403 peut aussi venir d'un domaine tenu par un autre compte Vercel : voir le détail.",
  order_too_expensive: "Vercel a refusé la commande, trop chère (order_too_expensive) : rien n'a été acheté.",
  tld_not_supported: "Vercel ne vend plus cette extension (tld_not_supported) : rien n'a été acheté.",
  domain_too_short: "Vercel a refusé le nom, trop court (domain_too_short) : rien n'a été acheté.",
  invalid_additional_contact_info: "Vercel a refusé les coordonnées complémentaires du titulaire : rien n'a été acheté.",
  additional_contact_info_required: "Vercel exige des coordonnées complémentaires pour ce nom : rien n'a été acheté.",
  emoji_tld_not_supported: "Vercel a refusé un nom à emoji : rien n'a été acheté.",
  language_code_required: "Vercel exige un code de langue pour ce nom : rien n'a été acheté.",
  invalid_order: "La commande a été refusée avant l'appel (années ou prix invalides) : rien n'a été acheté.",
};

const STATUS_LABEL: Record<string, string> = {
  queued: "queued (en attente d'achat)",
  purchasing: "purchasing (achat en cours)",
  registered: "registered (acheté, en cours de rattachement)",
};

/** The studio's email for a row the engine has failed, or that needs a hand while it waits (`status` not failed). */
export function buildStudioAlertEmail(alert: StudioAlert): BuiltEmail {
  const name = alert.name ?? "(sans nom)";
  const failed = alert.status === "failed";
  const reason = REASON_FR[alert.lastError] ?? "Un appel à Vercel a échoué cinq fois de suite, ou a répondu un code inattendu.";
  const mayHaveOrder = alert.orderMayExist
    ? "La ligne était en cours d'achat : une commande a peut-être été passée chez Vercel. Vérifiez-la avant toute relance."
    : null;
  const relaunch = failed
    ? "Rien n'est relancé automatiquement. Après correction : remettre status à son étape, attempts et claims_since_progress à 0, next_attempt_at à now(). Une ligne qui garde son vercel_order_id suit cette commande au lieu d'acheter : ne l'effacez que si la commande a échoué et que le domaine n'est pas sur le compte."
    : "La ligne n'est pas en échec : elle réessaie seule toutes les 30 minutes, sans compter d'échec, et reprendra dès que Vercel acceptera nos appels.";
  const previous = STATUS_LABEL[alert.previousStatus] ?? alert.previousStatus;

  const rows: Array<[string, string]> = [
    ["Ligne", alert.id],
    ["Nom", name],
    ["Statut", alert.status],
    ["Statut précédent", previous],
    ["last_error", alert.lastError],
    ...(alert.detail ? ([["Détail Vercel", alert.detail]] as Array<[string, string]>) : []),
    ["Commande Vercel", alert.orderId ?? "—"],
    ["Échecs", String(alert.attempts)],
    ["Site", alert.siteId],
    ["Mariage", alert.weddingId],
  ];

  return {
    subject: `[Domaine · ${failed ? "échec" : "action requise"}] ${name} — ${alert.lastError}`,
    html: renderEmail({
      preheader: `${name} · ${alert.lastError}`,
      eyebrow: failed ? "Nom de domaine · échec" : "Nom de domaine · action requise",
      title: esc(name),
      children: [
        paragraph(esc(reason)),
        ...(mayHaveOrder ? [paragraph(`<strong>${esc(mayHaveOrder)}</strong>`)] : []),
        infoTable(rows.map(([label, value]) => infoRow(esc(label), esc(value)))),
        muted(esc(relaunch)),
      ],
      footer: "Moteur d'achat des domaines · landing/src/lib/custom-domains/advance.ts",
    }),
    text: [
      reason,
      ...(mayHaveOrder ? ["", mayHaveOrder] : []),
      "",
      ...rows.map(([label, value]) => `${label} : ${value}`),
      "",
      relaunch,
    ].join("\n"),
  };
}

async function send(tag: string, message: { to: string; subject: string; html: string; text: string }): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error(`[${tag}] RESEND_API_KEY is unset — email not sent:`, message.subject);
    return { sent: false };
  }
  try {
    const { error } = await new Resend(apiKey).emails.send({ from: FROM, ...message });
    // Resend answers a refused send in `error` rather than by throwing. The
    // welcome email can ignore it; a claimed notice cannot, or it would be
    // marked sent and never retried.
    if (error) {
      console.error(`[${tag}] send refused`, error);
      return { sent: false };
    }
    return { sent: true };
  } catch (error) {
    console.error(`[${tag}] send failed`, error);
    return { sent: false };
  }
}

/** The engine's mailer, through Resend. */
export const resendMailer: Mailer = {
  async sendCoupleNotice(notice) {
    let dashboardUrl: string;
    try {
      dashboardUrl = dashboardHome(notice.contact.locale);
    } catch (error) {
      // getDashboardUrl() throws in production when its variable is missing.
      console.error("[DOMAIN_NOTICE_EMAIL] no dashboard URL", error);
      return { sent: false };
    }
    const result = await send("DOMAIN_NOTICE_EMAIL", { to: notice.contact.email, ...buildCoupleNoticeEmail(notice, dashboardUrl) });
    if (result.sent) console.log(`📧 Domain email "${notice.code}" sent to ${notice.contact.email}`);
    return result;
  },

  async sendStudioAlert(alert) {
    const to = process.env.CONTACT_NOTIFY_TO || STUDIO_FALLBACK;
    return send("DOMAIN_STUDIO_ALERT", { to, ...buildStudioAlertEmail(alert) });
  },
};
