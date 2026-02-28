const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function main() {
  const { data, error } = await supabaseAdmin
    .from("settings")
    .select("wedding_id")
    .eq("wedding_code", "SOPH&THOM2026TEST3")
    .single();

  if (error || !data) {
    console.error("User not found:", error);
    return;
  }

  await supabaseAdmin
    .from("sites")
    .update({
      modules: [
        "timeline",
        "rsvp",
        "gallery",
        "map",
        "gift-list",
        "guestbook",
        "accommodation",
        "transport",
        "menu",
        "video-guestbook",
      ],
    })
    .eq("wedding_id", data.wedding_id);

  console.log("✅ Updated test user modules");
}

main();
