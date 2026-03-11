import { redirect } from "@/navigation";
import { createClient } from "@/utils/supabase/server";
import { getTranslations } from "next-intl/server";
import { Music2 } from "lucide-react";

interface Track {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
}

interface PlaylistSuggestion {
  id: string;
  guest_name: string | null;
  tracks: Track[];
  submitted_at: string;
}

export default async function PlaylistPage() {
  const t = await getTranslations("Playlist");
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

  const totalTracks = suggestions.reduce((acc, s) => acc + s.tracks.length, 0);

  return (
    <div className="min-h-screen p-6 md:p-12 max-w-7xl mx-auto space-y-8 bg-[#FDFBF7]">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-border">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-heading font-light text-foreground">
            {t("title")}
          </h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
      </header>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white/50 border border-gray-100 shadow-sm rounded-xl p-5">
          <p className="text-sm font-medium text-muted-foreground mb-1">{t("stats.suggestions")}</p>
          <p className="text-2xl font-bold font-heading">{suggestions.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t("stats.guests_submitted")}</p>
        </div>
        <div className="bg-primary/5 border border-primary/10 shadow-sm rounded-xl p-5">
          <p className="text-sm font-medium text-primary mb-1">{t("stats.tracks")}</p>
          <p className="text-2xl font-bold font-heading text-primary">{totalTracks}</p>
          <p className="text-xs text-primary/70 mt-0.5">{t("stats.tracks_proposed")}</p>
        </div>
      </div>

      {/* Suggestions List */}
      {suggestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-primary">
            <Music2 size={28} />
          </div>
          <p className="font-medium text-foreground">{t("empty.title")}</p>
          <p className="text-sm text-muted-foreground max-w-sm">{t("empty.description")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="bg-white border border-border rounded-xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary/30">
                <p className="text-sm font-medium text-foreground">
                  {suggestion.guest_name ?? t("anonymous")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(suggestion.submitted_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="divide-y divide-border">
                {suggestion.tracks.map((track) => (
                  <div key={track.id} className="flex items-center gap-4 px-5 py-3">
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-10 h-10 rounded-lg object-cover shadow-sm shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{track.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
