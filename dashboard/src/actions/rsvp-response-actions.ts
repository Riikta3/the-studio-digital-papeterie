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
}: {
  id: string;
  admin_note: string;
  participants: Participant[];
  respondent_first_name?: string;
  respondent_last_name?: string;
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
      admin_note,
      participants,
      ...(respondent_first_name !== undefined && { respondent_first_name }),
      ...(respondent_last_name !== undefined && { respondent_last_name }),
    })
    .eq("id", id)
    .eq("wedding_id", wedding.id);

  if (error) throw new Error(error.message);

  revalidatePath("/rsvp-responses");
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

  revalidatePath("/rsvp-responses");
}
