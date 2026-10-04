"use server";

import type Stripe from "stripe";

import type { ModuleId } from "@/components/invitation/themes/types";
import { recordCustomDomain } from "@/lib/custom-domain-row";
import { findUserByEmail } from "@/lib/find-user-by-email";
import { seedInvitationContent } from "@/lib/seed-invitation-content";
import { parseOrderMetadata } from "@/lib/order-metadata";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getDashboardUrl } from "@/lib/urls";
import { checkedWeddingDate } from "@/lib/wedding-date";
import { sendWelcomeEmail } from "@/lib/welcome-email";
import {
  markPaymentProvisioned,
  refundPayment,
  verifyPaymentForOrder,
} from "@/lib/verify-payment";
import { APP_MODULES } from "@shared/data/modules";
import { ALWAYS_INCLUDED_MODULES } from "@shared/lib/pricing";

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
  /** Free text as typed in the studio, seeds the couple's venue row. */
  venue?: string;
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
  const payment = await verifyPaymentForOrder(
    data.paymentIntentId,
    {
      plan: data.plan,
      modules: data.modules,
      languages: data.languages,
      extras: data.extras,
    },
    // Ties the order to the buyer: this endpoint is unauthenticated, so a
    // payment reference on its own must not be enough to claim the wedding.
    data.email,
  );

  if (!payment.ok) {
    console.warn("🚫 Provisioning refused:", payment.reason);
    return { success: false, error: payment.reason };
  }

  // The RSVP is part of every plan: the couple never picks it, so it is added
  // here, once the basket they paid for has been verified as sent.
  data = {
    ...data,
    modules: [...new Set([...data.modules, ...ALWAYS_INCLUDED_MODULES])],
  };

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

  /*
   * A date that does not exist (31 April) is dropped rather than inserted.
   * `weddings.wedding_date` is a `date` column, so Postgres would refuse it
   * and fail the provisioning of an order that is already paid. The studio
   * no longer sends one, but this action is reachable directly and the
   * webhook replays whatever an older build wrote to the intent. The couple
   * enters the date from the dashboard instead; the domain was already priced
   * as one year for such a date (`domainYearsFor`).
   */
  const weddingDate = checkedWeddingDate(data.weddingDate);
  if (data.weddingDate && !weddingDate) {
    console.warn("[WEDDING_DATE_INVALID]", {
      paymentIntentId: data.paymentIntentId,
      weddingDate: data.weddingDate,
    });
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
    // Passwordless flow: an existing account is not a conflict on its own —
    // the payment already went through, so this signs them back in.
    userId = existingUser.id;

    // One account, one wedding — a v1 constraint, not a domain truth.
    //
    // Guards the double-purchase path: the order store survives checkout, so
    // navigating back from the dashboard used to show a working payment form
    // primed with the same basket. The replay guard above is keyed on the
    // PaymentIntent, and that second checkout mints a fresh one — so it saw
    // nothing, charged the couple again and built them a second site.
    //
    // Checked server-side rather than in the browser because the store is
    // localStorage: clearing it is one devtools click away.
    //
    // ── Planned for v2: multiple weddings per account ──────────────────────
    // Wedding planners and couples gifting an invitation are legitimate
    // second purchases, and today they are refused and refunded here, then
    // handled by hand. Everything downstream is already keyed by wedding_id
    // rather than user_id, so lifting this is mostly about telling an
    // intentional second order apart from an accidental repeat — an explicit
    // "order another invitation" entry point carrying a flag this guard
    // honours, rather than removing the check. Deleting it outright would
    // restore the Back-button double charge this was written to stop.
    // See the vault note "Provisioning et Facturation".
    const { data: existingWedding } = await supabaseAdmin
      .from("weddings")
      .select("id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (existingWedding) {
      console.error(
        `[DUPLICATE_PURCHASE] ${data.email} already owns wedding ` +
          `${existingWedding.id}; refunding intent ${data.paymentIntentId}.`,
      );

      // Refunded here rather than left for support: nothing is provisioned for
      // this charge, so keeping the money would be taking payment for nothing.
      const refund = await refundPayment(
        data.paymentIntentId,
        `duplicate purchase — account already owns wedding ${existingWedding.id}`,
      );

      return {
        success: false,
        error: refund.refunded
          ? "Un espace existe déjà pour cette adresse email. Votre paiement " +
            "a été remboursé — il apparaîtra sur votre compte sous 5 à 10 " +
            "jours. Contactez-nous si vous souhaitiez une seconde invitation."
          : "Un espace existe déjà pour cette adresse email, et le " +
            "remboursement automatique a échoué. Contactez-nous : nous le " +
            "traiterons manuellement sous 24h.",
        duplicatePurchase: true,
        existingWeddingId: existingWedding.id,
      };
    }
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
          /*
           * This account has no password: `createUser` is called without one,
           * and the couple gets in through the magic link below.
           *
           * Supabase exposes no way to ask "does this user have a password" —
           * `identities` is null and `app_metadata.providers` reads ["email"]
           * either way — so the dashboard cannot tell a couple who never set
           * one from a couple who did. It needs to know, because the two are
           * offered different things: an invitation to set a password, or
           * nothing at all.
           *
           * Cleared by the dashboard the moment a password is set. Absent on
           * every account created before this flag existed, which reads the
           * same as "has a password" — the safe way round, since it only
           * means we stay quiet rather than nagging someone who is fine.
           */
          needs_password: true,
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
      wedding_date: weddingDate ?? null,
    })
    .select("id")
    .single();

  if (weddingError || !weddingData) {
    /*
     * 23505 on `weddings_one_per_user` means the other provisioning path got
     * there first — this exact order is already being built, or is built.
     *
     * Two paths provision a paid order: the buyer's browser, and the webhook's
     * safety net for a browser that died. Both check first whether the work is
     * already done, and both checks are reads that can land before the other
     * path's write. That is how one checkout produced two identical weddings
     * 4.4 seconds apart, and left the dashboard 500ing because
     * `requireWedding()` resolves with `.single()`.
     *
     * The unique index is what actually closes that window, and this is the
     * losing side of it: adopt the wedding the winner created rather than
     * reporting a failure for an order that did go through. Nothing below has
     * run yet, so there is nothing to unwind — the winner seeds the site, the
     * settings and the purchases, and stamps the intent.
     *
     * Deliberately no welcome email and no refund here: the winner sends the
     * one, and the couple is charged once for the one wedding they now own.
     */
    if (weddingError?.code === "23505") {
      const { data: winner } = await supabaseAdmin
        .from("weddings")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (winner) {
        console.log(
          `\u267b\ufe0f Provisioning race lost for intent ${data.paymentIntentId}; ` +
            `adopting wedding ${winner.id}.`,
        );

        const link = await generateLoginLink(data.email, undefined, data.locale);

        return {
          success: true,
          weddingId: winner.id,
          email: data.email,
          loginLink: link,
          alreadyProvisioned: true,
        };
      }
    }

    console.error("Wedding Creation Error:", weddingError);
    return { success: false, error: "Failed to create wedding entity." };
  }

  const weddingId = weddingData.id;

  /*
   * Draw a code no other wedding is already using.
   *
   * The random suffix makes a collision unlikely, and
   * `settings_wedding_code_unique` makes one impossible. This check is what
   * keeps that constraint from being felt: it turns a collision into another
   * draw here, rather than into a failed insert after the couple has paid.
   */
  let weddingCode = generateWeddingCode(data.firstName, data.partnerName);

  for (let i = 0; i < 5; i++) {
    const { data: taken } = await supabaseAdmin
      .from("settings")
      .select("id")
      .eq("wedding_code", weddingCode)
      .maybeSingle();

    if (!taken) break;

    weddingCode = generateWeddingCode(data.firstName, data.partnerName);

    if (i === 4) {
      // Five draws collided, which should not happen. A timestamp cannot
      // collide with a code minted at any other moment.
      weddingCode = `${weddingCode}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
      console.warn(`[CODE_FALLBACK] falling back to ${weddingCode}.`);
    }
  }

  // 3. Create Settings
  const { error: settingsError } = await supabaseAdmin.from("settings").insert({
    wedding_id: weddingId,
    is_module_rsvp_meal_enabled: data.modules.includes("rsvp"),
    is_module_gallery_enabled: data.modules.includes("gallery"),
    is_module_schedule_enabled: data.modules.includes("timeline"),
    is_module_accommodation_enabled: data.modules.includes("accommodation"),
    theme_config: { themeId: data.themeId },
    wedding_code: weddingCode,
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

  const sectionModules = sortedModules.filter((id) =>
    APP_MODULES.some((m) => m.id === id),
  );

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

  /*
   * The loop can run out, and used to fall through anyway.
   *
   * `sites.slug` is `text unique`, so the insert below would then be refused
   * by Postgres and provisioning would fail with "Failed to create site" — on
   * a payment already taken. Vanishingly unlikely (the base slug carries four
   * random characters and each retry adds four more digits), but the cost of
   * being wrong is a charged customer with no site, so it is worth the two
   * lines.
   *
   * A timestamp rather than another random draw: it cannot collide with a
   * slug minted at any other moment, which is exactly the guarantee the
   * retries were failing to give.
   */
  if (!isUnique) {
    finalSlug = `${baseSlug}-${Date.now().toString(36)}`;
    console.warn(
      `[SLUG_FALLBACK] ${baseSlug} collided five times; using ${finalSlug}.`,
    );
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
      // Published on purchase. `status` is what makes the invitation readable
      // at its public slug (migration 20260912110000) — the couple bought a
      // page to send to their guests, and a draft they have to find a switch
      // for is a worse product. Distinct from `day_of_settings.enabled`, which
      // stays off until they deliberately turn the Jour J guest page on.
      status: "published",
    })
    .select("id")
    .single();

  if (siteError || !siteData) {
    console.error("Site Creation Error:", siteError);
    return { success: false, error: `Failed to create site: ${siteError?.message}` };
  } else {
    // 4.5 Insert into site_modules (New Registry Architecture)
    const siteId = siteData.id;
    // Only invitation sections have a row in the `modules` registry, which
    // `site_modules` references: « Trouve ta place » (jour-j) is a dashboard
    // feature, kept in `sites.modules` alone.
    const siteModulesEntries = sectionModules.map((modId, index) => ({
      site_id: siteId,
      module_id: modId,
      position: index + 1,
    }));

    const { error: smError } = await supabaseAdmin
      .from("site_modules")
      .insert(siteModulesEntries);

    if (smError) console.error("Site Modules Registry Error:", smError);

    // 4.5b The custom domain, when this payment bought one. Read from the
    // intent (`payment.domain`), never from `data`: the browser could name
    // any domain, or drop « plus tard » for a name nobody checked. Never fails
    // provisioning — `recordCustomDomain` logs `[DOMAIN_ROW_FAILED]` instead.
    if (payment.domain.has) {
      await recordCustomDomain(
        (row) => supabaseAdmin.from("custom_domains").insert(row).select("id").single(),
        {
          siteId,
          weddingId,
          paymentIntentId: data.paymentIntentId,
          domain: payment.domain,
        },
      );
      // Phase 5: when the row was inserted with a name, start the purchase
      // without holding up the couple's redirect —
      // `after(() => advanceCustomDomain(id))` with the returned row id.
    }
  }

  // 4.6 Seed the invitation's starting content.
  //
  // The couple lands on an invitation that already exists — their names, their
  // date, their venue, and a plausible programme underneath that they edit
  // down rather than write from nothing. It also creates the enabled event the
  // public route requires, without which a wedding that was just paid for 404s
  // even though its site is published.
  //
  // Deliberately not awaited for its result: the order is already paid, and a
  // seeding failure must not fail provisioning. It logs internally.
  if (weddingDate) {
    await seedInvitationContent({
      weddingId,
      partner1: data.firstName,
      partner2: data.partnerName,
      weddingDate,
      venue: data.venue,
      modules: sectionModules as ModuleId[],
    });
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
    venue: order.venue,
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

/**
 * The code a guest types to reach their household on the RSVP screen.
 *
 * This was `TARI&CHAR2026` — four letters of each first name and the year,
 * and nothing else. Entirely deterministic, so every "Tarik & Charlotte"
 * marrying in 2026 got the same one, and `settings.wedding_code` carries no
 * unique constraint to catch it. Four of the five weddings in production
 * shared a single code.
 *
 * That is not cosmetic: `resolve_wedding_code` matches on the code and takes
 * `limit 1`, so a guest typing a shared code reaches whichever wedding the
 * database returns first — someone else's guest list, and their own RSVP
 * filed against a stranger's wedding.
 *
 * Two random characters make the code unique in practice without making it
 * unreadable: the couple reads it aloud or prints it, so it stays short and
 * keeps the names that make it recognisable. `checkCodeIsFree` below is what
 * actually guarantees it.
 */
function generateWeddingCode(n1: string, n2: string): string {
  const clean = (s: string) =>
    s
      .replace(/[^a-zA-Z]/g, "")
      .toUpperCase()
      .substring(0, 4);

  // No I, O, 0 or 1: the code is read off a screen and typed back in.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const suffix = Array.from(
    { length: 2 },
    () => alphabet[Math.floor(Math.random() * alphabet.length)],
  ).join("");

  const year = new Date().getFullYear();
  return `${clean(n1)}&${clean(n2)}${year}-${suffix}`;
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
