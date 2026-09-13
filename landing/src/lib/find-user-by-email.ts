import { supabaseAdmin } from "@/lib/supabase-admin";

/** One page of the admin users endpoint, as much of it as we care about. */
interface AdminUser {
  id: string;
  email?: string;
}

/** Exact, case-insensitive email match within a page of results. */
function pick(users: AdminUser[], target: string): AdminUser | undefined {
  return users.find((u) => u.email?.trim().toLowerCase() === target);
}

/**
 * Looks up an auth user by email.
 *
 * Asks the auth server to do the searching, and only falls back to reading
 * every user if that finds nothing.
 *
 * ── Why not just page through everyone ────────────────────────────────────
 * That is what this did, and it cost a real order: `listUsers` pulled 1000
 * users per page and timed out (504) while a customer was checking out. The
 * payment endpoint calls this before it will take any money, so a slow lookup
 * is a refused sale — and the cost grows with every signup, which is exactly
 * backwards.
 *
 * ── Why the filter is not trusted on its own ──────────────────────────────
 * GoTrue's `filter` is a substring match and is case-sensitive: searching
 * "tarik" returns tarik.klezo@gmail.com, and searching
 * "TARIK.KLEZO@GMAIL.COM" returns nothing at all. So it is used only to
 * narrow the candidates, and the exact comparison below is what decides —
 * otherwise a couple whose address merely contains an existing one would be
 * refused a purchase they are entitled to make.
 *
 * The full scan remains as a fallback for the one case the filter gets wrong:
 * an address stored in a different case than it was typed. It runs only when
 * the filter came back empty, which on a hit is never.
 */
export async function findUserByEmail(
  email: string,
): Promise<{ id: string; email?: string } | undefined> {
  const target = email.trim().toLowerCase();
  if (!target) return undefined;

  // 1. Ask the auth server to narrow it down.
  const { data: filtered, error: filterError } =
    await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 50,
      // Not in the typed options, but the endpoint has accepted it since
      // GoTrue v2 and the SDK forwards unknown keys as query parameters.
      ...({ filter: target } as { filter: string }),
    });

  // A failure here is not fatal on its own: the scan below can still answer.
  // It is only reported if that fails too.
  if (!filterError) {
    const match = pick((filtered?.users ?? []) as AdminUser[], target);
    if (match) return match;
  }

  // 2. Nothing matched. Either the address is genuinely free, or it is stored
  // in a case the filter could not see. Read the roll to be certain — this is
  // the branch that used to run every time.
  for (let page = 1; page <= 100; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) {
      // Both routes failed, so we genuinely do not know. Callers treat this
      // as "cannot verify" and refuse to take a payment, which is the right
      // way to be wrong.
      throw error;
    }

    const users = (data?.users ?? []) as AdminUser[];
    const match = pick(users, target);
    if (match) return match;
    if (users.length === 0) break;
  }

  return undefined;
}
