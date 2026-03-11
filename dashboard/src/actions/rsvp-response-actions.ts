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
}: {
  id: string;
  admin_note: string;
  participants: Participant[];
  respondent_first_name?: string;
  respondent_last_name?: string;
  attendance?: boolean | null;
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
    })
    .eq("id", id)
    .eq("wedding_id", wedding.id);

  if (error) throw new Error(error.message);

  for (const locale of ["fr", "en", "de", "es", "pt", "it", "ar", "zh", "ja"]) {
    revalidatePath(`/${locale}/rsvp-responses`);
  }
}

export async function deleteRsvpResponse(id: string) {
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
    .eq("id", id)
    .eq("wedding_id", wedding.id);

  if (error) throw new Error(error.message);

  for (const locale of ["fr", "en", "de", "es", "pt", "it", "ar", "zh", "ja"]) {
    revalidatePath(`/${locale}/rsvp-responses`);
  }
}
