import type { ReactNode } from "react";

import { Reveal } from "../../reveal";

/**
 * A designer section: the `.paper-section` / `.coral-section` / `.night-section`
 * ground, hidden until seen.
 *
 * The designer's page added `in-view` to every `section:not(.hero)` from one
 * global observer; each section observes itself instead (`Reveal`), so the
 * theme works in the editor's preview next to other components.
 */
export function Section({
  id,
  className,
  editorSection,
  children,
}: {
  id?: string;
  className: string;
  /** An id from `shared/data/invitation-sections.ts`; omit for a block with no tab. */
  editorSection?: string;
  children: ReactNode;
}) {
  return (
    <Reveal
      as="section"
      id={id}
      className={className}
      revealedClass="in-view"
      threshold={0.16}
      data-editor-section={editorSection}
    >
      {children}
    </Reveal>
  );
}
