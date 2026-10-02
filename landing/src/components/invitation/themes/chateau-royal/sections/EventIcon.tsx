import type { ReactNode } from "react";

import type { ScheduleIcon } from "../../types";

const DRAWINGS: Record<string, ReactNode> = {
  rings: (
    <>
      <circle cx="24" cy="35" r="13" />
      <circle cx="40" cy="35" r="13" />
      <path d="m24 17 4-6 4 6-4 3z" />
    </>
  ),
  glasses: (
    <path d="M10 11h18l-2 17c-.6 5-3 7-7 7s-6.4-2-7-7zM19 35v16m-9 2h18M36 11h18l-2 17c-.6 5-3 7-7 7s-6.4-2-7-7zM45 35v16m-9 2h18" />
  ),
  dinner: <path d="M11 40c1-12 10-21 21-21s20 9 21 21zM8 43h48M32 19v-6m-3-2h6M15 50h34" />,
  music: (
    <path d="M27 44V16l24-5v28M27 22l24-5M27 44c0 7-16 9-16 2s16-9 16-2zm24-5c0 7-16 9-16 2s16-9 16-2z" />
  ),
  star: <path d="m32 6 5 19 19 7-19 7-5 19-5-19-19-7 19-7zM11 11l4 4m34 34 4 4" />,
};

/**
 * What a moment is, drawn the designer's way. The contract names the moment —
 * never the drawing: ceremony → rings, cocktail → glasses, dinner and brunch →
 * a laid table, party → music; a moment that names none gets the star the
 * designer put on the ball.
 */
const FOR_MOMENT: Record<ScheduleIcon, string> = {
  ceremony: "rings",
  cocktail: "glasses",
  dinner: "dinner",
  brunch: "dinner",
  party: "music",
};

/**
 * The round medallion beside a moment. The class on the wrapper (`rings`,
 * `glasses`, `dinner`, `music`, `star`) is what the designer's CSS addresses —
 * the music icon sways when its moment is lit.
 *
 * A moment the couple illustrated shows their photograph in the medallion
 * instead of the line drawing.
 */
export function EventIcon({ icon, image, label }: { icon?: ScheduleIcon; image?: string; label?: string }) {
  if (image) {
    return (
      <div className="event-icon cr-photo">
        {/* eslint-disable-next-line @next/next/no-img-element -- the couple's own photograph, cropped by CSS. */}
        <img src={image} alt={label ?? ""} loading="lazy" />
      </div>
    );
  }

  const name = icon ? FOR_MOMENT[icon] : "star";
  return (
    <div className={`event-icon ${name}`} aria-hidden="true">
      <svg viewBox="0 0 64 64">{DRAWINGS[name]}</svg>
    </div>
  );
}
