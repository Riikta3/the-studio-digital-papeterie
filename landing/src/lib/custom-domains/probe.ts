/**
 * Whether `url` answers over HTTPS with a certificate the runtime trusts
 * (docs/superpowers/specs/2026-10-02-custom-domain-design.md, D5, `registered`).
 *
 * Any HTTP answer at all means the TLS handshake completed, which is the only
 * question: until the row is `active` the proxy answers a couple's domain with
 * a 404 (D6), so the status says nothing. `fetch` verifies certificates by
 * default, so a missing or mismatched one (Vercel still serving its default
 * certificate) is an error, like a DNS or network failure or the 10 s
 * timeout. All of them mean "not yet".
 *
 * `timeoutMs` narrows the 10 s: the engine passes what is left of its step's
 * budget, so the `registered` step always ends inside its lease.
 */
export const PROBE_TIMEOUT_MS = 10_000;

export async function probeHttps(
  url: string,
  fetchImpl: typeof fetch = (input, init) => fetch(input, init),
  timeoutMs: number = PROBE_TIMEOUT_MS,
): Promise<boolean> {
  try {
    const response = await fetchImpl(url, {
      method: "HEAD",
      // A redirect is an answer; following it would test another host.
      redirect: "manual",
      signal: AbortSignal.timeout(Math.max(1, Math.min(PROBE_TIMEOUT_MS, timeoutMs))),
      cache: "no-store",
    });
    await response.body?.cancel().catch(() => {});
    return true;
  } catch {
    return false;
  }
}
