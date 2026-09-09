"use server";

import { Resend } from "resend";

import { isContactSubject } from "@/lib/contact-subjects";
import { createClient } from "@/utils/supabase/server";

/**
 * Public contact form submission.
 *
 * ── Where the security actually is ──────────────────────────────────────────
 * Not here. `NEXT_PUBLIC_SUPABASE_ANON_KEY` is public, so a bot can call
 * PostgREST directly and never execute a line of this file — the same defect
 * that made the guest list enumerable before 20260903110000. The real
 * defences (field bounds, subject enum, 60/10min global and 3/hour per email)
 * live inside `submit_contact_message`, which counts every caller.
 *
 * What this file adds is a better experience for the honest visitor, plus two
 * cheap filters for naive bots. Neither is load-bearing.
 *
 * ── Why the anon client ─────────────────────────────────────────────────────
 * Same reasoning as `invitation-submissions.ts`: the SERVICE_ROLE client would
 * switch RLS off and make the database's own rules irrelevant. The RPC is
 * granted to `anon` precisely so this path needs no elevation.
 *
 * ── Why the insert comes before the email ───────────────────────────────────
 * If Resend is down, out of quota or misconfigured, the message is already
 * stored and the visitor is told it went through — which is true. Losing a
 * customer's message because a third party had a bad day is the one failure
 * mode worth engineering against here.
 *
 * ── The qualification fields ────────────────────────────────────────────────
 * 20260909140000 extended `submit_contact_message` with everything the owner
 * brief added on top of the original name/email/subject/message/locale: the
 * wedding date and place, an approximate guest band, what the couple is
 * interested in, which collection (only relevant for two of those interests),
 * and how far along the project is. All optional, all validated again here
 * against the same enums the SQL constraints use, and all threaded into the
 * notification email — collecting them and then dropping them on the floor
 * would be worse than not asking.
 */

export type GuestBand =
  | "lt-50"
  | "50-100"
  | "100-150"
  | "150-200"
  | "gt-200"
  | "unknown";

export type ContactInterest =
  | "collection"
  | "personnaliser"
  | "sur-mesure"
  | "question"
  | "unknown";

export type ContactCollection =
  | "ciao-amore"
  | "blanc-couture"
  | "belle-rive"
  | "unknown";

export type ProjectStage =
  | "decouvre"
  | "univers-choisi"
  | "idee-precise"
  | "besoin-conseil";

export type ContactInput = {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
  locale: string;
  /** "YYYY-MM-DD", optional. */
  weddingDate?: string;
  weddingPlace?: string;
  guestBand?: GuestBand;
  interest?: ContactInterest;
  /** Only meaningful when `interest` is "collection" or "personnaliser". */
  collection?: ContactCollection;
  projectStage?: ProjectStage;
  consent?: boolean;
  /** Hidden field. A human never fills it; a naive bot fills everything. */
  honeypot?: string;
  /** Time between the form rendering and submission. Bots post instantly. */
  elapsedMs?: number;
};

export type ContactResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "rate_limited" | "error" };

const NOTIFY_FROM = "contact@thestudiopapeteriedigitale.com";
const MIN_ELAPSED_MS = 2000;

const GUEST_BANDS: readonly GuestBand[] = [
  "lt-50",
  "50-100",
  "100-150",
  "150-200",
  "gt-200",
  "unknown",
];

const INTERESTS: readonly ContactInterest[] = [
  "collection",
  "personnaliser",
  "sur-mesure",
  "question",
  "unknown",
];

const COLLECTIONS: readonly ContactCollection[] = [
  "ciao-amore",
  "blanc-couture",
  "belle-rive",
  "unknown",
];

const PROJECT_STAGES: readonly ProjectStage[] = [
  "decouvre",
  "univers-choisi",
  "idee-precise",
  "besoin-conseil",
];

const WEDDING_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * `p_subject` is a separate, required triage axis the RPC has kept from the
 * first version of the form — it is what makes the inbox scannable at a
 * glance. The new form no longer asks for it directly, so it is derived from
 * `interest`. "sur-mesure" keeps its own bucket because those leads route
 * differently; everything else — including a plain question — is
 * "avant-achat", which is what it would have been under the old single-select
 * for a visitor who has not bought yet.
 */
