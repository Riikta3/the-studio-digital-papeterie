import type { ReactNode } from "react";

import { Reveal } from "../../reveal";

/**
 * A designer section: `.section` with the `reveal` class, shown (`visible`) once
 * seen. The designer's script observed every `.reveal` in the document and added
 * a `motion-title` class to every `.section h2`; here each section observes
 * itself and its title carries the class in the markup.
 */
export function Section({
  id,
  className,
  editorSection,
  children,
}: {
  id?: string;
  className: string;
  editorSection?: string;
  children: ReactNode;
}) {
  return (
    <Reveal
      as="section"
      id={id}
      className={`section ${className} reveal`}
      revealedClass="visible"
      threshold={0.13}
      data-editor-section={editorSection}
    >
      {children}
    </Reveal>
  );
}
