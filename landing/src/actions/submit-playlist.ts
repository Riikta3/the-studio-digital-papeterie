"use server";

import { createClient } from "@/utils/supabase/server";

export interface TrackPayload {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
}

export async function submitPlaylistSuggestions({
  weddingId,
  guestName,
  tracks,
}: {
  weddingId: string;
  guestName?: string;
  tracks: TrackPayload[];
}) {
  if (!tracks.length) throw new Error("No tracks provided");

  const supabase = await createClient();

  const { error } = await supabase.from("playlist_suggestions").insert({
    wedding_id: weddingId,
    guest_name: guestName ?? null,
    tracks,
  });

  if (error) throw new Error(error.message);

  return { success: true };
}
