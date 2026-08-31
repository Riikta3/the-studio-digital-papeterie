"use client";

import { useSyncExternalStore } from "react";

import { THEMES } from "./themes";

/**
 * Which theme the home page is showing, shared between the hero fan and the
 * phone mockup further down.
 *
 * The two live in different sections of a Server Component page, so neither can
 * own the state and lifting it into `page.tsx` would turn the whole home into a
 * client component for the sake of one number. A module-level store keeps the
 * page a server component: the hero publishes the index it fans to, the mockup
 * subscribes to it, and "Tester le thème X" scrolls to a mockup already showing
 * X — which is what the button's own label promises.
 *
 * The value is an index into `THEMES`, not a name: `Preview` selects by index
 * (its carousel highlights `index === active`), and a name would have to be
 * resolved back to one anyway — a lookup that silently yields -1 the day a
 * theme is renamed in one place and not the other.
 */

// Defaults to the card the hero fan opens on, so the mockup agrees with the
// hero from the first paint rather than after the first interaction.
const INITIAL_INDEX = Math.floor(THEMES.length / 2);

let selectedIndex = INITIAL_INDEX;
const listeners = new Set<() => void>();

export function setSelectedThemeIndex(index: number) {
  // Guards against an out-of-range write leaving the mockup on `undefined`:
  // the hero's carousel counter is unbounded and wraps by modulo, and the
  // theme list changes length whenever a theme ships.
  if (index < 0 || index >= THEMES.length || index === selectedIndex) return;
  selectedIndex = index;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSelectedThemeIndex(): number {
  return useSyncExternalStore(
    subscribe,
    () => selectedIndex,
    // The server has no selection to report; both sides must render the same
    // initial card or hydration mismatches on the mockup's iframe src.
    () => INITIAL_INDEX,
  );
}
