import type { CSSProperties } from "react";

import { cssString } from "../../text";
import type { ScheduleIcon } from "../../types";

/**
 * What a moment is, drawn the designer's way: an embroidered object on the left
 * of its card.
 *
 * The contract names the moment (ceremony, cocktail…), never the drawing, and
 * every theme draws its own. The objects here are cut from the designer's
 * embroidery sheet by the stylesheet; this component only says which one, in
 * `data-moment`, which the rules at the top of `responsive.css` key on. (The
 * designer chose the object by the card's position — first the church, second
 * the rings — which is only right for their own five moments in their own
 * order.) An entry that names none gets the church, the designer's drawing for
 * the guests' arrival.
 *
 * A photograph the couple attached to the moment takes the embroidery's place.
 */
export function ScheduleMedallion({ icon, image }: { icon?: ScheduleIcon; image?: string }) {
  const photo: CSSProperties | undefined = image
    ? { backgroundImage: `url(${cssString(image)})`, backgroundSize: "cover", backgroundPosition: "center" }
    : undefined;

  return <div className="agenda-medallion" data-moment={icon ?? "arrival"} style={photo} aria-hidden="true" />;
}
