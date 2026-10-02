/**
 * The couple's domain label: how what they type becomes a name the studio can
 * buy (docs/superpowers/specs/2026-10-02-custom-domain-design.md, D3).
 *
 * Pure, so the studio's options step, the payment route, the availability
 * endpoint and the dashboard all agree on the same name for the same input.
 * The couple only ever types the label; the TLD is fixed.
 */

/** The only TLD the studio sells: Vercel's registrar does not sell `.fr`. */
export const DOMAIN_TLD = "com";

const MIN_LABEL_LENGTH = 3;
/** The DNS limit for one label. */
const MAX_LABEL_LENGTH = 63;
/** Letters and digits at both ends, hyphens allowed only inside. */
const LABEL_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

/**
 * The TLDs a couple is likely to paste after their label. Only these are
 * stripped; any other trailing segment is part of the label.
 *
 * This used to strip any trailing run of letters written in one case, on the
 * theory that a capitalised segment reads as a name and the rest as a TLD. A
 * couple typing "sophie.pierre" all in lowercase then lost the second name
 * and was offered `sophie.com`. A list cannot mistake a first name for a TLD,
 * so it is matched in any case: "Sophie.FR" and "sophie-et-pierre.Com" are
 * both pastes.
 */
const KNOWN_TLDS = [
  "com", "fr", "net", "org", "eu", "be", "ch", "de", "es", "it", "pt",
  "io", "co", "info", "me", "wedding", "love", "paris", "app", "dev",
];
const PASTED_TLD = new RegExp(`\\.(?:${KNOWN_TLDS.join("|")})$`, "i");

/**
 * Letters NFKD leaves whole, because Unicode treats them as letters of their
 * own rather than a base letter with a mark: without this, "Lætitia" lost its
 * æ and came out `ltitia`, "Søren" `sren`, "Łukasz" `ukasz`.
 */
const TRANSLITERATIONS: Record<string, string> = {
  æ: "ae",
  Æ: "ae",
  œ: "oe",
  Œ: "oe",
  ß: "ss",
  ø: "o",
  Ø: "o",
  ł: "l",
  Ł: "l",
  đ: "d",
  Đ: "d",
  þ: "th",
  Þ: "th",
  ı: "i",
};
const TRANSLITERATED = new RegExp(`[${Object.keys(TRANSLITERATIONS).join("")}]`, "g");

/**
 * Turns free text into a domain label, in this order (spec D3):
 *
 * 1. Strips what a couple pastes: a leading `http(s)://`, a leading `www.`,
 *    trailing slashes and a trailing `.tld` from KNOWN_TLDS. Any other dot
 *    becomes a hyphen in step 5.
 * 2. NFKD, so full-width letters (`Ｓｏｐｈｉｅ`) and ligatures (`ﬁ`) become
 *    plain ones.
 * 3. Transliterates the letters NFKD does not decompose (TRANSLITERATIONS).
 * 4. Strips the combining marks NFKD split off their letter, and lowercases.
 * 5. Turns spaces, apostrophes, underscores, dots and Unicode dashes
 *    (U+2010–U+2015: "Anne‑Sophie", "Anne–Marie") into hyphens.
 * 6. Drops anything else outside `a-z0-9-`, collapses and trims hyphens.
 *
 * Names written without Latin letters (Arabic, Chinese, Japanese…) come out
 * empty: the studio sells plain ASCII `.com` names, not internationalised
 * ones, and an empty field is better than a transliteration nobody chose.
 */
export function normalizeLabel(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/+$/, "")
    .replace(PASTED_TLD, "")
    .normalize("NFKD")
    .replace(TRANSLITERATED, (letter) => TRANSLITERATIONS[letter] ?? "")
    .replace(/\p{M}/gu, "") // the accents NFKD split off their letter
    .toLowerCase()
    .replace(/[\s'’_.‐-―]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Whether a label can be bought as is: 3 to 63 characters, letters and digits
 * at both ends, no `--`. It must already be normalised — "Sophie" or
 * "so--phie" are refused rather than fixed silently, so the name the couple
 * saw is the name the studio buys. Refusing `--` also keeps the label clear
 * of the `xn--` form registries reserve for IDNs; the database's
 * `custom_domains_name_format` check refuses it too.
 */
export function isValidLabel(label: string): boolean {
  return (
    label.length >= MIN_LABEL_LENGTH &&
    label.length <= MAX_LABEL_LENGTH &&
    LABEL_PATTERN.test(label) &&
    !label.includes("--") &&
    normalizeLabel(label) === label
  );
}

export function toDomainName(label: string): string {
  return `${label}.${DOMAIN_TLD}`;
}

export interface LabelSuggestionInput {
  partner1: string;
  partner2: string;
  /** The locale's word for "and" (`CustomDomain.connector`): "et", "and", "und"… */
  connector: string;
  year?: string | number | null;
}

/** "Sophie Martin" → "sophie": the first word, as the couple is usually called. */
function firstWordLabel(name: string): string {
  return normalizeLabel(name.trim().split(/\s+/)[0] ?? "");
}

/**
 * The labels to pre-fill and to offer when the first one is taken, in order
 * of preference: `sophie-et-pierre`, `sophie-et-pierre-2027`,
 * `mariage-sophie-pierre`, `sophiepierre`, `sophie-pierre`.
 *
 * Each candidate is normalised once assembled, so an empty connector or year
 * leaves no stray hyphen; the copies this produces are dropped, as is any
 * candidate too long to be a label. Empty when either name has nothing a
 * label can be made of.
 */
export function suggestLabels({ partner1, partner2, connector, year }: LabelSuggestionInput): string[] {
  const a = firstWordLabel(partner1);
  const b = firstWordLabel(partner2);
  if (!a || !b) return [];

  const and = normalizeLabel(connector);
  const when = normalizeLabel(String(year ?? ""));

  const candidates = [
    `${a}-${and}-${b}`,
    `${a}-${and}-${b}-${when}`,
    `mariage-${a}-${b}`,
    `${a}${b}`,
    `${a}-${b}`,
  ].map(normalizeLabel);

  return [...new Set(candidates)].filter(isValidLabel);
}
