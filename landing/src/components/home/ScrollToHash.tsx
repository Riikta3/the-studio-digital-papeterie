"use client";

import { useScrollToHash } from "@/hooks/use-scroll-to-hash";

/**
 * Renders nothing; exists so the homepage (a Server Component) can run the
 * hash-scroll effect. Same shape as `ScrollToTop`.
 *
 * Without it, a product link followed from the studio funnel would land on
 * `/#tarifs` and sit at the top of the page: a client-side navigation resolves
 * the hash against the outgoing document, not the one being rendered.
 */
export function ScrollToHash() {
  useScrollToHash();
  return null;
}
