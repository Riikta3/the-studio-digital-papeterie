"use server";

// Validate the wedding code to enter the RSVP area
export async function validateWeddingCode(code: string) {
  // Use Admin Client to bypass RLS "Users can view own settings" which blocks public users
  const adminClient = await import("@supabase/supabase-js").then(
    ({ createClient }) =>
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      ),
  );

  const { data, error } = await adminClient
    .from("settings")
    .select(
      "wedding_id, wedding_code, profile:profiles(first_name, partner_name)",
    )
    .eq("wedding_code", code)
    .single();

  if (error || !data) {
    return { success: false, message: "Code invalide" };
  }

  return {
    success: true,
    weddingId: data.wedding_id,
    coupleNames: `${data.profile.first_name} & ${data.profile.partner_name}`,
  };
}

// STRICT MODE: Search for a household by name
export async function searchHousehold(weddingId: string, query: string) {
  const adminClient = await import("@supabase/supabase-js").then(
    ({ createClient }) =>
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      ),
  );

  const { data, error } = await adminClient
    .from("households")
    .select("*, guests(*)")
    .eq("wedding_id", weddingId)
    .ilike("name", `%${query}%`)
    .limit(5); // Limit results for safety

  if (error) {
    console.error(error);
    return { success: false, error: "Erreur lors de la recherche." };
  }

  return { success: true, households: data };
}

// STRICT MODE: Update RSVP for an existing household and its guests
export async function updateHouseholdRsvp(
  weddingId: string,
  householdId: string,
  formData: FormData,
) {
  const adminClient = await import("@supabase/supabase-js").then(
    ({ createClient }) =>
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      ),
  );

  // 1. Update Household Details
  const song = formData.get("song") as string;
  const transport = formData.get("transport") as string;
  const message = formData.get("message") as string;
  const email = formData.get("email") as string;

  const { error: hhError } = await adminClient
    .from("households")
    .update({
      email: email || undefined, // Only update if provided
      song_request: song,
      transportation: transport,
      message_to_couple: message,
      status: "confirmed", // Mark household as responded (partial or full)
    })
    .eq("id", householdId)
    .eq("wedding_id", weddingId); // Security check

  if (hhError) {
    console.error(hhError);
    return { success: false, error: "Erreur lors de la mise à jour du foyer." };
  }

  // 2. Update Guests
  // We expect keys like `guest_${id}_status` and `guest_${id}_dietary`
  const guestUpdatePromises = [];

  // Iterate over form entries to find guest fields
  for (const [key, value] of Array.from(formData.entries())) {
    if (key.startsWith("guest_") && key.endsWith("_status")) {
      const guestId = key.replace("guest_", "").replace("_status", "");
      const status = value as string;
      const dietary = formData.get(`guest_${guestId}_dietary`) as string;

      guestUpdatePromises.push(
        adminClient
          .from("guests")
          .update({
            status: status,
            dietary_requirements: dietary,
          })
          .eq("id", guestId)
          .eq("household_id", householdId),
      );
    }
  }

  await Promise.all(guestUpdatePromises);

  return { success: true };
}
