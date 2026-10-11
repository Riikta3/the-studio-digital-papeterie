import { NextResponse } from "next/server";

import { checkDomain, clientIp, createRateLimiter, parseCheckRequest } from "@/lib/custom-domain-check";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { searchDomains } from "@shared/lib/domain-search";

/**
 * Whether a `.com` is free for the studio's options step, as the couple types
 * (docs/superpowers/specs/2026-10-02-custom-domain-design.md, D3).
 *
 * `POST { label, partner1?, partner2?, connector?, year? }` →
 * `{ name, available, reason, alternatives }`; 400 `invalid` for a label the
 * studio cannot buy, 503 when nobody could vouch for the answer, 429 past the
 * limit below. The rules live in `@/lib/custom-domain-check`.
 *
 * Public, like the studio itself: no account exists yet at this step.
 */

/*
 * 30 checks a minute per client, in memory (see `createRateLimiter`). The
 * panel debounces by 400 ms and caches its answers, so a couple typing never
 * comes near it; what it stops is a script looping the endpoint, which would
 * spend Vercel's public search quota for every couple at once.
 */
const limiter = createRateLimiter({ limit: 30, windowMs: 60_000 });

export async function POST(req: Request) {
  const waitSeconds = limiter.hit(clientIp(req.headers));
  if (waitSeconds !== null) {
    return NextResponse.json(
      { error: "Trop de vérifications. Merci de patienter un instant." },
      { status: 429, headers: { "Retry-After": String(waitSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = null;
  }
  const request = parseCheckRequest(body);
  if (!request) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const answer = await checkDomain(request, {
    search: (names) => searchDomains(names),
    // Service role: the function is not granted to anon, since it would let
    // anyone probe which names our couples chose; here it only ever answers
    // « taken », never whose.
    nameTaken: (name) => supabaseAdmin.rpc("custom_domain_name_taken", { p_name: name }),
  });
  return NextResponse.json(answer.body, { status: answer.status });
}
