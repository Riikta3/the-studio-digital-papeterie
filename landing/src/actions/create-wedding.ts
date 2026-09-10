"use server";

import type Stripe from "stripe";

import { findUserByEmail } from "@/lib/find-user-by-email";
import { parseOrderMetadata } from "@/lib/order-metadata";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getDashboardUrl } from "@/lib/urls";
import { sendWelcomeEmail } from "@/lib/welcome-email";
import {
  markPaymentProvisioned,
  verifyPaymentForOrder,
} from "@/lib/verify-payment";
import { APP_MODULES } from "@shared/data/modules";

/**
 * Locales the dashboard actually serves (dashboard/src/navigation.ts). Kept in
 * sync by hand: the two apps are separate Next projects, so the landing cannot
 * import the dashboard's routing config.
 */
const DASHBOARD_LOCALES = [
  "fr", "en", "de", "es", "pt", "it", "ar", "zh", "ja",
];

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
  /** Locale the couple bought in, so the dashboard opens in their language. */
  locale?: string;
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
    const link = await generateLoginLink(data.email, undefined, data.locale);

    // Deliberately no welcome email here. This branch fires on every reload of
    // the success page, and the couple already received one when the wedding
    // was first created — mailing a fresh link each time would be spam, and
    // each new link silently invalidates the one they may be about to click.
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
  const loginLink = await generateLoginLink(data.email, finalSlug, data.locale);

  // 8. Email that link.
  //
  // The checkout page redirects the browser straight to it, which covers the
  // happy path — but that link was the couple's ONLY way into a passwordless
  // account, and it existed solely in a tab that may already be gone. It also
  // matters for orders the webhook provisions on its own: without this the
  // customer is never told their site exists.
  //
  // Awaited rather than fired and forgotten: this runs in a serverless
  // function, which stops executing the moment the response is returned.
  if (loginLink) {
    await sendWelcomeEmail({
      to: data.email,
      firstName: data.firstName,
      partnerName: data.partnerName,
      loginLink,
    });
  }

  return {
    success: true,
    userId,
    weddingId,
    email: data.email,
    loginLink,
  };
}

/**
 * Provisions a paid order straight from its Stripe PaymentIntent.
 *
 * The safety net behind the browser-driven flow. Provisioning is kicked off
 * from the checkout page, so an order was lost whenever the customer's tab
 * died in the two seconds it takes: the charge settled, the webhook logged
 * "Paid but unprovisioned", and nobody was told. The couple had paid for
 * nothing, and the first sign of it was a support email.
 *
 * Called from the `payment_intent.succeeded` webhook, which Stripe retries on
 * its own schedule, so the order gets fulfilled with the customer long gone.
 * `createWedding()` re-verifies the payment and short-circuits on
 * `alreadyProvisionedAs`, so the browser winning the race is not a conflict —
 * whichever arrives second finds the wedding already there and stops.
 */
export async function provisionFromPaymentIntent(
  intent: Stripe.PaymentIntent,
): Promise<
  | { provisioned: true; weddingId: string; alreadyProvisioned: boolean }
  | { provisioned: false; reason: string }
> {
  // Already tied to a wedding by whichever path got there first.
  if (intent.metadata?.wedding_id) {
    return {
      provisioned: true,
      weddingId: intent.metadata.wedding_id,
      alreadyProvisioned: true,
    };
  }

  const order = parseOrderMetadata(intent);
  if (!order) {
    // An intent from before names were recorded, or not a studio checkout.
    // Recoverable by hand from `stripe_events`, never silently half-built.
    return {
      provisioned: false,
      reason: `Intent ${intent.id} carries no usable order metadata.`,
    };
  }

  // The couple's names are what a wedding is keyed on; provisioning without
  // them would produce a nameless site the couple cannot recognise.
  if (!order.firstName || !order.partnerName) {
    return {
      provisioned: false,
      reason: `Intent ${intent.id} is missing the couple's names.`,
    };
  }

  const result = await createWedding({
    paymentIntentId: intent.id,
    email: order.email,
    firstName: order.firstName,
    lastName: order.lastName,
    partnerName: order.partnerName,
    weddingDate: order.weddingDate,
    themeId: order.themeId,
    modules: order.modules,
    extras: order.extras,
    languages: order.languages,
    plan: order.plan,
    adultsOnly: order.adultsOnly,
    animationId: order.animationId,
    locale: order.locale,
  });

  if (!result.success) {
    return { provisioned: false, reason: result.error ?? "Unknown failure." };
  }

  return {
    provisioned: true,
    weddingId: result.weddingId as string,
    alreadyProvisioned: Boolean(result.alreadyProvisioned),
  };
}

/** Builds a passwordless sign-in link into the couple's dashboard. */
async function generateLoginLink(
  email: string,
  slug?: string,
  locale?: string,
): Promise<string | undefined> {
  // Throws in production when unset rather than falling back to localhost:
  // this URL is where a paying customer lands right after checkout, and a
  // localhost redirect there is invisible in logs and unrecoverable for them.
  const dashboardUrl = getDashboardUrl();

  // Was hardcoded to /fr, so a couple who bought in English landed on a
  // French dashboard. Validated against the dashboard's own locale list —
  // both apps ship the same nine — so an unexpected value can never build a
  // URL that 404s instead of signing them in.
  const targetLocale = DASHBOARD_LOCALES.includes(locale ?? "")
    ? (locale as string)
    : "fr";

  const next = `/${targetLocale}?first=true${slug ? `&slug=${slug}` : ""}`;

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
