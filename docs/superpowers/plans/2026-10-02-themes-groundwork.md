# Themes Groundwork (Phase 0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the shared code the three theme ports (Maré Alta, Château Royal, Cabo Verde) all need, so three agents do not write it three times and cannot collide on the files they share.

**Architecture:** Pure, unit-tested modules (monogram, date range, RSVP payload, playlist selection) live next to the themes and are wrapped by thin client hooks and components. Two build-time scripts (a lock-protected catalogue merge, a reproducible CSS pipeline) replace the hand steps the README documents. A `dayOf` field extends the theme contract so a theme can link to the existing Jour J guest pages. A leak test and two control datasets enforce the "everything is variable" rule.

**Tech Stack:** Next.js 16 / React 19 / TypeScript, next-intl 4, Node 24 test runner with `--experimental-strip-types`, PostCSS 8 (already in the root `node_modules`), Playwright (already used by `themes:shoot`).

**Spec:** `docs/superpowers/specs/2026-10-02-three-themes-design.md` (sections D2, D4, D5, D7, D10).

## Global Constraints

- Discussion in French; code, comments and commit messages in English.
- **Never commit or push.** Every "Checkpoint" step below replaces the usual commit step; run the stated commands and stop.
- Work from the repo root `/Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie`. Paths below are relative to it.
- Run one test file: `node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs --test <file>`. Run the suite: `npm test`. **Baseline before this plan: 125 tests, all passing.**
- Type check: `npx tsc --noEmit -p landing/tsconfig.json`. **Baseline: exit 0, no output.** It must stay that way.
- Lint only what you touched, from `landing/`: `cd landing && npx eslint <path relative to landing>`.
- Modules loaded by `node --test` must use `import type { … }` (never `import { type … }`): Node's type stripping would otherwise keep a runtime import of a server-only module. They must not import React, `next-intl`, or any `"use server"` file at runtime.
- JSX cannot be loaded by `node --test`; components (`.tsx`) are verified by `tsc`, eslint and, once a theme uses them, in the browser.
- The nine locales are `fr en de es pt it ar zh ja`; catalogues are `landing/messages/<locale>.json`, written as `JSON.stringify(obj, null, 2) + "\n"` (verified byte-identical on all nine).
- Theme slot defaults take no ICU parameters. A theme's own name (e.g. "Maré Alta") is allowed anywhere in its folder; the demo couple, venue and places are not.
- A theme is one folder. Nothing in this plan edits `ciao-amore`, `belle-rive` or `blanc-couture`.
- Dev server: already running on `http://localhost:3010`. If `next dev` will not start after a crash, remove the orphaned `.next/dev/lock`.

## Review Focus

- A wedding whose `dayOf` is set but whose `weddingId` is not (showcase, editor preview): the Jour J blocks must be inert, never links to a page that 404s. (Task 5 contract comment; each theme plan enforces it.)
- A single-day wedding, a missing end date and an unparsable date in `formatDateRange` / `weddingSpan` must produce a plain date or `null`, never `"Invalid Date"` (Task 1).
- A guest who picked two children and then answered "not coming" must produce a payload with no companions (Task 2).
- Two processes running `theme-messages.mjs` at once must both land, with valid JSON in all nine files (Task 7).
- A `content:` string containing letters that the CSS config does not map must fail the port loudly instead of shipping a demo couple's words (Task 8).

---

### Task 1: Monogram and date helpers

**Files:**
- Create: `landing/src/components/invitation/themes/monogram.ts`
- Create: `landing/src/components/invitation/themes/date-range.ts`
- Test: `landing/src/lib/theme-helpers.test.mjs`

**Interfaces:**
- Produces:
  - `monogramOf(couple: InvitationData["couple"], separator?: string): string`
  - `formatDateRange(start: string | null | undefined, end: string | null | undefined, options?: { locale?: string }): string | null`
  - `formatDottedDate(value: string | null | undefined, options?: { locale?: string }): string | null`
  - `weddingSpan(data: Pick<InvitationData, "event" | "events">): { start: string; end: string } | null`
  - `heroDates(data: Pick<InvitationData, "event" | "copy">, locale: string): { dotted: string | null; spelled: string | null }`
- Consumes: `formatFrenchDate` from `./format`, `InvitationData` (type only) from `./types`.

- [ ] **Step 1: Write the failing tests**

Create `landing/src/lib/theme-helpers.test.mjs`:

```js
/**
 * Pure helpers shared by the ported themes.
 *
 *   node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs \
 *     --test landing/src/lib/theme-helpers.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  formatDateRange,
  formatDottedDate,
  heroDates,
  weddingSpan,
} from "../components/invitation/themes/date-range.ts";
import { monogramOf } from "../components/invitation/themes/monogram.ts";

/** Intl puts thin spaces around the range dash; compare with plain ones. */
const plain = (text) => text?.replace(/\s/g, " ");

/* -- monogramOf --------------------------------------------------------- */

test("the monogram the couple wrote wins, trimmed", () => {
  const couple = { partner1: "Valérie", partner2: "Gaël", monogram: "  V & G " };
  assert.equal(monogramOf(couple), "V & G");
});

test("without one, the monogram is the initials", () => {
  const couple = { partner1: "Camille", partner2: "Jonas" };
  assert.equal(monogramOf(couple), "C & J");
  assert.equal(monogramOf(couple, " · "), "C · J");
});

test("initials are upper-cased and keep their accent", () => {
  assert.equal(monogramOf({ partner1: "éléonore", partner2: "raphaël" }), "É & R");
});

test("a missing partner gives one initial, and nobody gives nothing", () => {
  assert.equal(monogramOf({ partner1: "Sienna", partner2: "" }), "S");
  assert.equal(monogramOf({ partner1: "  ", partner2: "" }), "");
});

test("a blank written monogram falls back to the initials", () => {
  assert.equal(monogramOf({ partner1: "Léa", partner2: "Hugo", monogram: "   " }), "L & H");
});

/* -- formatDateRange ---------------------------------------------------- */

test("a two-day range reads as one string", () => {
  assert.equal(formatDateRange("2027-06-19", "2027-06-20", { locale: "fr-FR" }), "19–20 juin 2027");
});

test("a range starting on the first keeps the French ordinal", () => {
  assert.equal(formatDateRange("2027-06-01", "2027-06-02", { locale: "fr-FR" }), "1er–2 juin 2027");
  assert.equal(
    plain(formatDateRange("2027-06-30", "2027-07-01", { locale: "fr-FR" })),
    "30 juin – 1er juillet 2027",
  );
});

test("other locales use their own range format", () => {
  assert.equal(plain(formatDateRange("2027-06-19", "2027-06-20", { locale: "en-US" })), "June 19 – 20, 2027");
});

test("one day, a missing end and a reversed range never break", () => {
  assert.equal(formatDateRange("2027-06-19", "2027-06-19", { locale: "fr-FR" }), "19 juin 2027");
  assert.equal(formatDateRange("2027-06-19", undefined, { locale: "fr-FR" }), "19 juin 2027");
  assert.equal(formatDateRange("2027-06-20", "2027-06-19", { locale: "fr-FR" }), "19–20 juin 2027");
});

test("an unreadable start gives null, not 'Invalid Date'", () => {
  assert.equal(formatDateRange(undefined, "2027-06-19"), null);
  assert.equal(formatDateRange("not a date", "2027-06-19"), null);
  assert.equal(formatDateRange("2027-06-19", "garbage", { locale: "fr-FR" }), "19 juin 2027");
});

/* -- formatDottedDate --------------------------------------------------- */

test("the dotted date follows the locale's order", () => {
  assert.equal(formatDottedDate("2027-04-30", { locale: "fr-FR" }), "30 · 04 · 2027");
  assert.equal(formatDottedDate("2027-04-30", { locale: "en-US" }), "04 · 30 · 2027");
  assert.equal(formatDottedDate("2027-04-30", { locale: "ja-JP" }), "2027 · 04 · 30");
});

test("the dotted date ignores a time and rejects garbage", () => {
  assert.equal(formatDottedDate("2027-04-30T16:30:00+01:00", { locale: "fr-FR" }), "30 · 04 · 2027");
  assert.equal(formatDottedDate("soon"), null);
  assert.equal(formatDottedDate(null), null);
});

/* -- weddingSpan -------------------------------------------------------- */

const event = (date) => ({ kind: "wedding-day", name: "x", day: 1, date });

test("the span covers the start and every dated event", () => {
  assert.deepEqual(
    weddingSpan({
      event: { startsAt: "2027-06-19T17:00:00+01:00" },
      events: [event("2027-06-20"), event("2027-06-18"), event(undefined)],
    }),
    { start: "2027-06-18", end: "2027-06-20" },
  );
});

test("a wedding with no events spans its own day", () => {
  assert.deepEqual(weddingSpan({ event: { startsAt: "2027-06-19T17:00:00+01:00" } }), {
    start: "2027-06-19",
    end: "2027-06-19",
  });
});

test("nothing readable means no span", () => {
  assert.equal(weddingSpan({ event: { startsAt: "soon" }, events: [event("later")] }), null);
});

/* -- heroDates ---------------------------------------------------------- */

// What the mapper hands a theme: both labels already formatted in French.
const mapped = {
  event: { startsAt: "2027-06-19T17:00:00+02:00" },
  copy: { dateLabel: "19 · 06 · 2027", dateSpelled: "samedi 19 juin 2027" },
};

test("the mapper's derived labels are re-derived in the page's language", () => {
  assert.deepEqual(heroDates(mapped, "fr-FR"), { dotted: "19 · 06 · 2027", spelled: "samedi 19 juin 2027" });
  assert.deepEqual(heroDates(mapped, "en-US"), { dotted: "06 · 19 · 2027", spelled: "Saturday, June 19, 2027" });
});

test("a label the couple rewrote is kept, in every language", () => {
  const written = {
    event: mapped.event,
    copy: { dateLabel: "Le grand jour", dateSpelled: "Un samedi de juin" },
  };
  assert.deepEqual(heroDates(written, "en-US"), { dotted: "Le grand jour", spelled: "Un samedi de juin" });
});

test("without any label the dates are derived, and a late hour does not move the day", () => {
  const late = { event: { startsAt: "2027-06-19T00:30:00+02:00" } };
  assert.deepEqual(heroDates(late, "fr-FR"), { dotted: "19 · 06 · 2027", spelled: "samedi 19 juin 2027" });
});

test("an unreadable start gives no dates", () => {
  assert.deepEqual(heroDates({ event: { startsAt: "soon" } }, "fr-FR"), { dotted: null, spelled: null });
});

test("blank labels count as unwritten", () => {
  const blank = { event: mapped.event, copy: { dateLabel: "  ", dateSpelled: "" } };
  assert.deepEqual(heroDates(blank, "fr-FR"), { dotted: "19 · 06 · 2027", spelled: "samedi 19 juin 2027" });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs --test landing/src/lib/theme-helpers.test.mjs`
Expected: FAIL — `Cannot find module` for `monogram.ts` / `date-range.ts`.

- [ ] **Step 3: Implement `monogram.ts`**

Create `landing/src/components/invitation/themes/monogram.ts`:

```ts
import type { InvitationData } from "./types";

/**
 * The couple's monogram: what they wrote on the editor's hero tab, else their
 * initials.
 *
 * `couple.monogram` is absent when the couple wrote none or cleared it (see
 * `types.ts`), and a theme whose design needs one — a seal, a crest — falls
 * back here rather than printing nothing in the middle of an ornament.
 */
export function monogramOf(couple: InvitationData["couple"], separator = " & "): string {
  const written = couple.monogram?.trim();
  if (written) return written;

  return [couple.partner1, couple.partner2]
    .map(initialOf)
    .filter((letter) => letter !== "")
    .join(separator);
}

/** First letter of a name, by code point so an astral character is not split. */
function initialOf(name: string | undefined): string {
  const first = [...(name ?? "").trim()][0];
  return first ? first.toLocaleUpperCase() : "";
}
```

- [ ] **Step 4: Implement `date-range.ts`**

Create `landing/src/components/invitation/themes/date-range.ts`:

```ts
import { formatFrenchDate, formatFrenchWeekday } from "./format";
import type { InvitationData } from "./types";

/**
 * Dates a theme prints for a wedding that may span several days.
 *
 * Every function takes an ISO day (`YYYY-MM-DD`, a time after it is ignored)
 * and the page's locale, and returns null for anything it cannot read — a
 * theme then omits the line, instead of printing "Invalid Date".
 */

type DateOptions = { locale?: string };

const DEFAULT_LOCALE = "fr-FR";

/** A bare day pinned to UTC midnight, so no timezone can shift it. */
function utcDay(value: string | null | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}/.test(value)) return null;
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isFrench(locale: string): boolean {
  return locale.toLowerCase().startsWith("fr");
}

/**
 * "19–20 juin 2027" for two days, "19 juin 2027" for one.
 *
 * Intl writes the range in the locale's own manner ("June 19 – 20, 2027",
 * "19.–20. Juni 2027"). French also needs its "1er", which Intl does not know.
 * A reversed range is put in order.
 */
export function formatDateRange(
  start: string | null | undefined,
  end: string | null | undefined,
  options: DateOptions = {},
): string | null {
  const from = utcDay(start);
  if (!from) return null;

  const locale = options.locale ?? DEFAULT_LOCALE;
  const to = utcDay(end);

  if (!to || to.getTime() === from.getTime()) {
    return formatFrenchDate(start!.slice(0, 10), { locale });
  }

  const [first, last] = from <= to ? [from, to] : [to, from];
  const text = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).formatRange(first, last);

  return isFrench(locale) ? text.replace(/(^|[–-]\s?)1(?!\d)/g, "$11er") : text;
}

/**
 * "30 · 04 · 2027" — the dotted label several designs print under the names.
 * Day, month and year come in the locale's order ("04 · 30 · 2027" in US
 * English, "2027 · 04 · 30" in Japanese).
 */
export function formatDottedDate(
  value: string | null | undefined,
  options: DateOptions = {},
): string | null {
  const date = utcDay(value);
  if (!date) return null;

  return new Intl.DateTimeFormat(options.locale ?? DEFAULT_LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  })
    .formatToParts(date)
    .filter((part) => part.type === "day" || part.type === "month" || part.type === "year")
    .map((part) => part.value)
    .join(" · ");
}

/**
 * The two date lines a hero prints, in the page's language.
 *
 * The mapper hands a theme `copy.dateLabel` ("19 · 06 · 2027") and
 * `copy.dateSpelled` ("samedi 19 juin 2027") already formatted — in French,
 * whatever the page's locale — and a couple can overwrite either in the editor.
 * Printing them as they come leaves a translated page with a French date;
 * always re-deriving would ignore a couple's own wording. So a value that is
 * exactly what the mapper would have derived is derived again in `locale`, and
 * anything else is the couple's and is kept.
 *
 * Both are computed from the calendar day written in `startsAt` rather than
 * from the instant: an instant formats differently on a server in UTC and in a
 * browser in Paris for a wedding that starts just after midnight, and the two
 * disagreeing is a hydration mismatch.
 */
export function heroDates(
  data: Pick<InvitationData, "event" | "copy">,
  locale: string,
): { dotted: string | null; spelled: string | null } {
  const day = data.event.startsAt.slice(0, 10);

  const derivedDotted = formatDottedDate(day, { locale: "fr-FR" });
  const derivedSpelled = formatFrenchWeekday(day, { locale: "fr-FR" });
  const writtenDotted = data.copy?.dateLabel?.trim();
  const writtenSpelled = data.copy?.dateSpelled?.trim();

  return {
    dotted:
      writtenDotted && writtenDotted !== derivedDotted
        ? writtenDotted
        : formatDottedDate(day, { locale }),
    spelled:
      writtenSpelled && writtenSpelled !== derivedSpelled
        ? writtenSpelled
        : formatFrenchWeekday(day, { locale }),
  };
}

/**
 * First and last day of the wedding: the start of the countdown and every
 * dated event, whichever they are. Null when none of them is readable.
 */
export function weddingSpan(
  data: Pick<InvitationData, "event" | "events">,
): { start: string; end: string } | null {
  const days = [data.event.startsAt, ...(data.events ?? []).map((event) => event.date)]
    .map((value) => (value && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : null))
    .filter((day): day is string => day !== null)
    .sort();

  if (days.length === 0) return null;
  return { start: days[0]!, end: days[days.length - 1]! };
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs --test landing/src/lib/theme-helpers.test.mjs`
Expected: PASS, 20 tests.

