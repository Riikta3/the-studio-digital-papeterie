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
  console.log("💍 Starting Wedding Provisioning (V2 Architecture)...", {
    email: data.email,
    plan: data.plan,
  });

  if (!data.password) {
    return {
      success: false,
      error: "Mot de passe requis pour la création du compte.",
    };
  }

  let userId: string;

  // 1. CHERCHER OU CRÉER L'UTILISATEUR (Multi-tenant)
  const { data: searchData, error: searchError } =
    await supabaseAdmin.auth.admin.listUsers();

  if (searchError) {
    return {
      success: false,
      error: "Impossible de vérifier l'existence du compte.",
    };
  }

  const existingUser = searchData?.users.find((u) => u.email === data.email);

  if (existingUser) {
    // Si l'utilisateur existe déjà, on empêche la création par mot de passe car
    // dans ce flux de checkout, c'est censé être une création asynchrone pour les nouveaux.
    // L'idéal est qu'il se logue **avant**, mais pour l'instant on respecte l'UI existante :
    return {
      success: false,
      error:
        "Un compte existe déjà avec cette adresse email. Veuillez vous connecter.",
    };
  } else {
    // FORCE CREATE USER WITH PASSWORD
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true, // Auto-confirm email so they can login immediately
        user_metadata: {
          first_name: data.firstName,
          last_name: data.lastName,
          partner_name: data.partnerName,
        },
      });

    if (authError) {
      console.error("Auth Create Error:", authError);
      if (authError.message.includes("Password should be at least")) {
        return {
          success: false,
          error: "Le mot de passe doit contenir au moins 6 caractères.",
        };
      }
      return { success: false, error: authError.message };
    }

    userId = authData.user.id;

    // Create or Update Profile entity
    console.log(
      "👥 Upserting Profile for userId:",
      userId,
      "Partner:",
      data.partnerName,
    );
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: userId,
        first_name: data.firstName,
        last_name: data.lastName,
        partner_name: data.partnerName,
      });

    if (profileError) {
      console.error("Profile Upsert Error:", profileError);
      // Only delete if it was a search list failure before?
      // Actually, if it's a new user creation flux, we should keep it robust.
      return { success: false, error: "Failed to create user profile." };
    }
  }

  // 2. CREATE WEDDING (The Event)
  const { data: weddingData, error: weddingError } = await supabaseAdmin
    .from("weddings")
    .insert({
      user_id: userId,
      partner_name: data.partnerName,
      wedding_date: data.weddingDate || null,
    })
    .select("id")
    .single();

  if (weddingError || !weddingData) {
    console.error("Wedding Creation Error:", weddingError);
    return { success: false, error: "Failed to create wedding entity." };
  }

  const weddingId = weddingData.id;

  // 3. Create Settings
  const { error: settingsError } = await supabaseAdmin.from("settings").insert({
    wedding_id: weddingId,
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
    wedding_id: weddingId,
    plan_id: data.plan,
    theme_id: data.themeId,
    modules: data.modules,
    languages: data.languages,
    extras: data.extras,
    status: "draft",
  });

  if (siteError) console.error("Site Creation Error:", siteError);

  // 5. Record Purchases (Wallet)
  const purchaseItems: {
    wedding_id: string;
    item_type: string;
    item_id: string;
  }[] = [];

  // Modules
  data.modules.forEach((m) => {
    purchaseItems.push({
      wedding_id: weddingId,
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

  console.log(
    "✅ Wedding Provisioned! WeddingId:",
    weddingId,
    "UserId:",
    userId,
  );

  // 6. Generate Auto-Login Link (Magic Link)
  const dashboardUrl =
    process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3003";
  const { data: linkData, error: linkError } =
    await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: data.email,
      options: {
        redirectTo: dashboardUrl,
      },
    });

  if (linkError) {
    console.error("Link Generation Error:", linkError);
  }

  // Return success with auto-login link
  return {
    success: true,
    userId,
    weddingId,
    email: data.email,
    loginLink: linkData?.properties?.action_link,
  };
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
