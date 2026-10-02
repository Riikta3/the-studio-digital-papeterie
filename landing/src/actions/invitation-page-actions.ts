"use server";

import { musicPublicUrl, resolveMusicSource } from "@shared/lib/music";
import type { InvitationRows } from "@shared/types/invitation-rows";

import { createClient } from "@/utils/supabase/server";
import {
  type InvitationPageData,
  assembleInvitationPage,
  readDayOf,
} from "@/lib/assemble-invitation-page";

/**
 * The couple's real invitation, assembled from Supabase.
 *
 * Until now the only invitation pages in this app were static showcases
 * (`/invitation/demo`, `/invitation/mediterranean-classy`) reading from
 * `src/lib/*-demo-data.ts`. There was no route that rendered a *real* couple's
 * invitation, so everything the couple typed into the dashboard — their venue,
 * their programme, their FAQ — had nowhere to appear. This is that route's
 * data source.
 *
 * Reads go through the ANON client, exactly like the Jour J guest page: an
 * invitation is public to anyone holding its link, and `supabaseAdmin` would
 * let a crafted request reach anything in the database. Every table below has
 * an anon select policy gated on the wedding's own visibility.
 *
 * Guest data is never read here. An invitation shows the event, not the guest
 * list — the only path to a guest is the Jour J search RPC.
 *
 * Turning the rows into a page is `assembleInvitationPage`'s job, not this
 * file's: the editor's live preview runs the same function on the couple's
 * unsaved draft, so this file only fetches.
 */

/**
 * Resolves a slug to just enough to decide whether to open the door.
 *
 * `getInvitationPage` below loads the whole wedding — names, events, venue,
 * FAQ, the lot. That is exactly what a guest without a code must not receive,
 * and "render it but hide it" would still put every word of it in the HTML.
 * So the gate is decided from this, before a single content query runs.
 *
 * Returns the theme too, so a locked invitation can still be dressed in the
 * couple's own typography and accent — the one thing a guest may see.
 */
export async function getInvitationGate(slug: string): Promise<{
  weddingId: string;
  themeId: string | null;
  isGated: boolean;
  /**
   * Fingerprint of the code currently in force, null when there is none.
   * Passes are signed with it, so changing the code expires them.
   */
  codeFingerprint: string | null;
} | null> {
  if (!slug) return null;

  const supabase = await createClient();

  const { data: resolved, error: siteError } = await supabase.rpc(
    "resolve_public_slug",
    { p_slug: slug },
  );

  const site = resolved?.[0];
  if (siteError || !site?.wedding_id) return null;

  const weddingId = site.wedding_id as string;

  const { data: gated, error: gateError } = await supabase.rpc(
    "invitation_is_gated",
    { p_wedding_id: weddingId },
  );

  if (gateError) {
    // Fail closed: if we cannot tell whether a code is required, we must not
    // assume it is not. A couple's guests are told to try again; the
    // alternative is publishing a wedding that asked to be private.
    console.error("[INVITATION_GATE_CHECK_FAILED]", gateError);
    return {
      weddingId,
      themeId: (site.theme_id as string) ?? null,
      isGated: true,
      // No fingerprint means no pass can verify, so the door stays shut
      // rather than opening on a guess.
      codeFingerprint: null,
    };
  }

  const isGated = gated === true;

  // Only fetched when there is a door to check a pass against.
  let codeFingerprint: string | null = null;
  if (isGated) {
    const { data: fp } = await supabase.rpc("guest_code_fingerprint", {
      p_wedding_id: weddingId,
    });
    codeFingerprint = (fp as string) ?? null;
  }

  return {
    weddingId,
    themeId: (site.theme_id as string) ?? null,
    isGated,
    codeFingerprint,
  };
}

/**
 * Resolves a public slug to the couple's invitation.
 *
 * Returns null for an unknown slug and for a site that is not published, and
 * the caller 404s on both — indistinguishable from outside, so this route
 * cannot be used to discover which couples exist.
 */
