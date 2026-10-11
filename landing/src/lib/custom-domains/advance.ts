import type { DomainAvailability } from "@shared/lib/domain-search";
import { DOMAIN_MAX_USD_PER_YEAR, domainPrice, parseDomainYears } from "@shared/lib/pricing";
import type { Database } from "@shared/types/supabase";

import { REQUEST_TIMEOUT_MS, RegistrarError } from "./vercel-registrar";
import type { AttachOptions, CallOptions, OwnedDomain, Registrar, RegistrantContact } from "./vercel-registrar";

/**
 * The purchase engine: it takes a paid `custom_domains` row from `queued` to
 * `active` (docs/superpowers/specs/2026-10-02-custom-domain-design.md, D5).
 *
 *   queued ─► purchasing ─► registered ─► active
 *     │            │             └─► failed (no certificate after 48 h)
 *     │            └─► awaiting_choice (unavailable-legal) / failed
 *     └─► awaiting_choice (name taken) / failed (price above the ceiling)
 *
 * Each call performs ONE step of one row, under a lease the database hands
 * out (`claim_custom_domain`, `claim_due_custom_domains`). It runs right after
 * a payment (`after()`, see `engine.ts`) and every 5 minutes from the cron, and
 * both can run at once, or twice, or die halfway. The rules that make that
 * safe — this code spends real money:
 *
 * - The lease is owned. A claim mints `lease_token`, and every write here is
 *   conditioned on it. A write that matches no row means another run holds the
 *   row now: the step stops on the spot, without acting or writing again.
 * - The `purchasing` marker is written BEFORE the buy call, conditioned on the
 *   row still being `queued` with the same name and years. A run that loses
 *   that write never buys.
 * - A purchase whose outcome is unknown is never the couple's problem: a buy
 *   call without a clear answer, an order id that could not be saved, or a
 *   process that died in the call leaves the row `purchasing` with no order
 *   id. It is then never bought again, never requeued and never called
 *   taken: the account is checked at +30 min, +2 h, +6 h and +24 h, then the
 *   row is failed and the studio told to look at Vercel. Only a definitive
 *   refusal of the buy call (a documented 4xx code) may requeue the row or
 *   send it back to the couple.
 * - Every step has a 90 s budget, and every Vercel call within it gets
 *   `min(20 s, what is left)`, so a step always ends inside its 2-minute lease.
 * - Every write resets `claims_since_progress`; a claim finding 3 means the
 *   claims before it died without writing, and the row is failed instead of
 *   being run again forever.
 * - A thrown error is a failure of the step: +2, +10, +30, +120 minutes, and
 *   the fifth in a row fails the row. Waiting — for an order, a certificate,
 *   Vercel's rate limit or a fixed token — is not a failure.
 * - Every `failed` alerts the studio, durably: the alert is claimed in
 *   `notices_sent` (`studio_failed`) like the couple's emails, given back if
 *   the send fails, and the cron sends the ones still owed.
 *
 * All I/O is injected (`AdvanceDeps`), so every branch is tested against
 * fakes; `engine.ts` assembles the real dependencies.
 */

export type CustomDomainRow = Database["public"]["Tables"]["custom_domains"]["Row"];

export type CustomDomainStatus = "awaiting_choice" | "queued" | "purchasing" | "registered" | "active" | "failed";

/** What the engine may write. Identity, ownership, the lease and the notices are not its to set here. */
export type CustomDomainPatch = Partial<
  Omit<CustomDomainRow, "id" | "site_id" | "wedding_id" | "created_at" | "lease_token" | "notices_sent">
>;

/** The couple's emails, each sent once per name (`notices_sent`). */
export type NoticeCode = "active" | "name_unavailable" | "reminder";

/**
 * The studio's alerts, claimed in `notices_sent` like the couple's emails so
 * that none is lost or doubled: `studio_failed` for a failed row,
 * `studio_auth` while Vercel refuses our token (once per row and incident).
 */
export type StudioNoticeCode = "studio_failed" | "studio_auth";

/** What a conditioned write expects of the row, besides its lease. */
export interface RowExpectation {
  status?: CustomDomainStatus;
  name?: string | null;
  years?: number;
}

export interface CoupleContact {
  email: string;
  firstName?: string;
  partnerName?: string;
  /** The site's first language, for the dashboard link. */
  locale: string;
}

/** Every database access the engine makes, so the tests can replace them all. */
export interface CustomDomainsDb {
  /** `claim_custom_domain`: the leased row, or null when it is not due or someone else holds it. */
  claim(id: string): Promise<CustomDomainRow | null>;
  /** `claim_due_custom_domains`: up to `limit` due rows, each leased. */
  claimDue(limit: number): Promise<CustomDomainRow[]>;
  /**
   * Applies `patch` where `id` and `lease_token` match — and every column of
   * `expect`, when given. True when a row was written; false means the lease
   * was lost (or the row changed) and the caller must stop.
   */
  update(id: string, leaseToken: string, patch: CustomDomainPatch, opts?: { expect?: RowExpectation }): Promise<boolean>;
  /** `claim_custom_domain_notice`: true only for the one caller that added the code. */
  claimNotice(id: string, code: NoticeCode | StudioNoticeCode): Promise<boolean>;
  /** `release_custom_domain_notice`, after a failed send. */
  releaseNotice(id: string, code: NoticeCode | StudioNoticeCode): Promise<void>;
  /** The couple's address and names, or null when there is nobody to write to. */
  loadCoupleContact(weddingId: string, siteId: string): Promise<CoupleContact | null>;
  /**
   * `awaiting_choice` rows whose status is REMINDER_AFTER_DAYS to
   * REMINDER_GIVE_UP_DAYS old and that have had no reminder.
   */
  findReminderDue(now: Date): Promise<CustomDomainRow[]>;
  /**
   * The emails still owed, so the next run sends them: an `active` or
   * `name_unavailable` email released after a failed send (or never sent: the
   * checkout's own lost-name row) within UNSENT_RETRY_DAYS, and the studio's
   * alert of a `failed` row within STUDIO_ALERT_RETRY_DAYS. Without this, a
   * release would retry nothing: the engine never claims those rows again.
   */
  findUnsentNotices(now: Date): Promise<Array<{ row: CustomDomainRow; code: NoticeCode | "studio_failed" }>>;
}

