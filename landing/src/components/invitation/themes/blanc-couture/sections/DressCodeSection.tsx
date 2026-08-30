import type { InvitationData } from "../../types";

import { Page } from "./Page";

/**
 * Dress code and its palette.
 *
 * The source pinned the four colours in CSS through
 * `.natural-palette i:nth-child(n)`, which made the palette impossible to
 * change per wedding and silently wrong for any count other than four. They are
 * inline styles here so `dressCode.colors` drives them; the CSS rules still
 * supply the size, border and inset shadow.
 */
export function DressCodeSection({
  data,
  side,
}: {
  data: InvitationData;
  side: "left" | "right";
}) {
  const dress = data.dressCode;
  if (!dress) return null;

  return (
    <Page className="soft-floral-paper dress-page" side={side}>
      <p className="script">Dress code</p>
      <h2>{dress.title}</h2>
      {dress.body ? <p className="intro">{dress.body}</p> : null}

      {dress.colors?.length ? (
        <div className="natural-palette" aria-label="Palette de couleurs naturelles">
          {dress.colors.map((color) => (
            <i key={color} style={{ background: color }} />
          ))}
        </div>
      ) : null}

      {dress.image ? (
        // eslint-disable-next-line @next/next/no-img-element -- deliberately
        // wider than its column (`width: min(115%, 620px)`); next/image's
        // wrapper fights that overhang.
        <img
          className="dress-group"
          src={dress.image}
          alt={`Tenues ${dress.title}`}
          loading="lazy"
        />
      ) : null}

      {dress.note ? <p className="note">{dress.note}</p> : null}
    </Page>
  );
}
