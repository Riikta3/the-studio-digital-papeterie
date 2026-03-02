import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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

  // Update the user we successfully created a few minutes ago
  const WEDDING_CODE = "SOPH&THOM2026TEST4";

  // 1. Find the wedding_id for this code
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

  // 2. Update the Site configuration modules array
  const NEW_MODULE_ORDER = [
    "countdown", // Le compte à rebours
    "intro-video", // Video des mariés
    "timeline", // Programme du Jour
    "dress-code", // Code vestimentaire
    "menu", // Menu de la réception
    "map", // Lieu / Accès
    "transport", // Navettes & Transport
    "accommodation", // Hébergements
    "gallery", // Galerie Photo
    "playlist", // Musique collaborative
    "gift-list", // Cagnotte / Cadeaux
    "faq", // Infos Pratiques - Assistés
    "guestbook", // Livre d'Or
    "video-guestbook", // Livre d'Or Vidéo
    "rsvp", // Confirmation de présence
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

  console.log("\n==============================================");
  console.log("🚀 TEST USER UPDATED");
  console.log("Invitation Link:");
  console.log(`http://localhost:3002/invitation/${WEDDING_CODE}`);
  console.log(`http://localhost:3002/fr/invitation/${WEDDING_CODE}`);
  console.log("==============================================\n");
}

updateTestUser();
