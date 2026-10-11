"use server";

import type Stripe from "stripe";

import type { ModuleId } from "@/components/invitation/themes/types";
import { ensureCustomDomainRow, recordCustomDomain } from "@/lib/custom-domain-row";
import { adminDomainRowStore, startDomainPurchase } from "@/lib/custom-domain-row-admin";
import { findUserByEmail } from "@/lib/find-user-by-email";
import { seedInvitationContent } from "@/lib/seed-invitation-content";
import { parseOrderMetadata, type IntentDomain } from "@/lib/order-metadata";
import {
  claimProvisioning,
  isPaymentsWedding,
  weddingInsertConflict,
  type ClaimStore,
} from "@/lib/provision-claim";
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

/** What `createWedding` answers: read by the checkout page and, through `provisionFromPaymentIntent`, the webhook. */
type CreateWeddingResult =
  | {
      success: true;
      weddingId: string;
      email: string;
      loginLink: string | undefined;
      userId?: string;
      /** The wedding was built by an earlier pass over this payment. */
      alreadyProvisioned?: boolean;
    }
  | {
      success: false;
      error: string;
      /** Another pass is building this payment's wedding: ask again shortly. */
      inProgress?: true;
      /** The account owns another payment's wedding: this one was refunded. */
      duplicatePurchase?: boolean;
      existingWeddingId?: string;
    };

