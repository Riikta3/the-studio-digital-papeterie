"use server";

import { ActionResult } from "@/types";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getTables() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: [], error: "Unauthorized" };
  }

  const { data, error } = await supabase
    .from("tables")
    .select("*, guests(id, first_name, last_name, is_child, is_plus_one)")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching tables:", error);
    return { data: [], error: error.message };
  }

  return { data, error: null };
}

export async function createTable(
  prevState: any,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const name = formData.get("name") as string;
  const capacity = parseInt(formData.get("capacity") as string) || 8;
  const shape = (formData.get("shape") as string) || "round";

  const { error } = await supabase.from("tables").insert({
    wedding_id: user.id,
    name,
    capacity,
    shape,
    x_position: 100, // Default position
    y_position: 100,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/[locale]/seating-plan", "page");
  return { success: true };
}

export async function updateTablePosition(
  tableId: string,
  x: number,
  y: number,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("tables")
    .update({ x_position: x, y_position: y })
    .eq("id", tableId)
    .eq("wedding_id", user.id);

  if (error) {
    console.error("Error updating table position:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/[locale]/seating-plan", "page");
  return { success: true };
}

export async function deleteTable(tableId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // First, unassign guests
  await supabase
    .from("guests")
    .update({ table_id: null })
    .eq("table_id", tableId)
    .eq("wedding_id", user.id); // Security check on guests too, though table check covers it partially

  const { error } = await supabase
    .from("tables")
    .delete()
    .eq("id", tableId)
    .eq("wedding_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/[locale]/seating-plan", "page");
  return { success: true };
}
