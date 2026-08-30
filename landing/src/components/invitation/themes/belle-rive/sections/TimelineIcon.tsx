/**
 * The four engraved glyphs on the day-1 timeline.
 *
 * They are inline SVG rather than an icon font or image files because they
 * inherit `currentColor` for their strokes and pick the gold accents up from
 * `--icon-gold`, which `.event-icon` defines — a sprite could not follow the
 * theme's palette that way.
 *
 * The set is closed: an entry whose `icon` is unknown falls through to the
 * music glyph rather than leaving an empty medallion.
 */
const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.35,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function TimelineIcon({ type }: { type?: string }) {
  if (type === "heart") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path
          {...STROKE}
          d="M16 26S5.5 20 5.5 12.5A5.5 5.5 0 0 1 16 10a5.5 5.5 0 0 1 10.5 2.5C26.5 20 16 26 16 26Z"
        />
      </svg>
    );
  }

  if (type === "cheers") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path
          {...STROKE}
          d="M4.8 5.2h9.1l-.9 7.1a4.1 4.1 0 0 1-8.1-.7l-.1-6.4Zm4.6 10.9v8.4m-4.2 2.2h8.4M18.1 5.2h9.1l-.1 6.4a4.1 4.1 0 0 1-8.1.7l-.9-7.1Zm4.5 10.9v8.4m-4.2 2.2h8.4M13.2 10.2l5.6-2.6"
        />
        <path
          d="M6 8.8h6.8M19.2 8.8H26"
          stroke="var(--icon-gold)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <circle cx="8.1" cy="7" r=".8" fill="var(--icon-gold)" />
        <circle cx="23.6" cy="6.7" r=".7" fill="var(--icon-gold)" />
      </svg>
    );
  }

  if (type === "cutlery") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path
          {...STROKE}
          d="M6 4v7.4c0 2 1.3 3.6 3 3.6s3-1.6 3-3.6V4M9 4v23M20.2 4v23M20.2 4c4.9 2.1 6.1 9.3 0 12.3"
        />
        <path d="M6 10.8h6" stroke="var(--icon-gold)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="9" cy="26.5" r="1.2" fill="var(--icon-gold)" />
        <circle cx="20.2" cy="26.5" r="1.2" fill="var(--icon-gold)" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path
        {...STROKE}
        d="M12 23V8l13-3v15M12 12l13-3M12 23a4 3 0 1 1-4-3 4 3 0 0 1 4 3Zm13-3a4 3 0 1 1-4-3 4 3 0 0 1 4 3Z"
      />
    </svg>
  );
}
