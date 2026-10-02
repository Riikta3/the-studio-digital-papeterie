import { NextResponse } from "next/server";

import { planDomainForCheckout } from "@/lib/checkout-domain";
import { findUserByEmail } from "@/lib/find-user-by-email";
import { buildOrderMetadata, metadataForUpdate } from "@/lib/order-metadata";
import { computeOrderTotal } from "@/lib/pricing";
import { stripe, toCents } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { searchDomains } from "@shared/lib/domain-search";

/** Statuses where an intent can still be repriced instead of recreated. */
const REUSABLE_STATUSES = new Set([
  "requires_payment_method",
  "requires_confirmation",
  "requires_action",
]);

export async function POST(req: Request) {
  try {
    const { items, email, paymentIntentId, weddingInfo } = await req.json();

    if (!items?.plan) {
      return NextResponse.json(
        { error: "Invalid payload or missing plan" },
        { status: 400 },
      );
    }

    /*
     * The custom domain's years are the server's to decide (spec D1): they
     * follow from the wedding date and today, and they set both the price and
     * the registration bought. Whatever `domainYears` the browser sent is
     * overwritten here, before anything is priced — a hand-made request
     * claiming one year for a wedding three years away would otherwise pay
     * 65 € for a domain that lapses before the day.
     */
    const domainPlan = planDomainForCheckout({
      extras: items.extras,
      domain: items.domain,
      weddingDate: weddingInfo?.weddingDate,
      now: new Date(),
    });
    items.domainYears = domainPlan.wanted ? domainPlan.years : undefined;

    // Never trust a client-sent amount: recompute from the shared pricing rules.
    const amount = computeOrderTotal(items);
    if (amount === null) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }
    if (amount <= 0) {
      return NextResponse.json({ clientSecret: null, amount: 0 });
    }

    const amountInCents = toCents(amount);

    /*
     * Refuse the payment before it is taken, not after.
     *
     * One account owns one wedding (v1), and `create-wedding` enforces that
     * at the end of the funnel by REFUNDING a second purchase. That is the
     * wrong place to find out: the couple has already entered their card,
     * watched it go through, and then reads that they are getting their money
     * back. It also leaves a real charge and a real refund on the statement
     * for an order that should never have been accepted.
     *
     * The studio does ask (`/api/check-email`, on the email field's `blur`),
     * but that is a browser-side courtesy and it cannot be the gate: the blur
     * never fires if the couple taps the CTA straight from the keyboard, the
     * order survives in localStorage across sessions, and nothing stops a
     * request being made directly to this endpoint.
     *
     * So the check lives here too, where the money is. Same lookup, same
     * message as the studio shows, one step earlier.
     */
    if (email) {
      let taken = false;
      try {
        taken = Boolean(await findUserByEmail(String(email)));
      } catch (lookupError) {
        // Never take a payment we cannot vet. Failing closed costs us an
        // order; failing open costs the couple a charge and a refund.
        console.error("[PAYMENT_EMAIL_LOOKUP_FAILED]", lookupError);
        return NextResponse.json(
          {
            error:
              "Impossible de vérifier votre compte pour le moment. " +
              "Merci de réessayer dans quelques instants.",
          },
          { status: 503 },
        );
      }

      if (taken) {
        return NextResponse.json(
          {
            error:
              "Cet email est déjà lié à un compte existant ! Veuillez vous " +
              "connecter ou utiliser une autre adresse.",
            emailTaken: true,
          },
          { status: 409 },
        );
      }
    }

    /*
     * The chosen domain name is checked here too, right before the money is
     * taken (spec D3). The studio's options step shows availability while the
     * couple types, but that answer may be a minute old, and this endpoint is
     * reachable directly.
     *
     * Two sources, because neither knows everything:
     * - our own rows: Vercel's search answers "available" for a name another
     *   of our couples has paid for but that is not bought yet;
     * - Vercel's search, uncached (`maxAgeMs: 0`), for the rest of the world.
     *
     * Same 409 shape as `emailTaken` above, so the checkout can send the
     * couple back to the options step before anything is charged.
     */
    if (domainPlan.wanted && domainPlan.name) {
      if (domainPlan.invalid) {
        return NextResponse.json(
          { error: "Nom de domaine invalide.", domainInvalid: true },
          { status: 400 },
        );
      }

      const domainTaken = () =>
        NextResponse.json(
          {
            error: "Ce nom vient d'être pris. Choisissez-en un autre.",
            domainUnavailable: true,
          },
          { status: 409 },
        );

      // Service role: the function is not granted to anon (it would let
      // anyone probe which names our couples chose), and no account exists
      // yet at this point for a user session to run it under.
      const { data: ours, error: oursError } = await supabaseAdmin.rpc(
        "custom_domain_name_taken",
        { p_name: domainPlan.name },
      );

      if (oursError) {
        // Closed, like the email lookup above: provisioning would lose this
        // name to the other couple on the unique index, and this couple would
        // pay for a name the studio already knew it could not buy them.
        console.error("[DOMAIN_TAKEN_LOOKUP_FAILED]", oursError);
        return NextResponse.json(
          {
            error:
              "Impossible de vérifier le nom de domaine pour le moment. " +
              "Merci de réessayer dans quelques instants.",
          },
          { status: 503 },
        );
      }
      if (ours) return domainTaken();

      try {
        const [result] = await searchDomains([domainPlan.name], { maxAgeMs: 0 });
        if (!result?.available) return domainTaken();
      } catch (searchError) {
        // Open, unlike the two lookups above: the order goes through on the
        // name the couple chose, and the purchase engine still checks it
        // before buying — a name taken in the meantime falls back to
        // `awaiting_choice`, and the couple picks another for free (D5).
        console.warn("[DOMAIN_SEARCH_UNREACHABLE]", searchError);
      }
    }

    // Order summary kept on the intent so a failed provisioning can always be
    // reconstructed from Stripe alone. This now carries the couple's identity
    // too, not just the basket: the webhook fallback provisions from this and
    // nothing else once the customer's browser is gone.
    const orderMetadata = buildOrderMetadata({
      plan: String(items.plan),
      modules: items.modules ?? [],
      languages: items.languages ?? [],
      extras: items.extras ?? [],
      email: email ? String(email) : undefined,
      themeId: items.themeId,
      animationId: items.animationId,
      adultsOnly: Boolean(items.adultsOnly),
      firstName: weddingInfo?.firstName,
      lastName: weddingInfo?.lastName,
      partnerName: weddingInfo?.partnerName,
      weddingDate: weddingInfo?.weddingDate,
      venue: weddingInfo?.venue,
      locale: weddingInfo?.locale,
      // The server's own plan, never `items.domain` as sent: provisioning
      // buys exactly this name for exactly these years.
      domainName: domainPlan.wanted ? domainPlan.name : undefined,
      domainYears: items.domainYears,
    });

    // Reprice the existing intent when the cart changed, so the customer can
    // never pay an amount captured before they edited their order.
    if (paymentIntentId) {
      try {
        const existing = await stripe.paymentIntents.retrieve(paymentIntentId);

        /*
         * A settled intent is spent, whoever paid it. This endpoint is only
         * ever asked for a payment form, so the answer is a usable one — an
         * intent that has already been charged cannot be charged again, and
         * refusing here refuses the WRONG order: the new one.
         *
         * `intentIdRef` outlives the order it belonged to. It is a ref on the
         * checkout component, never cleared once an order completes, so a
         * couple who buys and comes back — a second invitation, a new test —
         * re-enters the funnel with the previous order's id still in hand.
         * Stripe found it `succeeded` and this branch answered 409 "Cette
         * commande a déjà été réglée" over a basket nobody had paid for, then
         * the guard in the steps layout walked them back to /studio/start.
         *
         * A first fix compared the buyer's address and refused when it
         * matched, on the theory that the same buyer meant a genuine replay.
         * That was the common case, not the rare one: the couple buying again
         * is usually the same person. Same symptom, narrower.
         *
         * Falling through mints a fresh intent, which is what every other
         * unusable status already does below. Nothing is lost by it: the
         * settled intent keeps its own metadata and its own `wedding_id`, so
         * the order it paid for stays reconstructible from Stripe alone, and
         * `verifyPaymentForOrder` still refuses to provision twice from it.
         *
         * A real reload of the success page never reaches here — that path
         * carries `payment_success=true`, and the checkout skips intent
         * creation entirely while it is set.
         */
        if (REUSABLE_STATUSES.has(existing.status)) {
          // Always resync the metadata, not just when the amount moved: two
          // different baskets can cost the same (swapping one 45€ extra for
          // another, or one paid language for another). Skipping the update
          // there left Stripe describing the previous order, and Stripe is
          // what a failed provisioning is reconstructed from.
          //
          // Stripe merges metadata on update, so a key the new order no
          // longer has (a domain name swapped for « plus tard ») is sent as
          // "" to delete it — see `metadataForUpdate`.
          const existingMetadata = (existing.metadata ?? {}) as Record<string, string>;
          const metadataUpdate = metadataForUpdate(existingMetadata, orderMetadata);
          // What the intent will hold once Stripe applies the update: an
          // empty value is a deleted key, never a stored one.
          const afterUpdate = Object.fromEntries(
            Object.entries({ ...existingMetadata, ...metadataUpdate }).filter(
              ([, value]) => value !== "",
            ),
          );

          // Key order differs between our literal and Stripe's response, so
          // compare entries sorted rather than raw JSON.
          const stable = (m: Record<string, string>) =>
            JSON.stringify(Object.entries(m).sort());
          const metadataChanged = stable(existingMetadata) !== stable(afterUpdate);

          const updated =
            existing.amount === amountInCents && !metadataChanged
              ? existing
              : await stripe.paymentIntents.update(paymentIntentId, {
                  amount: amountInCents,
                  metadata: metadataUpdate,
                });

          return NextResponse.json({
            clientSecret: updated.client_secret,
            paymentIntentId: updated.id,
            amount,
          });
        }
      } catch {
        // Unknown or deleted intent — fall through and create a fresh one.
      }

      /*
       * Any other status — `succeeded` above all — falls through here on
       * purpose. A settled intent is spent: it cannot be charged again, so
       * the only useful answer to "give me a payment form" is a new intent.
       *
       * This used to answer 409 "Cette commande a déjà été réglée" instead,
       * which refused the WRONG order — the new one. `intentIdRef` is a ref on
       * the checkout component and is never cleared once an order completes,
       * so a couple who buys and comes back re-enters the funnel still
       * carrying the previous order's id. They saw that error over a basket
       * nobody had paid for, and the steps layout then walked them back to
       * /studio/start.
       *
       * Nothing is lost: the settled intent keeps its metadata and its
       * `wedding_id`, so the order it paid for stays reconstructible from
       * Stripe alone, and `verifyPaymentForOrder` still refuses to provision
       * from it twice. A genuine reload of the success page never reaches
       * this route — that path carries `payment_success=true`, and the
       * checkout skips intent creation entirely while it is set.
       */
    }

    // Reuse the Stripe customer for this email so repeat orders stay grouped.
    let customerId: string | undefined;
    if (email) {
      const existing = await stripe.customers.list({ email, limit: 1 });
      customerId =
        existing.data[0]?.id ??
        (
          await stripe.customers.create({
            email,
            metadata: { source: "wedding_checkout" },
          })
        ).id;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "eur",
      automatic_payment_methods: { enabled: true },
      ...(customerId ? { customer: customerId } : {}),
      metadata: orderMetadata,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
    });
  } catch (err: any) {
    console.error("[STRIPE_ERROR]", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
