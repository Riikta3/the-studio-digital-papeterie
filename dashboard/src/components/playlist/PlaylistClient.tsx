"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import {
  Check, X, Play, Music2, CheckCheck,
  ChevronDown, Search, Plus, Trash2, ArrowUpDown, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import {
  updateTrackStatus, batchUpdateTrackStatus, addTrack, deleteTrack,
  type TrackStatus, type TrackPayload,
} from "@/actions/playlist-actions";
import { cn } from "@shared/lib/utils";

interface Track {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  spotifyUrl?: string | null;
}

interface PlaylistSuggestion {
  id: string;
  guest_name: string | null;
  tracks: Track[];
  track_statuses: Record<string, TrackStatus>;
  submitted_at: string;
}

type Filter = "all" | "accepted" | "rejected" | "pending";
type SortKey = "date" | "title" | "artist" | "status";

interface Props {
  suggestions: PlaylistSuggestion[];
  weddingId: string;
}

export function PlaylistClient({ suggestions, weddingId }: Props) {
  const t = useTranslations("Playlist.client");
  const tStats = useTranslations("Playlist.stats");
  const locale = useLocale();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedTrackId, setExpandedTrackId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [optimisticStatuses, setOptimisticStatuses] = useState<Record<string, Record<string, TrackStatus>>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Add track panel
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [addQuery, setAddQuery] = useState("");
  const [addResults, setAddResults] = useState<Track[]>([]);
  const [addSearching, setAddSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ suggestion: PlaylistSuggestion; track: Track } | null>(null);
  const [confirmBatch, setConfirmBatch] = useState<TrackStatus | null>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  const makeKey = (suggestionId: string, trackId: string) => `${suggestionId}::${trackId}`;

  const getStatus = (suggestion: PlaylistSuggestion, trackId: string): TrackStatus =>
    optimisticStatuses[suggestion.id]?.[trackId] ??
    suggestion.track_statuses?.[trackId] ??
    "pending";

  const applyOptimistic = (
    updates: { suggestion: PlaylistSuggestion; trackId: string; next: TrackStatus }[],
  ) => {
    setOptimisticStatuses((prev) => {
      const copy = { ...prev };
      for (const { suggestion, trackId, next } of updates) {
        copy[suggestion.id] = { ...suggestion.track_statuses, ...copy[suggestion.id], [trackId]: next };
      }
      return copy;
    });
  };

  const handleStatusToggle = (suggestion: PlaylistSuggestion, track: Track, status: TrackStatus) => {
    const current = getStatus(suggestion, track.id);
    const next: TrackStatus = current === status ? "pending" : status;
    applyOptimistic([{ suggestion, trackId: track.id, next }]);
    if (next === "accepted") toast.success(t("track_accepted", { title: track.title }), { duration: 2000 });
    else if (next === "rejected") toast.error(t("track_rejected", { title: track.title }), { duration: 2000 });
    startTransition(async () => { await updateTrackStatus(suggestion.id, track.id, status); });
  };

  const executeBatch = (status: TrackStatus) => {
    const items = [...selected].map((key) => {
      const [suggestionId, trackId] = key.split("::");
      return { suggestionId, trackId };
    });
    const count = items.length;
    const updates = items.map(({ suggestionId, trackId }) => ({
      suggestion: suggestions.find((s) => s.id === suggestionId)!,
      trackId,
      next: status,
    }));
    applyOptimistic(updates);
    setSelected(new Set());
    setConfirmBatch(null);
    if (status === "accepted") toast.success(t("batch_accepted", { count }), { duration: 2000 });
    else if (status === "rejected") toast.error(t("batch_rejected", { count }), { duration: 2000 });
    else toast(t("batch_reset", { count }), { duration: 2000 });
    startTransition(async () => { await batchUpdateTrackStatus(items, status); });
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { suggestion, track } = confirmDelete;
    const key = makeKey(suggestion.id, track.id);
    setConfirmDelete(null);
    setDeletingKey(key);
    try {
      await deleteTrack(suggestion.id, track.id);
      toast(t("track_deleted", { title: track.title }), { duration: 2000 });
    } finally {
      setDeletingKey(null);
    }
  };

  const handleAddTrack = async (track: Track) => {
    setAddingId(track.id);
    try {
      const payload: TrackPayload = {
        id: track.id,
        title: track.title,
        artist: track.artist,
        coverUrl: track.coverUrl,
        spotifyUrl: track.spotifyUrl,
      };
      await addTrack(weddingId, payload);
      toast.success(t("track_added", { title: track.title }), { duration: 2000 });
      setAddResults((prev) => prev.filter((r) => r.id !== track.id));
    } finally {
      setAddingId(null);
    }
  };

  // Spotify search for add panel
  useEffect(() => {
    if (!showAddPanel) return;
    if (addQuery.trim().length < 2) { setAddResults([]); return; }
    const timer = setTimeout(async () => {
      setAddSearching(true);
      try {
        const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(addQuery)}`);
        const json = await res.json();
        setAddResults(json.results ?? []);
      } finally {
        setAddSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [addQuery, showAddPanel]);

  useEffect(() => {
    if (showAddPanel) setTimeout(() => addInputRef.current?.focus(), 50);
    else { setAddQuery(""); setAddResults([]); }
  }, [showAddPanel]);

  // Flatten all tracks
  const allTracksWithContext = suggestions.flatMap((s) =>
    s.tracks.map((t) => ({ track: t, suggestion: s })),
  );

  // Already-added track ids for the add panel
  const existingTrackIds = new Set(allTracksWithContext.map(({ track }) => track.id));

  const stats = {
    total: allTracksWithContext.length,
    accepted: allTracksWithContext.filter(({ track, suggestion }) => getStatus(suggestion, track.id) === "accepted").length,
    rejected: allTracksWithContext.filter(({ track, suggestion }) => getStatus(suggestion, track.id) === "rejected").length,
    pending: allTracksWithContext.filter(({ track, suggestion }) => getStatus(suggestion, track.id) === "pending").length,
  };

  const statusOrder: Record<TrackStatus, number> = { accepted: 0, pending: 1, rejected: 2 };

  const filteredAndSorted = allTracksWithContext
    .filter(({ track, suggestion }) => {
      if (filter !== "all" && getStatus(suggestion, track.id) !== filter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return track.title.toLowerCase().includes(q) ||
          track.artist.toLowerCase().includes(q) ||
          (suggestion.guest_name ?? "").toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date") {
        cmp = new Date(a.suggestion.submitted_at).getTime() - new Date(b.suggestion.submitted_at).getTime();
      } else if (sortKey === "title") {
        cmp = a.track.title.localeCompare(b.track.title);
      } else if (sortKey === "artist") {
        cmp = a.track.artist.localeCompare(b.track.artist);
      } else if (sortKey === "status") {
        cmp = statusOrder[getStatus(a.suggestion, a.track.id)] - statusOrder[getStatus(b.suggestion, b.track.id)];
      }
      return sortAsc ? cmp : -cmp;
    });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(true); }
  };

  const handleFilterChange = (f: Filter) => { setFilter(f); setSelected(new Set()); };

  const allFilteredKeys = filteredAndSorted.map(({ track, suggestion }) => makeKey(suggestion.id, track.id));
  const allFilteredSelected = allFilteredKeys.length > 0 && allFilteredKeys.every((k) => selected.has(k));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelected((prev) => { const n = new Set(prev); allFilteredKeys.forEach((k) => n.delete(k)); return n; });
    } else {
      setSelected((prev) => new Set([...prev, ...allFilteredKeys]));
    }
  };

  const toggleSelect = (key: string) => {
    setSelected((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  };

  const SortButton = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => handleSort(k)}
      className={cn(
        "flex items-center gap-1 text-xs px-2 py-1 rounded-md border transition-colors",
        sortKey === k
          ? "border-foreground/30 bg-foreground/5 text-foreground font-medium"
          : "border-border text-muted-foreground hover:border-foreground/20",
      )}
    >
      {label}
      <ArrowUpDown size={11} className={sortKey === k ? "opacity-80" : "opacity-40"} />
    </button>
  );

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: t("filter_all"), count: stats.total },
    { key: "accepted", label: t("filter_accepted"), count: stats.accepted },
    { key: "pending", label: t("filter_pending"), count: stats.pending },
    { key: "rejected", label: t("filter_rejected"), count: stats.rejected },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white/50 border border-studio-lavande/30 shadow-sm rounded-2xl p-5">
          <p className="text-sm font-medium text-muted-foreground mb-1">{tStats("suggestions")}</p>
          <p className="text-2xl font-bold font-heading">{suggestions.filter(s => s.guest_name !== "__admin__").length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{tStats("guests_submitted")}</p>
        </div>
        <div className="bg-teal-50/50 border border-teal-100 shadow-sm rounded-2xl p-5">
          <p className="text-sm font-medium text-teal-600 mb-1">{tStats("accepted")}</p>
          <p className="text-2xl font-bold font-heading text-teal-600">{stats.accepted}</p>
          <p className="text-xs text-teal-500/70 mt-0.5">{tStats("accepted_of_total", { total: stats.total })}</p>
        </div>
        <div className="bg-primary/5 border border-primary/10 shadow-sm rounded-2xl p-5">
          <p className="text-sm font-medium text-primary mb-1">{tStats("tracks")}</p>
          <p className="text-2xl font-bold font-heading text-primary">{stats.total}</p>
          <p className="text-xs text-primary/70 mt-0.5">{tStats("tracks_proposed")}</p>
        </div>
      </div>

      {/* Unified search bar */}
      <div className="bg-white border border-studio-lavande/40 rounded-2xl overflow-hidden">
        {/* Mode tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setShowAddPanel(false)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors",
              !showAddPanel
                ? "text-foreground border-b-2 border-primary -mb-px"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Search size={14} />
            {t("tab_filter")}
          </button>
          <button
            onClick={() => setShowAddPanel(true)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors",
              showAddPanel
                ? "text-foreground border-b-2 border-[#1DB954] -mb-px"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Plus size={14} />
            {t("tab_add_spotify")}
          </button>
        </div>

        {/* Input */}
        <div className="relative p-3">
          <Search size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground" />
          {!showAddPanel ? (
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("search_placeholder")}
              className="w-full pl-8 pr-8 py-2 text-sm rounded-lg bg-studio-lavande/10 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:bg-white transition-colors"
            />
          ) : (
            <input
              ref={addInputRef}
              type="text"
              value={addQuery}
              onChange={(e) => setAddQuery(e.target.value)}
              placeholder={t("search_spotify_placeholder")}
              className="w-full pl-8 pr-8 py-2 text-sm rounded-lg bg-studio-lavande/10 focus:outline-none focus:ring-1 focus:ring-[#1DB954]/40 focus:bg-white transition-colors"
            />
          )}
          <div className="absolute right-6 top-1/2 -translate-y-1/2">
            {!showAddPanel && search && (
              <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
                <X size={13} />
              </button>
            )}
            {showAddPanel && addSearching && <Loader2 size={14} className="text-muted-foreground animate-spin" />}
            {showAddPanel && !addSearching && addQuery && (
              <button onClick={() => setAddQuery("")} className="text-muted-foreground hover:text-foreground">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Spotify results */}
        {showAddPanel && addResults.length > 0 && (
          <div className="divide-y divide-border border-t border-border">
            {addResults.map((track) => {
              const alreadyIn = existingTrackIds.has(track.id);
              return (
                <div key={track.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-studio-lavande/10 transition-colors">
                  <img src={track.coverUrl} alt={track.title} className="w-9 h-9 rounded-md object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{track.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                  </div>
                  <button
                    onClick={() => handleAddTrack(track)}
                    disabled={alreadyIn || addingId === track.id}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0",
                      alreadyIn
                        ? "bg-studio-lavande/15 text-muted-foreground cursor-default"
                        : "bg-[#1DB954] text-white hover:bg-[#1DB954]/90",
                    )}
                  >
                    {addingId === track.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : alreadyIn ? (
                      <><Check size={12} /> {t("already_added")}</>
                    ) : (
                      <><Plus size={12} /> {t("add")}</>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {showAddPanel && addQuery.length >= 2 && !addSearching && addResults.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4 border-t border-border">{t("no_results")}</p>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {filters.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => handleFilterChange(key)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors",
                filter === key
                  ? key === "accepted" ? "bg-teal-500 text-white border-teal-500"
                    : key === "rejected" ? "bg-red-500 text-white border-red-500"
                    : key === "pending" ? "bg-studio-jaune text-studio-violet border-studio-jaune"
                    : "bg-foreground text-background border-foreground"
                  : "bg-white border-border text-muted-foreground hover:border-foreground/30",
              )}
            >
              {label}
              <span className={cn("text-xs px-1.5 py-0.5 rounded-full", filter === key ? "bg-white/20" : "bg-studio-lavande/15")}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground mr-1">{t("sort_label")}</span>
          <SortButton k="date" label={t("sort_date")} />
          <SortButton k="title" label={t("sort_title")} />
          <SortButton k="artist" label={t("sort_artist")} />
          <SortButton k="status" label={t("sort_status")} />
        </div>
      </div>

      {/* Tracks list */}
      {filteredAndSorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-primary">
            <Music2 size={28} />
          </div>
          <p className="font-medium text-foreground">
            {search ? t("no_match_search") :
              filter === "all" ? t("no_suggestions") :
              filter === "accepted" ? t("no_tracks_accepted") :
              filter === "rejected" ? t("no_tracks_rejected") :
              t("no_tracks_pending")}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-studio-lavande/40 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-2.5 border-b border-border bg-studio-lavande/5">
            <input
              type="checkbox"
              checked={allFilteredSelected}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-studio-lavande/50 accent-foreground cursor-pointer"
            />
            {selected.size > 0 ? (
              <>
                <span className="text-xs text-muted-foreground">
                  {t("selected_count", { count: selected.size })}
                </span>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => setConfirmBatch("accepted")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-400 text-white hover:bg-teal-500 transition-colors"
                  >
                    <CheckCheck size={13} /> {t("accept")}
                  </button>
                  <button
                    onClick={() => setConfirmBatch("rejected")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
                  >
                    <X size={13} /> {t("reject")}
                  </button>
                  <button
                    onClick={() => setConfirmBatch("pending")}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:bg-studio-lavande/10 transition-colors"
                  >
                    {t("reset")}
                  </button>
                </div>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">
                {t("track_count", { count: filteredAndSorted.length })}
              </span>
            )}
          </div>

          <div className="divide-y divide-border">
            {filteredAndSorted.map(({ track, suggestion }) => {
              const status = getStatus(suggestion, track.id);
              const key = makeKey(suggestion.id, track.id);
              const isSelected = selected.has(key);
              const isExpanded = expandedTrackId === key;
              const isDeleting = deletingKey === key;
              const isAdmin = suggestion.guest_name === "__admin__";

              return (
                <div key={key}>
                  <div
                    className={cn(
                      "flex items-center gap-4 px-5 py-3 transition-colors",
                      isSelected && "bg-blue-50/40",
                      !isSelected && status === "accepted" && "bg-teal-50/40",
                      !isSelected && status === "rejected" && "bg-red-50/30 opacity-60",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(key)}
                      className="w-4 h-4 rounded border-studio-lavande/50 accent-foreground cursor-pointer shrink-0"
                    />

                    {/* Cover + embed toggle */}
                    <div className="relative shrink-0 w-11 h-11 group">
                      <img src={track.coverUrl} alt={track.title} className="w-11 h-11 rounded-lg object-cover shadow-sm" />
                      <button
                        onClick={() => setExpandedTrackId((p) => p === key ? null : key)}
                        className="absolute inset-0 rounded-lg flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all"
                        title={isExpanded ? t("close") : t("listen_on_spotify")}
                      >
                        {isExpanded
                          ? <ChevronDown size={16} className="text-white opacity-0 group-hover:opacity-100" />
                          : <Play size={14} className="text-white opacity-0 group-hover:opacity-100" />}
                      </button>
                      {isExpanded && <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#1DB954] rounded-full" />}
                    </div>

                    {/* Track info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{track.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5">
                        {isAdmin ? t("added_by_you") : t("added_by_guest", { name: suggestion.guest_name ?? t("anonymous_guest") })}
                        {" · "}
                        {t("added_on")}{" "}
                        {new Date(suggestion.submitted_at).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleStatusToggle(suggestion, track, "accepted")}
                        className={cn(
                          "p-1.5 rounded-lg transition-colors",
                          status === "accepted" ? "bg-teal-400 text-white" : "text-muted-foreground hover:bg-teal-50 hover:text-teal-600",
                        )}
                        title={t("accept")}
                      >
                        <Check size={15} />
                      </button>
                      <button
                        onClick={() => handleStatusToggle(suggestion, track, "rejected")}
                        className={cn(
                          "p-1.5 rounded-lg transition-colors",
                          status === "rejected" ? "bg-red-500 text-white" : "text-muted-foreground hover:bg-red-50 hover:text-red-500",
                        )}
                        title={t("reject")}
                      >
                        <X size={15} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete({ suggestion, track })}
                        disabled={isDeleting}
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
                        title={t("delete")}
                      >
                        {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Spotify embed */}
                  {isExpanded && (
                    <div className="px-5 pb-4 bg-studio-lavande/5 border-t border-border">
                      <div className="flex items-center justify-between mt-3 mb-1">
                        <span className="text-xs text-muted-foreground">{t("spotify_preview")}</span>
                        <button
                          onClick={() => setExpandedTrackId(null)}
                          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                        >
                          <X size={12} /> {t("close")}
                        </button>
                      </div>
                      <iframe
                        src={`https://open.spotify.com/embed/track/${track.id}?utm_source=generator&theme=0`}
                        width="100%"
                        height="80"
                        frameBorder="0"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                        className="rounded-xl"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirm delete modal */}
      {confirmDelete && (
        <ConfirmModal
          title={t("delete_track_title")}
          description={t("delete_track_desc", { title: confirmDelete.track.title })}
          confirmLabel={t("delete")}
          cancelLabel={t("cancel")}
          confirmClassName="bg-red-500 hover:bg-red-600"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={handleDelete}
        />
      )}

      {/* Confirm batch modal */}
      {confirmBatch && (
        <ConfirmModal
          title={
            confirmBatch === "accepted" ? t("confirm_accept_title") :
            confirmBatch === "rejected" ? t("confirm_reject_title") :
            t("confirm_reset_title")
          }
          description={`${t("confirm_batch_desc", { count: selected.size })} ${
            confirmBatch === "accepted" ? t("marked_accepted") :
            confirmBatch === "rejected" ? t("marked_rejected") :
            t("marked_reset")
          }.`}
          confirmLabel={t("confirm")}
          cancelLabel={t("cancel")}
          confirmClassName={
            confirmBatch === "accepted" ? "bg-teal-400 hover:bg-teal-500" :
            confirmBatch === "rejected" ? "bg-red-500 hover:bg-red-600" :
            "bg-foreground hover:bg-foreground/80"
          }
          onCancel={() => setConfirmBatch(null)}
          onConfirm={() => executeBatch(confirmBatch)}
        />
      )}
    </div>
  );
}

function ConfirmModal({
  title, description, confirmLabel, cancelLabel, confirmClassName, onCancel, onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  confirmClassName: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
        <div className="space-y-1.5">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm border border-border text-muted-foreground hover:bg-studio-lavande/10 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors", confirmClassName)}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
