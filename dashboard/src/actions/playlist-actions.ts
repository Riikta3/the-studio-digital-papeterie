"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type TrackStatus = "accepted" | "rejected" | "pending";

export interface TrackPayload {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  spotifyUrl?: string | null;
}

export async function updateTrackStatus(
  suggestionId: string,
  trackId: string,
  status: TrackStatus,
) {
  const supabase = await createClient();

  const { data: suggestion, error: fetchError } = await supabase
    .from("playlist_suggestions")
    .select("track_statuses")
    .eq("id", suggestionId)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const current: Record<string, TrackStatus> =
    (suggestion?.track_statuses as Record<string, TrackStatus>) ?? {};

  const next: Record<string, TrackStatus> = {
    ...current,
    [trackId]: current[trackId] === status ? "pending" : status,
  };

  const { error } = await supabase
    .from("playlist_suggestions")
    .update({ track_statuses: next })
    .eq("id", suggestionId);

  if (error) throw new Error(error.message);

  revalidatePath("/[locale]/playlist", "page");
}

export async function batchUpdateTrackStatus(
  selections: { suggestionId: string; trackId: string }[],
  status: TrackStatus,
) {
  if (!selections.length) return;

  const supabase = await createClient();

  const byId = selections.reduce<Record<string, string[]>>((acc, { suggestionId, trackId }) => {
    (acc[suggestionId] ??= []).push(trackId);
    return acc;
  }, {});

  await Promise.all(
    Object.entries(byId).map(async ([suggestionId, trackIds]) => {
      const { data: suggestion } = await supabase
        .from("playlist_suggestions")
        .select("track_statuses")
        .eq("id", suggestionId)
        .single();

      const current: Record<string, TrackStatus> =
        (suggestion?.track_statuses as Record<string, TrackStatus>) ?? {};

      const next = { ...current };
      for (const trackId of trackIds) next[trackId] = status;

      await supabase
        .from("playlist_suggestions")
        .update({ track_statuses: next })
        .eq("id", suggestionId);
    }),
  );

  revalidatePath("/[locale]/playlist", "page");
}

// Add a track to the admin suggestion (guest_name = "__admin__"), create if needed
export async function addTrack(weddingId: string, track: TrackPayload) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("playlist_suggestions")
    .select("id, tracks, track_statuses")
    .eq("wedding_id", weddingId)
    .eq("guest_name", "__admin__")
    .single();

  if (existing) {
    const tracks = (existing.tracks as TrackPayload[]) ?? [];
    if (tracks.some((t) => t.id === track.id)) return; // already exists
    const { error } = await supabase
      .from("playlist_suggestions")
      .update({ tracks: [...tracks, track] })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("playlist_suggestions").insert({
      wedding_id: weddingId,
      guest_name: "__admin__",
      tracks: [track],
      track_statuses: {},
    });
    if (error) throw new Error(error.message);
  }

  revalidatePath("/[locale]/playlist", "page");
}

// Delete a track from its suggestion; delete suggestion row if it becomes empty
export async function deleteTrack(suggestionId: string, trackId: string) {
  const supabase = await createClient();

  const { data: suggestion } = await supabase
    .from("playlist_suggestions")
    .select("tracks, track_statuses")
    .eq("id", suggestionId)
    .single();

  if (!suggestion) return;

  const tracks = (suggestion.tracks as TrackPayload[]).filter((t) => t.id !== trackId);
  const statuses = { ...(suggestion.track_statuses as Record<string, TrackStatus>) };
  delete statuses[trackId];

  if (tracks.length === 0) {
    await supabase.from("playlist_suggestions").delete().eq("id", suggestionId);
  } else {
    await supabase
      .from("playlist_suggestions")
      .update({ tracks, track_statuses: statuses })
      .eq("id", suggestionId);
  }

  revalidatePath("/[locale]/playlist", "page");
}
