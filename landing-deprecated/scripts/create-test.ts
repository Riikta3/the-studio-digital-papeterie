import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestInvitation() {
  try {
    const email = `testuser_${Date.now()}@example.com`;
    const password = "Password123!";

    // Create a new user using the admin API
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: "Test",
          last_name: "User",
        },
      });

    if (authError || !authData.user) {
      console.error("Error creating user:", authError);
      process.exit(1);
    }
    const targetUserId = authData.user.id;
    console.log(`Created new test user: ${email} with ID: ${targetUserId}`);

    // Create profile
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: targetUserId,
      first_name: "Test",
      last_name: "User",
    });

    if (profileError) {
      console.log(
        "Error creating profile (might exist already from trigger, ignoring):",
        profileError,
      );
    }

    const weddingDate = new Date();
    weddingDate.setFullYear(weddingDate.getFullYear() + 1);

    console.log(`Using user ID: ${targetUserId}`);

    // Create wedding
    const { data: wedding, error: weddingError } = await supabase
      .from("weddings")
      .insert({
        user_id: targetUserId,
        partner_name: "Test Partner",
        wedding_date: weddingDate.toISOString().split("T")[0],
      })
      .select("id")
      .single();

    if (weddingError) {
      console.error("Error creating wedding:", weddingError);
      return;
    }
    const weddingId = wedding.id;
    console.log(`Wedding created with ID: ${weddingId}`);

    const allModules = [
      "rsvp",
      "gallery",
      "timeline",
      "transport",
      "map",
      "playlist",
      "gift-list",
      "intro-video",
      "guestbook",
      "menu",
      "dress-code",
    ];

    // Create site
    const { error: siteError } = await supabase
      .from("sites")
      .insert({
        wedding_id: weddingId,
        plan_id: "essential",
        theme_id: "theme-1",
        modules: allModules,
        languages: ["fr"],
        slug: `test-invitation-${Date.now()}`, // if slug exists in your schema? We will just make sure settings is inserted.
      })
      .select("slug, id");
    // In the seed script, site does not have a "slug" inserted directly if it's not required, but usually we need a way to access it. Let's check if there is an error.

    if (siteError) {
      console.log(
        "site error, maybe slug is not a column? Trying without slug...",
      );
      await supabase.from("sites").insert({
        wedding_id: weddingId,
        plan_id: "essential",
        theme_id: "theme-1",
        modules: allModules,
        languages: ["fr"],
      });
    }

    // Create settings
    const weddingCode = `TEST${Math.floor(Math.random() * 10000)}`;
    const { error: settingsError } = await supabase.from("settings").insert({
      wedding_id: weddingId,
      wedding_code: weddingCode,
      is_module_rsvp_meal_enabled: true,
      is_module_schedule_enabled: true,
      is_module_gallery_enabled: true,
      is_module_accommodation_enabled: true,
    });

    if (settingsError) {
      console.error("Error creating settings:", settingsError);
    }

    console.log(`\n✅ Test invitation successfully created!`);
    console.log(`Wedding ID: ${weddingId}`);
    console.log(`Code: ${weddingCode}`);
    console.log(`Modules activated: ${allModules.join(", ")}`);
    console.log(
      `URL to access should be something like: http://localhost:3002/[locale]/[slug] or similar based on your routing.`,
    );
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

createTestInvitation();