export async function createWedding(data: CreateWeddingData): Promise<CreateWeddingResult> {
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

  // Replay guard: a page reload after payment must not create a second wedding.
  if (payment.alreadyProvisionedAs) {
    console.log("♻️ Payment already provisioned:", payment.alreadyProvisionedAs);
    return adoptWedding(data, payment.alreadyProvisionedAs, payment.domain, {
      healDomainRow: true,
    });
  }

  /*
   * Claim this payment before creating anything.
   *
   * The replay guard above only knows the order once the intent is stamped,
   * at the very end of provisioning. Two passes provision one payment — the
   * buyer's browser and the webhook rescuing a dead one — and a pass landing
   * before that stamp, or a reload after the stamp failed, found an account
   * that already owned a wedding and the `DUPLICATE_PURCHASE` guard below
   * refunded it: the couple's own order, with their wedding built. Seen live
   * on 2026-10-02, 284 € refunded on a provisioned order.
   *
   * `checkout_provisions` is keyed on the PaymentIntent and records the
   * wedding as soon as it exists, so a second pass over the same payment
   * adopts that wedding (or waits for it) and never reaches the guard. Only
   * the pass that owns the claim goes further (`provision-claim.ts`). Should
   * the claim never learn of its wedding, the wedding still names its payment
   * (`payment_intent_id`), and the guard adopts it instead of refunding.
   */
  const claim = await claimProvisioning(adminClaimStore, data.paymentIntentId);

  if (claim.kind === "failed") {
    console.error("[PROVISION_CLAIM_FAILED]", data.paymentIntentId, claim.error);
    return { success: false, error: RETRY_LATER_ERROR };
  }

  if (claim.kind === "in-progress") {
    // Retryable: the webhook throws on it so Stripe retries, and the browser
    // tries again. Nothing was created, charged or refunded by this pass.
    return inProgressAnswer(data.paymentIntentId);
  }

  if (claim.kind === "adopt") {
    console.log(
      `♻️ Payment ${data.paymentIntentId} was claimed by another pass; ` +
        `adopting wedding ${claim.weddingId}.`,
    );

    // The intent is not stamped (the replay guard let this pass through),
    // yet its wedding exists, with its site: the stamp failed, or the owner
    // has not reached it. Written here so the replay guard and the webhook's
    // domain pass, which both read it, find the order again — the same value
    // either way. Skipped when this pass has just watched the owner at work:
    // the owner stamps it and writes the domain row itself.
    if (!claim.waited) {
      await markPaymentProvisioned(data.paymentIntentId, claim.weddingId);
    }
    return adoptWedding(data, claim.weddingId, payment.domain, {
      healDomainRow: !claim.waited,
    });
  }

  if (claim.tookOver) {
    console.warn(
      `[PROVISION_CLAIM_TAKEN_OVER] ${data.paymentIntentId}: the previous ` +
        "pass died before recording a wedding; provisioning it here.",
    );
  }

  /** Gives the payment back to the next pass when this one stops before its wedding exists. */
  const release = () => releaseClaim(data.paymentIntentId, claim.claimedAt);

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

  /*
   * Everything up to the wedding insert. A pass that stops in here — a
   * failure it returns, a refunded second purchase, a wedding it adopts, or
   * an exception (a non-`AuthError` out of `createUser`, a network error) —
   * gives the payment back on its way out, so the next pass runs at once
   * instead of waiting ten minutes on a claim nobody holds. Only falling
   * through to the insert keeps it. The release only removes this pass's own
   * claim while it has no wedding, so it costs nothing where there is nothing
   * to give back.
   */
  let reachedWeddingInsert = false;
  try {
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
      //
      // The wedding found here can still be this payment's own: built by an
      // earlier pass whose claim never learnt of it (the record failed, or
      // the pass died right after the insert) and was then taken over or
      // released. The wedding names its payment, so that one is adopted,
      // never refunded. Only a wedding of another payment, or one from before
      // `payment_intent_id` existed, makes this a second purchase.
      const { data: existingWedding } = await supabaseAdmin
        .from("weddings")
        .select("id, payment_intent_id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      if (existingWedding && !isPaymentsWedding(existingWedding, data.paymentIntentId)) {
        return refundDuplicatePurchase(data, existingWedding.id);
      }

      if (existingWedding) {
        const adopted = await adoptPaymentsWedding(data, existingWedding.id, payment.domain);
        if (adopted !== "half-built") return adopted;

        // No site, and no builder: the pass that inserted it held this
        // payment's claim, which this pass holds now. Nobody will finish it,
        // so it is rebuilt from scratch, as a failed settings or site insert
        // would have had it (step 3).
        console.warn(
          `[PROVISION_REBUILD] ${data.paymentIntentId}: wedding ` +
            `${existingWedding.id} has no site and no builder; rebuilding it.`,
        );
        if (!(await discardHalfBuiltWedding(data.paymentIntentId, existingWedding.id))) {
          return { success: false, error: RETRY_LATER_ERROR };
        }
      }

      // An account without a wedding was left by an earlier pass that failed
      // after creating it: its half-built wedding deleted, or its profile
      // never written. The wedding references the profile, so a missing one
      // is written here; an existing one is left as it is.
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .upsert(
          {
            id: userId,
            first_name: data.firstName,
            last_name: data.lastName,
            partner_name: data.partnerName,
          },
          { onConflict: "id", ignoreDuplicates: true },
        );
      if (profileError) {
        // The wedding insert below says whether it mattered.
        console.error("[PROFILE_ENSURE_FAILED]", { userId }, profileError);
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
        return { success: false, error: "Failed to create user profile." };
      }
    }

    reachedWeddingInsert = true;
  } finally {
    if (!reachedWeddingInsert) await release();
  }

  // 2. CREATE WEDDING (The Event)
  const { data: weddingData, error: weddingError } = await supabaseAdmin
    .from("weddings")
    .insert({
      user_id: userId,
      partner_name: data.partnerName,
      wedding_date: weddingDate ?? null,
      // The wedding names its payment in the very insert that creates it, so
      // no later failure (the claim's record, the stamp) can make this order
      // look like a second purchase. Unique: one payment, one wedding.
      payment_intent_id: data.paymentIntentId,
    })
    .select("id")
    .single();

  if (weddingError || !weddingData) {
    /*
     * 23505 means another pass got there first: one wedding per account
     * (`weddings_one_per_user`), or per payment (`payment_intent_id`).
     *
     * Two paths provision a paid order: the buyer's browser, and the webhook's
     * safety net for a browser that died. Both check first whether the work is
     * already done, and both checks are reads that can land before the other
     * path's write. That is how one checkout produced two identical weddings
     * 4.4 seconds apart, and left the dashboard 500ing because
     * `requireWedding()` resolves with `.single()`.
     *
     * The unique index is what actually closes that window, and this is the
     * losing side of it. Nothing below has run yet, so there is nothing to
     * unwind — the winner seeds the site, the settings and the purchases, and
     * stamps the intent. Deliberately no welcome email here: the winner sends
     * the one.
     *
     * Since the payment claim, two passes over one payment rarely get here:
     * only the claim's owner creates the wedding. What is left is a take-over
     * of an owner thought dead that was in fact still running, and two
     * different payments for one account racing each other. The winner's
     * `payment_intent_id` tells them apart, whichever rule Postgres names
     * (`weddings_one_per_user` when both break, its index being older):
     * - this payment's: adopted once its site exists. Its builder is alive,
     *   so it is never rebuilt from here; until then this pass answers "in
     *   progress" and keeps its claim, which the builder records its wedding
     *   on;
     * - another payment's, or one from before the column: the guard above,
     *   lost by a hair, so the same refund.
     */
    const conflict = weddingInsertConflict(weddingError);
    if (conflict) {
      const weddings = supabaseAdmin
        .from("weddings")
        .select("id, user_id, payment_intent_id");
      const { data: winner } = await (conflict === "payment"
        ? weddings.eq("payment_intent_id", data.paymentIntentId)
        : weddings.eq("user_id", userId)
      ).maybeSingle();

      // Never another account's wedding, whatever it carries: the sign-in
      // link below is for this buyer.
      if (winner && winner.user_id === userId) {
        if (isPaymentsWedding(winner, data.paymentIntentId)) {
          console.log(
            `\u267b\ufe0f Provisioning race lost for intent ${data.paymentIntentId}; ` +
              `adopting wedding ${winner.id}.`,
          );
          const adopted = await adoptPaymentsWedding(data, winner.id, payment.domain);
          return adopted === "half-built"
            ? inProgressAnswer(data.paymentIntentId)
            : adopted;
        }

        const refused = await refundDuplicatePurchase(data, winner.id);
        await release();
        return refused;
      }
    }

    console.error("Wedding Creation Error:", weddingError);
    await release();
    return { success: false, error: "Failed to create wedding entity." };
  }

  const weddingId = weddingData.id;

  // On the claim at once, before anything else can fail: from here on, every
  // other pass over this payment waits for this wedding's site and adopts it,
  // instead of refunding the order or building another. Should the record
  // fail, the wedding's own `payment_intent_id` still tells the guard above
  // whose it is.
  await recordClaimedWedding(data.paymentIntentId, weddingId);

  /*
   * A wedding whose settings or site fail is deleted again and the claim
   * given back, rather than left for the next pass to adopt: an adopted
   * wedding without a site is a paid order the couple cannot use, and nothing
   * would ever finish it. The delete cascades to what was written under it
   * and sets the claim's `wedding_id` back to null, so the release lands and
   * the next pass (a reload, Stripe's retry) rebuilds it from scratch, under
   * the account this pass created.
   */
  const giveUp = async () => {
    await discardHalfBuiltWedding(data.paymentIntentId, weddingId);
    await release();
  };

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
    await giveUp();
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
    await giveUp();
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

    // 4.5b The custom domain, when this payment bought one. Read from the
    // intent (`payment.domain`), never from `data`: the browser could name
    // any domain, or drop « plus tard » for a name nobody checked. Never fails
    // provisioning — `recordCustomDomain` logs `[DOMAIN_ROW_FAILED]` instead,
    // and the next pass over this payment (a reload, the webhook) writes the
    // row through `ensureCustomDomainRow`.
    if (payment.domain.has) {
      const domainRow = await recordCustomDomain(
        adminDomainRowStore.insert,
        {
          siteId,
          weddingId,
          paymentIntentId: data.paymentIntentId,
          domain: payment.domain,
        },
      );
      // With a name, the purchase starts once the response is sent: the
      // couple's redirect must not wait on Vercel, and the 5-minute cron is
      // the safety net. « Plus tard », a lost name or a failure start nothing.
      startDomainPurchase(domainRow);
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
      modules: sortedModules as ModuleId[],
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
 * `createWedding()` re-verifies the payment, short-circuits on
 * `alreadyProvisionedAs`, and claims the payment before building anything, so
 * the browser winning the race is not a conflict — whichever arrives second
 * adopts the wedding the first one built, or waits for it. `inProgress` means
 * the other pass was still at work after that wait: nothing was done, and the
 * webhook throws so Stripe delivers again. `duplicatePurchase` means the
 * account already owns another payment's wedding, and this payment was
 * refunded (or its refund failed and was logged): nothing was sold, so the
 * webhook books nothing for it.
 */
export async function provisionFromPaymentIntent(
  intent: Stripe.PaymentIntent,
): Promise<
  | { provisioned: true; weddingId: string; alreadyProvisioned: boolean }
  | { provisioned: false; reason: string; inProgress?: true; duplicatePurchase?: true }
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
    return {
      provisioned: false,
      reason: result.error ?? "Unknown failure.",
      ...(result.inProgress ? { inProgress: true as const } : {}),
      ...(result.duplicatePurchase ? { duplicatePurchase: true as const } : {}),
    };
  }

  return {
    provisioned: true,
    weddingId: result.weddingId as string,
    alreadyProvisioned: Boolean(result.alreadyProvisioned),
  };
}

