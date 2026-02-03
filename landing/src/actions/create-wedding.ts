"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";

interface CreateWeddingData {
  email: string;
  firstName: string;
  lastName: string;
  partnerName: string;
  weddingDate?: string;
  themeId: string;
  modules: string[];
}

export async function createWedding(data: CreateWeddingData) {
  console.log("💍 Starting Wedding Provisioning (Invite Flow)...", data);

  const redirectTo = `${process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3003"}/auth/confirm?next=/update-password`;
  console.log("➡️ Redirecting to:", redirectTo);

  let inviteLink = null;
  let emailSent = false;

  // FORCE GENERATE LINK (To avoid "OTP Expired" from Email Scanners)
  // We skip sending the email via Supabase and just show the link in the UI.
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.generateLink({
      type: "invite",
      email: data.email,
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
        },
        redirectTo,
      },
    });

  if (authError) {
    console.error("Auth Invite Error:", authError);
    return { success: false, error: authError.message };
  }

  const userId = authData.user.id;
  const inviteLink = authData.properties.action_link;
  const emailSent = false;
  const inviteData = null; // Unused in this path

  // userId is already set above

  if (!userId)
    return { success: false, error: "User creation failed (No ID found)" };

  // 2. Create Profile
  const { error: profileError } = await supabaseAdmin.from("profiles").insert({
    id: userId,
    first_name: data.firstName,
    last_name: data.lastName,
    partner_name: data.partnerName,
    wedding_date: data.weddingDate || null,
  });

  if (profileError) {
    console.error("Profile Creation Error:", profileError);
    // Optional: Delete user if profile creation fails
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return { success: false, error: "Failed to create wedding profile." };
  }

  // 3. Create Settings
  const { error: settingsError } = await supabaseAdmin.from("settings").insert({
    wedding_id: userId,
    is_module_rsvp_meal_enabled: data.modules.includes("rsvp"),
    is_module_gallery_enabled: data.modules.includes("gallery"),
    is_module_schedule_enabled: data.modules.includes("program"),
    is_module_accommodation_enabled: data.modules.includes("travel"),
    theme_config: { themeId: data.themeId },
    wedding_code: generateWeddingCode(data.firstName, data.partnerName),
  });

  if (settingsError) {
    console.error("Settings Creation Error:", settingsError);
    return { success: false, error: "Failed to apply settings." };
  }

  console.log("✅ Wedding Provisioned! Invite Link:", inviteLink);

  // Return success + The Magic Link (Frontend can display it or simulate "Email Sent")
  return { success: true, userId, email: data.email, inviteLink };
}

function generateWeddingCode(n1: string, n2: string): string {
  const clean = (s: string) =>
    s
      .replace(/[^a-zA-Z]/g, "")
      .toUpperCase()
      .substring(0, 4);
  const year = new Date().getFullYear();
  return `${clean(n1)}&${clean(n2)}${year}`;
}
