"use client";

import dynamic from "next/dynamic";

/**
 * The 404 page, behind its own chunk. A not-found boundary is bundled into
 * every page under it, whether or not a 404 ever renders, so a static import
 * here put the view and its animations (framer-motion) on every invitation
 * and every editor preview. Still server-rendered when a 404 does happen.
 */
export const NotFoundViewLoader = dynamic(() =>
  import("./NotFoundView").then((module) => module.NotFoundView),
);
