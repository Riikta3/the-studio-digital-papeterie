"use server";

import { revalidatePath } from "next/cache";

import { requireWedding } from "@/lib/db/current-wedding";
import type { SendChannel } from "@shared/lib/invitation-sending";

/**
 * The "Envoi" screen: sending the invitation to each household from the
 * couple's own phone, and reminding those who have not answered.
 *
 * The message itself never goes through us — the screen opens WhatsApp or
 * the SMS app with it written. These actions only record what the couple did
 * (who was sent the invitation, when, by which channel) and keep their
 * wording.
 *
 * Projected before it reaches the client: no email, address, note or token,
 * only what the screen shows.
 */

const LOCALES = ["fr", "en", "de", "es", "pt", "it", "ar", "zh", "ja"] as const;

function revalidateSending() {
  for (const locale of LOCALES) {
    revalidatePath(`/${locale}/guests/envoi`);
    revalidatePath(`/${locale}/guests`);
  }
}

async function weddingForWrite() {
  try {
    return await requireWedding();
  } catch {
    return null;
  }
}

export type SendingHousehold = {
  id: string;
  name: string;
  phone: string | null;
  status: string | null;
  invitation_sent_at: string | null;
  invitation_channel: SendChannel | null;
  last_relance_at: string | null;
  reminder_count: number;
  firstNames: string[];
};

export type SendingData = {
  households: SendingHousehold[];
  invitationMessage: string | null;
  reminderMessage: string | null;
  /** The address guests open: the couple's own domain when it is live. */
  invitationUrl: string | null;
  coupleNames: string;
};

const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL || "https://www.thestudiopapeteriedigitale.com";

export async function getSendingData(): Promise<SendingData> {
  const { supabase, weddingId } = await requireWedding();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [householdsRes, settingsRes, siteRes, domainRes, profileRes] = await Promise.all([
    supabase
      .from("households")
      .select(
        "id, name, phone, status, invitation_sent_at, invitation_channel, last_relance_at, reminder_count, guests(first_name, is_child, created_at)",
      )
      .eq("wedding_id", weddingId)
      .order("name"),
    supabase
      .from("settings")
      .select("invitation_message, reminder_message")
      .eq("wedding_id", weddingId)
      .maybeSingle(),
    supabase.from("sites").select("slug, languages").eq("wedding_id", weddingId).maybeSingle(),
    supabase.from("custom_domains").select("name, status").eq("wedding_id", weddingId).maybeSingle(),
    user
      ? supabase.from("profiles").select("first_name, partner_name").eq("id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  type Row = Omit<SendingHousehold, "firstNames"> & {
    guests: { first_name: string | null; is_child: boolean | null; created_at: string }[] | null;
  };

  const households = ((householdsRes.data ?? []) as Row[]).map(({ guests, ...household }) => ({
    ...household,
    reminder_count: household.reminder_count ?? 0,
    // Adults first: "Paul et Claire" reads better than "Léo, Paul et Claire".
    firstNames: (guests ?? [])
      .slice()
      .sort((a, b) => Number(Boolean(a.is_child)) - Number(Boolean(b.is_child)) || a.created_at.localeCompare(b.created_at))
      .map((guest) => guest.first_name ?? "")
      .filter(Boolean),
  }));

  const domain = domainRes.data as { name: string | null; status: string } | null;
  const site = siteRes.data as { slug: string | null; languages: string[] | null } | null;
  const invitationUrl =
    domain?.status === "active" && domain.name
      ? `https://${domain.name}`
      : site?.slug
        ? `${LANDING_URL}/${site.languages?.[0] ?? "fr"}/invitation/${site.slug}`
        : null;

  const profile = profileRes.data as { first_name: string | null; partner_name: string | null } | null;

  return {
    households,
    invitationMessage: (settingsRes.data?.invitation_message as string | null) ?? null,
    reminderMessage: (settingsRes.data?.reminder_message as string | null) ?? null,
    invitationUrl,
    coupleNames: [profile?.first_name, profile?.partner_name].filter(Boolean).join(" & "),
  };
}

type Result = { success: true } | { success: false; error: string };

/**
 * Records that the couple opened WhatsApp/SMS for this household. An
 * invitation sets `invitation_sent_at` the first time only; a reminder bumps
 * the count and the date.
 */
export async function markHouseholdSent(
  householdId: string,
  channel: SendChannel,
  kind: "invite" | "remind",
): Promise<Result> {
  const wedding = await weddingForWrite();
  if (!wedding) return { success: false, error: "Vous devez être connecté" };
  const { supabase, weddingId } = wedding;

  const { data: current } = await supabase
    .from("households")
    .select("invitation_sent_at, reminder_count")
    .eq("id", householdId)
    .eq("wedding_id", weddingId)
    .maybeSingle();
  if (!current) return { success: false, error: "Foyer introuvable" };

  const now = new Date().toISOString();
  const update =
    kind === "invite"
      ? { invitation_sent_at: current.invitation_sent_at ?? now, invitation_channel: channel }
      : { last_relance_at: now, reminder_count: (current.reminder_count ?? 0) + 1, invitation_channel: channel };

  const { error } = await supabase
    .from("households")
    .update(update)
    .eq("id", householdId)
    .eq("wedding_id", weddingId);

  if (error) return { success: false, error: "Erreur lors de l'enregistrement." };
  revalidateSending();
  return { success: true };
}

/** "Not actually sent": back to the list of households to invite. */
export async function unmarkHouseholdSent(householdId: string): Promise<Result> {
  const wedding = await weddingForWrite();
  if (!wedding) return { success: false, error: "Vous devez être connecté" };
  const { supabase, weddingId } = wedding;

  const { error } = await supabase
    .from("households")
    .update({ invitation_sent_at: null, invitation_channel: null, last_relance_at: null, reminder_count: 0 })
    .eq("id", householdId)
    .eq("wedding_id", weddingId);

  if (error) return { success: false, error: "Erreur lors de l'enregistrement." };
  revalidateSending();
  return { success: true };
}

/** A number typed straight on the sending screen, for a household that had none. */
export async function saveHouseholdPhone(householdId: string, phone: string): Promise<Result> {
  const wedding = await weddingForWrite();
  if (!wedding) return { success: false, error: "Vous devez être connecté" };
  const { supabase, weddingId } = wedding;

  const { error } = await supabase
    .from("households")
    .update({ phone: phone.trim().slice(0, 40) || null })
    .eq("id", householdId)
    .eq("wedding_id", weddingId);

  if (error) return { success: false, error: "Erreur lors de l'enregistrement." };
  revalidateSending();
  return { success: true };
}

/** The couple's wording. An empty text goes back to the default one. */
export async function saveSendingMessages(messages: {
  invitation: string;
  reminder: string;
}): Promise<Result> {
  const wedding = await weddingForWrite();
  if (!wedding) return { success: false, error: "Vous devez être connecté" };
  const { supabase, weddingId } = wedding;

  const clean = (value: string) => value.trim().slice(0, 2000) || null;

  const values = { invitation_message: clean(messages.invitation), reminder_message: clean(messages.reminder) };
  const { data, error } = await supabase
    .from("settings")
    .update(values)
    .eq("wedding_id", weddingId)
    .select("id");

  // A wedding provisioned without a settings row: create it rather than
  // reporting a save that wrote nothing.
  const { error: insertError } =
    !error && (data ?? []).length === 0
      ? await supabase.from("settings").insert({ wedding_id: weddingId, ...values })
      : { error: null };

  if (error || insertError) return { success: false, error: "Erreur lors de l'enregistrement." };
  revalidateSending();
  return { success: true };
}
