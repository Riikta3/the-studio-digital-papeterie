import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Load .env.local from dashboard directory
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "❌ Missing .env.local variables (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seed() {
  console.log("🌱 Starting Seeding Process...");

  const TEST_EMAIL = "demo@studio.com";
  const TEST_PASSWORD = "password123";

  // 1. Create User
  console.log(`Creating user ${TEST_EMAIL}...`);
  // Try to list users to see if exists? Or just create and catch error
  // admin.createUser will return error if email exists.
  let userId;

  const { data: userData, error: userError } =
    await supabase.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { first_name: "Sophie", last_name: "Martin" },
    });

  if (userError) {
    console.log("User creation note:", userError.message);
    // If user exists, we might want to find their ID.
    if (userError.message.includes("already registered")) {
      // Ideally we would fetch the user ID here, but listUsers requires permissions.
      // For now, let's ask user to try another email or delete user manually if stuck.
      console.log(
        "⚠️ User already exists. Proceeding with data creation might fail if ID is unknown.",
      );
      // We can't easily get the ID of an existing user without listing all users (which is fine with service role)
      const { data: users } = await supabase.auth.admin.listUsers();
      const existing = users.users.find((u) => u.email === TEST_EMAIL);
      if (existing) userId = existing.id;
    }
  } else {
    userId = userData.user.id;
    console.log("✅ User created:", userId);
  }

  if (!userId) {
    console.error("❌ Could not determine User ID. Aborting.");
    return;
  }

  // 2. Insert Profile
  console.log("Creating Profile...");
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    first_name: "Sophie",
    last_name: "Martin",
    partner_name: "Marc",
    wedding_date: "2026-08-24",
  });
  if (profileError) console.error("Profile Error:", profileError);

  // 3. Insert Settings
  console.log("Creating Settings...");
  const { error: settingsError } = await supabase.from("settings").upsert(
    {
      wedding_id: userId,
      wedding_code: "SOPHIE2026",
      is_module_rsvp_meal_enabled: true,
      is_module_schedule_enabled: true,
    },
    { onConflict: "wedding_id" },
  );
  if (settingsError) console.error("Settings Error:", settingsError);

  // 4. Household
  console.log("Creating Household...");
  const { data: household, error: hhError } = await supabase
    .from("households")
    .insert({
      wedding_id: userId,
      name: "Famille Dupont",
      email: "jean.dupont@test.com",
      status: "pending",
    })
    .select()
    .single();

  if (hhError) {
    console.error("Household Error:", hhError);
  } else {
    console.log("✅ Household created:", household.id);

    // 5. Guest
    console.log("Creating Guests...");
    await supabase.from("guests").insert([
      {
        wedding_id: userId,
        household_id: household.id,
        first_name: "Jean",
        last_name: "Dupont",
        email: "jean.dupont@test.com",
        status: "pending",
      },
      {
        wedding_id: userId,
        household_id: household.id,
        first_name: "Marie",
        last_name: "Dupont",
        status: "pending",
      },
    ]);
  }

  console.log("🏁 Seeding Completed!");
  console.log(`👉 Login with: ${TEST_EMAIL} / ${TEST_PASSWORD}`);
}

seed();
