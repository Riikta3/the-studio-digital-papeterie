"use client";

import { useEffect } from "react";

/**
 * A theme demo is filled with made-up places: hotels and gift funds on
 * `example.org` (reserved, it never belongs to anyone) and phone numbers that
 * reach no one. Followed, they open an error page or dial a stranger, which
 * reads as a broken site to a couple deciding whether to pay. In a demo those
 * links do nothing; they stay links, so the theme still looks the same.
 */
export function DemoLinkGuard() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!link) return;
      const href = link.getAttribute("href") ?? "";
      if (/^(tel|sms|mailto):/i.test(href) || isExample(href)) {
        event.preventDefault();
      }
    };
    // Capture: runs before a theme's own handlers and before navigation.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}

function isExample(href: string): boolean {
  try {
    const { hostname } = new URL(href, window.location.href);
    return /(^|\.)example\.(org|com|net)$/i.test(hostname);
  } catch {
    return false;
  }
}
