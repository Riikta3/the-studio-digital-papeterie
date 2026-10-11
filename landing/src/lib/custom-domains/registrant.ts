import type { RegistrantContact } from "./vercel-registrar";

/**
 * Who every couple's domain is registered to: the studio
 * (docs/superpowers/specs/2026-10-02-custom-domain-design.md, D5, "Registrant").
 *
 * Read from the same variables as the invoice's seller block
 * (`landing/src/lib/company.ts`), plus four only Vercel asks for: a person's
 * name (required even with a company), the `state`, and a mailbox for the
 * registry's notices. If anything is missing or in a shape Vercel would
 * refuse, there is no registrant at all: the engine then buys nothing and
 * alerts the studio, rather than sending an incomplete contact to a call
 * that spends money.
 *
 * Registries take contacts in ASCII, while the invoice prints the same
 * variables in French (« Île-de-France », « Saint-Étienne »). So every field
 * is transliterated here (é→e, œ→oe, æ→ae, ß→ss…), and a field that still has
 * a character outside printable ASCII is refused, by name.
 */

/** Vercel's own pattern for `phone`: E.164, an optional dot after the country code. */
const PHONE = /^(?=(?:\D*\d){8,15}$)\+[1-9]\d{0,2}\.?\d+$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PRINTABLE_ASCII = /^[\x20-\x7E]+$/;

/**
 * ISO 3166-1 alpha-2, the officially assigned codes (249). A shape check
 * would let `UK` (reserved; the code is `GB`) or `EU` through, and Vercel
 * would refuse the contact on the one call that spends money.
 */
const ISO_3166_ALPHA2 = new Set(
  (
    "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ " +
    "CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR " +
    "GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP " +
    "KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT " +
    "MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW " +
    "SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG " +
    "UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW"
  ).split(" "),
);

/**
 * `COMPANY_COUNTRY` is printed as is on the invoice, where « France » reads
 * better than « FR », and it defaults to « France » there. So the common
 * names are accepted here too; anything else must be the ISO code.
 */
const COUNTRY_NAMES: Record<string, string> = {
  france: "FR",
  belgique: "BE",
  belgium: "BE",
  suisse: "CH",
  switzerland: "CH",
  luxembourg: "LU",
  monaco: "MC",
};

/**
 * What NFKD does not split into a base letter and a mark, plus the
 * typographic punctuation French text carries (’ « » – —).
 */
const TRANSLITERATIONS: Record<string, string> = {
  æ: "ae",
  Æ: "AE",
  œ: "oe",
  Œ: "OE",
  ß: "ss",
  ẞ: "SS",
  ø: "o",
  Ø: "O",
  ł: "l",
  Ł: "L",
  đ: "d",
  Đ: "D",
  þ: "th",
  Þ: "TH",
  ı: "i",
  "‘": "'",
  "’": "'",
  "‚": "'",
  "“": '"',
  "”": '"',
  "«": '"',
  "»": '"',
  "‐": "-",
  "‑": "-",
  "‒": "-",
  "–": "-",
  "—": "-",
};
const TRANSLITERATED = new RegExp(`[${Object.keys(TRANSLITERATIONS).join("")}]`, "g");

/** `value` in ASCII where it can be: accents stripped, ligatures spelt out, spaces collapsed. */
export function toAscii(value: string): string {
  return value
    .normalize("NFKD")
    .replace(TRANSLITERATED, (char) => TRANSLITERATIONS[char] ?? char)
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

type Env = Record<string, string | undefined>;

/** The variable, trimmed and in ASCII where it can be ("" when unset). */
const read = (env: Env, key: string): string => toAscii(env[key] ?? "");

/** Spaces and hyphens are how people write a number; nothing else is dropped. */
const phoneOf = (value: string): string => value.replace(/[\s -]/g, "");

function countryOf(value: string): string | null {
  const upper = value.toUpperCase();
  if (ISO_3166_ALPHA2.has(upper)) return upper;
  return COUNTRY_NAMES[value.toLowerCase()] ?? null;
}

/** Each variable and how it is checked, in the order of the contact. */
const FIELDS: Array<{ key: string; valid?: (value: string) => boolean }> = [
  { key: "DOMAIN_REGISTRANT_FIRST_NAME" },
  { key: "DOMAIN_REGISTRANT_LAST_NAME" },
  { key: "COMPANY_LEGAL_NAME" },
  { key: "COMPANY_DOMAINS_EMAIL", valid: (value) => EMAIL.test(value) },
  { key: "COMPANY_PHONE", valid: (value) => PHONE.test(phoneOf(value)) },
  { key: "COMPANY_ADDRESS" },
  { key: "COMPANY_POSTAL_CODE" },
  { key: "COMPANY_CITY" },
  { key: "COMPANY_REGION" },
  { key: "COMPANY_COUNTRY", valid: (value) => countryOf(value) !== null },
];

/**
 * The variables that are missing or invalid, by name and never by value, for
 * the logs and the studio alert. Empty when the registrant is complete.
 */
export function registrantProblems(env: Env = process.env): string[] {
  return FIELDS.filter(({ key, valid }) => {
    const value = read(env, key);
    return !value || !PRINTABLE_ASCII.test(value) || (valid !== undefined && !valid(value));
  }).map(({ key }) => key);
}

/** Vercel's `contactInformation` for the studio, in ASCII, or null if any variable is missing or invalid. */
export function registrantFromEnv(env: Env = process.env): RegistrantContact | null {
  if (registrantProblems(env).length > 0) return null;
  return {
    firstName: read(env, "DOMAIN_REGISTRANT_FIRST_NAME"),
    lastName: read(env, "DOMAIN_REGISTRANT_LAST_NAME"),
    email: read(env, "COMPANY_DOMAINS_EMAIL"),
    phone: phoneOf(read(env, "COMPANY_PHONE")),
    address1: read(env, "COMPANY_ADDRESS"),
    city: read(env, "COMPANY_CITY"),
    state: read(env, "COMPANY_REGION"),
    zip: read(env, "COMPANY_POSTAL_CODE"),
    country: countryOf(read(env, "COMPANY_COUNTRY")) as string,
    // Required here although Vercel makes it optional: the domain must be
    // the company's, not the person's named above it.
    companyName: read(env, "COMPANY_LEGAL_NAME"),
  };
}
