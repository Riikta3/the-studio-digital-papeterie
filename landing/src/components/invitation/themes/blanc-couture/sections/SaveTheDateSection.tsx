import type { InvitationData } from "../../types";

import { CountdownClock } from "./CountdownClock";
import { Page } from "./Page";

/**
 * "Save the date" — the spelled-out date over the countdown.
 *
 * `copy.dateSpelled` carries its own line break ("Trente avril / Deux mille
 * vingt-sept") because the source set the two lines as a deliberate typographic
 * pair; splitting on the newline keeps that under the couple's control rather
 * than hard-coding where the line falls.
 */
export function SaveTheDateSection({
  data,
  side,
}: {
  data: InvitationData;
  side: "left" | "right";
}) {
  const lines = (data.copy?.dateSpelled ?? "").split("\n").filter(Boolean);

  return (
    <Page id="details" className="soft-floral-paper save-page" side={side}>
      <p className="script save-date">SAVE THE DATE</p>
      {lines.length > 0 ? (
        <h2>
          {lines.map((line, index) => (
            <span key={line}>
              {index > 0 ? <br /> : null}
              {line}
            </span>
          ))}
        </h2>
      ) : null}
      {data.copy?.scheduleIntro ? <p className="intro">{data.copy.scheduleIntro}</p> : null}
      <CountdownClock startsAt={data.event.startsAt} />
    </Page>
  );
}
