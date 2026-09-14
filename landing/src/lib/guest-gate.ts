import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";

/**
 * The guest code gate on a couple's invitation.
 *
 * A couple can set a code in Dashboard → Réglages. Until they do, their
 * invitation stays open to anyone holding the link, exactly as every
 * invitation is today — the gate is opt-in, not blanket, or deploying it
 * would shut off every invitation already in circulation.
 *
 * Once set, a guest types it once and is remembered by the cookie below.
 *
 * ── What this file does NOT do ────────────────────────────────────────────
 * It never sees the code. `verify_guest_code` compares inside Postgres and
 * answers true or false, so the secret never reaches this server, its logs, or
 * an error report. This file only decides who holds a valid pass.
 */

/** How long a guest stays admitted. */
const PASS_MAX_AGE_S = 60 * 60 * 24 * 30; // 30 days

/**
 * One cookie per wedding, not one for "the guest".
 *
 * A guest invited to two weddings holds two passes, and a pass minted for one
 * couple can never open another's invitation — the wedding id is inside the
 * signed payload as well as in the name, so renaming the cookie does not
 * transplant it.
 */
function cookieName(weddingId: string): string {
  return `inv_pass_${weddingId}`;
}

/**
 * The key the passes are signed with.
 *
 * `SUPABASE_SERVICE_ROLE_KEY` is reused rather than adding an env var nobody
 * would remember to set: it is present in every environment this runs in, it
 * is already a secret of the highest order, and it never leaves the server.
 * The signature is an HMAC of it — the key itself is not derivable from a
 * pass, so a leaked cookie reveals nothing about it.
 *
 * Rotating that key invalidates every outstanding pass, which is a correct
 * side effect rather than a problem: guests simply type their code again.
 */
function signingKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    // Fail closed. Without a key we cannot tell a real pass from a forged
    // one, and the safe reading of "cannot verify" is "not admitted".
    throw new Error("Cannot sign guest passes: SUPABASE_SERVICE_ROLE_KEY is unset.");
  }

  return key;
}

function sign(payload: string): string {
  return createHmac("sha256", signingKey()).update(payload).digest("base64url");
}

/**
 * `{expiry}.{weddingId}.{signature}` — opaque to the browser, checkable here.
 *
 * The fingerprint of the code in force is folded into the signature but not
 * written into the pass, so it cannot be read off the cookie and a pass stops
 * verifying the moment the couple changes their code. Without it, rotating a
 * code that had been forwarded to the wrong people would have changed nothing
 * for anyone already through the door.
 */
function mintPass(weddingId: string, fingerprint: string): string {
  const expiresAt = Date.now() + PASS_MAX_AGE_S * 1000;
  const payload = `${expiresAt}.${weddingId}`;

  return `${payload}.${sign(`${payload}.${fingerprint}`)}`;
}

/** Whether `value` is a pass this server issued for this wedding, still valid. */
function passIsValid(
  value: string | undefined,
  weddingId: string,
  fingerprint: string,
): boolean {
  if (!value) return false;

  const parts = value.split(".");
  if (parts.length !== 3) return false;

  const [expiresAt, signedWeddingId, signature] = parts;

  // Checked before the signature so a pass for another couple is rejected
  // even in the impossible case that it verifies.
  if (signedWeddingId !== weddingId) return false;

  const expiry = Number(expiresAt);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false;

  const expected = sign(`${expiresAt}.${signedWeddingId}.${fingerprint}`);

  // Constant-time: a plain `===` leaks how much of a forged signature was
  // right through how long the comparison took, which is enough to build a
  // valid one byte by byte.
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}

/**
 * Whether this visitor already holds a valid pass for this wedding.
 *
 * `fingerprint` is the one returned by `guest_code_fingerprint` for the code
 * currently in force; a pass signed against a previous code no longer
 * verifies.
 */
export async function hasGuestPass(
  weddingId: string,
  fingerprint: string,
): Promise<boolean> {
  const store = await cookies();

  return passIsValid(store.get(cookieName(weddingId))?.value, weddingId, fingerprint);
}

/** Remembers an admitted guest, so the code is typed once and not on every visit. */
export async function grantGuestPass(
  weddingId: string,
  fingerprint: string,
): Promise<void> {
  const store = await cookies();

  store.set(cookieName(weddingId), mintPass(weddingId, fingerprint), {
    httpOnly: true, // Not readable by scripts on the page.
    sameSite: "lax", // Survives following the invitation link from a message.
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PASS_MAX_AGE_S,
  });
}

/**
 * An opaque, stable-ish key for rate limiting one caller's attempts.
 *
 * Hashed, never stored raw: `rsvp_attempts` is explicitly documented as
 * holding no IP and no name, and that promise is kept here. The hash is
 * salted with the signing key so the table cannot be brute-forced back into
 * a list of the IP addresses that visited a wedding.
 *
 * Per wedding as well as per caller, so counting one couple's invitation
 * cannot throttle a guest arriving at another's.
 */
export async function callerBucket(weddingId: string): Promise<string> {
  const head = await headers();

  // Vercel sets `x-forwarded-for`; the first entry is the client. Absent in
  // local dev, where every caller shares one bucket — which only makes the
  // limit stricter, never looser.
  const ip = (head.get("x-forwarded-for") ?? "local").split(",")[0].trim();

  return createHmac("sha256", signingKey())
    .update(`gate:${weddingId}:${ip}`)
    .digest("hex")
    .slice(0, 32);
}

/** Unused today; kept so a "forget me" control has something to call. */
export async function revokeGuestPass(weddingId: string): Promise<void> {
  const store = await cookies();
  store.delete(cookieName(weddingId));
}
