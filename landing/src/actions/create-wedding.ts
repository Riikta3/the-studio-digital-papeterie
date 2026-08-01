"use server";

import { findUserByEmail } from "@/lib/find-user-by-email";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  markPaymentProvisioned,
  verifyPaymentForOrder,
} from "@/lib/verify-payment";
import { APP_MODULES } from "@shared/data/modules";

interface CreateWeddingData {
  /** Stripe PaymentIntent proving this order was paid for. */
  paymentIntentId: string;
  email: string;
  firstName: string;
  lastName: string;
  partnerName: string;
  weddingDate?: string;
  themeId: string;
  modules: string[];
  extras: string[];
  languages: string[];
  plan: string;
  adultsOnly?: boolean;
  animationId?: string;
}

export async function createWedding(data: CreateWeddingData) {
  console.log("💍 Starting Wedding Provisioning (V2 Architecture)...", {
    email: data.email,
    plan: data.plan,
  });

  // 0. VERIFY PAYMENT — this action is reachable as an HTTP endpoint, so the
  // order is only provisioned once Stripe confirms it was actually paid.
  const payment = await verifyPaymentForOrder(data.paymentIntentId, {
    plan: data.plan,
    modules: data.modules,
    languages: data.languages,
    extras: data.extras,
  });

  if (!payment.ok) {
    console.warn("🚫 Provisioning refused:", payment.reason);
    return { success: false, error: payment.reason };
  }

  // Replay guard: a page reload after payment must not create a second wedding.
  if (payment.alreadyProvisionedAs) {
    console.log("♻️ Payment already provisioned:", payment.alreadyProvisionedAs);
    const link = await generateLoginLink(data.email);
    return {
      success: true,
      weddingId: payment.alreadyProvisionedAs,
      email: data.email,
      loginLink: link,
      alreadyProvisioned: true,
    };
  }

  let userId: string;

  // 1. CHERCHER OU CRÉER L'UTILISATEUR (Multi-tenant)
  let existingUser: { id: string } | undefined;
  try {
    existingUser = await findUserByEmail(data.email);
  } catch {
    return {
      success: false,
      error: "Impossible de vérifier l'existence du compte.",
    };
  }

  if (existingUser) {
    // Passwordless flow: an existing account is not a conflict — the payment
    // already went through, so attach this new wedding to that user and let
    // the magic link below sign them in.
    userId = existingUser.id;
  } else {
    // Passwordless account: the couple signs in through the magic link
    // generated at the end of this action, so no password is ever set.
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        email_confirm: true, // Auto-confirm so the magic link works immediately
        user_metadata: {
          first_name: data.firstName,
          last_name: data.lastName,
          partner_name: data.partnerName,
        },
      });

    if (authError) {
      console.error("Auth Create Error:", authError);
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
    is_module_schedule_enabled: data.modules.includes("timeline"),
    is_module_accommodation_enabled: data.modules.includes("accommodation"),
    theme_config: { themeId: data.themeId },
    wedding_code: generateWeddingCode(data.firstName, data.partnerName),
    adults_only: data.adultsOnly ?? false,
  });

  if (settingsError) {
    console.error("Settings Creation Error:", settingsError);
    return { success: false, error: "Failed to apply settings." };
  }

  // 4. Create Site Record (Static Template Approach)
  // Sort modules by predefined order
  const sortedModules = [...data.modules].sort((a, b) => {
    const orderA = APP_MODULES.find((m: any) => m.id === a)?.defaultOrder || 99;
    const orderB = APP_MODULES.find((m: any) => m.id === b)?.defaultOrder || 99;
    return orderA - orderB;
  });

  // Generate a unique slug
  const baseSlug = generateSlug(data.firstName, data.partnerName);
  let finalSlug = baseSlug;
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 5) {
    const { data: existingSite } = await supabaseAdmin
      .from("sites")
      .select("id")
      .eq("slug", finalSlug)
      .maybeSingle();

    if (!existingSite) {
      isUnique = true;
    } else {
      attempts++;
      finalSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }
  }

  const { data: siteData, error: siteError } = await supabaseAdmin
    .from("sites")
    .insert({
      wedding_id: weddingId,
      plan_id: data.plan,
      theme_id: data.themeId,
      modules: sortedModules,
      languages: data.languages,
      extras: data.extras,
      animation_id: data.animationId || "envelope-classic",
      slug: finalSlug,
      status: "draft",
    })
    .select("id")
    .single();

  if (siteError || !siteData) {
    console.error("Site Creation Error:", siteError);
    return { success: false, error: `Failed to create site: ${siteError?.message}` };
  } else {
    // 4.5 Insert into site_modules (New Registry Architecture)
    const siteId = siteData.id;
    const siteModulesEntries = sortedModules.map((modId, index) => ({
      site_id: siteId,
      module_id: modId,
      position: index + 1,
    }));

    const { error: smError } = await supabaseAdmin
      .from("site_modules")
      .insert(siteModulesEntries);

    if (smError) console.error("Site Modules Registry Error:", smError);
  }

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

  // 6. Tie the payment to this wedding so a replay can't create another one.
  await markPaymentProvisioned(data.paymentIntentId, weddingId);

  // 7. Generate Auto-Login Link (Magic Link)
  const loginLink = await generateLoginLink(data.email, finalSlug);

  return {
    success: true,
    userId,
    weddingId,
    email: data.email,
    loginLink,
  };
}

/** Builds a passwordless sign-in link into the couple's dashboard. */
async function generateLoginLink(
  email: string,
  slug?: string,
): Promise<string | undefined> {
  const dashboardUrl =
    process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3003";

  const next = `/fr?first=true${slug ? `&slug=${slug}` : ""}`;

  const { data: linkData, error: linkError } =
    await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: `${dashboardUrl}/auth/confirm?next=${encodeURIComponent(next)}`,
      },
    });

  if (linkError) {
    console.error("Link Generation Error:", linkError);
    return undefined;
  }

  return linkData?.properties?.action_link;
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

function generateSlug(n1: string, n2: string): string {
  const clean = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^a-z0-9]/g, "-") // replace non-alphanumeric with hyphens
      .replace(/-+/g, "-") // collapse multiple hyphens
      .replace(/^-|-$/g, ""); // remove leading/trailing hyphens

  const randomHash = Math.random().toString(36).substring(2, 6);
  return `${clean(n1)}-et-${clean(n2)}-${randomHash}`;
}
