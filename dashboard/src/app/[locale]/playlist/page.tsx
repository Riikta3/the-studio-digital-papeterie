import { redirect } from "@/navigation";
import { createClient } from "@/utils/supabase/server";
import { PlaylistClient } from "@/components/playlist/PlaylistClient";
import { getLocale, getTranslations } from "next-intl/server";

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
  const t = await getTranslations("Playlist");
  const locale = await getLocale();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale });
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
    <div className="min-h-screen p-6 md:p-12 max-w-4xl mx-auto space-y-8 bg-studio-creme">
      <header className="flex flex-col gap-1 pb-4 border-b border-studio-lavande/30">
        <h1 className="font-heading text-h1 text-studio-violet">
          {t("title")}
        </h1>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
      </header>

      <PlaylistClient suggestions={suggestions} weddingId={wedding?.id ?? ""} />
    </div>
  );
}