If the French cross-month assertion fails because a different Node ICU writes the dash differently, fix the **regex in the implementation** (`[–-]`), not the test: the requirement is "1er" after the range dash.

- [ ] **Step 6: Checkpoint**

Run: `npx tsc --noEmit -p landing/tsconfig.json && (cd landing && npx eslint src/components/invitation/themes/monogram.ts src/components/invitation/themes/date-range.ts)`
Expected: both exit 0. Do not commit.

---

### Task 2: RSVP payload and hook

**Files:**
- Create: `landing/src/components/invitation/themes/guest-rsvp-payload.ts`
- Create: `landing/src/components/invitation/themes/use-guest-rsvp.ts`
- Test: `landing/src/lib/theme-guest-forms.test.mjs`

**Interfaces:**
- Produces:
  - `MAX_CHILDREN = 4`
  - `buildRsvpSubmission(input: RsvpPayloadInput): RsvpSubmission` where `RsvpPayloadInput = { weddingId: string; form: Pick<FormData, "get">; attending: boolean; partyMode: "solo" | "partner"; childCount: number; allowChildren: boolean }`
  - `useGuestRsvp(data: InvitationData)` returning `{ sent, pending, error, partyMode, setPartyMode, childCount, setChildCount, attending, setAttending, allowChildren, allowPartner, showParty, maxChildren, handleSubmit }`
- Consumes: `RsvpSubmission`, `RsvpCompanion`, `submitRsvp` from `@/actions/invitation-submissions`.
- **Form field names are a contract** every theme must use: `fullName`, `partnerName`, `childName-<index>`, `dietary`, `message`. The attendance radios use `name="attendance"` and call `setAttending`.

- [ ] **Step 1: Write the failing tests**

Create `landing/src/lib/theme-guest-forms.test.mjs`:

```js
/**
 * What a guest's answer becomes on the wire, and how a playlist selection
 * behaves. Pure functions only: the hooks that wrap them are React.
 *
 *   node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs \
 *     --test landing/src/lib/theme-guest-forms.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_CHILDREN,
  buildRsvpSubmission,
} from "../components/invitation/themes/guest-rsvp-payload.ts";

function form(entries) {
  const data = new FormData();
  for (const [name, value] of Object.entries(entries)) data.set(name, value);
  return data;
}

const base = {
  weddingId: "wedding-1",
  attending: true,
  partyMode: "solo",
  childCount: 0,
  allowChildren: true,
};

/* -- buildRsvpSubmission ------------------------------------------------ */

test("a solo guest sends their split name, diet and message", () => {
  const submission = buildRsvpSubmission({
    ...base,
    form: form({ fullName: "  Camille  Durand-Martin ", dietary: "Végétarien", message: "Merci !" }),
  });
  assert.deepEqual(submission, {
    weddingId: "wedding-1",
    firstName: "Camille",
    lastName: "Durand-Martin",
    attendance: true,
    dietary: "Végétarien",
    message: "Merci !",
    companions: [],
  });
});

test("a single-word name has an empty last name, and a blank form is still shaped", () => {
  assert.equal(buildRsvpSubmission({ ...base, form: form({ fullName: "Madonna" }) }).lastName, "");
  const empty = buildRsvpSubmission({ ...base, form: form({}) });
  assert.equal(empty.firstName, "");
  assert.equal(empty.dietary, "");
  assert.deepEqual(empty.companions, []);
});

test("a partner is a companion only when the guest comes with one", () => {
  const fields = form({ fullName: "Camille Durand", partnerName: "Jonas Petit" });
  const withPartner = buildRsvpSubmission({ ...base, partyMode: "partner", form: fields });
  assert.deepEqual(withPartner.companions, [{ firstName: "Jonas", lastName: "Petit" }]);
  assert.deepEqual(buildRsvpSubmission({ ...base, partyMode: "solo", form: fields }).companions, []);
});

test("children are companions that inherit the guest's surname", () => {
  const submission = buildRsvpSubmission({
    ...base,
    childCount: 2,
    form: form({ fullName: "Camille Durand", "childName-0": "Léo", "childName-1": "Alba Petit" }),
  });
  assert.deepEqual(submission.companions, [
    { firstName: "Léo", lastName: "Durand", relationType: "child" },
    { firstName: "Alba", lastName: "Petit", relationType: "child" },
  ]);
});

test("an adults-only wedding never sends children, whatever the form holds", () => {
  const submission = buildRsvpSubmission({
    ...base,
    allowChildren: false,
    childCount: 2,
    form: form({ fullName: "Camille Durand", "childName-0": "Léo" }),
  });
  assert.deepEqual(submission.companions, []);
});

test("blank child names are skipped and the count is capped", () => {
  const entries = { fullName: "Camille Durand" };
  for (let index = 0; index < 8; index += 1) entries[`childName-${index}`] = `Enfant${index}`;
  entries["childName-1"] = "   ";
  const submission = buildRsvpSubmission({ ...base, childCount: 99, form: form(entries) });
  assert.equal(submission.companions.length, MAX_CHILDREN - 1);
  assert.deepEqual(submission.companions.map((c) => c.firstName), ["Enfant0", "Enfant2", "Enfant3"]);
});

test("someone who is not coming sends nobody else, even with stale party state", () => {
  const submission = buildRsvpSubmission({
    ...base,
    attending: false,
    partyMode: "partner",
    childCount: 2,
    form: form({ fullName: "Camille Durand", partnerName: "Jonas Petit", "childName-0": "Léo" }),
  });
  assert.equal(submission.attendance, false);
  assert.deepEqual(submission.companions, []);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs --test landing/src/lib/theme-guest-forms.test.mjs`
Expected: FAIL — `Cannot find module` for `guest-rsvp-payload.ts`.

- [ ] **Step 3: Implement the payload builder**

Create `landing/src/components/invitation/themes/guest-rsvp-payload.ts`:

```ts
import type { RsvpCompanion, RsvpSubmission } from "@/actions/invitation-submissions";

/**
 * What a guest's answer becomes when it is sent.
 *
 * Extracted from `ciao-amore/sections/RsvpSection.tsx`, which keeps its own
 * copy: the logic is the same, the markup is each theme's. Pure on purpose —
 * the hook that calls it is React, this is the part worth testing.
 *
 * ## Form field names are a contract
 *
 * `fullName`, `partnerName`, `childName-<index>`, `dietary`, `message`. A theme
 * that renames one silently sends an empty value.
 */

/** A guest cannot bring more than this many children. Well under the server's
 *  20-participant cap, which still bounds the payload whatever is sent. */
export const MAX_CHILDREN = 4;

export type RsvpPayloadInput = {
  weddingId: string;
  form: Pick<FormData, "get">;
  /** Whether the guest answered yes. Companions are sent only for a yes. */
  attending: boolean;
  partyMode: "solo" | "partner";
  childCount: number;
  /** `rsvp.allowChildren !== false` — false for an adults-only wedding. */
  allowChildren: boolean;
};

function field(form: Pick<FormData, "get">, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/** "Camille Durand-Martin" → ["Camille", "Durand-Martin"]. */
function splitName(full: string): [string, string] {
  const [first = "", ...rest] = full.trim().split(/\s+/);
  return [first, rest.join(" ")];
}

export function buildRsvpSubmission(input: RsvpPayloadInput): RsvpSubmission {
  const { weddingId, form, attending, partyMode, allowChildren } = input;
  const [firstName, lastName] = splitName(field(form, "fullName"));

  // Every companion — partner and children alike — goes into one list.
  // `guest_count` is derived server-side from its length, so a child left out
  // here is a head the caterer never counts.
  const companions: RsvpCompanion[] = [];

  const partnerName = field(form, "partnerName");
  if (attending && partyMode === "partner" && partnerName) {
    const [first, last] = splitName(partnerName);
    companions.push({ firstName: first, lastName: last });
  }

  // A child is a nominal participant like the partner — a first name and
  // nothing more. No age, no date of birth: the less personal data collected
  // about a minor, the better.
  if (attending && allowChildren) {
    const count = Math.max(0, Math.min(MAX_CHILDREN, Math.trunc(input.childCount) || 0));
    for (let index = 0; index < count; index += 1) {
      const childName = field(form, `childName-${index}`);
      if (!childName) continue;
      const [first, last] = splitName(childName);
      companions.push({
        firstName: first,
        // No surname typed: children usually share the guest's.
        lastName: last || lastName,
        // The exact value the dashboard's relation picker uses.
        relationType: "child",
      });
    }
  }

  return {
    weddingId,
    firstName,
    lastName,
    attendance: attending,
    dietary: field(form, "dietary"),
    message: field(form, "message"),
    companions,
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs --test landing/src/lib/theme-guest-forms.test.mjs`
Expected: PASS, 7 tests.

- [ ] **Step 5: Implement the hook**

Create `landing/src/components/invitation/themes/use-guest-rsvp.ts`:

```ts
"use client";

import { type FormEvent, useState } from "react";

import { submitRsvp } from "@/actions/invitation-submissions";

import { MAX_CHILDREN, buildRsvpSubmission } from "./guest-rsvp-payload";
import type { InvitationData } from "./types";

/**
 * State and submission of a theme's RSVP form.
 *
 * Two modes, decided by `data.weddingId` (see `types.ts`): with an id the
 * answer is persisted through `submitRsvp`; without one — the showcase, the
 * editor's preview — the form confirms locally and writes nothing. The server
 * action also rejects a missing id, so the demo path is closed on both sides.
 *
 * The theme draws the form. It must:
 *   - give the radios `name="attendance"` and call `setAttending(true | false)`
 *     from their `onChange`;
 *   - use the field names listed in `guest-rsvp-payload.ts`;
 *   - show party questions only when `showParty` is true, the partner choice
 *     only when `allowPartner`, the children only when `allowChildren`;
 *   - show `error` (role="alert") and disable the button while `pending`.
 */
export function useGuestRsvp(data: InvitationData) {
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partyMode, setPartyMode] = useState<"solo" | "partner">("solo");
  const [childCount, setChildCount] = useState(0);
  /** Null until the guest answers; nobody declares a party before saying yes. */
  const [attending, setAttending] = useState<boolean | null>(null);

  const weddingId = data.weddingId;
  // `settings.adults_only` arrives inverted as `allowChildren`; absent means
  // "not answered", and children are allowed unless explicitly ruled out.
  const allowChildren = data.rsvp?.allowChildren !== false;
  const allowPartner = data.rsvp?.allowPartner === true;
  const showParty = attending === true;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    // Demo: no wedding to attach the answer to. Confirm locally, persist
    // nothing — this is the guard the showcase relies on.
    if (!weddingId) {
      setSent(true);
      return;
    }

    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);

    const result = await submitRsvp(
      buildRsvpSubmission({
        weddingId,
        form,
        attending: attending ?? form.get("attendance") === "yes",
        partyMode,
        childCount,
        allowChildren,
      }),
    );

    setPending(false);
    if (result.ok) setSent(true);
    else setError(result.error);
  }

  return {
    sent,
    pending,
    error,
    partyMode,
    setPartyMode,
    childCount,
    setChildCount,
    attending,
    setAttending,
    allowChildren,
    allowPartner,
    showParty,
    maxChildren: MAX_CHILDREN,
    handleSubmit,
  };
}
```

- [ ] **Step 6: Checkpoint**

Run: `npx tsc --noEmit -p landing/tsconfig.json && (cd landing && npx eslint src/components/invitation/themes/guest-rsvp-payload.ts src/components/invitation/themes/use-guest-rsvp.ts) && npm test 2>&1 | tail -8`
Expected: tsc and eslint exit 0; `npm test` passes (the two new files add 22 tests). Do not commit.

---

### Task 3: Playlist selection and hook

**Files:**
- Create: `landing/src/components/invitation/themes/guest-playlist.ts`
- Create: `landing/src/components/invitation/themes/use-guest-playlist.ts`
- Test: `landing/src/lib/theme-guest-forms.test.mjs` (append)

**Interfaces:**
- Produces:
  - `type SpotifyResult = { id: string; title: string; artist: string; coverUrl: string; uri: string; spotifyUrl: string | null }`
  - `MAX_TRACKS = 3`, `MIN_QUERY = 2`, `DEBOUNCE_MS = 350`
  - `addTrack(selected: readonly SpotifyResult[], track: SpotifyResult): readonly SpotifyResult[]` (returns the same array when nothing changes)
  - `removeTrack(selected: readonly SpotifyResult[], id: string): readonly SpotifyResult[]`
  - `toPlaylistSubmission(weddingId: string, selected: readonly SpotifyResult[]): PlaylistSubmission`
  - `isSearchable(query: string, state: { sent: boolean; full: boolean }): boolean`
  - `useGuestPlaylist(data: InvitationData)` returning `{ query, setQuery, results, searchState, active, setActive, selected, sent, pending, error, full, isSearching, showPanel, inputRef, listId, choose, remove, send, handleKeyDown, clearSearch }`
- Consumes: `PlaylistSubmission`, `submitPlaylistSuggestions` from `@/actions/invitation-submissions`; the read-only route `/api/spotify/search?q=`.

- [ ] **Step 1: Append the failing tests**

Add to the imports at the top of `landing/src/lib/theme-guest-forms.test.mjs`:

```js
import {
  MAX_TRACKS,
  addTrack,
  isSearchable,
  removeTrack,
  toPlaylistSubmission,
} from "../components/invitation/themes/guest-playlist.ts";
```

Append at the end of the file:

```js
/* -- playlist selection ------------------------------------------------- */

const track = (id, extra = {}) => ({
  id,
  title: `Titre ${id}`,
  artist: `Artiste ${id}`,
  coverUrl: `https://img.test/${id}.jpg`,
  uri: `spotify:track:${id}`,
  spotifyUrl: `https://open.spotify.com/track/${id}`,
  ...extra,
});

test("a track is added once, up to the limit", () => {
  let selected = [];
  selected = addTrack(selected, track("a"));
  selected = addTrack(selected, track("b"));
  assert.deepEqual(selected.map((t) => t.id), ["a", "b"]);

  const unchanged = addTrack(selected, track("a"));
  assert.equal(unchanged, selected, "a duplicate returns the same array");

  selected = addTrack(selected, track("c"));
  assert.equal(selected.length, MAX_TRACKS);
  const full = addTrack(selected, track("d"));
  assert.equal(full, selected, "a fourth track is ignored");
});

test("a track can be taken back", () => {
  const selected = [track("a"), track("b")];
  assert.deepEqual(removeTrack(selected, "a").map((t) => t.id), ["b"]);
  assert.deepEqual(removeTrack(selected, "zzz").map((t) => t.id), ["a", "b"]);
});

test("the submission carries the ids the dashboard keys on, and no empty link", () => {
  const submission = toPlaylistSubmission("wedding-1", [
    track("a"),
    track("b", { spotifyUrl: null }),
  ]);
  assert.equal(submission.weddingId, "wedding-1");
  assert.deepEqual(submission.tracks[0], {
    id: "a",
    title: "Titre a",
    artist: "Artiste a",
    coverUrl: "https://img.test/a.jpg",
    spotifyUrl: "https://open.spotify.com/track/a",
  });
  assert.equal("spotifyUrl" in submission.tracks[1], false);
});