/**
 * The answer for a payment whose wedding already exists — built by an earlier
 * pass over the same payment. A sign-in link, and nothing created, charged or
 * refunded.
 */
async function adoptWedding(
  data: CreateWeddingData,
  weddingId: string,
  domain: IntentDomain,
  { healDomainRow }: { healDomainRow: boolean },
): Promise<CreateWeddingResult> {
  if (healDomainRow) {
    // The domain row, should the first pass have failed to write it
    // (`[DOMAIN_ROW_FAILED]`): every later pass returns here, before step
    // 4.5b, so nothing else would. A row already there is a replay, and no
    // outcome fails the reload — it only logs.
    const healed = await ensureCustomDomainRow(adminDomainRowStore, {
      weddingId,
      paymentIntentId: data.paymentIntentId,
      domain,
    });
    // A row written just now with a name: its purchase starts after the
    // response, so the redirect never waits on Vercel; the cron backs it up.
    startDomainPurchase(healed);
  }

  const link = await generateLoginLink(data.email, undefined, data.locale);

  // Deliberately no welcome email here. This branch fires on every reload of
  // the success page, and the couple already received one when the wedding
  // was first created — mailing a fresh link each time would be spam, and
  // each new link silently invalidates the one they may be about to click.
  return {
    success: true,
    weddingId,
    email: data.email,
    loginLink: link,
    alreadyProvisioned: true,
  };
}

