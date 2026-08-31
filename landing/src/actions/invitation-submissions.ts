"use server";

import { createClient } from "@/utils/supabase/server";

/**
 * Public guest submissions from an invitation page (RSVP + playlist).
 *
 * Ported from `landing-deprecated/src/actions/{submit-rsvp,submit-playlist}.ts`,
 * with the security defect of the original fixed.
 *
 * ── Why the anon client and not `supabaseAdmin` ──────────────────────────────
 * The deprecated RSVP action took a `weddingId` straight from the browser and
 * inserted with the SERVICE_ROLE client, which bypasses RLS entirely. Anyone
 * who could open an invitation could therefore write a row into ANY wedding —
 * including weddings they had never seen — and nothing constrained the payload.
 *
 * Both tables already carry a public `insert` policy ("Anyone can submit an
 * rsvp response" / "Public can insert playlist suggestions"), so the anon
 * client is enough to persist a guest submission. It is used here instead of
 * the service role, so the database's own rules stay the last line of defence
 * rather than being switched off. No elevated client is needed on this path.
 *
 * The insert policy is `with check (true)`, so RLS does not constrain the
 * payload at all. What actually guards this path is:
 *   - the `wedding_id` foreign key, which rejects an id pointing nowhere
 *     (SQLSTATE 23503) — see `isValidWeddingId` for why a pre-flight read is
 *     not possible here;
 *   - strict validation and bounding of every field, server-side;
 *   - a hard cap on payload sizes, so the tables cannot be inflated by a
 *     single request.
 *
 * ── Demo mode ────────────────────────────────────────────────────────────────
 * A theme rendered without a `weddingId` (the public demo route) never reaches
 * these actions: the sections only import and call them when the field is
 * present. Both actions additionally reject a missing/invalid id, so even a
 * hand-crafted call cannot write demo noise into the tables.
 *
 * ── Personal data ────────────────────────────────────────────────────────────
 * Only what the couple needs to organise the day is stored: names, presence,
 * head count, dietary note, free message. No email, no IP, no fingerprinting.
 */

/* ------------------------------------------------------------------ *
 * Validation helpers
 * ------------------------------------------------------------------ */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const LIMITS = {
  name: 80,
  dietary: 200,
  message: 1000,
  guestName: 80,
  trackField: 200,
  trackUrl: 500,
  /** A guest suggesting more than this is spamming, not suggesting. */
  tracks: 20,
  /** Nobody RSVPs for a coach party. */
  guestCount: 20,
} as const;

