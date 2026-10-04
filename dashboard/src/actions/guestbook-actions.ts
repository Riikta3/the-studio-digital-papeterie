"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Deletes one guestbook message under the couple's own session: RLS only lets
 * the owner of the wedding delete (`guestbook_messages` "Owner can delete"),
 * and the `wedding_id` filter keeps the request to their wedding regardless.
 */
export async function deleteGuestbookMessage(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: wedding } = await supabase
    .from("weddings")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!wedding) throw new Error("Wedding not found");

  const { data, error } = await supabase
    .from("guestbook_messages")
    .delete()
    .eq("id", id)
    .eq("wedding_id", wedding.id)
    .select("id");

  if (error) throw new Error(error.message);
  // RLS turns a refused delete into zero rows, not an error.
  if (!data || data.length === 0) throw new Error("Message not found");

  revalidatePath("/[locale]/messages", "page");
}
