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
