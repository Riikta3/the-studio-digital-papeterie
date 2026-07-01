"use client";

import { createContext, useContext, useState } from "react";

export interface Track {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
}

interface PlaylistContextValue {
  tracks: Track[];
  setTracks: (tracks: Track[]) => void;
}

const PlaylistContext = createContext<PlaylistContextValue>({
  tracks: [],
  setTracks: () => {},
});

export function PlaylistProvider({ children }: { children: React.ReactNode }) {
  const [tracks, setTracks] = useState<Track[]>([]);
  return (
    <PlaylistContext.Provider value={{ tracks, setTracks }}>
      {children}
    </PlaylistContext.Provider>
  );
}

export function usePlaylist() {
  return useContext(PlaylistContext);
}
