"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/utils/supabase/server";

/**
 * Hands the signed-in couple a download link for one of their invoices.
 *
 * Invoices live in a private bucket — a PDF carries the customer's name and
 * address, so it must not sit behind a guessable public URL like the gallery
 * media does. The stored `invoice_url` is a storage path, not a link, and is
 * exchanged here for a short-lived signed URL.
 *
 * Ownership is re-checked server-side against the caller's session: the path
 * arrives from the browser, and trusting it would let anyone who guesses
 * another couple's invoice number download their invoice.
 */

/** How long a download link stays valid. Long enough to click, short enough
 *  that a copied URL in a browser history is not a lasting leak. */
const SIGNED_URL_TTL_SECONDS = 60;

export async function getInvoiceDownloadUrl(
  paymentIntentId: string,
): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Non authentifié" };

  // Looked up by payment intent rather than by path: the caller never gets to
  // name the file it wants, only the purchase it claims to own.
  const { data: invoice, error } = await supabaseAdmin
    .from("invoices")
    .select("pdf_path, user_id")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();

  if (error) {
    console.error("[getInvoiceDownloadUrl] query error:", error);
    return { error: "Impossible de récupérer la facture" };
  }

  if (!invoice) return { error: "Facture introuvable" };

  // The row is fetched with the admin client (RLS bypassed), so the ownership
  // check has to happen here explicitly.
  if (invoice.user_id !== user.id) {
    console.warn(
      `[getInvoiceDownloadUrl] user ${user.id} tried to read an invoice owned by ${invoice.user_id}`,
    );
    return { error: "Facture introuvable" };
  }

  if (!invoice.pdf_path) {
    // The invoice exists but its PDF failed to upload; it is regenerable from
    // the stored line items, so this is a support case rather than data loss.
    return { error: "Facture en cours de génération" };
  }

  const { data: signed, error: signError } = await supabaseAdmin.storage
    .from("invoices")
    .createSignedUrl(invoice.pdf_path, SIGNED_URL_TTL_SECONDS);

  if (signError || !signed) {
    console.error("[getInvoiceDownloadUrl] sign error:", signError);
    return { error: "Impossible de générer le lien de téléchargement" };
  }

  return { url: signed.signedUrl };
}