export interface CoupleNotice {
  code: NoticeCode;
  /** Null for a name lost to another of our couples, or never chosen. */
  name: string | null;
  contact: CoupleContact;
}

export interface StudioAlert {
  id: string;
  name: string | null;
  siteId: string;
  weddingId: string;
  /** The row's status now: `failed`, or the status it waits in (an auth alert). */
  status: string;
  /** Where the row was before. */
  previousStatus: string;
  lastError: string;
  orderId: string | null;
  attempts: number;
  /** Whether a Vercel order may exist for this row: the studio must look before relaunching it. */
  orderMayExist: boolean;
  /** Vercel's own answer (status, code, message), when there is one. Never the token. */
  detail?: string;
}

export interface Mailer {
  sendCoupleNotice(notice: CoupleNotice): Promise<{ sent: boolean }>;
  sendStudioAlert(alert: StudioAlert): Promise<{ sent: boolean }>;
}

/** `searchDomains` from shared/lib/domain-search.ts, or a fake. */
export type DomainSearch = (
  names: string[],
  opts: { maxAgeMs: number; timeoutMs?: number },
) => Promise<DomainAvailability[]>;

export interface AdvanceDeps {
  db: CustomDomainsDb;
  /** Null when the Vercel variables are missing: every row is failed, nothing is called. */
  registrar: Registrar | null;
  /** Null when the registrant variables are missing or invalid: nothing is bought. */
  contact: RegistrantContact | null;
  search: DomainSearch;
  /** `probeHttps`, or a fake. */
  probe: (url: string, opts?: CallOptions) => Promise<boolean>;
  mailer: Mailer;
  now: () => Date;
  /** Waits between the tries of a write that must not be lost. Defaults to a timer. */
  sleep?: (ms: number) => Promise<void>;
  /** Defaults to STEP_BUDGET_MS. */
  stepBudgetMs?: number;
  /** Defaults to MAIL_TIMEOUT_MS. */
  mailTimeoutMs?: number;
}

export type AdvanceOutcome =
  /** Not due, someone else's lease, or not a step the engine performs. */
  | "not_claimed"
  /** A write matched no row: another run holds it now. Nothing more was done. */
  | "lost_lease"
  /** The step threw; it runs again after the backoff. */
  | "retry"
  /** Waiting for an order, a certificate, or the first check of an unconfirmed buy; or out of time. */
  | "waiting"
  /** A buy whose outcome is unknown: the account is checked on a schedule. */
  | "unconfirmed"
  /** Vercel refuses our token: the studio is alerted, the row looks again in 30 minutes. */
  | "unauthorized"
  /** Vercel's rate limit: the row looks again when it says. */
  | "rate_limited"
  /** The buy call answered with an order. */
  | "purchasing"
  /** Back to `queued`: a price that moved. */
  | "requeued"
  | "registered"
  | "awaiting_choice"
  | "active"
  | "failed"
  /** Something failed and could not even be recorded. */
  | "error";

// ── Timings ─────────────────────────────────────────────────────────────────

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

/** Failures in a row before the row is failed. */
export const MAX_FAILURES = 5;
/**
 * The wait after the 1st, 2nd, 3rd and 4th failure in a row; the 5th fails
 * the row. The spec's list ends with +360, which "the fifth failure → failed"
 * leaves no failure to use (reported, 2026-10-02).
 */
export const BACKOFF_MINUTES = [2, 10, 30, 120] as const;
/** Rows the cron advances per run, each in its own lease. */
export const DUE_BATCH = 10;

/** When a buy whose outcome is unknown is checked, counted from `purchase_started_at`. The last one fails it. */
export const UNCONFIRMED_CHECK_MINUTES = [30, 120, 360, 1440] as const;
/** An order still pending this long after the buy call is failed, with an alert. */
const ORDER_DEADLINE_MINUTES = 24 * 60;
const ORDER_POLL_MINUTES = 2;
const REQUOTE_MINUTES = 2;
const CERTIFICATE_POLL_MINUTES = 5;
const CERTIFICATE_DEADLINE_MINUTES = 48 * 60;
/** A claim finding this many claims without a write is a step that keeps killing its process. */
const STUCK_CLAIMS = 3;
/** How long a row waits while Vercel refuses our token. */
const AUTH_RETRY_MINUTES = 30;
/** A 429 without Retry-After; and the longest any Retry-After is honoured. */
const RATE_LIMIT_DEFAULT_MS = 5 * MINUTE;
const RATE_LIMIT_MAX_MS = DAY;

/** One step, every call included: well inside the 2-minute lease. */
export const STEP_BUDGET_MS = 90_000;
/** Below this, a call is not worth starting: the step ends and resumes on the next run. */
const MIN_CALL_MS = 1_000;
/** The HTTPS probe's own cap (probe.ts). */
const PROBE_TIMEOUT_MS = 10_000;
/** The buy call never starts without its full timeout plus this, for the writes around it. */
const BUY_MARGIN_MS = 5_000;
/** Tries of the order-id write, and the waits between them. */
const ORDER_ID_RETRY_MS = [250, 1_000] as const;
/** One email, Resend included. */
export const MAIL_TIMEOUT_MS = 10_000;
/** The cron stops starting emails after this, inside its maxDuration of 300 s. */
export const RUN_BUDGET_MS = 240_000;