function deriveSubject(interest: ContactInterest | undefined): string {
  if (interest === "sur-mesure") return "sur-mesure";
  return "avant-achat";
}

export async function submitContact(
  input: ContactInput,
): Promise<ContactResult> {
  // Naive-bot filters. Answering "invalid" rather than admitting they were
  // detected keeps the two indistinguishable from a real validation failure.
  if (input.honeypot && input.honeypot.trim() !== "") {
    return { ok: false, reason: "invalid" };
  }
  if (typeof input.elapsedMs === "number" && input.elapsedMs < MIN_ELAPSED_MS) {
    return { ok: false, reason: "invalid" };
  }

  const firstName = (input.firstName ?? "").trim();
  const lastName = (input.lastName ?? "").trim();
  const email = (input.email ?? "").trim().toLowerCase();
  const message = (input.message ?? "").trim();
  const locale = (input.locale ?? "").trim();
  const weddingPlace = (input.weddingPlace ?? "").trim();
  const weddingDate = (input.weddingDate ?? "").trim();
  const interest = input.interest;
  const subject = deriveSubject(interest);

  // Mirrors the SQL bounds so the visitor gets a useful message instead of a
  // bare refusal. The SQL copy is the one that actually protects the table.
  if (
    firstName.length < 1 ||
    firstName.length > 60 ||
    lastName.length < 1 ||
    lastName.length > 60 ||
    email.length < 3 ||
    email.length > 160 ||
    !/^[^@\s]+@[^@\s.]+\.[a-z]{2,}$/i.test(email) ||
    !isContactSubject(subject) ||
    message.length < 10 ||
    message.length > 2000 ||
    locale.length < 2 ||
    locale.length > 5 ||
    (weddingPlace.length > 0 && weddingPlace.length > 160) ||
    (weddingDate.length > 0 && !WEDDING_DATE_RE.test(weddingDate)) ||
    (input.guestBand !== undefined && !GUEST_BANDS.includes(input.guestBand)) ||
    (interest !== undefined && !INTERESTS.includes(interest)) ||
    (input.collection !== undefined &&
      !COLLECTIONS.includes(input.collection)) ||
    (input.projectStage !== undefined &&
      !PROJECT_STAGES.includes(input.projectStage))
  ) {
    return { ok: false, reason: "invalid" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_contact_message", {
    p_name: "",
    p_email: email,
    p_subject: subject,
    p_message: message,
    p_locale: locale,
    p_first_name: firstName,
    p_last_name: lastName,
    p_wedding_date: weddingDate || null,
    p_wedding_place: weddingPlace || null,
    p_guest_band: input.guestBand ?? null,
    p_interest: interest ?? null,
    p_collection: input.collection ?? null,
    p_project_stage: input.projectStage ?? null,
    p_consent: input.consent === true,
  });

  if (error) {
    console.error("[contact] rpc failed", error.message);
    return { ok: false, reason: "error" };
  }

  // The RPC returns a bare boolean and deliberately does not distinguish a
  // rate limit from a validation refusal. Since the fields were already
  // checked above, a false here is in practice the rate limit — which is the
  // more useful thing to tell the visitor.
  if (data !== true) {
    return { ok: false, reason: "rate_limited" };
  }

  await notify({
    firstName,
    lastName,
    email,
    subject,
    message,
    locale,
    weddingDate: weddingDate || undefined,
    weddingPlace: weddingPlace || undefined,
    guestBand: input.guestBand,
    interest,
    collection: input.collection,
    projectStage: input.projectStage,
  });

  return { ok: true };
}

/* ------------------------------------------------------------------ *
 * Notification email
 * ------------------------------------------------------------------ */

