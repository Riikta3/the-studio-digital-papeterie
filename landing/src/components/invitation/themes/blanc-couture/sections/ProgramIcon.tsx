/**
 * The five line icons of the timeline, drawn inline.
 *
 * They are SVG rather than an icon font or images because they inherit
 * `currentColor` from `.event-icon`, which is what puts them in gold inside the
 * ring. The set is closed: an unknown key falls back to the welcome glyph, as
 * in the source.
 */
export function ProgramIcon({ type }: { type?: string }) {
  const stroke = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.25,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (type === "rings") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <g {...stroke}>
          <circle cx="12" cy="17" r="6" />
          <circle cx="20" cy="17" r="6" />
          <path d="m10 9 2-3 2 3m4 0 2-3 2 3" />
        </g>
      </svg>
    );
  }

  if (type === "glasses") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <g {...stroke}>
          <path d="M7 6h8c0 8-1 11-4 12v7m-4 0h8M17 6h8c0 8-1 11-4 12v7m-4 0h8" />
          <path d="M8 11h6m4 0h6" />
        </g>
      </svg>
    );
  }

  if (type === "dinner") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <g {...stroke}>
          <circle cx="16" cy="16" r="8" />
          <circle cx="16" cy="16" r="5" />
          <path d="M5 7v18M3 7v7c0 2 4 2 4 0V7m20 0v18m0-18c-3 3-3 8 0 10" />
        </g>
      </svg>
    );
  }

  if (type === "music") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <g {...stroke}>
          <path d="M13 23V9l12-3v14" />
          <ellipse cx="9.5" cy="24" rx="3.5" ry="2.5" />
          <ellipse cx="21.5" cy="21" rx="3.5" ry="2.5" />
        </g>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <g {...stroke}>
        <path d="M16 5c-4 5-7 7-7 12a7 7 0 0 0 14 0c0-5-3-7-7-12Z" />
        <path d="M12 18c2 2 6 2 8 0" />
      </g>
    </svg>
  );
}