// Which emails the cron still owes, and for how long (read by db.ts and the fakes).
/** Rows per email lookup and per run: more wait for the next one, 5 minutes later. */
export const NOTICE_BATCH = 20;
/** The reminder goes out once, 7 days after the row started waiting for a name… */
export const REMINDER_AFTER_DAYS = 7;
/** …and stops being retried 30 days in, so a send that keeps failing is not tried every 5 minutes for ever. */
export const REMINDER_GIVE_UP_DAYS = 30;
/** How long a released `active` or `name_unavailable` email is retried. */
export const UNSENT_RETRY_DAYS = 7;
/** How long a studio alert that could not be sent is retried. */
export const STUDIO_ALERT_RETRY_DAYS = 30;

/**
 * The buy call's refusals Vercel documents (its OpenAPI, 2026-10-02): each
 * is answered before any order exists. The first two are handled on their
 * own; the others fail the row at once. Any other answer — a 5xx, a timeout,
 * a 4xx not listed here — may have placed an order.
 */
const DEFINITIVE_BUY_REFUSALS = new Set([
  "domain_not_available",
  "expected_price_mismatch",
  "order_too_expensive",
  "tld_not_supported",
  "domain_too_short",
  "invalid_additional_contact_info",
  "additional_contact_info_required",
  "emoji_tld_not_supported",
  "language_code_required",
]);

const iso = (ms: number) => new Date(ms).toISOString();

const realSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// ── Errors ────────────────────────────────────────────────────────────────────

/** Thrown by `write` when the conditioned update matched nothing. */
class LeaseLost extends Error {}

/** Thrown before a call the step's budget can no longer afford. Not a failure. */
class OutOfBudget extends Error {}

/** An answer the engine refuses to act on, with the code it records. */
class StepError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "StepError";
    this.code = code;
  }
}

/** The machine code a failure is recorded under in `last_error`. */
function errorCode(error: unknown): string {
  if (error instanceof RegistrarError || error instanceof StepError) return error.code;
  return "unexpected_error";
}

const isUnauthorized = (error: unknown): error is RegistrarError =>
  error instanceof RegistrarError && (error.status === 401 || error.status === 403);

const isRateLimited = (error: unknown): error is RegistrarError =>
  error instanceof RegistrarError && error.status === 429;

/** Vercel's answer for a human. RegistrarError messages name the call, never the token. */
const detailOf = (error: RegistrarError) => `${error.status} ${error.code}: ${error.message}`;

// ── Emails, couple and studio ─────────────────────────────────────────────────

const TIMED_OUT = Symbol("timed out");

