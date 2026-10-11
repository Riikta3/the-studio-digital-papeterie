"use client";

import dynamic from "next/dynamic";

import { usePathname } from "@/navigation";

import { contactBubbleHidden } from "./contact-bubble-visibility";

/*
 * Not server-rendered: the bubble stays off screen until the visitor scrolls,
 * so there is nothing to paint before its code arrives.
 */
const ContactBubble = dynamic(() => import("./ContactBubble").then((module) => module.ContactBubble), {
  ssr: false,
});

/**
 * The layout's entry point for the contact bubble. The bubble and its
 * animations (framer-motion) are fetched only on the pages that show it, so a
 * guest opening an invitation, or the editor's live preview, does not download
 * them for nothing.
 */
export function ContactBubbleLoader() {
  const pathname = usePathname();
  if (contactBubbleHidden(pathname)) return null;
  return <ContactBubble />;
}
