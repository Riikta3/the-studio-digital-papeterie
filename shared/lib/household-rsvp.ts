/**
 * Matching an RSVP answer to a household of the couple's guest list.
 *
 * The invitation does it in the database (`20261010120000_invitation_household_rsvp.sql`);
 * the dashboard does it here, when the couple attaches by hand an answer whose
 * name the invitation did not recognise. Both must agree, so the rules below
 * mirror the SQL ones: `rsvpNameKey` ↔ `rsvp_name_key`,
 * `householdStatusFromGuests` ↔ `household_status_from_guests`.
 */

export type GuestStatus = "confirmed" | "declined" | "pending";
export type HouseholdStatus = GuestStatus | "partial";

const ACCENTS_FROM = "àáâãäåæçèéêëìíîïñòóôõöøœùúûüýÿ";
const ACCENTS_TO = "aaaaaaaceeeeiiiinooooooouuuuyy";

/** Lowercase, common accents stripped, hyphens/apostrophes/dots as spaces. */
export function rsvpNameKey(value: string | null | undefined): string {
  let out = "";
  for (const char of (value ?? "").toLowerCase()) {
    const index = ACCENTS_FROM.indexOf(char);
    out += index >= 0 ? ACCENTS_TO[index] : char;
  }
  return out.replace(/[\s'’.-]+/g, " ").trim();
}

type NamedGuest = { first_name: string | null; last_name: string | null };

/** Whether `fullName` is this guest's whole name, in either order. */
export function isSamePerson(fullName: string, guest: NamedGuest): boolean {
  const key = rsvpNameKey(fullName);
  if (!key.includes(" ")) return false;
  return (
    key === rsvpNameKey(`${guest.first_name ?? ""} ${guest.last_name ?? ""}`) ||
    key === rsvpNameKey(`${guest.last_name ?? ""} ${guest.first_name ?? ""}`)
  );
}

/**
 * All confirmed → confirmed; all declined → declined; some confirmed → partial;
 * nobody confirmed and someone undecided → pending. Null for an empty household.
 */
export function householdStatusFromGuests(
  statuses: readonly (string | null | undefined)[],
): HouseholdStatus | null {
  if (statuses.length === 0) return null;
  const confirmed = statuses.filter((status) => status === "confirmed").length;
  const declined = statuses.filter((status) => status === "declined").length;
  if (confirmed === statuses.length) return "confirmed";
  if (declined === statuses.length) return "declined";
  if (confirmed > 0) return "partial";
  return "pending";
}

export type RankableHousehold = { id: string; name: string; guests: NamedGuest[] };

/**
 * The couple's households, the likeliest for this answer first.
 *
 * A whole name of the respondent (3) or of a companion (2) beats a shared
 * surname (1). Households scoring nothing keep alphabetical order after the
 * others, so the couple can still pick any of them.
 */
export function rankHouseholds<T extends RankableHousehold>(
  households: readonly T[],
  answer: { respondent: string; companions: string[] },
): { household: T; score: number }[] {
  const lastNames = [answer.respondent, ...answer.companions]
    .map((name) => rsvpNameKey(name).split(" ").slice(1).join(" "))
    .filter(Boolean);

  return households
    .map((household) => {
      let score = 0;
      for (const guest of household.guests) {
        if (isSamePerson(answer.respondent, guest)) score = Math.max(score, 3);
        else if (answer.companions.some((name) => isSamePerson(name, guest))) score = Math.max(score, 2);
        else if (lastNames.includes(rsvpNameKey(guest.last_name))) score = Math.max(score, 1);
      }
      return { household, score };
    })
    .sort((a, b) => b.score - a.score || a.household.name.localeCompare(b.household.name, "fr"));
}
