/**
 * Reading `site_modules.config` in the forms.
 *
 * The column is free-form jsonb, written over the years by screens that no
 * longer exist, so nothing in it is trusted to have the shape a form expects:
 * a missing or mistyped value reads as empty, and nothing here throws. What
 * the forms then write is checked by the server (`validate.ts`).
 */

/** The row ids the server accepts — `rowId` in `validate.ts`. */
const ROW_ID = /^[\w-]{1,80}$/;

/** A string as is; anything else reads as empty. */
export function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** A plain object: not null, not an array. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The objects of a list, in order; empty for anything that is not a list. */
export function records(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

/** The strings of a list, in order; empty for anything that is not a list. */
export function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

/** The non-blank strings of a list, once each — fit to key chips or sortable tiles. */
export function uniqueStrings(value: unknown): string[] {
  return Array.from(new Set(strings(value).filter((entry) => entry.trim() !== "")));
}

/**
 * The objects of a list, each with an id a `ListEditor` can key and sort by.
 *
 * A row with no usable id — or one an earlier row already took — gets
 * `<prefix>-<index>`: stable from one render to the next, unique, and accepted
 * by the server like any other.
 */
export function keyedRows(
  value: unknown,
  prefix: string,
): Array<Record<string, unknown> & { id: string }> {
  const seen = new Set<string>();

  return records(value).map((row, index) => {
    const id =
      typeof row.id === "string" && ROW_ID.test(row.id) && !seen.has(row.id)
        ? row.id
        : `${prefix}-${index}`;
    seen.add(id);
    return { ...row, id };
  });
}
