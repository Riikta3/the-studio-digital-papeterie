import { createClient } from "./supabase/server";

/**
 * Generates a random UUID token for Magic Links.
 * Matches the 'uuid' type expected by the database.
 */
export function generateToken(): string {
  return crypto.randomUUID();
}

/**
 * Updates the household with a new magic link token.
 */
export async function createMagicLinkForHousehold(householdId: string) {
  const supabase = await createClient();
  const token = generateToken();
  const now = new Date();

  // Set expiration (e.g., 30 days from now)
  const expiresAt = new Date(now.setDate(now.getDate() + 30));

  const { error } = await supabase
    .from("households")
    .update({
      magic_link_token: token,
      // magic_link_expires_at: expiresAt.toISOString() // If we added this column
    })
    .eq("id", householdId);

  if (error) {
    throw new Error("Failed to create magic link token: " + error.message);
  }

  return token;
}
