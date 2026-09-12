"use server";

import { getLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { sendAuthEmail } from "@/lib/auth-email";
import { translateSupabaseError } from "@/lib/supabase-errors";
import { createClient } from "@/utils/supabase/server";

export async function getSettings() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Resolve actual wedding id (wedding.id != user.id)
  const { data: wedding } = await supabase
    .from("weddings")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!wedding) return null;

  const { data, error } = await supabase
    // Only `guest_code` is read by SettingsForm; the PGRST116 insert path
    // below still needs the full row shape, so `select()` there stays default.
    .from("settings")
    .select("guest_code")
    .eq("wedding_id", wedding.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      const { data: newSettings, error: insertError } = await supabase
        .from("settings")
        .insert([{ wedding_id: wedding.id }])
        .select()
        .single();

      if (insertError) {
        console.error("Error creating default settings:", insertError);
        return null;
      }
      return newSettings;
    }

    console.error("Error fetching settings:", error);
    return null;
  }

  return data;
}

export async function getProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get profile data
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, partner_name")
    .eq("id", user.id)
    .single();

  return {
    ...profile,
    email: user.email, // Email comes from auth.users
  };
}

export async function updateSettings(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non authentifié" };
  }

  const wedding_code = formData.get("wedding_code");
  const guest_code = formData.get("guest_code");

  const updates: Record<string, string | null> = {};

  if (wedding_code !== null) {
    updates.wedding_code = (wedding_code as string).trim() || null;
  }
  if (guest_code !== null) {
    updates.guest_code = (guest_code as string).trim()
      ? (guest_code as string).trim().toUpperCase()
      : null;
  }

  const value = updates.wedding_code; // kept for legacy compat below

  const { data: wedding } = await supabase
    .from("weddings")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!wedding) return { success: false, error: "Mariage introuvable" };

  const { error } = await supabase
    .from("settings")
    .update(Object.keys(updates).length ? updates : { wedding_code: value })
    .eq("wedding_id", wedding.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non authentifié" };
  }

  const firstName = formData.get("firstName") as string;
  const partnerName = formData.get("partnerName") as string;
  const weddingDate = formData.get("weddingDate") as string | null;

  // A date input yields "YYYY-MM-DD", which is exactly what a Postgres `date`
  // column wants — no Date round-trip, which would drag the value to UTC
  // midnight and risk shifting the day. Empty means "not set yet", so store
  // null rather than an invalid date.
  const weddingDateValue =
    weddingDate && /^\d{4}-\d{2}-\d{2}$/.test(weddingDate) ? weddingDate : null;

  // Update public.profiles
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: firstName,
      partner_name: partnerName,
    })
    .eq("id", user.id);

  // The date lives on public.weddings, not on profiles — the home page read it
  // off `profile.wedding_date`, a column that does not exist, so the countdown
  // silently had nothing to count.
  if (!error) {
    const { error: weddingError } = await supabase
      .from("weddings")
      .update({ wedding_date: weddingDateValue })
      .eq("user_id", user.id);

    if (weddingError) {
      return { success: false, error: weddingError.message };
    }
  }

  if (error) {
    return { success: false, error: "Erreur lors de la mise à jour du profil" };
  }

  revalidatePath("/settings");
  return { success: true };
}

/**
 * Starts an email address change.
 *
 * Through `sendAuthEmail` rather than `supabase.auth.updateUser({ email })`.
 * That call has Supabase send the messages itself, which is the one path that
 * still escaped our own templates: untranslated, off the studio's design, and
 * subject to the shared SMTP's handful-per-hour rate limit. Supabase still
 * mints and verifies both tokens — only delivery moves.
 *
 * Two emails, not one. `secure_email_change_enabled` makes Supabase require a
 * confirmation from the current address *and* the new one, so a stolen session
 * cannot move an account to an inbox its owner does not hold. Note that a local
 * run completes the change after the first link alone, because
 * `enable_confirmations = false` implies GOTRUE_MAILER_AUTOCONFIRM — production
 * demands both. See supabase/config.toml.
 */
export async function updateEmail(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "").trim();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { success: false, error: "Session expirée, reconnectez-vous." };
  }

  if (!email) {
    return { success: false, error: "Adresse email requise" };
  }

  if (email.toLowerCase() === user.email.toLowerCase()) {
    return { success: false, error: "C'est déjà votre adresse actuelle." };
  }

  const locale = await getLocale();

  // Sequential rather than concurrent: if minting the first link fails there is
  // no pending change, and sending only the second would ask the new inbox to
  // confirm something that was never started.
  const current = await sendAuthEmail({
    kind: "change_current",
    to: user.email,
    newEmail: email,
    locale,
  });

  if (!current.sent) {
    return {
      success: false,
      error: "Impossible d'envoyer l'email de confirmation. Réessayez.",
    };
  }

  await sendAuthEmail({
    kind: "change_new",
    to: user.email,
    newEmail: email,
    locale,
  });

  return {
    success: true,
    message:
      "Deux emails de confirmation ont été envoyés : un à votre adresse actuelle, un à la nouvelle. Confirmez les deux pour valider le changement.",
  };
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (password !== confirmPassword) {
    return { success: false, error: "Les mots de passe ne correspondent pas" };
  }

  if (password.length < 6) {
    return {
      success: false,
      error: "Le mot de passe doit faire au moins 6 caractères",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { success: false, error: translateSupabaseError(error.message) };
  }

  return { success: true, message: "Mot de passe mis à jour avec succès" };
}

export async function deleteAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non authentifié" };
  }

  // Use Admin Client to delete user from Auth (which cascades to DB via our migration)
  const adminClient = await import("@supabase/supabase-js").then(
    ({ createClient }) =>
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      ),
  );

  const { error } = await adminClient.auth.admin.deleteUser(user.id);

  if (error) {
    console.error("Delete account error:", error);
    return { success: false, error: "Erreur lors de la suppression du compte" };
  }

  // Sign out
  await supabase.auth.signOut();

  redirect("/");
}
