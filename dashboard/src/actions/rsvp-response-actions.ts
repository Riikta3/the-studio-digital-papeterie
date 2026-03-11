"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export interface Participant {
  first_name: string;
  last_name: string;
  relation_type?: string;
}

export async function updateRsvpResponse({
  id,
  admin_note,
  participants,
  respondent_first_name,
  respondent_last_name,
  attendance,
  dietary,
}: {
  id: string;
  admin_note: string;
  participants: Participant[];
  respondent_first_name?: string;
  respondent_last_name?: string;
  attendance?: boolean | null;
  dietary?: string;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Verify the response belongs to this user's wedding
  const { data: wedding } = await supabase
    .from("weddings")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!wedding) throw new Error("Wedding not found");

  const { error } = await supabase
    .from("rsvp_responses")
    .update({
      admin_note: admin_note.trim(),
      participants: participants.map((p) => ({
        ...p,
        first_name: p.first_name.trim(),
        last_name: p.last_name.trim(),
        relation_type: p.relation_type?.trim(),
      })),
      guest_count: participants.length,
      ...(respondent_first_name !== undefined && { respondent_first_name: respondent_first_name.trim() }),
      ...(respondent_last_name !== undefined && { respondent_last_name: respondent_last_name.trim() }),
      ...(attendance !== undefined && { attendance }),
      ...(dietary !== undefined && { dietary: dietary.trim() || null }),
    })
    .eq("id", id)
    .eq("wedding_id", wedding.id);

  if (error) throw new Error(error.message);

  for (const locale of ["fr", "en", "de", "es", "pt", "it", "ar", "zh", "ja"]) {
    revalidatePath(`/${locale}/rsvp-responses`);
  }
}

export async function createRsvpResponse({
  firstName,
  lastName,
  attendance,
  guestCount,
  dietary,
  message,
  adminNote,
  participants,
}: {
  firstName: string;
  lastName: string;
  attendance: boolean | null;
  guestCount: number;
  dietary: string;
  message: string;
  adminNote?: string;
  participants?: Participant[];
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: wedding } = await supabase
    .from("weddings")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!wedding) throw new Error("Wedding not found");

  const first = firstName.trim();
  const last = lastName.trim();

  const cleanParticipants = (participants ?? []).map((p) => ({
    ...p,
    first_name: p.first_name.trim(),
    last_name: p.last_name.trim(),
    relation_type: p.relation_type?.trim(),
  }));

  const { data, error } = await supabase
    .from("rsvp_responses")
    .insert({
      wedding_id: wedding.id,
      name: `${first} ${last}`.trim(),
      respondent_first_name: first,
      respondent_last_name: last,
      attendance,
      guest_count: cleanParticipants.length,
      dietary: dietary.trim() || null,
      message: message.trim() || null,
      admin_note: adminNote?.trim() || null,
      participants: cleanParticipants,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  for (const locale of ["fr", "en", "de", "es", "pt", "it", "ar", "zh", "ja"]) {
    revalidatePath(`/${locale}/rsvp-responses`);
  }

  return data;
}

export async function deleteRsvpResponse(id: string) {
  return deleteRsvpResponses([id]);
}

export async function deleteRsvpResponses(ids: string[]) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: wedding } = await supabase
    .from("weddings")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!wedding) throw new Error("Wedding not found");

  const { error } = await supabase
    .from("rsvp_responses")
    .delete()
    .in("id", ids)
    .eq("wedding_id", wedding.id);

  if (error) throw new Error(error.message);

  for (const locale of ["fr", "en", "de", "es", "pt", "it", "ar", "zh", "ja"]) {
    revalidatePath(`/${locale}/rsvp-responses`);
  }
}
