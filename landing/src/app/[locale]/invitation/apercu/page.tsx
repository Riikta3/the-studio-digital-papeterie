import type { Metadata } from "next";

import { EditorPreview } from "@/components/invitation/editor-preview/EditorPreview";
import { editorOrigins } from "@/lib/editor-origins.mjs";

/**
 * The live preview framed by the dashboard's invitation editor.
 *
 * Not a page anyone visits: opened on its own it only waits for an editor that
 * never speaks, and it draws nothing the visitor did not send it. It lives
 * under `/invitation/` because that is the prefix maintenance mode leaves open
 * (see `proxy.ts`) — the editor must work while the shop is closed — and a
 * static segment wins over `[slug]`, while generated slugs always carry a
 * random suffix, so no couple's address can collide with it.
 *
 * Who may frame it is decided in `next.config.mjs` (`frame-ancestors`) and
 * who may talk to it in `EditorPreview`, from the same list.
 */
export const metadata: Metadata = {
  title: "Aperçu du faire-part",
  robots: { index: false, follow: false },
};

export default function EditorPreviewPage() {
  return <EditorPreview allowedOrigins={editorOrigins()} />;
}
