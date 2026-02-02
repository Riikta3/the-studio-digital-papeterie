"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";

interface CreateWeddingData {
  email: string;
  firstName: string;
  lastName: string;
  partnerName: string; // Partner's first name
  weddingDate?: string;
  themeId: string;
  modules: string[];
}

export async function createWedding(data: CreateWeddingData) {
  console.log("💍 Starting Wedding Provisioning...", data);

  // 1. Create Auth User (or get existing if we allow login flows later)
  // For V1 wizard, we assume new user. We generate a random password or send magic link.
  // Strategy: Create user with email and a temporary password (or auto-confirm).
  // Ideally: Send Magic Link. But for "Instant Access" demo:
  // We'll create the user and return the session? No, we can't easily return session from Admin.

  // SIMPLIFICATION FOR V1:
  // We strictly follow the "Bypass Payment" flow logic for now as requested by user.
  // We assume the user is ALREADY authenticated? No, this is a public landing.

  // FLOW:
  // 1. Admin creates user -> returns ID.
  // 2. We allow the user to login immediately?
  // BETTER: We create the user with a known temporary password (managed by app) or we just create the data
  // and tell user "Check your emails".

  // Let's go with: Create User -> Auto-confirm -> Insert Data.

  const tempPassword = "Password123!"; // TODO: Generate secure random password

  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: data.firstName,
        last_name: data.lastName,
      },
    });

  if (authError) {
    console.error("Auth Creation Error:", authError);
    // If user already exists, we should decide strategy. For now, throw.
    return { success: false, error: authError.message };
  }

  const userId = authData.user.id;
  const partner1Params = data.firstName; // Main user
  const partner2Params = data.partnerName;

  // 2. Create Profile (The "Wedding")
  const { error: profileError } = await supabaseAdmin.from("profiles").insert({
    id: userId,
    partner_1_name: partner1Params,
    partner_2_name: partner2Params,
    wedding_date: data.weddingDate || null,
    theme_config: { themeId: data.themeId }, // Minimal config
  });

  if (profileError) {
    console.error("Profile Creation Error:", profileError);
    // Cleanup user?
    return { success: false, error: "Failed to create wedding profile." };
  }

  // 3. Create Settings (Modules)
  const { error: settingsError } = await supabaseAdmin.from("settings").insert({
    wedding_id: userId,
    is_module_rsvp_enabled: data.modules.includes("rsvp"),
    is_module_gallery_enabled: data.modules.includes("gallery"),
    is_module_schedule_enabled: data.modules.includes("program"),
    is_module_accommodation_enabled: data.modules.includes("travel"),
    // ... map others
    wedding_code: generateWeddingCode(data.firstName, data.partnerName),
  });

  if (settingsError) {
    console.error("Settings Creation Error:", settingsError);
    return { success: false, error: "Failed to apply settings." };
  }

  // 4. Create Defaults (Households? No, empty for now)

  console.log("✅ Wedding Provisioned Successfully!");

  // Return success (Client will handle redirection to dashboard login)
  return { success: true, userId, email: data.email, tempPassword };
}

function generateWeddingCode(n1: string, n2: string): string {
  // Simple generator: CLARA&MARC2026
  const clean = (s: string) =>
    s
      .replace(/[^a-zA-Z]/g, "")
      .toUpperCase()
      .substring(0, 4);
  const year = new Date().getFullYear();
  return `${clean(n1)}&${clean(n2)}${year}`;
}