/**
 * Human labels for the slugs the form submits.
 *
 * The slugs are what the database constrains and stores; nobody wants to read
 * `decouvre` or `lt-50` in their inbox at 8am. Kept here rather than pulled
 * from the locale files on purpose: the notification is always addressed to
 * the studio, in French, whatever language the visitor filled the form in —
 * `locale` is carried separately so the reply can be written in theirs.
 */
const GUEST_BAND_FR: Record<string, string> = {
  "lt-50": "Moins de 50",
  "50-100": "50 à 100",
  "100-150": "100 à 150",
  "150-200": "150 à 200",
  "gt-200": "Plus de 200",
  unknown: "Ne sait pas encore",
};

const INTEREST_FR: Record<string, string> = {
  collection: "Une collection existante",
  personnaliser: "Personnaliser une collection",
  "sur-mesure": "Une création sur-mesure",
  question: "Une question",
  unknown: "Ne sait pas encore",
};

const COLLECTION_FR: Record<string, string> = {
  "ciao-amore": "Ciao Amore",
  "blanc-couture": "Blanc Couture",
  "belle-rive": "Belle Rive",
  unknown: "Ne sait pas encore",
};

const STAGE_FR: Record<string, string> = {
  decouvre: "Découvre The Studio",
  "univers-choisi": "A déjà choisi son univers",
  "idee-precise": "A une idée assez précise",
  "besoin-conseil": "A besoin d'être conseillé(e)",
};

const SUBJECT_FR: Record<string, string> = {
  "avant-achat": "Avant-achat",
  "ma-commande": "Ma commande",
  technique: "Technique",
  "sur-mesure": "Sur-mesure",
  autre: "Autre",
};

/**
 * Escape every character that could break out of an HTML text node or an
 * attribute.
 *
 * This is the one thing that makes an HTML notification safe to send. The
 * body, the names and the venue are written by a stranger; interpolated raw,
 * a `<script>` or a forged `</td>` would become markup in the recipient's mail
 * client. Every interpolation below goes through this — no exceptions, and any
 * new field added later must too.
 */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** A wedding date in French, falling back to the raw value if unparsable. */
function frenchDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

/**
 * Announce the message by email. Never throws: the message is already stored,
 * so a notification failure must not turn a success into an error.
 *
 * Sent as styled HTML with a plain-text alternative, and EVERY interpolated
 * value goes through `esc()` first. That escaping is not decoration: the body,
 * the names and the venue are written by a stranger, so unescaped they would
 * turn a `<script>` or a forged `</table>` into markup in the recipient's mail
 * client. The plain-text part is not a fallback nobody sees either — some
 * clients and every notification preview render it instead.
 *
 * Nothing from the visitor reaches a header: the subject line is built from
 * the enum plus the escaped names, and `replyTo` is the address already
 * validated against a strict pattern above.
 */
