import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Looks up an auth user by email across every page of results.
 *
 * `listUsers()` is paginated (50 per page by default), so scanning only the
 * first page silently misses existing accounts — which would create duplicate
 * users or drop billing records once the project passes 50 signups.
 */
export async function findUserByEmail(
  email: string,
): Promise<{ id: string; email?: string } | undefined> {
  const target = email.trim().toLowerCase();

  for (let page = 1; page <= 100; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) throw error;

    const users = data?.users ?? [];
    const match = users.find((u) => u.email?.toLowerCase() === target);
    if (match) return match;
    if (users.length === 0) break;
  }

  return undefined;
}
