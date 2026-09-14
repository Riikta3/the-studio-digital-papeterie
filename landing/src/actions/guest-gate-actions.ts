"use server";

import { createClient } from "@/utils/supabase/server";
import { callerBucket, grantGuestPass } from "@/lib/guest-gate";

/**
 * Checks a guest's code and, if it is right, admits them.
 *
 * The comparison happens inside Postgres (`verify_guest_code`), so the code
 * never travels to this server. All that comes back is true or false, and the
 * only thing this adds is the cookie that saves the guest typing it again.
 *
 * ── Why the wedding id is taken from the caller ───────────────────────────
 * The page has already resolved the slug to a wedding id before rendering the
 * gate, so passing it here avoids resolving it twice. It is not a secret —
 * `resolve_public_slug` hands it to anyone with the slug — and it grants
 * nothing on its own: the pass is only minted if `verify_guest_code` says the
 * code matches THIS wedding.
 */
export async function submitGuestCode(
  weddingId: string,
  code: string,
): Promise<{ ok: boolean; error?: string }> {
  const trimmed = code.trim();

  if (!weddingId || !trimmed) {
    return { ok: false, error: "Saisissez votre code d'accès." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("verify_guest_code", {
    p_wedding_id: weddingId,
    p_code: trimmed,
    p_bucket: await callerBucket(weddingId),
  });

  if (error) {
    console.error("[GUEST_GATE_VERIFY_FAILED]", error);
    return {
      ok: false,
      error: "Vérification impossible pour le moment. Réessayez dans un instant.",
    };
  }

  if (data !== true) {
    /*
     * One message for a wrong code and for too many attempts, because the
     * database deliberately answers the same for both. Telling a guesser
     * they have been throttled tells them the sweep was working and exactly
     * how long to wait; a real guest reads "wrong code" and looks at their
     * card again, which is what they would do anyway.
     */
    return { ok: false, error: "Ce code ne correspond pas. Vérifiez votre invitation." };
  }

  /*
   * The pass is signed with a fingerprint of the code that just opened the
   * door, so it stops verifying the moment the couple changes it. Fetched
   * after the check, never before: a caller who got the code wrong learns
   * nothing about it.
   */
  const { data: fingerprint } = await supabase.rpc("guest_code_fingerprint", {
    p_wedding_id: weddingId,
  });

  if (typeof fingerprint !== "string" || !fingerprint) {
    // The code verified a moment ago, so this is a race with the couple
    // clearing it — or a fault. Either way, minting a pass we cannot tie to a
    // code would be a pass nothing can ever revoke.
    return {
      ok: false,
      error: "Vérification impossible pour le moment. Réessayez dans un instant.",
    };
  }

  await grantGuestPass(weddingId, fingerprint);

  return { ok: true };
}