/** `promise`, or TIMED_OUT once the mail timeout has passed. The send itself is not cancelled. */
async function withinMailTimeout<T>(deps: AdvanceDeps, promise: Promise<T>): Promise<T | typeof TIMED_OUT> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<typeof TIMED_OUT>((resolve) => {
    timer = setTimeout(() => resolve(TIMED_OUT), deps.mailTimeoutMs ?? MAIL_TIMEOUT_MS);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Sends one of the couple's emails at most once: claimed in the database
 * first, released after a failed send so a later run retries. A send that
 * times out stays claimed — it may have gone out, and at most once is
 * preferred to duplicates (spec D5, "Accepted risk"). Never throws, and never
 * affects the row's outcome.
 */
export async function sendNotice(
  deps: AdvanceDeps,
  row: CustomDomainRow,
  code: NoticeCode,
): Promise<"sent" | "skipped" | "failed"> {
  let claimed = false;
  try {
    claimed = await deps.db.claimNotice(row.id, code);
    if (!claimed) return "skipped";

    const contact = await deps.db.loadCoupleContact(row.wedding_id, row.site_id);
    if (!contact) {
      console.error("[DOMAIN_NOTICE_NO_RECIPIENT]", { id: row.id, code });
    } else {
      const result = await withinMailTimeout(deps, deps.mailer.sendCoupleNotice({ code, name: row.name, contact }));
      if (result === TIMED_OUT) {
        console.error("[DOMAIN_NOTICE_TIMEOUT] kept claimed: it may have been sent", { id: row.id, code });
        return "failed";
      }
      if (result.sent) return "sent";
    }
  } catch (error) {
    console.error("[DOMAIN_NOTICE_FAILED]", { id: row.id, code }, error);
  }

  if (claimed) {
    try {
      await deps.db.releaseNotice(row.id, code);
    } catch (error) {
      console.error("[DOMAIN_NOTICE_NOT_RELEASED]", { id: row.id, code }, error);
    }
  }
  return "failed";
}

/** Where the row probably was before it failed, for an alert sent later by the cron. */
function inferredPreviousStatus(row: CustomDomainRow): string {
  if (row.registered_at) return "registered";
  if (row.purchase_started_at || row.vercel_order_id) return "purchasing";
  return "queued";
}

/** A buy may have reached Vercel and the domain is not known to be ours: the studio must look before relaunching. */
const orderMayExist = (row: CustomDomainRow): boolean =>
  row.registered_at === null && (Boolean(row.vercel_order_id) || row.purchase_started_at !== null);

function studioAlertOf(row: CustomDomainRow, opts: { previousStatus?: string; detail?: string } = {}): StudioAlert {
  return {
    id: row.id,
    name: row.name,
    siteId: row.site_id,
    weddingId: row.wedding_id,
    status: row.status,
    previousStatus: opts.previousStatus ?? inferredPreviousStatus(row),
    lastError: row.last_error ?? "unknown",
    orderId: row.vercel_order_id,
    attempts: row.attempts,
    orderMayExist: orderMayExist(row),
    ...(opts.detail ? { detail: opts.detail } : {}),
  };
}

/**
 * Sends the studio an alert about `row`, at least once: claimed under `code`
 * first, released after a failed or timed-out send (a duplicate alert is
 * harmless, a lost one is not), and the cron sends the `studio_failed` ones
 * still owed. `fresh` starts over for a new failure of a row relaunched by
 * hand, whose last failure's code is still there. Never throws.
 */
export async function alertStudio(
  deps: AdvanceDeps,
  row: CustomDomainRow,
  code: StudioNoticeCode,
  opts: { previousStatus?: string; detail?: string; fresh?: boolean } = {},
): Promise<"sent" | "skipped" | "failed"> {
  const alert = studioAlertOf(row, opts);
  let claimed = false;
  try {
    if (opts.fresh && row.notices_sent.includes(code)) await deps.db.releaseNotice(row.id, code);
    claimed = await deps.db.claimNotice(row.id, code);
    if (!claimed) return "skipped";
    const result = await withinMailTimeout(deps, deps.mailer.sendStudioAlert(alert));
    if (result !== TIMED_OUT && result.sent) return "sent";
    console.error("[DOMAIN_ALERT_NOT_SENT] released for the next run", { id: row.id, code, timedOut: result === TIMED_OUT });
  } catch (error) {
    console.error("[DOMAIN_ALERT_FAILED]", { id: row.id, code }, error);
  }

  if (claimed) {
    try {
      await deps.db.releaseNotice(row.id, code);
    } catch (error) {
      console.error("[DOMAIN_ALERT_NOT_RELEASED]", { id: row.id, code }, error);
    }
  }
  return "failed";
}

/** The last resort, when the row itself cannot be written: no claim, one try. */
async function alertStudioDirectly(deps: AdvanceDeps, alert: StudioAlert): Promise<void> {
  console.error("[DOMAIN_STUDIO_ALERT]", alert);
  try {
    const result = await withinMailTimeout(deps, deps.mailer.sendStudioAlert(alert));
    if (result === TIMED_OUT || !result.sent) console.error("[DOMAIN_ALERT_NOT_SENT] (direct, logged above)", { id: alert.id });
  } catch (error) {
    console.error("[DOMAIN_ALERT_FAILED] (direct, logged above)", { id: alert.id }, error);
  }
}

// ── One step ──────────────────────────────────────────────────────────────────

interface Step {
  row: CustomDomainRow;
  lease: string;
  deps: AdvanceDeps;
  /** The row's status in the database, as this step last wrote it. */
  status: string;
  /** When the step's budget runs out, in the clock's milliseconds. */
  deadline: number;
}

const nowMs = (step: Step) => step.deps.now().getTime();

/**
 * The timeout of the next call: `min(cap, what is left of the step)`. Throws
 * OutOfBudget when too little is left to start one; the step then ends where
 * it is, to resume on the next run.
 */
function call(step: Step, cap: number = REQUEST_TIMEOUT_MS): { timeoutMs: number } {
  const left = step.deadline - nowMs(step);
  if (left < MIN_CALL_MS) throw new OutOfBudget();
  return { timeoutMs: Math.min(cap, left) };
}

/**
 * The only way the engine writes a row. Adds what every write carries — the
 * lease released, the stuck-claims counter reset, `updated_at`, and
 * `status_changed_at` on a status change — and throws `LeaseLost` when the
 * row is no longer this step's to write.
 */
async function write(step: Step, patch: CustomDomainPatch, opts?: { expect?: RowExpectation }): Promise<void> {
  const at = step.deps.now().toISOString();
  const full: CustomDomainPatch = { ...patch, claims_since_progress: 0, locked_until: null, updated_at: at };
  if (patch.status !== undefined && patch.status !== step.status) full.status_changed_at = at;

  const matched = await step.deps.db.update(step.row.id, step.lease, full, opts);
  if (!matched) throw new LeaseLost();
  if (patch.status !== undefined) step.status = patch.status;
}

function lostLease(step: Step): AdvanceOutcome {
  console.warn("[DOMAIN_LEASE_LOST] another run holds the row, or it changed; stopping", {
    id: step.row.id,
    status: step.status,
  });
  return "lost_lease";
}

/** Ends the row: `failed`, then one alert to the studio. Nothing runs it again by itself. */
async function fail(step: Step, reason: string, extra: CustomDomainPatch = {}): Promise<AdvanceOutcome> {
  const previousStatus = step.status;
  await write(step, { ...extra, status: "failed", last_error: reason });
  const failed: CustomDomainRow = { ...step.row, ...extra, status: "failed", last_error: reason };
  console.error("[DOMAIN_FAILED]", { id: failed.id, name: failed.name, previousStatus, reason, orderId: failed.vercel_order_id });
  await alertStudio(step.deps, failed, "studio_failed", { previousStatus, fresh: true });
  return "failed";
}

/** The failure policy: one more failure in a row, then the backoff, or `failed` at the fifth. */
async function recordFailure(step: Step, error: unknown): Promise<AdvanceOutcome> {
  const code = errorCode(error);
  console.error("[DOMAIN_STEP_FAILED]", { id: step.row.id, status: step.status, code }, error);
  const attempts = step.row.attempts + 1;
  try {
    if (attempts >= MAX_FAILURES) return await fail(step, code, { attempts });
    // Status untouched: a purchase whose outcome is unknown stays
    // `purchasing`, so the account is checked before anything else.
    await write(step, {
      attempts,
      last_error: code,
      next_attempt_at: iso(nowMs(step) + BACKOFF_MINUTES[attempts - 1] * MINUTE),
    });
    return "retry";
  } catch (writeError) {
    if (writeError instanceof LeaseLost) return lostLease(step);
    console.error("[DOMAIN_FAILURE_NOT_RECORDED]", { id: step.row.id, code }, writeError);
    return "error";
  }
}

/**
 * Vercel refuses our token (401/403): not the row's fault, and nothing a
 * retry in 2 minutes would fix. No attempt is spent; the row looks again in
 * 30 minutes, and the studio is told at once — once per row, until the row
 * gets through again (`processClaimedRow` then gives the code back).
 */
async function waitForAuth(step: Step, error: RegistrarError, patch: CustomDomainPatch = {}): Promise<AdvanceOutcome> {
  console.error("[DOMAIN_VERCEL_UNAUTHORIZED]", { id: step.row.id, status: step.status, detail: detailOf(error) });
  const lastError = "vercel_unauthorized";
  await write(step, { ...patch, last_error: lastError, next_attempt_at: iso(nowMs(step) + AUTH_RETRY_MINUTES * MINUTE) });
  const waiting: CustomDomainRow = { ...step.row, ...patch, status: step.status, last_error: lastError };
  await alertStudio(step.deps, waiting, "studio_auth", { previousStatus: step.row.status, detail: detailOf(error) });
  return "unauthorized";
}

/** Vercel's rate limit (429): look again when it says, without spending an attempt. */
async function waitForRateLimit(step: Step, error: RegistrarError, patch: CustomDomainPatch = {}): Promise<AdvanceOutcome> {
  const waitMs = Math.min(RATE_LIMIT_MAX_MS, Math.max(0, error.retryAfterMs ?? RATE_LIMIT_DEFAULT_MS));
  console.warn("[DOMAIN_RATE_LIMITED]", { id: step.row.id, status: step.status, waitMs });
  await write(step, { ...patch, last_error: "rate_limited", next_attempt_at: iso(nowMs(step) + waitMs) });
  return "rate_limited";
}

/** The step's budget ran out between two calls: what was done stays done, the rest resumes on the next run. */
async function outOfTime(step: Step): Promise<AdvanceOutcome> {
  console.warn("[DOMAIN_STEP_OUT_OF_TIME]", { id: step.row.id, status: step.status });
  await write(step, { next_attempt_at: iso(nowMs(step)) });
  return "waiting";
}

async function toRegistered(step: Step, expiresAt: number | null): Promise<AdvanceOutcome> {
  const at = nowMs(step);
  await write(step, {
    status: "registered",
    registered_at: iso(at),
    expires_at: expiresAt !== null && Number.isFinite(expiresAt) ? iso(expiresAt) : null,
    attempts: 0,
    last_error: null,
    next_attempt_at: iso(at),
  });
  return "registered";
}

/**
 * A domain found in the team's account is this row's only if Vercel sold it
 * to us after the row was created. One the team already had — an old studio
 * domain, a former couple's — is never handed to a couple (spec D5,
 * "Adopting a domain we already own").
 */
async function adopt(step: Step, name: string, owned: OwnedDomain): Promise<AdvanceOutcome> {
  const createdAt = Date.parse(step.row.created_at);
  if (owned.boughtAt === null || !(owned.boughtAt >= createdAt)) {
    console.error("[DOMAIN_ALREADY_IN_ACCOUNT]", {
      id: step.row.id,
      name,
      boughtAt: owned.boughtAt === null ? null : iso(owned.boughtAt),
      rowCreatedAt: step.row.created_at,
    });
    return fail(step, "domain_already_in_account");
  }
  return toRegistered(step, owned.expiresAt);
}

/**
 * The name was taken outside, or is premium now: back to the couple, who
 * picks another for free. The name is kept, so the email and the dashboard
 * can say which one was lost (spec D2). A dead order is forgotten, or the
 * couple's next name would follow it instead of being bought.
 */
async function toAwaitingChoice(step: Step): Promise<AdvanceOutcome> {
  await write(step, {
    status: "awaiting_choice",
    last_error: "name_unavailable",
    purchase_started_at: null,
    vercel_order_id: null,
    attempts: 0,
    next_attempt_at: iso(nowMs(step)),
  });
  await sendNotice(step.deps, step.row, "name_unavailable");
  return "awaiting_choice";
}

/** The search's verdict on `name`. Only an explicit reason counts; anything else is `unknown`. */
function searchVerdict(answers: DomainAvailability[], name: string): "available" | NonNullable<DomainAvailability["reason"]> {
  const found = answers.find((answer) => answer.name === name);
  if (found?.available) return "available";
  return found?.reason ?? "unknown";
}

async function stepQueued(step: Step, registrar: Registrar, contact: RegistrantContact): Promise<AdvanceOutcome> {
  const { row, deps } = step;
  const name = row.name;
  if (!name) return fail(step, "name_missing");
  const years = parseDomainYears(row.years);
  if (years === null) return fail(step, "invalid_years");
  // Nothing is bought for more years than were paid for.
  if (!(row.price_paid_cents >= domainPrice(years) * 100)) return fail(step, "paid_amount_mismatch");

  // An order already placed for this row (a row relaunched by hand): follow
  // it. Never a second purchase while one may be under way.
  if (row.vercel_order_id) return followOrder(step, registrar, name, row.vercel_order_id);

  // 1. Already ours (bought by a run whose answer was lost): no purchase.
  const owned = await registrar.getOwnedDomain(name, call(step));
  if (owned) return adopt(step, name, owned);

  // 2. Still free, fresh from the registrar: the 60 s cache is the couple's typing.
  const verdict = searchVerdict(await deps.search([name], { maxAgeMs: 0, ...call(step) }), name);
  if (verdict === "taken" || verdict === "premium") return toAwaitingChoice(step);
  // A Vercel price rise is not the couple's problem, and must reach the studio.
  if (verdict === "above_ceiling") return fail(step, "price_above_ceiling");
  if (verdict === "unsupported") return fail(step, "name_unsupported");
  // A name left out of the answer, or a malformed entry, is not « nom pris ».
  if (verdict !== "available") throw new StepError("search_unknown", `the search could not tell for ${name}`);

  // 3. The price for exactly the years paid for.
  const quote = await registrar.quotePrice(name, years, call(step));
  // The search said free a moment ago: a missing price is an answer to ask again, not « taken ».
  if (quote.purchasePrice === null) throw new StepError("quote_unavailable", `no price for ${name} after a positive search`);
  if (quote.years !== years) {
    throw new StepError("quote_years_mismatch", `asked a price for ${years} years, got one for ${quote.years}`);
  }
  if (!(quote.purchasePrice > 0)) throw new StepError("invalid_quote", `purchasePrice ${quote.purchasePrice}`);
  // `purchasePrice` is the total, so the ceiling is compared per year.
  if (quote.purchasePrice / years > DOMAIN_MAX_USD_PER_YEAR) return fail(step, "price_above_ceiling");

  // The buy call gets its full timeout or does not start: one cut short
  // would leave a purchase whose outcome is unknown for nothing.
  if (step.deadline - nowMs(step) < REQUEST_TIMEOUT_MS + BUY_MARGIN_MS) throw new OutOfBudget();

  // 4. Write-ahead, conditioned on the row still being queued for the same
  // name and years: a run that loses this write never reaches the buy call.
  // `next_attempt_at` is pushed to the first check of an unconfirmed buy, so
  // no claim can take the row while the call runs.
  const startedAt = nowMs(step);
  await write(
    step,
    {
      status: "purchasing",
      purchase_started_at: iso(startedAt),
      vercel_order_id: null,
      // Cleared so that a process dying in the call leaves no stale reason.
      last_error: null,
      next_attempt_at: iso(startedAt + UNCONFIRMED_CHECK_MINUTES[0] * MINUTE),
    },
    { expect: { status: "queued", name, years: row.years } },
  );

  // 5. The purchase.
  let orderId: string;
  try {
    ({ orderId } = await registrar.buyDomain(name, { years, expectedPrice: quote.purchasePrice, contact }, call(step)));
  } catch (error) {
    return afterBuyFailed(step, error, startedAt);
  }
  return saveOrderId(step, orderId);
}

/** What the row is set back to when the buy was refused before any order. */
const BACK_TO_QUEUED: CustomDomainPatch = { status: "queued", purchase_started_at: null };

/**
 * The buy call did not answer with an order. Only a refusal Vercel documents
 * as coming before any order moves the row on; anything else may have placed
 * one, and the row waits for the account to say.
 */
async function afterBuyFailed(step: Step, error: unknown, startedAt: number): Promise<AdvanceOutcome> {
  if (error instanceof RegistrarError && error.status >= 400 && error.status < 500) {
    if (error.code === "domain_not_available") return toAwaitingChoice(step);
    if (error.code === "expected_price_mismatch") return requeueToQuoteAgain(step);
    if (DEFINITIVE_BUY_REFUSALS.has(error.code)) return fail(step, error.code, { purchase_started_at: null });
    // Refused at the door: the token, or the rate limit.
    if (isUnauthorized(error)) return waitForAuth(step, error, BACK_TO_QUEUED);
    if (isRateLimited(error)) return waitForRateLimit(step, error, BACK_TO_QUEUED);
  }
  // buyDomain's own guard, before any request.
  if (error instanceof RangeError) return fail(step, "invalid_order", { purchase_started_at: null });

  console.error("[DOMAIN_BUY_UNCONFIRMED] the order may exist; checking the account later", {
    id: step.row.id,
    name: step.row.name,
    code: errorCode(error),
  }, error);
  await write(
    step,
    { last_error: "buy_unconfirmed", next_attempt_at: iso(startedAt + UNCONFIRMED_CHECK_MINUTES[0] * MINUTE) },
    { expect: { status: "purchasing" } },
  );
  return "unconfirmed";
}

/**
 * Records the order the buy call answered with. The domain is being paid for
 * at this point, so the id is not given up on one failed write: three tries,
 * then a failure write that still carries it, then — if the database will not
 * take it at all — an alert carrying it to the studio. The row is then
 * `purchasing` without an order id: an unconfirmed buy, checked in the account.
 */
async function saveOrderId(step: Step, orderId: string): Promise<AdvanceOutcome> {
  const { row, deps } = step;
  let lastError: unknown;
  for (let attempt = 0; attempt <= ORDER_ID_RETRY_MS.length; attempt += 1) {
    if (attempt > 0) await (deps.sleep ?? realSleep)(ORDER_ID_RETRY_MS[attempt - 1]);
    try {
      await write(
        step,
        {
          vercel_order_id: orderId,
          attempts: 0,
          last_error: null,
          next_attempt_at: iso(nowMs(step) + ORDER_POLL_MINUTES * MINUTE),
        },
        // Only onto the purchase it belongs to.
        { expect: { status: "purchasing" } },
      );
      return "purchasing";
    } catch (error) {
      lastError = error;
      // The row changed under us: writing again would not help.
      if (error instanceof LeaseLost) break;
      console.error("[DOMAIN_ORDER_ID_WRITE_FAILED]", { id: row.id, orderId, try: attempt + 1 }, error);
    }
  }

  if (!(lastError instanceof LeaseLost)) {
    try {
      await write(
        step,
        {
          vercel_order_id: orderId,
          attempts: row.attempts + 1,
          last_error: "order_id_not_saved",
          next_attempt_at: iso(nowMs(step) + BACKOFF_MINUTES[0] * MINUTE),
        },
        { expect: { status: "purchasing" } },
      );
      console.error("[DOMAIN_ORDER_ID_SAVED_LATE]", { id: row.id, orderId });
      return "retry";
    } catch (error) {
      lastError = error;
    }
  }

  console.error("[DOMAIN_ORDER_ID_NOT_SAVED]", { id: row.id, name: row.name, orderId }, lastError);
  await alertStudioDirectly(
    deps,
    studioAlertOf(
      { ...row, status: step.status, vercel_order_id: orderId, last_error: "order_id_not_saved" },
      { previousStatus: row.status },
    ),
  );
  return lastError instanceof LeaseLost ? lostLease(step) : "error";
}

/** Vercel's price moved between the quote and the buy: quote again shortly. */
async function requeueToQuoteAgain(step: Step): Promise<AdvanceOutcome> {
  const attempts = step.row.attempts + 1;
  if (attempts >= MAX_FAILURES) return fail(step, "expected_price_mismatch", { attempts, purchase_started_at: null });
  await write(step, {
    ...BACK_TO_QUEUED,
    attempts,
    last_error: "expected_price_mismatch",
    next_attempt_at: iso(nowMs(step) + REQUOTE_MINUTES * MINUTE),
  });
  return "requeued";
}

async function stepPurchasing(step: Step, registrar: Registrar): Promise<AdvanceOutcome> {
  const name = step.row.name;
  if (!name) return fail(step, "name_missing");
  if (!step.row.vercel_order_id) return checkUnconfirmedPurchase(step, registrar, name);
  return followOrder(step, registrar, name, step.row.vercel_order_id);
}

/** Reads the row's order and acts on its outcome. From `purchasing`, or from a `queued` row that still has one. */
async function followOrder(step: Step, registrar: Registrar, name: string, orderId: string): Promise<AdvanceOutcome> {
  const { row } = step;
  const order = await registrar.getOrder(orderId, call(step));
  const entry = order.domains.find((domain) => domain.domainName.toLowerCase() === name);

  if (order.status === "completed" && entry?.status === "completed") {
    // The order proves the domain is this row's: no adoption check.
    const owned = await registrar.getOwnedDomain(name, call(step));
    // Not a guess either way: the expiry is what the renewal spec reads.
    if (!owned) throw new StepError("owned_domain_missing", "the order completed but the domain is not in the account");
    return toRegistered(step, owned.expiresAt);
  }
  // Checked first: the studio paid for nothing and Vercel could not give it back.
  if (entry?.status === "refund-failed") return fail(step, entry.errorCode ?? "refund-failed");
  if ((entry?.status === "failed" || entry?.status === "refunded") && entry.errorCode === "unavailable-legal") {
    console.warn("[DOMAIN_UNAVAILABLE_LEGAL]", { id: row.id, name, orderId, status: entry.status });
    return toAwaitingChoice(step);
  }
  if (order.status === "failed" || entry?.status === "failed" || entry?.status === "refunded") {
    const code = entry?.errorCode ?? order.errorCode ?? (entry && entry.status !== "pending" ? entry.status : "order_failed");
    return fail(step, code);
  }
  if (order.status === "draft" || order.status === "purchasing" || entry?.status === "pending") {
    const since = Date.parse(row.purchase_started_at ?? row.status_changed_at);
    if (nowMs(step) >= since + ORDER_DEADLINE_MINUTES * MINUTE) return fail(step, "order_pending_timeout");
    await write(step, { attempts: 0, next_attempt_at: iso(nowMs(step) + ORDER_POLL_MINUTES * MINUTE) });
    return "waiting";
  }
  throw new StepError("unexpected_order_state", `order ${order.status}, domain ${entry?.status ?? "missing"}`);
}

/**
 * `purchasing` without an order id: a buy call whose outcome is unknown — it
 * timed out, failed unclearly, its order id could not be saved, or the
 * process died in it. Vercel may be completing an order right now, so the
 * row is never bought again, never requeued and never sent to the couple.
 * The account is checked at each of UNCONFIRMED_CHECK_MINUTES after the call;
 * after the last, the row is failed and the studio looks at Vercel.
 */
async function checkUnconfirmedPurchase(step: Step, registrar: Registrar, name: string): Promise<AdvanceOutcome> {
  const { row } = step;
  const startedAt = Date.parse(row.purchase_started_at ?? row.status_changed_at);
  const checks = UNCONFIRMED_CHECK_MINUTES.map((minutes) => startedAt + minutes * MINUTE);
  const now = nowMs(step);

  if (now < checks[0]) {
    // Not a failure: attempts are left as they are.
    await write(step, { last_error: "buy_unconfirmed", next_attempt_at: iso(checks[0]) });
    return "waiting";
  }

  const owned = await registrar.getOwnedDomain(name, call(step));
  if (owned) return adopt(step, name, owned);

  const next = checks.find((at) => at > now);
  if (next === undefined) return fail(step, "buy_unconfirmed");
  await write(step, { attempts: 0, last_error: "buy_unconfirmed", next_attempt_at: iso(next) });
  return "unconfirmed";
}

/**
 * Attaches a name to the landing project unless it is there already. Read
 * first: a row waiting for its certificate comes back every 5 minutes, and
 * Vercel limits domain additions to 100 an hour per team.
 */
async function ensureAttached(step: Step, registrar: Registrar, name: string, opts?: AttachOptions): Promise<void> {
  if (await registrar.getProjectDomain(name, call(step))) return;
  await registrar.attachProjectDomain(name, opts, call(step));
}

async function stepRegistered(step: Step, registrar: Registrar): Promise<AdvanceOutcome> {
  const { row, deps } = step;
  const name = row.name;
  if (!name) return fail(step, "name_missing");

  // At most 4 calls of 20 s and a probe of 10: the step fits its 90 s, and
  // a slow Vercel only ever pushes the rest to the next run.
  await ensureAttached(step, registrar, name);
  await ensureAttached(step, registrar, `www.${name}`, { redirect: name, redirectStatusCode: 308 });

  if (await deps.probe(`https://${name}/`, call(step, PROBE_TIMEOUT_MS))) {
    const at = nowMs(step);
    await write(step, { status: "active", activated_at: iso(at), attempts: 0, last_error: null, next_attempt_at: iso(at) });
    await sendNotice(deps, row, "active");
    return "active";
  }

  const since = Date.parse(row.registered_at ?? row.status_changed_at);
  if (nowMs(step) >= since + CERTIFICATE_DEADLINE_MINUTES * MINUTE) return fail(step, "certificate_timeout");
  // Not a failure: the step succeeded, the certificate is simply not there yet.
  await write(step, { attempts: 0, last_error: null, next_attempt_at: iso(nowMs(step) + CERTIFICATE_POLL_MINUTES * MINUTE) });
  return "waiting";
}

async function runStep(step: Step): Promise<AdvanceOutcome> {
  const { row, deps } = step;

  if (row.claims_since_progress >= STUCK_CLAIMS) return fail(step, "step_keeps_dying");
  if (!deps.registrar) return fail(step, "registrar_not_configured");

  switch (row.status) {
    case "queued":
      // Only buying needs the registrant: a domain already bought still
      // gets attached and goes live if these variables go missing.
      if (!deps.contact) return fail(step, "registrant_missing");
      return stepQueued(step, deps.registrar, deps.contact);
    case "purchasing":
      return stepPurchasing(step, deps.registrar);
    case "registered":
      return stepRegistered(step, deps.registrar);
    default:
      // The claim functions only return the three statuses above.
      console.error("[DOMAIN_UNEXPECTED_STATUS]", { id: row.id, status: row.status });
      return "error";
  }
}

/** The step, with what interrupted it turned into an outcome. */
async function runGuarded(step: Step): Promise<AdvanceOutcome> {
  try {
    return await runStep(step);
  } catch (error) {
    if (error instanceof LeaseLost) return lostLease(step);
    if (!(error instanceof OutOfBudget) && !isUnauthorized(error) && !isRateLimited(error)) return recordFailure(step, error);
    // Waits, not failures: no attempt is spent.
    try {
      if (error instanceof OutOfBudget) return await outOfTime(step);
      if (isUnauthorized(error)) return await waitForAuth(step, error);
      return await waitForRateLimit(step, error as RegistrarError);
    } catch (writeError) {
      if (writeError instanceof LeaseLost) return lostLease(step);
      console.error("[DOMAIN_WAIT_NOT_RECORDED]", { id: step.row.id }, writeError);
      return "error";
    }
  }
}

/** After a row gets through Vercel again, its auth alert may go out again on the next incident. */
async function releaseRecoveredAuthAlert(step: Step, outcome: AdvanceOutcome): Promise<void> {
  if (!step.row.notices_sent.includes("studio_auth")) return;
  if (outcome === "unauthorized" || outcome === "lost_lease" || outcome === "error") return;
  try {
    await step.deps.db.releaseNotice(step.row.id, "studio_auth");
  } catch (error) {
    console.error("[DOMAIN_ALERT_NOT_RELEASED]", { id: step.row.id, code: "studio_auth" }, error);
  }
}

/**
 * Performs one step of a row this process has just claimed, its emails
 * included. Never throws: a failure is recorded on the row, and the outcome
 * says what happened.
 */
export async function processClaimedRow(row: CustomDomainRow, deps: AdvanceDeps): Promise<AdvanceOutcome> {
  if (!row.lease_token) {
    // Every engine write is conditioned on the token; without one, none is safe.
    console.error("[DOMAIN_NO_LEASE]", { id: row.id });
    return "lost_lease";
  }
  const step: Step = {
    row,
    lease: row.lease_token,
    deps,
    status: row.status,
    deadline: deps.now().getTime() + (deps.stepBudgetMs ?? STEP_BUDGET_MS),
  };
  const outcome = await runGuarded(step);
  await releaseRecoveredAuthAlert(step, outcome);
  return outcome;
}

/**
 * Claims the row and performs one step, if it is due and nobody else holds
 * it; leaves it alone otherwise. What provisioning calls through `after()`,
 * via `advanceCustomDomainSafely` in engine.ts.
 */
export async function advanceCustomDomain(id: string, deps: AdvanceDeps): Promise<AdvanceOutcome> {
  const row = await deps.db.claim(id);
  if (!row) return "not_claimed";
  return processClaimedRow(row, deps);
}

// ── The cron's run ────────────────────────────────────────────────────────────

export interface AdvanceDueSummary {
  claimed: number;
  outcomes: Partial<Record<AdvanceOutcome, number>>;
  notices: { sent: number; skipped: number; failed: number };
}

/** The time-based emails and the ones still owed, until the run's time is up. */
async function sendDueNotices(deps: AdvanceDeps, runDeadline: number): Promise<AdvanceDueSummary["notices"]> {
  const counts = { sent: 0, skipped: 0, failed: 0 };
  const now = deps.now();
  const due: Array<{ row: CustomDomainRow; code: NoticeCode | "studio_failed" }> = [];

  try {
    for (const row of await deps.db.findReminderDue(now)) due.push({ row, code: "reminder" });
  } catch (error) {
    console.error("[DOMAIN_REMINDERS_LOOKUP_FAILED]", error);
  }
  try {
    due.push(...(await deps.db.findUnsentNotices(now)));
  } catch (error) {
    console.error("[DOMAIN_NOTICES_LOOKUP_FAILED]", error);
  }

  for (const [index, { row, code }] of due.entries()) {
    if (deps.now().getTime() >= runDeadline) {
      // The next run, 5 minutes later, finds them again.
      console.warn("[DOMAIN_NOTICES_DEFERRED]", { left: due.length - index });
      break;
    }
    const result = code === "studio_failed" ? await alertStudio(deps, row, code) : await sendNotice(deps, row, code);
    counts[result] += 1;
  }
  return counts;
}

/**
 * The cron's run: up to DUE_BATCH due rows, one step each — its emails sent
 * right after it — then the time-based emails and those still owed. The rows
 * run side by side, so each finishes well inside the 2-minute lease it was
 * claimed with, rather than the last ones starting after theirs ran out; the
 * emails stop starting at RUN_BUDGET_MS, inside the route's 300 s.
 */
export async function advanceDue(deps: AdvanceDeps): Promise<AdvanceDueSummary> {
  const runDeadline = deps.now().getTime() + RUN_BUDGET_MS;
  const rows = await deps.db.claimDue(DUE_BATCH);
  const results = await Promise.all(rows.map((row) => processClaimedRow(row, deps)));

  const outcomes: AdvanceDueSummary["outcomes"] = {};
  for (const outcome of results) outcomes[outcome] = (outcomes[outcome] ?? 0) + 1;

  return { claimed: rows.length, outcomes, notices: await sendDueNotices(deps, runDeadline) };
}
