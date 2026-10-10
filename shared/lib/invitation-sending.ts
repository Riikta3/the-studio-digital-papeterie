/**
 * Sending the invitation from the couple's own phone.
 *
 * Nothing here sends anything. The dashboard builds, for each household, a
 * `wa.me` or `sms:` link carrying the message already written; tapping it
 * opens WhatsApp or the SMS app on the couple's phone, and they press send.
 * Free, from a number the guests know, and no provider account.
 *
 * Pure functions, so the rules — phone numbers, message, who is next — are
 * tested on their own (`invitation-sending.test.mjs`).
 */

export type SendChannel = "whatsapp" | "sms";

export const MESSAGE_PLACEHOLDERS = ["{prenoms}", "{foyer}", "{lien}", "{couple}"] as const;

export const DEFAULT_INVITATION_MESSAGE =
  "Bonjour {prenoms} !\n\n" +
  "Nous avons la joie de vous inviter à notre mariage 💍\n" +
  "Découvrez votre faire-part et donnez-nous votre réponse ici :\n{lien}\n\n" +
  "Avec toute notre affection,\n{couple}";

export const DEFAULT_REMINDER_MESSAGE =
  "Bonjour {prenoms} !\n\n" +
  "Petit rappel : nous n'avons pas encore reçu votre réponse pour notre mariage. " +
  "Pouvez-vous nous la donner ici ? Il suffit de taper votre nom :\n{lien}\n\n" +
  "Merci et à très vite,\n{couple}";

/**
 * The number as WhatsApp wants it in a `wa.me` link: digits only, with the
 * country code, no `+` and no leading zero. A French national number
 * ("06 12 34 56 78") gets the default country code. Null when it cannot be a
 * phone number at all.
 */
export function whatsappNumber(phone: string | null | undefined, defaultCountryCode = "33"): string | null {
  const raw = (phone ?? "").trim();
  if (!raw) return null;

  let digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("00")) digits = digits.slice(2);
  else if (/^0\d{9}$/.test(digits)) digits = defaultCountryCode + digits.slice(1);

  digits = digits.replace(/\D/g, "");
  // E.164 numbers are 8 to 15 digits with the country code.
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

/** The number for an `sms:` link: the international form, which every phone dials. */
export function smsNumber(phone: string | null | undefined, defaultCountryCode = "33"): string | null {
  const number = whatsappNumber(phone, defaultCountryCode);
  return number ? `+${number}` : null;
}

/** "Paul", "Paul et Claire", "Paul, Claire et Léo". */
export function joinFirstNames(names: readonly string[], locale = "fr"): string {
  const clean = names.map((name) => name.trim()).filter(Boolean);
  if (clean.length === 0) return "";
  try {
    return new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(clean);
  } catch {
    return clean.join(", ");
  }
}

export type MessageValues = { prenoms: string; foyer: string; lien: string; couple: string };

/** Replaces the placeholders; an unknown `{…}` is left as the couple typed it. */
export function fillMessage(template: string, values: MessageValues): string {
  return template.replace(/\{(prenoms|foyer|lien|couple)\}/g, (_, key: keyof MessageValues) => values[key] ?? "");
}

export function whatsappLink(number: string, text: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

/**
 * `?&body=` rather than `?body=`: iOS reads the body after `&`, Android after
 * `?`, and this form is understood by both.
 */
export function smsLink(number: string, text: string): string {
  return `sms:${number}?&body=${encodeURIComponent(text)}`;
}

export type SendableHousehold = {
  id: string;
  status: string | null;
  invitation_sent_at: string | null;
};

/** Sent the invitation, and nobody in the household has answered yet. */
export function awaitsAnswer(household: SendableHousehold): boolean {
  return Boolean(household.invitation_sent_at) && (household.status ?? "pending") === "pending";
}

/**
 * Who the screen offers next.
 *   - "invite": every household not sent the invitation yet;
 *   - "remind": households sent it that have not answered.
 * Order is kept: the screen sorts, this only filters.
 */
export function sendingQueue<T extends SendableHousehold>(households: readonly T[], mode: "invite" | "remind"): T[] {
  return households.filter((household) =>
    mode === "invite" ? !household.invitation_sent_at : awaitsAnswer(household),
  );
}