test("searching waits for two characters and stops once sent or full", () => {
  assert.equal(isSearchable("a", { sent: false, full: false }), false);
  assert.equal(isSearchable("  a ", { sent: false, full: false }), false);
  assert.equal(isSearchable("ab", { sent: false, full: false }), true);
  assert.equal(isSearchable("ab", { sent: true, full: false }), false);
  assert.equal(isSearchable("ab", { sent: false, full: true }), false);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs --test landing/src/lib/theme-guest-forms.test.mjs`
Expected: FAIL — `Cannot find module` for `guest-playlist.ts`.

- [ ] **Step 3: Implement the pure part**

Create `landing/src/components/invitation/themes/guest-playlist.ts`:

```ts
import type { PlaylistSubmission } from "@/actions/invitation-submissions";

/**
 * A guest's playlist suggestion: which tracks they have picked, and what is
 * sent. Extracted from `ciao-amore/sections/PlaylistSection.tsx`, which keeps
 * its own copy; pure so the rules can be tested without a browser.
 */

/** Matches the payload `/api/spotify/search` returns. */
export type SpotifyResult = {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  uri: string;
  spotifyUrl: string | null;
};

/** A guest may propose up to three titles in one submission. */
export const MAX_TRACKS = 3;
/** Spotify's own minimum; below it the route answers an empty list anyway. */
export const MIN_QUERY = 2;
/** Long enough to feel instant, long enough not to fire on every keystroke. */
export const DEBOUNCE_MS = 350;

/**
 * Adds a pick. Returns the same array when nothing changes — a duplicate, or a
 * full selection — so a caller can skip a state update.
 *
 * Spotify can return the same track twice across queries; the dashboard keys
 * statuses by track id, so a duplicate would collide there.
 */
export function addTrack(
  selected: readonly SpotifyResult[],
  track: SpotifyResult,
): readonly SpotifyResult[] {
  if (selected.length >= MAX_TRACKS) return selected;
  if (selected.some((existing) => existing.id === track.id)) return selected;
  return [...selected, track];
}

export function removeTrack(
  selected: readonly SpotifyResult[],
  id: string,
): readonly SpotifyResult[] {
  return selected.filter((track) => track.id !== id);
}

export function toPlaylistSubmission(
  weddingId: string,
  selected: readonly SpotifyResult[],
): PlaylistSubmission {
  return {
    weddingId,
    // The action already accepts an array and bounds it at 20 server-side.
    tracks: selected.map((track) => ({
      id: track.id,
      title: track.title,
      artist: track.artist,
      coverUrl: track.coverUrl,
      ...(track.spotifyUrl ? { spotifyUrl: track.spotifyUrl } : {}),
    })),
  };
}

/** No searching once the selection is full or the form was sent: there is
 *  nothing left to pick, so the request would be wasted. */
export function isSearchable(
  query: string,
  state: { sent: boolean; full: boolean },
): boolean {
  return query.trim().length >= MIN_QUERY && !state.sent && !state.full;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs --test landing/src/lib/theme-guest-forms.test.mjs`
Expected: PASS, 11 tests.

- [ ] **Step 5: Implement the hook**

Create `landing/src/components/invitation/themes/use-guest-playlist.ts`:

```ts
"use client";

import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";

import { submitPlaylistSuggestions } from "@/actions/invitation-submissions";

import {
  DEBOUNCE_MS,
  MAX_TRACKS,
  type SpotifyResult,
  addTrack,
  isSearchable,
  removeTrack,
  toPlaylistSubmission,
} from "./guest-playlist";
import type { InvitationData } from "./types";

export type SearchState = "idle" | "loading" | "done" | "error";

/**
 * Search, selection and submission of a theme's participative playlist.
 *
 * Two modes, decided by `data.weddingId`: with an id the picks are persisted
 * (`playlist_suggestions`); without one — the showcase, the editor's preview —
 * `send()` confirms locally and writes nothing. Searching is read-only
 * (`/api/spotify/search`), so it runs in both modes on purpose: a visitor has
 * to be able to try the field for the demo to sell anything.
 *
 * The theme draws the combobox. This hook owns the data and the keyboard; it
 * does NOT position a floating panel (ciao-amore portals one out of an
 * `overflow:hidden` section) — a theme that needs that measures its own field.
 *
 * Wire `inputRef` and `listId` to the input (`aria-controls`), call
 * `handleKeyDown` from its `onKeyDown`, render `results` when `showPanel`,
 * call `choose(result)` on a pick and `send()` from the submit button.
 */
export function useGuestPlaylist(data: InvitationData) {
  const weddingId = data.weddingId;
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SpotifyResult[]>([]);
  const [searchState, setSearchState] = useState<SearchState>("idle");
  /** Index of the arrow-key highlighted option; -1 when none. */
  const [active, setActive] = useState(-1);
  const [selected, setSelected] = useState<readonly SpotifyResult[]>([]);

  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = query.trim();
  const full = selected.length >= MAX_TRACKS;
  const isSearching = isSearchable(query, { sent, full });
  const showPanel = isSearching && searchState !== "idle";

  useEffect(() => {
    if (!isSearching) {
      setResults([]);
      setSearchState("idle");
      return;
    }

    // Cancels the request still in flight when the query moves on, so a slow
    // early response cannot land after a newer one and overwrite it.
    const controller = new AbortController();

    // Debounce: only the last keystroke in a DEBOUNCE_MS window queries.
    const timer = setTimeout(async () => {
      setSearchState("loading");
      try {
        const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(String(response.status));
        const json = (await response.json()) as { results?: SpotifyResult[] };
        setResults(json.results ?? []);
        setSearchState("done");
      } catch (caught) {
        // An aborted request is the expected outcome of typing another letter,
        // not a failure: leave the state alone so no error flashes mid-typing.
        if ((caught as Error).name === "AbortError") return;
        setResults([]);
        setSearchState("error");
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, isSearching]);

  function clearSearch() {
    setQuery("");
    setResults([]);
    setSearchState("idle");
    setActive(-1);
    inputRef.current?.focus();
  }

  /** Adds a pick. Choosing does not submit: sending is a separate step. */
  function choose(track: SpotifyResult) {
    if (pending) return;
    setResults([]);
    setActive(-1);
    setQuery("");

    const next = addTrack(selected, track);
    if (next === selected) return;
    setError(null);
    setSelected(next);
    inputRef.current?.focus();
  }

  function remove(id: string) {
    setSelected((list) => removeTrack(list, id));
    setError(null);
  }

  /** Sends the 1–3 selected tracks in one submission. */
  async function send() {
    if (pending || selected.length === 0) return;
    setError(null);

    // Demo: no wedding to attach the suggestions to. Confirm locally, persist
    // nothing. This early return is what keeps the showcase out of the
    // database — NOTHING below this line may run without a weddingId.
    if (!weddingId) {
      setSent(true);
      return;
    }

    setPending(true);
    const result = await submitPlaylistSuggestions(toPlaylistSubmission(weddingId, selected));
    setPending(false);

    if (result.ok) setSent(true);
    else setError(result.error);
  }

  /**
   * Keyboard support for the combobox: the arrows move a virtual cursor over
   * the options and Enter takes the active one. Escape closes the list, then
   * clears the field. Without this the listbox would be mouse-only, which
   * `role="combobox"` on the input promises it is not.
   */
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (results.length === 0 && event.key !== "Escape") return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index <= 0 ? results.length - 1 : index - 1));
    } else if (event.key === "Enter") {
      // Only intercept Enter when a row is highlighted, so the key keeps its
      // default meaning the rest of the time.
      if (active >= 0 && active < results.length) {
        event.preventDefault();
        choose(results[active]!);
      }
    } else if (event.key === "Escape") {
      if (results.length > 0) {
        setResults([]);
        setActive(-1);
      } else {
        clearSearch();
      }
    }
  }

  return {
    query,
    setQuery,
    results,
    searchState,
    active,
    setActive,
    selected,
    sent,
    pending,
    error,
    full,
    isSearching,
    showPanel,
    inputRef,
    listId,
    choose,
    remove,
    send,
    handleKeyDown,
    clearSearch,
  };
}
```

- [ ] **Step 6: Checkpoint**

Run: `npx tsc --noEmit -p landing/tsconfig.json && (cd landing && npx eslint src/components/invitation/themes/guest-playlist.ts src/components/invitation/themes/use-guest-playlist.ts)`
Expected: exit 0 for both (eslint may print warnings for `react-hooks/set-state-in-effect`, which this codebase already downgrades; an **error** is a failure). Do not commit.

---

### Task 4: Reveal, JsFlag and ScrollToButton

**Files:**
- Create: `landing/src/components/invitation/themes/reveal.tsx`
- Create: `landing/src/components/invitation/themes/scroll-to.tsx`

**Interfaces:**
- Produces:
  - `<Reveal as? id? className? revealedClass threshold? data-*>` — renders `as` (default `div`) and adds `revealedClass` once, when the element is seen, at load under reduced motion, or when `IntersectionObserver` is missing.
  - `<JsFlag />` — sets `data-js` on the nearest `[data-theme-root]`.
  - `<ScrollToButton target className? ariaLabel?>children</ScrollToButton>` — `target` is a CSS selector looked up inside the nearest `[data-theme-root]`, or the string `"top"`.
- **Convention:** every new theme's root element carries `data-theme-root=""`. A theme's `responsive.css` must show everything when the root has no `data-js` (no JavaScript) and under `prefers-reduced-motion`.

There is no unit test: JSX cannot be loaded by `node --test`. They are exercised in the browser by every theme plan.

- [ ] **Step 1: Implement `reveal.tsx`**

Create `landing/src/components/invitation/themes/reveal.tsx`:

```tsx
"use client";

import { type ElementType, type ReactNode, createElement, useEffect, useRef, useState } from "react";

/**
 * Reveal-on-scroll, scoped to one element.
 *
 * The designers' sheets hide each section (`opacity: 0.01`) until a script adds
 * a class, and their scripts do it with a global `document.querySelectorAll`.
 * In this app that captures other components' elements and fights the editor's
 * live preview, so a section observes itself instead.
 *
 * - The class is added once, then the observer is dropped.
 * - Under `prefers-reduced-motion`, or with no `IntersectionObserver`, it is
 *   added at once: nothing stays hidden for a reader who asked for no motion.
 * - The class lives in React state, so a later change of `className` does not
 *   wipe it.
 *
 * Without JavaScript a section would stay at `opacity: 0.01`; the theme's own
 * CSS undoes that for a root with no `data-js` (see `JsFlag`).
 */
type DataAttributes = { [key: `data-${string}`]: string | undefined };

type RevealProps = DataAttributes & {
  as?: ElementType;
  id?: string;
  className?: string;
  /** Added once the element has been seen: `in-view`, `visible`… */
  revealedClass: string;
  /** Share of the element that must be on screen. */
  threshold?: number;
  children?: ReactNode;
};

export function Reveal({
  as = "div",
  className,
  revealedClass,
  threshold = 0.15,
  children,
  ...rest
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || seen) return;

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      setSeen(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [seen, threshold]);

  const classes = [className, seen ? revealedClass : null].filter(Boolean).join(" ");
  return createElement(as, { ref, className: classes || undefined, ...rest }, children);
}

/**
 * Marks the theme root as "scripts are running" (`data-js`).
 *
 * The theme's CSS hides revealable sections only under `[data-js]`, so a
 * visitor with JavaScript off still reads the whole invitation. Render it once,
 * anywhere inside the root; the root carries `data-theme-root=""`.
 */
export function JsFlag() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = ref.current?.closest("[data-theme-root]");
    root?.setAttribute("data-js", "");
    return () => root?.removeAttribute("data-js");
  }, []);

  return <span ref={ref} hidden aria-hidden="true" />;
}
```

- [ ] **Step 2: Implement `scroll-to.tsx`**

Create `landing/src/components/invitation/themes/scroll-to.tsx`:

```tsx
"use client";

import { type ReactNode, useRef } from "react";

/**
 * A button that scrolls to a section of the theme.
 *
 * Not an `<a href="#…">`: a hash link scrolls again on every refresh (the
 * repo's convention is `scrollIntoView` from a client component). `target` is a
 * CSS selector looked up inside the theme's own root — several themes and the
 * landing around them can be on the page at once in the editor's preview, and
 * element ids are document-global — or `"top"` for the top of the page.
 * Reduced motion gets an instant jump.
 */
