import { redirect } from "@/navigation";
import { createClient } from "@/utils/supabase/server";
import { PlaylistClient } from "@/components/playlist/PlaylistClient";

interface Track {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  previewUrl?: string;
  spotifyUrl?: string;
}

interface PlaylistSuggestion {
  id: string;
  guest_name: string | null;
  tracks: Track[];
  track_statuses: Record<string, "accepted" | "rejected" | "pending">;
  submitted_at: string;
}

export default async function PlaylistPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale: "fr" });
  }

  const { data: wedding } = await supabase
    .from("weddings")
    .select("id")
    .eq("user_id", user!.id)
    .single();

  const suggestions: PlaylistSuggestion[] = wedding
    ? await supabase
        .from("playlist_suggestions")
        .select("*")
        .eq("wedding_id", wedding.id)
        .order("submitted_at", { ascending: false })
        .then(({ data }) => (data ?? []) as PlaylistSuggestion[])
    : [];

  return (
    <div className="min-h-screen p-6 md:p-12 max-w-4xl mx-auto space-y-8 bg-[#FDFBF7]">
      <header className="flex flex-col gap-1 pb-4 border-b border-border">
        <h1 className="text-3xl md:text-4xl font-heading font-light text-foreground">
          Playlist Collaborative
        </h1>
        <p className="text-muted-foreground text-sm">Suggestions musicales de vos invités</p>
      </header>

      <PlaylistClient suggestions={suggestions} weddingId={wedding?.id ?? ""} />
    </div>
  );
}
