/**
 * The couple's own words for everything their invitation prints.
 *
 * Stored as one flat `{ key: text }` map in `settings.invitation_texts`
 * (migration 20260927120000). Two kinds of key share it:
 *
 *   - **Contract copy** — fields of `InvitationData` that no screen could write
 *     before the editor: the programme's intro, the footer note, the monogram,
 *     the day-after note… Namespaced by where they land (`copy.*`, `couple.*`,
 *     `dayTwo.*`) and lifted into those fields by the landing mapper.
 *   - **Theme slots** — the words a theme would otherwise print from its own
 *     catalogue or markup: "La dolce vita commence dans", "Dress code · Jour 2",
 *     the "ITALIA" stamp. Keyed `<sectionId>.<role>` so a key means the same
 *     thing in every theme, and handed to the theme as `data.texts`.
 *
 * A map rather than columns because the slot set is open — every theme
 * declares its own — while every value obeys the same rules. Both apps import
 * this file: the dashboard to clean what it saves, the landing to clean what it
 * reads, so the two can never disagree about what a valid entry is.
 */

/** The contract fields this map may carry, and nothing else under these prefixes. */
export const CONTRACT_TEXT_KEYS = [
  "copy.dateLabel",
  "copy.dateSpelled",
  "copy.scheduleIntro",
  "copy.rsvpIntro",
  "copy.rsvpNote",
  "copy.footerNote",
  "couple.monogram",
  "dayTwo.dateLabel",
  "dayTwo.timeLabel",
  "dayTwo.note",
] as const;

export type ContractTextKey = (typeof CONTRACT_TEXT_KEYS)[number];

const CONTRACT_KEYS: ReadonlySet<string> = new Set(CONTRACT_TEXT_KEYS);

/**
 * `section.role` — a section id (kebab-case, as in `gift-list`) and a
 * camelCase role. The dot is required, which also keeps `__proto__` and
 * friends out of a map built from untrusted JSON.
 */
export const TEXT_KEY_PATTERN = /^[a-z][a-zA-Z-]*\.[a-zA-Z][a-zA-Z0-9]*$/;

/** Long enough for a paragraph of intro, short enough to stay a sentence. */
export const MAX_TEXT_LENGTH = 600;

/** Every slot of the richest theme, several times over. */
export const MAX_TEXT_KEYS = 120;

export function isContractTextKey(key: string): key is ContractTextKey {
  return CONTRACT_KEYS.has(key);
}

/**
 * Narrows whatever the column holds to the map it is meant to be.
 *
 * Keeps well-formed keys with non-empty string values, trimmed, with Windows
 * line endings folded to `\n` (a textarea on Windows posts `\r\n`, and themes
 * split titles on `\n`). An empty value means "use the default" and is dropped
 * rather than stored, so a cleared field cannot print a blank line where the
 * theme's own words belonged.
 */
export function normaliseTexts(value: unknown): Record<string, string> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  const texts: Record<string, string> = {};
  let count = 0;

  for (const [key, raw] of Object.entries(value)) {
    if (count >= MAX_TEXT_KEYS) break;
    if (!TEXT_KEY_PATTERN.test(key) || typeof raw !== "string") continue;

    const text = raw.replace(/\r\n?/g, "\n").trim();
    if (!text) continue;

    texts[key] = text.slice(0, MAX_TEXT_LENGTH);
    count += 1;
  }

  return texts;
}

/** Separates contract copy from theme slots, for the mapper. */
export function splitTexts(texts: Record<string, string>): {
  contract: Partial<Record<ContractTextKey, string>>;
  slots: Record<string, string>;
} {
  const contract: Partial<Record<ContractTextKey, string>> = {};
  const slots: Record<string, string> = {};

  for (const [key, text] of Object.entries(texts)) {
    if (isContractTextKey(key)) contract[key] = text;
    else slots[key] = text;
  }

  return { contract, slots };
}