export function ScrollToButton({
  target,
  className,
  ariaLabel,
  children,
}: {
  target: string;
  className?: string;
  ariaLabel?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  function go() {
    const behavior: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";

    if (target === "top") {
      window.scrollTo({ top: 0, behavior });
      return;
    }

    const scope: ParentNode = ref.current?.closest("[data-theme-root]") ?? document;
    scope.querySelector(target)?.scrollIntoView({ behavior, block: "start" });
  }

  return (
    <button ref={ref} type="button" className={className} aria-label={ariaLabel} onClick={go}>
      {children}
    </button>
  );
}
```

- [ ] **Step 3: Checkpoint**

Run: `npx tsc --noEmit -p landing/tsconfig.json && (cd landing && npx eslint src/components/invitation/themes/reveal.tsx src/components/invitation/themes/scroll-to.tsx)`
Expected: exit 0. A `react-hooks/set-state-in-effect` **warning** on `setSeen(true)` is acceptable (the repo downgrades that rule); an error is not. Do not commit.

---

### Task 5: The `dayOf` contract field

**Files:**
- Modify: `landing/src/components/invitation/themes/types.ts` (end of `InvitationData`, after `texts`)
- Modify: `landing/src/lib/assemble-invitation-page.ts` (`InvitationPageData` type; new `readDayOf` export)
- Modify: `landing/src/actions/invitation-page-actions.ts` (`getInvitationPage`)
- Modify: `landing/src/lib/to-invitation-data.ts` (returned object, after `weddingId`)
- Test: `landing/src/lib/invitation-data.test.mjs` (append; extend the import line)

**Interfaces:**
- Produces:
  - `InvitationData.dayOf?: { slug: string; photos: boolean }`
  - `InvitationPageData.dayOf?: { photos: boolean }`
  - `readDayOf(rows: unknown, now?: number): { photos: boolean } | undefined`
- Consumes: the existing RPC `public_day_of_settings(p_wedding_id)`, which returns a row **only** when the Jour J is enabled (used by `resolveGuestPage` in `landing/src/actions/guest-page-actions.ts`), with columns `gallery_visible_to_guests`, `uploads_open_until`.

- [ ] **Step 1: Write the failing tests**

In `landing/src/lib/invitation-data.test.mjs`, change the import line

```js
import { assembleInvitationPage } from "./assemble-invitation-page.ts";
```

to

```js
import { assembleInvitationPage, readDayOf } from "./assemble-invitation-page.ts";
```

and append at the end of the file:

```js
test("the Jour J reaches the theme only when the couple switched it on", () => {
  assert.equal(render(baseRows()).dayOf, undefined);

  const page = assembleInvitationPage("wedding-1", "camille-et-jonas", baseRows());
  const data = toInvitationData({ ...page, dayOf: { photos: true } });
  assert.deepEqual(data.dayOf, { slug: "camille-et-jonas", photos: true });
});

test("readDayOf: no row means off, and photos follow the window and the gallery", () => {
  const now = Date.parse("2027-06-19T12:00:00Z");

  assert.equal(readDayOf(null, now), undefined);
  assert.equal(readDayOf([], now), undefined);
  assert.equal(readDayOf("nonsense", now), undefined);

  const row = (uploads_open_until, gallery_visible_to_guests) => [
    { uploads_open_until, gallery_visible_to_guests },
  ];
  assert.deepEqual(readDayOf(row(null, false), now), { photos: false });
  assert.deepEqual(readDayOf(row("2027-06-20T00:00:00Z", false), now), { photos: true });
  assert.deepEqual(readDayOf(row("2027-06-18T00:00:00Z", false), now), { photos: false });
  assert.deepEqual(readDayOf(row("2027-06-18T00:00:00Z", true), now), { photos: true });
  assert.deepEqual(readDayOf(row("not a date", false), now), { photos: false });
  // A single object instead of a one-row array is what a scalar RPC returns.
  assert.deepEqual(readDayOf({ uploads_open_until: null, gallery_visible_to_guests: true }, now), {
    photos: true,
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs --test landing/src/lib/invitation-data.test.mjs`
Expected: FAIL — `readDayOf` is not exported.

- [ ] **Step 3: Extend the contract**

In `landing/src/components/invitation/themes/types.ts`, find

```ts
  texts?: Readonly<Record<string, string>>;
};
```

and replace it with

```ts
  texts?: Readonly<Record<string, string>>;

  /**
   * The Jour J guest page, present only when the couple switched it on.
   *
   * The Jour J (seating finder, shared photos) is included with every wedding
   * and is deliberately not a module, so it has no entry in `modules`. A theme
   * that wants to point guests at it reads this: `slug` builds the paths
   * (`/jourj/<slug>/ma-table`, `/jourj/<slug>/photos`), and `photos` is true
   * while the upload window is open or the gallery is visible to guests.
   *
   * Absent in the editor's preview. A demo may set it to show the block, but a
   * theme given a `dayOf` and no `weddingId` is showing its showcase and must
   * render the buttons inert, never as links to a page that would 404.
   */
  dayOf?: { slug: string; photos: boolean };
};
```

- [ ] **Step 4: Add the field and `readDayOf` to the page assembler**

In `landing/src/lib/assemble-invitation-page.ts`, in the `InvitationPageData` type, replace

```ts
  accommodations: InvitationAccommodation[];
  faq: InvitationFaqEntry[];
};
```

with

```ts
  accommodations: InvitationAccommodation[];
  faq: InvitationFaqEntry[];
  /**
   * The Jour J, when the couple switched it on. Set by the public loader from
   * `public_day_of_settings`; the editor's preview never has it, so a draft
   * shows no Jour J blocks.
   */
  dayOf?: { photos: boolean };
};

/**
 * `public_day_of_settings` answers one row when the Jour J is enabled and
 * nothing when it is off, so "no row" means "not available".
 *
 * `photos` is true while guests can still upload (the window is open) or look
 * (the gallery is visible); otherwise the photos page would be an empty room.
 * `now` is a parameter so the rule can be tested.
 */
export function readDayOf(
  rows: unknown,
  now: number = Date.now(),
): { photos: boolean } | undefined {
  const row = Array.isArray(rows) ? rows[0] : rows;
  if (!row || typeof row !== "object") return undefined;

  const settings = row as { uploads_open_until?: unknown; gallery_visible_to_guests?: unknown };
  const until =
    typeof settings.uploads_open_until === "string" ? Date.parse(settings.uploads_open_until) : NaN;

  return { photos: until > now || settings.gallery_visible_to_guests === true };
}
```

- [ ] **Step 5: Read it in the public loader**

In `landing/src/actions/invitation-page-actions.ts`, add `readDayOf` to the existing import from `@/lib/assemble-invitation-page` (keep the other names that import already has).

In `getInvitationPage`, extend the destructuring and the `Promise.all`:

```ts
  const [namesRes, eventsRes, scheduleRes, venueRes, staysRes, faqRes, modulesRes, dayOfRes] =
    await Promise.all([
```

and add, as the **last** element of the array (after the `public_module_configs` call):

```ts
      // The Jour J: a row only when the couple enabled it (the same RPC the
      // guest pages resolve through). Through an RPC because `day_of_settings`
      // has no anon select policy any more.
      supabase.rpc("public_day_of_settings", { p_wedding_id: weddingId }),
```

Replace the final line `return assembleInvitationPage(weddingId, slug, rows);` with

```ts
  const page = assembleInvitationPage(weddingId, slug, rows);
  if (!page) return null;

  const dayOf = readDayOf(dayOfRes.data);
  return dayOf ? { ...page, dayOf } : page;
```

- [ ] **Step 6: Map it for the themes**

In `landing/src/lib/to-invitation-data.ts`, in the object returned by `toInvitationData`, right after

```ts
    weddingId: page.weddingId,
```

add

```ts

    // Only when the couple switched the Jour J on. The slug is the page's own,
    // so a theme can build `/jourj/<slug>/…` without being told it separately.
    dayOf: page.dayOf ? { slug: page.slug, photos: page.dayOf.photos } : undefined,
```

- [ ] **Step 7: Run the tests and the type check**

Run: `node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs --test landing/src/lib/invitation-data.test.mjs && npx tsc --noEmit -p landing/tsconfig.json`
Expected: PASS (the file's previous tests plus 2 new) and tsc exit 0.

- [ ] **Step 8: Checkpoint**

Run: `(cd landing && npx eslint src/lib/assemble-invitation-page.ts src/lib/to-invitation-data.ts src/actions/invitation-page-actions.ts src/components/invitation/themes/types.ts) && npm test 2>&1 | tail -8`
Expected: eslint exit 0; `npm test` all passing. Do not commit.

---

### Task 6: Control datasets, demo route and `themes:shoot`

**Files:**
- Create: `landing/src/components/invitation/themes/fixtures/other-wedding.ts`
- Create: `landing/src/components/invitation/themes/fixtures/index.ts`
- Modify: `landing/src/app/[locale]/invitation/demo/[themeId]/page.tsx`
- Modify: `landing/scripts/shoot-theme.mjs`
- Test: `landing/src/lib/theme-fixtures.test.mjs`

**Interfaces:**
- Produces:
  - `MINIMAL_WEDDING`, `HEAVY_WEDDING`: `InvitationData`
  - `demoDataFor(base: InvitationData, fixture: string | undefined): InvitationData` — `"minimal"` / `"heavy"` outside production, otherwise `base`
  - `themes:shoot -- <themeId> [width] [outDir] [fixture]`, with `SHOOT_LOCALE=de|ar|…` (default `fr`)
- Consumes: `demoStartsAt`, `demoDate`, `demoDayAfter` from `../demo-date`.

- [ ] **Step 1: Write the failing test**

Create `landing/src/lib/theme-fixtures.test.mjs`:

```js
/**
 * The control datasets must be valid enough to render and different enough from
 * every demo to expose a theme that kept the demo couple's content.
 *
 *   node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs \
 *     --test landing/src/lib/theme-fixtures.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";

import { demoDataFor } from "../components/invitation/themes/fixtures/index.ts";
import {
  HEAVY_WEDDING,
  MINIMAL_WEDDING,
} from "../components/invitation/themes/fixtures/other-wedding.ts";

const DEMO = { couple: { partner1: "A", partner2: "B" }, event: { startsAt: "2030-01-01T10:00:00Z" }, venue: { name: "V" } };

test("both datasets are demos: they never carry a wedding id", () => {
  assert.equal(MINIMAL_WEDDING.weddingId, undefined);
  assert.equal(HEAVY_WEDDING.weddingId, undefined);
});

test("the minimal dataset leaves every optional field empty", () => {
  const keys = Object.keys(MINIMAL_WEDDING).sort();
  assert.deepEqual(keys, ["couple", "event", "venue"]);
  assert.deepEqual(Object.keys(MINIMAL_WEDDING.couple).sort(), ["partner1", "partner2"]);
});

test("the heavy dataset exercises counts, long strings and every optional field", () => {
  assert.ok(HEAVY_WEDDING.schedule.length >= 8);
  assert.ok(HEAVY_WEDDING.stays.length >= 10);
  assert.ok(HEAVY_WEDDING.faq.length >= 12);
  assert.equal(HEAVY_WEDDING.events.length, 3);
  assert.ok(HEAVY_WEDDING.dressCode.colors.length >= 8);
  assert.ok(HEAVY_WEDDING.venue.access.length >= 5);
  assert.equal(HEAVY_WEDDING.rsvp.allowChildren, false);
  assert.ok(HEAVY_WEDDING.couple.partner1.length > 12, "a long first name");
  assert.ok(HEAVY_WEDDING.dayOf, "the Jour J blocks are exercised");
});

test("neither dataset shares a name with the three demo couples", () => {
  const forbidden = ["Sienna", "Malo", "Éléonore", "Raphaël", "Paula", "Ricardo", "Camille", "Jonas"];
  const text = JSON.stringify([MINIMAL_WEDDING, HEAVY_WEDDING]);
  for (const word of forbidden) assert.equal(text.includes(word), false, word);
});

test("demoDataFor picks a dataset by name and otherwise keeps the demo", () => {
  assert.equal(demoDataFor(DEMO, "minimal"), MINIMAL_WEDDING);
  assert.equal(demoDataFor(DEMO, "heavy"), HEAVY_WEDDING);
  assert.equal(demoDataFor(DEMO, undefined), DEMO);
  assert.equal(demoDataFor(DEMO, "nope"), DEMO);
});

test("in production the query string changes nothing", () => {
  const before = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    assert.equal(demoDataFor(DEMO, "heavy"), DEMO);
  } finally {
    process.env.NODE_ENV = before;
  }
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs --test landing/src/lib/theme-fixtures.test.mjs`
Expected: FAIL — `Cannot find module` for the fixtures.

- [ ] **Step 3: Write the datasets**

Create `landing/src/components/invitation/themes/fixtures/other-wedding.ts`:

```ts
import { demoDate, demoDayAfter, demoStartsAt } from "../demo-date";
import type { InvitationData } from "../types";

/**
 * Two control datasets for checking that a theme is variable.
 *
 * A theme is easy to build around its own demo and quietly keep the demo
 * couple's words, counts and photographs. These two weddings share nothing with
 * the demos — not a name, not a place, not a tone — and are rendered by the demo
 * route (`?fixture=minimal|heavy`, never in production) and by `themes:shoot`.
 *
 * - `MINIMAL_WEDDING` is the least a couple can have: names, a date, a venue
 *   name. Every optional field is empty, so every section must degrade.
 * - `HEAVY_WEDDING` is the most: many entries, long strings, three events, an
 *   adults-only RSVP, every optional field filled.
 *
 * Both are demos: no `weddingId`, so no form writes anything.
 */

const STARTS_AT = demoStartsAt(5, "15:30", "+02:00");

/** An inline picture, so the datasets need no files on disk. */
function picture(label: string, hue: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500"><rect width="1200" height="1500" fill="hsl(${hue} 28% 70%)"/><circle cx="600" cy="620" r="260" fill="hsl(${hue} 30% 82%)"/><text x="600" y="1330" font-family="Georgia,serif" font-size="64" text-anchor="middle" fill="hsl(${hue} 30% 22%)">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const MINIMAL_WEDDING: InvitationData = {
  couple: { partner1: "Léa", partner2: "Hugo" },
  event: { startsAt: STARTS_AT },
  venue: { name: "Salle des Fêtes" },
};

export const HEAVY_WEDDING: InvitationData = {
  couple: {
    partner1: "Marie-Charlotte",
    partner2: "Jean-Baptiste",
    monogram: "MC · JB",
    portrait: picture("Portrait", 20),
  },
  event: { startsAt: STARTS_AT, rsvpDeadline: demoDate(3), timezone: "Europe/Paris" },
  venue: {
    name: "Le Prieuré de Saint-Étienne-de-la-Montagne-Noire",
    city: "Annecy-le-Vieux",
    country: "France",
    address: "1280 chemin des Vignes de la Combe Noire, 74940 Annecy-le-Vieux",
    mapsUrl: "https://maps.example.com/?q=prieure",
    wazeUrl: "https://waze.example.com/?q=prieure",
    image: picture("Le lieu", 150),
    access: [
      { mode: "En train", details: ["Gare d'Annecy", "Navette gratuite toutes les 20 minutes de 14 h à 17 h"] },
      { mode: "En voiture", details: ["Parking gratuit sur place", "Prévoir 15 minutes depuis le centre", "Dernier tronçon en chemin de terre : évitez les talons fins"] },
      { mode: "En avion", details: ["Genève Cointrin", "Une heure de route, location de voiture recommandée"] },
      { mode: "Covoiturage", details: ["Un tableau commun pour partager vos trajets"], link: { url: "https://covoit.example.com/mcjb", label: "Ouvrir le tableau de covoiturage" } },
      { mode: "Taxi", details: ["Réservez le retour avant 22 h, la zone est peu desservie"] },
      { mode: "Vélo", details: ["Piste cyclable depuis le lac, 25 minutes"] },
    ],
  },
  copy: {
    heroKicker: "Ils se disent oui au bord du lac, entourés de ceux qu'ils aiment le plus au monde",
    announcement:
      "Après onze ans, trois déménagements et un chat nommé Raymond, nous avons décidé de faire de cette histoire un vrai mariage avec vous tous.",
    dateLabel: "12 · 09 · 2027",
    dateSpelled: "Samedi douze septembre",
    venueIntro:
      "Un ancien prieuré restauré, ses jardins en terrasses, son verger et, en bas, le lac qui change de couleur toute la journée.",
    scheduleIntro: "Une journée qui commence doucement et se termine tard, avec des pauses pour respirer.",
    rsvpIntro: "Merci de nous dire si vous serez là, et si vous avez le moindre souci d'organisation.",
    rsvpNote: "Réponse attendue avant le 12 juin.",
    playlistIntro: "Dites-nous quelle chanson vous fera quitter votre chaise.",
    staysIntro: "Nous avons négocié des tarifs dans plusieurs adresses autour du lac.",
    closing: "Merci d'être là, vraiment.",
    footerNote: "Avec toute notre affection",
  },
  schedule: [
    { day: 1, time: "14 h 30", title: "Accueil des invités", description: "Café, thé glacé et petits sablés dans le verger.", icon: "cocktail", event: "wedding-day" },
    { day: 1, time: "15 h 30", title: "Cérémonie laïque", description: "Sous le grand tilleul, avec quatre lectures et un peu de musique.", icon: "ceremony", event: "wedding-day", image: picture("Cérémonie", 330) },
    { day: 1, time: "16 h 30", title: "Photos de groupe", description: "Dix minutes, promis. Ensuite, c'est apéro.", event: "wedding-day" },
    { day: 1, time: "17 h 00", title: "Cocktail sur la terrasse", description: "Spritz, jus de pomme du verger, tapas de saison.", icon: "cocktail", event: "wedding-day" },
    { day: 1, time: "19 h 30", title: "Dîner sous la grange", description: "Un menu en quatre services imaginé avec le traiteur du village.", icon: "dinner", event: "wedding-day" },
    { day: 1, time: "21 h 30", title: "Discours et première danse", icon: "party", event: "wedding-day" },
    { day: 1, time: "22 h 00", title: "Soirée dansante", description: "Le DJ s'installe, la piste s'ouvre.", icon: "party", event: "wedding-day" },
    { day: 1, time: "01 h 30", title: "Dernier verre", description: "Navettes pour les hôtels toutes les trente minutes.", event: "wedding-day" },
    { day: 1, time: "19 h 00", title: "Dîner de bienvenue", description: "Pizzas au feu de bois sur la place du village.", icon: "dinner", event: "welcome-dinner" },
    { day: 2, time: "11 h 00", title: "Brunch au jardin", description: "Oeufs, viennoiseries, café à volonté.", icon: "brunch", event: "brunch" },
    { day: 2, time: "14 h 00", title: "Balade au bord du lac", event: "brunch" },
    { day: 2, time: "16 h 00", title: "Au revoir", description: "Et merci pour tout.", event: "brunch" },
  ],
  events: [
    { kind: "welcome-dinner", name: "Dîner de bienvenue", date: demoDate(5).slice(0, 10), time: "19 h 00", address: "Place de la Mairie, 74940 Annecy-le-Vieux", description: "La veille, pour se retrouver avant le grand jour.", dressCode: "Décontracté", day: 1 },
    { kind: "wedding-day", name: "Le mariage", date: demoDate(5).slice(0, 10), time: "15 h 30", address: "Le Prieuré, chemin des Vignes de la Combe Noire", description: "La cérémonie, le dîner, la fête.", dressCode: "Cocktail estival", day: 1 },
    { kind: "brunch", name: "Brunch du lendemain", date: demoDayAfter(5).slice(0, 10), time: "11 h 00", address: "Le Prieuré, jardin", description: "Pour se dire au revoir sans se presser.", dressCode: "Tenue de balade", day: 2 },
  ],
  dayTwo: {
    dateLabel: "Dimanche treize septembre",
    title: "Le brunch du lendemain",
    timeLabel: "À partir de 11 h 00",
    body: "Un dernier moment ensemble au jardin, pour raconter la soirée et se dire à bientôt.",
    note: "Ceux qui dorment sur place sont attendus pour le petit-déjeuner dès 9 h.",
    image: picture("Brunch", 40),
  },
  gifts: {
    title: "Votre présence est notre plus beau cadeau",
    body: "Si vous souhaitez tout de même nous gâter, une cagnotte est ouverte pour notre voyage de noces en Islande.",
    url: "https://cagnotte.example.com/mcjb",
    linkLabel: "Participer à notre voyage de noces",
  },
  dressCode: {
    title: "Cocktail estival, ni blanc ni noir",
    body: "Pensez au soleil de septembre et aux pelouses : des matières légères, des chaussures qui ne craignent pas l'herbe.",
    colors: ["#c8a27a", "#7d8f69", "#d9b8a0", "#4a5d73", "#b86f52", "#e5d3b3", "#8a6f9e", "#2f4f4f"],
    note: "Le blanc, l'ivoire et le crème sont réservés à la mariée.",
    image: picture("Dress code", 200),
  },
  menu: {
    sections: [
      { title: "Pour commencer", items: [{ title: "Velouté de petits pois, chèvre frais et menthe", description: "Servi froid, avec un filet d'huile d'olive de la Drôme" }, { title: "Tartare de truite du lac", description: "Condiment citron vert et baies roses" }] },
      { title: "Le plat", items: [{ title: "Suprême de volaille fermière, jus corsé aux morilles", description: "Gratin dauphinois et légumes du jardin" }, { title: "Risotto crémeux aux cèpes", description: "Version végétarienne, parmesan affiné 24 mois" }] },
      { title: "Fromages", items: [{ title: "Plateau de fromages de Savoie" }] },
      { title: "Pour finir", items: [{ title: "La pièce montée du boulanger du village", description: "Choux caramélisés, crème à la vanille bourbon" }] },
    ],
    note: "Menu végétarien et sans gluten sur demande, à préciser dans votre réponse.",
    footer: ["Vins de Savoie sélectionnés par Hugo", "Café et infusions à volonté"],
  },
  gallery: { images: [picture("Souvenir 1", 10), picture("Souvenir 2", 80), picture("Souvenir 3", 160), picture("Souvenir 4", 240), picture("Souvenir 5", 300), picture("Souvenir 6", 350)] },
  stays: Array.from({ length: 10 }, (_, index) => ({
    name: ["Hôtel du Lac", "Auberge des Trois Sapins", "Chambres d'hôtes Les Glycines", "Résidence Belle Vue", "Camping des Pins", "Gîte du Châtaignier", "Hôtel de la Poste", "Maison Berthod", "Le Chalet Fleuri", "Villa Marguerite"][index]!,
    city: index % 2 === 0 ? "Annecy" : "Annecy-le-Vieux",
    address: `${12 + index} rue des Tilleuls`,
    distance: `${5 + index * 3} min`,
    offer: index === 0 ? "-15 % avec le code PRIEURE" : undefined,
    bookingCode: index === 0 ? "PRIEURE" : undefined,
    url: index % 3 === 0 ? `https://hotel${index}.example.com` : undefined,
    phone: index === 1 ? "04 50 12 34 56" : undefined,
    image: index < 2 ? picture(`Hébergement ${index + 1}`, 30 + index * 40) : undefined,
    secondary: index >= 7,
  })),
  faq: Array.from({ length: 12 }, (_, index) => ({
    question: `Question ${index + 1} : ${["Y a-t-il un parking", "Peut-on venir avec un chien", "Que faire en cas de pluie", "Les enfants sont-ils les bienvenus", "À quelle heure finit la soirée", "Peut-on prendre des photos pendant la cérémonie", "Y a-t-il des chambres sur place", "Comment rentrer à l'hôtel", "Quelle est la météo en septembre", "Où poser une valise avant la cérémonie", "Faut-il apporter un cadeau", "À qui s'adresser le jour même"][index]} ?`,
    answer: "Une réponse volontairement longue, pour vérifier qu'elle passe à la ligne sans casser la mise en page, ni dans une colonne étroite sur mobile, ni dans un panneau animé qui doit calculer sa hauteur. ".repeat(index % 3 === 0 ? 3 : 1).trim(),
  })),
  playlist: [
    { title: "Là où je t'emmènerai", artist: "Julien Doré" },
    { title: "La Vie en rose", artist: "Édith Piaf" },
    { title: "Dancing Queen", artist: "ABBA" },
    { title: "Je te donne", artist: "Jean-Jacques Goldman" },
    { title: "Valerie", artist: "Amy Winehouse" },
  ],
  rsvp: {
    allowPartner: true,
    allowChildren: false,
    dietaryOptions: ["Aucun", "Végétarien", "Vegan", "Sans gluten", "Sans lactose", "Autre"],
    collectMessage: true,
  },
  texts: {
    "faq.title": "Vos questions\nnos réponses",
    "footer.eyebrow": "À très vite",
  },
  dayOf: { slug: "fixture", photos: true },
};
```

- [ ] **Step 4: Write the selector**

Create `landing/src/components/invitation/themes/fixtures/index.ts`:

```ts
import type { InvitationData } from "../types";

import { HEAVY_WEDDING, MINIMAL_WEDDING } from "./other-wedding";

/**
 * The data a demo page renders: the theme's own demo, or — outside production —
 * one of the control datasets, picked with `?fixture=minimal|heavy`.
 *
 * In production the query string is ignored, so the public showcase can only
 * ever show a theme's real demo.
 */
export function demoDataFor(base: InvitationData, fixture: string | undefined): InvitationData {
  if (process.env.NODE_ENV === "production") return base;
  if (fixture === "minimal") return MINIMAL_WEDDING;
  if (fixture === "heavy") return HEAVY_WEDDING;
  return base;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs --test landing/src/lib/theme-fixtures.test.mjs`
Expected: PASS, 6 tests.

- [ ] **Step 6: Let the demo route render a dataset**

In `landing/src/app/[locale]/invitation/demo/[themeId]/page.tsx`, add the import

```ts
import { demoDataFor } from "@/components/invitation/themes/fixtures";
```

and replace the default export with

```tsx
export default async function ThemeDemoPage({
  params,
  searchParams,
}: {
  params: Promise<{ themeId: string }>;
  searchParams: Promise<{ fixture?: string }>;
}) {
  const { themeId } = await params;
  const { fixture } = await searchParams;
  const theme = getTheme(themeId);

  if (!theme) notFound();

  // `?fixture=minimal|heavy` swaps in a control dataset outside production, to
  // check a theme against data that is not its own demo.
  const { Root, demoData } = theme;
  return <Root data={demoDataFor(demoData, fixture)} />;
}
```

- [ ] **Step 7: Teach `themes:shoot` the fixture and the locale**

In `landing/scripts/shoot-theme.mjs`:

Replace the argument line

```js
const [, , themeId, widthArg = "1440", outDir = "/tmp/shots"] = process.argv;
```

with

```js
const [, , themeId, widthArg = "1440", outDir = "/tmp/shots", fixture] = process.argv;
// SHOOT_LOCALE=de|ar|… renders the demo in another language; files are tagged.
const locale = process.env.SHOOT_LOCALE ?? "fr";
const tag = [themeId, fixture, locale === "fr" ? null : locale].filter(Boolean).join("-");
```

Replace the `page.goto` URL line

```js
await page.goto(`http://localhost:3010/fr/invitation/demo/${themeId}`, {
```

with

```js
await page.goto(`http://localhost:3010/${locale}/invitation/demo/${themeId}${fixture ? `?fixture=${fixture}` : ""}`, {
```

Replace `const full = \`${outDir}/${themeId}-${width}-full.png\`;` with `const full = \`${outDir}/${tag}-${width}-full.png\`;` and in the per-section path replace `${outDir}/${themeId}-${width}-` with `${outDir}/${tag}-${width}-`.

Update the usage comment at the top of the file to read:

```js
 *   npm run themes:shoot -- <themeId> [width] [outDir] [fixture]
 *   SHOOT_LOCALE=de npm run themes:shoot -- ciao-amore 1440 /tmp/shots heavy
```

- [ ] **Step 8: Verify against a real theme**

Run (dev server on :3010 is up): `npm run themes:shoot -w landing -- ciao-amore 1440 /tmp/shots-groundwork heavy`
Expected: it prints JSON with `shots` and `metrics`, and `/tmp/shots-groundwork/ciao-amore-heavy-1440-full.png` exists. Open that image and check it shows the **Marie-Charlotte / Jean-Baptiste** dataset rendered by ciao-amore (proving the route swaps the data); do the same with `minimal` to see a sparse wedding. ciao-amore may look rough on the heavy set — that is information, not a failure of this task.

- [ ] **Step 9: Checkpoint**

Run: `npx tsc --noEmit -p landing/tsconfig.json && (cd landing && npx eslint "src/app/[locale]/invitation/demo/[themeId]/page.tsx" src/components/invitation/themes/fixtures/index.ts src/components/invitation/themes/fixtures/other-wedding.ts) && npm test 2>&1 | tail -8`
Expected: tsc and eslint exit 0; `npm test` passes. Do not commit.

---

### Task 6b: `shoot-url.mjs`, a capture of the designer's live reference

**Files:**
- Create: `landing/scripts/shoot-url.mjs`
- Modify: `landing/package.json` (add the script)

**Interfaces:**
- Produces: `npm run themes:shoot-url -w landing -- <url> [width] [outDir] [tag]` — walks the page a viewport at a time (so reveal-on-scroll blocks appear), writes `<outDir>/<tag>-<width>-full.png`, prints `{ full, metrics: { scrollW, clientW, bodyH } }`.
- Why: the verification compares each theme with the designer's reference at the same width. `themes:shoot` only knows this app's demo route.

No unit test: it is a thin Playwright wrapper like `shoot-theme.mjs`. It is verified by running it.

- [ ] **Step 1: Write the script**

Create `landing/scripts/shoot-url.mjs`:

```js
/**
 * Screenshot any URL at a given width, scrolling it first so reveal-on-scroll
 * blocks appear. For comparing a ported theme with the designer's live
 * reference (the URL in the handoff note).
 *
 *   npm run themes:shoot-url -w landing -- https://example.com 390 /tmp/ref ref
 *
 * Requires Google Chrome installed (same as `themes:shoot`).
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const [, , url, widthArg = "390", outDir = "/tmp/shots", tag = "reference"] = process.argv;

if (!url) {
  console.error("usage: shoot-url.mjs <url> [width] [outDir] [tag]");
  process.exit(1);
}
const width = Number(widthArg);
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  channel: "chrome",
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const page = await browser.newPage({ viewport: { width, height: 900 } });
await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });

// Same stepwise walk as `shoot-theme.mjs`: jumping to the bottom leaves
// IntersectionObserver blocks at opacity 0 and sections photograph blank.
const viewportH = page.viewportSize()?.height ?? 900;
const pageH = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < pageH; y += Math.floor(viewportH * 0.8)) {
  await page.evaluate((top) => window.scrollTo(0, top), y);
  await page.waitForTimeout(260);
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(800);

const full = `${outDir}/${tag}-${width}-full.png`;
await page.screenshot({ path: full, fullPage: true });

const metrics = await page.evaluate(() => ({
  scrollW: document.documentElement.scrollWidth,
  clientW: document.documentElement.clientWidth,
  bodyH: document.body.scrollHeight,
}));

console.log(JSON.stringify({ full, metrics }, null, 1));
await browser.close();
```

- [ ] **Step 2: Register the script**

In `landing/package.json`, in `"scripts"`, add after the `themes:port-css` line added in Task 7 (mind the comma):

```json
    "themes:shoot-url": "node scripts/shoot-url.mjs"
```

- [ ] **Step 3: Run it against the three references**

Run:

```bash
npm run themes:shoot-url -w landing -- https://sienna-malo-mare-alta.emiliethestudio.chatgpt.site 390 /tmp/ref mare-alta
npm run themes:shoot-url -w landing -- https://invitation-chateau-eleonore-raphael.emiliethestudio.chatgpt.site 1440 /tmp/ref chateau
npm run themes:shoot-url -w landing -- https://cabo-invitation-mariage.emiliethestudio.chatgpt.site 390 /tmp/ref cabo
```

Expected: each prints JSON with a `full` path and `metrics`; open each PNG and confirm it shows the designer's invitation (Sienna & Malo, Éléonore & Raphaël, Paula & Ricardo) with its sections visible, not blank. If a site is unreachable, report it and continue — the local source folder is the fallback reference.

- [ ] **Step 4: Checkpoint**

Run: `(cd landing && npx eslint scripts/shoot-url.mjs) ; node -e 'JSON.parse(require("fs").readFileSync("landing/package.json","utf8"));console.log("package.json ok")'`
Expected: no eslint **error**; `package.json ok`. Do not commit.

---

### Task 7: `theme-messages.mjs`, the locked catalogue merge

**Files:**
- Create: `landing/scripts/theme-messages.mjs`
- Modify: `landing/package.json` (add the script)
- Test: `landing/src/lib/theme-messages.test.mjs`

**Interfaces:**
- Produces (exports of the script, used by the test): `LOCALES`, `PROTECTED`, `keyPaths(value): string[]`, `mergeNamespace(catalog, camelId, namespace)`, `assertParity(namespaces)`, `runMerge({ camelId, dir, messagesDir? })`.
- CLI: `npm run themes:messages -w landing -- <camelId> <dir>`, where `<dir>` holds `fr.json … ja.json`, each the **namespace object** of the theme (the content of `Invitation.<camelId>`), not a whole catalogue.

- [ ] **Step 1: Write the failing tests**

Create `landing/src/lib/theme-messages.test.mjs`:

```js
/**
 * Merging one theme's messages into the nine catalogues, under a lock.
 *
 *   node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs \
 *     --test landing/src/lib/theme-messages.test.mjs
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  LOCALES,
  assertParity,
  keyPaths,
  mergeNamespace,
  runMerge,
} from "../../scripts/theme-messages.mjs";

const SCRIPT = fileURLToPath(new URL("../../scripts/theme-messages.mjs", import.meta.url));

function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "theme-messages-"));
}

function writeCatalogues(dir) {
  for (const locale of LOCALES) {
    const catalog = { Hero: { title: locale }, Invitation: { ciaoAmore: { keep: locale } } };
    fs.writeFileSync(path.join(dir, `${locale}.json`), JSON.stringify(catalog, null, 2) + "\n");
  }
}

function writeNamespace(dir, namespace, { skip } = {}) {
  fs.mkdirSync(dir, { recursive: true });
  for (const locale of LOCALES) {
    if (locale === skip) continue;
    fs.writeFileSync(path.join(dir, `${locale}.json`), JSON.stringify(namespace(locale), null, 2));
  }
}

const read = (dir, locale) => JSON.parse(fs.readFileSync(path.join(dir, `${locale}.json`), "utf8"));

test("keyPaths lists every leaf with its dotted path", () => {
  assert.deepEqual(keyPaths({ a: "x", b: { c: "y", d: { e: "z" } } }).sort(), ["a", "b.c", "b.d.e"]);
});

test("mergeNamespace replaces one namespace and touches nothing else", () => {
  const catalog = { Hero: { t: 1 }, Invitation: { ciaoAmore: { a: 1 }, other: { b: 2 } } };
  const merged = mergeNamespace(catalog, "mareAlta", { x: "y" });
  assert.deepEqual(merged.Invitation.mareAlta, { x: "y" });
  assert.deepEqual(merged.Invitation.ciaoAmore, { a: 1 });
  assert.deepEqual(merged.Hero, { t: 1 });
  assert.deepEqual(mergeNamespace(merged, "mareAlta", { x: "z" }).Invitation.mareAlta, { x: "z" });
  assert.deepEqual(catalog.Invitation.mareAlta, undefined, "the input is not mutated");
});

test("parity: the nine locales must carry exactly French's keys", () => {
  const ok = Object.fromEntries(LOCALES.map((locale) => [locale, { a: "1", b: { c: "2" } }]));
  assert.doesNotThrow(() => assertParity(ok));

  const missing = { ...ok, de: { a: "1" } };
  assert.throws(() => assertParity(missing), /de.*b\.c/s);

  const extra = { ...ok, ja: { a: "1", b: { c: "2" }, z: "3" } };
  assert.throws(() => assertParity(extra), /ja.*z/s);
});

test("runMerge writes all nine catalogues, is idempotent, and keeps the file format", () => {
  const messagesDir = tmp();
  const dir = path.join(tmp(), "staging");
  writeCatalogues(messagesDir);
  writeNamespace(dir, (locale) => ({ hero: { cta: `cta-${locale}` } }));

  runMerge({ camelId: "mareAlta", dir, messagesDir });
  const once = fs.readFileSync(path.join(messagesDir, "fr.json"), "utf8");
  assert.ok(once.endsWith("}\n"));
  assert.equal(read(messagesDir, "de").Invitation.mareAlta.hero.cta, "cta-de");
  assert.equal(read(messagesDir, "de").Invitation.ciaoAmore.keep, "de");

  runMerge({ camelId: "mareAlta", dir, messagesDir });
  assert.equal(fs.readFileSync(path.join(messagesDir, "fr.json"), "utf8"), once);
});

test("runMerge refuses a missing locale and the existing themes' namespaces", () => {
  const messagesDir = tmp();
  writeCatalogues(messagesDir);

  const incomplete = path.join(tmp(), "incomplete");
  writeNamespace(incomplete, () => ({ a: "1" }), { skip: "ar" });
  assert.throws(() => runMerge({ camelId: "caboVerde", dir: incomplete, messagesDir }), /ar\.json/);

  const complete = path.join(tmp(), "complete");
  writeNamespace(complete, () => ({ a: "1" }));
  for (const protectedId of ["ciaoAmore", "belleRive", "editorPreview"]) {
    assert.throws(() => runMerge({ camelId: protectedId, dir: complete, messagesDir }), /protected/i);
  }
  assert.equal(read(messagesDir, "fr").Invitation.caboVerde, undefined, "nothing was written");
});

test("two processes merging at once both land, in valid JSON", async () => {
  const messagesDir = tmp();
  writeCatalogues(messagesDir);
  const stagingA = path.join(tmp(), "a");
  const stagingB = path.join(tmp(), "b");
  writeNamespace(stagingA, (locale) => ({ who: `a-${locale}` }));
  writeNamespace(stagingB, (locale) => ({ who: `b-${locale}` }));

  const run = (camelId, dir) =>
    new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [SCRIPT, camelId, dir], {
        env: { ...process.env, THEME_MESSAGES_DIR: messagesDir },
        stdio: "pipe",
      });
      let stderr = "";
      child.stderr.on("data", (chunk) => (stderr += chunk));
      child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(stderr))));
    });

  await Promise.all([run("mareAlta", stagingA), run("chateauRoyal", stagingB)]);

  for (const locale of LOCALES) {
    const catalog = read(messagesDir, locale);
    assert.equal(catalog.Invitation.mareAlta.who, `a-${locale}`);
    assert.equal(catalog.Invitation.chateauRoyal.who, `b-${locale}`);
  }
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs --test landing/src/lib/theme-messages.test.mjs`
Expected: FAIL — `Cannot find module` for `theme-messages.mjs`.

- [ ] **Step 3: Implement the script**

Create `landing/scripts/theme-messages.mjs`:

```js
#!/usr/bin/env node
/**
 * Merge one theme's messages into the nine landing catalogues.
 *
 *   npm run themes:messages -w landing -- <camelId> <dir>
 *
 * `<dir>` holds `fr.json … ja.json`, each the *namespace object* of the theme —
 * the content that belongs under `Invitation.<camelId>` — not a whole
 * catalogue. Keep it outside the repo (a scratch folder): the catalogues are the
 * source of truth once merged.
 *
 * Why a script: three themes are ported at once and each adds ~100 strings to
 * the same nine files. A read-modify-write by hand loses an update whenever two
 * overlap. The merge takes a lock, replaces only `Invitation.<camelId>`, checks
 * that the nine languages carry exactly the same keys, and re-running it with
 * the same input changes nothing.
 *
 * Files are written as `JSON.stringify(obj, null, 2) + "\n"`, which reproduces
 * the committed catalogues byte for byte, so a merge produces no stray diff.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const LOCALES = ["fr", "en", "de", "es", "pt", "it", "ar", "zh", "ja"];

/** Namespaces a merge must never overwrite: the shipped themes and the editor. */
export const PROTECTED = ["ciaoAmore", "belleRive", "editorPreview"];

const DEFAULT_MESSAGES_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "messages",
);

/** Every leaf of an object as a dotted path: `hero.cta`, `rsvp.titleLine1`… */
export function keyPaths(value, prefix = "") {
  if (value === null || typeof value !== "object") return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

/** The catalogue with `Invitation.<camelId>` replaced. Pure: nothing mutates. */
export function mergeNamespace(catalog, camelId, namespace) {
  return {
    ...catalog,
    Invitation: { ...catalog.Invitation, [camelId]: namespace },
  };
}

/** Throws unless every locale has exactly French's keys. */
export function assertParity(namespaces) {
  const reference = new Set(keyPaths(namespaces.fr));
  const problems = [];

  for (const locale of LOCALES) {
    const keys = new Set(keyPaths(namespaces[locale]));
    const missing = [...reference].filter((key) => !keys.has(key));
    const extra = [...keys].filter((key) => !reference.has(key));
    if (missing.length) problems.push(`${locale} lacks: ${missing.join(", ")}`);
    if (extra.length) problems.push(`${locale} has keys French lacks: ${extra.join(", ")}`);
  }

  if (problems.length) throw new Error(`Catalogues out of step:\n  ${problems.join("\n  ")}`);
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/** Runs `work` while holding a directory lock; a lock older than a minute is stale. */
function withLock(messagesDir, work) {
  const lock = path.join(messagesDir, ".merge.lock");
  const deadline = Date.now() + 30_000;

  for (;;) {
    try {
      fs.mkdirSync(lock);
      break;
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      try {
        if (Date.now() - fs.statSync(lock).mtimeMs > 60_000) fs.rmSync(lock, { recursive: true });
      } catch {
        /* released between the two calls: try again */
      }
      if (Date.now() > deadline) throw new Error(`Timed out waiting for ${lock}`);
      sleep(100);
    }
  }

  try {
    return work();
  } finally {
    fs.rmSync(lock, { recursive: true, force: true });
  }
}

export function runMerge({ camelId, dir, messagesDir = DEFAULT_MESSAGES_DIR }) {
  if (!/^[a-z][A-Za-z0-9]*$/.test(camelId)) throw new Error(`"${camelId}" is not a camelCase id`);
  if (PROTECTED.includes(camelId)) throw new Error(`"${camelId}" is a protected namespace`);

  const namespaces = {};
  for (const locale of LOCALES) {
    const file = path.join(dir, `${locale}.json`);
    if (!fs.existsSync(file)) throw new Error(`Missing ${file}`);
    namespaces[locale] = JSON.parse(fs.readFileSync(file, "utf8"));
  }
  assertParity(namespaces);

  withLock(messagesDir, () => {
    // Read everything before writing anything, so a bad catalogue aborts the
    // merge with all nine files untouched.
    const catalogs = Object.fromEntries(
      LOCALES.map((locale) => [
        locale,
        JSON.parse(fs.readFileSync(path.join(messagesDir, `${locale}.json`), "utf8")),
      ]),
    );
    for (const locale of LOCALES) {
      const merged = mergeNamespace(catalogs[locale], camelId, namespaces[locale]);
      fs.writeFileSync(
        path.join(messagesDir, `${locale}.json`),
        JSON.stringify(merged, null, 2) + "\n",
      );
    }
  });

  return { camelId, keys: keyPaths(namespaces.fr).length };
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  const [, , camelId, dir] = process.argv;
  if (!camelId || !dir) {
    console.error("usage: theme-messages.mjs <camelId> <dir with fr.json … ja.json>");
    process.exit(1);
  }
  try {
    const { keys } = runMerge({
      camelId,
      dir: path.resolve(dir),
      // Lets a test aim the merge at a scratch folder; unset in real use.
      messagesDir: process.env.THEME_MESSAGES_DIR || DEFAULT_MESSAGES_DIR,
    });
    console.error(`merged Invitation.${camelId}: ${keys} keys × ${LOCALES.length} locales`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
```

- [ ] **Step 4: Register the npm scripts**

In `landing/package.json`, in `"scripts"`, after the `"themes:shoot-scroll"` line, add (mind the comma on the previous line):

```json
    "themes:messages": "node scripts/theme-messages.mjs",
    "themes:port-css": "node scripts/port-theme-css.mjs"
```

(`themes:port-css` is created by Task 8; registering both now keeps the file edit single.)

- [ ] **Step 5: Run the tests to verify they pass**

Run: `node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs --test landing/src/lib/theme-messages.test.mjs`
Expected: PASS, 6 tests (the concurrency test takes about a second).

- [ ] **Step 6: Checkpoint**

Run: `(cd landing && npx eslint scripts/theme-messages.mjs src/lib/theme-messages.test.mjs) && node -e 'JSON.parse(require("fs").readFileSync("landing/package.json","utf8"));console.log("package.json ok")'`
Expected: eslint exit 0 (`scripts/` is not in the lint scope, in which case eslint reports "no files matching" for it; that is fine — treat only an **error** about the test file as a failure) and `package.json ok`. Do not commit.

---

### Task 8: `port-theme-css.mjs`, the CSS pipeline

**Files:**
- Create: `landing/scripts/port-theme-css.mjs`
- Test: `landing/src/lib/port-theme-css.test.mjs`

**Interfaces:**
- Produces (exports, used by the test): `preprocess(css, options)`, `scopeKeyframes(css, prefix)`, `substituteFonts(css, fonts)`, `bakeDecorWords(css, decor)`, `verify(css, options)`, `portThemeCss(config)`.
- CLI: `npm run themes:port-css -w landing -- <config.json>`.
- Config (JSON; relative paths resolve against the config file's folder):

```json
{
  "source": "/abs/path/to/globals.css",
  "out": "../../landing/src/components/invitation/themes/<id>/<id>.css",
  "scope": "theme-<id>",
  "columnClass": "xx-column",
  "dropImports": ["tw-animate-css", "shadcn"],
  "assets": ["/embroidered-=/themes/<id>/embroidered-", ".png=.webp"],
  "fonts": [
    { "family": "Didot", "variable": "--font-xx-display", "position": "after" }
  ],
  "decor": { "S · M": "--xx-menu-monogram" },
  "publicDir": "../../landing/public",
  "markup": ["/abs/path/to/page.tsx"]
}
```

`columnClass` is optional (omit it for a full-bleed theme). `fonts[].position` is `"after"` (keep the designer's Apple-only face first, add the web font after it) or `"before"` (the web font leads — for fonts the designer loaded from Google Fonts, which `next/font` serves under a hashed name only reachable through the variable). `decor` maps the exact text of a CSS `content:` string to the custom property that will carry it.

- [ ] **Step 1: Write the failing tests**

Create `landing/src/lib/port-theme-css.test.mjs`:

```js
/**
 * The CSS pipeline: pre-process, scope, post-process, verify.
 *
 *   node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs \
 *     --test landing/src/lib/port-theme-css.test.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  bakeDecorWords,
  portThemeCss,
  preprocess,
  scopeKeyframes,
  substituteFonts,
  verify,
} from "../../scripts/port-theme-css.mjs";

const squash = (css) => css.replace(/\s+/g, " ").trim();

/* -- preprocess --------------------------------------------------------- */

test("preprocess drops the framework imports and the comments", () => {
  const out = preprocess(
    `@import "tailwindcss"; @import "tw-animate-css"; @import "../vendor/shadcn-4.css";
     @import url("https://fonts.googleapis.com/css2?family=Jost");
     /* a note */ .a{color:red}`,
    { dropImports: ["tw-animate-css", "shadcn"] },
  );
  assert.equal(squash(out), ".a{color:red}");
});

test("preprocess moves the source's main onto the column class, everywhere", () => {
  const out = preprocess(
    `main{width:720px} main > .x{color:red} body{background:#7b8574}
     @media (max-width:600px){main{width:100%}} .main-title{color:blue}`,
    { columnClass: "ma-column" },
  );
  const css = squash(out);
  assert.match(css, /\.ma-column\{width:720px\}/);
  assert.match(css, /\.ma-column > \.x/);
  assert.match(css, /@media \(max-width:600px\)\{\.ma-column\{width:100%\}\}/);
  assert.match(css, /body\{background:#7b8574\}/, "body stays: it becomes the root");
  assert.match(css, /\.main-title/, "a class that merely starts with main is untouched");
});

test("without a column class, main is left for the scoper to fold onto the root", () => {
  assert.match(squash(preprocess("main{overflow:hidden}")), /^main\{overflow:hidden\}$/);
});

/* -- scopeKeyframes ----------------------------------------------------- */

test("keyframes are prefixed with the theme, and so is every use", () => {
  const out = squash(
    scopeKeyframes(
      `@keyframes spin{to{transform:rotate(1turn)}} @-webkit-keyframes spin{to{transform:rotate(1turn)}}
       @keyframes fade{from{opacity:0}}
       .a{animation:spin 2s linear infinite,fade 1s ease} .b{animation-name:fade;animation-duration:var(--d,1s)} .c{animation:none}`,
      "t-",
    ),
  );
  assert.match(out, /@keyframes t-spin/);
  assert.match(out, /@-webkit-keyframes t-spin/);
  assert.match(out, /@keyframes t-fade/);
  assert.match(out, /animation:t-spin 2s linear infinite,t-fade 1s ease/);
  assert.match(out, /animation-name:t-fade/);
  assert.match(out, /animation:none/, "a keyword is left alone");
  assert.match(out, /var\(--d,1s\)/, "a fallback inside var() is left alone");
});

test("scoping keyframes twice changes nothing the second time", () => {
  const once = scopeKeyframes("@keyframes spin{to{opacity:1}} .a{animation:spin 1s}", "t-");
  assert.equal(scopeKeyframes(once, "t-"), once);
});

test("verify reports a keyframe that kept its global name", () => {
  const publicDir = fs.mkdtempSync(path.join(os.tmpdir(), "port-css-public-"));
  const bare = verify("@keyframes spin{to{opacity:1}}", { scope: "theme-t", publicDir, keyframePrefix: "t-" });
  assert.deepEqual(bare.unscopedKeyframes, ["spin"]);
  const scoped = verify("@keyframes t-spin{to{opacity:1}}", { scope: "theme-t", publicDir, keyframePrefix: "t-" });
  assert.deepEqual(scoped.unscopedKeyframes, []);
});

/* -- substituteFonts ---------------------------------------------------- */

const APPLE = [
  { family: "Didot", variable: "--font-ma-display", position: "after" },
  { family: "Avenir Next", variable: "--font-ma-sans", position: "after" },
  { family: "Avenir", variable: "--font-ma-sans", position: "after" },
];

test("an Apple-only face keeps the first place and the web font follows it", () => {
  const out = squash(
    substituteFonts(
      `h1{font:400 clamp(3rem,10vw,5.7rem)/0.95 Didot, "Bodoni MT", Georgia, serif}
       p{font-family:"Avenir Next", Avenir, Arial, sans-serif}`,
      APPLE,
    ),
  );
  assert.match(out, /Didot, var\(--font-ma-display\), "Bodoni MT", Georgia, serif/);
  assert.match(out, /"Avenir Next", var\(--font-ma-sans\), Avenir, Arial, sans-serif/);
});

test("a face the designer loaded from Google Fonts is replaced by the variable first", () => {
  const out = squash(
    substituteFonts(
      `body{font:400 1rem/1.5 Jost,sans-serif} h1{font:400 5rem/.9 'Bodoni Moda',serif} .k{font:1.25rem 'Bodoni Moda'}`,
      [
        { family: "Jost", variable: "--font-cr-sans", position: "before" },
        { family: "Bodoni Moda", variable: "--font-cr-display", position: "before" },
      ],
    ),
  );
  assert.match(out, /1\.5 var\(--font-cr-sans\), Jost,sans-serif/);
  assert.match(out, /\.9 var\(--font-cr-display\), 'Bodoni Moda',serif/);
  assert.match(out, /1\.25rem var\(--font-cr-display\), 'Bodoni Moda'\}/);
});

test("fonts are substituted once, and only whole family names", () => {
  const css = `a{font-family:Didot,serif} b{font-family:"Didot Display",serif} c{font:italic 1em Georgia,serif}`;
  const once = substituteFonts(css, APPLE);
  assert.equal(substituteFonts(once, APPLE), once, "idempotent");
  assert.doesNotMatch(squash(once), /Didot Display", var/);
  assert.match(squash(once), /c\{font:italic 1em Georgia,serif\}/);
});

/* -- bakeDecorWords ----------------------------------------------------- */

test("words drawn by content: become custom properties", () => {
  const { css, unmapped } = bakeDecorWords(
    `.a::before{content:"S · M"} .b::after{content:'CASA  ·  X'} .c::before{content:"★  ★\\A★"} .d::before{content:""} .e::before{content:"\\201C"}`,
    { "S · M": "--ma-menu-monogram", "CASA  ·  X": "--ma-menu-footer" },
  );
  assert.deepEqual(unmapped, []);
  assert.match(css, /content:\s*var\(--ma-menu-monogram\)/);
  assert.match(css, /content:\s*var\(--ma-menu-footer\)/);
  assert.match(css, /content:\s*"★  ★\\A★"/, "a decoration with no letters is left alone");
});

test("a content string with letters and no mapping is reported", () => {
  const { unmapped } = bakeDecorWords(`.a::before{content:"SÃO VICENTE"}`, {});
  assert.deepEqual(unmapped, ["SÃO VICENTE"]);
});

/* -- verify ------------------------------------------------------------- */

test("verify reports selectors outside the scope, undefined variables and missing assets", () => {
  const publicDir = fs.mkdtempSync(path.join(os.tmpdir(), "port-css-public-"));
  fs.mkdirSync(path.join(publicDir, "themes/t"), { recursive: true });
  fs.writeFileSync(path.join(publicDir, "themes/t/there.webp"), "x");

  const report = verify(
    `.theme-t{--gold:#b8}
     .theme-t .a{color:var(--gold);background:url("/themes/t/there.webp")}
     .theme-t .b{color:var(--ghost);background:url(/themes/t/gone.webp);font-family:var(--font-t-sans)}
     .leak{color:red}
     @keyframes spin{from{opacity:0}to{opacity:1}}`,
    { scope: "theme-t", publicDir, markup: ["<div class='a'></div>"] },
  );
  assert.deepEqual(report.outside, [".leak"]);
  assert.deepEqual(report.undefinedVars, ["--ghost"]);
  assert.deepEqual(report.missingAssets, ["/themes/t/gone.webp"]);
  assert.deepEqual(report.unusedClasses, ["b", "leak"]);
});

test("verify does not call a decor variable undefined: the theme's root sets it", () => {
  const css = `.theme-t .a::before{content:var(--t-word)}`;
  const publicDir = fs.mkdtempSync(path.join(os.tmpdir(), "port-css-public-"));
  assert.deepEqual(verify(css, { scope: "theme-t", publicDir }).undefinedVars, ["--t-word"]);
  assert.deepEqual(
    verify(css, { scope: "theme-t", publicDir, externalVars: ["--t-word"] }).undefinedVars,
    [],
  );
});

/* -- the whole pipeline ------------------------------------------------- */

test("portThemeCss turns a designer sheet into a scoped, font-aware, leak-free file", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "port-css-"));
  fs.mkdirSync(path.join(dir, "public/themes/t"), { recursive: true });
  fs.writeFileSync(path.join(dir, "public/themes/t/bg.webp"), "x");
  fs.writeFileSync(
    path.join(dir, "globals.css"),
    `@import "tailwindcss";
     :root{--ivory:#f5f0e7;--gold:#b69961}
     body{margin:0;background:#7b8574}
     main{width:min(100%,720px);margin:auto;background:var(--ivory)}
     h2{font:400 3rem/1 Didot, serif;color:var(--gold)}
     .hero{background:url("/bg.png")}
     .card::before{content:"S · M"}
     @keyframes spin{to{opacity:1}} .card{animation:spin 1s}
     @media (max-width:600px){main{width:100%}}`,
  );
  fs.writeFileSync(path.join(dir, "markup.html"), `<main class="hero card"><h2>x</h2></main>`);

  const result = portThemeCss({
    source: path.join(dir, "globals.css"),
    out: path.join(dir, "t.css"),
    scope: "theme-t",
    columnClass: "t-column",
    assets: ["/bg.png=/themes/t/bg.webp"],
    fonts: [{ family: "Didot", variable: "--font-t-display", position: "after" }],
    decor: { "S · M": "--t-monogram" },
    publicDir: path.join(dir, "public"),
    markup: [path.join(dir, "markup.html")],
  });

  const css = squash(fs.readFileSync(path.join(dir, "t.css"), "utf8"));
  assert.match(css, /\.theme-t\{--ivory:#f5f0e7/);
  assert.match(css, /\.theme-t\{margin:0;background:#7b8574\}/);
  assert.match(css, /\.theme-t \.t-column\{width:min\(100%,720px\)/);
  assert.match(css, /Didot, var\(--font-t-display\), serif/);
  assert.match(css, /\/themes\/t\/bg\.webp/);
  assert.match(css, /content:\s*var\(--t-monogram\)/);
  assert.match(css, /@keyframes t-spin/);
  assert.match(css, /animation:\s*t-spin 1s/);
  assert.doesNotMatch(css, /tailwindcss/);
  assert.deepEqual(result.report.outside, []);
  assert.deepEqual(result.report.unscopedKeyframes, []);
});

test("portThemeCss fails loudly on an unmapped word and on a leak", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "port-css-"));
  fs.writeFileSync(path.join(dir, "globals.css"), `.a::before{content:"SÃO VICENTE"}`);
  assert.throws(
    () =>
      portThemeCss({
        source: path.join(dir, "globals.css"),
        out: path.join(dir, "t.css"),
        scope: "theme-t",
        publicDir: dir,
      }),
    /SÃO VICENTE/,
  );
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs --test landing/src/lib/port-theme-css.test.mjs`
Expected: FAIL — `Cannot find module` for `port-theme-css.mjs`.

- [ ] **Step 3: Implement the pipeline**

Create `landing/scripts/port-theme-css.mjs`:

```js
#!/usr/bin/env node
/**
 * Port a designer's stylesheet into a theme folder, reproducibly.
 *
 *   npm run themes:port-css -w landing -- <config.json>
 *
 * The README's "port" is five hand steps (scope, fonts, assets, checks,
 * decor words) that the three ports of this app each repeated, and one of them
 * — the font substitution — was lost every time the sheet was re-scoped. This
 * runs them as one command from a small config, so a re-port is the same
 * command again.
 *
 *   1. PRE-PROCESS  drop the framework @imports and the comments; move the
 *                   source's `main` rules onto the theme's column class (when
 *                   the design is a centred column), because the scoper would
 *                   otherwise fold `html`, `body` and `main` onto ONE element
 *                   and lose either the backdrop or the column.
 *   2. SCOPE        `scope-theme-css.mjs`, unchanged: every selector under one
 *                   root class, asset URLs rewritten.
 *   2b. KEYFRAMES   `@keyframes` names are global to the document and every
 *                   theme's sheet loads together (the registry imports them
 *                   all), so two themes that name an animation `softRise` or
 *                   `sunPulse` swap each other's. Each name, and each use of
 *                   it, is prefixed with the theme's.
 *   3. FONTS        add the `next/font` variable to every `font` and
 *                   `font-family` that names a configured face.
 *   4. DECOR WORDS  replace each `content:` string that contains letters with
 *                   a custom property the theme's root sets from the couple's
 *                   data. Any such string left unmapped fails the port.
 *   5. VERIFY       nothing outside the scope; no custom property used and never
 *                   defined (the `--font-*` and the decor variables, which are
 *                   set at runtime, excepted); every asset exists. Classes the
 *                   markup never uses are listed for information only.
 *
 * The generated file is never edited by hand. Comments are dropped, so what the
 * designer wrote about the demo wedding cannot leak through them either.
 *
 * Config paths are resolved against the config file's folder.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import postcss from "postcss";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCOPE_SCRIPT = path.join(HERE, "scope-theme-css.mjs");

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function insideKeyframes(node) {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (parent.type === "atrule" && /keyframes$/i.test(parent.name)) return true;
  }
  return false;
}

/* -- 1. pre-process ----------------------------------------------------- */

export function preprocess(css, { columnClass, dropImports = [] } = {}) {
  const root = postcss.parse(css);

  root.walkComments((comment) => comment.remove());

  root.walkAtRules("import", (rule) => {
    const params = rule.params;
    if (
      /tailwindcss/.test(params) ||
      /fonts\.googleapis\.com/.test(params) ||
      dropImports.some((needle) => params.includes(needle))
    ) {
      rule.remove();
    }
  });

  if (columnClass) {
    root.walkRules((rule) => {
      if (insideKeyframes(rule)) return;
      rule.selectors = rule.selectors.map((selector) =>
        selector.replace(/^main(?![\w-])/, `.${columnClass}`),
      );
    });
  }

  return root.toString();
}

/* -- 2b. keyframes ------------------------------------------------------ */

/**
 * Prefix every `@keyframes` name, and every `animation` that uses it.
 *
 * Already happening between the designers' sheets and the shipped themes:
 * `sunPulse` (Maré Alta / ciao-amore), `softRise` (Maré Alta / Cabo Verde),
 * `giftFloat` (Maré Alta / belle-rive). A keyword (`ease`, `infinite`) is
 * touched only if a keyframe carries that exact name.
 */
export function scopeKeyframes(css, prefix) {
  const root = postcss.parse(css);
  const names = new Map();

  root.walkAtRules(/^(-webkit-)?keyframes$/i, (rule) => {
    const name = rule.params.trim();
    if (!name.startsWith(prefix)) names.set(name, `${prefix}${name}`);
  });
  root.walkAtRules(/^(-webkit-)?keyframes$/i, (rule) => {
    const name = rule.params.trim();
    if (names.has(name)) rule.params = names.get(name);
  });
  root.walkDecls(/^(-webkit-)?animation(-name)?$/i, (decl) => {
    decl.value = decl.value.replace(
      /(?<![\w-])[A-Za-z_][\w-]*(?![\w-]|\()/g,
      (token) => names.get(token) ?? token,
    );
  });

  return root.toString();
}

/* -- 3. fonts ----------------------------------------------------------- */

export function substituteFonts(css, fonts) {
  const root = postcss.parse(css);

  root.walkDecls(/^font(-family)?$/, (decl) => {
    let value = decl.value;

    for (const { family, variable, position = "after" } of fonts) {
      if (value.includes(`var(${variable})`)) continue;

      // A quoted name, or a bare one standing alone between commas — never
      // "Avenir" inside "Avenir Next".
      const name = escapeRegExp(family);
      const pattern = new RegExp(
        `(['"])${name}\\1|(?<![\\w'"-])${name}(?=\\s*(?:,|$))`,
      );

      value = value.replace(pattern, (match) =>
        position === "before" ? `var(${variable}), ${match}` : `${match}, var(${variable})`,
      );
    }

    decl.value = value;
  });

  return root.toString();
}

/* -- 4. decor words ----------------------------------------------------- */

/** CSS escapes (`\A`, `\201C`) are not words. */
const withoutEscapes = (text) => text.replace(/\\[0-9a-fA-F]{1,6}\s?/g, "");

export function bakeDecorWords(css, decor) {
  const root = postcss.parse(css);
  const unmapped = [];

  root.walkDecls("content", (decl) => {
    const match = decl.value.match(/^(["'])([\s\S]*)\1$/);
    if (!match) return;

    const text = match[2];
    if (!/\p{L}/u.test(withoutEscapes(text))) return;

    const variable = decor[text];
    if (variable) decl.value = `var(${variable})`;
    else unmapped.push(text);
  });

  return { css: root.toString(), unmapped };
}

/* -- 5. verify ---------------------------------------------------------- */

export function verify(css, { scope, publicDir, markup = [], externalVars = [], keyframePrefix }) {
  const root = postcss.parse(css);
  const defined = new Set();
  const used = new Set();
  const outside = [];
  const classes = new Set();
  const assets = new Set();

  root.walkDecls((decl) => {
    if (decl.prop.startsWith("--")) defined.add(decl.prop);
    for (const match of decl.value.matchAll(/var\((--[\w-]+)/g)) used.add(match[1]);
    for (const match of decl.value.matchAll(/url\(\s*(['"]?)([^)'"]+)\1\s*\)/g)) {
      const url = match[2];
      if (url.startsWith("/") && !url.startsWith("//")) assets.add(url.split("?")[0]);
    }
  });

  root.walkRules((rule) => {
    if (insideKeyframes(rule)) return;
    for (const selector of rule.selectors) {
      if (!selector.trim().startsWith(`.${scope}`)) outside.push(selector.trim());
      for (const match of selector.matchAll(/\.([A-Za-z_][\w-]*)/g)) classes.add(match[1]);
    }
  });

  const unscopedKeyframes = [];
  root.walkAtRules(/^(-webkit-)?keyframes$/i, (rule) => {
    const name = rule.params.trim();
    if (keyframePrefix && !name.startsWith(keyframePrefix)) unscopedKeyframes.push(name);
  });

  // `--font-*` come from next/font; `externalVars` are the decor words, which
  // the theme's root sets inline from the couple's data. Neither is in the sheet.
  const undefinedVars = [...used]
    .filter(
      (name) =>
        !defined.has(name) && !name.startsWith("--font-") && !externalVars.includes(name),
    )
    .sort();

  const missingAssets = [...assets]
    .filter((url) => !fs.existsSync(path.join(publicDir, url)))
    .sort();

  const markupText = markup.join("\n");
  const unusedClasses = [...classes]
    .filter((name) => name !== scope && !new RegExp(`(?<![\\w-])${escapeRegExp(name)}(?![\\w-])`).test(markupText))
    .sort();

  return { outside, undefinedVars, missingAssets, unusedClasses, unscopedKeyframes };
}

/* -- the pipeline ------------------------------------------------------- */

export function portThemeCss(config) {
  const {
    source,
    out,
    scope,
    columnClass,
    dropImports = [],
    assets = [],
    fonts = [],
    decor = {},
    publicDir,
    markup = [],
  } = config;

  const work = fs.mkdtempSync(path.join(os.tmpdir(), "port-theme-css-"));
  const staged = path.join(work, "pre.css");
  const scoped = path.join(work, "scoped.css");

  fs.writeFileSync(
    staged,
    preprocess(fs.readFileSync(source, "utf8"), { columnClass, dropImports }),
  );
  execFileSync(process.execPath, [SCOPE_SCRIPT, staged, scoped, scope, ...assets], {
    stdio: ["ignore", "ignore", "pipe"],
  });

  const keyframePrefix = config.keyframePrefix ?? `${scope.replace(/^theme-/, "")}-`;
  let css = substituteFonts(scopeKeyframes(fs.readFileSync(scoped, "utf8"), keyframePrefix), fonts);

  const baked = bakeDecorWords(css, decor);
  if (baked.unmapped.length > 0) {
    throw new Error(
      "Unmapped words drawn by CSS content:\n  " +
        baked.unmapped.map((word) => JSON.stringify(word)).join("\n  ") +
        "\nMap each to a custom property in the config's `decor`, or the demo couple's words ship.",
    );
  }
  css = baked.css;

  const report = verify(css, {
    scope,
    publicDir,
    markup: markup.map((file) => fs.readFileSync(file, "utf8")),
    externalVars: Object.values(decor),
    keyframePrefix,
  });

  const problems = [];
  if (report.outside.length) problems.push(`selectors outside .${scope}: ${report.outside.join(", ")}`);
  if (report.undefinedVars.length) problems.push(`custom properties used but never defined: ${report.undefinedVars.join(", ")}`);
  if (report.missingAssets.length) problems.push(`assets that do not exist: ${report.missingAssets.join(", ")}`);
  if (report.unscopedKeyframes.length) problems.push(`keyframes with a global name: ${report.unscopedKeyframes.join(", ")}`);
  if (problems.length) throw new Error("Port failed:\n  " + problems.join("\n  "));

  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, css);
  fs.rmSync(work, { recursive: true, force: true });

  return { out, bytes: css.length, report };
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  const [, , configPath] = process.argv;
  if (!configPath) {
    console.error("usage: port-theme-css.mjs <config.json>");
    process.exit(1);
  }

  try {
    const file = path.resolve(configPath);
    const base = path.dirname(file);
    const raw = JSON.parse(fs.readFileSync(file, "utf8"));
    const resolve = (value) => (value ? path.resolve(base, value) : value);

    const { out, bytes, report } = portThemeCss({
      ...raw,
      source: resolve(raw.source),
      out: resolve(raw.out),
      publicDir: resolve(raw.publicDir),
      markup: (raw.markup ?? []).map(resolve),
    });

    console.error(`wrote ${out} (${Math.round(bytes / 1024)} KB)`);
    console.error(`${report.unusedClasses.length} class(es) in the sheet are never used by the markup (informational)`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs --test landing/src/lib/port-theme-css.test.mjs`
Expected: PASS, 15 tests.

If the `@media` rename test fails because postcss re-serialises the at-rule parameters with different spacing, loosen the **assertion's** whitespace (it already collapses runs of space), not the behaviour: the requirement is that a `main` inside `@media` becomes the column class.

- [ ] **Step 5: Smoke-test on a real sheet**

Create a throw-away config in the scratchpad (not in the repo) and run the pipeline on the smallest real source, to prove it handles a minified sheet:

```bash
SCRATCH=/private/tmp/claude-502/-Users-tarik-klezo-Documents-perso-the-studio-digital-papeterie/577e7b05-963c-4e93-83aa-d46f0296997b/scratchpad
cat > $SCRATCH/smoke-chateau.json <<'EOF'
{
  "source": "/Users/tarik.klezo/Downloads/chateau/dist/style.css",
  "out": "/private/tmp/claude-502/-Users-tarik-klezo-Documents-perso-the-studio-digital-papeterie/577e7b05-963c-4e93-83aa-d46f0296997b/scratchpad/smoke-chateau.css",
  "scope": "theme-chateau-royal",
  "assets": ["assets/=/themes/chateau-royal/"],
  "fonts": [
    { "family": "Jost", "variable": "--font-cr-sans", "position": "before" },
    { "family": "Bodoni Moda", "variable": "--font-cr-display", "position": "before" },
    { "family": "Italiana", "variable": "--font-cr-italiana", "position": "before" },
    { "family": "Pinyon Script", "variable": "--font-cr-script", "position": "before" }
  ],
  "publicDir": "/private/tmp/claude-502/-Users-tarik-klezo-Documents-perso-the-studio-digital-papeterie/577e7b05-963c-4e93-83aa-d46f0296997b/scratchpad/no-public",
  "markup": ["/Users/tarik.klezo/Downloads/chateau/dist/index.html"]
}
EOF
npm run themes:port-css -w landing -- $SCRATCH/smoke-chateau.json
```

Expected: it **fails** with `assets that do not exist: /themes/chateau-royal/chateau-day.webp, …` (the `public` folder does not exist yet) — which proves the asset check works. Then `mkdir -p $SCRATCH/no-public/themes/chateau-royal` and `touch` the three named files, re-run, and expect `wrote …smoke-chateau.css` with no `outside` / `undefinedVars` error. Inspect the first lines of the output: `.theme-chateau-royal{--paper:…` and `font: … var(--font-cr-sans), Jost` must be present.

- [ ] **Step 6: Checkpoint**

Run: `(cd landing && npx eslint src/lib/port-theme-css.test.mjs) ; npm test 2>&1 | tail -8`
Expected: no eslint **error** for the test file; `npm test` passes. Do not commit.

---

### Task 9: Theme checks — no leaks, everything wired

**Files:**
- Create: `landing/src/lib/theme-checks.test.mjs`

**Interfaces:**
- Consumes: the folders `landing/src/components/invitation/themes/<id>/` (`editor.ts`, `theme.config.ts`, sections), `Invitation.<camelId>` in `landing/messages/*.json`, `EDITOR_SECTION_IDS` in `shared/data/invitation-sections.ts`, and `readSupports` from `landing/src/lib/theme-supports.mjs`. A theme whose folder does not exist yet is skipped, so this lands before the themes.
- Produces: one file the theme plans extend by adding their entry to `THEMES`.

Three checks per ported theme (the third — hand-written keyframes carry the theme's prefix — is a few lines inside the wiring block):

1. **No leaks.** The demo wedding's proper nouns appear nowhere but `demo-data.ts` — in the folder, or in the theme's catalogue namespace.
2. **Everything wired.** Every declared slot sits on a real editor section, resolves in the French catalogue, and is read by some section (the "field that changes nothing" trap); every `data-editor-section` is a real section id; every module the theme `supports` is drawn by a section carrying its id.

- [ ] **Step 1: Write the test**

Create `landing/src/lib/theme-checks.test.mjs`:

```js
/**
 * Checks every ported theme against the two rules that keep a theme a theme:
 * nothing of its demo wedding survives outside `demo-data.ts`, and nothing the
 * editor offers is left unconnected.
 *
 * A designer hands over a mock-up with the demo couple's names, venue, hotels
 * and menu written into the markup and the stylesheet. Ported as-is, those
 * words appear on every customer's wedding — it has happened (a venue town, a
 * default monogram, the demo couple's photograph). And a slot declared in
 * `editor.ts` that no section reads is a field in the dashboard that changes
 * nothing.
 *
 * Leak words are whole words, case-sensitive. The theme's own name is not a
 * leak: "Maré Alta" is the theme, "Casa Maré Alta" was the demo venue. Add a
 * theme to `THEMES` when its port starts.
 *
 *   node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs \
 *     --test landing/src/lib/theme-checks.test.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import { readSupports } from "./theme-supports.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url)); // …/landing/
const THEMES_DIR = path.join(ROOT, "src/components/invitation/themes");
const LOCALES = ["fr", "en", "de", "es", "pt", "it", "ar", "zh", "ja"];

/** The only file allowed to hold the demo wedding. */
const DEMO_FILE = "demo-data.ts";

const THEMES = {
  "mare-alta": {
    camel: "mareAlta",
    words: [
      "Sienna", "Malo", "Morel", "Casa Maré Alta", "Comporta", "Estrada da Praia",
      "Portugal", "Lisbonne", "Alentejo", "Setúbal", "Humberto Delgado",
      "Villa Pinhal", "Casa Areia", "Cabana do Sal", "Kyoto", "Naoshima", "Yakushima",
      "Vitor Kley", "Mayra Andrade", "Vanessa da Mata",
    ],
  },
  "chateau-royal": {
    camel: "chateauRoyal",
    words: [
      "Éléonore", "Eleonore", "Raphaël", "Raphael", "Vaux-le-Vicomte", "Vaux",
      "Maincy", "Meaux", "Seine-et-Marne", "Île-de-France", "77950",
      "Bresse", "morilles", "langoustine",
    ],
  },
  "cabo-verde": {
    camel: "caboVerde",
    words: [
      "Paula", "Ricardo", "Baía das Gatas", "Baia das Gatas", "São Vicente", "Sao Vicente",
      "Mindelo", "Laginha", "São Pedro", "Cesária", "Cesaria", "Cap-Vert",
      "Daniel Caesar", "Stephen Sanchez", "SÃO VICENTE",
    ],
  },
};

const read = (file) => fs.readFileSync(file, "utf8");

const wordPattern = (word) =>
  new RegExp(
    `(?<![\\p{L}\\p{N}])${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}])`,
    "u",
  );

/** Every text file under a folder, except the demo's own. */
function filesOf(dir) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...filesOf(full));
    else if (entry.name !== DEMO_FILE && /\.(tsx?|css|mjs|json|md)$/.test(entry.name)) found.push(full);
  }
  return found;
}

/** The editor's section ids, read from the one list the editor and themes share. */
const SECTION_IDS = (() => {
  const source = read(path.join(ROOT, "../shared/data/invitation-sections.ts"));
  const block = source.match(/EDITOR_SECTION_IDS = \[([\s\S]*?)\] as const/)?.[1] ?? "";
  return [...block.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
})();

/**
 * The editor-section ids a theme's sources name. The id reaches the DOM either
 * as a literal `data-editor-section="…"` attribute or through a section
 * wrapper's `editorSection="…"` prop (which sets that attribute); a dynamic
 * `{value}` cannot be read statically and is ignored.
 */
function editorSectionsIn(source) {
  return [...source.matchAll(/(?:data-editor-section|editorSection)=["']([a-z-]+)["']/g)].map((match) => match[1]);
}

const frCatalogue = () => JSON.parse(read(path.join(ROOT, "messages/fr.json")));

for (const [id, { camel, words }] of Object.entries(THEMES)) {
  const dir = path.join(THEMES_DIR, id);
  const skip = !fs.existsSync(dir);

  /* -- 1. no leaks ------------------------------------------------------ */

  test(`${id}: no demo word in the theme's code, styles or notes`, { skip }, () => {
    const hits = [];
    for (const file of filesOf(dir)) {
      const text = read(file);
      for (const word of words) {
        if (wordPattern(word).test(text)) hits.push(`${path.relative(THEMES_DIR, file)}: "${word}"`);
      }
    }
    assert.deepEqual(hits, [], `demo content outside ${DEMO_FILE}:\n  ${hits.join("\n  ")}`);
  });

  test(`${id}: no demo word in its message catalogues`, () => {
    const hits = [];
    for (const locale of LOCALES) {
      const catalog = JSON.parse(read(path.join(ROOT, "messages", `${locale}.json`)));
      const namespace = catalog.Invitation?.[camel];
      if (!namespace) continue;
      const text = JSON.stringify(namespace);
      for (const word of words) {
        if (wordPattern(word).test(text)) hits.push(`${locale}: "${word}"`);
      }
    }
    assert.deepEqual(hits, [], `demo content in Invitation.${camel}:\n  ${hits.join("\n  ")}`);
  });

  /* -- 2. everything wired ---------------------------------------------- */

  test(`${id}: hand-written keyframes carry the theme's prefix`, { skip }, () => {
    // The generated sheet is prefixed by the pipeline; `responsive.css` is
    // hand-written and `@keyframes` names are global to the document.
    const file = path.join(dir, "responsive.css");
    if (!fs.existsSync(file)) return;
    const bare = [...read(file).matchAll(/@(?:-webkit-)?keyframes\s+([\w-]+)/g)]
      .map((match) => match[1])
      .filter((name) => !name.startsWith(`${id}-`));
    assert.deepEqual(bare, [], `keyframes in responsive.css must start with "${id}-": ${bare}`);
  });

  test(`${id}: every slot is on a real section, in the catalogue, and read`, { skip: skip || !fs.existsSync(path.join(dir, "editor.ts")) }, async () => {
    const slots = (await import(pathToFileURL(path.join(dir, "editor.ts")).href))[`${camel}EditorSlots`];
    assert.ok(Array.isArray(slots) && slots.length > 0, `${camel}EditorSlots must be a non-empty array`);

    const fr = frCatalogue();
    const source = filesOf(dir)
      .filter((file) => /\.tsx?$/.test(file) && path.basename(file) !== "editor.ts")
      .map(read)
      .join("\n");

    const problems = [];
    const seen = new Set();
    for (const slot of slots) {
      const [section] = slot.key.split(".");
      if (!SECTION_IDS.includes(section)) problems.push(`${slot.key}: "${section}" is not an editor section`);
      if (seen.has(slot.key)) problems.push(`${slot.key}: declared twice`);
      seen.add(slot.key);

      for (const message of slot.messages) {
        const found = message.split(".").reduce((node, part) => node?.[part], fr);
        if (typeof found !== "string") problems.push(`${slot.key}: catalogue key ${message} is missing`);
      }
      if (!source.includes(`"${slot.key}"`)) problems.push(`${slot.key}: no section reads this slot`);
    }
    assert.deepEqual(problems, [], problems.join("\n"));
  });

  test(`${id}: section ids are real, and every supported module is drawn`, { skip: skip || !fs.existsSync(path.join(dir, "theme.config.ts")) }, () => {
    const source = filesOf(dir)
      .filter((file) => /\.tsx?$/.test(file))
      .map(read)
      .join("\n");

    const used = editorSectionsIn(source);
    const unknown = [...new Set(used)].filter((value) => !SECTION_IDS.includes(value));
    assert.deepEqual(unknown, [], `data-editor-section values that are not editor sections: ${unknown}`);

    const supports = readSupports(read(path.join(dir, "theme.config.ts")));
    assert.ok(supports, "supports must be a list of string literals");
    const undrawn = supports.filter((module) => !used.includes(module));
    assert.deepEqual(undrawn, [], `supported but no section carries data-editor-section="…": ${undrawn}`);
  });
}

test("the leak matcher is whole-word and case-sensitive", () => {
  assert.equal(wordPattern("Malo").test("Sienna & Malo"), true);
  assert.equal(wordPattern("Malo").test("Malorca"), false);
  assert.equal(wordPattern("Malo").test("malo"), false);
  assert.equal(wordPattern("Vaux").test("Vaux-le-Vicomte"), true, "a hyphen ends a word");
  assert.equal(wordPattern("Paula").test("flyAcrossPaula"), false, "inside an identifier");
  assert.equal(wordPattern("77950").test("code 77950 Maincy"), true);
});

test("the editor's section ids are read from the shared list", () => {
  for (const expected of ["hero", "countdown", "timeline", "rsvp", "footer"]) {
    assert.ok(SECTION_IDS.includes(expected), expected);
  }
});
```

- [ ] **Step 2: Run it**

Run: `node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs --test landing/src/lib/theme-checks.test.mjs`
Expected: PASS — the folder checks are **skipped** (no theme folder yet), the catalogue checks pass (no namespace yet), the two matcher tests pass.

Prove the checks can fail: create `landing/src/components/invitation/themes/mare-alta/leak.tsx` containing `// Sienna <div data-editor-section="nope" />`, re-run, and expect FAIL on the leak and on `nope`; then delete the file **and** the `mare-alta` folder and re-run (expect PASS). Leave nothing behind.

- [ ] **Step 3: Checkpoint**

Run: `(cd landing && npx eslint src/lib/theme-checks.test.mjs) ; npm test 2>&1 | tail -8 ; ls landing/src/components/invitation/themes/mare-alta 2>&1 | head -1`
Expected: no eslint error; `npm test` passes; `ls` reports "No such file or directory". Do not commit.

---

### Task 10: Phase 0 sign-off

**Files:** none.

- [ ] **Step 1: Full verification**

Run, from the repo root:

```bash
npx tsc --noEmit -p landing/tsconfig.json && echo "tsc ok"
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"
npm run themes:check -w landing
git status --short | grep -E "themes/|scripts/|lib/(theme|port|invitation-data|assemble|to-invitation)|invitation-page-actions|demo/\[themeId\]" 
```

Expected: `tsc ok`; `tests` = 125 + the new ones (≈ 28) with `fail 0`; `themes:check` reports the registry up to date (no theme folder was added); the `git status` lines list **only** the files named in Tasks 1–9 (plus the already-modified tree that existed before this work — do not touch those).

- [ ] **Step 2: Hand-off note**

Write the following to the orchestrator (no file): the theme plans may now assume `monogramOf`, `formatDateRange`, `formatDottedDate`, `weddingSpan`, `useGuestRsvp`, `buildRsvpSubmission`, `useGuestPlaylist`, `Reveal`, `JsFlag`, `ScrollToButton`, `demoDataFor`, `dayOf`, `themes:port-css`, `themes:messages` and the leak test exist with the signatures in this plan, and that `data-theme-root=""` is the convention for a theme's root element.

- [ ] **Step 3: Checkpoint**

Do not commit. Phase 0 is complete when Step 1's expectations hold.
