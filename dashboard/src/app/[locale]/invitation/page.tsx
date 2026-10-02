import { type EditorSectionId, isEditorSectionId } from "@shared/data/invitation-sections";
import { addableModules } from "@shared/lib/addable-modules";

import { loadInvitationEditor } from "@/actions/invitation-editor-actions";
import { InvitationEditor } from "@/components/editor/InvitationEditor";

/**
 * The invitation editor — one screen for every word of the couple's invitation.
 *
 * It replaced the separate screens (nos-mots, événements, programme, lieu,
 * FAQ, and one per module), which now redirect here to the matching tab.
 * `/modules` links here with `?add=<id>` to add a module (spec D11).
 */
export default async function InvitationEditorPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string; add?: string }>;
}) {
  const [{ section, add }, bootstrap] = await Promise.all([searchParams, loadInvitationEditor()]);
  const { meta } = bootstrap;

  const initialAdd =
    add && addableModules(meta.themeId, meta.ownedModules, meta.pendingModules).includes(add) ? add : undefined;

  // A section the couple does not have (an old link, a module not added)
  // opens the hero rather than a tab that does not exist.
  const reachable = new Set<string>([
    "hero",
    "footer",
    ...meta.ownedModules,
    ...meta.pendingModules,
    ...(initialAdd ? [initialAdd] : []),
  ]);
  const wanted = initialAdd ?? section;
  const initialSection: EditorSectionId =
    isEditorSectionId(wanted) && reachable.has(wanted) ? wanted : "hero";

  return <InvitationEditor bootstrap={bootstrap} initialSection={initialSection} initialAdd={initialAdd} />;
}
