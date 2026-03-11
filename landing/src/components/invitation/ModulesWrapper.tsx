"use client";

import { PlaylistProvider } from "./PlaylistContext";

export function ModulesWrapper({ children }: { children: React.ReactNode }) {
  return <PlaylistProvider>{children}</PlaylistProvider>;
}
