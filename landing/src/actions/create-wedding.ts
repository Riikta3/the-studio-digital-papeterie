"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";

interface CreateWeddingData {
  email: string;
  password?: string; // Optional for backward compatibility, but required for new flow
  firstName: string;
  lastName: string;
  partnerName: string;
  weddingDate?: string;
  themeId: string;
  modules: string[];
  extras: string[];
  languages: string[];
  plan: string;
}

export async function createWedding(data: CreateWeddingData) {
  console.log("💍 Starting Wedding Provisioning (Password Flow)...", {
    ...data,
    password: "***",
  });

  if (!data.password) {
    return {
      success: false,
      error: "Mot de passe requis pour la création du compte.",
    };
  }

  // FORCE CREATE USER WITH PASSWORD
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true, // Auto-confirm email so they can login immediately
      user_metadata: {
        first_name: data.firstName,
        last_name: data.lastName,
      },
    });

  if (authError) {
    console.error("Auth Create Error:", authError);
    // Custom friendly French errors
    if (
      authError.code === "email_exists" ||
      authError.message.includes("already been registered")
    ) {
      return {
        success: false,
        error:
          "Un compte existe déjà avec cette adresse email. Veuillez vous connecter ou utiliser un autre email.",
      };
    }
    if (authError.message.includes("Password should be at least")) {
      return {
        success: false,
        error: "Le mot de passe doit contenir au moins 6 caractères.",
      };
    }
    return { success: false, error: authError.message };
  }

  const userId = authData.user.id;

  if (!userId)
    return {
      success: false,
      error: "La création de l'utilisateur a échoué (ID introuvable)",
    };

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

  // 4. Create Site Record (Static Template Approach)
  const { error: siteError } = await supabaseAdmin.from("sites").insert({
    wedding_id: userId,
    plan_id: data.plan,
    theme_id: data.themeId,
    modules: data.modules,
    languages: data.languages,
    extras: data.extras,
    status: "draft",
  });

  if (siteError) {
    console.error("Site Creation Error:", siteError);
    // Non-fatal, can be created later or retried
  }

  // 5. Record Purchases (Wallet)
  // We record everything they selected as "purchased" or "active" in their account
  const purchaseItems: {
    wedding_id: string;
    item_type: string;
    item_id: string;
  }[] = [];

  // Plan
  // purchaseItems.push({ wedding_id: userId, item_type: 'plan', item_id: 'essential' }); // Logic needed for plan ID

  // Modules
  data.modules.forEach((m) => {
    purchaseItems.push({
      wedding_id: userId,
      item_type: "module",
      item_id: m,
    });
  });

  if (purchaseItems.length > 0) {
    const { error: purchasesError } = await supabaseAdmin
      .from("purchases")
      .insert(purchaseItems);
    if (purchasesError) {
      console.error("Purchases Recording Error:", purchasesError);
    }
  }

  console.log("✅ Wedding Provisioned! UserId:", userId);

  // Return success (Frontend will redirect to dashboard login)
  return { success: true, userId, email: data.email };
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
