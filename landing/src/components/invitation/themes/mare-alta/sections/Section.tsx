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
      // A share of the section, which a tall one on a short screen never reaches: the designer's 0.16 left a long
      // programme or a list of ten hotels on a phone held sideways (393px tall, sections of 2,500px) at opacity
      // 0.01 for good. 0.08 is still a band of the section on screen and holds up to 4,900px on that phone.
      threshold={0.08}
      data-editor-section={editorSection}
    >
      {children}
    </Reveal>
  );
}
