const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// 1. Manually parse .env.local to avoid 'dotenv' dependency
function loadEnv() {
  try {
    const envPath = path.resolve(__dirname, "../../.env.local");
    const envFile = fs.readFileSync(envPath, "utf8");
    const envVars = {};
    envFile.split("\n").forEach((line) => {
      const parts = line.split("=");
      if (parts.length >= 2 && !line.startsWith("#")) {
        const key = parts[0].trim();
        const val = parts
          .slice(1)
          .join("=")
          .trim()
          .replace(/^["']|["']$/g, ""); // Remove quotes
        envVars[key] = val;
      }
    });
    return envVars;
  } catch (e) {
    console.error("Could not read .env.local:", e.message);
    return {};
  }
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "❌ Missing params. URL:",
    SUPABASE_URL,
    "Key present:",
    !!SERVICE_ROLE_KEY,
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seed() {
  console.log("🌱 Starting Seeding (JS Mode)...");

  const TEST_EMAIL = "demo@studio.com";
  const TEST_PASSWORD = "password123";

  // 1. Create User
  console.log(`Creating user ${TEST_EMAIL}...`);
  let userId;

  const { data: userData, error: userError } =
    await supabase.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { first_name: "Sophie", last_name: "Martin" },
    });

  if (userError) {
    console.log("User note:", userError.message);
    // If user exists, try to find ID by efficient query? No easy way without listUsers.
    // Try to sign in to get ID?
    // Or just fetch profile if exists.
    if (userError.message.includes("already registered")) {
      console.log("⚠️ User exists. Attempting to list users to find ID...");
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
}

seed();
