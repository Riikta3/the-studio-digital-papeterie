"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";

export interface RsvpPayload {
  weddingId: string;
  firstName: string;
  lastName: string;
  attendance: boolean;
  guestCount: number;
  dietary: string;
  message: string;
}

export async function submitRsvp(payload: RsvpPayload) {
  const firstName = payload.firstName.trim();
  const lastName = payload.lastName.trim();
  const dietary = payload.dietary.trim();
  const message = payload.message.trim();

  const { error } = await supabaseAdmin.from("rsvp_responses").insert({
    wedding_id: payload.weddingId,
    name: `${firstName} ${lastName}`.trim(),
    respondent_first_name: firstName,
    respondent_last_name: lastName,
    attendance: payload.attendance,
    guest_count: payload.guestCount,
    dietary: dietary || null,
    message: message || null,
  });

  if (error) {
    console.error("RSVP insert error:", error);
    throw new Error("Erreur lors de l'enregistrement de votre réponse.");
  }
}
