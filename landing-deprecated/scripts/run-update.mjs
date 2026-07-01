import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from the root .env.local
config({ path: path.resolve(__dirname, "../../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function updateTestUser() {
  console.log("Updating existing test user...");

  const WEDDING_CODE = "SOPH&THOM2026TEST4";

  const { data: settingsData, error: settingsError } = await supabaseAdmin
    .from("settings")
    .select("wedding_id")
    .eq("wedding_code", WEDDING_CODE)
    .single();

  if (settingsError || !settingsData) {
    console.error(
      `Error finding user with code ${WEDDING_CODE}:`,
      settingsError,
    );
    return;
  }

  const userId = settingsData.wedding_id;
  console.log("✅ Found user ID:", userId);

  const NEW_MODULE_ORDER = [
    "countdown",
    "intro-video",
    "timeline",
    "dress-code",
    "menu",
    "map",
    "transport",
    "accommodation",
    "gallery",
    "photo-share",
    "playlist",
    "gift-list",
    "faq",
    "guestbook",
    "video-guestbook",
    "rsvp",
  ];

  const { error: updateError } = await supabaseAdmin
    .from("sites")
    .update({ modules: NEW_MODULE_ORDER })
    .eq("wedding_id", userId);

  if (updateError) {
    console.error("Error updating modules:", updateError);
    return;
  }

  console.log("✅ Modules array successfully updated to the new order.");
  console.log(`http://localhost:3002/invitation/${WEDDING_CODE}`);
}

updateTestUser();
