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

  const randomSuffix = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  const TEST_EMAIL = `demo-${randomSuffix}@studio.com`;
  const TEST_PASSWORD = "password123";

  console.log(`🎲 Generated Random Suffix: ${randomSuffix}`);

  // 1. Create User or Get Existing
  console.log(`Checking user ${TEST_EMAIL}...`);
  let userId: string | undefined;

  // First, try to find if user exists using admin API
  // filtering by email is not directly exposed in simple methods, so we use listUsers
  const { data: listData, error: listError } =
    await supabase.auth.admin.listUsers();

  if (listError) {
    console.error("❌ Failed to list users:", listError.message);
    process.exit(1);
  }

  const existingUser = listData.users.find((u) => u.email === TEST_EMAIL);

  if (existingUser) {
    console.log("✅ User already exists. Using ID:", existingUser.id);
    userId = existingUser.id;
  } else {
    // Create new user
    const { data: userData, error: createError } =
      await supabase.auth.admin.createUser({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        email_confirm: true,
        user_metadata: {
          first_name: `Sophie ${randomSuffix}`,
          last_name: "Martin",
        },
      });

    if (createError) {
      console.error("❌ Failed to create user:", createError.message);
      process.exit(1);
    }
    userId = userData.user.id;
    console.log("✅ User created:", userId);
  }

  if (!userId) {
    console.error("❌ Logic Error: User ID not found.");
    process.exit(1);
  }

  // 2. Insert Profile (Upsert)
  console.log("Creating/Updating Profile...");
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    first_name: `Sophie ${randomSuffix}`,
    last_name: "Martin",
    partner_name: `Marc ${randomSuffix}`,
    wedding_date: "2026-08-24",
  });
  if (profileError) console.error("Profile Error:", profileError);

  // 3. Insert Settings
  console.log("Creating/Updating Settings...");
  const { error: settingsError } = await supabase.from("settings").upsert(
    {
      wedding_id: userId,
      wedding_code: `SOPHIE${randomSuffix}`,
      is_module_rsvp_meal_enabled: true,
      is_module_schedule_enabled: true,
      is_module_gallery_enabled: true,
      is_module_accommodation_enabled: false,
      rsvp_mode: "closed", // Default for seed
      theme_config: { color_scheme: "terracotta" },
    },
    { onConflict: "wedding_id" },
  );
  if (settingsError) console.error("Settings Error:", settingsError);

  // 4. Create Tables (Plan de Table)
  console.log("Creating Tables...");
  let tableId: string | null = null;

  // Clean up existing tables for this wedding to avoid duplicates/confusion in seed
  // (Optional: usually seeding is additive, but here it helps to be clean)
  // await supabase.from('tables').delete().eq('wedding_id', userId);

  const { data: tableData, error: tableError } = await supabase
    .from("tables")
    .upsert(
      [
        {
          wedding_id: userId,
          name: "Table d'Honneur",
          shape: "rectangular",
          capacity: 10,
          x_position: 100,
          y_position: 100,
        },
        {
          wedding_id: userId,
          name: "Les Amis",
          shape: "round",
          capacity: 8,
          x_position: 300,
          y_position: 100,
        },
      ],
      { onConflict: "id" },
    ) // ID won't match on upsert without fixed IDs, so this is effectively an insert unless we provide IDs.
    // To keep it simple and safe for multiple runs, let's just insert one specific named table or find it.
    .select()
    .limit(1);

  // Better approach for Tables idempotent: check existence or just insert
  // For simplicity in this demo script, we just insert.
  // Real seeding often truncates or checks carefully.
  // We'll proceed with the inserted/returned table.

  if (tableError) {
    console.error("Table Error:", tableError);
  } else if (tableData && tableData.length > 0) {
    tableId = tableData[0].id;
    console.log("✅ Table created:", tableId);
  }

  // 5. Household
  console.log("Creating Household...");
  const { data: household, error: hhError } = await supabase
    .from("households")
    .insert({
      wedding_id: userId,
      name: `Famille Dupont ${randomSuffix}`,
      email: `jean.dupont.${randomSuffix}@test.com`,
      status: "pending",
      address: "123 Rue de la Fête, 75000 Paris",
    })
    .select()
    .single();

  if (hhError) {
    console.log("Household note (likely exists):", hhError.message);
    // If we want to attach guests to existing household, we'd need to fetch it.
    // For this script, we accept it might fail if run twice without cleanup.
  } else {
    console.log("✅ Household created:", household.id);

    // 6. Guests
    console.log("Creating Guests...");
    await supabase.from("guests").insert([
      {
        wedding_id: userId,
        household_id: household.id, // Link to household
        table_id: tableId, // Link to table (Seating Plan test)
        first_name: "Jean",
        last_name: "Dupont",
        email: `jean.dupont.${randomSuffix}@test.com`,
        status: "confirmed",
        is_child: false,
        is_plus_one: false,
      },
      {
        wedding_id: userId,
        household_id: household.id,
        first_name: "Marie",
        last_name: "Dupont",
        status: "pending",
        is_child: false,
        dietary_requirements: "Végétarienne",
      },
      {
        wedding_id: userId,
        household_id: household.id,
        first_name: "Léo",
        last_name: "Dupont",
        status: "pending",
        is_child: true, // Test boolean field
        is_plus_one: false,
      },
    ]);
    console.log("✅ Guests created with links!");
  }

  // 7. Billing History
  console.log("Creating Billing History...");
  const billingRecords = [
    {
      user_id: userId,
      amount: 29900, // 299.00€
      currency: "EUR",
      status: "succeeded",
      plan_name: "premium",
      created_at: new Date(
        new Date().setMonth(new Date().getMonth() - 2),
      ).toISOString(), // 2 months ago
    },
    {
      user_id: userId,
      amount: 4900, // 49.00€
      currency: "EUR",
      status: "succeeded",
      plan_name: "module-rsvp",
      created_at: new Date(
        new Date().setMonth(new Date().getMonth() - 1),
      ).toISOString(), // 1 month ago
    },
    {
      user_id: userId,
      amount: 19900, // 199.00€
      currency: "EUR",
      status: "pending",
      plan_name: "standard",
      created_at: new Date().toISOString(), // Today
    },
    {
      user_id: userId,
      amount: 9900, // 99.00€
      currency: "EUR",
      status: "failed",
      plan_name: "gold",
      created_at: new Date(
        new Date().setFullYear(new Date().getFullYear() - 1),
      ).toISOString(), // 1 year ago
    },
  ];

  const { error: billingError } = await supabase
    .from("billing")
    .insert(billingRecords);

  if (billingError) {
    console.error("❌ Failed to create billing history:", billingError.message);
  } else {
    console.log("✅ Billing history created!");
  }

  console.log("🏁 Seeding Completed!");
  console.log(`👉 Login with: ${TEST_EMAIL} / ${TEST_PASSWORD}`);
}

seed();
