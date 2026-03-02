"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Music, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export interface PlaylistData {
  title: string;
  subtitle: string;
  description: string;
}

// Track type definition
export interface Track {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  uri?: string;
}

const DEFAULT_PLAYLIST_TEXT = {
  title: "Musique",
  subtitle: "Playlist Collaborative",
  description:
    "Aidez le DJ à préparer la soirée parfaite ! Recherchez et proposez jusqu'à 3 titres qui vous feront danser jusqu'au bout de la nuit. (Note : les musiques proposées ne seront pas forcément toutes jouées lors de la soirée).",
};

export function PlaylistModule({ weddingId }: { weddingId: string }) {
  const data = DEFAULT_PLAYLIST_TEXT;
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Track[]>([]);
  const [addedTracks, setAddedTracks] = useState<Map<string, Track>>(new Map());

  useEffect(() => {
    // We use an AbortController in case the user types fast and we want to cancel the previous request
    const controller = new AbortController();
    const signal = controller.signal;

    if (searchQuery.trim().length > 2) {
      setIsSearching(true);

      // Add a slight debounce to avoid hammering the API on every keystroke
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(
            `/api/spotify/search?q=${encodeURIComponent(searchQuery)}`,
            { signal },
          );
          if (!res.ok) throw new Error("Erreur de recherche API");

          const json = await res.json();
          setResults(json.results || []);
        } catch (error: any) {
          if (error.name !== "AbortError") {
            console.error("Erreur Spotify:", error);
            // Fallback pour la démo si l'API crashe
            setResults([]);
          }
        } finally {
          setIsSearching(false);
        }
      }, 500);

      return () => {
        clearTimeout(timer);
        controller.abort();
      };
    } else {
      setResults([]);
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleAddTrack = (track: Track) => {
    setAddedTracks((prev) => {
      if (prev.size >= 3) return prev; // Limit to 3
      const newMap = new Map(prev);
      newMap.set(track.id, track);
      return newMap;
    });
  };

  const handleRemoveTrack = (trackId: string) => {
    setAddedTracks((prev) => {
      const newMap = new Map(prev);
      newMap.delete(trackId);
      return newMap;
    });
  };

  return (
    <section className='w-full'>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className='max-w-4xl mx-auto px-4 text-center'
      >
        <p className='text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-[#6C7A6E] mb-4'>
          {data.title}
        </p>
        <h3 className='font-heading text-5xl md:text-6xl italic text-[#333333] mb-8'>
          {data.subtitle}
        </h3>

        <div className='bg-white rounded-[2rem] p-8 md:p-12 border border-[#EAEAEA] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.06)] max-w-2xl mx-auto flex flex-col items-center transition-all duration-500'>
          {/* Header Icon & Text */}
          <div className='w-16 h-16 bg-[#F5F7F5] rounded-full flex items-center justify-center mb-6 text-[#4B6856] shrink-0'>
            <Music className='w-6 h-6 opacity-80' />
          </div>
          <p className='text-[#556B5D] text-base leading-relaxed font-light mb-10'>
            {data.description}
          </p>

          {/* Search Input Container */}
          <div className='w-full max-w-md relative'>
            <div className='relative flex items-center'>
              <Search className='absolute left-5 w-5 h-5 text-[#6C7A6E] opacity-60' />
              <input
                type='text'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  addedTracks.size >= 3
                    ? "Limite de 3 mondes atteinte"
                    : "Rechercher un titre, un artiste..."
                }
                disabled={addedTracks.size >= 3}
                className='w-full bg-white border border-[#EBEBEB] text-[#333333] placeholder:text-[#6C7A6E]/50 rounded-full py-4 pl-14 pr-6 focus:outline-none focus:ring-1 focus:ring-[#4B6856]/40 focus:border-[#4B6856]/60 transition-all font-light shadow-sm hover:border-[#D0D8D3] disabled:bg-[#F5F7F5] disabled:cursor-not-allowed disabled:opacity-70'
              />
            </div>

            {/* Simulated Search Progress */}
            <AnimatePresence>
              {isSearching && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className='absolute right-6 top-1/2 -translate-y-1/2 flex gap-1'
                >
                  <span
                    className='w-1.5 h-1.5 bg-[#4B6856]/40 rounded-full animate-bounce'
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className='w-1.5 h-1.5 bg-[#4B6856]/40 rounded-full animate-bounce'
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className='w-1.5 h-1.5 bg-[#4B6856]/40 rounded-full animate-bounce'
                    style={{ animationDelay: "300ms" }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Search Results Dropdown-style List */}
          <AnimatePresence>
            {results.length > 0 && !isSearching && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className='w-full max-w-md mt-6 bg-[#F9F9F9]/50 rounded-2xl border border-[#EAEAEA] overflow-hidden'
              >
                <ul className='divide-y divide-[#EAEAEA]'>
                  {results.map((track, index) => {
                    const isAdded = addedTracks.has(track.id);
                    return (
                      <motion.li
                        key={track.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className='flex items-center gap-4 p-4 hover:bg-[#F5F7F5] transition-colors group'
                      >
                        {/* Album Cover */}
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          className='w-12 h-12 rounded-lg object-cover shadow-sm'
                        />

                        {/* Track Info */}
                        <div className='flex-1 text-left min-w-0'>
                          <h4 className='font-semibold text-[#333333] truncate text-sm'>
                            {track.title}
                          </h4>
                          <p className='text-xs text-[#6C7A6E] truncate mt-0.5'>
                            {track.artist}
                          </p>
                        </div>

                        {/* Add Button */}
                        <button
                          onClick={() => handleAddTrack(track)}
                          disabled={isAdded || addedTracks.size >= 3}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${
                            isAdded
                              ? "bg-[#4B6856] text-white"
                              : addedTracks.size >= 3
                                ? "bg-white border border-[#EBEBEB] text-[#C4C4C4] cursor-not-allowed"
                                : "bg-white border border-[#EBEBEB] text-[#4B6856] hover:border-[#4B6856]/30 hover:bg-[#F5F7F5]"
                          }`}
                        >
                          <AnimatePresence mode='wait'>
                            {isAdded ? (
                              <motion.div
                                key='check'
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                              >
                                <Check className='w-5 h-5' />
                              </motion.div>
                            ) : (
                              <motion.div
                                key='plus'
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                              >
                                <Plus className='w-5 h-5 opacity-70' />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </button>
                      </motion.li>
                    );
                  })}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Display Added Tracks */}
          <AnimatePresence>
            {addedTracks.size > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className='w-full mt-10'
              >
                <h4 className='text-xs font-bold uppercase tracking-[0.15em] text-[#6C7A6E] mb-6 text-left w-full pl-2'>
                  Titres proposés pour la soirée ({addedTracks.size}/3)
                </h4>
                <div className='flex flex-col gap-3'>
                  {Array.from(addedTracks.values()).map((track, i) => (
                    <motion.div
                      key={track.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className='flex items-center gap-4 bg-[#F9F9F9] border border-[#EBEBEB] p-3 rounded-2xl group transition-all hover:bg-white hover:border-[#D0D8D3] hover:shadow-sm'
                    >
                      <img
                        src={track.coverUrl}
                        alt={track.title}
                        className='w-12 h-12 rounded-lg object-cover shadow-sm'
                      />
                      <div className='flex-1 text-left min-w-0'>
                        <h5 className='font-semibold text-[#333333] text-sm truncate'>
                          {track.title}
                        </h5>
                        <p className='text-xs text-[#6C7A6E] truncate'>
                          {track.artist}
                        </p>
                      </div>

                      <button
                        onClick={() => handleRemoveTrack(track.id)}
                        className='w-8 h-8 rounded-full flex items-center justify-center text-[#6C7A6E] hover:bg-[#FEE2E2] hover:text-[#EF4444] transition-all bg-[#F5F7F5] shrink-0'
                        title='Retirer ce titre'
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </section>
  );
}
