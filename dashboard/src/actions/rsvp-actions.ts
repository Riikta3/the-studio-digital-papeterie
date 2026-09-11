"use server";

import { createHash } from "crypto";
import { headers } from "next/headers";

import { createClient } from "@/utils/supabase/server";

/**
 * The guest-facing RSVP area — the one public, unauthenticated surface the
 * dashboard serves (the code screen, the household search, the answer form).
 *
 * Every function here used to build a SUPABASE_SERVICE_ROLE_KEY client inline
 * and take `wedding_id` from the browser. The service role bypasses RLS, so
 * the owner-only policies on `households` and `guests` never applied: anyone
 * could read every household of any wedding — `select("*, guests(*)")` returned
 * email, phone, address, message_to_couple and magic_link_token — and write
 * into any wedding they named.
 *
 * They now go through the security-definer RPCs added in
 * `20260911100000_rsvp_public_rpcs.sql`, called with the anon key. The column
 * whitelist, the row caps and the ownership checks live in the database, which
 * is the only place that holds for a caller who skips this file and talks to
 * PostgREST directly with the anon key — it is public.
 */

/**
 * An opaque per-caller bucket for the database-side rate limit.
 *
 * Postgres cannot see the client's IP, so the value is derived here and hashed
 * before it is sent: the database stores a digest, never an address. This is
 * not a security boundary on its own — an attacker rotates IPs — which is why
 * the RPCs also cap columns and rows. Its job is to stop the cheap enumeration
 * run, and to keep one abuser from locking out every real guest of a wedding,
 * which the per-wedding window of `check_guest_search_rate` does not.
 */
async function callerBucket(): Promise<string> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";

  return createHash("sha256").update(ip).digest("hex");
}

export interface RsvpGuest {
  id: string;
  first_name: string;
  last_name: string;
  status: string;
  dietary_requirements: string | null;
}

export interface RsvpHousehold {
  id: string;
  name: string;
  status: string;
  guests: RsvpGuest[];
}

/** Validate the wedding code to enter the RSVP area. */
export async function validateWeddingCode(code: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("resolve_wedding_code", {
    p_code: code,
    p_bucket: await callerBucket(),
  });

  const row = Array.isArray(data) ? data[0] : data;

  // An unknown code and a rate-limited caller both come back empty, on
  // purpose: the message must not tell an enumerator which of the two it hit.
  if (error || !row) {
    return { success: false, message: "Code invalide" };
  }

  return {
    success: true,
    weddingId: row.wedding_id as string,
    coupleNames: (row.couple_names as string) || "",
  };
}

/** STRICT MODE: search for a household by name. */
export async function searchHousehold(weddingId: string, query: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("search_rsvp_household", {
    p_wedding_id: weddingId,
    p_query: query,
    p_bucket: await callerBucket(),
  });

  if (error) {
    console.error("[RSVP_SEARCH]", error);
    return { success: false, error: "Erreur lors de la recherche." };
  }

  const households = (data ?? []) as RsvpHousehold[];

  return { success: true, households };
}

/** STRICT MODE: update the RSVP for an existing household and its guests. */
export async function updateHouseholdRsvp(
  weddingId: string,
  householdId: string,
  formData: FormData,
) {
  const supabase = await createClient();

  // Same form contract as before: `guest_${id}_status` / `guest_${id}_dietary`.
  // Collected here and handed to the RPC as one array, so the whole answer is
  // written in a single transaction instead of a fan-out of updates whose
  // failures were previously discarded by `Promise.all`.
  const guests: Array<{
    id: string;
    status: string;
    dietary_requirements: string;
  }> = [];

  for (const [key, value] of Array.from(formData.entries())) {
    if (key.startsWith("guest_") && key.endsWith("_status")) {
      const guestId = key.replace("guest_", "").replace("_status", "");
      guests.push({
        id: guestId,
        status: String(value),
        dietary_requirements: String(
          formData.get(`guest_${guestId}_dietary`) ?? "",
        ),
      });
    }
  }

  const { data, error } = await supabase.rpc("submit_rsvp_household", {
    p_wedding_id: weddingId,
    p_household_id: householdId,
    p_email: String(formData.get("email") ?? ""),
    p_song: String(formData.get("song") ?? ""),
    p_transport: String(formData.get("transport") ?? ""),
    p_message: String(formData.get("message") ?? ""),
    p_guests: guests,
    p_bucket: await callerBucket(),
  });

  if (error) {
    console.error("[RSVP_SUBMIT]", error);
    return { success: false, error: "Erreur lors de la mise à jour du foyer." };
  }

  // `false` means the household does not belong to this wedding, or the rate
  // limit is full. Both are reported the same way, for the same reason as above.
  if (data !== true) {
    return { success: false, error: "Erreur lors de la mise à jour du foyer." };
  }

  return { success: true };
}

/** OPEN MODE: register a new household and its guests. */
export async function registerNewHousehold(
  weddingId: string,
  formData: FormData,
) {
  const supabase = await createClient();

  // The old parser looped 0..20 over `guest_${i}_*`; the form still posts that
  // shape, so the loop stays and only the destination changes.
  const guests: Array<{
    first_name: string;
    last_name: string;
    status: string;
    dietary_requirements: string;
  }> = [];

  for (let i = 0; i < 20; i++) {
    const firstName = formData.get(`guest_${i}_firstname`);
    if (!firstName) continue;

    guests.push({
      first_name: String(firstName),
      last_name: String(formData.get(`guest_${i}_lastname`) ?? ""),
      status: String(formData.get(`guest_${i}_status`) ?? "confirmed"),
      dietary_requirements: String(formData.get(`guest_${i}_dietary`) ?? ""),
    });
  }

  const { data, error } = await supabase.rpc("register_rsvp_household", {
    p_wedding_id: weddingId,
    p_name: String(formData.get("name") ?? ""),
    p_email: String(formData.get("email") ?? ""),
    p_song: String(formData.get("song") ?? ""),
    p_transport: String(formData.get("transport") ?? ""),
    p_message: String(formData.get("message") ?? ""),
    p_guests: guests,
    p_bucket: await callerBucket(),
  });

  if (error) {
    console.error("[RSVP_REGISTER]", error);
    return { success: false, error: "Erreur lors de la création." };
  }

  // `null` means the wedding is not in open mode, the name was too short, or
  // the hourly cap is reached. Open mode is the likely one, so the message
  // says so rather than blaming the couple's data.
  if (!data) {
    return {
      success: false,
      error: "Les inscriptions ne sont pas ouvertes pour ce mariage.",
    };
  }

  return { success: true };
}