/**
 * This payment's own wedding, found through the account or a lost insert
 * rather than on the claim: an earlier pass built it, and its claim never
 * learnt of it (the record failed, or the pass died right after the insert).
 *
 * Adopted only once its site exists, as an adopted claim is, and then
 * answered like a reload with nothing to wait for: recorded on the claim so
 * later passes find it there, the intent stamped, the domain row healed, a
 * sign-in link. `"half-built"` for a wedding without a site, which the caller
 * rebuilds (its builder is gone) or waits on (its builder is still running).
 */
async function adoptPaymentsWedding(
  data: CreateWeddingData,
  weddingId: string,
  domain: IntentDomain,
): Promise<CreateWeddingResult | "half-built"> {
  const { data: site, error } = await adminDomainRowStore.siteOf(weddingId);
  if (error) {
    console.error("[PROVISION_ADOPT_FAILED]", { paymentIntentId: data.paymentIntentId, weddingId }, error);
    return { success: false, error: RETRY_LATER_ERROR };
  }
  if (!site) return "half-built";

  console.log(
    `♻️ Payment ${data.paymentIntentId} already built wedding ${weddingId}; adopting it.`,
  );
  await recordClaimedWedding(data.paymentIntentId, weddingId);
  await markPaymentProvisioned(data.paymentIntentId, weddingId);
  return adoptWedding(data, weddingId, domain, { healDomainRow: true });
}

/**
 * Refunds a second purchase: the account already owns a wedding, and not
 * this payment's.
 *
 * Refunded here rather than left for support: nothing is provisioned for this
 * charge, so keeping the money would be taking payment for nothing.
 * `refundPayment` is idempotent, so a reload or Stripe's retry gets the same
 * answer without a second refund. The caller gives the claim back.
 */
async function refundDuplicatePurchase(
  data: CreateWeddingData,
  existingWeddingId: string,
): Promise<CreateWeddingResult> {
  console.error(
    `[DUPLICATE_PURCHASE] ${data.email} already owns wedding ` +
      `${existingWeddingId}; refunding intent ${data.paymentIntentId}.`,
  );

  const refund = await refundPayment(
    data.paymentIntentId,
    `duplicate purchase — account already owns wedding ${existingWeddingId}`,
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
    existingWeddingId,
  };
}

/**
 * Deletes a wedding of this payment that never got its settings or site.
 * Everything under it cascades, and the claim's `wedding_id` drops back to
 * null; the account stays, for the next pass to build under. Only this
 * payment's wedding, whatever id is passed.
 *
 * A failure leaves a wedding nobody can use and no pass will rebuild while
 * the claim names it: `[PROVISION_HALF_BUILT]`, for a human.
 */
