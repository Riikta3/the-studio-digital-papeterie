"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";

export interface RsvpPayload {
  weddingId: string;
  name: string;
  attendance: boolean;
  guestCount: number;
  dietary: string;
  message: string;
}

export async function submitRsvp(payload: RsvpPayload) {
  const { error } = await supabaseAdmin.from("rsvp_responses").insert({
    wedding_id: payload.weddingId,
    name: payload.name,
    attendance: payload.attendance,
    guest_count: payload.guestCount,
    dietary: payload.dietary || null,
    message: payload.message || null,
  });

  if (error) {
    console.error("RSVP insert error:", error);
    throw new Error("Erreur lors de l'enregistrement de votre réponse.");
  }
}
