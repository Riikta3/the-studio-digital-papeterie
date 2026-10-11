import { supabaseAdmin } from "@/lib/supabase-admin";

import {
  NOTICE_BATCH,
  REMINDER_AFTER_DAYS,
  REMINDER_GIVE_UP_DAYS,
  STUDIO_ALERT_RETRY_DAYS,
  UNSENT_RETRY_DAYS,
} from "./advance";
import type { CoupleContact, CustomDomainRow, CustomDomainsDb, NoticeCode } from "./advance";

/**
 * The purchase engine's database, through the service-role client
 * (supabase/migrations/20261002120000_custom_domains.sql and
 * 20261002130000_custom_domains_hardening.sql).
 *
 * The service role is the only writer of `custom_domains` (D8): couples read
 * their row through RLS and have no write privilege at all, and the claim and
 * notice functions are executable by the service role alone. The engine runs
 * without a user session — the cron, or after() once the response is gone —
 * so it could not run under one anyway.
 *
 * Every write the engine makes goes through `update`, conditioned on the
 * lease token minted by the claim. The email windows and batch size live in
 * advance.ts, so the tests' fake table applies the same ones.
 */

const DAY = 24 * 60 * 60 * 1000;

const iso = (ms: number) => new Date(ms).toISOString();

function fail(what: string, error: { message: string }): never {
  throw new Error(`custom_domains: ${what} failed (${error.message})`);
}

const asRows = (data: unknown): CustomDomainRow[] => (Array.isArray(data) ? (data as CustomDomainRow[]) : []);

export const adminCustomDomainsDb: CustomDomainsDb = {
  async claim(id) {
    const { data, error } = await supabaseAdmin.rpc("claim_custom_domain", { p_id: id });
    if (error) fail("claim_custom_domain", error);
    return asRows(data)[0] ?? null;
  },

  async claimDue(limit) {
    const { data, error } = await supabaseAdmin.rpc("claim_due_custom_domains", { p_limit: limit });
    if (error) fail("claim_due_custom_domains", error);
    return asRows(data);
  },

  async update(id, leaseToken, patch, opts = {}) {
    let query = supabaseAdmin.from("custom_domains").update(patch).eq("id", id).eq("lease_token", leaseToken);
    // What the write expects of the row besides its lease: the write-ahead
    // before a buy requires it still queued for the same name and years, the
    // order id requires it still purchasing.
    const { status, name, years } = opts.expect ?? {};
    if (status !== undefined) query = query.eq("status", status);
    if (name !== undefined) query = name === null ? query.is("name", null) : query.eq("name", name);
    if (years !== undefined) query = query.eq("years", years);
    // `select` so the answer says how many rows matched: none means the
    // lease was lost, and the engine stops.
    const { data, error } = await query.select("id");
    if (error) fail("update", error);
    return (data?.length ?? 0) > 0;
  },

  async claimNotice(id, code) {
    const { data, error } = await supabaseAdmin.rpc("claim_custom_domain_notice", { p_id: id, p_code: code });
    if (error) fail("claim_custom_domain_notice", error);
    return data === true;
  },

  async releaseNotice(id, code) {
    const { error } = await supabaseAdmin.rpc("release_custom_domain_notice", { p_id: id, p_code: code });
    if (error) fail("release_custom_domain_notice", error);
  },

  async loadCoupleContact(weddingId, siteId): Promise<CoupleContact | null> {
    const { data: wedding, error } = await supabaseAdmin
      .from("weddings")
      .select("user_id, partner_name")
      .eq("id", weddingId)
      .maybeSingle();
    if (error) fail("weddings lookup", error);
    if (!wedding?.user_id) return null;

    const [user, profile, site] = await Promise.all([
      supabaseAdmin.auth.admin.getUserById(wedding.user_id),
      supabaseAdmin.from("profiles").select("first_name, partner_name").eq("id", wedding.user_id).maybeSingle(),
      supabaseAdmin.from("sites").select("languages").eq("id", siteId).maybeSingle(),
    ]);
    if (user.error) {
      // The account is gone: nobody to write to, like an account with no address.
      if (user.error.status === 404) return null;
      fail("auth user lookup", user.error);
    }
    const email = user.data.user?.email;
    if (!email) return null;

    // The names are a courtesy and the language only picks the dashboard's;
    // neither is worth losing the email over.
    const languages = site.data?.languages;
    return {
      email,
      firstName: profile.data?.first_name ?? undefined,
      partnerName: profile.data?.partner_name ?? wedding.partner_name ?? undefined,
      // The first language is the couple's own (shared/lib/pricing.ts, computeOrderTotal).
      locale: Array.isArray(languages) && typeof languages[0] === "string" ? languages[0] : "fr",
    };
  },

  async findReminderDue(now) {
    const { data, error } = await supabaseAdmin
      .from("custom_domains")
      .select("*")
      .eq("status", "awaiting_choice")
      .lte("status_changed_at", iso(now.getTime() - REMINDER_AFTER_DAYS * DAY))
      .gte("status_changed_at", iso(now.getTime() - REMINDER_GIVE_UP_DAYS * DAY))
      .not("notices_sent", "cs", "{reminder}")
      .order("status_changed_at")
      .limit(NOTICE_BATCH);
    if (error) fail("reminder lookup", error);
    return asRows(data);
  },

  async findUnsentNotices(now) {
    const unsent = (status: string, code: NoticeCode | "studio_failed", days: number) => {
      let query = supabaseAdmin
        .from("custom_domains")
        .select("*")
        .eq("status", status)
        .gte("status_changed_at", iso(now.getTime() - days * DAY))
        .not("notices_sent", "cs", `{${code}}`);
      // Only a lost name warrants this email; « plus tard » gets the reminder.
      if (code === "name_unavailable") query = query.eq("last_error", "name_unavailable");
      return query.order("status_changed_at").limit(NOTICE_BATCH);
    };

    const [active, lost, failed] = await Promise.all([
      unsent("active", "active", UNSENT_RETRY_DAYS),
      unsent("awaiting_choice", "name_unavailable", UNSENT_RETRY_DAYS),
      // A failed row whose studio alert could not be sent (spec D5, "Studio alerts are durable").
      unsent("failed", "studio_failed", STUDIO_ALERT_RETRY_DAYS),
    ]);
    if (active.error) fail("unsent active lookup", active.error);
    if (lost.error) fail("unsent name_unavailable lookup", lost.error);
    if (failed.error) fail("unsent studio_failed lookup", failed.error);
    return [
      ...asRows(active.data).map((row) => ({ row, code: "active" as const })),
      ...asRows(lost.data).map((row) => ({ row, code: "name_unavailable" as const })),
      ...asRows(failed.data).map((row) => ({ row, code: "studio_failed" as const })),
    ];
  },
};
