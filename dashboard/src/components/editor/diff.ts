import type { EditorChanges, EditorState, ModuleConfig } from "./types";

/**
 * What changed between the saved invitation and the couple's draft.
 *
 * Used twice: in the browser, to know whether there is anything to save and to
 * send only that; on the server, to turn a list the couple edited into the
 * inserts, updates and deletes it stands for.
 */

/** JSON with object keys sorted, so two equal values always compare equal. */
function stable(value: unknown): string {
  return JSON.stringify(value, (_key, inner: unknown) =>
    inner && typeof inner === "object" && !Array.isArray(inner)
      ? Object.fromEntries(
          Object.entries(inner as Record<string, unknown>).sort(([a], [b]) =>
            a < b ? -1 : a > b ? 1 : 0,
          ),
        )
      : inner,
  );
}

/**
 * Deep equality for plain data. Key order is ignored: a text the couple
 * cleared and typed again lands at the end of the map, and that must not count
 * as a change.
 */
export function sameValue(a: unknown, b: unknown): boolean {
  return stable(a) === stable(b);
}

const UNITS = [
  "names",
  "settings",
  "texts",
  "events",
  "schedule",
  "venue",
  "accommodations",
  "faq",
] as const;

/** The parts of `draft` that differ from `saved` — module configs one by one. */
export function changedUnits(saved: EditorState, draft: EditorState): EditorChanges {
  const changes: EditorChanges = {};

  for (const unit of UNITS) {
    if (!sameValue(saved[unit], draft[unit])) {
      (changes as Record<string, unknown>)[unit] = draft[unit];
    }
  }

  const modules: Record<string, ModuleConfig> = {};
  for (const [id, config] of Object.entries(draft.modules)) {
    if (!sameValue(saved.modules[id], config)) modules[id] = config;
  }
  if (Object.keys(modules).length > 0) changes.modules = modules;

  return changes;
}

/**
 * How to get from `before` to `after`, row by row.
 *
 * `order` is `after`'s ids in display order, from which the caller writes
 * positions. A row counts as updated when its content changed — a row that
 * only moved is not listed here, and the caller compares indices for that.
 */
export function diffList<T extends { id: string }>(
  before: readonly T[],
  after: readonly T[],
): { inserted: T[]; updated: T[]; deletedIds: string[]; order: string[] } {
  const previous = new Map(before.map((row) => [row.id, row]));
  const kept = new Set(after.map((row) => row.id));

  const inserted: T[] = [];
  const updated: T[] = [];

  for (const row of after) {
    const old = previous.get(row.id);
    if (!old) inserted.push(row);
    else if (!sameValue(old, row)) updated.push(row);
  }

  return {
    inserted,
    updated,
    deletedIds: before.filter((row) => !kept.has(row.id)).map((row) => row.id),
    order: after.map((row) => row.id),
  };
}
