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

  const profileData = Array.isArray(data.profile)
    ? data.profile[0]
    : data.profile;

  return {
    success: true,
    weddingId: data.wedding_id,
    coupleNames: `${profileData.first_name} & ${profileData.partner_name}`,
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

// OPEN MODE: Register a new household and guests
export async function registerNewHousehold(
  weddingId: string,
  formData: FormData,
) {
  const adminClient = await import("@supabase/supabase-js").then(
    ({ createClient }) =>
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      ),
  );

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const song = formData.get("song") as string;
  const transport = formData.get("transport") as string;
  const message = formData.get("message") as string;

  // 1. Create Household
  const { data: householdData, error: hhError } = await adminClient
    .from("households")
    .insert({
      wedding_id: weddingId,
      name,
      email: email || null,
      song_request: song,
      transportation: transport,
      message_to_couple: message,
      status: "pending", // Waiting for validation
      source: "public",
    })
    .select()
    .single();

  if (hhError) {
    console.error(hhError);
    return { success: false, error: "Erreur lors de la création." };
  }

  // 2. Parse and Insert Guests
  // We expect inputs like:
  // guests[0][first_name], guests[0][last_name], guests[0][dietary]
  // OR simpler: guest_0_firstname, guest_0_lastname, guest_0_status
  const guestsToInsert = [];

  // Naive parsing: loop 0 to 20 to find guests
  for (let i = 0; i < 20; i++) {
    const firstName = formData.get(`guest_${i}_firstname`) as string;
    const lastName = formData.get(`guest_${i}_lastname`) as string;
    const status = formData.get(`guest_${i}_status`) as string;
    const dietary = formData.get(`guest_${i}_dietary`) as string;

    if (firstName) {
      guestsToInsert.push({
        wedding_id: weddingId,
        household_id: householdData.id,
        first_name: firstName,
        last_name: lastName || ".",
        status: status || "confirmed", // If they register, they usually come
        dietary_requirements: dietary,
      });
    }
  }

  if (guestsToInsert.length > 0) {
    const { error: gError } = await adminClient
      .from("guests")
      .insert(guestsToInsert);

    if (gError) {
      console.error(gError);
      // We don't rollback for now, but in prod we should
    }
  }

  return { success: true };
}