/** Trims, collapses whitespace and hard-truncates. Non-strings become "". */
function clean(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

export type SubmissionResult = { ok: true } | { ok: false; error: string };

const GENERIC_ERROR = "Erreur lors de l'enregistrement. Merci de réessayer.";

/**
 * Shape check on the wedding id.
 *
 * Existence is enforced by the database itself: `wedding_id` is a foreign key
 * onto `weddings(id)`, so an id that points nowhere is rejected by Postgres
 * (SQLSTATE 23503) instead of creating an orphan row. Anonymous visitors
 * cannot `select` from `weddings` under RLS, so a pre-flight read would return
 * "not found" for every wedding and could not tell the two cases apart — the
 * FK is the only honest check available on this path, and it is sufficient.
 *
 * Validating the format first keeps a malformed id from ever reaching the
 * database and turns "not a uuid" into a clean error rather than a 500.
 */
function isValidWeddingId(weddingId: unknown): weddingId is string {
  return typeof weddingId === "string" && UUID_RE.test(weddingId);
}

/* ------------------------------------------------------------------ *
 * RSVP
 * ------------------------------------------------------------------ */

export type RsvpCompanion = {
  firstName: string;
  lastName: string;
  relationType?: string;
};

export type RsvpSubmission = {
  weddingId: string;
  firstName: string;
  lastName: string;
  /** null = still undecided; the column is nullable since the 2026-03-11 migration. */
  attendance: boolean | null;
  dietary?: string;
  message?: string;
  /** Named companions. `guest_count` is derived from this, never trusted raw. */
  companions?: RsvpCompanion[];
};

export async function submitRsvp(input: RsvpSubmission): Promise<SubmissionResult> {
  if (!isValidWeddingId(input?.weddingId)) {
    return { ok: false, error: GENERIC_ERROR };
  }

  const firstName = clean(input.firstName, LIMITS.name);
  const lastName = clean(input.lastName, LIMITS.name);
  const fullName = `${firstName} ${lastName}`.trim();

  if (!fullName) {
    return { ok: false, error: "Merci d'indiquer votre nom." };
  }

  const attendance =
    input.attendance === true ? true : input.attendance === false ? false : null;

  // Shape matches what the dashboard reads back (`Participant` in
  // dashboard/src/actions/rsvp-response-actions.ts): snake_case keys.
  const participants = (Array.isArray(input.companions) ? input.companions : [])
    .slice(0, LIMITS.guestCount)
    .map((companion) => ({
      first_name: clean(companion?.firstName, LIMITS.name),
      last_name: clean(companion?.lastName, LIMITS.name),
      relation_type: clean(companion?.relationType, LIMITS.name) || undefined,
    }))
    .filter((companion) => companion.first_name || companion.last_name);

  const dietary = clean(input.dietary, LIMITS.dietary);
  const message = clean(input.message, LIMITS.message);

  const supabase = await createClient();

  const { error } = await supabase.from("rsvp_responses").insert({
    wedding_id: input.weddingId,
    name: fullName,
    respondent_first_name: firstName || null,
    respondent_last_name: lastName || null,
    attendance,
    // The dashboard treats `guest_count` as "how many companions", and
    // recomputes it as `participants.length` on every edit. Derive it the same
    // way so a client-supplied number can never disagree with the list.
    guest_count: participants.length,
    dietary: dietary || null,
    message: message || null,
    participants,
  });

  if (error) {
    // 23503 = foreign key violation: the wedding id does not exist.
    console.error("[rsvp] insert failed", error.code, error.message);
    return { ok: false, error: GENERIC_ERROR };
  }

  return { ok: true };
}

/* ------------------------------------------------------------------ *
 * Playlist
 * ------------------------------------------------------------------ */

export type PlaylistTrackInput = {
  id?: string;
  title: string;
  artist?: string;
  coverUrl?: string;
  previewUrl?: string;
  spotifyUrl?: string;
};

export type PlaylistSubmission = {
  weddingId: string;
  guestName?: string;
  tracks: PlaylistTrackInput[];
};

/** Only http(s) URLs survive; anything else (javascript:, data:) is dropped. */
function safeUrl(value: unknown): string | undefined {
  const raw = clean(value, LIMITS.trackUrl);
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:" ? raw : undefined;
  } catch {
    return undefined;
  }
}

export async function submitPlaylistSuggestions(
  input: PlaylistSubmission,
): Promise<SubmissionResult> {
  if (!isValidWeddingId(input?.weddingId)) {
    return { ok: false, error: GENERIC_ERROR };
  }

  const tracks = (Array.isArray(input.tracks) ? input.tracks : [])
    .slice(0, LIMITS.tracks)
    .map((track) => ({
      // The dashboard keys `track_statuses` by track id, so every track needs
      // a stable one. Suggestions typed by hand have none: mint it here.
      id: clean(track?.id, LIMITS.trackField) || crypto.randomUUID(),
      title: clean(track?.title, LIMITS.trackField),
      artist: clean(track?.artist, LIMITS.trackField),
      coverUrl: safeUrl(track?.coverUrl) ?? "",
      ...(safeUrl(track?.previewUrl) ? { previewUrl: safeUrl(track?.previewUrl) } : {}),
      ...(safeUrl(track?.spotifyUrl) ? { spotifyUrl: safeUrl(track?.spotifyUrl) } : {}),
    }))
    .filter((track) => track.title.length > 0);

  if (!tracks.length) {
    return { ok: false, error: "Merci d'indiquer au moins un titre." };
  }

  const guestName = clean(input.guestName, LIMITS.guestName);

  const supabase = await createClient();

  const { error } = await supabase.from("playlist_suggestions").insert({
    wedding_id: input.weddingId,
    guest_name: guestName || null,
    tracks,
  });

  if (error) {
    console.error("[playlist] insert failed", error.code, error.message);
    return { ok: false, error: GENERIC_ERROR };
  }

  return { ok: true };
}
