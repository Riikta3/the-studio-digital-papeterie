"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** True once rendered in the browser — false on the server and while hydrating. */
export function useIsClient(): boolean {
  return useSyncExternalStore(noop, () => true, () => false);
}
