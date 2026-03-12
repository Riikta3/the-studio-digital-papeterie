"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import {
  Check, X, Play, Music2, CheckCheck,
  ChevronDown, Search, Plus, Trash2, ArrowUpDown, Loader2,
} from "lucide-react";
import { toast } from "sonner";
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
    if (next === "accepted") toast.success(`"${track.title}" accepté`, { duration: 2000 });
    else if (next === "rejected") toast.error(`"${track.title}" refusé`, { duration: 2000 });
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
    if (status === "accepted") toast.success(`${count} titre${count > 1 ? "s" : ""} accepté${count > 1 ? "s" : ""}`, { duration: 2000 });
    else if (status === "rejected") toast.error(`${count} titre${count > 1 ? "s" : ""} refusé${count > 1 ? "s" : ""}`, { duration: 2000 });
    else toast(`${count} titre${count > 1 ? "s" : ""} réinitialisé${count > 1 ? "s" : ""}`, { duration: 2000 });
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
      toast(`"${track.title}" supprimé`, { duration: 2000 });
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
      toast.success(`"${track.title}" ajouté à la playlist`, { duration: 2000 });
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
    { key: "all", label: "Tous", count: stats.total },
    { key: "accepted", label: "Acceptés", count: stats.accepted },
    { key: "pending", label: "En attente", count: stats.pending },
    { key: "rejected", label: "Refusés", count: stats.rejected },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white/50 border border-gray-100 shadow-sm rounded-xl p-5">
          <p className="text-sm font-medium text-muted-foreground mb-1">Suggestions</p>
          <p className="text-2xl font-bold font-heading">{suggestions.filter(s => s.guest_name !== "__admin__").length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">invités ont proposé des titres</p>
        </div>
        <div className="bg-green-50/50 border border-green-100 shadow-sm rounded-xl p-5">
          <p className="text-sm font-medium text-green-700 mb-1">Titres acceptés</p>
          <p className="text-2xl font-bold font-heading text-green-700">{stats.accepted}</p>
          <p className="text-xs text-green-600/70 mt-0.5">sur {stats.total} proposés</p>
        </div>
        <div className="bg-primary/5 border border-primary/10 shadow-sm rounded-xl p-5">
          <p className="text-sm font-medium text-primary mb-1">Titres proposés</p>
          <p className="text-2xl font-bold font-heading text-primary">{stats.total}</p>
          <p className="text-xs text-primary/70 mt-0.5">au total</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un titre, artiste, invité..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Add button */}
        <button
          onClick={() => setShowAddPanel((v) => !v)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors shrink-0",
            showAddPanel
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-white border-border text-foreground hover:bg-gray-50",
          )}
        >
          <Plus size={15} />
          Ajouter un titre
        </button>
      </div>

      {/* Add panel */}
      {showAddPanel && (
        <div className="bg-white border border-border rounded-xl p-4 space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={addInputRef}
              type="text"
              value={addQuery}
              onChange={(e) => setAddQuery(e.target.value)}
              placeholder="Rechercher sur Spotify..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            {addSearching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />}
            {!addSearching && addQuery && (
              <button onClick={() => setAddQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X size={13} />
              </button>
            )}
          </div>

          {addResults.length > 0 && (
            <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
              {addResults.map((track) => {
                const alreadyIn = existingTrackIds.has(track.id);
                return (
                  <div key={track.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
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
                          ? "bg-gray-100 text-muted-foreground cursor-default"
                          : "bg-primary text-primary-foreground hover:bg-primary/90",
                      )}
                    >
                      {addingId === track.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : alreadyIn ? (
                        <><Check size={12} /> Déjà ajouté</>
                      ) : (
                        <><Plus size={12} /> Ajouter</>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {addQuery.length >= 2 && !addSearching && addResults.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Aucun résultat</p>
          )}
        </div>
      )}

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
                  ? key === "accepted" ? "bg-green-600 text-white border-green-600"
                    : key === "rejected" ? "bg-red-500 text-white border-red-500"
                    : key === "pending" ? "bg-amber-500 text-white border-amber-500"
                    : "bg-foreground text-background border-foreground"
                  : "bg-white border-border text-muted-foreground hover:border-foreground/30",
              )}
            >
              {label}
              <span className={cn("text-xs px-1.5 py-0.5 rounded-full", filter === key ? "bg-white/20" : "bg-gray-100")}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground mr-1">Trier&nbsp;:</span>
          <SortButton k="date" label="Date" />
          <SortButton k="title" label="Titre" />
          <SortButton k="artist" label="Artiste" />
          <SortButton k="status" label="Statut" />
        </div>
      </div>

      {/* Tracks list */}
      {filteredAndSorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-primary">
            <Music2 size={28} />
          </div>
          <p className="font-medium text-foreground">
            {search ? "Aucun titre ne correspond à la recherche" :
              filter === "all" ? "Aucune suggestion pour le moment" :
              `Aucun titre ${filter === "accepted" ? "accepté" : filter === "rejected" ? "refusé" : "en attente"}`}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-2.5 border-b border-border bg-gray-50/60">
            <input
              type="checkbox"
              checked={allFilteredSelected}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-gray-300 accent-foreground cursor-pointer"
            />
            {selected.size > 0 ? (
              <>
                <span className="text-xs text-muted-foreground">
                  {selected.size} titre{selected.size > 1 ? "s" : ""} sélectionné{selected.size > 1 ? "s" : ""}
                </span>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => setConfirmBatch("accepted")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500 text-white hover:bg-green-600 transition-colors"
                  >
                    <CheckCheck size={13} /> Accepter
                  </button>
                  <button
                    onClick={() => setConfirmBatch("rejected")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
                  >
                    <X size={13} /> Refuser
                  </button>
                  <button
                    onClick={() => setConfirmBatch("pending")}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:bg-gray-50 transition-colors"
                  >
                    Réinitialiser
                  </button>
                </div>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">
                {filteredAndSorted.length} titre{filteredAndSorted.length > 1 ? "s" : ""}
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
                      !isSelected && status === "accepted" && "bg-green-50/40",
                      !isSelected && status === "rejected" && "bg-red-50/30 opacity-60",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(key)}
                      className="w-4 h-4 rounded border-gray-300 accent-foreground cursor-pointer shrink-0"
                    />

                    {/* Cover + embed toggle */}
                    <div className="relative shrink-0 w-11 h-11 group">
                      <img src={track.coverUrl} alt={track.title} className="w-11 h-11 rounded-lg object-cover shadow-sm" />
                      <button
                        onClick={() => setExpandedTrackId((p) => p === key ? null : key)}
                        className="absolute inset-0 rounded-lg flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all"
                        title={isExpanded ? "Fermer" : "Écouter sur Spotify"}
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
                        {isAdmin ? "Ajouté par vous" : `par ${suggestion.guest_name ?? "Invité anonyme"}`}
                        {" · le "}
                        {new Date(suggestion.submitted_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleStatusToggle(suggestion, track, "accepted")}
                        className={cn(
                          "p-1.5 rounded-lg transition-colors",
                          status === "accepted" ? "bg-green-500 text-white" : "text-muted-foreground hover:bg-green-50 hover:text-green-600",
                        )}
                        title="Accepter"
                      >
                        <Check size={15} />
                      </button>
                      <button
                        onClick={() => handleStatusToggle(suggestion, track, "rejected")}
                        className={cn(
                          "p-1.5 rounded-lg transition-colors",
                          status === "rejected" ? "bg-red-500 text-white" : "text-muted-foreground hover:bg-red-50 hover:text-red-500",
                        )}
                        title="Refuser"
                      >
                        <X size={15} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete({ suggestion, track })}
                        disabled={isDeleting}
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
                        title="Supprimer"
                      >
                        {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Spotify embed */}
                  {isExpanded && (
                    <div className="px-5 pb-4 bg-gray-50/60 border-t border-border">
                      <div className="flex items-center justify-between mt-3 mb-1">
                        <span className="text-xs text-muted-foreground">Aperçu Spotify</span>
                        <button
                          onClick={() => setExpandedTrackId(null)}
                          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                        >
                          <X size={12} /> Fermer
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
          title="Supprimer ce titre ?"
          description={`"${confirmDelete.track.title}" sera définitivement retiré de la playlist.`}
          confirmLabel="Supprimer"
          confirmClassName="bg-red-500 hover:bg-red-600"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={handleDelete}
        />
      )}

      {/* Confirm batch modal */}
      {confirmBatch && (
        <ConfirmModal
          title={
            confirmBatch === "accepted" ? "Accepter la sélection ?" :
            confirmBatch === "rejected" ? "Refuser la sélection ?" :
            "Réinitialiser la sélection ?"
          }
          description={`${selected.size} titre${selected.size > 1 ? "s" : ""} seront ${
            confirmBatch === "accepted" ? "marqués comme acceptés" :
            confirmBatch === "rejected" ? "marqués comme refusés" :
            "remis en attente"
          }.`}
          confirmLabel="Confirmer"
          confirmClassName={
            confirmBatch === "accepted" ? "bg-green-500 hover:bg-green-600" :
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
  title, description, confirmLabel, confirmClassName, onCancel, onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  confirmClassName: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
        <div className="space-y-1.5">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm border border-border text-muted-foreground hover:bg-gray-50 transition-colors"
          >
            Annuler
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