async function discardHalfBuiltWedding(paymentIntentId: string, weddingId: string) {
  const { error } = await supabaseAdmin
    .from("weddings")
    .delete()
    .eq("id", weddingId)
    .eq("payment_intent_id", paymentIntentId);
  if (error) {
    console.error("[PROVISION_HALF_BUILT]", { paymentIntentId, weddingId }, error);
    return false;
  }
  return true;
}

/** The answer when another pass is building this payment's wedding: retryable, nothing done here. */
function inProgressAnswer(paymentIntentId: string): CreateWeddingResult {
  console.warn(
    `[PROVISION_IN_PROGRESS] ${paymentIntentId} is being provisioned ` +
      "by another pass; nothing done.",
  );
  return {
    success: false,
    error:
      "Votre espace est en cours de création. Patientez quelques secondes " +
      "puis rechargez cette page.",
    inProgress: true,
  };
}

/** A transient failure on a paid order: the couple is told to reload, not to pay again. */
const RETRY_LATER_ERROR =
  "Impossible de finaliser votre commande pour le moment. Rechargez " +
  "cette page dans quelques instants : votre paiement est bien reçu.";

const CLAIM_COLUMNS = "payment_intent_id, wedding_id, claimed_at";

/**
 * `checkout_provisions` through the service role (the table has no policy and
 * no grant for anyone else). Module-private: this file is `"use server"`, so
 * anything exported from it becomes a callable endpoint.
 */
const adminClaimStore: ClaimStore = {
  siteOf: adminDomainRowStore.siteOf,
  insert: (paymentIntentId) =>
    supabaseAdmin
      .from("checkout_provisions")
      .upsert(
        { payment_intent_id: paymentIntentId },
        { onConflict: "payment_intent_id", ignoreDuplicates: true },
      )
      .select(CLAIM_COLUMNS)
      .maybeSingle(),
  read: (paymentIntentId) =>
    supabaseAdmin
      .from("checkout_provisions")
      .select(CLAIM_COLUMNS)
      .eq("payment_intent_id", paymentIntentId)
      .maybeSingle(),
  takeOver: (paymentIntentId, claimedAt) => {
    const now = new Date().toISOString();
    return supabaseAdmin
      .from("checkout_provisions")
      .update({ claimed_at: now, updated_at: now })
      .eq("payment_intent_id", paymentIntentId)
      .eq("claimed_at", claimedAt)
      .is("wedding_id", null)
      .select(CLAIM_COLUMNS)
      .maybeSingle();
  },
};

/**
 * Records the wedding this payment produced on its claim.
 *
 * An upsert, not an update: should another pass have released the row in the
 * meantime (a take-over that then lost the wedding insert), the wedding still
 * lands. Never fails provisioning — the wedding names its payment itself
 * (`weddings.payment_intent_id`), which is what keeps the order from being
 * refunded as a second purchase; this record only spares later passes the
 * account lookup.
 */
async function recordClaimedWedding(paymentIntentId: string, weddingId: string) {
  const { error } = await supabaseAdmin
    .from("checkout_provisions")
    .upsert(
      {
        payment_intent_id: paymentIntentId,
        wedding_id: weddingId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "payment_intent_id" },
    );
  if (error) {
    console.error("[PROVISION_CLAIM_RECORD_FAILED]", { paymentIntentId, weddingId }, error);
  }
}

/**
 * Gives a payment back after this pass stopped before creating a wedding, or
 * deleted the one it could not finish, so the next pass (a reload, Stripe's
 * retry) runs at once instead of waiting out a claim nobody will complete.
 * Only this pass's own claim, still without a wedding: one taken over since,
 * or that a wedding is recorded on, stays.
 */
async function releaseClaim(paymentIntentId: string, claimedAt: string) {
  const { error } = await supabaseAdmin
    .from("checkout_provisions")
    .delete()
    .eq("payment_intent_id", paymentIntentId)
    .eq("claimed_at", claimedAt)
    .is("wedding_id", null);
  if (error) {
    // The claim then expires on its own: taken over after 10 minutes.
    console.error("[PROVISION_CLAIM_RELEASE_FAILED]", { paymentIntentId }, error);
  }
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