export async function getInvitationPage(
  slug: string,
): Promise<InvitationPageData | null> {
  if (!slug) return null;

  const supabase = await createClient();

  // Via `resolve_public_slug` rather than reading `sites`: the broad anon
  // policy that used to allow that leaked every column and let anyone list
  // every published slug (20260903120000 replaced it).
  const { data: resolved, error: siteError } = await supabase.rpc(
    "resolve_public_slug",
    { p_slug: slug },
  );

  const site = resolved?.[0];
  if (siteError || !site?.wedding_id) return null;

  const weddingId = site.wedding_id as string;

  const [namesRes, eventsRes, scheduleRes, venueRes, staysRes, faqRes, modulesRes, dayOfRes] =
    await Promise.all([
      // The couple's names live on `profiles`, which anon cannot read. This
      // security-definer RPC is the narrow path to just the two display names
      // (see 20260902190000_couple_display_names.sql).
      supabase.rpc("get_couple_display_names", { p_wedding_id: weddingId }),
      // Same narrow-RPC reason as the names above: the anon policy on `events`
      // returned every wedding's events to a direct PostgREST call, so it was
      // replaced by this function in 20260911110000_narrow_events_anon_read.sql.
      supabase.rpc("public_wedding_events", { p_wedding_id: weddingId }),
      supabase
        .from("schedule_entries")
        .select("id, event_id, time, title, description, position, icon, image_url")
        .eq("wedding_id", weddingId)
        .order("position", { ascending: true }),
      supabase
        .from("venues")
        .select(
          "name, address, city, maps_url, waze_url, parking_info, access_info, transport_info, photo_url",
        )
        .eq("wedding_id", weddingId)
        .maybeSingle(),
      supabase
        .from("accommodations")
        .select(
          "id, name, city, distance, phone, booking_url, offer, photo_url, address, secondary",
        )
        .eq("wedding_id", weddingId)
        .order("position", { ascending: true }),
      supabase
        .from("faq_entries")
        .select("id, question, answer, position")
        .eq("wedding_id", weddingId)
        .eq("published", true)
        .order("position", { ascending: true }),
      // Per-module content. Through an RPC for the same reason as the events
      // above: `site_modules` has no anon policy and must not gain one.
      supabase.rpc("public_module_configs", { p_wedding_id: weddingId }),
      // The Jour J: a row only when the couple enabled it (the same RPC the
      // guest pages resolve through). Through an RPC because `day_of_settings`
      // has no anon select policy any more.
      supabase.rpc("public_day_of_settings", { p_wedding_id: weddingId }),
    ]);

  // `rpc()` and untyped `from()` give back `any` rows, so each is named as the
  // shape the columns have before it goes any further.
  const rows: InvitationRows = {
    site: {
      theme_id: (site.theme_id as string | null) ?? null,
      modules: (site.modules as string[] | null) ?? null,
      adults_only: (site.adults_only as boolean | null) ?? null,
      languages: (site.languages as string[] | null) ?? null,
      hero_kicker: (site.hero_kicker as string | null) ?? null,
      announcement: (site.announcement as string | null) ?? null,
      closing_words: (site.closing_words as string | null) ?? null,
      couple_photo_url: (site.couple_photo_url as string | null) ?? null,
      invitation_texts: site.invitation_texts,
    },
    names: (namesRes.data?.[0] as InvitationRows["names"]) ?? null,
    events: (eventsRes.data ?? []) as InvitationRows["events"],
    schedule: (scheduleRes.data ?? []) as InvitationRows["schedule"],
    venue: (venueRes.data as InvitationRows["venue"]) ?? null,
    accommodations: (staysRes.data ?? []) as InvitationRows["accommodations"],
    faq: (faqRes.data ?? []) as InvitationRows["faq"],
    moduleConfigs: (modulesRes.data ?? []) as InvitationRows["moduleConfigs"],
  };

  const page = assembleInvitationPage(weddingId, slug, rows);
  if (!page) return null;

  const dayOf = readDayOf(dayOfRes.data);
  // Already blanked by `resolve_public_slug` when the option was not bought or
  // the couple switched it off.
  const music = resolveMusicSource(
    {
      music_enabled: (site.music_enabled as boolean | null) ?? null,
      music_track: (site.music_track as string | null) ?? null,
      music_upload_path: (site.music_upload_path as string | null) ?? null,
    },
    (path) => musicPublicUrl(process.env.NEXT_PUBLIC_SUPABASE_URL!, path),
  );
  return { ...page, ...(dayOf ? { dayOf } : {}), music };
}