async function notify(payload: {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
  locale: string;
  weddingDate?: string;
  weddingPlace?: string;
  guestBand?: GuestBand;
  interest?: ContactInterest;
  collection?: ContactCollection;
  projectStage?: ProjectStage;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[contact] RESEND_API_KEY unset — message stored, not sent");
    return;
  }

  const name = `${payload.firstName} ${payload.lastName}`.trim();

  try {
    const resend = new Resend(apiKey);

    // Studio palette, inlined: mail clients strip <style> blocks and know
    // nothing about Tailwind, so every rule has to ride on the element.
    const VIOLET = "#4B3F72";
    const LAVANDE = "#B7AFD1";
    const BEURRE = "#FFF9D6";
    const CREME = "#FFFDE8";

    // One row of the details table. `label` is ours, `value` is the visitor's
    // — hence the escaping on the latter only.
    const row = (label: string, value: string | undefined) =>
      value
        ? `<tr>
             <td style="padding:10px 16px;border-bottom:1px solid ${LAVANDE}33;font:12px/1.4 -apple-system,Segoe UI,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:${VIOLET}99;white-space:nowrap;vertical-align:top">${label}</td>
             <td style="padding:10px 16px;border-bottom:1px solid ${LAVANDE}33;font:15px/1.5 -apple-system,Segoe UI,sans-serif;color:${VIOLET}">${esc(value)}</td>
           </tr>`
        : "";

    const details = [
      row("Date du mariage", payload.weddingDate && frenchDate(payload.weddingDate)),
      row("Lieu", payload.weddingPlace),
      row("Invités", payload.guestBand && GUEST_BAND_FR[payload.guestBand]),
      row("Intérêt", payload.interest && INTEREST_FR[payload.interest]),
      row("Collection", payload.collection && COLLECTION_FR[payload.collection]),
      row("Avancement", payload.projectStage && STAGE_FR[payload.projectStage]),
    ].join("");

    const subjectLabel = SUBJECT_FR[payload.subject] ?? payload.subject;

    const html = `<!doctype html>
<html lang="fr"><body style="margin:0;padding:24px 12px;background:${CREME}">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;margin:0 auto;border-collapse:collapse;background:#fff;border-radius:20px;overflow:hidden">
    <tr>
      <td style="padding:28px 32px;background:${VIOLET}">
        <p style="margin:0;font:12px/1.4 -apple-system,Segoe UI,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:${BEURRE}b3">Nouveau message · ${esc(subjectLabel)}</p>
        <p style="margin:8px 0 0;font:600 24px/1.3 Georgia,serif;color:${BEURRE}">${esc(name)}</p>
        <p style="margin:6px 0 0;font:14px/1.5 -apple-system,Segoe UI,sans-serif">
          <a href="mailto:${esc(payload.email)}" style="color:${BEURRE};text-decoration:underline">${esc(payload.email)}</a>
        </p>
      </td>
    </tr>
    ${details ? `<tr><td style="padding:8px 16px 0"><table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">${details}</table></td></tr>` : ""}
    <tr>
      <td style="padding:24px 32px 8px">
        <p style="margin:0 0 10px;font:12px/1.4 -apple-system,Segoe UI,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:${VIOLET}99">Message</p>
        <div style="padding:16px 18px;background:${CREME};border-radius:14px;font:15px/1.65 -apple-system,Segoe UI,sans-serif;color:${VIOLET};white-space:pre-wrap;word-break:break-word">${esc(payload.message)}</div>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 32px 28px">
        <a href="mailto:${esc(payload.email)}" style="display:inline-block;padding:13px 26px;border-radius:999px;background:${VIOLET};color:${BEURRE};font:15px/1 -apple-system,Segoe UI,sans-serif;text-decoration:none">Répondre à ${esc(payload.firstName || name)}</a>
        <p style="margin:16px 0 0;font:12px/1.5 -apple-system,Segoe UI,sans-serif;color:${VIOLET}80">Formulaire de contact · langue du visiteur : ${esc(payload.locale)}</p>
      </td>
    </tr>
  </table>
</body></html>`;

    await resend.emails.send({
      from: `The Studio <${NOTIFY_FROM}>`,
      to: process.env.CONTACT_NOTIFY_TO || NOTIFY_FROM,
      replyTo: payload.email,
      subject: `[Contact · ${subjectLabel}] ${name}`,
      html,
      // Not a courtesy: some clients render this instead, and every inbox
      // preview line is generated from it.
      text: [
        `${name} — ${payload.email}`,
        `Sujet : ${subjectLabel}`,
        `Langue du visiteur : ${payload.locale}`,
        "",
        payload.weddingDate ? `Date du mariage : ${frenchDate(payload.weddingDate)}` : null,
        payload.weddingPlace ? `Lieu : ${payload.weddingPlace}` : null,
        payload.guestBand ? `Invités : ${GUEST_BAND_FR[payload.guestBand]}` : null,
        payload.interest ? `Intérêt : ${INTEREST_FR[payload.interest]}` : null,
        payload.collection ? `Collection : ${COLLECTION_FR[payload.collection]}` : null,
        payload.projectStage ? `Avancement : ${STAGE_FR[payload.projectStage]}` : null,
        "",
        "Message :",
        payload.message,
      ]
        .filter((line) => line !== null)
        .join("\n"),
    });
  } catch (err) {
    console.error("[contact] notification failed", err);
  }
}
